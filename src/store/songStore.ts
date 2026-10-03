import { create } from "zustand";
import type {
  Song,
  Section,
  SectionType,
} from "../types";

import {
  getSectionColors,
} from "../constants/sectionColors";

interface SongStore {
  currentSong: Song | null;

  selectedSectionId: string | null;
  selectedArrangementId: string | null;

  previewInsertIndex: number | null;

  setCurrentSong: (song: Song) => void;

  setSelectedSection: (
    id: string | null
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

export const useSongStore = create<SongStore>(
  (set) => ({
    currentSong: null,

    selectedSectionId: null,
    selectedArrangementId: null,

    previewInsertIndex: null,

    setCurrentSong: (song) =>
      set({
        currentSong: song,
      }),

    setSelectedSection: (id) =>
      set({
        selectedSectionId: id,
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
          }),

          selectedSectionId:
            state.selectedSectionId ===
            sectionId
              ? null
              : state.selectedSectionId,
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
  })
);