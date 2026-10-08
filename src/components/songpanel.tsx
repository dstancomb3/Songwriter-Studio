import {
  useRef,
  useState,
} from "react";

import {
  exportSong,
  importSong,
} from "../services/songFile";

import { useSongStore } from "../store/songStore";
import { Panel } from "./ui/Panel";

import {
  StudioContextMenu,
} from "./ui/StudioContextMenu";

import {
  useStudioModal,
} from "./ui/StudioModalProvider";

import {
  saveSafetySnapshot,
} from "../services/versionHistory";

export function SongPanel({
  onOpenVersions,
  onOpenExplore,
}: {
  onOpenVersions?: () => void;
  onOpenExplore?: () => void;
}) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    isCollapsed,
    setIsCollapsed,
  ] = useState(true);

  const [
    menu,
    setMenu,
  ] = useState<
    | {
        x: number;
        y: number;
      }
    | null
  >(null);

  const {
    confirm,
    notify,
  } = useStudioModal();

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
      (state) =>
        state.setCurrentSong
    );

  const canUndo =
    useSongStore(
      (state) =>
        state.canUndo
    );

  const canRedo =
    useSongStore(
      (state) =>
        state.canRedo
    );

  const undo =
    useSongStore(
      (state) =>
        state.undo
    );

  const redo =
    useSongStore(
      (state) =>
        state.redo
    );

  async function handleImport(
    event:
      React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (
      !file ||
      !song
    ) {
      return;
    }

    try {
      const importedSong =
        await importSong(
          file
        );

      const approved =
        await confirm({
          title:
            "Import song?",
          message:
            "Importing " +
            (
              importedSong.title ||
              "Untitled Song"
            ) +
            " will replace the current working song. A safety snapshot of " +
            (
              song.title ||
              "Untitled Song"
            ) +
            " will be saved first.",
          confirmLabel:
            "Import song",
        });

      if (!approved) {
        return;
      }

      saveSafetySnapshot(
        song,
        "Before importing " +
          (
            importedSong.title ||
            "song"
          ),
        "Automatic safety snapshot before replacing the current song with an imported file."
      );

      setCurrentSong(
        importedSong
      );

      notify({
        title:
          "Song imported",
        message:
          importedSong.title ||
          "Untitled Song",
        tone:
          "success",
      });
    } catch (error) {
      console.error(
        "IMPORT ERROR:",
        error
      );

      notify({
        title:
          "Import failed",
        message:
          "That file could not be loaded as a Songwriter Studio song.",
        tone:
          "danger",
      });
    }
  }

  if (!song) {
    return null;
  }

  return (
    <Panel
      title={
        song.title ||
        "Untitled Song"
      }
      collapsible
      isCollapsed={
        isCollapsed
      }
      onToggleCollapse={() =>
        setIsCollapsed(
          (value) =>
            !value
        )
      }
      headerRight={
        <>
          <button
            type="button"
            className="song-menu-button"
            aria-haspopup="menu"
            aria-expanded={
              menu !== null
            }
            onClick={(
              event
            ) => {
              const rect =
                event.currentTarget.getBoundingClientRect();

              setMenu(
                menu
                  ? null
                  : {
                      x:
                        rect.left,
                      y:
                        rect.bottom +
                        4,
                    }
              );
            }}
          >
            Menu
            <span
              aria-hidden="true"
              className="song-menu-button__chevron"
            >
              ▾
            </span>
          </button>

          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".json,.songwriter.json"
            onChange={
              handleImport
            }
            style={{
              display:
                "none",
            }}
          />

          {menu && (
            <StudioContextMenu
              x={menu.x}
              y={menu.y}
              onClose={() =>
                setMenu(null)
              }
              items={[
                {
                  id:
                    "song-details",
                  label:
                    isCollapsed
                      ? "Show Song Details"
                      : "Hide Song Details",
                  onSelect: () =>
                    setIsCollapsed(
                      (value) =>
                        !value
                    ),
                },
                {
                  id:
                    "import-song",
                  label:
                    "Import Song…",
                  onSelect: () =>
                    fileInputRef.current?.click(),
                },
                {
                  id:
                    "export-song",
                  label:
                    "Export Song…",
                  onSelect: () => {
                    exportSong(
                      song
                    );

                    notify({
                      title:
                        "Song exported",
                      message:
                        (
                          song.title ||
                          "Untitled Song"
                        ) +
                        ".songwriter.json",
                      tone:
                        "success",
                    });
                  },
                },
                {
                  id:
                    "undo",
                  label:
                    "Undo",
                  disabled:
                    !canUndo,
                  onSelect:
                    undo,
                },
                {
                  id:
                    "redo",
                  label:
                    "Redo",
                  disabled:
                    !canRedo,
                  onSelect:
                    redo,
                },
                {
                  id:
                    "versions",
                  label:
                    "Open Versions",
                  disabled:
                    !onOpenVersions,
                  onSelect: () =>
                    onOpenVersions?.(),
                },
                {
                  id:
                    "explore",
                  label:
                    "Open Explore",
                  disabled:
                    !onOpenExplore,
                  onSelect: () =>
                    onOpenExplore?.(),
                },
              ]}
            />
          )}
        </>
      }
    >
      <div className="song-meta-grid">
        <label className="song-meta-field">
          <div>
            Title
          </div>

          <input
            value={
              song.title
            }
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  title:
                    event.target
                      .value,
                }
              )
            }
          />
        </label>

        <label className="song-meta-field">
          <div>
            Artist
          </div>

          <input
            value={
              song.artist
            }
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  artist:
                    event.target
                      .value,
                }
              )
            }
          />
        </label>

        <label className="song-meta-field">
          <div>
            Album
          </div>

          <input
            value={
              song.album
            }
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  album:
                    event.target
                      .value,
                }
              )
            }
          />
        </label>

        <label className="song-meta-field">
          <div>
            Genre
          </div>

          <input
            value={
              song.genre
            }
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  genre:
                    event.target
                      .value,
                }
              )
            }
          />
        </label>

        <label className="song-meta-field">
          <div>
            Key
          </div>

          <input
            value={
              song.key
            }
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  key:
                    event.target
                      .value,
                }
              )
            }
          />
        </label>

        <label className="song-meta-field">
          <div>
            Tempo (BPM)
          </div>

          <input
            type="number"
            value={
              song.tempo
            }
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  tempo:
                    Number(
                      event.target
                        .value
                    ) || 0,
                }
              )
            }
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
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  timeSignature:
                    event.target
                      .value,
                }
              )
            }
          />
        </label>

        <label className="song-meta-field song-meta-field--notes">
          <div>
            Notes
          </div>

          <textarea
            value={
              song.notes
            }
            onChange={(
              event
            ) =>
              updateSongMetadata(
                {
                  notes:
                    event.target
                      .value,
                }
              )
            }
            rows={3}
          />
        </label>
      </div>
    </Panel>
  );
}
