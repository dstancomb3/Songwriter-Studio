import {
  useMemo,
  useState,
} from "react";

import {
  useSongStore,
} from "../../store/songStore";

import {
  analyzeSongStructure,
} from "../../analysis/structureAnalysis";

import {
  getSectionColors,
} from "../../constants/sectionColors";

import {
  SectionPanel,
} from "../sections/SectionPanel";

import {
  ArrangementPanel,
} from "./ArrangementPanel";

import {
  StudioContextMenu,
} from "../ui/StudioContextMenu";

export function ArrangeWorkspace({
  onOpenWrite,
}: {
  onOpenWrite?: () => void;
}) {
  const song =
    useSongStore(
      (state) =>
        state.currentSong
    );

  const setSelectedSection =
    useSongStore(
      (state) =>
        state.setSelectedSection
    );

  const duplicateArrangementItem =
    useSongStore(
      (state) =>
        state.duplicateArrangementItem
    );

  const removeArrangementItem =
    useSongStore(
      (state) =>
        state.removeArrangementItem
    );

  const [
    menu,
    setMenu,
  ] = useState<
    | {
        x: number;
        y: number;
        index: number;
      }
    | null
  >(null);

  const analysis =
    useMemo(
      () =>
        song
          ? analyzeSongStructure(
              song
            )
          : null,
      [song]
    );

  if (
    !song ||
    !analysis
  ) {
    return null;
  }

  const sectionColors =
    getSectionColors(
      song.settings
        .sectionColors
    );

  return (
    <div className="arrange-workspace arrange-workspace--analysis">
      <div className="arrange-workspace__sections">
        <SectionPanel />
      </div>

      <div className="arrange-workspace__main">
        <div className="arrange-workspace__intro">
          <div>
            <div className="arrange-workspace__eyebrow">
              Structure view
            </div>

            <h2>
              Shape the whole song
            </h2>

            <p>
              Reorder occurrences, inspect repetition and section length, and
              catch structural outliers without leaving the song.
            </p>
          </div>

          <div className="arrange-workspace__summary">
            <span>
              {
                analysis.blockCount
              }{" "}
              blocks
            </span>

            <span>
              {
                analysis.uniqueUsedSections
              }{" "}
              used sections
            </span>

            <span>
              {
                analysis.repetitionRate
              }% repeated
            </span>
          </div>
        </div>

        <ArrangementPanel
          expanded
        />

        <div className="arrange-structure-overview">
          <div className="arrange-structure-overview__heading">
            <div>
              <span>
                Occurrence map
              </span>

              <strong>
                Song flow
              </strong>
            </div>

            <small>
              Right-click a block for occurrence actions
            </small>
          </div>

          <div className="arrange-flow">
            {analysis.occurrences.map(
              (occurrence) => (
                <button
                  type="button"
                  key={
                    occurrence.arrangementItemId
                  }
                  className="arrange-flow-card"
                  style={{
                    borderTopColor:
                      sectionColors[
                        occurrence.type
                      ] ??
                      sectionColors.custom,
                  }}
                  onClick={() => {
                    setSelectedSection(
                      occurrence.sectionId
                    );

                    onOpenWrite?.();
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    setMenu({
                      x:
                        event.clientX,
                      y:
                        event.clientY,
                      index:
                        occurrence.index,
                    });
                  }}
                >
                  <div className="arrange-flow-card__top">
                    <span>
                      {String(
                        occurrence.index +
                          1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    {occurrence.totalOccurrences >
                      1 && (
                      <em>
                        {
                          occurrence.occurrenceNumber
                        }
                        /
                        {
                          occurrence.totalOccurrences
                        }
                      </em>
                    )}
                  </div>

                  <strong>
                    {
                      occurrence.title
                    }
                  </strong>

                  <span className="arrange-flow-card__type">
                    {
                      occurrence.type
                    }
                  </span>

                  <div className="arrange-flow-card__metrics">
                    <span>
                      {
                        occurrence.lineCount
                      }{" "}
                      lines
                    </span>

                    <span>
                      {
                        occurrence.wordCount
                      }{" "}
                      words
                    </span>
                  </div>
                </button>
              )
            )}

            {analysis.occurrences.length ===
              0 && (
              <div className="arrange-flow-empty">
                Drag sections into the arrangement to build the song structure.
              </div>
            )}
          </div>
        </div>
      </div>

      <aside className="arrange-insights">
        <div className="arrange-insights__heading">
          <div>
            <span>
              Deterministic
            </span>

            <strong>
              Structure analysis
            </strong>
          </div>

          <em>
            Offline
          </em>
        </div>

        <div className="arrange-metric-grid">
          <div>
            <strong>
              {
                analysis.blockCount
              }
            </strong>
            <span>
              Blocks
            </span>
          </div>

          <div>
            <strong>
              {
                analysis.uniqueUsedSections
              }
            </strong>
            <span>
              Unique
            </span>
          </div>

          <div>
            <strong>
              {
                analysis.chorusHookCount
              }
            </strong>
            <span>
              Hook returns
            </span>
          </div>

          <div>
            <strong>
              {
                analysis.repetitionRate
              }%
            </strong>
            <span>
              Repetition
            </span>
          </div>
        </div>

        <div className="arrange-length-summary">
          <div>
            <span>
              Arranged lyric size
            </span>
            <strong>
              {
                analysis.totalLines
              }{" "}
              lines ·{" "}
              {
                analysis.totalWords
              }{" "}
              words
            </strong>
          </div>

          <div>
            <span>
              Section length range
            </span>

            <strong>
              {
                analysis.shortestSectionLines
              }
              {" – "}
              {
                analysis.longestSectionLines
              }{" "}
              lines
            </strong>
          </div>

          <div>
            <span>
              Library sections unused
            </span>

            <strong>
              {
                analysis.unusedSectionCount
              }
            </strong>
          </div>
        </div>

        <div className="arrange-notes">
          <div className="arrange-notes__label">
            Structure notes
          </div>

          {analysis.notes.map(
            (note) => (
              <div
                key={
                  note.id
                }
                className={
                  "arrange-note arrange-note--" +
                  note.tone
                }
              >
                <strong>
                  {
                    note.title
                  }
                </strong>

                <p>
                  {
                    note.detail
                  }
                </p>
              </div>
            )
          )}
        </div>

        <div className="arrange-insights__note">
          These checks describe arrangement shape and repetition, not whether
          the song is creatively good or bad.
        </div>
      </aside>

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
                "duplicate-occurrence",
              label:
                "Duplicate this occurrence",
              onSelect: () =>
                duplicateArrangementItem(
                  menu.index
                ),
            },
            {
              id:
                "remove-occurrence",
              label:
                "Remove this occurrence",
              danger: true,
              onSelect: () =>
                removeArrangementItem(
                  menu.index
                ),
            },
          ]}
        />
      )}
    </div>
  );
}
