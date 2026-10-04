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

import {
  analyzeLyrics,
  collectRhymeWordSuggestions,
  countLineSyllables,
  getLineEndWord,
  normalizeLyricLine,
  replaceLineEndWord,
  scoreRhymeWords,
} from "../../analysis/lyricsAnalysis";

import {
  useStudioModal,
} from "../ui/StudioModalProvider";

import {
  saveSafetySnapshot,
} from "../../services/versionHistory";

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
  const {
    confirm,
    prompt,
    notify,
  } = useStudioModal();

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

  const selectedLyricLine =
    useSongStore(
      (state) =>
        state.selectedLyricLine
    );

  const setSelectedLyricLine =
    useSongStore(
      (state) =>
        state.setSelectedLyricLine
    );

  const setSelectedSection =
    useSongStore(
      (state) =>
        state.setSelectedSection
    );

  const addIdea =
    useSongStore(
      (state) =>
        state.addIdea
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

  const lyricAnalysis =
    analyzeLyrics(
      version.lyrics
    );

  const activeLine =
    selectedLyricLine?.sectionId ===
    section.id
      ? selectedLyricLine
      : null;

  const activeLineSyllables =
    activeLine
      ? countLineSyllables(
          activeLine.text
        )
      : 0;

  const activeLineEndWord =
    activeLine
      ? getLineEndWord(
          activeLine.text
        )
      : "";

  const activeLineDelta =
    activeLine
      ? activeLineSyllables -
        lyricAnalysis.targetSyllables
      : 0;

  const songLines =
    song.sections.flatMap(
      (candidateSection) => {
        const candidateVersion =
          candidateSection.versions.find(
            (candidate) =>
              candidate.id ===
              candidateSection.activeVersionId
          );

        if (!candidateVersion) {
          return [];
        }

        return candidateVersion.lyrics
          .split(/\r?\n/)
          .map(
            (text, lineIndex) => ({
              sectionId:
                candidateSection.id,
              sectionTitle:
                candidateSection.title,
              lineIndex,
              text,
            })
          )
          .filter(
            (item) =>
              item.text.trim()
          );
      }
    );

  const songVocabulary =
    songLines.flatMap(
      (item) =>
        item.text
          .split(/\s+/)
          .filter(Boolean)
    );

  const rhymeWordSuggestions =
    activeLineEndWord
      ? collectRhymeWordSuggestions(
          activeLineEndWord,
          songVocabulary,
          8
        )
      : [];

  const normalizedActiveLine =
    activeLine
      ? normalizeLyricLine(
          activeLine.text
        )
      : "";

  const duplicateLines =
    normalizedActiveLine
      ? songLines.filter(
          (item) =>
            !(
              item.sectionId ===
                section.id &&
              item.lineIndex ===
                activeLine?.lineIndex
            ) &&
            normalizeLyricLine(
              item.text
            ) ===
              normalizedActiveLine
        )
      : [];

  const meterGuidance =
    !activeLine
      ? null
      : activeLineDelta === 0
      ? "This line is exactly on the section's current syllable target."
      : activeLineDelta > 0
      ? "This line is " +
        activeLineDelta +
        " syllable" +
        (
          activeLineDelta === 1
            ? ""
            : "s"
        ) +
        " longer than the section target."
      : "This line is " +
        Math.abs(
          activeLineDelta
        ) +
        " syllable" +
        (
          Math.abs(
            activeLineDelta
          ) === 1
            ? ""
            : "s"
        ) +
        " shorter than the section target.";

  const rhymeMatches =
    activeLineEndWord
      ? song.sections
          .flatMap(
            (candidateSection) => {
              const candidateVersion =
                candidateSection.versions.find(
                  (candidate) =>
                    candidate.id ===
                    candidateSection.activeVersionId
                );

              if (!candidateVersion) {
                return [];
              }

              const lines =
                candidateVersion.lyrics.split(
                  /\r?\n/
                );

              return lines
                .map(
                  (text, lineIndex) => {
                    const endWord =
                      getLineEndWord(
                        text
                      );

                    const rhyme =
                      scoreRhymeWords(
                        activeLineEndWord,
                        endWord
                      );

                    return {
                      sectionId:
                        candidateSection.id,
                      sectionTitle:
                        candidateSection.title,
                      lineIndex,
                      text,
                      endWord,
                      score:
                        rhyme.score,
                      strength:
                        rhyme.strength,
                    };
                  }
                )
                .filter(
                  (candidate) =>
                    candidate.text.trim() &&
                    !(
                      candidate.sectionId ===
                        section.id &&
                      candidate.lineIndex ===
                        activeLine?.lineIndex
                    ) &&
                    candidate.score >=
                      0.55
                );
            }
          )
          .sort(
            (left, right) =>
              right.score -
              left.score
          )
          .slice(0, 6)
      : [];

  function jumpToRhymeMatch(
    match:
      (typeof rhymeMatches)[number]
  ) {
    const targetSection =
      song.sections.find(
        (candidate) =>
          candidate.id ===
          match.sectionId
      );

    const targetVersion =
      targetSection?.versions.find(
        (candidate) =>
          candidate.id ===
          targetSection.activeVersionId
      );

    if (
      !targetSection ||
      !targetVersion
    ) {
      return;
    }

    const lines =
      targetVersion.lyrics.split(
        /\r?\n/
      );

    let start = 0;

    for (
      let index = 0;
      index < match.lineIndex;
      index += 1
    ) {
      start +=
        (
          lines[index] ??
          ""
        ).length + 1;
    }

    const text =
      lines[
        match.lineIndex
      ] ?? "";

    setSelectedSection(
      match.sectionId
    );

    setSelectedLyricLine({
      sectionId:
        match.sectionId,
      lineIndex:
        match.lineIndex,
      text,
      start,
      end:
        start +
        text.length,
    });
  }

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
            void (async () => {
              const newName =
                await prompt({
                  title:
                    "Rename version",
                  message:
                    "Give this lyric version a new name.",
                  initialValue:
                    version.name,
                  confirmLabel:
                    "Rename",
                });

              if (!newName) {
                return;
              }

              renameVersion(
                section.id,
                version.id,
                newName
              );
            })();
          }}
        >
          Rename
        </button>

        <button
          type="button"
          onClick={() => {
            void (async () => {
              const approved =
                await confirm({
                  title:
                    "Delete version?",
                  message:
                    "This lyric version will be permanently removed.",
                  confirmLabel:
                    "Delete",
                  tone:
                    "danger",
                });

              if (!approved) {
                return;
              }

              saveSafetySnapshot(
                song,
                "Before deleting " +
                  version.name,
                "Automatic safety snapshot before deleting a lyric version."
              );

              deleteVersion(
                section.id,
                version.id
              );

              notify({
                title:
                  "Version deleted",
                message:
                  "A safety snapshot was saved in Versions.",
                tone:
                  "success",
              });
            })();
          }}
          disabled={
            section.versions.length ===
            1
          }
        >
          Delete
        </button>
      </div>

      {activeLine && (
        <>
          <div className="context-divider" />

          <div className="line-context">
            <div className="line-context__heading">
              <div>
                <div className="line-context__eyebrow">
                  Active line
                </div>
                <strong>
                  Line {activeLine.lineIndex + 1}
                </strong>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    !activeLine.text.trim()
                  ) {
                    return;
                  }

                  addIdea(
                    "snippet",
                    activeLine.text
                  );

                  notify({
                    title:
                      "Line saved to Explore",
                    tone:
                      "success",
                  });
                }}
                disabled={
                  !activeLine.text.trim()
                }
              >
                Save as idea
              </button>
            </div>

            <blockquote className="line-context__text">
              {activeLine.text.trim() ||
                "Empty line"}
            </blockquote>

            <div className="line-context__metrics">
              <div>
                <strong>
                  {activeLineSyllables}
                </strong>
                <span>
                  Syllables
                </span>
              </div>

              <div>
                <strong>
                  {activeLineEndWord ||
                    "—"}
                </strong>
                <span>
                  End word
                </span>
              </div>

              <div>
                <strong>
                  {activeLineDelta === 0
                    ? "On"
                    : activeLineDelta > 0
                    ? "+" +
                      activeLineDelta
                    : String(
                        activeLineDelta
                      )}
                </strong>
                <span>
                  Meter delta
                </span>
              </div>
            </div>

            <div className="line-assist-panel">
              <div className="line-assist-panel__heading">
                <span>
                  Line assist
                </span>

                <em>
                  Local
                </em>
              </div>

              {meterGuidance && (
                <div
                  className={
                    activeLineDelta === 0
                      ? "line-meter-guidance line-meter-guidance--on"
                      : "line-meter-guidance"
                  }
                >
                  <strong>
                    Meter
                  </strong>
                  <p>
                    {meterGuidance}
                  </p>
                </div>
              )}

              {duplicateLines.length >
                0 && (
                <div className="line-duplicate-warning">
                  <strong>
                    Duplicate line
                  </strong>

                  <p>
                    This exact line also appears in{" "}
                    {duplicateLines
                      .map(
                        (item) =>
                          item.sectionTitle
                      )
                      .join(", ")}
                    .
                  </p>
                </div>
              )}

              <div className="line-assist-group">
                <div className="line-assist-group__label">
                  <span>
                    Rhyme-family words already in this song
                  </span>

                  <em>
                    {
                      rhymeWordSuggestions.length
                    }
                  </em>
                </div>

                {rhymeWordSuggestions.length ===
                  0 ? (
                  <div className="line-rhyme-panel__empty">
                    No other song words currently fall into this rhyme family.
                  </div>
                ) : (
                  <div className="line-rhyme-word-list">
                    {rhymeWordSuggestions.map(
                      (suggestion) => {
                        const variant =
                          replaceLineEndWord(
                            activeLine.text,
                            suggestion.word
                          );

                        return (
                          <button
                            type="button"
                            key={
                              suggestion.word
                            }
                            onClick={() => {
                              addIdea(
                                "snippet",
                                variant
                              );

                              notify({
                                title:
                                  "Variant saved to Explore",
                                message:
                                  variant,
                                tone:
                                  "success",
                              });
                            }}
                            title="Save a line variant using this end word"
                          >
                            <strong>
                              {
                                suggestion.word
                              }
                            </strong>

                            <span>
                              {
                                suggestion.strength
                              }
                            </span>

                            <em>
                              {Math.round(
                                suggestion.score *
                                  100
                              )}
                            </em>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="line-rhyme-panel">
              <div className="line-rhyme-panel__heading">
                <span>
                  Matching lines in song
                </span>

                <em>
                  {rhymeMatches.length}
                </em>
              </div>

              {rhymeMatches.length ===
                0 ? (
                <div className="line-rhyme-panel__empty">
                  No strong matching line endings elsewhere in the song yet.
                </div>
              ) : (
                <div className="line-rhyme-list">
                  {rhymeMatches.map(
                    (match) => (
                      <button
                        type="button"
                        key={
                          match.sectionId +
                          "-" +
                          match.lineIndex
                        }
                        onClick={() =>
                          jumpToRhymeMatch(
                            match
                          )
                        }
                      >
                        <div>
                          <span>
                            {
                              match.sectionTitle
                            }
                          </span>

                          <em>
                            {
                              match.strength
                            }
                          </em>
                        </div>

                        <strong>
                          {
                            match.text
                          }
                        </strong>

                        <small>
                          {match.endWord} ·{" "}
                          {Math.round(
                            match.score *
                              100
                          )}
                        </small>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="context-divider" />

      <div className="lyric-analysis">
        <div className="lyric-analysis__heading">
          <div>
            <div className="lyric-analysis__eyebrow">
              Deterministic
            </div>
            <strong>
              Lyric analysis
            </strong>
          </div>

          <span>
            Offline
          </span>
        </div>

        <div className="rhyme-score-hero">
          <div>
            <span>Rhyme Score</span>
            <strong>
              {lyricAnalysis.rhymeScore.total}
            </strong>
            <em>
              {lyricAnalysis.rhymeScore.total >= 75
                ? "Structured"
                : lyricAnalysis.rhymeScore.total >= 50
                ? "Developing"
                : "Open"}
            </em>
          </div>

          <div className="rhyme-score-ring">
            {lyricAnalysis.rhymeScore.total}
          </div>
        </div>

        <div className="rhyme-score-breakdown">
          <div>
            <span>Coverage</span>
            <strong>
              {lyricAnalysis.rhymeScore.coverage}
            </strong>
          </div>

          <div>
            <span>Pattern</span>
            <strong>
              {lyricAnalysis.rhymeScore.pattern}
            </strong>
          </div>

          <div>
            <span>Quality</span>
            <strong>
              {lyricAnalysis.rhymeScore.quality}
            </strong>
          </div>
        </div>

        <div className="lyric-analysis__stats">
          <div>
            <strong>
              {lyricAnalysis.lineCount}
            </strong>
            <span>Lines</span>
          </div>

          <div>
            <strong>
              {lyricAnalysis.targetSyllables}
            </strong>
            <span>Target syllables</span>
          </div>

          <div>
            <strong>
              {lyricAnalysis.consistencyScore}
            </strong>
            <span>Meter consistency</span>
          </div>

          <div>
            <strong>
              {lyricAnalysis.syllableSpread.toFixed(1)}
            </strong>
            <span>Syllable spread</span>
          </div>
        </div>

        <div className="rhyme-scheme-card">
          <span>
            Inferred rhyme scheme
          </span>
          <strong>
            {lyricAnalysis.rhymeScheme || "—"}
          </strong>
        </div>

        {lyricAnalysis.lines.length > 0 && (
          <div className="lyric-line-list">
            {lyricAnalysis.lines.map(
              (line, index) => (
                <div
                  className="lyric-line-row"
                  key={`${line.text}-${index}`}
                >
                  <span className="lyric-line-row__label">
                    {line.rhymeLabel}
                  </span>

                  <span className="lyric-line-row__text">
                    {line.text}
                  </span>

                  <span
                    className={
                      "lyric-line-row__meter lyric-line-row__meter--" +
                      line.meterStatus
                    }
                    title={
                      line.syllableDelta === 0
                        ? "At section syllable target"
                        : line.syllableDelta > 0
                        ? "+" + line.syllableDelta + " syllables"
                        : line.syllableDelta + " syllables"
                    }
                  >
                    {line.syllables}
                  </span>

                  <span
                    className={
                      "lyric-line-row__ending lyric-line-row__ending--" +
                      line.rhymeStrength
                    }
                    title={line.rhymeStrength + " rhyme"}
                  >
                    {line.endWord || "—"}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {lyricAnalysis.observations.length > 0 && (
          <div className="lyric-observations">
            {lyricAnalysis.observations.map(
              (observation) => (
                <div
                  className="lyric-observation"
                  key={observation}
                >
                  <span aria-hidden="true">•</span>
                  <p>{observation}</p>
                </div>
              )
            )}
          </div>
        )}

        <div className="lyric-analysis__note">
          Rhyme Score v1 = 45% coverage, 30% recurring
          pattern, 25% match quality with repeated-word
          penalties. Meter analysis compares each line
          with the section's syllable center.
        </div>
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
