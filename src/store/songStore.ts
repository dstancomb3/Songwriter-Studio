import { create } from "zustand";
import type { Song, Section } from "../types";

interface SongStore {
currentSong: Song | null;

selectedSectionId: string | null;
selectedArrangementId: string | null;

setCurrentSong: (song: Song) => void;

setSelectedSection: (
id: string | null
) => void;

setSelectedArrangement: (
id: string | null
) => void;

updateLyrics: (
sectionId: string,
lyrics: string
) => void;

createSection: () => void;

deleteSection: (
sectionId: string
) => void;

addSectionToArrangement: (
sectionId: string
) => void;

removeArrangementItem: (
index: number
) => void;
}

export const useSongStore = create<SongStore>(
(set) => ({
currentSong: null,


selectedSectionId: null,
selectedArrangementId: null,

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

updateLyrics: (
  sectionId,
  lyrics
) =>
  set((state) => {
    if (!state.currentSong) {
      return state;
    }

    return {
      currentSong: {
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
      },
    };
  }),

createSection: () =>
  set((state) => {
    if (!state.currentSong) {
      return state;
    }

    const newSection: Section = {
      id: crypto.randomUUID(),

      type: "verse",

      title: "New Section",

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
      currentSong: {
        ...state.currentSong,
        sections: [
          ...state.currentSong.sections,
          newSection,
        ],
      },

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
      currentSong: {
        ...state.currentSong,
        sections:
          state.currentSong.sections.filter(
            (section) =>
              section.id !== sectionId
          ),
      },

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
      currentSong: {
        ...state.currentSong,
        arrangements: [
          {
            ...arrangement,
            sequence: [
              ...arrangement.sequence,
              { sectionId },
            ],
          },
        ],
      },
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
      currentSong: {
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
      },
    };
  }),


})
);
