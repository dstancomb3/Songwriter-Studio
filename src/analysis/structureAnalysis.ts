import type {
  Song,
  SectionType,
} from "../types";

export type StructureOccurrence = {
  arrangementItemId: string;
  index: number;
  sectionId: string;
  title: string;
  type: SectionType;
  lineCount: number;
  wordCount: number;
  occurrenceNumber: number;
  totalOccurrences: number;
};

export type StructureNote = {
  id: string;
  tone:
    | "info"
    | "watch"
    | "good";
  title: string;
  detail: string;
};

export type SongStructureAnalysis = {
  blockCount: number;
  uniqueUsedSections: number;
  unusedSectionCount: number;
  totalLines: number;
  totalWords: number;
  repetitionRate: number;
  chorusHookCount: number;
  longestSectionLines: number;
  shortestSectionLines: number;
  occurrences: StructureOccurrence[];
  notes: StructureNote[];
};

function getActiveLyrics(
  song: Song,
  sectionId: string
) {
  const section =
    song.sections.find(
      (item) =>
        item.id ===
        sectionId
    );

  if (!section) {
    return "";
  }

  return (
    section.versions.find(
      (version) =>
        version.id ===
        section.activeVersionId
    )?.lyrics ?? ""
  );
}

function countLines(
  lyrics: string
) {
  return lyrics
    .split(/\r?\n/)
    .map(
      (line) =>
        line.trim()
    )
    .filter(Boolean)
    .length;
}

function countWords(
  lyrics: string
) {
  return lyrics
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

export function analyzeSongStructure(
  song: Song
): SongStructureAnalysis {
  const arrangement =
    song.arrangements[0];

  const sequence =
    arrangement?.sequence ?? [];

  const occurrenceTotals =
    new Map<string, number>();

  for (
    const item
    of sequence
  ) {
    occurrenceTotals.set(
      item.sectionId,
      (
        occurrenceTotals.get(
          item.sectionId
        ) ?? 0
      ) + 1
    );
  }

  const occurrenceSeen =
    new Map<string, number>();

  const occurrences =
    sequence.flatMap(
      (
        item,
        index
      ) => {
        const section =
          song.sections.find(
            (candidate) =>
              candidate.id ===
              item.sectionId
          );

        if (!section) {
          return [];
        }

        const lyrics =
          getActiveLyrics(
            song,
            section.id
          );

        const occurrenceNumber =
          (
            occurrenceSeen.get(
              section.id
            ) ?? 0
          ) + 1;

        occurrenceSeen.set(
          section.id,
          occurrenceNumber
        );

        return [
          {
            arrangementItemId:
              item.id,
            index,
            sectionId:
              section.id,
            title:
              section.title,
            type:
              section.type,
            lineCount:
              countLines(
                lyrics
              ),
            wordCount:
              countWords(
                lyrics
              ),
            occurrenceNumber,
            totalOccurrences:
              occurrenceTotals.get(
                section.id
              ) ?? 1,
          },
        ];
      }
    );

  const usedSectionIds =
    new Set(
      occurrences.map(
        (item) =>
          item.sectionId
      )
    );

  const uniqueUsedSections =
    usedSectionIds.size;

  const unusedSectionCount =
    song.sections.filter(
      (section) =>
        !usedSectionIds.has(
          section.id
        )
    ).length;

  const totalLines =
    occurrences.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.lineCount,
      0
    );

  const totalWords =
    occurrences.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.wordCount,
      0
    );

  const repeatedBlocks =
    Math.max(
      0,
      occurrences.length -
        uniqueUsedSections
    );

  const repetitionRate =
    occurrences.length
      ? Math.round(
          (
            repeatedBlocks /
            occurrences.length
          ) *
            100
        )
      : 0;

  const chorusHookIndexes =
    occurrences
      .filter(
        (item) =>
          item.type ===
            "chorus" ||
          item.type ===
            "hook"
      )
      .map(
        (item) =>
          item.index
      );

  const nonEmptyLineCounts =
    occurrences
      .map(
        (item) =>
          item.lineCount
      )
      .filter(
        (count) =>
          count > 0
      );

  const longestSectionLines =
    nonEmptyLineCounts.length
      ? Math.max(
          ...nonEmptyLineCounts
        )
      : 0;

  const shortestSectionLines =
    nonEmptyLineCounts.length
      ? Math.min(
          ...nonEmptyLineCounts
        )
      : 0;

  const notes:
    StructureNote[] = [];

  if (
    occurrences.length ===
    0
  ) {
    notes.push({
      id:
        "empty-arrangement",
      tone:
        "watch",
      title:
        "No song structure yet",
      detail:
        "Add sections to the arrangement to begin evaluating the song's shape.",
    });
  }

  if (
    unusedSectionCount >
    0
  ) {
    notes.push({
      id:
        "unused-sections",
      tone:
        "info",
      title:
        unusedSectionCount +
        " unused section" +
        (
          unusedSectionCount ===
          1
            ? ""
            : "s"
        ),
      detail:
        "These sections exist in the library but do not currently appear in the song.",
    });
  }

  for (
    let index = 1;
    index <
    occurrences.length;
    index += 1
  ) {
    if (
      occurrences[index]
        .sectionId ===
      occurrences[index - 1]
        .sectionId
    ) {
      notes.push({
        id:
          "back-to-back-" +
          index,
        tone:
          "watch",
        title:
          "Back-to-back repeat",
        detail:
          occurrences[index]
            .title +
          " appears twice in a row. Keep it if the repetition is intentional.",
      });
    }
  }

  if (
    chorusHookIndexes.length >=
    2
  ) {
    let widestGap = 0;

    for (
      let index = 1;
      index <
      chorusHookIndexes.length;
      index += 1
    ) {
      widestGap =
        Math.max(
          widestGap,
          chorusHookIndexes[
            index
          ] -
            chorusHookIndexes[
              index - 1
            ] -
            1
        );
    }

    if (
      widestGap >= 4
    ) {
      notes.push({
        id:
          "wide-hook-gap",
        tone:
          "watch",
        title:
          "Long hook gap",
        detail:
          "There are " +
          widestGap +
          " full blocks between two chorus/hook appearances.",
      });
    } else {
      notes.push({
        id:
          "hook-spacing",
        tone:
          "good",
        title:
          "Hook spacing is compact",
        detail:
          "Chorus/hook returns are separated by no more than " +
          widestGap +
          " full block" +
          (
            widestGap === 1
              ? ""
              : "s"
          ) +
          ".",
      });
    }
  } else if (
    occurrences.length >=
      4 &&
    chorusHookIndexes.length ===
      0
  ) {
    notes.push({
      id:
        "no-hook-occurrence",
      tone:
        "info",
      title:
        "No chorus or hook block",
      detail:
        "This may be intentional, but the current arrangement has no section typed as Chorus or Hook.",
    });
  }

  if (
    longestSectionLines >
      0 &&
    shortestSectionLines >
      0 &&
    longestSectionLines >=
      shortestSectionLines *
        2.5
  ) {
    notes.push({
      id:
        "section-length-spread",
      tone:
        "watch",
      title:
        "Large section-length contrast",
      detail:
        "The longest arranged section has " +
        longestSectionLines +
        " lines while the shortest has " +
        shortestSectionLines +
        ".",
    });
  }

  if (
    occurrences.length >=
      4 &&
    notes.every(
      (note) =>
        note.tone !==
        "watch"
    )
  ) {
    notes.push({
      id:
        "no-structural-flags",
      tone:
        "good",
      title:
        "No obvious structural flags",
      detail:
        "The current arrangement has no strong deterministic outlier. This is a structure check, not a songwriting-quality judgment.",
    });
  }

  return {
    blockCount:
      occurrences.length,
    uniqueUsedSections,
    unusedSectionCount,
    totalLines,
    totalWords,
    repetitionRate,
    chorusHookCount:
      chorusHookIndexes.length,
    longestSectionLines,
    shortestSectionLines,
    occurrences,
    notes,
  };
}
