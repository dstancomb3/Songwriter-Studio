import type { Song } from "../types";

export function exportSong(
  song: Song
) {
  const json =
    JSON.stringify(
      song,
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
    `${song.title}.songwriter.json`;

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

  return JSON.parse(
    text
  ) as Song;
}