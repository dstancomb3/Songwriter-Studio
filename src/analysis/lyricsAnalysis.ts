export type LyricLineAnalysis = {
  text: string;
  syllables: number;
  endWord: string;
  rhymeKey: string;
  rhymeLabel: string;
};

export type SectionLyricAnalysis = {
  lineCount: number;
  averageSyllables: number;
  syllableSpread: number;
  consistencyScore: number;
  rhymeScheme: string;
  rhymeCoverage: number;
  lines: LyricLineAnalysis[];
};

const irregularSyllables: Record<string, number> = {
  "every": 2,
  "even": 2,
  "devil": 2,
  "heaven": 2,
  "business": 2,
  "family": 3,
  "different": 3,
  "chocolate": 3,
  "camera": 3,
  "fire": 1,
  "hour": 1,
  "our": 1,
  "poem": 2,
  "quiet": 2,
  "science": 2,
  "people": 2,
};

function cleanWord(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z]/g, "");
}

export function countWordSyllables(
  value: string
): number {
  const word = cleanWord(value);

  if (!word) {
    return 0;
  }

  if (irregularSyllables[word]) {
    return irregularSyllables[word];
  }

  if (word.length <= 3) {
    return 1;
  }

  let normalized = word;

  normalized = normalized
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/i, "")
    .replace(/^y/, "");

  const groups =
    normalized.match(/[aeiouy]{1,2}/g);

  return Math.max(
    1,
    groups?.length ?? 1
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
        countWordSyllables(word),
      0
    );
}

function extractEndWord(
  line: string
) {
  const words = line
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

function rhymeKeyForWord(
  word: string
) {
  if (!word) {
    return "";
  }

  const cleaned =
    cleanWord(word);

  if (cleaned.length <= 2) {
    return cleaned;
  }

  const vowelPattern =
    /[aeiouy]+[^aeiouy]*$/;

  const match =
    cleaned.match(
      vowelPattern
    );

  if (match?.[0]) {
    return match[0];
  }

  return cleaned.slice(-3);
}

function assignRhymeLabels(
  keys: string[]
) {
  const labelByKey =
    new Map<
      string,
      string
    >();

  let nextCode = "A".charCodeAt(0);

  return keys.map((key) => {
    if (!key) {
      return "-";
    }

    const existing =
      labelByKey.get(key);

    if (existing) {
      return existing;
    }

    const label =
      String.fromCharCode(
        nextCode
      );

    nextCode += 1;

    labelByKey.set(
      key,
      label
    );

    return label;
  });
}

function standardDeviation(
  values: number[]
) {
  if (values.length <= 1) {
    return 0;
  }

  const average =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length;

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - average,
          2
        ),
      0
    ) /
    values.length;

  return Math.sqrt(
    variance
  );
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

  if (!rawLines.length) {
    return {
      lineCount: 0,
      averageSyllables: 0,
      syllableSpread: 0,
      consistencyScore: 0,
      rhymeScheme: "",
      rhymeCoverage: 0,
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

  const rhymeKeys =
    endWords.map(
      rhymeKeyForWord
    );

  const labels =
    assignRhymeLabels(
      rhymeKeys
    );

  const keyCounts =
    new Map<
      string,
      number
    >();

  for (const key of rhymeKeys) {
    if (!key) {
      continue;
    }

    keyCounts.set(
      key,
      (keyCounts.get(key) ?? 0) + 1
    );
  }

  const rhymedLines =
    rhymeKeys.filter(
      (key) =>
        key &&
        (keyCounts.get(key) ?? 0) >
          1
    ).length;

  const averageSyllables =
    syllables.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    syllables.length;

  const spread =
    standardDeviation(
      syllables
    );

  const consistencyScore =
    Math.max(
      0,
      Math.round(
        100 -
          Math.min(
            100,
            spread * 18
          )
      )
    );

  return {
    lineCount:
      rawLines.length,
    averageSyllables:
      averageSyllables,
    syllableSpread:
      spread,
    consistencyScore,
    rhymeScheme:
      labels.join(""),
    rhymeCoverage:
      Math.round(
        (rhymedLines /
          rawLines.length) *
          100
      ),
    lines:
      rawLines.map(
        (text, index) => ({
          text,
          syllables:
            syllables[index],
          endWord:
            endWords[index],
          rhymeKey:
            rhymeKeys[index],
          rhymeLabel:
            labels[index],
        })
      ),
  };
}
