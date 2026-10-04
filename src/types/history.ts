import type { Song } from "./song";

export type VersionScoreSummary = {
  conceptScore: number | null;
  rhymeScore: number;
  meterScore: number;
  lineCount: number;
  wordCount: number;
};

export type VersionSnapshotSource =
  | "manual"
  | "safety"
  | "restore"
  | "import";

export type SongVersionSnapshot = {
  id: string;
  name: string;
  note?: string;
  source?: VersionSnapshotSource;
  createdAt: string;
  songId: string;
  song: Song;
  scores: VersionScoreSummary;
};

export type VersionLineDiff = {
  kind:
    | "same"
    | "added"
    | "removed";
  text: string;
  beforeLine: number | null;
  afterLine: number | null;
};

export type SectionChangeSummary = {
  sectionId: string;
  title: string;
  status:
    | "added"
    | "removed"
    | "changed"
    | "unchanged";
  addedLines: number;
  removedLines: number;
  lineDiff: VersionLineDiff[];
};

export type VersionComparison = {
  changedSectionCount: number;
  addedSectionCount: number;
  removedSectionCount: number;
  arrangementChanged: boolean;
  conceptChanged: boolean;
  titleChanged: boolean;
  sections: SectionChangeSummary[];
};
