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
import { Panel } from "../ui/Panel";

import {
  getSectionColors,
} from "../../constants/sectionColors";

function SortableItem({
  id,
  title,
  accentColor,
  onRemove,
}: {
  id: string;
  title: string;
  accentColor: string;
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

    borderLeft: `5px solid ${accentColor}`,

    padding: "0.375rem",

    marginBottom: "0.375rem",

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
          marginLeft: "0.375rem",
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

  const sectionColors =
    getSectionColors(
      song.settings.sectionColors
    );

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

          accentColor:
            section
              ? sectionColors[section.type]
              : sectionColors.custom,
        };
      }
    );

  return (
    <Panel title="Arrangement">
      <div
        ref={setNodeRef}
        style={{
          minHeight: "300px",
        }}
      >
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
              height: "90px",

              border:
                "2px dashed #4f46e5",

              borderRadius: "4px",

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
                    height: "30px",

                    border:
                      "2px dashed #4f46e5",

                    marginBottom:
                      "0.375rem",

                    borderRadius:
                      "3px",
                  }}
                />
              )}

              <SortableItem
                id={item.id}
                title={item.title}
                accentColor={
                  item.accentColor
                }
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
              height: "30px",

              border:
                "2px dashed #4f46e5",

              borderRadius:
                "3px",
            }}
          />
        )}
      </SortableContext>
      </div>
    </Panel>
  );
}