import type {
  Song,
  SongVersionSnapshot,
  VersionComparison,
  VersionScoreSummary,
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
    VersionScoreSummary
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
