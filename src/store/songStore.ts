import { create } from "zustand";
import type {
  Song,
  Section,
  SectionType,
  SongIdeaKind,
} from "../types";

import {
  getSectionColors,
} from "../constants/sectionColors";

export type SelectedLyricLine = {
  sectionId: string;
  lineIndex: number;
  text: string;
  start: number;
  end: number;
};

interface SongStore {
  currentSong: Song | null;

  canUndo: boolean;
  canRedo: boolean;

  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  selectedSectionId: string | null;
  selectedLyricLine: SelectedLyricLine | null;
  selectedArrangementId: string | null;

  previewInsertIndex: number | null;

  setCurrentSong: (song: Song) => void;

  setSelectedSection: (
    id: string | null
  ) => void;

  setSelectedLyricLine: (
    selection: SelectedLyricLine | null
  ) => void;

  setSelectedArrangement: (
    id: string | null
  ) => void;

  setPreviewInsertIndex: (
    index: number | null
  ) => void;

  updateLyrics: (
    sectionId: string,
    lyrics: string
  ) => void;

  updateSongMetadata: (
    metadata: Partial<
      Pick<
        Song,
        | "title"
        | "artist"
        | "album"
        | "genre"
        | "key"
        | "tempo"
        | "timeSignature"
        | "notes"
        | "concept"
      >
    >
  ) => void;

  updateSectionColor: (
    sectionType: SectionType,
    color: string
  ) => void;

  renameSection: (
    sectionId: string,
    title: string
  ) => void;

  setActiveVersion: (
    sectionId: string,
    versionId: string
  ) => void;

  createVersion: (
    sectionId: string
  ) => void;

  duplicateVersion: (
    sectionId: string
  ) => void;

  renameVersion: (
    sectionId: string,
    versionId: string,
    name: string
  ) => void;

  deleteVersion: (
    sectionId: string,
    versionId: string
  ) => void;

  createSection: (
    type: SectionType
  ) => void;

  deleteSection: (
    sectionId: string
  ) => void;

  addSectionToArrangement: (
    sectionId: string
  ) => void;

  insertSectionIntoArrangement: (
    sectionId: string,
    index: number
  ) => void;

  removeArrangementItem: (
    index: number
  ) => void;

  moveArrangementItem: (
    oldIndex: number,
    newIndex: number
  ) => void;

  addIdea: (
    kind: SongIdeaKind,
    text: string
  ) => void;

  updateIdea: (
    ideaId: string,
    updates: Partial<{
      kind: SongIdeaKind;
      text: string;
      note: string;
      pinned: boolean;
      archived: boolean;
    }>
  ) => void;

  deleteIdea: (
    ideaId: string
  ) => void;

  createSectionFromIdea: (
    type: SectionType,
    text: string,
    note?: string
  ) => string | null;

  appendIdeaToSection: (
    sectionId: string,
    text: string
  ) => void;
}

function getSectionLabel(
  type: SectionType
): string {
  switch (type) {
    case "intro":
      return "Intro";

    case "verse":
      return "Verse";

    case "pre-chorus":
      return "Pre-Chorus";

    case "chorus":
      return "Chorus";

    case "post-chorus":
      return "Post-Chorus";

    case "bridge":
      return "Bridge";

    case "hook":
      return "Hook";

    case "outro":
      return "Outro";

    default:
      return "Custom";
  }
}

function touchSong(
  song: Song
): Song {
  return {
    ...song,
    updatedAt:
      new Date().toISOString(),
  };
}

const HISTORY_LIMIT = 120;
const TEXT_EDIT_GROUP_MS = 700;

function isLyricsOnlyChange(
  previous: Song,
  next: Song
) {
  if (
    previous.id !== next.id ||
    previous.sections.length !==
      next.sections.length ||
    previous.arrangements !==
      next.arrangements ||
    previous.ideas !== next.ideas ||
    previous.settings !==
      next.settings ||
    previous.title !== next.title ||
    previous.artist !== next.artist ||
    previous.album !== next.album ||
    previous.genre !== next.genre ||
    previous.key !== next.key ||
    previous.tempo !== next.tempo ||
    previous.timeSignature !==
      next.timeSignature ||
    previous.notes !== next.notes ||
    previous.concept !== next.concept
  ) {
    return false;
  }

  let changedSections = 0;
  let changedLyrics = 0;

  for (
    let sectionIndex = 0;
    sectionIndex <
    previous.sections.length;
    sectionIndex += 1
  ) {
    const before =
      previous.sections[
        sectionIndex
      ];
    const after =
      next.sections[
        sectionIndex
      ];

    if (before === after) {
      continue;
    }

    changedSections += 1;

    if (
      changedSections > 1 ||
      before.id !== after.id ||
      before.type !== after.type ||
      before.title !== after.title ||
      before.activeVersionId !==
        after.activeVersionId ||
      before.versions.length !==
        after.versions.length
    ) {
      return false;
    }

    for (
      let versionIndex = 0;
      versionIndex <
      before.versions.length;
      versionIndex += 1
    ) {
      const beforeVersion =
        before.versions[
          versionIndex
        ];
      const afterVersion =
        after.versions[
          versionIndex
        ];

      if (
        beforeVersion ===
        afterVersion
      ) {
        continue;
      }

      if (
        beforeVersion.id !==
          afterVersion.id ||
        beforeVersion.name !==
          afterVersion.name ||
        beforeVersion.chords !==
          afterVersion.chords ||
        beforeVersion.melody !==
          afterVersion.melody ||
        beforeVersion.markers !==
          afterVersion.markers ||
        beforeVersion.notes !==
          afterVersion.notes
      ) {
        return false;
      }

      if (
        beforeVersion.lyrics !==
        afterVersion.lyrics
      ) {
        changedLyrics += 1;
      } else {
        return false;
      }
    }
  }

  return (
    changedSections === 1 &&
    changedLyrics === 1
  );
}

export const useSongStore = create<SongStore>(
  (baseSet, get) => {
    let past: Song[] = [];
    let future: Song[] = [];
    let lastTextEditAt = 0;

    function syncHistoryFlags() {
      baseSet({
        canUndo:
          past.length > 0,
        canRedo:
          future.length > 0,
      });
    }

    const set = ((
      partial: unknown,
      replace?: boolean
    ) => {
      const previousState =
        get();

      const nextPartial =
        typeof partial ===
        "function"
          ? (
              partial as (
                state: SongStore
              ) =>
                Partial<SongStore>
            )(
              previousState
            )
          : partial as Partial<SongStore>;

      const nextSong =
        "currentSong" in
          nextPartial
          ? nextPartial.currentSong
          : previousState.currentSong;

      const previousSong =
        previousState.currentSong;

      if (
        previousSong &&
        nextSong &&
        previousSong !==
          nextSong
      ) {
        const now =
          Date.now();

        const textEdit =
          isLyricsOnlyChange(
            previousSong,
            nextSong
          );

        const continueTextGroup =
          textEdit &&
          now -
            lastTextEditAt <=
            TEXT_EDIT_GROUP_MS;

        if (
          !continueTextGroup
        ) {
          past.push(
            previousSong
          );

          if (
            past.length >
            HISTORY_LIMIT
          ) {
            past.shift();
          }
        }

        lastTextEditAt =
          textEdit
            ? now
            : 0;

        future = [];
      }

      baseSet(
        nextPartial as Partial<SongStore>,
        replace as false
      );

      syncHistoryFlags();
    }) as typeof baseSet;

    return ({
    currentSong: null,

    canUndo: false,
    canRedo: false,

    undo: () => {
      const current =
        get().currentSong;

      const previous =
        past.pop();

      if (
        !current ||
        !previous
      ) {
        return;
      }

      future.push(
        current
      );

      lastTextEditAt = 0;

      baseSet({
        currentSong:
          previous,
        selectedLyricLine:
          null,
      });

      syncHistoryFlags();
    },

    redo: () => {
      const current =
        get().currentSong;

      const next =
        future.pop();

      if (
        !current ||
        !next
      ) {
        return;
      }

      past.push(
        current
      );

      if (
        past.length >
        HISTORY_LIMIT
      ) {
        past.shift();
      }

      lastTextEditAt = 0;

      baseSet({
        currentSong:
          next,
        selectedLyricLine:
          null,
      });

      syncHistoryFlags();
    },

    clearHistory: () => {
      past = [];
      future = [];
      lastTextEditAt = 0;
      syncHistoryFlags();
    },

    selectedSectionId: null,
    selectedLyricLine: null,
    selectedArrangementId: null,

    previewInsertIndex: null,

    setCurrentSong: (song) => {
      past = [];
      future = [];
      lastTextEditAt = 0;

      baseSet({
        currentSong: song,
        selectedLyricLine:
          null,
        canUndo: false,
        canRedo: false,
      });
    },

    setSelectedSection: (id) =>
      set((state) => ({
        selectedSectionId: id,
        selectedLyricLine:
          id ===
          state.selectedLyricLine?.sectionId
            ? state.selectedLyricLine
            : null,
      })),

    setSelectedLyricLine: (
      selection
    ) =>
      set({
        selectedLyricLine:
          selection,
        selectedSectionId:
          selection?.sectionId ??
          null,
      }),

    setSelectedArrangement: (id) =>
      set({
        selectedArrangementId: id,
      }),

    setPreviewInsertIndex: (
      index
    ) =>
      set({
        previewInsertIndex: index,
      }),

    updateLyrics: (
      sectionId,
      lyrics
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !== sectionId
                  ) {
                    return section;
                  }

                  return {
                    ...section,
                    versions:
                      section.versions.map(
                        (version) => {
                          if (
                            version.id !==
                            section.activeVersionId
                          ) {
                            return version;
                          }

                          return {
                            ...version,
                            lyrics,
                          };
                        }
                      ),
                  };
                }
              ),
          }),
        };
      }),

    updateSongMetadata: (
      metadata
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            ...metadata,
          }),
        };
      }),

    updateSectionColor: (
      sectionType,
      color
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        const sectionColors =
          getSectionColors(
            state.currentSong.settings
              .sectionColors
          );

        return {
          currentSong: touchSong({
            ...state.currentSong,
            settings: {
              ...state.currentSong.settings,
              sectionColors: {
                ...sectionColors,
                [sectionType]: color,
              },
            },
          }),
        };
      }),

    renameSection: (
      sectionId,
      title
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !== sectionId
                  ) {
                    return section;
                  }

                  return {
                    ...section,
                    title,
                  };
                }
              ),
          }),
        };
      }),

    setActiveVersion: (
      sectionId,
      versionId
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !== sectionId
                  ) {
                    return section;
                  }

                  return {
                    ...section,
                    activeVersionId: versionId,
                  };
                }
              ),
          }),
        };
      }),

    createVersion: (
      sectionId
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !== sectionId
                  ) {
                    return section;
                  }

                  const activeVersion =
                    section.versions.find(
                      (version) =>
                        version.id ===
                        section.activeVersionId
                    );

                  if (!activeVersion) {
                    return section;
                  }

                  const newVersion = {
                    ...activeVersion,
                    id: crypto.randomUUID(),
                    name: `Version ${
                      section.versions.length + 1
                    }`,
                  };

                  return {
                    ...section,
                    activeVersionId: newVersion.id,
                    versions: [
                      ...section.versions,
                      newVersion,
                    ],
                  };
                }
              ),
          }),
        };
      }),

    duplicateVersion: (
      sectionId
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !== sectionId
                  ) {
                    return section;
                  }

                  const activeVersion =
                    section.versions.find(
                      (version) =>
                        version.id ===
                        section.activeVersionId
                    );

                  if (!activeVersion) {
                    return section;
                  }

                  const newVersion = {
                    ...activeVersion,
                    id: crypto.randomUUID(),
                    name: `${activeVersion.name} Copy`,
                  };

                  return {
                    ...section,
                    activeVersionId: newVersion.id,
                    versions: [
                      ...section.versions,
                      newVersion,
                    ],
                  };
                }
              ),
          }),
        };
      }),

    renameVersion: (
      sectionId,
      versionId,
      name
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !== sectionId
                  ) {
                    return section;
                  }

                  return {
                    ...section,
                    versions: section.versions.map(
                      (version) => {
                        if (
                          version.id !==
                          versionId
                        ) {
                          return version;
                        }

                        return {
                          ...version,
                          name,
                        };
                      }
                    ),
                  };
                }
              ),
          }),
        };
      }),

    deleteVersion: (
      sectionId,
      versionId
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !== sectionId
                  ) {
                    return section;
                  }

                  if (
                    section.versions.length === 1
                  ) {
                    return section;
                  }

                  const nextVersions =
                    section.versions.filter(
                      (version) =>
                        version.id !==
                        versionId
                    );

                  if (
                    nextVersions.length ===
                    section.versions.length
                  ) {
                    return section;
                  }

                  const nextActiveId =
                    section.activeVersionId ===
                    versionId
                      ? nextVersions[0].id
                      : section.activeVersionId;

                  return {
                    ...section,
                    activeVersionId: nextActiveId,
                    versions: nextVersions,
                  };
                }
              ),
          }),
        };
      }),

    createSection: (type) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        const existingCount =
          state.currentSong.sections.filter(
            (section) =>
              section.type === type
          ).length;

        const title = `${getSectionLabel(
          type
        )} ${existingCount + 1}`;

        const newSection: Section = {
          id: crypto.randomUUID(),

          type,

          title,

          activeVersionId: "v1",

          versions: [
            {
              id: "v1",
              name: "Default",
              lyrics: "",
              chords: [],
              melody: {
                notes: [],
              },
              markers: [],
              notes: "",
            },
          ],
        };

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections: [
              ...state.currentSong.sections,
              newSection,
            ],
          }),

          selectedSectionId:
            newSection.id,
        };
      }),

    deleteSection: (
      sectionId
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.filter(
                (section) =>
                  section.id !== sectionId
              ),
            arrangements:
              state.currentSong.arrangements.map(
                (arrangement) => ({
                  ...arrangement,
                  sequence:
                    arrangement.sequence.filter(
                      (item) =>
                        item.sectionId !==
                        sectionId
                    ),
                })
              ),
          }),

          selectedSectionId:
            state.selectedSectionId ===
            sectionId
              ? null
              : state.selectedSectionId,
          selectedLyricLine:
            state.selectedLyricLine?.sectionId ===
            sectionId
              ? null
              : state.selectedLyricLine,
        };
      }),

    addSectionToArrangement: (
      sectionId
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        const arrangement =
          state.currentSong.arrangements[0];

        if (!arrangement) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            arrangements: [
              {
                ...arrangement,
                sequence: [
                  ...arrangement.sequence,
                  {
                    id: crypto.randomUUID(),
                    sectionId,
                  },
                ],
              },
            ],
          }),
        };
      }),

    insertSectionIntoArrangement: (
      sectionId,
      index
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        const arrangement =
          state.currentSong.arrangements[0];

        if (!arrangement) {
          return state;
        }

        const sequence = [
          ...arrangement.sequence,
        ];

        sequence.splice(
          index,
          0,
          {
            id: crypto.randomUUID(),
            sectionId,
          }
        );

        return {
          currentSong: touchSong({
            ...state.currentSong,
            arrangements: [
              {
                ...arrangement,
                sequence,
              },
            ],
          }),

          previewInsertIndex: null,
        };
      }),

    removeArrangementItem: (
      index
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        const arrangement =
          state.currentSong.arrangements[0];

        if (!arrangement) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            arrangements: [
              {
                ...arrangement,
                sequence:
                  arrangement.sequence.filter(
                    (_, i) =>
                      i !== index
                  ),
              },
            ],
          }),
        };
      }),

    moveArrangementItem: (
      oldIndex,
      newIndex
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        const arrangement =
          state.currentSong.arrangements[0];

        if (!arrangement) {
          return state;
        }

        const sequence = [
          ...arrangement.sequence,
        ];

        const [movedItem] =
          sequence.splice(
            oldIndex,
            1
          );

        sequence.splice(
          newIndex,
          0,
          movedItem
        );

        return {
          currentSong: touchSong({
            ...state.currentSong,
            arrangements: [
              {
                ...arrangement,
                sequence,
              },
            ],
          }),
        };
      }),

    addIdea: (
      kind,
      text
    ) =>
      set((state) => {
        if (
          !state.currentSong ||
          !text.trim()
        ) {
          return state;
        }

        const now =
          new Date().toISOString();

        return {
          currentSong: touchSong({
            ...state.currentSong,
            ideas: [
              {
                id:
                  crypto.randomUUID(),
                kind,
                text:
                  text.trim(),
                note: "",
                pinned: false,
                archived: false,
                createdAt: now,
                updatedAt: now,
              },
              ...(
                state.currentSong
                  .ideas ?? []
              ),
            ],
          }),
        };
      }),

    updateIdea: (
      ideaId,
      updates
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            ideas: (
              state.currentSong
                .ideas ?? []
            ).map(
              (idea) =>
                idea.id ===
                ideaId
                  ? {
                      ...idea,
                      ...updates,
                      updatedAt:
                        new Date().toISOString(),
                    }
                  : idea
            ),
          }),
        };
      }),

    deleteIdea: (
      ideaId
    ) =>
      set((state) => {
        if (!state.currentSong) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            ideas: (
              state.currentSong
                .ideas ?? []
            ).filter(
              (idea) =>
                idea.id !==
                ideaId
            ),
          }),
        };
      }),

    createSectionFromIdea: (
      type,
      text,
      note = ""
    ) => {
      const sectionId =
        crypto.randomUUID();

      let created = false;

      set((state) => {
        if (
          !state.currentSong ||
          !text.trim()
        ) {
          return state;
        }

        const existingCount =
          state.currentSong.sections.filter(
            (section) =>
              section.type ===
              type
          ).length;

        const title =
          getSectionLabel(type) +
          " " +
          (existingCount + 1);

        const versionId =
          crypto.randomUUID();

        const newSection: Section = {
          id: sectionId,
          type,
          title,
          activeVersionId:
            versionId,
          versions: [
            {
              id: versionId,
              name: "Default",
              lyrics:
                text.trim(),
              chords: [],
              melody: {
                notes: [],
              },
              markers: [],
              notes:
                note.trim(),
            },
          ],
        };

        const arrangement =
          state.currentSong
            .arrangements[0];

        const arrangements =
          arrangement
            ? [
                {
                  ...arrangement,
                  sequence: [
                    ...arrangement.sequence,
                    {
                      id:
                        crypto.randomUUID(),
                      sectionId,
                    },
                  ],
                },
                ...state.currentSong.arrangements.slice(
                  1
                ),
              ]
            : state.currentSong
                .arrangements;

        created = true;

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections: [
              ...state.currentSong.sections,
              newSection,
            ],
            arrangements,
          }),
          selectedSectionId:
            sectionId,
        };
      });

      return created
        ? sectionId
        : null;
    },

    appendIdeaToSection: (
      sectionId,
      text
    ) =>
      set((state) => {
        if (
          !state.currentSong ||
          !text.trim()
        ) {
          return state;
        }

        return {
          currentSong: touchSong({
            ...state.currentSong,
            sections:
              state.currentSong.sections.map(
                (section) => {
                  if (
                    section.id !==
                    sectionId
                  ) {
                    return section;
                  }

                  return {
                    ...section,
                    versions:
                      section.versions.map(
                        (version) => {
                          if (
                            version.id !==
                            section.activeVersionId
                          ) {
                            return version;
                          }

                          const current =
                            version.lyrics.trimEnd();

                          return {
                            ...version,
                            lyrics:
                              current
                                ? current +
                                  "\n" +
                                  text.trim()
                                : text.trim(),
                          };
                        }
                      ),
                  };
                }
              ),
          }),
          selectedSectionId:
            sectionId,
        };
      }),
    });
  }
);