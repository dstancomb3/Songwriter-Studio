import type { Song } from "../types";

import {
  defaultSectionColors,
} from "../constants/sectionColors";

export const sampleSong: Song = {
  id: "song-1",

  title: "The Devil Doesn't Bargain",

  artist: "",

  album: "",

  genre: "",

  key: "C",

  tempo: 120,

  timeSignature: "4/4",

  notes: "",

  concept:
    "A warning that evil never bargains fairly and every deal with it carries a cost.",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),

  settings: {
    darkMode: true,
    sectionColors: defaultSectionColors,
  },

  themes: [],

  sections: [
    {
      id: "verse-2",

      type: "verse",

      title: "Verse 2",

      activeVersionId: "v2",

      versions: [
        {
          id: "v2",

          name: "Default",

          lyrics:
            "El Diablo only lives\n to lie and cheat and steal",

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
      id: "verse-1",

      type: "verse",

      title: "Verse 1",

      activeVersionId: "v1",

      versions: [
        {
          id: "v1",

          name: "Default",

          lyrics:
            "It's not a deal you wanna make,\n in the end your soul he'll take",

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
        {
          id: "arr-1",
          sectionId: "verse-1",
        },

        {
          id: "arr-2",
          sectionId: "chorus-1",
        },

        {
          id: "arr-3",
          sectionId: "verse-2",
        },

        {
          id: "arr-4",
          sectionId: "chorus-1",
        },
      ],
    },
  ],
};