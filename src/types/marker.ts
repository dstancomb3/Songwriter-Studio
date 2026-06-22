export type MarkerCategory =
  | "performance"
  | "instrument"
  | "production"
  | "arrangement";

export interface Marker {
  id: string;

  category: MarkerCategory;

  label: string;

  position: number;
}