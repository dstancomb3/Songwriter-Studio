import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
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

import { SectionPanel } from "./components/sections/SectionPanel";
import { SectionEditor } from "./components/sections/SectionEditor";
import { ArrangeWorkspace } from "./components/arrangement/ArrangeWorkspace";
import { SongPanel } from "./components/songpanel";
import { PreviewPanel } from "./components/preview/PreviewPanel";
import { VersionsWorkspace } from "./components/versions/VersionsWorkspace";
import { ExploreWorkspace } from "./components/explore/ExploreWorkspace";

type Workspace =
  | "write"
  | "arrange"
  | "explore"
  | "versions";

function App() {
  const [workspace, setWorkspace] =
    useState<Workspace>("write");

  const [
    dragActive,
    setDragActive,
  ] = useState(false);

  const [
    saveStatus,
    setSaveStatus,
  ] = useState<
    "saved" |
    "saving" |
    "error"
  >("saved");

  const [
    saveError,
    setSaveError,
  ] = useState<
    string | null
  >(null);

  const dragPointerStart =
    useRef<
      | {
          x: number;
          y: number;
        }
      | null
    >(null);
  const song = useSongStore(
    (state) => state.currentSong
  );

  const canUndo = useSongStore(
    (state) => state.canUndo
  );

  const canRedo = useSongStore(
    (state) => state.canRedo
  );

  const undo = useSongStore(
    (state) => state.undo
  );

  const redo = useSongStore(
    (state) => state.redo
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

  function handleDragStart(
    event: DragStartEvent
  ) {
    setDragActive(true);

    const activator =
      event.activatorEvent;

    if (
      activator instanceof
      MouseEvent
    ) {
      dragPointerStart.current = {
        x:
          activator.clientX,
        y:
          activator.clientY,
      };
    } else {
      dragPointerStart.current =
        null;
    }
  }

  function handleDragMove(
    event: DragMoveEvent
  ) {
    if (
      workspace !== "write"
    ) {
      return;
    }

    const activeType =
      event.active.data.current
        ?.type;

    if (
      activeType !== "section"
    ) {
      return;
    }

    const start =
      dragPointerStart.current;

    if (!start) {
      return;
    }

    const pointer = {
      x:
        start.x +
        event.delta.x,
      y:
        start.y +
        event.delta.y,
    };

    const surface =
      document.querySelector<HTMLElement>(
        '[data-write-arrangement-surface="true"]'
      );

    if (!surface) {
      setPreviewInsertIndex(
        null
      );
      return;
    }

    const surfaceRect =
      surface.getBoundingClientRect();

    const insideSurface =
      pointer.x >=
        surfaceRect.left &&
      pointer.x <=
        surfaceRect.right &&
      pointer.y >=
        surfaceRect.top &&
      pointer.y <=
        surfaceRect.bottom;

    if (!insideSurface) {
      setPreviewInsertIndex(
        null
      );
      return;
    }

    const currentSong =
      useSongStore.getState()
        .currentSong;

    const arrangement =
      currentSong
        ?.arrangements[0];

    if (!arrangement) {
      setPreviewInsertIndex(
        null
      );
      return;
    }

    let insertIndex =
      arrangement.sequence.length;

    for (
      let index = 0;
      index <
      arrangement.sequence.length;
      index += 1
    ) {
      const item =
        arrangement.sequence[
          index
        ];

      const element =
        surface.querySelector<HTMLElement>(
          `[data-arrangement-id="${item.id}"]`
        );

      if (!element) {
        continue;
      }

      const rect =
        element.getBoundingClientRect();

      const midpoint =
        rect.top +
        rect.height / 2;

      if (
        pointer.y <
        midpoint
      ) {
        insertIndex =
          index;
        break;
      }
    }

    setPreviewInsertIndex(
      insertIndex
    );
  }

  function clearDragState() {
    setDragActive(false);
    dragPointerStart.current =
      null;
    setPreviewInsertIndex(
      null
    );
  }

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

    setSaveStatus(
      "saving"
    );

    const result =
      saveSong(song);

    if (result.ok) {
      setSaveStatus(
        "saved"
      );

      setSaveError(
        null
      );

      return;
    }

    setSaveStatus(
      "error"
    );

    setSaveError(
      result.error
    );
  }, [song]);

  useEffect(() => {
    function handleUndoRedo(
      event: KeyboardEvent
    ) {
      if (
        !event.ctrlKey &&
        !event.metaKey
      ) {
        return;
      }

      const key =
        event.key.toLowerCase();

      const wantsUndo =
        key === "z" &&
        !event.shiftKey;

      const wantsRedo =
        key === "y" ||
        (
          key === "z" &&
          event.shiftKey
        );

      if (
        !wantsUndo &&
        !wantsRedo
      ) {
        return;
      }

      event.preventDefault();

      if (wantsUndo) {
        undo();
        return;
      }

      redo();
    }

    window.addEventListener(
      "keydown",
      handleUndoRedo
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleUndoRedo
      );
  }, [undo, redo]);

  function handleDragOver(
    event: DragOverEvent
  ) {
    if (
      workspace === "write"
    ) {
      return;
    }

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
      overType ===
      "arrangement-edge"
    ) {
      const edgeIndex =
        over.data.current?.index;

      if (
        typeof edgeIndex ===
        "number"
      ) {
        setPreviewInsertIndex(
          edgeIndex
        );
      }

      return;
    }

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

      const axis =
        over.data.current?.axis ??
        "horizontal";

      const translated =
        active.rect.current
          .translated;

      const pointerPosition =
        axis === "vertical"
          ? (
              translated?.top ??
              0
            ) +
            (
              translated?.height ??
              0
            ) /
              2
          : (
              translated?.left ??
              0
            ) +
            (
              translated?.width ??
              0
            ) /
              2;

      const midpoint =
        axis === "vertical"
          ? rect.top +
            rect.height / 2
          : rect.left +
            rect.width / 2;

      const insertIndex =
        pointerPosition >
        midpoint
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

      const axis =
        over.data.current?.axis ??
        "horizontal";

      const translated =
        active.rect.current
          .translated;

      const pointerPosition =
        axis === "vertical"
          ? (
              translated?.top ??
              0
            ) +
            (
              translated?.height ??
              0
            ) /
              2
          : (
              translated?.left ??
              0
            ) +
            (
              translated?.width ??
              0
            ) /
              2;

      const boundary =
        axis === "vertical"
          ? rect.bottom
          : rect.right;

      if (
        pointerPosition >
        boundary
      ) {
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

    setDragActive(false);
    dragPointerStart.current =
      null;

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
      const oldIndex =
        arrangement.sequence.findIndex(
          (item) =>
            item.id === active.id
        );

      if (
        oldIndex === -1
      ) {
        return;
      }

      if (
        overType ===
        "arrangement-edge"
      ) {
        const edgeIndex =
          over.data.current
            ?.index;

        if (
          typeof edgeIndex !==
          "number"
        ) {
          return;
        }

        const targetIndex =
          edgeIndex <= 0
            ? 0
            : arrangement.sequence.length -
              1;

        moveArrangementItem(
          oldIndex,
          targetIndex
        );

        return;
      }

      if (
        overType !==
        "arrangement"
      ) {
        return;
      }

      const newIndex =
        arrangement.sequence.findIndex(
          (item) =>
            item.id === over.id
        );

      if (
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
    <DndContext
      sensors={sensors}
      collisionDetection={
        closestCenter
      }
      onDragStart={
        handleDragStart
      }
      onDragMove={
        handleDragMove
      }
      onDragOver={
        handleDragOver
      }
      onDragCancel={
        clearDragState
      }
      onDragEnd={
        handleDragEnd
      }
    >
      <div
        className={
          dragActive
            ? "app-shell app-shell--dragging"
            : "app-shell"
        }
      >
        <div className="studio-header">
          <div className="studio-brand">
            <div className="studio-logo" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <strong>Songwriter Studio</strong>
          </div>

          <nav className="studio-nav" aria-label="Workspace">
            <button
              type="button"
              className={
                workspace === "write"
                  ? "studio-nav__item studio-nav__item--active"
                  : "studio-nav__item"
              }
              onClick={() =>
                setWorkspace("write")
              }
            >
              Write
            </button>

            <button
              type="button"
              className={
                workspace === "arrange"
                  ? "studio-nav__item studio-nav__item--active"
                  : "studio-nav__item"
              }
              onClick={() =>
                setWorkspace("arrange")
              }
            >
              Arrange
            </button>

            <button
              type="button"
              className={
                workspace === "explore"
                  ? "studio-nav__item studio-nav__item--active"
                  : "studio-nav__item"
              }
              onClick={() =>
                setWorkspace("explore")
              }
            >
              Explore
            </button>

            <button
              type="button"
              className={
                workspace === "versions"
                  ? "studio-nav__item studio-nav__item--active"
                  : "studio-nav__item"
              }
              onClick={() =>
                setWorkspace("versions")
              }
            >
              Versions
            </button>
          </nav>

          <div className="studio-header__actions">
            <div
              className="studio-history-controls"
              aria-label="Edit history"
            >
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
              >
                ↶
              </button>

              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
              >
                ↷
              </button>
            </div>

            <div
              className={
                "studio-status studio-status--" +
                saveStatus
              }
              title={
                saveStatus ===
                  "error"
                  ? saveError ??
                    "Local save failed."
                  : undefined
              }
            >
              <span className="studio-status__dot" />

              <span>
                {saveStatus ===
                "saving"
                  ? "Saving…"
                  : saveStatus ===
                    "error"
                  ? "Save error"
                  : "Saved locally"}
              </span>
            </div>
          </div>
        </div>

        <div className="song-strip">
          <SongPanel
            onOpenVersions={() =>
              setWorkspace(
                "versions"
              )
            }
            onOpenExplore={() =>
              setWorkspace(
                "explore"
              )
            }
          />
        </div>

        {workspace === "write" ? (
          <div className="workspace-grid">
            <div className="workspace-sections">
              <SectionPanel />
            </div>

            <div className="workspace-preview">
              <PreviewPanel />
            </div>

            <div className="workspace-context">
              <SectionEditor />
            </div>

          </div>
        ) : workspace === "arrange" ? (
          <ArrangeWorkspace
            onOpenWrite={() =>
              setWorkspace("write")
            }
          />
        ) : workspace === "explore" ? (
          <ExploreWorkspace
            onOpenWrite={() =>
              setWorkspace("write")
            }
          />
        ) : (
          <VersionsWorkspace />
        )}
      </div>
    </DndContext>
  );
}

export default App;
