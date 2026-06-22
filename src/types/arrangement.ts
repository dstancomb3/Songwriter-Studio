export interface ArrangementItem {
  sectionId: string;
}

export interface Arrangement {
  id: string;
  name: string;
  sequence: ArrangementItem[];
}