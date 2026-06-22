import { useSongStore } from "../../store/songStore";

export function ArrangementPanel() {
const song = useSongStore(
(state) => state.currentSong
);

if (!song) {
return null;
}

const arrangement = song.arrangements[0];

if (!arrangement) {
return null;
}

return ( <div> <h2>Arrangement</h2>


  {arrangement.sequence.map(
    (item, index) => {
      const section =
        song.sections.find(
          (s) =>
            s.id === item.sectionId
        );

      return (
        <div
          key={index}
          style={{
            border:
              "1px solid gray",
            padding: "0.5rem",
            marginBottom:
              "0.5rem",
          }}
        >
          {section?.title ??
            item.sectionId}
        </div>
      );
    }
  )}
</div>


);
}
