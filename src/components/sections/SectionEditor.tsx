import { useSongStore } from "../../store/songStore";

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

  if (
    !song ||
    !selectedSectionId
  ) {
    return (
      <div>
        <h2>Editor</h2>
        <p>
          Select a section.
        </p>
      </div>
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

  return (
    <div>
      <h2>{section.title}</h2>

      <hr />

      <div
        style={{
          marginBottom: "1rem",
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
            marginTop: "0.25rem",
            marginBottom:
              "0.75rem",
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "0.5rem",
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
        rows={14}
        style={{
          width: "100%",
        }}
      />
    </div>
  );
}