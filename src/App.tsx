import { useEffect } from "react";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import { useSongStore } from "./store/songStore";
import { sampleSong } from "./data/sampleSong";

import {
  loadSong,
  saveSong,
} from "./services/songPersistence";

import { Toolbar } from "./components/Toolbar";

import { SectionPanel } from "./components/sections/SectionPanel";
import { SectionEditor } from "./components/sections/SectionEditor";
import { ArrangementPanel } from "./components/arrangement/ArrangementPanel";
import { SongPanel } from "./components/songpanel";
import { PreviewPanel } from "./components/preview/PreviewPanel";

function App() {
  const song = useSongStore(
    (state) => state.currentSong
  );

  const setCurrentSong = useSongStore(
    (state) => state.setCurrentSong
  );

  const moveArrangementItem =
    useSongStore(
      (state) =>
        state.moveArrangementItem
    );

  const insertSectionIntoArrangement =
    useSongStore(
      (state) =>
        state.insertSectionIntoArrangement
    );

  const setPreviewInsertIndex =
    useSongStore(
      (state) =>
        state.setPreviewInsertIndex
    );

  const sensors = useSensors(
    useSensor(
      PointerSensor,
      {
        activationConstraint: {
          distance: 8,
        },
      }
    )
  );

  useEffect(() => {
    const savedSong =
      loadSong();

    if (savedSong) {
      setCurrentSong(
        savedSong
      );
    } else {
      setCurrentSong(
        sampleSong
      );
    }
  }, [setCurrentSong]);

  useEffect(() => {
    if (!song) {
      return;
    }

    saveSong(song);
  }, [song]);

  function handleDragOver(
    event: DragOverEvent
  ) {
    const { active, over } = event;

    if (!over) {
      setPreviewInsertIndex(null);
      return;
    }

    const activeType =
      active.data.current?.type;

    if (
      activeType !== "section"
    ) {
      setPreviewInsertIndex(null);
      return;
    }

    const currentSong =
      useSongStore.getState()
        .currentSong;

    if (!currentSong) {
      return;
    }

    const arrangement =
      currentSong.arrangements[0];

    if (!arrangement) {
      return;
    }

    const overType =
      over.data.current?.type;

    if (
      overType === "arrangement"
    ) {
      const index =
        arrangement.sequence.findIndex(
          (item) =>
            item.id === over.id
        );

      if (index === -1) {
        return;
      }

      const element =
        document.querySelector(
          `[data-arrangement-id="${over.id}"]`
        );

      if (!element) {
        return;
      }

      const rect =
        element.getBoundingClientRect();

      const pointerY =
        active.rect.current
          .translated?.top ?? 0;

      const midpoint =
        rect.top +
        rect.height / 2;

      const insertIndex =
        pointerY > midpoint
          ? index + 1
          : index;

      setPreviewInsertIndex(
        insertIndex
      );

      return;
    }

    if (
      overType ===
      "arrangement-container"
    ) {
      if (
        arrangement.sequence.length ===
        0
      ) {
        setPreviewInsertIndex(0);
        return;
      }

      const lastItem =
        arrangement.sequence[
          arrangement.sequence.length - 1
        ];

      const element =
        document.querySelector(
          `[data-arrangement-id="${lastItem.id}"]`
        );

      if (!element) {
        return;
      }

      const rect =
        element.getBoundingClientRect();

      const pointerY =
        active.rect.current
          .translated?.top ?? 0;

      if (pointerY > rect.bottom) {
        setPreviewInsertIndex(
          arrangement.sequence.length
        );
      }

      return;
    }

    setPreviewInsertIndex(null);
  }

  function handleDragEnd(
    event: DragEndEvent
  ) {
    const { active, over } = event;

    const previewInsertIndex =
      useSongStore.getState()
        .previewInsertIndex;

    setPreviewInsertIndex(
      null
    );

    if (!over) {
      return;
    }

    const currentSong =
      useSongStore.getState()
        .currentSong;

    if (!currentSong) {
      return;
    }

    const arrangement =
      currentSong.arrangements[0];

    if (!arrangement) {
      return;
    }

    const activeType =
      active.data.current?.type;

    const overType =
      over.data.current?.type;

    if (
      activeType === "arrangement"
    ) {
      if (
        overType !== "arrangement"
      ) {
        return;
      }

      const oldIndex =
        arrangement.sequence.findIndex(
          (item) =>
            item.id === active.id
        );

      const newIndex =
        arrangement.sequence.findIndex(
          (item) =>
            item.id === over.id
        );

      if (
        oldIndex === -1 ||
        newIndex === -1
      ) {
        return;
      }

      moveArrangementItem(
        oldIndex,
        newIndex
      );

      return;
    }

    if (
      activeType === "section"
    ) {
      const sectionId =
        active.data.current
          ?.sectionId;

      if (!sectionId) {
        return;
      }

      if (
        previewInsertIndex ===
        null
      ) {
        return;
      }

      insertSectionIntoArrangement(
        sectionId,
        previewInsertIndex
      );
    }
  }

  return (
    <>
      <Toolbar />

      <DndContext
        sensors={sensors}
        collisionDetection={
          closestCenter
        }
        onDragOver={
          handleDragOver
        }
        onDragEnd={
          handleDragEnd
        }
      >
        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "300px 250px 1fr 250px 2fr",

            transform: "scale(0.5)",

            transformOrigin: "top left",

            gap: "1rem",

            padding: "1rem",

            minHeight: "100vh",
          }}
        >
          <SongPanel />

          <SectionPanel />

          <SectionEditor />

          <ArrangementPanel />

          <PreviewPanel />
        </div>
      </DndContext>
    </>
  );
}

export default App;