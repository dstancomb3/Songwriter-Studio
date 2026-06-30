import type { Song } from "../types";

const STORAGE_KEY =
  "songwriter-current-song";

export function saveSong(
  song: Song
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(song)
  );
}

export function loadSong(): Song | null {
  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSong() {
  localStorage.removeItem(
    STORAGE_KEY
  );
}