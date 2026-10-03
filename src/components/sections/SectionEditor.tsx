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
        <div className="editor-empty">
          <div className="editor-empty__icon">
            ✎
          </div>
          <div>Select a section to edit.</div>
        </div>
      </Panel>
    );
  }

  const section =
    song.sections.find(
      (candidate) =>
        candidate.id ===
        selectedSectionId
    );

  if (!section) {
    return null;
  }

  const version =
    section.versions.find(
      (candidate) =>
        candidate.id ===
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
      <div className="editor-section-heading">
        <span
          className="editor-section-heading__dot"
          style={{
            background:
              sectionColors[
                section.type
              ],
          }}
        />
        <strong>{section.title}</strong>
      </div>

      <div className="editor-field">
        <label>Version</label>
        <select
          value={
            section.activeVersionId
          }
          onChange={(event) =>
            setActiveVersion(
              section.id,
              event.target.value
            )
          }
        >
          {section.versions.map(
            (item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="editor-color-row">
        <span>Section color</span>
        <input
          type="color"
          value={
            sectionColors[
              section.type
            ]
          }
          onChange={(event) =>
            updateSectionColor(
              section.type,
              event.target.value
            )
          }
          aria-label="Section color"
        />
      </div>

      <div className="editor-action-grid">
        <button
          type="button"
          onClick={() =>
            createVersion(
              section.id
            )
          }
        >
          New
        </button>

        <button
          type="button"
          onClick={() =>
            duplicateVersion(
              section.id
            )
          }
        >
          Duplicate
        </button>

        <button
          type="button"
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
          type="button"
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

      <div className="editor-field editor-field--lyrics">
        <label>Lyrics</label>
        <textarea
          value={version.lyrics}
          onChange={(event) =>
            updateLyrics(
              section.id,
              event.target.value
            )
          }
          rows={9}
        />
      </div>
    </Panel>
  );
}
