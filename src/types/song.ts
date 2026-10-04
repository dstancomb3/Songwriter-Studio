import type {
  Section,
  SectionColorMap,
} from "./section";
import type { Arrangement } from "./arrangement";
import type { Theme } from "./theme";
import type { SongIdea } from "./idea";

export interface SongSettings {
  darkMode: boolean;
  sectionColors?: SectionColorMap;
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

  concept?: string;

  createdAt: string;

  updatedAt: string;

  sections: Section[];

  arrangements: Arrangement[];

  themes: Theme[];

  ideas?: SongIdea[];

  settings: SongSettings;
}