import type {
  Song,
  SongVersionSnapshot,
  VersionComparison,
  VersionScoreSummary,
  VersionLineDiff,
  VersionSnapshotSource,
} from "../types";

import {
  analyzeLyrics,
} from "../analysis/lyricsAnalysis";

const STORAGE_PREFIX =
  "songwriter-version-history:";

function storageKey(
  songId: string
) {
  return (
    STORAGE_PREFIX +
    songId
  );
}

function cloneSong(
  song: Song
): Song {
  return JSON.parse(
    JSON.stringify(song)
  ) as Song;
}

function activeLyrics(
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

function lineSet(
  lyrics: string
) {
  return lyrics
    .split(/\r?\n/)
    .map(
      (line) =>
        line.trim()
    )
    .filter(Boolean);
}

export function buildLineDiff(
  before: string[],
  after: string[]
): VersionLineDiff[] {
  const rows =
    before.length + 1;
  const columns =
    after.length + 1;

  const table =
    Array.from(
      { length: rows },
      () =>
        Array<number>(
          columns
        ).fill(0)
    );

  for (
    let beforeIndex =
      before.length - 1;
    beforeIndex >= 0;
    beforeIndex -= 1
  ) {
    for (
      let afterIndex =
        after.length - 1;
      afterIndex >= 0;
      afterIndex -= 1
    ) {
      table[beforeIndex][afterIndex] =
        before[beforeIndex] ===
        after[afterIndex]
          ? table[
              beforeIndex + 1
            ][
              afterIndex + 1
            ] + 1
          : Math.max(
              table[
                beforeIndex + 1
              ][afterIndex],
              table[beforeIndex][
                afterIndex + 1
              ]
            );
    }
  }

  const diff:
    VersionLineDiff[] = [];

  let beforeIndex = 0;
  let afterIndex = 0;

  while (
    beforeIndex <
      before.length ||
    afterIndex <
      after.length
  ) {
    if (
      beforeIndex <
        before.length &&
      afterIndex <
        after.length &&
      before[beforeIndex] ===
        after[afterIndex]
    ) {
      diff.push({
        kind: "same",
        text:
          before[beforeIndex],
        beforeLine:
          beforeIndex + 1,
        afterLine:
          afterIndex + 1,
      });

      beforeIndex += 1;
      afterIndex += 1;
      continue;
    }

    const canAdd =
      afterIndex <
      after.length;

    const canRemove =
      beforeIndex <
      before.length;

    const addScore =
      canAdd
        ? table[
            beforeIndex
          ][
            afterIndex + 1
          ]
        : -1;

    const removeScore =
      canRemove
        ? table[
            beforeIndex + 1
          ][afterIndex]
        : -1;

    if (
      canAdd &&
      addScore >=
        removeScore
    ) {
      diff.push({
        kind: "added",
        text:
          after[afterIndex],
        beforeLine: null,
        afterLine:
          afterIndex + 1,
      });

      afterIndex += 1;
      continue;
    }

    if (canRemove) {
      diff.push({
        kind:
          "removed",
        text:
          before[beforeIndex],
        beforeLine:
          beforeIndex + 1,
        afterLine: null,
      });

      beforeIndex += 1;
    }
  }

  return diff;
}

function multisetDifferenceCount(
  left: string[],
  right: string[]
) {
  const counts =
    new Map<string, number>();

  for (const item of right) {
    counts.set(
      item,
      (
        counts.get(item) ??
        0
      ) + 1
    );
  }

  let count = 0;

  for (const item of left) {
    const available =
      counts.get(item) ??
      0;

    if (available > 0) {
      counts.set(
        item,
        available - 1
      );
    } else {
      count += 1;
    }
  }

  return count;
}

export function buildCraftSummary(
  song: Song,
  conceptScore:
    | number
    | null = null
): VersionScoreSummary {
  const analyses =
    song.sections
      .map(
        (section) => {
          const lyrics =
            activeLyrics(
              song,
              section.id
            );

          return {
            lyrics,
            analysis:
              analyzeLyrics(
                lyrics
              ),
          };
        }
      )
      .filter(
        (item) =>
          item.analysis
            .lineCount > 0
      );

  const average = (
    values: number[]
  ) =>
    values.length
      ? Math.round(
          values.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,
            0
          ) /
            values.length
        )
      : 0;

  const allLyrics =
    analyses
      .map(
        (item) =>
          item.lyrics
      )
      .join("\n");

  const words =
    allLyrics
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  return {
    conceptScore,
    rhymeScore:
      average(
        analyses.map(
          (item) =>
            item.analysis
              .rhymeScore
              .total
        )
      ),
    meterScore:
      average(
        analyses.map(
          (item) =>
            item.analysis
              .consistencyScore
        )
      ),
    lineCount:
      analyses.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.analysis
            .lineCount,
        0
      ),
    wordCount:
      words.length,
  };
}

export function loadVersionHistory(
  songId: string
): SongVersionSnapshot[] {
  try {
    const raw =
      localStorage.getItem(
        storageKey(
          songId
        )
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(
        parsed
      )
    ) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          item &&
          typeof item ===
            "object" &&
          typeof item.id ===
            "string" &&
          typeof item.name ===
            "string" &&
          item.song &&
          item.scores
      )
      .sort(
        (
          left,
          right
        ) =>
          right.createdAt.localeCompare(
            left.createdAt
          )
      );
  } catch (error) {
    console.warn(
      "Unable to load version history.",
      error
    );

    return [];
  }
}

function persistVersionHistory(
  songId: string,
  snapshots:
    SongVersionSnapshot[]
) {
  localStorage.setItem(
    storageKey(
      songId
    ),
    JSON.stringify(
      snapshots
    )
  );
}

export function saveVersionSnapshot(
  song: Song,
  name: string,
  scores:
    VersionScoreSummary,
  options?: {
    note?: string;
    source?: VersionSnapshotSource;
  }
): SongVersionSnapshot[] {
  const existing =
    loadVersionHistory(
      song.id
    );

  const snapshot:
    SongVersionSnapshot = {
      id:
        crypto.randomUUID(),
      name:
        name.trim() ||
        "Snapshot",
      note:
        options?.note?.trim() ||
        undefined,
      source:
        options?.source ??
        "manual",
      createdAt:
        new Date().toISOString(),
      songId:
        song.id,
      song:
        cloneSong(song),
      scores,
    };

  const next = [
    snapshot,
    ...existing,
  ].slice(0, 50);

  persistVersionHistory(
    song.id,
    next
  );

  return next;
}

export function saveSafetySnapshot(
  song: Song,
  name: string,
  note?: string
): SongVersionSnapshot[] {
  return saveVersionSnapshot(
    song,
    name,
    buildCraftSummary(
      song,
      null
    ),
    {
      note,
      source:
        "safety",
    }
  );
}

export function deleteVersionSnapshot(
  songId: string,
  snapshotId: string
) {
  const next =
    loadVersionHistory(
      songId
    ).filter(
      (snapshot) =>
        snapshot.id !==
        snapshotId
    );

  persistVersionHistory(
    songId,
    next
  );

  return next;
}

export function restoreVersionSnapshot(
  snapshot:
    SongVersionSnapshot
): Song {
  return cloneSong(
    snapshot.song
  );
}

export function compareSongVersions(
  previous: Song,
  current: Song
): VersionComparison {
  const previousById =
    new Map(
      previous.sections.map(
        (section) => [
          section.id,
          section,
        ]
      )
    );

  const currentById =
    new Map(
      current.sections.map(
        (section) => [
          section.id,
          section,
        ]
      )
    );

  const allIds =
    Array.from(
      new Set([
        ...previousById.keys(),
        ...currentById.keys(),
      ])
    );

  const sections =
    allIds.map(
      (sectionId) => {
        const before =
          previousById.get(
            sectionId
          );
        const after =
          currentById.get(
            sectionId
          );

        if (!before) {
          return {
            sectionId,
            title:
              after?.title ??
              "Section",
            status:
              "added" as const,
            addedLines:
              lineSet(
                activeLyrics(
                  current,
                  sectionId
                )
              ).length,
            removedLines: 0,
            lineDiff:
              buildLineDiff(
                [],
                lineSet(
                  activeLyrics(
                    current,
                    sectionId
                  )
                )
              ),
          };
        }

        if (!after) {
          return {
            sectionId,
            title:
              before.title,
            status:
              "removed" as const,
            addedLines: 0,
            removedLines:
              lineSet(
                activeLyrics(
                  previous,
                  sectionId
                )
              ).length,
            lineDiff:
              buildLineDiff(
                lineSet(
                  activeLyrics(
                    previous,
                    sectionId
                  )
                ),
                []
              ),
          };
        }

        const beforeLines =
          lineSet(
            activeLyrics(
              previous,
              sectionId
            )
          );

        const afterLines =
          lineSet(
            activeLyrics(
              current,
              sectionId
            )
          );

        const addedLines =
          multisetDifferenceCount(
            afterLines,
            beforeLines
          );

        const removedLines =
          multisetDifferenceCount(
            beforeLines,
            afterLines
          );

        const lineDiff =
          buildLineDiff(
            beforeLines,
            afterLines
          );

        const changed =
          before.title !==
            after.title ||
          before.type !==
            after.type ||
          addedLines > 0 ||
          removedLines > 0;

        return {
          sectionId,
          title:
            after.title,
          status:
            changed
              ? "changed"
              : "unchanged",
          addedLines,
          removedLines,
          lineDiff,
        } as const;
      }
    );

  const previousArrangement =
    previous.arrangements[0]
      ?.sequence.map(
        (item) =>
          item.sectionId
      ) ?? [];

  const currentArrangement =
    current.arrangements[0]
      ?.sequence.map(
        (item) =>
          item.sectionId
      ) ?? [];

  return {
    changedSectionCount:
      sections.filter(
        (item) =>
          item.status ===
          "changed"
      ).length,
    addedSectionCount:
      sections.filter(
        (item) =>
          item.status ===
          "added"
      ).length,
    removedSectionCount:
      sections.filter(
        (item) =>
          item.status ===
          "removed"
      ).length,
    arrangementChanged:
      JSON.stringify(
        previousArrangement
      ) !==
      JSON.stringify(
        currentArrangement
      ),
    conceptChanged:
      (
        previous.concept ??
        ""
      ) !==
      (
        current.concept ??
        ""
      ),
    titleChanged:
      previous.title !==
      current.title,
    sections,
  };
}


export function restoreSectionFromSnapshot(
  current: Song,
  snapshot:
    SongVersionSnapshot,
  sectionId: string
): Song {
  const snapshotSection =
    snapshot.song.sections.find(
      (section) =>
        section.id ===
        sectionId
    );

  if (!snapshotSection) {
    return current;
  }

  const clonedSection =
    JSON.parse(
      JSON.stringify(
        snapshotSection
      )
    );

  const existingIndex =
    current.sections.findIndex(
      (section) =>
        section.id ===
        sectionId
    );

  const sections =
    existingIndex >= 0
      ? current.sections.map(
          (section) =>
            section.id ===
            sectionId
              ? clonedSection
              : section
        )
      : [
          ...current.sections,
          clonedSection,
        ];

  return {
    ...current,
    sections,
    updatedAt:
      new Date().toISOString(),
  };
}
