import { useRef, useState } from "react";

import {
  exportSong,
  importSong,
} from "../services/songFile";

import { useSongStore } from "../store/songStore";
import { Panel } from "./ui/Panel";

export function SongPanel() {
  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] =
    useState(false);

  const song = useSongStore(
    (state) => state.currentSong
  );

  const updateSongMetadata =
    useSongStore(
      (state) =>
        state.updateSongMetadata
    );

  const setCurrentSong =
    useSongStore(
      (state) => state.setCurrentSong
    );

  async function handleImport(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedSong =
        await importSong(file);

      setCurrentSong(
        importedSong
      );
    } catch (error) {
      console.error(
        "IMPORT ERROR:",
        error
      );

      alert("Invalid song file.");
    }

    event.target.value = "";
  }

  if (!song) {
    return null;
  }

  return (
    <Panel
      title={song.title || "Untitled Song"}
      collapsible
      isCollapsed={isCollapsed}
      onToggleCollapse={() =>
        setIsCollapsed(
          (value) => !value
        )
      }
      headerRight={
        <>
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
            onChange={handleImport}
            style={{
              display: "none",
            }}
          />
        </>
      }
    >
      <div className="song-meta-grid">
          <label className="song-meta-field">
            <div>Title</div>

            <input
              value={song.title}
              onChange={(e) =>
                updateSongMetadata({
                  title:
                    e.target.value,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </label>

          <label className="song-meta-field">
            <div>Artist</div>

            <input
              value={song.artist}
              onChange={(e) =>
                updateSongMetadata({
                  artist:
                    e.target.value,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </label>

          <label className="song-meta-field">
            <div>Album</div>

            <input
              value={song.album}
              onChange={(e) =>
                updateSongMetadata({
                  album:
                    e.target.value,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </label>

          <label className="song-meta-field">
            <div>Genre</div>

            <input
              value={song.genre}
              onChange={(e) =>
                updateSongMetadata({
                  genre:
                    e.target.value,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </label>

          <label className="song-meta-field">
            <div>Key</div>

            <input
              value={song.key}
              onChange={(e) =>
                updateSongMetadata({
                  key:
                    e.target.value,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </label>

          <label className="song-meta-field">
            <div>Tempo (BPM)</div>

            <input
              type="number"
              value={song.tempo}
              onChange={(e) =>
                updateSongMetadata({
                  tempo:
                    Number(
                      e.target.value
                    ) || 0,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </label>

          <label className="song-meta-field">
            <div>
              Time Signature
            </div>

            <input
              value={
                song.timeSignature
              }
              onChange={(e) =>
                updateSongMetadata({
                  timeSignature:
                    e.target.value,
                })
              }
              style={{
                width: "100%",
              }}
            />
          </label>

          <label className="song-meta-field song-meta-field--notes">
            <div>Notes</div>

            <textarea
              value={song.notes}
              onChange={(e) =>
                updateSongMetadata({
                  notes:
                    e.target.value,
                })
              }
              rows={3}
              style={{
                width: "100%",
                resize: "vertical",
              }}
            />
          </label>
      </div>
    </Panel>
  );
}