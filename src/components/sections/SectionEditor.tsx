import {
  useMemo,
  useState,
} from "react";

import { useSongStore } from "../../store/songStore";
import { Panel } from "../ui/Panel";

import {
  getSectionColors,
} from "../../constants/sectionColors";

import {
  analyzeConceptLocally,
} from "../../semantic/semanticClient";

import type {
  SemanticConceptAnalysis,
} from "../../semantic/localEmbeddings";

function formatScore(
  value: number
) {
  return value.toFixed(3);
}

function semanticLabel(
  value: number
) {
  if (value >= 75) {
    return "Focused";
  }

  if (value >= 55) {
    return "Developing";
  }

  return "Diffuse";
}

export function SectionEditor() {
  const [
    semanticAnalysis,
    setSemanticAnalysis,
  ] = useState<
    SemanticConceptAnalysis | null
  >(null);

  const [
    semanticStatus,
    setSemanticStatus,
  ] = useState<
    "idle" | "loading" | "ready"
  >("idle");

  const [
    semanticError,
    setSemanticError,
  ] = useState<
    string | null
  >(null);

  const song = useSongStore(
    (state) => state.currentSong
  );

  const selectedSectionId =
    useSongStore(
      (state) =>
        state.selectedSectionId
    );

  const updateSongMetadata =
    useSongStore(
      (state) =>
        state.updateSongMetadata
    );

  const setActiveVersion =
    useSongStore(
      (state) =>
        state.setActiveVersion
    );

  const createVersion =
    useSongStore(
      (state) =>
        state.createVersion
    );

  const duplicateVersion =
    useSongStore(
      (state) =>
        state.duplicateVersion
    );

  const renameVersion =
    useSongStore(
      (state) =>
        state.renameVersion
    );

  const deleteVersion =
    useSongStore(
      (state) =>
        state.deleteVersion
    );

  const updateSectionColor =
    useSongStore(
      (state) =>
        state.updateSectionColor
    );

  const selectedSemanticScore =
    useMemo(() => {
      if (
        !semanticAnalysis ||
        !selectedSectionId
      ) {
        return null;
      }

      return (
        semanticAnalysis.sections.find(
          (item) =>
            item.sectionId ===
            selectedSectionId
        ) ?? null
      );
    }, [
      semanticAnalysis,
      selectedSectionId,
    ]);

  async function handleAnalyze() {
    if (!song) {
      return;
    }

    setSemanticStatus(
      "loading"
    );
    setSemanticError(
      null
    );

    try {
      const analysis =
        await analyzeConceptLocally(
          song
        );

      setSemanticAnalysis(
        analysis
      );

      setSemanticStatus(
        "ready"
      );
    } catch (error) {
      setSemanticError(
        error instanceof Error
          ? error.message
          : String(error)
      );

      setSemanticStatus(
        "idle"
      );
    }
  }

  if (!song) {
    return null;
  }

  const semanticBlock = (
    <div className="semantic-context">
      <div className="semantic-context__heading">
        <div>
          <div className="semantic-context__eyebrow">
            Local semantic
          </div>
          <strong>
            Concept Score
          </strong>
        </div>

        <span className="semantic-context__local">
          Local
        </span>
      </div>

      <label className="semantic-concept-field">
        <span>
          Song concept
        </span>

        <textarea
          value={
            song.concept ?? ""
          }
          onChange={(event) => {
            updateSongMetadata({
              concept:
                event.target.value,
            });

            setSemanticAnalysis(
              null
            );
            setSemanticStatus(
              "idle"
            );
          }}
          rows={4}
          placeholder="What is this song really about?"
        />
      </label>

      <button
        type="button"
        className="semantic-analyze-button"
        onClick={
          handleAnalyze
        }
        disabled={
          semanticStatus ===
          "loading"
        }
      >
        {semanticStatus ===
        "loading"
          ? "Analyzing locally…"
          : "Analyze locally"}
      </button>

      {semanticError && (
        <div className="semantic-error">
          {semanticError}
        </div>
      )}

      {semanticAnalysis && (
        <div className="semantic-results">
          <div className="concept-score-hero">
            <div>
              <span>
                Concept Score
              </span>
              <strong>
                {semanticAnalysis.conceptScore.total}
              </strong>
              <em>
                {semanticLabel(
                  semanticAnalysis.conceptScore.total
                )}
              </em>
            </div>

            <div className="concept-score-ring">
              {semanticAnalysis.conceptScore.total}
            </div>
          </div>

          <div className="concept-score-breakdown">
            <div>
              <span>Relevance</span>
              <strong>
                {semanticAnalysis.conceptScore.relevance}
              </strong>
            </div>
            <div>
              <span>Consistency</span>
              <strong>
                {semanticAnalysis.conceptScore.consistency}
              </strong>
            </div>
            <div>
              <span>Hook anchor</span>
              <strong>
                {semanticAnalysis.conceptScore.anchor}
              </strong>
            </div>
          </div>

          {selectedSemanticScore && (
            <div className="semantic-score-card semantic-score-card--selected">
              <span>
                {selectedSemanticScore.title}
              </span>
              <strong>
                {formatScore(
                  selectedSemanticScore.rerankerScore
                )}
              </strong>
              <em>
                raw semantic fit
              </em>
            </div>
          )}

          <div className="semantic-model-note">
            Concept Score v1 = 50% relevance,
            25% section consistency, 25% chorus/hook
            anchoring. BGE + MiniLM remain fully local.
            This measures conceptual focus, not writing quality.
          </div>
        </div>
      )}

      {semanticStatus ===
        "loading" && (
        <div className="semantic-model-note">
          First run may take longer while the
          local models download and cache.
        </div>
      )}
    </div>
  );

  if (!selectedSectionId) {
    return (
      <Panel title="Context">
        <div className="context-overview">
          <div className="context-overview__label">
            Song overview
          </div>

          <div className="context-stat-grid">
            <div className="context-stat">
              <strong>
                {song.sections.length}
              </strong>
              <span>
                Sections
              </span>
            </div>

            <div className="context-stat">
              <strong>
                {song.arrangements[0]
                  ?.sequence.length ?? 0}
              </strong>
              <span>
                Blocks
              </span>
            </div>
          </div>

          <div className="context-hint">
            Select a section to manage versions
            and section settings. Edit lyrics
            directly on the writing page.
          </div>

          <div className="context-divider" />

          {semanticBlock}
        </div>
      </Panel>
    );
  }

  const section =
    song.sections.find(
      (candidate) =>
        candidate.id ===
        selectedSectionId
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

  const sectionColors =
    getSectionColors(
      song.settings.sectionColors
    );

  return (
    <Panel title="Context">
      <div className="editor-section-heading">
        <span
          className="editor-section-heading__dot"
          style={{
            background:
              sectionColors[
                section.type
              ],
          }}
        />

        <div>
          <strong>
            {section.title}
          </strong>

          <div className="context-section-type">
            {section.type}
          </div>
        </div>
      </div>

      <div className="editor-field">
        <label>
          Version
        </label>

        <select
          value={
            section.activeVersionId
          }
          onChange={(event) =>
            setActiveVersion(
              section.id,
              event.target.value
            )
          }
        >
          {section.versions.map(
            (item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            )
          )}
        </select>
      </div>

      <div className="editor-color-row">
        <span>
          Section color
        </span>

        <input
          type="color"
          value={
            sectionColors[
              section.type
            ]
          }
          onChange={(event) =>
            updateSectionColor(
              section.type,
              event.target.value
            )
          }
          aria-label="Section color"
        />
      </div>

      <div className="editor-action-grid">
        <button
          type="button"
          onClick={() =>
            createVersion(
              section.id
            )
          }
        >
          New
        </button>

        <button
          type="button"
          onClick={() =>
            duplicateVersion(
              section.id
            )
          }
        >
          Duplicate
        </button>

        <button
          type="button"
          onClick={() => {
            const newName =
              window.prompt(
                "Rename version",
                version.name
              );

            if (!newName) {
              return;
            }

            renameVersion(
              section.id,
              version.id,
              newName
            );
          }}
        >
          Rename
        </button>

        <button
          type="button"
          onClick={() => {
            if (
              !window.confirm(
                "Delete this version?"
              )
            ) {
              return;
            }

            deleteVersion(
              section.id,
              version.id
            );
          }}
          disabled={
            section.versions.length ===
            1
          }
        >
          Delete
        </button>
      </div>

      <div className="context-divider" />

      <div className="context-hint">
        Lyrics are edited directly in the Write
        canvas. Changes are saved to this active
        version automatically.
      </div>

      <div className="context-divider" />

      {semanticBlock}
    </Panel>
  );
}
