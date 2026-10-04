export type SongIdeaKind =
  | "hook"
  | "title"
  | "image"
  | "emotion"
  | "snippet"
  | "concept";

export interface SongIdea {
  id: string;
  kind: SongIdeaKind;
  text: string;
  note: string;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
