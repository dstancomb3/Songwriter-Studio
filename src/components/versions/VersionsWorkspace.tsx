import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useSongStore } from "../../store/songStore";

import {
  analyzeConceptLocally,
} from "../../semantic/semanticClient";

import {
  buildCraftSummary,
  compareSongVersions,
  deleteVersionSnapshot,
  loadVersionHistory,
  restoreSectionFromSnapshot,
  restoreVersionSnapshot,
  saveSafetySnapshot,
  saveVersionSnapshot,
} from "../../services/versionHistory";

import type {
  SongVersionSnapshot,
  VersionScoreSummary,
} from "../../types";

import {
  useStudioModal,
} from "../ui/StudioModalProvider";

import {
  getConceptAnalysisFingerprint,
} from "../../analysis/conceptAnalysisState";

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  return date.toLocaleString(
    [],
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function scoreDelta(
  current: number | null,
  previous: number | null
) {
  if (
    current === null ||
    previous === null
  ) {
    return null;
  }

  return current - previous;
}

function sourceLabel(
  snapshot:
    SongVersionSnapshot
) {
  switch (
    snapshot.source
  ) {
    case "safety":
      return "Safety";
    case "restore":
      return "Restore";
    case "import":
      return "Import";
    default:
      return "Manual";
  }
}

function Delta({
  value,
}: {
  value: number | null;
}) {
  if (
    value === null ||
    value === 0
  ) {
    return (
      <span className="version-delta version-delta--neutral">
        {value === null
          ? "—"
          : "0"}
      </span>
    );
  }

  return (
    <span
      className={
        value > 0
          ? "version-delta version-delta--up"
          : "version-delta version-delta--down"
      }
    >
      {value > 0
        ? "+"
        : ""}
      {value}
    </span>
  );
}

function ScoreTrend({
  label,
  values,
}: {
  label: string;
  values: Array<{
    id: string;
    name: string;
    value: number | null;
  }>;
}) {
  const visible =
    values.filter(
      (item) =>
        item.value !== null
    );

  if (!visible.length) {
    return null;
  }

  return (
    <div className="score-trend">
      <div className="score-trend__heading">
        <span>
          {label}
        </span>

        <strong>
          {visible
            .map(
              (item) =>
                item.value
            )
            .join(" → ")}
        </strong>
      </div>

      <div className="score-trend__bars">
        {visible.map(
          (item) => (
            <div
              key={
                item.id
              }
              className="score-trend__point"
              title={
                item.name +
                ": " +
                item.value
              }
            >
              <i
                style={{
                  height:
                    Math.max(
                      8,
                      item.value ??
                        0
                    ) +
                    "%",
                }}
              />

              <span>
                {item.value}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function VersionsWorkspace() {
  const {
    confirm,
    notify,
  } = useStudioModal();

  const song =
    useSongStore(
      (state) =>
        state.currentSong
    );

  const setCurrentSong =
    useSongStore(
      (state) =>
        state.setCurrentSong
    );

  const setSelectedSection =
    useSongStore(
      (state) =>
        state.setSelectedSection
    );

  const [
    snapshots,
    setSnapshots,
  ] = useState<
    SongVersionSnapshot[]
  >([]);

  const [
    selectedSnapshotId,
    setSelectedSnapshotId,
  ] = useState<
    string | null
  >(null);

  const [
    snapshotName,
    setSnapshotName,
  ] = useState("");

  const [
    snapshotNote,
    setSnapshotNote,
  ] = useState("");

  const [
    collapsedSectionIds,
    setCollapsedSectionIds,
  ] = useState<
    Set<string>
  >(
    () => new Set()
  );

  const [
    currentConceptScore,
    setCurrentConceptScore,
  ] = useState<
    number | null
  >(null);

  const [
    currentConceptFingerprint,
    setCurrentConceptFingerprint,
  ] = useState<
    string | null
  >(null);

  const [
    status,
    setStatus,
  ] = useState<
    "idle" |
    "analyzing" |
    "saving"
  >("idle");

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!song) {
      return;
    }

    const loaded =
      loadVersionHistory(
        song.id
      );

    setSnapshots(
      loaded
    );

    setSelectedSnapshotId(
      (current) =>
        current &&
        loaded.some(
          (item) =>
            item.id ===
            current
        )
          ? current
          : loaded[0]?.id ??
            null
    );
  }, [song?.id]);

  useEffect(() => {
    setCollapsedSectionIds(
      new Set()
    );
  }, [selectedSnapshotId]);

  const selectedSnapshot =
    snapshots.find(
      (snapshot) =>
        snapshot.id ===
        selectedSnapshotId
    ) ?? null;

  const currentFingerprint =
    song
      ? getConceptAnalysisFingerprint(
          song
        )
      : "";

  const conceptScoreIsStale =
    Boolean(
      currentConceptScore !==
        null &&
      currentConceptFingerprint &&
      currentConceptFingerprint !==
        currentFingerprint
    );

  const trendSnapshots =
    snapshots
      .filter(
        (snapshot) =>
          snapshot.source ===
            "manual" ||
          !snapshot.source
      )
      .slice(0, 5)
      .reverse();

  const currentScores =
    useMemo(() => {
      if (!song) {
        return null;
      }

      return buildCraftSummary(
        song,
        currentConceptScore
      );
    }, [
      song,
      currentConceptScore,
    ]);

  const comparison =
    useMemo(() => {
      if (
        !song ||
        !selectedSnapshot
      ) {
        return null;
      }

      return compareSongVersions(
        selectedSnapshot.song,
        song
      );
    }, [
      song,
      selectedSnapshot,
    ]);

  function refreshSnapshots() {
    if (!song) {
      return;
    }

    setSnapshots(
      loadVersionHistory(
        song.id
      )
    );
  }

  async function analyzeCurrent() {
    if (!song) {
      return null;
    }

    setStatus(
      "analyzing"
    );
    setError(
      null
    );

    try {
      const analysis =
        await analyzeConceptLocally(
          song
        );

      setCurrentConceptScore(
        analysis.conceptScore
          .total
      );

      setCurrentConceptFingerprint(
        getConceptAnalysisFingerprint(
          song
        )
      );

      setStatus(
        "idle"
      );

      return analysis
        .conceptScore
        .total;
    } catch (analysisError) {
      setStatus(
        "idle"
      );

      setError(
        analysisError instanceof Error
          ? analysisError.message
          : String(
              analysisError
            )
      );

      return null;
    }
  }

  async function saveSnapshot() {
    if (!song) {
      return;
    }

    setStatus(
      "saving"
    );
    setError(
      null
    );

    let conceptScore =
      currentConceptScore;

    if (
      (
        conceptScore ===
          null ||
        conceptScoreIsStale
      ) &&
      (
        song.concept?.trim() ||
        song.notes.trim() ||
        song.title.trim()
      )
    ) {
      try {
        const analysis =
          await analyzeConceptLocally(
            song
          );

        conceptScore =
          analysis.conceptScore
            .total;

        setCurrentConceptScore(
          conceptScore
        );

        setCurrentConceptFingerprint(
          getConceptAnalysisFingerprint(
            song
          )
        );
      } catch {
        conceptScore =
          null;
      }
    }

    const scores:
      VersionScoreSummary =
      buildCraftSummary(
        song,
        conceptScore
      );

    const next =
      saveVersionSnapshot(
        song,
        snapshotName ||
          "Snapshot " +
            (
              snapshots.length +
              1
            ),
        scores,
        {
          note:
            snapshotNote,
          source:
            "manual",
        }
      );

    setSnapshots(
      next
    );

    setSelectedSnapshotId(
      next[0]?.id ??
      null
    );

    setSnapshotName(
      ""
    );

    setSnapshotNote(
      ""
    );

    setStatus(
      "idle"
    );

    notify({
      title:
        "Snapshot saved",
      tone:
        "success",
    });
  }

  async function restoreSelected() {
    if (
      !selectedSnapshot ||
      !song
    ) {
      return;
    }

    const approved =
      await confirm({
        title:
          "Restore snapshot?",
        message:
          "Your current working state will be replaced. Songwriter Studio will save an automatic safety snapshot first.",
        confirmLabel:
          "Restore",
        tone:
          "danger",
      });

    if (!approved) {
      return;
    }

    saveSafetySnapshot(
      song,
      "Before restoring " +
        selectedSnapshot.name,
      "Automatic safety snapshot before restoring a full song version."
    );

    const restored =
      restoreVersionSnapshot(
        selectedSnapshot
      );

    setCurrentSong({
      ...restored,
      updatedAt:
        new Date().toISOString(),
    });

    setSelectedSection(
      null
    );

    refreshSnapshots();

    notify({
      title:
        "Snapshot restored",
      message:
        "Your previous working state is preserved as a safety snapshot.",
      tone:
        "success",
    });
  }

  async function restoreSection(
    sectionId: string
  ) {
    if (
      !song ||
      !selectedSnapshot
    ) {
      return;
    }

    const section =
      selectedSnapshot.song.sections.find(
        (item) =>
          item.id ===
          sectionId
      );

    if (!section) {
      return;
    }

    const approved =
      await confirm({
        title:
          "Restore " +
          section.title +
          "?",
        message:
          "Only this section will be restored from the selected snapshot. The current song will be saved as a safety snapshot first.",
        confirmLabel:
          "Restore section",
      });

    if (!approved) {
      return;
    }

    saveSafetySnapshot(
      song,
      "Before restoring " +
        section.title,
      "Automatic safety snapshot before selectively restoring a section."
    );

    const restored =
      restoreSectionFromSnapshot(
        song,
        selectedSnapshot,
        sectionId
      );

    setCurrentSong(
      restored
    );

    setSelectedSection(
      sectionId
    );

    refreshSnapshots();

    notify({
      title:
        section.title +
        " restored",
      message:
        "Only the selected section was replaced.",
      tone:
        "success",
    });
  }

  async function removeSnapshot(
    snapshotId: string
  ) {
    if (!song) {
      return;
    }

    const approved =
      await confirm({
        title:
          "Delete snapshot?",
        message:
          "This saved version will be permanently removed.",
        confirmLabel:
          "Delete",
        tone:
          "danger",
      });

    if (!approved) {
      return;
    }

    const next =
      deleteVersionSnapshot(
        song.id,
        snapshotId
      );

    setSnapshots(
      next
    );

    setSelectedSnapshotId(
      (current) =>
        current ===
        snapshotId
          ? next[0]?.id ??
            null
          : current
    );
  }

  if (
    !song ||
    !currentScores
  ) {
    return null;
  }

  return (
    <div className="versions-workspace">
      <aside className="versions-sidebar">
        <div className="versions-panel-heading">
          <div>
            <span>
              History
            </span>
            <strong>
              Snapshots
            </strong>
          </div>

          <em>
            {snapshots.length}
          </em>
        </div>

        <div className="snapshot-create">
          <input
            value={
              snapshotName
            }
            onChange={(event) =>
              setSnapshotName(
                event.target.value
              )
            }
            placeholder="Name this version"
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                void saveSnapshot();
              }
            }}
          />

          <textarea
            value={
              snapshotNote
            }
            onChange={(event) =>
              setSnapshotNote(
                event.target.value
              )
            }
            rows={2}
            placeholder="Optional note: stronger hook, tighter verse…"
          />

          <button
            type="button"
            onClick={() =>
              void saveSnapshot()
            }
            disabled={
              status !== "idle"
            }
          >
            {status ===
            "saving"
              ? "Saving…"
              : "Save snapshot"}
          </button>
        </div>

        <div className="snapshot-list">
          {snapshots.length ===
            0 && (
            <div className="snapshot-empty">
              Save a snapshot before a rewrite to preserve lyrics, arrangement,
              and score history.
            </div>
          )}

          {snapshots.map(
            (snapshot) => (
              <button
                type="button"
                key={
                  snapshot.id
                }
                className={
                  selectedSnapshotId ===
                  snapshot.id
                    ? "snapshot-card snapshot-card--selected"
                    : "snapshot-card"
                }
                onClick={() =>
                  setSelectedSnapshotId(
                    snapshot.id
                  )
                }
              >
                <div className="snapshot-card__heading">
                  <strong>
                    {snapshot.name}
                  </strong>

                  <em
                    className={
                      "snapshot-source snapshot-source--" +
                      (
                        snapshot.source ??
                        "manual"
                      )
                    }
                  >
                    {sourceLabel(
                      snapshot
                    )}
                  </em>
                </div>

                <span>
                  {formatDate(
                    snapshot.createdAt
                  )}
                </span>

                {snapshot.note && (
                  <p className="snapshot-card__note">
                    {snapshot.note}
                  </p>
                )}

                <div className="snapshot-card__scores">
                  <span>
                    C{" "}
                    {snapshot.scores
                      .conceptScore ??
                      "—"}
                  </span>
                  <span>
                    R{" "}
                    {
                      snapshot.scores
                        .rhymeScore
                    }
                  </span>
                  <span>
                    M{" "}
                    {
                      snapshot.scores
                        .meterScore
                    }
                  </span>
                </div>
              </button>
            )
          )}
        </div>
      </aside>

      <main className="versions-compare">
        <div className="versions-hero">
          <div>
            <span>
              Version compare
            </span>
            <h2>
              Current vs.{" "}
              {selectedSnapshot?.name ??
                "snapshot"}
            </h2>

            <p>
              Expand a changed section to inspect exact line changes or recover only
              that section without rolling back the rest of the song.
            </p>
          </div>

          <div className="versions-hero__actions">
            <button
              type="button"
              onClick={() =>
                void analyzeCurrent()
              }
              disabled={
                status !== "idle"
              }
            >
              {status ===
              "analyzing"
                ? "Analyzing…"
                : "Refresh scores"}
            </button>

            <button
              type="button"
              onClick={() =>
                void restoreSelected()
              }
              disabled={
                !selectedSnapshot
              }
            >
              Restore all
            </button>
          </div>
        </div>

        {error && (
          <div className="versions-error">
            {error}
          </div>
        )}

        {!selectedSnapshot ||
        !comparison ? (
          <div className="versions-placeholder">
            Select or create a snapshot to compare it with the current song.
          </div>
        ) : (
          <>
            <div className="version-change-summary">
              <div>
                <strong>
                  {
                    comparison.changedSectionCount
                  }
                </strong>
                <span>
                  Changed sections
                </span>
              </div>

              <div>
                <strong>
                  {
                    comparison.addedSectionCount
                  }
                </strong>
                <span>
                  Added
                </span>
              </div>

              <div>
                <strong>
                  {
                    comparison.removedSectionCount
                  }
                </strong>
                <span>
                  Removed
                </span>
              </div>

              <div>
                <strong>
                  {comparison.arrangementChanged
                    ? "Yes"
                    : "No"}
                </strong>
                <span>
                  Structure changed
                </span>
              </div>
            </div>

            <div className="version-change-flags">
              <span
                className={
                  comparison.conceptChanged
                    ? "version-flag version-flag--changed"
                    : "version-flag"
                }
              >
                Concept{" "}
                {comparison.conceptChanged
                  ? "changed"
                  : "same"}
              </span>

              <span
                className={
                  comparison.titleChanged
                    ? "version-flag version-flag--changed"
                    : "version-flag"
                }
              >
                Title{" "}
                {comparison.titleChanged
                  ? "changed"
                  : "same"}
              </span>

              <span
                className={
                  comparison.arrangementChanged
                    ? "version-flag version-flag--changed"
                    : "version-flag"
                }
              >
                Arrangement{" "}
                {comparison.arrangementChanged
                  ? "changed"
                  : "same"}
              </span>
            </div>

            <div className="version-section-diffs">
              {comparison.sections.map(
                (section) => {
                  const hasVisibleDiff =
                    section.status !==
                    "unchanged";

                  const expanded =
                    hasVisibleDiff &&
                    !collapsedSectionIds.has(
                      section.sectionId
                    );

                  const canRestore =
                    selectedSnapshot.song.sections.some(
                      (item) =>
                        item.id ===
                        section.sectionId
                    );

                  return (
                    <div
                      className={
                        "version-section-diff version-section-diff--" +
                        section.status +
                        (
                          expanded
                            ? " version-section-diff--expanded"
                            : ""
                        )
                      }
                      key={
                        section.sectionId
                      }
                    >
                      <button
                        type="button"
                        className="version-section-diff__summary"
                        onClick={() =>
                          setCollapsedSectionIds(
                            (current) => {
                              const next =
                                new Set(
                                  current
                                );

                              if (
                                expanded
                              ) {
                                next.add(
                                  section.sectionId
                                );
                              } else {
                                next.delete(
                                  section.sectionId
                                );
                              }

                              return next;
                            }
                          )
                        }
                      >
                        <div>
                          <strong>
                            {section.title}
                          </strong>

                          <span>
                            {section.status}
                          </span>
                        </div>

                        <div className="version-section-diff__numbers">
                          <span>
                            +{
                              section.addedLines
                            }
                          </span>
                          <span>
                            -{
                              section.removedLines
                            }
                          </span>
                          <em>
                            {expanded
                              ? "▴"
                              : "▾"}
                          </em>
                        </div>
                      </button>

                      {expanded && (
                        <div className="version-line-diff">
                          <div className="version-line-diff__header">
                            <span>
                              Snapshot
                            </span>
                            <span>
                              Current
                            </span>
                          </div>

                          <div className="version-line-diff__rows">
                            {section.lineDiff.length ===
                              0 && (
                              <div className="version-line-diff__empty">
                                No lyric-line changes in this section.
                              </div>
                            )}

                            {section.lineDiff.map(
                              (
                                line,
                                index
                              ) => (
                                <div
                                  className={
                                    "version-line-diff__row version-line-diff__row--" +
                                    line.kind
                                  }
                                  key={
                                    line.kind +
                                    "-" +
                                    index +
                                    "-" +
                                    line.text
                                  }
                                >
                                  <div>
                                    <span>
                                      {line.beforeLine ??
                                        ""}
                                    </span>
                                    <p>
                                      {line.kind ===
                                      "added"
                                        ? ""
                                        : line.text}
                                    </p>
                                  </div>

                                  <div>
                                    <span>
                                      {line.afterLine ??
                                        ""}
                                    </span>
                                    <p>
                                      {line.kind ===
                                      "removed"
                                        ? ""
                                        : line.text}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <div className="version-line-diff__actions">
                            {canRestore && (
                              <button
                                type="button"
                                onClick={() =>
                                  void restoreSection(
                                    section.sectionId
                                  )
                                }
                              >
                                Restore this section
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </main>

      <aside className="versions-scores">
        <div className="versions-panel-heading">
          <div>
            <span>
              Score history
            </span>
            <strong>
              Current
            </strong>
          </div>
        </div>

        <div className="version-score-grid">
          <div
            className={
              conceptScoreIsStale
                ? "version-score-card version-score-card--stale"
                : "version-score-card"
            }
          >
            <span>
              Concept
            </span>
            <strong>
              {currentScores
                .conceptScore ??
                "—"}
            </strong>
            <em>
              {conceptScoreIsStale
                ? "Out of date"
                : currentScores.conceptScore !==
                  null
                ? "Current"
                : "Not analyzed"}
            </em>
            <Delta
              value={scoreDelta(
                currentScores.conceptScore,
                selectedSnapshot?.scores
                  .conceptScore ??
                  null
              )}
            />
          </div>

          <div className="version-score-card">
            <span>
              Rhyme
            </span>
            <strong>
              {
                currentScores.rhymeScore
              }
            </strong>
            <Delta
              value={scoreDelta(
                currentScores.rhymeScore,
                selectedSnapshot?.scores
                  .rhymeScore ??
                  null
              )}
            />
          </div>

          <div className="version-score-card">
            <span>
              Syllable consistency
            </span>
            <strong>
              {
                currentScores.meterScore
              }
            </strong>
            <Delta
              value={scoreDelta(
                currentScores.meterScore,
                selectedSnapshot?.scores
                  .meterScore ??
                  null
              )}
            />
          </div>
        </div>

        <div className="version-count-grid">
          <div>
            <strong>
              {
                currentScores.lineCount
              }
            </strong>
            <span>
              Lines
            </span>
          </div>

          <div>
            <strong>
              {
                currentScores.wordCount
              }
            </strong>
            <span>
              Words
            </span>
          </div>
        </div>

        <div className="version-score-trends">
          <div className="version-score-history__label">
            Score trends
          </div>

          <ScoreTrend
            label="Concept"
            values={[
              ...trendSnapshots.map(
                (snapshot) => ({
                  id:
                    snapshot.id,
                  name:
                    snapshot.name,
                  value:
                    snapshot.scores
                      .conceptScore,
                })
              ),
              {
                id:
                  "current-concept",
                name:
                  conceptScoreIsStale
                    ? "Current (stale concept analysis)"
                    : "Current",
                value:
                  currentScores.conceptScore,
              },
            ]}
          />

          <ScoreTrend
            label="Rhyme"
            values={[
              ...trendSnapshots.map(
                (snapshot) => ({
                  id:
                    snapshot.id,
                  name:
                    snapshot.name,
                  value:
                    snapshot.scores
                      .rhymeScore,
                })
              ),
              {
                id:
                  "current-rhyme",
                name:
                  "Current",
                value:
                  currentScores.rhymeScore,
              },
            ]}
          />

          <ScoreTrend
            label="Syllable consistency"
            values={[
              ...trendSnapshots.map(
                (snapshot) => ({
                  id:
                    snapshot.id,
                  name:
                    snapshot.name,
                  value:
                    snapshot.scores
                      .meterScore,
                })
              ),
              {
                id:
                  "current-meter",
                name:
                  "Current",
                value:
                  currentScores.meterScore,
              },
            ]}
          />
        </div>

        {selectedSnapshot && (
          <div className="version-selected-meta">
            <span>
              Comparing against
            </span>
            <strong>
              {
                selectedSnapshot.name
              }
            </strong>

            <div>
              <em
                className={
                  "snapshot-source snapshot-source--" +
                  (
                    selectedSnapshot.source ??
                    "manual"
                  )
                }
              >
                {sourceLabel(
                  selectedSnapshot
                )}
              </em>

              <small>
                {formatDate(
                  selectedSnapshot.createdAt
                )}
              </small>
            </div>

            {selectedSnapshot.note && (
              <p>
                {
                  selectedSnapshot.note
                }
              </p>
            )}
          </div>
        )}

        <div className="version-score-history">
          <div className="version-score-history__label">
            Recent history
          </div>

          {snapshots
            .slice(0, 10)
            .map(
              (snapshot) => (
                <div
                  className="version-history-row"
                  key={
                    snapshot.id
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSnapshotId(
                        snapshot.id
                      )
                    }
                  >
                    <span>
                      {snapshot.name}
                    </span>

                    <small>
                      {sourceLabel(
                        snapshot
                      )}
                      {" · "}
                      C{" "}
                      {snapshot.scores
                        .conceptScore ??
                        "—"}{" "}
                      · R{" "}
                      {
                        snapshot.scores
                          .rhymeScore
                      }{" "}
                      · M{" "}
                      {
                        snapshot.scores
                          .meterScore
                      }
                    </small>
                  </button>

                  <button
                    type="button"
                    className="version-history-row__delete"
                    onClick={() =>
                      void removeSnapshot(
                        snapshot.id
                      )
                    }
                    title="Delete snapshot"
                  >
                    ×
                  </button>
                </div>
              )
            )}
        </div>

        <div className="versions-note">
          Safety snapshots are created automatically before destructive section/version
          actions and restores. Concept Score is refreshed on demand; Rhyme and Meter
          scores are deterministic.
        </div>
      </aside>
    </div>
  );
}
