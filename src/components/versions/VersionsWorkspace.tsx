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
  restoreVersionSnapshot,
  saveVersionSnapshot,
} from "../../services/versionHistory";

import type {
  SongVersionSnapshot,
  VersionScoreSummary,
} from "../../types";

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

export function VersionsWorkspace() {
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
    currentConceptScore,
    setCurrentConceptScore,
  ] = useState<
    number | null
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
    setCurrentConceptScore(
      null
    );
  }, [song?.updatedAt]);

  const selectedSnapshot =
    snapshots.find(
      (snapshot) =>
        snapshot.id ===
        selectedSnapshotId
    ) ?? null;

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
      conceptScore ===
      null &&
      (
        song.concept?.trim() ||
        song.notes.trim()
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
        scores
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

    setStatus(
      "idle"
    );
  }

  function restoreSelected() {
    if (
      !selectedSnapshot
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Restore this snapshot? Your current working state will be replaced. Save a snapshot first if you want to keep it."
      );

    if (!confirmed) {
      return;
    }

    setCurrentSong(
      restoreVersionSnapshot(
        selectedSnapshot
      )
    );

    setSelectedSection(
      null
    );
  }

  function removeSnapshot(
    snapshotId: string
  ) {
    if (!song) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this snapshot?"
      );

    if (!confirmed) {
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
            placeholder={
              "Name this version"
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                "Enter"
              ) {
                void saveSnapshot();
              }
            }}
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
                <strong>
                  {snapshot.name}
                </strong>

                <span>
                  {formatDate(
                    snapshot.createdAt
                  )}
                </span>

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
              See what actually changed between a saved version and the song
              you are writing now.
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
              onClick={
                restoreSelected
              }
              disabled={
                !selectedSnapshot
              }
            >
              Restore
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
                (section) => (
                  <div
                    className={
                      "version-section-diff version-section-diff--" +
                      section.status
                    }
                    key={
                      section.sectionId
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
                    </div>
                  </div>
                )
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
          <div className="version-score-card">
            <span>
              Concept
            </span>
            <strong>
              {currentScores
                .conceptScore ??
                "—"}
            </strong>
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
              Meter
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

        <div className="version-score-history">
          <div className="version-score-history__label">
            Saved versions
          </div>

          {snapshots
            .slice(0, 8)
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
                      removeSnapshot(
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
          Concept Score is refreshed on demand because it runs the local semantic
          models. Rhyme and Meter scores update immediately from the current lyrics.
        </div>
      </aside>
    </div>
  );
}
