import type {
  Song,
} from "../types";

import {
  normalizeSong,
} from "./songSchema";

function safeExportName(
  title: string
) {
  const cleaned =
    title
      .trim()
      .replace(
        /[\\/:*?"<>|]+/g,
        "-"
      )
      .replace(
        /\s+/g,
        " "
      );

  return cleaned ||
    "Untitled Song";
}

export function exportSong(
  song: Song
) {
  const normalized =
    normalizeSong(
      song
    ).song;

  const json =
    JSON.stringify(
      normalized,
      null,
      2
    );

  const blob =
    new Blob(
      [json],
      {
        type:
          "application/json",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    safeExportName(
      normalized.title
    ) +
    ".songwriter.json";

  link.click();

  URL.revokeObjectURL(
    url
  );
}

export async function importSong(
  file: File
): Promise<Song> {
  const text =
    await file.text();

  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        text
      );
  } catch {
    throw new Error(
      "The selected file is not valid JSON."
    );
  }

  return normalizeSong(
    parsed
  ).song;
}
