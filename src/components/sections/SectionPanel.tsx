import { useSongStore } from "../../store/songStore";

export function SectionPanel() {
const song = useSongStore(
(state) => state.currentSong
);

const selectedSectionId = useSongStore(
(state) => state.selectedSectionId
);

const setSelectedSection = useSongStore(
(state) => state.setSelectedSection
);

const createSection = useSongStore(
(state) => state.createSection
);

const deleteSection = useSongStore(
(state) => state.deleteSection
);

const addSectionToArrangement =
useSongStore(
(state) =>
state.addSectionToArrangement
);

return ( <div> <h2>Sections</h2>


  <button
    onClick={() =>
      createSection()
    }
    style={{
      width: "100%",
      marginBottom: "1rem",
      padding: "0.5rem",
    }}
  >
    + Add Section
  </button>

  {song?.sections.map(
    (section) => (
      <div
        key={section.id}
        style={{
          border:
            selectedSectionId ===
            section.id
              ? "2px solid #4f46e5"
              : "1px solid gray",

          marginBottom:
            "0.75rem",

          padding: "0.5rem",
        }}
      >
        <div
          onClick={() =>
            setSelectedSection(
              section.id
            )
          }
          style={{
            cursor: "pointer",
            marginBottom:
              "0.5rem",
          }}
        >
          {section.title}
        </div>

        <button
          onClick={() =>
            addSectionToArrangement(
              section.id
            )
          }
          style={{
            width: "100%",
            marginBottom:
              "0.5rem",
          }}
        >
          Add To Arrangement
        </button>

        <button
          onClick={() =>
            deleteSection(
              section.id
            )
          }
          style={{
            width: "100%",
          }}
        >
          Delete
        </button>
      </div>
    )
  )}
</div>


);
}
