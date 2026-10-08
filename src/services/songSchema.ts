import {
  defaultSectionColors,
} from "../constants/sectionColors";

import type {
  Arrangement,
  Marker,
  MelodyData,
  Section,
  SectionType,
  SectionVersion,
  Song,
  SongIdea,
  Theme,
} from "../types";

export const CURRENT_SONG_SCHEMA_VERSION = 1;

export type SongNormalizationResult = {
  song: Song;
  fromVersion: number;
  repairs: string[];
};

const SECTION_TYPES =
  new Set<SectionType>([
    "intro",
    "verse",
    "pre-chorus",
    "chorus",
    "post-chorus",
    "bridge",
    "hook",
    "outro",
    "custom",
  ]);

const IDEA_KINDS =
  new Set<SongIdea["kind"]>([
    "hook",
    "title",
    "image",
    "emotion",
    "snippet",
    "concept",
  ]);

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function stringValue(
  value: unknown,
  fallback = ""
) {
  return typeof value ===
    "string"
    ? value
    : fallback;
}

function numberValue(
  value: unknown,
  fallback = 0
) {
  return typeof value ===
      "number" &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function booleanValue(
  value: unknown,
  fallback = false
) {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
}

function makeId(
  prefix: string
) {
  return (
    prefix +
    "-" +
    crypto.randomUUID()
  );
}

function normalizeMarkers(
  value: unknown
): Marker[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(
    (candidate) => {
      if (
        !isRecord(candidate)
      ) {
        return [];
      }

      const category =
        candidate.category;

      if (
        category !==
          "performance" &&
        category !==
          "instrument" &&
        category !==
          "production" &&
        category !==
          "arrangement"
      ) {
        return [];
      }

      return [
        {
          id:
            stringValue(
              candidate.id
            ) ||
            makeId(
              "marker"
            ),
          category,
          label:
            stringValue(
              candidate.label
            ),
          position:
            numberValue(
              candidate.position
            ),
        },
      ];
    }
  );
}

function normalizeMelody(
  value: unknown
): MelodyData {
  if (
    !isRecord(value) ||
    !Array.isArray(
      value.notes
    )
  ) {
    return {
      notes: [],
    };
  }

  return {
    notes:
      value.notes.flatMap(
        (candidate) => {
          if (
            !isRecord(
              candidate
            )
          ) {
            return [];
          }

          const pitch =
            stringValue(
              candidate.pitch
            );

          if (!pitch) {
            return [];
          }

          return [
            {
              id:
                stringValue(
                  candidate.id
                ) ||
                makeId(
                  "note"
                ),
              pitch,
              start:
                numberValue(
                  candidate.start
                ),
              duration:
                numberValue(
                  candidate.duration
                ),
              velocity:
                numberValue(
                  candidate.velocity,
                  100
                ),
            },
          ];
        }
      ),
  };
}

function normalizeVersion(
  value: unknown,
  index: number
): SectionVersion {
  const candidate =
    isRecord(value)
      ? value
      : {};

  return {
    id:
      stringValue(
        candidate.id
      ) ||
      makeId(
        "version"
      ),
    name:
      stringValue(
        candidate.name
      ) ||
      "Version " +
        (index + 1),
    lyrics:
      stringValue(
        candidate.lyrics
      ),
    chords:
      Array.isArray(
        candidate.chords
      )
        ? candidate.chords.filter(
            (
              chord
            ): chord is string =>
              typeof chord ===
              "string"
          )
        : [],
    melody:
      normalizeMelody(
        candidate.melody
      ),
    markers:
      normalizeMarkers(
        candidate.markers
      ),
    notes:
      stringValue(
        candidate.notes
      ),
  };
}

function normalizeSections(
  value: unknown,
  repairs: string[]
): Section[] {
  if (!Array.isArray(value)) {
    throw new Error(
      "This file does not contain a valid Sections list."
    );
  }

  const seenIds =
    new Set<string>();

  return value.map(
    (
      rawSection,
      sectionIndex
    ) => {
      if (
        !isRecord(
          rawSection
        )
      ) {
        throw new Error(
          "A Section contains invalid data."
        );
      }

      const id =
        stringValue(
          rawSection.id
        );

      if (!id) {
        throw new Error(
          "A Section is missing its ID."
        );
      }

      if (
        seenIds.has(id)
      ) {
        throw new Error(
          "Two Sections share the same ID. The file was left unchanged for recovery."
        );
      }

      seenIds.add(id);

      const rawType =
        rawSection.type;

      const type =
        typeof rawType ===
          "string" &&
        SECTION_TYPES.has(
          rawType as
            SectionType
        )
          ? rawType as
              SectionType
          : "custom";

      if (
        type ===
          "custom" &&
        rawType !==
          "custom"
      ) {
        repairs.push(
          "Converted an unknown Section type to Custom."
        );
      }

      let versions =
        Array.isArray(
          rawSection.versions
        )
          ? rawSection.versions.map(
              normalizeVersion
            )
          : [];

      if (
        versions.length ===
        0
      ) {
        versions = [
          normalizeVersion(
            {},
            0
          ),
        ];

        repairs.push(
          "Created a default version for " +
            (
              stringValue(
                rawSection.title
              ) ||
              "Section " +
                (
                  sectionIndex +
                  1
                )
            ) +
            "."
        );
      }

      const versionIds =
        new Set(
          versions.map(
            (version) =>
              version.id
          )
        );

      if (
        versionIds.size !==
        versions.length
      ) {
        throw new Error(
          "A Section contains duplicate version IDs. The file was left unchanged for recovery."
        );
      }

      const requestedActiveId =
        stringValue(
          rawSection.activeVersionId
        );

      const activeVersionId =
        versionIds.has(
          requestedActiveId
        )
          ? requestedActiveId
          : versions[0].id;

      if (
        activeVersionId !==
        requestedActiveId
      ) {
        repairs.push(
          "Repaired the active version for " +
            (
              stringValue(
                rawSection.title
              ) ||
              "Section " +
                (
                  sectionIndex +
                  1
                )
            ) +
            "."
        );
      }

      return {
        id,
        type,
        title:
          stringValue(
            rawSection.title
          ) ||
          "Section " +
            (
              sectionIndex +
              1
            ),
        versions,
        activeVersionId,
      };
    }
  );
}

function normalizeArrangements(
  value: unknown,
  validSectionIds:
    Set<string>,
  repairs: string[]
): Arrangement[] {
  const source =
    Array.isArray(value)
      ? value
      : [];

  const arrangements =
    source.flatMap(
      (
        rawArrangement,
        arrangementIndex
      ) => {
        if (
          !isRecord(
            rawArrangement
          )
        ) {
          return [];
        }

        const sequenceSource =
          Array.isArray(
            rawArrangement.sequence
          )
            ? rawArrangement.sequence
            : [];

        const sequence =
          sequenceSource.flatMap(
            (
              rawItem
            ) => {
              if (
                !isRecord(
                  rawItem
                )
              ) {
                repairs.push(
                  "Removed an invalid arrangement occurrence."
                );
                return [];
              }

              const sectionId =
                stringValue(
                  rawItem.sectionId
                );

              if (
                !validSectionIds.has(
                  sectionId
                )
              ) {
                repairs.push(
                  "Removed an arrangement occurrence whose Section no longer exists."
                );
                return [];
              }

              return [
                {
                  id:
                    stringValue(
                      rawItem.id
                    ) ||
                    makeId(
                      "occurrence"
                    ),
                  sectionId,
                },
              ];
            }
          );

        return [
          {
            id:
              stringValue(
                rawArrangement.id
              ) ||
              (
                arrangementIndex ===
                0
                  ? "main"
                  : makeId(
                      "arrangement"
                    )
              ),
            name:
              stringValue(
                rawArrangement.name
              ) ||
              (
                arrangementIndex ===
                0
                  ? "Main Arrangement"
                  : "Arrangement " +
                    (
                      arrangementIndex +
                      1
                    )
              ),
            sequence,
          },
        ];
      }
    );

  if (
    arrangements.length ===
    0
  ) {
    repairs.push(
      "Created a Main Arrangement."
    );

    return [
      {
        id: "main",
        name:
          "Main Arrangement",
        sequence: [],
      },
    ];
  }

  return arrangements;
}

function normalizeIdeas(
  value: unknown
): SongIdea[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(
    (rawIdea) => {
      if (
        !isRecord(
          rawIdea
        )
      ) {
        return [];
      }

      const text =
        stringValue(
          rawIdea.text
        ).trim();

      if (!text) {
        return [];
      }

      const rawKind =
        rawIdea.kind;

      const kind =
        typeof rawKind ===
          "string" &&
        IDEA_KINDS.has(
          rawKind as
            SongIdea["kind"]
        )
          ? rawKind as
              SongIdea["kind"]
          : "snippet";

      const now =
        new Date()
          .toISOString();

      return [
        {
          id:
            stringValue(
              rawIdea.id
            ) ||
            makeId(
              "idea"
            ),
          kind,
          text,
          note:
            stringValue(
              rawIdea.note
            ),
          pinned:
            booleanValue(
              rawIdea.pinned
            ),
          archived:
            booleanValue(
              rawIdea.archived
            ),
          createdAt:
            stringValue(
              rawIdea.createdAt
            ) ||
            now,
          updatedAt:
            stringValue(
              rawIdea.updatedAt
            ) ||
            now,
        },
      ];
    }
  );
}

function normalizeThemes(
  value: unknown
): Theme[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap(
    (rawTheme) => {
      if (
        !isRecord(
          rawTheme
        )
      ) {
        return [];
      }

      const name =
        stringValue(
          rawTheme.name
        ).trim();

      if (!name) {
        return [];
      }

      return [
        {
          id:
            stringValue(
              rawTheme.id
            ) ||
            makeId(
              "theme"
            ),
          name,
          keywords:
            Array.isArray(
              rawTheme.keywords
            )
              ? rawTheme.keywords.filter(
                  (
                    keyword
                  ): keyword is string =>
                    typeof keyword ===
                    "string"
                )
              : [],
        },
      ];
    }
  );
}

export function normalizeSong(
  raw: unknown
): SongNormalizationResult {
  if (!isRecord(raw)) {
    throw new Error(
      "This file is not a Songwriter Studio song."
    );
  }

  const fromVersion =
    typeof raw.schemaVersion ===
        "number" &&
      Number.isInteger(
        raw.schemaVersion
      )
      ? raw.schemaVersion
      : 0;

  if (
    fromVersion >
    CURRENT_SONG_SCHEMA_VERSION
  ) {
    throw new Error(
      "This song was created by a newer version of Songwriter Studio."
    );
  }

  if (
    !Array.isArray(
      raw.sections
    )
  ) {
    throw new Error(
      "This file does not contain Songwriter Studio Sections."
    );
  }

  const repairs:
    string[] = [];

  const sections =
    normalizeSections(
      raw.sections,
      repairs
    );

  const sectionIds =
    new Set(
      sections.map(
        (section) =>
          section.id
      )
    );

  const arrangements =
    normalizeArrangements(
      raw.arrangements,
      sectionIds,
      repairs
    );

  const now =
    new Date()
      .toISOString();

  const settings =
    isRecord(
      raw.settings
    )
      ? raw.settings
      : {};

  const sectionColors =
    isRecord(
      settings.sectionColors
    )
      ? settings.sectionColors
      : {};

  const song: Song = {
    schemaVersion:
      CURRENT_SONG_SCHEMA_VERSION,
    id:
      stringValue(
        raw.id
      ) ||
      makeId(
        "song"
      ),
    title:
      stringValue(
        raw.title
      ) ||
      "Untitled Song",
    artist:
      stringValue(
        raw.artist
      ),
    album:
      stringValue(
        raw.album
      ),
    genre:
      stringValue(
        raw.genre
      ),
    key:
      stringValue(
        raw.key
      ),
    tempo:
      numberValue(
        raw.tempo
      ),
    timeSignature:
      stringValue(
        raw.timeSignature,
        "4/4"
      ),
    notes:
      stringValue(
        raw.notes
      ),
    concept:
      stringValue(
        raw.concept
      ) ||
      undefined,
    createdAt:
      stringValue(
        raw.createdAt
      ) ||
      now,
    updatedAt:
      stringValue(
        raw.updatedAt
      ) ||
      now,
    sections,
    arrangements,
    themes:
      normalizeThemes(
        raw.themes
      ),
    ideas:
      normalizeIdeas(
        raw.ideas
      ),
    settings: {
      darkMode:
        booleanValue(
          settings.darkMode,
          true
        ),
      sectionColors: {
        ...defaultSectionColors,
        ...Object.fromEntries(
          Object.entries(
            sectionColors
          ).filter(
            (
              [, color]
            ) =>
              typeof color ===
              "string"
          )
        ),
      },
    },
  };

  if (
    fromVersion <
    CURRENT_SONG_SCHEMA_VERSION
  ) {
    repairs.unshift(
      "Migrated song schema from version " +
        fromVersion +
        " to " +
        CURRENT_SONG_SCHEMA_VERSION +
        "."
    );
  }

  return {
    song,
    fromVersion,
    repairs,
  };
}

export function migrateSong(
  raw: unknown
) {
  return normalizeSong(
    raw
  );
}
