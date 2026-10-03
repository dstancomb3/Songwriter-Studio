import type { Song } from "../types";

const STORAGE_KEY =
  "songwriter-current-song";

function isCompatibleSong(
  value: unknown
): value is Song {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const song =
    value as Partial<Song>;

  return (
    typeof song.id === "string" &&
    typeof song.title === "string" &&
    Array.isArray(song.sections) &&
    Array.isArray(song.arrangements) &&
    !!song.settings &&
    typeof song.settings === "object" &&
    !!song.settings.sectionColors &&
    typeof song.settings.sectionColors ===
      "object"
  );
}

export function saveSong(
  song: Song
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(song)
    );
  } catch (error) {
    console.warn(
      "Unable to save song locally.",
      error
    );
  }
}

export function loadSong(): Song | null {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!isCompatibleSong(parsed)) {
      console.warn(
        "Ignoring incompatible saved song data."
      );
      localStorage.removeItem(
        STORAGE_KEY
      );
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn(
      "Unable to load saved song data.",
      error
    );

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Storage may be unavailable.
    }

    return null;
  }
}

export function clearSong() {
  try {
    localStorage.removeItem(
      STORAGE_KEY
    );
  } catch (error) {
    console.warn(
      "Unable to clear saved song data.",
      error
    );
  }
}
