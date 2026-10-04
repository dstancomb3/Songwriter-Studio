import {
  SortableContext,
  horizontalListSortingStrategy,
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
  expanded = false,
}: {
  id: string;
  title: string;
  accentColor: string;
  onRemove: () => void;
  expanded?: boolean;
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
      axis: "horizontal",
    },
  });

  return (
    <div
      ref={setNodeRef}
      data-arrangement-id={id}
      className={
        expanded
          ? "arrangement-item arrangement-item--horizontal arrangement-item--expanded"
          : "arrangement-item arrangement-item--horizontal"
      }
      style={{
        transform:
          CSS.Transform.toString(
            transform
          ),
        transition,
        borderTopColor: accentColor,
      }}
    >
      <button
        type="button"
        className="arrangement-item__drag"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${title}`}
      >
        ⠿
      </button>

      <span className="arrangement-item__title">
        {title}
      </span>

      <button
        type="button"
        className="arrangement-item__remove"
        onClick={onRemove}
        aria-label={`Remove ${title} from arrangement`}
        title="Remove from arrangement"
      >
        ×
      </button>
    </div>
  );
}

export function ArrangementPanel({
  expanded = false,
}: {
  expanded?: boolean;
}) {
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
      axis:
        "horizontal",
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
            (candidate) =>
              candidate.id ===
              item.sectionId
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
        className={
          expanded
            ? "arrangement-track arrangement-track--expanded"
            : "arrangement-track"
        }
      >
        <SortableContext
          items={items.map(
            (item) => item.id
          )}
          strategy={
            horizontalListSortingStrategy
          }
        >
          {items.length === 0 && (
            <div className="arrangement-empty arrangement-empty--horizontal">
              Drag a section here
            </div>
          )}

          {items.map(
            (item, index) => (
              <div
                key={item.id}
                className="arrangement-slot"
              >
                {previewInsertIndex ===
                  index && (
                  <div className="arrangement-drop-target arrangement-drop-target--horizontal" />
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
                  expanded={expanded}
                />
              </div>
            )
          )}

          {previewInsertIndex ===
            items.length && (
            <div className="arrangement-drop-target arrangement-drop-target--horizontal" />
          )}
        </SortableContext>
      </div>
    </Panel>
  );
}
