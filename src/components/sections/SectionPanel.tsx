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

import {
  saveSafetySnapshot,
} from "../../services/versionHistory";

import {
  useStudioModal,
} from "../ui/StudioModalProvider";

import {
  StudioContextMenu,
} from "../ui/StudioContextMenu";

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
  onRename: () => void;
  onDelete: () => void;
}) {
  const [
    menu,
    setMenu,
  ] = useState<
    | {
        x: number;
        y: number;
      }
    | null
  >(null);

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
    <>
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
          borderLeftColor:
            accentColor,
          opacity:
            transform
              ? 0.58
              : 1,
          zIndex:
            transform
              ? 1000
              : 1,
        }}
        onClick={onSelect}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRename();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();

          onSelect();

          setMenu({
            x:
              event.clientX,
            y:
              event.clientY,
          });
        }}
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
          title="Drag into Write"
        >
          ⠿
        </button>

        <button
          type="button"
          className="section-card__name-button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRename();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();

            onSelect();

            setMenu({
              x:
                event.clientX,
              y:
                event.clientY,
            });
          }}
          title="Double-click to rename"
        >
          {title}
        </button>
      </div>

      {menu && (
        <StudioContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() =>
            setMenu(null)
          }
          items={[
            {
              id: "rename",
              label:
                "Rename section",
              onSelect:
                onRename,
            },
            {
              id: "delete",
              label:
                "Delete section everywhere",
              danger: true,
              onSelect:
                onDelete,
            },
          ]}
        />
      )}
    </>
  );
}

export function SectionPanel() {
  const {
    confirm,
    prompt,
    notify,
  } = useStudioModal();

  const [
    newType,
    setNewType,
  ] =
    useState<SectionType>(
      "verse"
    );

  const song =
    useSongStore(
      (state) =>
        state.currentSong
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
      (state) =>
        state.createSection
    );

  const renameSection =
    useSongStore(
      (state) =>
        state.renameSection
    );

  const deleteSection =
    useSongStore(
      (state) =>
        state.deleteSection
    );

  const sectionColors =
    getSectionColors(
      song?.settings
        .sectionColors
    );

  async function rename(
    sectionId: string,
    currentTitle: string
  ) {
    const nextTitle =
      await prompt({
        title:
          "Rename section",
        message:
          "Choose a name for this section.",
        initialValue:
          currentTitle,
        confirmLabel:
          "Rename",
      });

    if (!nextTitle) {
      return;
    }

    renameSection(
      sectionId,
      nextTitle
    );
  }

  async function removeSection(
    sectionId: string,
    title: string
  ) {
    if (!song) {
      return;
    }

    const approved =
      await confirm({
        title:
          "Delete section?",
        message:
          "This removes the section and every occurrence of it from the song. A safety snapshot will be saved first.",
        confirmLabel:
          "Delete section",
        tone:
          "danger",
      });

    if (!approved) {
      return;
    }

    saveSafetySnapshot(
      song,
      "Before deleting " +
        title,
      "Automatic safety snapshot before deleting a section."
    );

    deleteSection(
      sectionId
    );

    notify({
      title:
        "Section deleted",
      message:
        "A safety snapshot was saved in Versions.",
      tone:
        "success",
    });
  }

  return (
    <Panel title="Sections">
      <div className="section-create-row">
        <select
          value={newType}
          onChange={(event) =>
            setNewType(
              event.target
                .value as SectionType
            )
          }
          aria-label="Section type"
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
          type="button"
          className="section-create-button"
          onClick={() =>
            createSection(
              newType
            )
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
              key={
                section.id
              }
              id={
                section.id
              }
              title={
                section.title
              }
              accentColor={
                sectionColors[
                  section.type
                ]
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
              onRename={() =>
                void rename(
                  section.id,
                  section.title
                )
              }
              onDelete={() =>
                void removeSection(
                  section.id,
                  section.title
                )
              }
            />
          )
        )}
      </div>
    </Panel>
  );
}
