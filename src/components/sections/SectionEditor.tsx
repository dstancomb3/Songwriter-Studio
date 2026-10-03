import { useSongStore } from "../../store/songStore";
import { Panel } from "../ui/Panel";

import {
  getSectionColors,
} from "../../constants/sectionColors";

export function SectionEditor() {
  const song = useSongStore(
    (state) => state.currentSong
  );

  const selectedSectionId =
    useSongStore(
      (state) =>
        state.selectedSectionId
    );

  const updateLyrics =
    useSongStore(
      (state) =>
        state.updateLyrics
    );

  const setActiveVersion =
    useSongStore(
      (state) =>
        state.setActiveVersion
    );

  const createVersion =
    useSongStore(
      (state) =>
        state.createVersion
    );

  const duplicateVersion =
    useSongStore(
      (state) =>
        state.duplicateVersion
    );

  const renameVersion =
    useSongStore(
      (state) =>
        state.renameVersion
    );

  const deleteVersion =
    useSongStore(
      (state) =>
        state.deleteVersion
    );

  const updateSectionColor =
    useSongStore(
      (state) =>
        state.updateSectionColor
    );

  if (
    !song ||
    !selectedSectionId
  ) {
    return (
      <Panel title="Editor">
        <p>
          Select a section.
        </p>
      </Panel>
    );
  }

  const section =
    song.sections.find(
      (s) =>
        s.id ===
        selectedSectionId
    );

  if (!section) {
    return null;
  }

  const version =
    section.versions.find(
      (v) =>
        v.id ===
        section.activeVersionId
    );

  if (!version) {
    return null;
  }

  const sectionColors =
    getSectionColors(
      song.settings.sectionColors
    );

  return (
    <Panel title="Editor">
      <hr />

      <div
        style={{
          marginBottom: "0.75rem",
        }}
      >
        <label>
          Version
        </label>

        <select
          value={
            section.activeVersionId
          }
          onChange={(e) =>
            setActiveVersion(
              section.id,
              e.target.value
            )
          }
          style={{
            width: "100%",
            marginTop: "0.2rem",
            marginBottom:
              "0.56rem",
          }}
        >
          {section.versions.map(
            (version) => (
              <option
                key={version.id}
                value={version.id}
              >
                {version.name}
              </option>
            )
          )}
        </select>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "0.5rem",
            marginBottom:
              "0.56rem",
          }}
        >
          <span>Section Color</span>
          <input
            type="color"
            value={
              sectionColors[section.type]
            }
            onChange={(e) =>
              updateSectionColor(
                section.type,
                e.target.value
              )
            }
            style={{
              width: "44px",
              height: "28px",
              padding: 0,
              border: "none",
              background: "transparent",
            }}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "0.375rem",
          }}
        >
          <button
            onClick={() =>
              createVersion(
                section.id
              )
            }
          >
            New Version
          </button>

          <button
            onClick={() =>
              duplicateVersion(
                section.id
              )
            }
          >
            Duplicate
          </button>

          <button
            onClick={() => {
              const newName =
                window.prompt(
                  "Rename version",
                  version.name
                );

              if (!newName) {
                return;
              }

              renameVersion(
                section.id,
                version.id,
                newName
              );
            }}
          >
            Rename
          </button>

          <button
            onClick={() => {
              if (
                !window.confirm(
                  "Delete this version?"
                )
              ) {
                return;
              }

              deleteVersion(
                section.id,
                version.id
              );
            }}
            disabled={
              section.versions.length ===
              1
            }
          >
            Delete
          </button>
        </div>
      </div>

      <hr />

      <h3>Lyrics</h3>

      <textarea
        value={version.lyrics}
        onChange={(e) =>
          updateLyrics(
            section.id,
            e.target.value
          )
        }
        rows={11}
        style={{
          width: "100%",
        }}
      />
    </Panel>
  );
}