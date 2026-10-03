import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
  env,
  pipeline,
} from "@huggingface/transformers";

import type {
  Section,
  Song,
} from "../types";

export const LOCAL_SEMANTIC_MODEL_ID =
  "onnx-community/bge-small-en-v1.5-ONNX";

export const LOCAL_RERANKER_MODEL_ID =
  "Xenova/ms-marco-MiniLM-L-6-v2";

export const LOCAL_SEMANTIC_RUNTIME =
  "Transformers.js / ONNX Runtime Web / WASM";

type FeatureExtractor = (
  inputs: string | string[],
  options?: {
    pooling?: string;
    normalize?: boolean;
  }
) => Promise<{
  tolist: () => unknown;
}>;

export type SemanticSectionScore = {
  sectionId: string;
  title: string;
  embeddingScore: number;
  rerankerScore: number;
  rerankerLogit: number;
};

export type SemanticConceptAnalysis = {
  modelId: string;
  rerankerModelId: string;
  dimensions: number;
  concept: string;
  overallScore: number;
  sections: SemanticSectionScore[];
};

let extractorPromise:
  | Promise<FeatureExtractor>
  | null = null;

let rerankerTokenizerPromise:
  | Promise<any>
  | null = null;

let rerankerModelPromise:
  | Promise<any>
  | null = null;

const wasmBackend =
  env.backends.onnx.wasm as
    | { numThreads: number }
    | undefined;

if (wasmBackend) {
  wasmBackend.numThreads = 1;
}

function getExtractor():
  Promise<FeatureExtractor> {
  if (!extractorPromise) {
    extractorPromise = pipeline(
      "feature-extraction",
      LOCAL_SEMANTIC_MODEL_ID,
      {
        device: "wasm",
        dtype: "q8",
      }
    ) as unknown as Promise<FeatureExtractor>;
  }

  return extractorPromise;
}

function getRerankerTokenizer() {
  if (!rerankerTokenizerPromise) {
    rerankerTokenizerPromise =
      AutoTokenizer.from_pretrained(
        LOCAL_RERANKER_MODEL_ID
      );
  }

  return rerankerTokenizerPromise;
}

function getRerankerModel() {
  if (!rerankerModelPromise) {
    rerankerModelPromise =
      AutoModelForSequenceClassification.from_pretrained(
        LOCAL_RERANKER_MODEL_ID,
        {
          device: "wasm",
          dtype: "q8",
        }
      );
  }

  return rerankerModelPromise;
}

function sigmoid(value: number) {
  if (value >= 0) {
    const z = Math.exp(-value);
    return 1 / (1 + z);
  }

  const z = Math.exp(value);
  return z / (1 + z);
}

function cosineSimilarity(
  left: number[],
  right: number[]
) {
  if (
    left.length !== right.length ||
    !left.length
  ) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {
    const a = left[index];
    const b = right[index];

    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  if (!leftNorm || !rightNorm) {
    return 0;
  }

  return (
    dot /
    (Math.sqrt(leftNorm) *
      Math.sqrt(rightNorm))
  );
}

async function embedTexts(
  texts: string[]
): Promise<number[][]> {
  if (!texts.length) {
    return [];
  }

  const extractor =
    await getExtractor();

  const output = await extractor(
    texts,
    {
      pooling: "cls",
      normalize: true,
    }
  );

  const rows =
    output.tolist() as number[][];

  if (
    rows.length !== texts.length ||
    rows.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== 384
    )
  ) {
    throw new Error(
      "The local embedding model returned an unexpected vector shape."
    );
  }

  return rows;
}

function activeLyrics(
  section: Section
): string {
  return (
    section.versions.find(
      (version) =>
        version.id ===
        section.activeVersionId
    )?.lyrics ?? ""
  );
}

export function canonicalizeSection(
  section: Section
) {
  const lyrics =
    activeLyrics(section).trim();

  return [
    `Section: ${section.title}`,
    `Type: ${section.type}`,
    lyrics
      ? `Lyrics:\n${lyrics}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function canonicalizeSongConcept(
  song: Song
) {
  const explicitConcept =
    song.concept?.trim();

  if (explicitConcept) {
    return explicitConcept;
  }

  const fallback = [
    song.title.trim()
      ? `Title: ${song.title.trim()}`
      : "",
    song.notes.trim()
      ? `Notes: ${song.notes.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return fallback;
}

async function rerankSections(
  concept: string,
  sections: Section[]
) {
  const [
    tokenizer,
    model,
  ] = await Promise.all([
    getRerankerTokenizer(),
    getRerankerModel(),
  ]);

  const texts =
    sections.map(
      canonicalizeSection
    );

  const features = tokenizer(
    Array(texts.length).fill(
      concept
    ),
    {
      text_pair: texts,
      padding: true,
      truncation: true,
    }
  );

  const output =
    await model(features);

  const source =
    output?.logits?.data ??
    output?.logits ??
    output?.data ??
    output;

  const logits = Array.from(
    source as Iterable<number>
  ).map(Number);

  if (
    logits.length !==
    sections.length
  ) {
    throw new Error(
      `The local reranker returned ${logits.length} scores for ${sections.length} sections.`
    );
  }

  return logits.map(
    (logit) => ({
      logit,
      score: sigmoid(logit),
    })
  );
}

export async function analyzeSongConcept(
  song: Song
): Promise<SemanticConceptAnalysis> {
  const concept =
    canonicalizeSongConcept(song);

  if (!concept.trim()) {
    throw new Error(
      "Add a song concept or notes before running semantic analysis."
    );
  }

  const sections =
    song.sections.filter(
      (section) =>
        canonicalizeSection(
          section
        ).trim().length > 0
    );

  if (!sections.length) {
    throw new Error(
      "Add at least one section before running semantic analysis."
    );
  }

  const texts = [
    concept,
    ...sections.map(
      canonicalizeSection
    ),
  ];

  const vectors =
    await embedTexts(texts);

  const conceptVector =
    vectors[0];

  const reranked =
    await rerankSections(
      concept,
      sections
    );

  const scored =
    sections.map(
      (section, index) => ({
        sectionId:
          section.id,
        title:
          section.title,
        embeddingScore:
          cosineSimilarity(
            conceptVector,
            vectors[index + 1]
          ),
        rerankerScore:
          reranked[index].score,
        rerankerLogit:
          reranked[index].logit,
      })
    );

  const overallScore =
    scored.reduce(
      (sum, item) =>
        sum +
        item.rerankerScore,
      0
    ) / scored.length;

  return {
    modelId:
      LOCAL_SEMANTIC_MODEL_ID,
    rerankerModelId:
      LOCAL_RERANKER_MODEL_ID,
    dimensions: 384,
    concept,
    overallScore,
    sections: scored.sort(
      (left, right) =>
        right.rerankerLogit -
        left.rerankerLogit
    ),
  };
}
