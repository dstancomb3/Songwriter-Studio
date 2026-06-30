import { useSongStore } from "../store/songStore";

export function SongPanel() {
  const song = useSongStore(
    (state) => state.currentSong
  );

  const updateSongMetadata =
    useSongStore(
      (state) =>
        state.updateSongMetadata
    );

  if (!song) {
    return null;
  }

  return (
    <div>
      <h2>Song</h2>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <label>
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

        <label>
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

        <label>
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

        <label>
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

        <label>
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

        <label>
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

        <label>
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

        <label>
          <div>Notes</div>

          <textarea
            value={song.notes}
            onChange={(e) =>
              updateSongMetadata({
                notes:
                  e.target.value,
              })
            }
            rows={8}
            style={{
              width: "100%",
              resize: "vertical",
            }}
          />
        </label>
      </div>
    </div>
  );
}