import type {
  Song,
} from "../types";

import {
  normalizeSong,
} from "./songSchema";

const STORAGE_KEY =
  "songwriter-current-song";

const RECOVERY_KEY =
  "songwriter-current-song-recovery";

export type SongSaveResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

function errorMessage(
  error: unknown
) {
  return error instanceof
    Error
    ? error.message
    : String(error);
}

function preserveRecoveryCopy(
  raw: string
) {
  try {
    localStorage.setItem(
      RECOVERY_KEY,
      raw
    );
  } catch (error) {
    console.warn(
      "Unable to preserve the recovery copy.",
      error
    );
  }
}

export function saveSong(
  song: Song
): SongSaveResult {
  try {
    const normalized =
      normalizeSong(
        song
      ).song;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        normalized
      )
    );

    return {
      ok: true,
    };
  } catch (error) {
    console.warn(
      "Unable to save song locally.",
      error
    );

    return {
      ok: false,
      error:
        errorMessage(
          error
        ),
    };
  }
}

export function loadSong(): Song | null {
  let raw:
    string | null = null;

  try {
    raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed: unknown =
      JSON.parse(raw);

    const result =
      normalizeSong(
        parsed
      );

    if (
      result.repairs.length >
      0
    ) {
      console.info(
        "Songwriter Studio repaired saved song data:",
        result.repairs
      );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          result.song
        )
      );
    }

    return result.song;
  } catch (error) {
    console.warn(
      "Unable to load saved song data. A recovery copy was preserved when possible.",
      error
    );

    if (raw) {
      preserveRecoveryCopy(
        raw
      );

      try {
        localStorage.removeItem(
          STORAGE_KEY
        );
      } catch {
        // Storage may be unavailable.
      }
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
