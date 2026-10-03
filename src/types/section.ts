export type SectionType =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "post-chorus"
  | "bridge"
  | "hook"
  | "outro"
  | "custom";

export type SectionColorMap = Record<
  SectionType,
  string
>;

import type { Marker } from "./marker";
import type { MelodyData } from "./melody";

export interface SectionVersion {
  id: string;
  name: string;

  lyrics: string;

  chords: string[];

  melody: MelodyData;

  markers: Marker[];

  notes: string;
}

export interface Section {
  id: string;

  type: SectionType;

  title: string;

  versions: SectionVersion[];

  activeVersionId: string;
}