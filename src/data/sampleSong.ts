import type { Song } from "../types";

export const sampleSong: Song = {
  id: "song-1",

  title: "The Devil Doesn't Bargain",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),

  settings: {
    darkMode: true,
  },

  themes: [],

  sections: [
    {
      id: "verse-1",

      type: "verse",

      title: "Verse 1",

      activeVersionId: "v1",

      versions: [
        {
          id: "v1",

          name: "Default",

          lyrics: "It's not a deal you wanna make",

          chords: [],

          melody: {
            notes: [],
          },

          markers: [],

          notes: "",
        },
      ],
    },

    {
      id: "chorus-1",

      type: "chorus",

      title: "Chorus",

      activeVersionId: "v1",

      versions: [
        {
          id: "v1",

          name: "Default",

          lyrics:
            "The devil doesn't bargain\nThe devil doesn't deal",

          chords: [],

          melody: {
            notes: [],
          },

          markers: [],

          notes: "",
        },
      ],
    },
  ],

  arrangements: [
    {
      id: "main",

      name: "Main Arrangement",

      sequence: [
        { sectionId: "verse-1" },
        { sectionId: "chorus-1" },
        { sectionId: "verse-1" },
        { sectionId: "chorus-1" },
      ],
    },
  ],
};