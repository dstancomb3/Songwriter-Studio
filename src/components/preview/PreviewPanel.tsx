import { useSongStore } from "../../store/songStore";

export function PreviewPanel() {
  const song = useSongStore((state) => state.currentSong);

  if (!song) return null;

  const arrangement = song.arrangements[0];

  if (!arrangement) return null;

  return (
    <div>
      <h2>Preview</h2>

      {arrangement.sequence.map((item, index) => {
        const section = song.sections.find(
          (s) => s.id === item.sectionId
        );

        if (!section) return null;

        const version = section.versions.find(
          (v) => v.id === section.activeVersionId
        );

        if (!version) return null;

        return (
          <div key={index}>
            <h3>[{section.title}]</h3>

            <pre>{version.lyrics}</pre>
          </div>
        );
      })}
    </div>
  );
}