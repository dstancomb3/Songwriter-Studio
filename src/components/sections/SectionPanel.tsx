import { useState } from "react";

import { useDraggable } from "@dnd-kit/core";

import { useSongStore } from "../../store/songStore";
import { Panel } from "../ui/Panel";

import {
  getSectionColors,
} from "../../constants/sectionColors";

import type {
  SectionType,
} from "../../types";

function DraggableSection({
  id,
  title,
  accentColor,
  selected,
  onSelect,
  onRename,
  onDelete,
}: {
  id: string;
  title: string;
  accentColor: string;
  selected: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: `section-${id}`,
    data: {
      type: "section",
      sectionId: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={
        selected
          ? "section-card section-card--selected"
          : "section-card"
      }
      style={{
        transform:
          transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        borderLeftColor: accentColor,
        opacity: transform ? 0.58 : 1,
        zIndex: transform ? 1000 : 1,
      }}
      onClick={onSelect}
    >
      <button
        type="button"
        className="section-card__drag"
        {...listeners}
        {...attributes}
        aria-label={`Drag ${title}`}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        ⠿
      </button>

      <input
        className="section-card__name"
        value={title}
        onChange={(event) =>
          onRename(event.target.value)
        }
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      />

      <button
        type="button"
        className="section-card__delete"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete ${title}`}
        title="Delete section"
      >
        ×
      </button>
    </div>
  );
}

export function SectionPanel() {
  const [newType, setNewType] =
    useState<SectionType>("verse");

  const song = useSongStore(
    (state) => state.currentSong
  );

  const selectedSectionId =
    useSongStore(
      (state) =>
        state.selectedSectionId
    );

  const setSelectedSection =
    useSongStore(
      (state) =>
        state.setSelectedSection
    );

  const createSection =
    useSongStore(
      (state) => state.createSection
    );

  const renameSection =
    useSongStore(
      (state) => state.renameSection
    );

  const deleteSection =
    useSongStore(
      (state) => state.deleteSection
    );

  const sectionColors =
    getSectionColors(
      song?.settings.sectionColors
    );

  return (
    <Panel title="Sections">
      <div className="section-create-row">
        <select
          value={newType}
          onChange={(event) =>
            setNewType(
              event.target.value as SectionType
            )
          }
          aria-label="Section type"
        >
          <option value="intro">Intro</option>
          <option value="verse">Verse</option>
          <option value="pre-chorus">Pre-Chorus</option>
          <option value="chorus">Chorus</option>
          <option value="post-chorus">Post-Chorus</option>
          <option value="bridge">Bridge</option>
          <option value="hook">Hook</option>
          <option value="outro">Outro</option>
          <option value="custom">Custom</option>
        </select>

        <button
          type="button"
          className="section-create-button"
          onClick={() =>
            createSection(newType)
          }
          title="Create section"
        >
          +
        </button>
      </div>

      <div className="section-card-list">
        {song?.sections.map(
          (section) => (
            <DraggableSection
              key={section.id}
              id={section.id}
              title={section.title}
              accentColor={
                sectionColors[section.type]
              }
              selected={
                selectedSectionId ===
                section.id
              }
              onSelect={() =>
                setSelectedSection(
                  section.id
                )
              }
              onRename={(title) =>
                renameSection(
                  section.id,
                  title
                )
              }
              onDelete={() =>
                deleteSection(
                  section.id
                )
              }
            />
          )
        )}
      </div>
    </Panel>
  );
}
