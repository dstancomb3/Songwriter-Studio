import {
  countWordSyllables,
  scoreRhymeWords,
  type RhymeStrength,
} from "../analysis/lyricsAnalysis";

import {
  getPronunciation,
  getPronunciationVocabulary,
} from "./pronunciationLexicon";

export type RhymeKind =
  | "exact"
  | "near"
  | "slant"
  | "repeat";

export type RhymeSource =
  | "pronunciation"
  | "heuristic";

export type RhymeSuggestion = {
  word: string;
  kind: RhymeKind;
  strength: RhymeStrength;
  score: number;
  syllables: number;
  source: RhymeSource;
  usedInSong: boolean;
  occurrenceCount: number;
};

function cleanWord(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /['’]/g,
      ""
    )
    .replace(
      /[^a-z]/g,
      ""
    );
}

function classifyPronunciation(
  leftWord: string,
  rightWord: string
) {
  const left =
    getPronunciation(
      leftWord
    );
  const right =
    getPronunciation(
      rightWord
    );

  if (
    !left ||
    !right
  ) {
    return null;
  }

  if (
    left.word ===
    right.word
  ) {
    return {
      score: 0.38,
      kind:
        "repeat" as const,
      strength:
        "repeat" as const,
    };
  }

  if (
    left.rhyme ===
    right.rhyme
  ) {
    return {
      score: 1,
      kind:
        "exact" as const,
      strength:
        "strong" as const,
    };
  }

  if (
    left.vowel ===
    right.vowel
  ) {
    const codaOverlap =
      left.coda &&
      right.coda &&
      (
        left.coda.endsWith(
          right.coda
        ) ||
        right.coda.endsWith(
          left.coda
        )
      );

    return {
      score:
        codaOverlap
          ? 0.78
          : 0.66,
      kind:
        "near" as const,
      strength:
        "slant" as const,
    };
  }

  return {
    score: 0,
    kind:
      "slant" as const,
    strength:
      "none" as const,
  };
}

function occurrenceMap(
  vocabulary: string[]
) {
  const counts =
    new Map<
      string,
      number
    >();

  for (
    const rawWord
    of vocabulary
  ) {
    const word =
      cleanWord(
        rawWord
      );

    if (!word) {
      continue;
    }

    counts.set(
      word,
      (
        counts.get(
          word
        ) ?? 0
      ) + 1
    );
  }

  return counts;
}

export function compareRhymeWords(
  leftWord: string,
  rightWord: string
) {
  const pronunciation =
    classifyPronunciation(
      leftWord,
      rightWord
    );

  if (
    pronunciation &&
    pronunciation.score >
      0
  ) {
    return {
      ...pronunciation,
      source:
        "pronunciation" as const,
    };
  }

  const heuristic =
    scoreRhymeWords(
      leftWord,
      rightWord
    );

  return {
    score:
      heuristic.score,
    kind:
      heuristic.strength ===
      "repeat"
        ? "repeat" as const
        : heuristic.strength ===
          "strong"
        ? "exact" as const
        : "slant" as const,
    strength:
      heuristic.strength,
    source:
      "heuristic" as const,
  };
}

export function findRhymes(
  targetWord: string,
  options?: {
    candidates?: string[];
    songVocabulary?: string[];
    limit?: number;
  }
): RhymeSuggestion[] {
  const target =
    cleanWord(
      targetWord
    );

  if (!target) {
    return [];
  }

  const songVocabulary =
    options?.songVocabulary ??
    [];

  const counts =
    occurrenceMap(
      songVocabulary
    );

  const candidates =
    options?.candidates
      ? options.candidates
      : getPronunciationVocabulary()
          .map(
            (entry) =>
              entry.word
          );

  const unique =
    Array.from(
      new Set(
        candidates
          .map(
            cleanWord
          )
          .filter(Boolean)
      )
    );

  return unique
    .filter(
      (word) =>
        word !== target
    )
    .map(
      (word) => {
        const match =
          compareRhymeWords(
            target,
            word
          );

        const pronunciation =
          getPronunciation(
            word
          );

        return {
          word,
          kind:
            match.kind,
          strength:
            match.strength,
          score:
            match.score,
          syllables:
            pronunciation
              ?.syllables ??
            countWordSyllables(
              word
            ),
          source:
            match.source,
          usedInSong:
            counts.has(
              word
            ),
          occurrenceCount:
            counts.get(
              word
            ) ?? 0,
        };
      }
    )
    .filter(
      (item) =>
        item.score >=
        0.55
    )
    .sort(
      (
        left,
        right
      ) =>
        right.score -
          left.score ||
        Number(
          right.source ===
            "pronunciation"
        ) -
          Number(
            left.source ===
              "pronunciation"
          ) ||
        left.syllables -
          right.syllables ||
        left.word.localeCompare(
          right.word
        )
    )
    .slice(
      0,
      Math.max(
        1,
        options?.limit ??
          24
      )
    );
}
