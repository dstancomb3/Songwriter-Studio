import {
  useMemo,
  useState,
} from "react";

import {
  useSongStore,
} from "../../store/songStore";

import {
  findRelatedIdeasLocally,
} from "../../semantic/semanticClient";

import type {
  SectionType,
  SongIdea,
  SongIdeaKind,
} from "../../types";

import {
  useStudioModal,
} from "../ui/StudioModalProvider";

import {
  RhymeExplorer,
} from "./RhymeExplorer";

type FilterKind =
  | "all"
  | SongIdeaKind;

type PlacementScore = {
  id: string;
  title: string;
  type: string;
  score: number;
};

const kinds:
  Array<{
    value: SongIdeaKind;
    label: string;
  }> = [
    { value: "hook", label: "Hook" },
    { value: "title", label: "Title" },
    { value: "image", label: "Image" },
    { value: "emotion", label: "Emotion" },
    { value: "snippet", label: "Snippet" },
    { value: "concept", label: "Concept" },
  ];

const sectionTypes:
  Array<{
    value: SectionType;
    label: string;
  }> = [
    { value: "intro", label: "Intro" },
    { value: "verse", label: "Verse" },
    { value: "pre-chorus", label: "Pre-Chorus" },
    { value: "chorus", label: "Chorus" },
    { value: "post-chorus", label: "Post-Chorus" },
    { value: "bridge", label: "Bridge" },
    { value: "hook", label: "Hook" },
    { value: "outro", label: "Outro" },
    { value: "custom", label: "Custom" },
  ];

function ideaLabel(
  kind: SongIdeaKind
) {
  return (
    kinds.find(
      (item) =>
        item.value === kind
    )?.label ?? kind
  );
}

function activeLyrics(
  ideaText: string,
  note: string
) {
  return [
    ideaText.trim(),
    note.trim(),
  ]
    .filter(Boolean)
    .join("\n");
}

function displaySimilarity(
  score: number
) {
  return Math.round(
    Math.max(
      0,
      Math.min(
        1,
        score
      )
    ) * 100
  );
}

export function ExploreWorkspace({
  onOpenWrite,
}: {
  onOpenWrite?: () => void;
}) {
  const {
    confirm,
    notify,
  } = useStudioModal();

  const song =
    useSongStore(
      (state) =>
        state.currentSong
    );

  const addIdea =
    useSongStore(
      (state) =>
        state.addIdea
    );

  const updateIdea =
    useSongStore(
      (state) =>
        state.updateIdea
    );

  const deleteIdea =
    useSongStore(
      (state) =>
        state.deleteIdea
    );

  const updateSongMetadata =
    useSongStore(
      (state) =>
        state.updateSongMetadata
    );

  const createSectionFromIdea =
    useSongStore(
      (state) =>
        state.createSectionFromIdea
    );

  const appendIdeaToSection =
    useSongStore(
      (state) =>
        state.appendIdeaToSection
    );

  const setSelectedSection =
    useSongStore(
      (state) =>
        state.setSelectedSection
    );

  const [
    draftText,
    setDraftText,
  ] = useState("");

  const [
    draftKind,
    setDraftKind,
  ] = useState<
    SongIdeaKind
  >("snippet");

  const [
    filterKind,
    setFilterKind,
  ] = useState<
    FilterKind
  >("all");

  const [
    showArchived,
    setShowArchived,
  ] = useState(false);

  const [
    selectedIdeaId,
    setSelectedIdeaId,
  ] = useState<
    string | null
  >(null);

  const [
    relatedIds,
    setRelatedIds,
  ] = useState<
    Array<{
      id: string;
      score: number;
    }>
  >([]);

  const [
    semanticStatus,
    setSemanticStatus,
  ] = useState<
    "idle" |
    "loading" |
    "ready"
  >("idle");

  const [
    semanticError,
    setSemanticError,
  ] = useState<
    string | null
  >(null);

  const [
    placementStatus,
    setPlacementStatus,
  ] = useState<
    "idle" |
    "loading" |
    "ready"
  >("idle");

  const [
    placementError,
    setPlacementError,
  ] = useState<
    string | null
  >(null);

  const [
    conceptFit,
    setConceptFit,
  ] = useState<
    number | null
  >(null);

  const [
    placementScores,
    setPlacementScores,
  ] = useState<
    PlacementScore[]
  >([]);

  const [
    targetType,
    setTargetType,
  ] = useState<
    SectionType
  >("verse");

  const [
    targetSectionId,
    setTargetSectionId,
  ] = useState("");

  const ideas =
    song?.ideas ?? [];

  const activeIdeas =
    useMemo(
      () =>
        ideas
          .filter(
            (idea) =>
              showArchived
                ? idea.archived
                : !idea.archived
          )
          .filter(
            (idea) =>
              filterKind === "all" ||
              idea.kind ===
                filterKind
          )
          .sort(
            (
              left,
              right
            ) => {
              if (
                left.pinned !==
                right.pinned
              ) {
                return left.pinned
                  ? -1
                  : 1;
              }

              return right.updatedAt.localeCompare(
                left.updatedAt
              );
            }
          ),
      [
        ideas,
        filterKind,
        showArchived,
      ]
    );

  const selectedIdea =
    ideas.find(
      (idea) =>
        idea.id ===
        selectedIdeaId
    ) ?? null;

  const relatedIdeas =
    relatedIds
      .map(
        (item) => ({
          ...item,
          idea:
            ideas.find(
              (idea) =>
                idea.id ===
                item.id
            ) ?? null,
        })
      )
      .filter(
        (
          item
        ): item is {
          id: string;
          score: number;
          idea: SongIdea;
        } =>
          Boolean(item.idea)
      );

  function selectIdea(
    ideaId: string
  ) {
    setSelectedIdeaId(
      ideaId
    );
    setPlacementStatus(
      "idle"
    );
    setPlacementScores(
      []
    );
    setConceptFit(
      null
    );
    setPlacementError(
      null
    );
  }

  function createIdea() {
    if (
      !draftText.trim()
    ) {
      return;
    }

    addIdea(
      draftKind,
      draftText
    );

    setDraftText(
      ""
    );

    notify({
      title:
        "Idea captured",
      tone:
        "success",
    });
  }

  async function findRelated(
    idea: SongIdea
  ) {
    const candidates =
      ideas
        .filter(
          (candidate) =>
            candidate.id !==
              idea.id &&
            !candidate.archived
        )
        .map(
          (candidate) => ({
            id:
              candidate.id,
            text:
              activeLyrics(
                candidate.text,
                candidate.note
              ),
          })
        );

    selectIdea(
      idea.id
    );

    if (
      candidates.length ===
      0
    ) {
      setRelatedIds(
        []
      );
      setSemanticStatus(
        "ready"
      );
      return;
    }

    setSemanticStatus(
      "loading"
    );
    setSemanticError(
      null
    );

    try {
      const result =
        await findRelatedIdeasLocally(
          activeLyrics(
            idea.text,
            idea.note
          ),
          candidates,
          6
        );

      setRelatedIds(
        result
      );

      setSemanticStatus(
        "ready"
      );
    } catch (error) {
      setRelatedIds(
        []
      );

      setSemanticStatus(
        "idle"
      );

      setSemanticError(
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }

  async function analyzePlacement(
    idea: SongIdea
  ) {
    if (!song) {
      return;
    }

    setPlacementStatus(
      "loading"
    );
    setPlacementError(
      null
    );
    setPlacementScores(
      []
    );
    setConceptFit(
      null
    );

    const sectionCandidates =
      song.sections.map(
        (section) => {
          const version =
            section.versions.find(
              (candidate) =>
                candidate.id ===
                section.activeVersionId
            );

          return {
            id:
              "section:" +
              section.id,
            text: [
              section.title,
              section.type,
              version?.lyrics ??
                "",
            ]
              .filter(Boolean)
              .join("\n"),
          };
        }
      );

    const candidates = [
      ...sectionCandidates,
      ...(song.concept?.trim()
        ? [
            {
              id:
                "__concept__",
              text:
                song.concept.trim(),
            },
          ]
        : []),
    ];

    if (!candidates.length) {
      setPlacementStatus(
        "ready"
      );
      return;
    }

    try {
      const result =
        await findRelatedIdeasLocally(
          activeLyrics(
            idea.text,
            idea.note
          ),
          candidates,
          candidates.length
        );

      const nextPlacements =
        result
          .filter(
            (item) =>
              item.id.startsWith(
                "section:"
              )
          )
          .map(
            (item) => {
              const sectionId =
                item.id.replace(
                  "section:",
                  ""
                );

              const section =
                song.sections.find(
                  (candidate) =>
                    candidate.id ===
                    sectionId
                );

              return {
                id:
                  sectionId,
                title:
                  section?.title ??
                  "Section",
                type:
                  section?.type ??
                  "",
                score:
                  item.score,
              };
            }
          )
          .slice(
            0,
            4
          );

      const concept =
        result.find(
          (item) =>
            item.id ===
            "__concept__"
        );

      setPlacementScores(
        nextPlacements
      );

      setConceptFit(
        concept?.score ??
          null
      );

      if (
        !targetSectionId &&
        nextPlacements[0]
      ) {
        setTargetSectionId(
          nextPlacements[0].id
        );
      }

      setPlacementStatus(
        "ready"
      );
    } catch (error) {
      setPlacementStatus(
        "idle"
      );

      setPlacementError(
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }

  function sendToNewSection(
    idea: SongIdea
  ) {
    const sectionId =
      createSectionFromIdea(
        targetType,
        idea.text,
        idea.note
      );

    if (!sectionId) {
      return;
    }

    notify({
      title:
        "Section created",
      message:
        "The idea was added to the song and arrangement.",
      tone:
        "success",
    });

    onOpenWrite?.();
  }

  function appendToExisting(
    idea: SongIdea
  ) {
    const sectionId =
      targetSectionId ||
      placementScores[0]?.id ||
      song?.sections[0]?.id;

    if (!sectionId) {
      notify({
        title:
          "No target section",
        message:
          "Create a section first or use New section.",
        tone:
          "danger",
      });
      return;
    }

    appendIdeaToSection(
      sectionId,
      idea.text
    );

    setSelectedSection(
      sectionId
    );

    notify({
      title:
        "Idea added to section",
      tone:
        "success",
    });

    onOpenWrite?.();
  }

  if (!song) {
    return null;
  }

  return (
    <div className="explore-workspace">
      <aside className="explore-capture">
        <div className="explore-heading">
          <div>
            <span>
              Idea Lab
            </span>
            <strong>
              Capture
            </strong>
          </div>
        </div>

        <div className="idea-capture-form">
          <select
            value={
              draftKind
            }
            onChange={(event) =>
              setDraftKind(
                event.target.value as SongIdeaKind
              )
            }
          >
            {kinds.map(
              (kind) => (
                <option
                  key={
                    kind.value
                  }
                  value={
                    kind.value
                  }
                >
                  {kind.label}
                </option>
              )
            )}
          </select>

          <textarea
            value={
              draftText
            }
            onChange={(event) =>
              setDraftText(
                event.target.value
              )
            }
            placeholder="Catch a lyric, title, image, feeling, or concept before it disappears."
            rows={6}
          />

          <button
            type="button"
            onClick={
              createIdea
            }
            disabled={
              !draftText.trim()
            }
          >
            Add idea
          </button>
        </div>

        <div className="idea-bank-summary">
          <div>
            <strong>
              {
                ideas.filter(
                  (idea) =>
                    !idea.archived
                ).length
              }
            </strong>
            <span>
              Active
            </span>
          </div>

          <div>
            <strong>
              {
                ideas.filter(
                  (idea) =>
                    idea.pinned &&
                    !idea.archived
                ).length
              }
            </strong>
            <span>
              Pinned
            </span>
          </div>

          <div>
            <strong>
              {
                ideas.filter(
                  (idea) =>
                    idea.archived
                ).length
              }
            </strong>
            <span>
              Archived
            </span>
          </div>
        </div>

        <div className="explore-concept-card">
          <span>
            Current concept
          </span>
          <p>
            {song.concept?.trim() ||
              "No song concept yet."}
          </p>
        </div>

        <RhymeExplorer />
      </aside>

      <main className="explore-board">
        <div className="explore-toolbar">
          <div className="explore-filter-row">
            <button
              type="button"
              className={
                filterKind ===
                "all"
                  ? "explore-filter explore-filter--active"
                  : "explore-filter"
              }
              onClick={() =>
                setFilterKind(
                  "all"
                )
              }
            >
              All
            </button>

            {kinds.map(
              (kind) => (
                <button
                  type="button"
                  key={
                    kind.value
                  }
                  className={
                    filterKind ===
                    kind.value
                      ? "explore-filter explore-filter--active"
                      : "explore-filter"
                  }
                  onClick={() =>
                    setFilterKind(
                      kind.value
                    )
                  }
                >
                  {kind.label}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className={
              showArchived
                ? "explore-archive-toggle explore-archive-toggle--active"
                : "explore-archive-toggle"
            }
            onClick={() =>
              setShowArchived(
                (value) =>
                  !value
              )
            }
          >
            {showArchived
              ? "Showing archived"
              : "Archive"}
          </button>
        </div>

        <div className="idea-grid">
          {activeIdeas.length ===
            0 && (
            <div className="idea-grid-empty">
              {showArchived
                ? "No archived ideas yet."
                : "Capture your first idea on the left. Hooks, images, titles, emotions, and unfinished fragments all belong here."}
            </div>
          )}

          {activeIdeas.map(
            (idea) => (
              <article
                key={
                  idea.id
                }
                className={
                  selectedIdeaId ===
                  idea.id
                    ? "idea-card idea-card--selected"
                    : "idea-card"
                }
                onClick={() =>
                  selectIdea(
                    idea.id
                  )
                }
              >
                <div className="idea-card__top">
                  <span
                    className={
                      "idea-kind idea-kind--" +
                      idea.kind
                    }
                  >
                    {ideaLabel(
                      idea.kind
                    )}
                  </span>

                  <button
                    type="button"
                    className={
                      idea.pinned
                        ? "idea-pin idea-pin--active"
                        : "idea-pin"
                    }
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      updateIdea(
                        idea.id,
                        {
                          pinned:
                            !idea.pinned,
                        }
                      );
                    }}
                    title={
                      idea.pinned
                        ? "Unpin"
                        : "Pin"
                    }
                  >
                    {idea.pinned
                      ? "★"
                      : "☆"}
                  </button>
                </div>

                <textarea
                  className="idea-card__text"
                  value={
                    idea.text
                  }
                  rows={3}
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                  onChange={(event) =>
                    updateIdea(
                      idea.id,
                      {
                        text:
                          event.target.value,
                      }
                    )
                  }
                />

                <textarea
                  className="idea-card__note"
                  value={
                    idea.note
                  }
                  rows={2}
                  placeholder="Optional note…"
                  onClick={(
                    event
                  ) =>
                    event.stopPropagation()
                  }
                  onChange={(event) =>
                    updateIdea(
                      idea.id,
                      {
                        note:
                          event.target.value,
                      }
                    )
                  }
                />

                <div className="idea-card__actions">
                  <button
                    type="button"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      void findRelated(
                        idea
                      );
                    }}
                  >
                    Related
                  </button>

                  <button
                    type="button"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      updateSongMetadata({
                        concept:
                          idea.text,
                      });

                      notify({
                        title:
                          "Song concept updated",
                        tone:
                          "success",
                      });
                    }}
                  >
                    Use as concept
                  </button>

                  <button
                    type="button"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      updateIdea(
                        idea.id,
                        {
                          archived:
                            !idea.archived,
                        }
                      );
                    }}
                  >
                    {idea.archived
                      ? "Restore"
                      : "Archive"}
                  </button>

                  <button
                    type="button"
                    className="idea-card__delete"
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      void (async () => {
                        const approved =
                          await confirm({
                            title:
                              "Delete idea?",
                            message:
                              "This idea will be permanently removed from the song.",
                            confirmLabel:
                              "Delete",
                            tone:
                              "danger",
                          });

                        if (!approved) {
                          return;
                        }

                        deleteIdea(
                          idea.id
                        );

                        notify({
                          title:
                            "Idea deleted",
                          tone:
                            "success",
                        });
                      })();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      </main>

      <aside className="explore-related">
        <div className="explore-heading">
          <div>
            <span>
              Idea actions
            </span>
            <strong>
              Develop
            </strong>
          </div>

          <em>
            Local
          </em>
        </div>

        {!selectedIdea && (
          <div className="related-empty">
            Select an idea to connect it to the song, test its fit, or find nearby ideas.
          </div>
        )}

        {selectedIdea && (
          <>
            <div className="related-source">
              <span>
                Selected
              </span>
              <strong>
                {
                  selectedIdea.text
                }
              </strong>
            </div>

            <div className="idea-send-panel">
              <div className="idea-send-panel__label">
                Send to song
              </div>

              <label>
                <span>
                  New section type
                </span>

                <select
                  value={
                    targetType
                  }
                  onChange={(event) =>
                    setTargetType(
                      event.target.value as SectionType
                    )
                  }
                >
                  {sectionTypes.map(
                    (type) => (
                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                      >
                        {type.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <button
                type="button"
                className="idea-send-panel__primary"
                onClick={() =>
                  sendToNewSection(
                    selectedIdea
                  )
                }
              >
                Create new section
              </button>

              <div className="idea-send-panel__or">
                or add to existing
              </div>

              <label>
                <span>
                  Target section
                </span>

                <select
                  value={
                    targetSectionId
                  }
                  onChange={(event) =>
                    setTargetSectionId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Choose section…
                  </option>

                  {song.sections.map(
                    (section) => (
                      <option
                        key={
                          section.id
                        }
                        value={
                          section.id
                        }
                      >
                        {section.title}
                      </option>
                    )
                  )}
                </select>
              </label>

              <button
                type="button"
                onClick={() =>
                  appendToExisting(
                    selectedIdea
                  )
                }
              >
                Append to section
              </button>
            </div>

            <div className="idea-fit-panel">
              <div className="idea-fit-panel__heading">
                <div>
                  <span>
                    Local semantic
                  </span>
                  <strong>
                    Best fit
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void analyzePlacement(
                      selectedIdea
                    )
                  }
                  disabled={
                    placementStatus ===
                    "loading"
                  }
                >
                  {placementStatus ===
                  "loading"
                    ? "Analyzing…"
                    : "Analyze"}
                </button>
              </div>

              {placementError && (
                <div className="related-error">
                  {
                    placementError
                  }
                </div>
              )}

              {conceptFit !==
                null && (
                <div className="idea-concept-fit">
                  <span>
                    Concept alignment
                  </span>
                  <strong>
                    {displaySimilarity(
                      conceptFit
                    )}
                  </strong>
                </div>
              )}

              {placementScores.length >
                0 && (
                <div className="idea-placement-list">
                  {placementScores.map(
                    (
                      item,
                      index
                    ) => (
                      <button
                        type="button"
                        key={
                          item.id
                        }
                        className={
                          targetSectionId ===
                          item.id
                            ? "idea-placement idea-placement--selected"
                            : "idea-placement"
                        }
                        onClick={() =>
                          setTargetSectionId(
                            item.id
                          )
                        }
                      >
                        <span>
                          {index + 1}
                        </span>

                        <div>
                          <strong>
                            {
                              item.title
                            }
                          </strong>
                          <small>
                            {
                              item.type
                            }
                          </small>
                        </div>

                        <em>
                          {displaySimilarity(
                            item.score
                          )}
                        </em>
                      </button>
                    )
                  )}
                </div>
              )}

              {placementStatus ===
                "ready" &&
                placementScores.length ===
                  0 && (
                <div className="related-empty related-empty--compact">
                  Add song sections to get placement suggestions.
                </div>
              )}
            </div>

            <div className="related-divider" />

            <div className="related-list-heading">
              <span>
                Related ideas
              </span>

              <button
                type="button"
                onClick={() =>
                  void findRelated(
                    selectedIdea
                  )
                }
                disabled={
                  semanticStatus ===
                  "loading"
                }
              >
                {semanticStatus ===
                "loading"
                  ? "Comparing…"
                  : "Find related"}
              </button>
            </div>
          </>
        )}

        {semanticError && (
          <div className="related-error">
            {semanticError}
          </div>
        )}

        <div className="related-list">
          {semanticStatus ===
            "ready" &&
            selectedIdea &&
            relatedIdeas.length ===
              0 && (
              <div className="related-empty related-empty--compact">
                Add a few more ideas to make semantic connections useful.
              </div>
            )}

          {relatedIdeas.map(
            (item) => (
              <button
                type="button"
                className="related-card"
                key={
                  item.id
                }
                onClick={() => {
                  selectIdea(
                    item.id
                  );

                  void findRelated(
                    item.idea
                  );
                }}
              >
                <div>
                  <span
                    className={
                      "idea-kind idea-kind--" +
                      item.idea.kind
                    }
                  >
                    {ideaLabel(
                      item.idea.kind
                    )}
                  </span>

                  <em>
                    {displaySimilarity(
                      item.score
                    )}
                  </em>
                </div>

                <strong>
                  {
                    item.idea.text
                  }
                </strong>
              </button>
            )
          )}
        </div>

        <div className="related-note">
          Best Fit and Related use local BGE embeddings. They measure semantic proximity,
          not writing quality, and do not send idea or lyric text to an API.
        </div>
      </aside>
    </div>
  );
}
