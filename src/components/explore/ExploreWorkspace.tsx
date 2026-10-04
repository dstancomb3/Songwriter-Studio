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
  SongIdea,
  SongIdeaKind,
} from "../../types";

type FilterKind =
  | "all"
  | SongIdeaKind;

const kinds:
  Array<{
    value: SongIdeaKind;
    label: string;
  }> = [
    {
      value: "hook",
      label: "Hook",
    },
    {
      value: "title",
      label: "Title",
    },
    {
      value: "image",
      label: "Image",
    },
    {
      value: "emotion",
      label: "Emotion",
    },
    {
      value: "snippet",
      label: "Snippet",
    },
    {
      value: "concept",
      label: "Concept",
    },
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

export function ExploreWorkspace() {
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
              [
                candidate.text,
                candidate.note,
              ]
                .filter(Boolean)
                .join("\n"),
          })
        );

    setSelectedIdeaId(
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
          [
            idea.text,
            idea.note,
          ]
            .filter(Boolean)
            .join("\n"),
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
                  setSelectedIdeaId(
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

                      if (
                        window.confirm(
                          "Delete this idea permanently?"
                        )
                      ) {
                        deleteIdea(
                          idea.id
                        );
                      }
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
              Local semantic
            </span>
            <strong>
              Related ideas
            </strong>
          </div>

          <em>
            Local
          </em>
        </div>

        {!selectedIdea && (
          <div className="related-empty">
            Select an idea, then press Related to surface nearby thoughts by meaning,
            not just matching words.
          </div>
        )}

        {selectedIdea && (
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
        )}

        {semanticStatus ===
          "loading" && (
          <div className="related-loading">
            Comparing locally…
          </div>
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
              <div className="related-empty">
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
                  setSelectedIdeaId(
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
                    {Math.round(
                      item.score *
                        100
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
          Similarity uses the same local 384-dimensional BGE embeddings as Concept Score.
          No lyric or idea text is sent to an API.
        </div>
      </aside>
    </div>
  );
}
