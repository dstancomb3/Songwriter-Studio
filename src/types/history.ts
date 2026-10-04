import type { Song } from "./song";

export type VersionScoreSummary = {
  conceptScore: number | null;
  rhymeScore: number;
  meterScore: number;
  lineCount: number;
  wordCount: number;
};

export type SongVersionSnapshot = {
  id: string;
  name: string;
  createdAt: string;
  songId: string;
  song: Song;
  scores: VersionScoreSummary;
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
