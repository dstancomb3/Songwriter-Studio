import { useRef } from "react";

import {
  exportSong,
  importSong,
} from "../services/songFile";

import { useSongStore } from "../store/songStore";

export function Toolbar() {
  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const song =
    useSongStore(
      (state) =>
        state.currentSong
    );

  const setCurrentSong =
    useSongStore(
      (state) =>
        state.setCurrentSong
    );

  async function handleImport(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    console.log(
      "HANDLE IMPORT FIRED"
    );

    const file =
      event.target.files?.[0];

    console.log(
      "FILE:",
      file
    );

    if (!file) {
      return;
    }

    try {
      const importedSong =
        await importSong(
          file
        );

      console.log(
        "IMPORTED SONG:",
        importedSong
      );

      setCurrentSong(
        importedSong
      );
    } catch (error) {
      console.error(
        "IMPORT ERROR:",
        error
      );

      alert(
        "Invalid song file."
      );
    }

    event.target.value = "";
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom:
          "1rem",
        padding: "0 1rem",
      }}
    >
      <button
        onClick={() => {
          if (song) {
            exportSong(
              song
            );
          }
        }}
      >
        Export JSON
      </button>

      <button
        onClick={() =>
          fileInputRef.current?.click()
        }
      >
        Import JSON
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.songwriter.json"
        onChange={
          handleImport
        }
        style={{
          display: "none",
        }}
      />
    </div>
  );
}