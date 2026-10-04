import {
  Fragment,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useDroppable,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import { useSongStore } from "../../store/songStore";
import { Panel } from "../ui/Panel";

import {
  getSectionColors,
} from "../../constants/sectionColors";

import {
  analyzeLyrics,
} from "../../analysis/lyricsAnalysis";

import {
  saveSafetySnapshot,
} from "../../services/versionHistory";

import {
  useStudioModal,
} from "../ui/StudioModalProvider";

import {
  StudioContextMenu,
} from "../ui/StudioContextMenu";

import type {
  Section,
  SectionVersion,
} from "../../types";

function SortableWriteSection({
  arrangementItemId,
  section,
  version,
  sectionColor,
  isSelected,
  hoveredSectionId,
  setHoveredSectionId,
  setSelectedSection,
  setSelectedLyricLine,
  updateLyrics,
  textareaRefs,
  sectionRefs,
  isFirstOccurrence,
  onRemoveOccurrence,
  onDeleteSection,
}: {
  arrangementItemId: string;
  section: Section;
  version: SectionVersion;
  sectionColor: string;
  isSelected: boolean;
  hoveredSectionId: string | null;
  setHoveredSectionId: (
    id: string | null
  ) => void;
  setSelectedSection: (
    id: string | null
  ) => void;
  setSelectedLyricLine:
    ReturnType<
      typeof useSongStore.getState
    >["setSelectedLyricLine"];
  updateLyrics:
    ReturnType<
      typeof useSongStore.getState
    >["updateLyrics"];
  textareaRefs:
    React.MutableRefObject<
      Record<
        string,
        HTMLTextAreaElement | null
      >
    >;
  sectionRefs:
    React.MutableRefObject<
      Record<
        string,
        HTMLDivElement | null
      >
    >;
  isFirstOccurrence: boolean;
  onRemoveOccurrence: () => void;
  onDeleteSection: () => void;
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
    transition,
    isDragging,
  } = useSortable({
    id:
      arrangementItemId,
    data: {
      type:
        "arrangement",
      axis:
        "vertical",
    },
  });

  const lyricAnalysis =
    analyzeLyrics(
      version.lyrics
    );

  function syncCaretLine(
    lyrics: string,
    element:
      HTMLTextAreaElement
  ) {
    const caret =
      element.selectionStart ??
      0;

    const before =
      lyrics.slice(
        0,
        caret
      );

    const lineIndex =
      before.split(
        /\r?\n/
      ).length - 1;

    const lines =
      lyrics.split(
        /\r?\n/
      );

    let start = 0;

    for (
      let index = 0;
      index < lineIndex;
      index += 1
    ) {
      start +=
        lines[index].length +
        1;
    }

    const text =
      lines[lineIndex] ??
      "";

    setSelectedLyricLine({
      sectionId:
        section.id,
      lineIndex,
      text,
      start,
      end:
        start +
        text.length,
    });
  }

  function resizeTextarea(
    element:
      HTMLTextAreaElement | null
  ) {
    if (!element) {
      return;
    }

    element.style.height =
      "0px";

    element.style.height =
      element.scrollHeight +
      "px";
  }

  return (
    <div
      ref={(element) => {
        setNodeRef(
          element
        );

        if (
          isFirstOccurrence
        ) {
          sectionRefs.current[
            section.id
          ] = element;
        }
      }}
      data-section-id={
        section.id
      }
      data-arrangement-id={
        arrangementItemId
      }
      className={[
        "preview-section",
        isSelected
          ? "preview-section--selected"
          : "",
        isDragging
          ? "preview-section--dragging"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transform:
          CSS.Transform.toString(
            transform
          ),
        transition,
      }}
      onClick={() =>
        setSelectedSection(
          section.id
        )
      }
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();

        setSelectedSection(
          section.id
        );

        setMenu({
          x:
            event.clientX,
          y:
            event.clientY,
        });
      }}
    >
      <div className="preview-section__heading">
        <div className="preview-section__title-group">
          <button
            type="button"
            className="preview-section__drag"
            {...attributes}
            {...listeners}
            aria-label={
              "Move " +
              section.title
            }
            title="Drag to reorder"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            ⠿
          </button>

          <h3
            className="preview-section__title"
            onMouseEnter={() =>
              setHoveredSectionId(
                section.id
              )
            }
            onMouseLeave={() =>
              setHoveredSectionId(
                hoveredSectionId ===
                  section.id
                  ? null
                  : hoveredSectionId
              )
            }
            style={{
              color:
                sectionColor,
              filter:
                hoveredSectionId ===
                section.id
                  ? "brightness(0.82)"
                  : "none",
            }}
          >
            {section.title}
          </h3>
        </div>

        {isSelected &&
          lyricAnalysis.lineCount >
            0 && (
          <div className="preview-section__metrics">
            <span>
              {
                lyricAnalysis.targetSyllables
              }{" "}
              syl
            </span>

            <span>
              {
                lyricAnalysis.rhymeScheme ||
                "—"
              }
            </span>

            <span>
              R{" "}
              {
                lyricAnalysis.rhymeScore
                  .total
              }
            </span>
          </div>
        )}
      </div>

      {isSelected &&
        lyricAnalysis.lines.length >
          0 && (
        <div className="preview-line-guide">
          {lyricAnalysis.lines.map(
            (
              line,
              lineIndex
            ) => (
              <span
                key={
                  lineIndex
                }
                className={
                  "preview-line-guide__chip preview-line-guide__chip--" +
                  line.meterStatus
                }
                title={
                  line.rhymeLabel +
                  " · " +
                  line.syllables +
                  " syllables · " +
                  line.endWord
                }
              >
                {lineIndex + 1}
                {" · "}
                {line.syllables}
                {line.rhymeLabel}
              </span>
            )
          )}
        </div>
      )}

      <textarea
        className="preview-lyrics"
        ref={(element) => {
          textareaRefs.current[
            arrangementItemId
          ] = element;

          resizeTextarea(
            element
          );
        }}
        value={
          version.lyrics
        }
        onChange={(event) => {
          updateLyrics(
            section.id,
            event.target.value
          );

          syncCaretLine(
            event.target.value,
            event.currentTarget
          );
        }}
        onInput={(event) =>
          resizeTextarea(
            event.currentTarget
          )
        }
        onFocus={(event) => {
          setSelectedSection(
            section.id
          );

          syncCaretLine(
            version.lyrics,
            event.currentTarget
          );
        }}
        onClick={(event) => {
          event.stopPropagation();

          syncCaretLine(
            version.lyrics,
            event.currentTarget
          );
        }}
        onKeyUp={(event) =>
          syncCaretLine(
            version.lyrics,
            event.currentTarget
          )
        }
        onSelect={(event) =>
          syncCaretLine(
            version.lyrics,
            event.currentTarget
          )
        }
        rows={1}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();

          setSelectedSection(
            section.id
          );

          setMenu({
            x:
              event.clientX,
            y:
              event.clientY,
          });
        }}
      />

      {menu && (
        <StudioContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() =>
            setMenu(null)
          }
          items={[
            {
              id:
                "remove-occurrence",
              label:
                "Remove this occurrence",
              onSelect:
                onRemoveOccurrence,
            },
            {
              id:
                "delete-section",
              label:
                "Delete section everywhere",
              danger: true,
              onSelect:
                onDeleteSection,
            },
          ]}
        />
      )}
    </div>
  );
}

export function PreviewPanel() {
  const {
    confirm,
    notify,
  } = useStudioModal();

  const [
    hoveredSectionId,
    setHoveredSectionId,
  ] = useState<
    string | null
  >(null);

  const textareaRefs =
    useRef<
      Record<
        string,
        HTMLTextAreaElement | null
      >
    >({});

  const sectionRefs =
    useRef<
      Record<
        string,
        HTMLDivElement | null
      >
    >({});

  const song =
    useSongStore(
      (state) =>
        state.currentSong
    );

  const updateLyrics =
    useSongStore(
      (state) =>
        state.updateLyrics
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

  const setSelectedLyricLine =
    useSongStore(
      (state) =>
        state.setSelectedLyricLine
    );

  const removeArrangementItem =
    useSongStore(
      (state) =>
        state.removeArrangementItem
    );

  const deleteSection =
    useSongStore(
      (state) =>
        state.deleteSection
    );

  const previewInsertIndex =
    useSongStore(
      (state) =>
        state.previewInsertIndex
    );

  const {
    setNodeRef:
      setPaperDropRef,
  } = useDroppable({
    id:
      "arrangement-container",
    data: {
      type:
        "arrangement-container",
      axis:
        "vertical",
    },
  });

  useEffect(() => {
    Object.values(
      textareaRefs.current
    ).forEach(
      (element) => {
        if (!element) {
          return;
        }

        element.style.height =
          "0px";

        element.style.height =
          element.scrollHeight +
          "px";
      }
    );
  }, [song]);

  useEffect(() => {
    if (
      !selectedSectionId
    ) {
      return;
    }

    sectionRefs.current[
      selectedSectionId
    ]?.scrollIntoView({
      behavior:
        "smooth",
      block:
        "nearest",
    });
  }, [
    selectedSectionId,
  ]);

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
      song.settings
        .sectionColors
    );

  return (
    <div className="preview-shell">
      <Panel title="Write">
        <div
          ref={
            setPaperDropRef
          }
          className="preview-paper"
        >
          <div className="preview-song-header">
            <div>
              <div className="preview-song-kicker">
                Current song
              </div>

              <h1 className="preview-song-title">
                {song.title ||
                  "Untitled Song"}
              </h1>

              {song.artist && (
                <div className="preview-song-artist">
                  {
                    song.artist
                  }
                </div>
              )}
            </div>

            <div className="preview-song-meta">
              {song.genre && (
                <span>
                  {
                    song.genre
                  }
                </span>
              )}

              {song.key && (
                <span>
                  {song.key}
                </span>
              )}

              {song.tempo >
                0 && (
                <span>
                  {song.tempo}{" "}
                  BPM
                </span>
              )}

              {song.timeSignature && (
                <span>
                  {
                    song.timeSignature
                  }
                </span>
              )}
            </div>
          </div>

          <div className="preview-song-divider" />

          <SortableContext
            items={
              arrangement.sequence.map(
                (item) =>
                  item.id
              )
            }
            strategy={
              verticalListSortingStrategy
            }
          >
            {arrangement.sequence.length ===
              0 && (
              <div className="preview-arrangement-empty">
                Drag a section here to start the song.
              </div>
            )}

            {arrangement.sequence.map(
              (
                item,
                index
              ) => {
                const section =
                  song.sections.find(
                    (candidate) =>
                      candidate.id ===
                      item.sectionId
                  );

                if (!section) {
                  return null;
                }

                const version =
                  section.versions.find(
                    (candidate) =>
                      candidate.id ===
                      section.activeVersionId
                  );

                if (!version) {
                  return null;
                }

                const sectionColor =
                  sectionColors[
                    section.type
                  ] ??
                  sectionColors.custom;

                const isSelected =
                  selectedSectionId ===
                  section.id;

                const firstIndex =
                  arrangement.sequence.findIndex(
                    (
                      candidate
                    ) =>
                      candidate.sectionId ===
                      section.id
                  );

                return (
                  <Fragment
                    key={
                      item.id
                    }
                  >
                    {previewInsertIndex ===
                      index && (
                      <div className="preview-arrangement-drop-target" />
                    )}

                  <SortableWriteSection
                    arrangementItemId={
                      item.id
                    }
                    section={
                      section
                    }
                    version={
                      version
                    }
                    sectionColor={
                      sectionColor
                    }
                    isSelected={
                      isSelected
                    }
                    hoveredSectionId={
                      hoveredSectionId
                    }
                    setHoveredSectionId={
                      setHoveredSectionId
                    }
                    setSelectedSection={
                      setSelectedSection
                    }
                    setSelectedLyricLine={
                      setSelectedLyricLine
                    }
                    updateLyrics={
                      updateLyrics
                    }
                    textareaRefs={
                      textareaRefs
                    }
                    sectionRefs={
                      sectionRefs
                    }
                    isFirstOccurrence={
                      index ===
                      firstIndex
                    }
                    onRemoveOccurrence={() =>
                      removeArrangementItem(
                        index
                      )
                    }
                    onDeleteSection={() => {
                      void (async () => {
                        const approved =
                          await confirm({
                            title:
                              "Delete section everywhere?",
                            message:
                              "This removes the section itself and every occurrence of it from the song. A safety snapshot will be saved first.",
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
                            section.title,
                          "Automatic safety snapshot before deleting a section from Write."
                        );

                        deleteSection(
                          section.id
                        );

                        notify({
                          title:
                            "Section deleted",
                          message:
                            "All occurrences were removed. A safety snapshot was saved in Versions.",
                          tone:
                            "success",
                        });
                      })();
                    }}
                  />
                  </Fragment>
                );
              }
            )}

            {previewInsertIndex ===
              arrangement.sequence.length && (
              <div className="preview-arrangement-drop-target" />
            )}
          </SortableContext>
        </div>
      </Panel>
    </div>
  );
}
