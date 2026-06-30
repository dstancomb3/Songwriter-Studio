import type { Section } from "./section";
import type { Arrangement } from "./arrangement";
import type { Theme } from "./theme";

export interface SongSettings {
  darkMode: boolean;
}

export interface Song {
  id: string;

  title: string;

  artist: string;

  album: string;

  genre: string;

  key: string;

  tempo: number;

  timeSignature: string;

  notes: string;

  createdAt: string;

  updatedAt: string;

  sections: Section[];

  arrangements: Arrangement[];

  themes: Theme[];

  settings: SongSettings;
}