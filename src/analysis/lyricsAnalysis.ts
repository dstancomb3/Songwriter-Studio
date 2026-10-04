export type RhymeStrength =
  | "none"
  | "repeat"
  | "slant"
  | "strong";

export type LyricLineAnalysis = {
  text: string;
  syllables: number;
  syllableDelta: number;
  meterStatus:
    | "short"
    | "balanced"
    | "long";
  endWord: string;
  rhymeKey: string;
  rhymeLabel: string;
  rhymeStrength: RhymeStrength;
};

export type RhymeScoreBreakdown = {
  total: number;
  coverage: number;
  pattern: number;
  quality: number;
};

export type SectionLyricAnalysis = {
  lineCount: number;
  averageSyllables: number;
  syllableSpread: number;
  consistencyScore: number;
  targetSyllables: number;
  rhymeScheme: string;
  rhymeCoverage: number;
  rhymeScore: RhymeScoreBreakdown;
  repeatedEndWords: string[];
  observations: string[];
  lines: LyricLineAnalysis[];
};

const irregularSyllables:
  Record<string, number> = {
    every: 2,
    even: 2,
    devil: 2,
    heaven: 2,
    business: 2,
    family: 3,
    different: 3,
    chocolate: 3,
    camera: 3,
    fire: 1,
    hour: 1,
    our: 1,
    poem: 2,
    quiet: 2,
    science: 2,
    people: 2,
    bargain: 2,
    doesnt: 2,
    wanna: 2,
    gonna: 2,
  };

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
) {
  return Math.max(
    minimum,
    Math.min(
      maximum,
      value
    )
  );
}

function cleanWord(
  value: string
) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z]/g, "");
}

export function countWordSyllables(
  value: string
): number {
  const word =
    cleanWord(value);

  if (!word) {
    return 0;
  }

  if (
    irregularSyllables[word]
  ) {
    return (
      irregularSyllables[
        word
      ]
    );
  }

  if (word.length <= 3) {
    return 1;
  }

  let normalized =
    word;

  normalized = normalized
    .replace(
      /(?:[^laeiouy]es|ed|[^laeiouy]e)$/i,
      ""
    )
    .replace(/^y/, "");

  const groups =
    normalized.match(
      /[aeiouy]+/g
    );

  let count =
    groups?.length ?? 1;

  if (
    /(?:ia|io|eo|ua|iu)/.test(
      normalized
    )
  ) {
    count += 1;
  }

  return Math.max(
    1,
    count
  );
}

export function countLineSyllables(
  line: string
): number {
  return line
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce(
      (sum, word) =>
        sum +
        countWordSyllables(
          word
        ),
      0
    );
}

function extractEndWord(
  line: string
) {
  const words =
    line
      .trim()
      .split(/\s+/)
      .map(cleanWord)
      .filter(Boolean);

  return (
    words[
      words.length - 1
    ] ?? ""
  );
}

function endingParts(
  word: string
) {
  const cleaned =
    cleanWord(word);

  if (!cleaned) {
    return {
      strong: "",
      vowel: "",
      tail: "",
    };
  }

  const strongMatch =
    cleaned.match(
      /[aeiouy]+[^aeiouy]*$/
    );

  const strong =
    strongMatch?.[0] ??
    cleaned.slice(-3);

  const vowelMatch =
    strong.match(
      /^[aeiouy]+/
    );

  const vowel =
    vowelMatch?.[0] ??
    "";

  const tail =
    strong.slice(
      vowel.length
    );

  return {
    strong,
    vowel,
    tail,
  };
}

function rhymeSimilarity(
  leftWord: string,
  rightWord: string
): {
  score: number;
  strength: RhymeStrength;
} {
  const left =
    cleanWord(leftWord);
  const right =
    cleanWord(rightWord);

  if (
    !left ||
    !right
  ) {
    return {
      score: 0,
      strength: "none",
    };
  }

  if (left === right) {
    return {
      score: 0.38,
      strength: "repeat",
    };
  }

  const leftParts =
    endingParts(left);
  const rightParts =
    endingParts(right);

  if (
    leftParts.strong ===
    rightParts.strong
  ) {
    return {
      score: 1,
      strength: "strong",
    };
  }

  const sameTail =
    Boolean(
      leftParts.tail &&
      leftParts.tail ===
        rightParts.tail
    );

  const sameVowel =
    Boolean(
      leftParts.vowel &&
      leftParts.vowel ===
        rightParts.vowel
    );

  const lastTwoMatch =
    left.slice(-2) ===
    right.slice(-2);

  if (
    sameTail &&
    sameVowel
  ) {
    return {
      score: 0.9,
      strength: "strong",
    };
  }

  if (
    sameVowel &&
    (
      sameTail ||
      lastTwoMatch
    )
  ) {
    return {
      score: 0.72,
      strength: "slant",
    };
  }

  if (
    sameVowel ||
    lastTwoMatch
  ) {
    return {
      score: 0.55,
      strength: "slant",
    };
  }

  return {
    score: 0,
    strength: "none",
  };
}

function assignRhymeGroups(
  words: string[]
) {
  const groups:
    Array<{
      representative: string;
      label: string;
    }> = [];

  let nextCode =
    "A".charCodeAt(0);

  return words.map(
    (word) => {
      if (!word) {
        return {
          label: "-",
          strength:
            "none" as RhymeStrength,
          key: "",
        };
      }

      let bestGroup:
        | {
            representative: string;
            label: string;
          }
        | undefined;

      let bestScore = 0;
      let bestStrength:
        RhymeStrength =
          "none";

      for (
        const group
        of groups
      ) {
        const match =
          rhymeSimilarity(
            word,
            group.representative
          );

        if (
          match.score >
          bestScore
        ) {
          bestScore =
            match.score;
          bestStrength =
            match.strength;
          bestGroup =
            group;
        }
      }

      if (
        bestGroup &&
        bestScore >= 0.55
      ) {
        return {
          label:
            bestGroup.label,
          strength:
            bestStrength,
          key:
            endingParts(
              bestGroup.representative
            ).strong,
        };
      }

      const label =
        String.fromCharCode(
          nextCode
        );

      nextCode += 1;

      groups.push({
        representative:
          word,
        label,
      });

      return {
        label,
        strength:
          "none" as RhymeStrength,
        key:
          endingParts(
            word
          ).strong,
      };
    }
  );
}

function standardDeviation(
  values: number[]
) {
  if (
    values.length <= 1
  ) {
    return 0;
  }

  const average =
    values.reduce(
      (
        sum,
        value
      ) =>
        sum +
        value,
      0
    ) /
    values.length;

  const variance =
    values.reduce(
      (
        sum,
        value
      ) =>
        sum +
        Math.pow(
          value -
            average,
          2
        ),
      0
    ) /
    values.length;

  return Math.sqrt(
    variance
  );
}

function buildObservations(
  details: Omit<
    SectionLyricAnalysis,
    "observations"
  >
): string[] {
  const observations:
    string[] = [];

  if (
    details.lineCount < 2
  ) {
    observations.push(
      "Add another line to make rhyme and meter patterns meaningful."
    );

    return observations;
  }

  if (
    details.consistencyScore >=
    82
  ) {
    observations.push(
      "Line lengths are tightly grouped around the section's syllable center."
    );
  } else if (
    details.consistencyScore <
    58
  ) {
    observations.push(
      "Line lengths vary noticeably; check whether the uneven meter is intentional."
    );
  }

  if (
    details.rhymeCoverage >=
    70
  ) {
    observations.push(
      "Most line endings participate in a recurring rhyme family."
    );
  } else if (
    details.rhymeCoverage <
    35
  ) {
    observations.push(
      "Few line endings currently connect into repeated rhyme families."
    );
  }

  if (
    details.repeatedEndWords
      .length > 0
  ) {
    const suffix =
      details
        .repeatedEndWords
        .length === 1
        ? ""
        : "s";

    observations.push(
      "Repeated end word" +
      suffix +
      ": " +
      details.repeatedEndWords.join(", ") +
      "."
    );
  }

  if (
    details.rhymeScore.quality <
      55 &&
    details.rhymeCoverage >
      40
  ) {
    observations.push(
      "The section has rhyme repetition, but several matches are repeated words or loose/slant rhymes."
    );
  }

  if (
    observations.length ===
    0
  ) {
    observations.push(
      "No strong structural outlier stands out in the current section."
    );
  }

  return observations;
}

export function analyzeLyrics(
  lyrics: string
): SectionLyricAnalysis {
  const rawLines =
    lyrics
      .split(/\r?\n/)
      .map(
        (line) =>
          line.trim()
      )
      .filter(Boolean);

  if (
    !rawLines.length
  ) {
    return {
      lineCount: 0,
      averageSyllables: 0,
      syllableSpread: 0,
      consistencyScore: 0,
      targetSyllables: 0,
      rhymeScheme: "",
      rhymeCoverage: 0,
      rhymeScore: {
        total: 0,
        coverage: 0,
        pattern: 0,
        quality: 0,
      },
      repeatedEndWords: [],
      observations: [],
      lines: [],
    };
  }

  const syllables =
    rawLines.map(
      countLineSyllables
    );

  const endWords =
    rawLines.map(
      extractEndWord
    );

  const rhymeGroups =
    assignRhymeGroups(
      endWords
    );

  const averageSyllables =
    syllables.reduce(
      (
        sum,
        value
      ) =>
        sum +
        value,
      0
    ) /
    syllables.length;

  const targetSyllables =
    Math.max(
      1,
      Math.round(
        averageSyllables
      )
    );

  const spread =
    standardDeviation(
      syllables
    );

  const consistencyScore =
    Math.round(
      clamp(
        100 -
          spread * 17
      )
    );

  const labelCounts =
    new Map<
      string,
      number
    >();

  for (
    const item
    of rhymeGroups
  ) {
    if (
      item.label === "-"
    ) {
      continue;
    }

    labelCounts.set(
      item.label,
      (
        labelCounts.get(
          item.label
        ) ?? 0
      ) + 1
    );
  }

  const participates =
    rhymeGroups.map(
      (item) =>
        item.label !== "-" &&
        (
          labelCounts.get(
            item.label
          ) ?? 0
        ) > 1
    );

  const rhymedLineCount =
    participates.filter(
      Boolean
    ).length;

  const rhymeCoverage =
    Math.round(
      (
        rhymedLineCount /
        rawLines.length
      ) * 100
    );

  const repeatedEndWords =
    Array.from(
      new Set(
        endWords.filter(
          (
            word,
            index
          ) =>
            word &&
            endWords.indexOf(
              word
            ) !== index
        )
      )
    );

  const rhymeStrengthValues =
    rhymeGroups
      .map(
        (item, index) => {
          if (
            !participates[
              index
            ]
          ) {
            return null;
          }

          const word =
            endWords[index];

          let best = 0;

          for (
            let otherIndex = 0;
            otherIndex <
            endWords.length;
            otherIndex += 1
          ) {
            if (
              otherIndex ===
                index ||
              rhymeGroups[
                otherIndex
              ].label !==
                item.label
            ) {
              continue;
            }

            best =
              Math.max(
                best,
                rhymeSimilarity(
                  word,
                  endWords[
                    otherIndex
                  ]
                ).score
              );
          }

          return best;
        }
      )
      .filter(
        (
          value
        ): value is number =>
          value !== null
      );

  const rhymeQuality =
    rhymeStrengthValues
      .length
      ? Math.round(
          (
            rhymeStrengthValues.reduce(
              (
                sum,
                value
              ) =>
                sum +
                value,
              0
            ) /
            rhymeStrengthValues.length
          ) * 100
        )
      : 0;

  const recurringGroups =
    Array.from(
      labelCounts.values()
    ).filter(
      (count) =>
        count > 1
    ).length;

  const uniqueLabels =
    labelCounts.size;

  const patternScore =
    rawLines.length <
    2
      ? 0
      : Math.round(
          clamp(
            (
              recurringGroups /
              Math.max(
                1,
                uniqueLabels
              )
            ) *
              80 +
              (
                rhymedLineCount >=
                2
                ? 20
                : 0
              )
          )
        );

  const repeatPenalty =
    Math.min(
      20,
      repeatedEndWords.length *
        7
    );

  const rhymeScore = {
    coverage:
      rhymeCoverage,
    pattern:
      patternScore,
    quality:
      Math.round(
        clamp(
          rhymeQuality -
            repeatPenalty
        )
      ),
    total:
      Math.round(
        clamp(
          0.45 *
            rhymeCoverage +
            0.3 *
              patternScore +
            0.25 *
              Math.max(
                0,
                rhymeQuality -
                  repeatPenalty
              )
        )
      ),
  };

  const baseLines =
    rawLines.map(
      (
        text,
        index
      ) => {
        const delta =
          syllables[index] -
          targetSyllables;

        return {
          text,
          syllables:
            syllables[
              index
            ],
          syllableDelta:
            delta,
          meterStatus:
            delta <= -2
              ? "short"
              : delta >= 2
              ? "long"
              : "balanced",
          endWord:
            endWords[
              index
            ],
          rhymeKey:
            rhymeGroups[
              index
            ].key,
          rhymeLabel:
            rhymeGroups[
              index
            ].label,
          rhymeStrength:
            rhymeGroups[
              index
            ].strength,
        } satisfies LyricLineAnalysis;
      }
    );

  const baseDetails:
    Omit<
      SectionLyricAnalysis,
      "observations"
    > = {
      lineCount:
        rawLines.length,
      averageSyllables,
      syllableSpread:
        spread,
      consistencyScore,
      targetSyllables,
      rhymeScheme:
        rhymeGroups
          .map(
            (item) =>
              item.label
          )
          .join(""),
      rhymeCoverage,
      rhymeScore,
      repeatedEndWords,
      lines:
        baseLines,
    };

  return {
    ...baseDetails,
    observations:
      buildObservations(
        baseDetails
      ),
  };
}
