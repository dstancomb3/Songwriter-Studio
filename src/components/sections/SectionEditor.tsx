import { useSongStore } from "../../store/songStore";

export function SectionEditor() {
  const song = useSongStore(
    (state) => state.currentSong
  );

  const selectedSectionId = useSongStore(
    (state) => state.selectedSectionId
  );

  const updateLyrics = useSongStore(
    (state) => state.updateLyrics
  );

  if (!song || !selectedSectionId) {
    return (
      <div>
        <h2>Editor</h2>
        <p>Select a section.</p>
      </div>
    );
  }

  const section = song.sections.find(
    (s) => s.id === selectedSectionId
  );

  if (!section) {
    return null;
  }

  const version = section.versions.find(
    (v) => v.id === section.activeVersionId
  );

  if (!version) {
    return null;
  }

  return (
    <div>
      <h2>{section.title}</h2>

      <textarea
        value={version.lyrics}
        onChange={(e) =>
          updateLyrics(
            section.id,
            e.target.value
          )
        }
        rows={12}
        style={{
          width: "100%",
        }}
      />
    </div>
  );
}