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
  fitScore: number;
};

export type ConceptScoreBreakdown = {
  total: number;
  relevance: number;
  consistency: number;
  anchor: number;
};

export type SemanticConceptAnalysis = {
  modelId: string;
  rerankerModelId: string;
  dimensions: number;
  concept: string;
  conceptSource:
    | "explicit"
    | "fallback";
  overallScore: number;
  conceptScore: ConceptScoreBreakdown;
  sections: SemanticSectionScore[];
};

export type SemanticIdeaCandidate = {
  id: string;
  text: string;
};

export type SemanticIdeaNeighbor = {
  id: string;
  score: number;
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

function clamp01(
  value: number
) {
  return Math.max(
    0,
    Math.min(1, value)
  );
}

function normalizeEmbeddingScore(
  value: number
) {
  return clamp01(
    (value - 0.25) /
      0.55
  );
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
        activeLyrics(
          section
        ).trim().length > 0
    );

  if (!sections.length) {
    throw new Error(
      "Add lyrics to at least one section before running semantic analysis."
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
      (section, index) => {
        const embeddingScore =
          cosineSimilarity(
            conceptVector,
            vectors[index + 1]
          );

        const rerankerScore =
          reranked[index].score;

        const fitScore =
          0.65 *
            normalizeEmbeddingScore(
              embeddingScore
            ) +
          0.35 *
            rerankerScore;

        return {
          sectionId:
            section.id,
          title:
            section.title,
          embeddingScore,
          rerankerScore,
          rerankerLogit:
            reranked[index].logit,
          fitScore:
            Math.round(
              fitScore * 100
            ),
        };
      }
    );

  const overallScore =
    scored.reduce(
      (sum, item) =>
        sum +
        item.rerankerScore,
      0
    ) / scored.length;

  const sectionFits =
    scored.map(
      (item) =>
        item.fitScore /
        100
    );

  const relevance =
    sectionFits.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    sectionFits.length;

  const pairwiseSimilarities:
    number[] = [];

  for (
    let leftIndex = 1;
    leftIndex < vectors.length;
    leftIndex += 1
  ) {
    for (
      let rightIndex =
        leftIndex + 1;
      rightIndex <
      vectors.length;
      rightIndex += 1
    ) {
      pairwiseSimilarities.push(
        normalizeEmbeddingScore(
          cosineSimilarity(
            vectors[leftIndex],
            vectors[rightIndex]
          )
        )
      );
    }
  }

  const consistency =
    pairwiseSimilarities.length
      ? pairwiseSimilarities.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        pairwiseSimilarities.length
      : relevance;

  const anchorSectionIds =
    new Set(
      sections
        .filter(
          (section) =>
            section.type ===
              "chorus" ||
            section.type ===
              "hook"
        )
        .map(
          (section) =>
            section.id
        )
    );

  const anchorFits =
    scored
      .map(
        (item, index) => ({
          sectionId:
            item.sectionId,
          fit:
            sectionFits[index],
        })
      )
      .filter(
        (item) =>
          anchorSectionIds.has(
            item.sectionId
          )
      )
      .map(
        (item) =>
          item.fit
      );

  const anchor =
    anchorFits.length
      ? anchorFits.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        anchorFits.length
      : Math.max(
          ...sectionFits
        );

  const conceptScore = {
    relevance:
      Math.round(
        relevance * 100
      ),
    consistency:
      Math.round(
        consistency * 100
      ),
    anchor:
      Math.round(
        anchor * 100
      ),
    total:
      Math.round(
        (
          0.5 * relevance +
          0.25 * consistency +
          0.25 * anchor
        ) * 100
      ),
  };

  return {
    modelId:
      LOCAL_SEMANTIC_MODEL_ID,
    rerankerModelId:
      LOCAL_RERANKER_MODEL_ID,
    dimensions: 384,
    concept,
    conceptSource:
      song.concept?.trim()
        ? "explicit"
        : "fallback",
    overallScore,
    conceptScore,
    sections: scored.sort(
      (left, right) =>
        right.rerankerLogit -
        left.rerankerLogit
    ),
  };
}


export async function findRelatedIdeas(
  queryText: string,
  candidates: SemanticIdeaCandidate[],
  limit = 6
): Promise<SemanticIdeaNeighbor[]> {
  const query =
    queryText.trim();

  if (
    !query ||
    candidates.length === 0
  ) {
    return [];
  }

  const filtered =
    candidates.filter(
      (candidate) =>
        candidate.text.trim()
    );

  if (!filtered.length) {
    return [];
  }

  const vectors =
    await embedTexts([
      query,
      ...filtered.map(
        (candidate) =>
          candidate.text.trim()
      ),
    ]);

  const queryVector =
    vectors[0];

  return filtered
    .map(
      (candidate, index) => ({
        id: candidate.id,
        score:
          cosineSimilarity(
            queryVector,
            vectors[
              index + 1
            ]
          ),
      })
    )
    .sort(
      (left, right) =>
        right.score -
        left.score
    )
    .slice(
      0,
      Math.max(
        1,
        limit
      )
    );
}
