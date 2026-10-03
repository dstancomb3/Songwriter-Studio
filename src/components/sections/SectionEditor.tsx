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

  if (!song) {
    return null;
  }

  if (!selectedSectionId) {
    return (
      <Panel title="Context">
        <div className="context-overview">
          <div className="context-overview__label">
            Song overview
          </div>

          <div className="context-stat-grid">
            <div className="context-stat">
              <strong>{song.sections.length}</strong>
              <span>Sections</span>
            </div>
            <div className="context-stat">
              <strong>
                {song.arrangements[0]?.sequence.length ?? 0}
              </strong>
              <span>Blocks</span>
            </div>
          </div>

          <div className="context-hint">
            Select a section to manage versions and section settings. Edit lyrics directly on the writing page.
          </div>
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
    <Panel title="Context">
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
        <div>
          <strong>{section.title}</strong>
          <div className="context-section-type">
            {section.type}
          </div>
        </div>
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

      <div className="context-divider" />

      <div className="context-hint">
        Lyrics are edited directly in the Write canvas. Changes are saved to this active version automatically.
      </div>
    </Panel>
  );
}
