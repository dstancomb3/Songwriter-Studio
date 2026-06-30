import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import {
  useDroppable,
} from "@dnd-kit/core";

import { CSS } from "@dnd-kit/utilities";

import { useSongStore } from "../../store/songStore";

function SortableItem({
  id,
  title,
  onRemove,
}: {
  id: string;
  title: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id,

    data: {
      type: "arrangement",
    },
  });

  const style = {
    transform:
      CSS.Transform.toString(
        transform
      ),

    transition,

    border: "1px solid gray",

    padding: "0.5rem",

    marginBottom: "0.5rem",

    display: "flex",

    justifyContent:
      "space-between",

    alignItems: "center",
  };

  return (
    <div
      ref={setNodeRef}
      data-arrangement-id={id}
      style={style}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: "grab",
          flex: 1,
        }}
      >
        ☰ {title}
      </div>

      <button
        onClick={onRemove}
        style={{
          marginLeft: "0.5rem",
        }}
      >
        ✕
      </button>
    </div>
  );
}

export function ArrangementPanel() {
  const song = useSongStore(
    (state) => state.currentSong
  );

  const previewInsertIndex =
    useSongStore(
      (state) =>
        state.previewInsertIndex
    );

  const removeArrangementItem =
    useSongStore(
      (state) =>
        state.removeArrangementItem
    );

  const {
    setNodeRef,
  } = useDroppable({
    id: "arrangement-container",

    data: {
      type:
        "arrangement-container",
    },
  });

  if (!song) {
    return null;
  }

  const arrangement =
    song.arrangements[0];

  if (!arrangement) {
    return null;
  }

  const items =
    arrangement.sequence.map(
      (item) => {
        const section =
          song.sections.find(
            (s) =>
              s.id === item.sectionId
          );

        return {
          id: item.id,

          title:
            section?.title ??
            item.sectionId,
        };
      }
    );

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: "400px",
      }}
    >
      <h2>Arrangement</h2>

      <SortableContext
        items={items.map(
          (item) => item.id
        )}
        strategy={
          verticalListSortingStrategy
        }
      >
        {items.length === 0 && (
          <div
            style={{
              height: "120px",

              border:
                "2px dashed #4f46e5",

              borderRadius: "6px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",
            }}
          >
            Drag a section here
          </div>
        )}

        {items.map(
          (item, index) => (
            <div key={item.id}>
              {previewInsertIndex ===
                index && (
                <div
                  style={{
                    height: "40px",

                    border:
                      "2px dashed #4f46e5",

                    marginBottom:
                      "0.5rem",

                    borderRadius:
                      "4px",
                  }}
                />
              )}

              <SortableItem
                id={item.id}
                title={item.title}
                onRemove={() =>
                  removeArrangementItem(
                    index
                  )
                }
              />
            </div>
          )
        )}

        {previewInsertIndex ===
          items.length && (
          <div
            style={{
              height: "40px",

              border:
                "2px dashed #4f46e5",

              borderRadius:
                "4px",
            }}
          />
        )}
      </SortableContext>
    </div>
  );
}