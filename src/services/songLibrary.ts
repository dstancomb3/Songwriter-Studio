import type {
  Song,
} from "../types";

import {
  normalizeSong,
} from "./songSchema";

export type SavedSongSummary = {
  fileName: string;
  songId: string;
  title: string;
  artist: string;
  genre: string;
  key: string;
  tempo: number;
  updatedAt: string;
  sectionCount: number;
};

type TauriBridge = {
  core?: {
    invoke: <T>(
      command: string,
      args?: Record<
        string,
        unknown
      >
    ) => Promise<T>;
  };
};

function getInvoke() {
  const bridge =
    (
      window as Window & {
        __TAURI__?: TauriBridge;
      }
    ).__TAURI__;

  const invoke =
    bridge?.core?.invoke;

  if (!invoke) {
    throw new Error(
      "The desktop song library is only available in the Songwriter Studio desktop app."
    );
  }

  return invoke;
}

export async function saveSongToLibrary(
  song: Song
) {
  return await getInvoke()<
    SavedSongSummary
  >(
    "save_song_to_library",
    {
      songJson:
        JSON.stringify(
          normalizeSong(
            song
          ).song
        ),
    }
  );
}

export async function listSavedSongs() {
  return await getInvoke()<
    SavedSongSummary[]
  >(
    "list_saved_songs"
  );
}

export async function loadSongFromLibrary(
  fileName: string
): Promise<Song> {
  const raw =
    await getInvoke()<
      string
    >(
      "load_song_from_library",
      {
        fileName,
      }
    );

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        raw
      );
  } catch {
    throw new Error(
      "The saved song file contains invalid JSON."
    );
  }

  return normalizeSong(
    parsed
  ).song;
}

export async function getSongsDirectory() {
  return await getInvoke()<
    string
  >(
    "get_songs_directory"
  );
}
