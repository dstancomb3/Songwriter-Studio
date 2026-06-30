import { useState } from "react";

import { useDraggable } from "@dnd-kit/core";

import { useSongStore } from "../../store/songStore";

import type {
  SectionType,
} from "../../types";

function DraggableSection({
  id,
  title,
  selected,
  onSelect,
  onRename,
  onDelete,
}: {
  id: string;
  title: string;
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
      style={{
        transform:
          transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,

        border: selected
          ? "2px solid #4f46e5"
          : "1px solid gray",

        marginBottom: "0.75rem",

        padding: "0.5rem",

        opacity:
          transform ? 0.5 : 1,

        backgroundColor: "",

        position: "relative",

        zIndex:
          transform ? 1000 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <div
          {...listeners}
          {...attributes}
          style={{
            cursor: "grab",
            marginRight: "0.5rem",
            userSelect: "none",
          }}
        >
          ☰
        </div>

        <input
          value={title}
          onChange={(e) =>
            onRename(e.target.value)
          }
          onClick={onSelect}
          style={{
            cursor: "text",
            background: "transparent",
            border: "none",
            flex: 1,
            font: "inherit",
            margin: 0,
            outline: "none",
            padding: 0,
            width: "100%",
          }}
        />
      </div>

      <button
        onClick={onDelete}
        style={{
          width: "100%",
        }}
      >
        Delete
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

  return (
    <div>
      <h2>Sections</h2>

      <select
        value={newType}
        onChange={(e) =>
          setNewType(
            e.target.value as SectionType
          )
        }
        style={{
          width: "100%",
          marginBottom: "0.5rem",
        }}
      >
        <option value="intro">
          Intro
        </option>

        <option value="verse">
          Verse
        </option>

        <option value="pre-chorus">
          Pre-Chorus
        </option>

        <option value="chorus">
          Chorus
        </option>

        <option value="post-chorus">
          Post-Chorus
        </option>

        <option value="bridge">
          Bridge
        </option>

        <option value="hook">
          Hook
        </option>

        <option value="outro">
          Outro
        </option>

        <option value="custom">
          Custom
        </option>
      </select>

      <button
        onClick={() =>
          createSection(newType)
        }
        style={{
          width: "100%",
          marginBottom: "1rem",
          padding: "0.5rem",
        }}
      >
        Create Section
      </button>

      {song?.sections.map(
        (section) => (
          <DraggableSection
            key={section.id}
            id={section.id}
            title={section.title}
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
  );
}