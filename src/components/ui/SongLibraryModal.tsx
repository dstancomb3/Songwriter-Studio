import {
  useEffect,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  getSongsDirectory,
  listSavedSongs,
  type SavedSongSummary,
} from "../../services/songLibrary";

function formatUpdatedAt(
  value: string
) {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    undefined,
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  );
}

export function SongLibraryModal({
  currentSongId,
  onClose,
  onOpenSong,
}: {
  currentSongId:
    string | null;
  onClose: () => void;
  onOpenSong: (
    song:
      SavedSongSummary
  ) => void;
}) {
  const [
    songs,
    setSongs,
  ] = useState<
    SavedSongSummary[]
  >([]);

  const [
    directory,
    setDirectory,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    let cancelled =
      false;

    void (async () => {
      try {
        const [
          nextSongs,
          nextDirectory,
        ] =
          await Promise.all([
            listSavedSongs(),
            getSongsDirectory(),
          ]);

        if (cancelled) {
          return;
        }

        setSongs(
          nextSongs
        );

        setDirectory(
          nextDirectory
        );
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setError(
          nextError instanceof
          Error
            ? nextError.message
            : "Unable to read the Songs folder."
        );
      } finally {
        if (!cancelled) {
          setLoading(
            false
          );
        }
      }
    })();

    function handleKeyDown(
      event:
        KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  return createPortal(
    <div
      className="song-library-backdrop"
      role="presentation"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="song-library-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-library-title"
      >
        <header className="song-library-modal__header">
          <div>
            <div className="song-library-modal__eyebrow">
              Songwriter Studio
            </div>

            <h2
              id="song-library-title"
            >
              Open Song
            </h2>

            <p>
              Choose a song saved in your Songwriter Studio library.
            </p>
          </div>

          <button
            type="button"
            className="song-library-modal__close"
            onClick={
              onClose
            }
            aria-label="Close song library"
          >
            ×
          </button>
        </header>

        <div className="song-library-modal__body">
          {loading ? (
            <div className="song-library-state">
              Loading saved songs…
            </div>
          ) : error ? (
            <div className="song-library-state song-library-state--error">
              {error}
            </div>
          ) : songs.length ===
            0 ? (
            <div className="song-library-state">
              <strong>
                No saved songs yet
              </strong>

              <span>
                Use Menu → Save Song to add the current song to this library.
              </span>
            </div>
          ) : (
            <div className="song-library-list">
              {songs.map(
                (
                  savedSong
                ) => {
                  const current =
                    savedSong.songId ===
                    currentSongId;

                  return (
                    <button
                      type="button"
                      key={
                        savedSong.fileName
                      }
                      className={
                        current
                          ? "song-library-card song-library-card--current"
                          : "song-library-card"
                      }
                      onClick={() =>
                        onOpenSong(
                          savedSong
                        )
                      }
                    >
                      <div className="song-library-card__main">
                        <div className="song-library-card__title-row">
                          <strong>
                            {
                              savedSong.title ||
                              "Untitled Song"
                            }
                          </strong>

                          {current && (
                            <span>
                              Current
                            </span>
                          )}
                        </div>

                        <div className="song-library-card__secondary">
                          {savedSong.artist && (
                            <span>
                              {
                                savedSong.artist
                              }
                            </span>
                          )}

                          {savedSong.genre && (
                            <span>
                              {
                                savedSong.genre
                              }
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="song-library-card__facts">
                        {savedSong.key && (
                          <span>
                            {
                              savedSong.key
                            }
                          </span>
                        )}

                        {savedSong.tempo >
                          0 && (
                          <span>
                            {
                              Math.round(
                                savedSong.tempo
                              )
                            }{" "}
                            BPM
                          </span>
                        )}

                        <span>
                          {
                            savedSong.sectionCount
                          }{" "}
                          {savedSong.sectionCount ===
                          1
                            ? "section"
                            : "sections"}
                        </span>
                      </div>

                      <div className="song-library-card__updated">
                        Updated{" "}
                        {
                          formatUpdatedAt(
                            savedSong.updatedAt
                          )
                        }
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        {directory && (
          <footer className="song-library-modal__footer">
            <span>
              Songs folder
            </span>

            <code>
              {directory}
            </code>
          </footer>
        )}
      </section>
    </div>,
    document.body
  );
}
