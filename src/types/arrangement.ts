export interface ArrangementItem {
  id: string;
  sectionId: string;
}

export interface Arrangement {
  id: string;
  name: string;
  sequence: ArrangementItem[];
}