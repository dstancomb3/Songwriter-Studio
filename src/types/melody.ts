export interface MidiNote {
  id: string;

  pitch: string;

  start: number;

  duration: number;

  velocity: number;
}

export interface MelodyData {
  notes: MidiNote[];
}