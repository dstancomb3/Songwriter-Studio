import {
  useMemo,
  useState,
} from "react";

import {
  findRhymes,
} from "../../rhyme/rhymeEngine";

import {
  useSongStore,
} from "../../store/songStore";

import {
  useStudioModal,
} from "../ui/StudioModalProvider";

export function RhymeExplorer() {
  const {
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

  const [
    query,
    setQuery,
  ] = useState("");

  const songVocabulary =
    useMemo(
      () =>
        song?.sections.flatMap(
          (section) => {
            const version =
              section.versions.find(
                (candidate) =>
                  candidate.id ===
                  section.activeVersionId
              );

            return (
              version?.lyrics
                .split(
                  /\s+/
                )
                .filter(Boolean) ??
              []
            );
          }
        ) ?? [],
      [song]
    );

  const results =
    useMemo(
      () =>
        findRhymes(
          query,
          {
            songVocabulary,
            limit: 30,
          }
        ),
      [
        query,
        songVocabulary,
      ]
    );

  const pronunciationCount =
    results.filter(
      (result) =>
        result.source ===
        "pronunciation"
    ).length;

  return (
    <section className="rhyme-explorer">
      <div className="rhyme-explorer__heading">
        <div>
          <span>
            Word tools
          </span>

          <strong>
            Rhyme Explorer
          </strong>
        </div>

        <em>
          Local
        </em>
      </div>

      <input
        value={query}
        onChange={(
          event
        ) =>
          setQuery(
            event.target.value
          )
        }
        placeholder="Type a word…"
        aria-label="Word to rhyme"
      />

      {!query.trim() ? (
        <div className="rhyme-explorer__empty">
          Enter a word to explore exact and near rhymes.
        </div>
      ) : results.length ===
        0 ? (
        <div className="rhyme-explorer__empty">
          No strong local matches yet. Unknown words fall back to the spelling heuristic.
        </div>
      ) : (
        <>
          <div className="rhyme-explorer__summary">
            <span>
              {
                results.length
              }{" "}
              matches
            </span>

            <span>
              {
                pronunciationCount
              }{" "}
              pronunciation-based
            </span>
          </div>

          <div className="rhyme-explorer__results">
            {results.map(
              (result) => (
                <button
                  type="button"
                  key={
                    result.word
                  }
                  className={
                    result.usedInSong
                      ? "rhyme-explorer__result rhyme-explorer__result--used"
                      : "rhyme-explorer__result"
                  }
                  title="Save this word to Explore"
                  onClick={() => {
                    addIdea(
                      "snippet",
                      result.word
                    );

                    notify({
                      title:
                        "Word saved to Explore",
                      message:
                        result.word,
                      tone:
                        "success",
                    });
                  }}
                >
                  <strong>
                    {
                      result.word
                    }
                  </strong>

                  <span>
                    {
                      result.kind
                    }
                  </span>

                  <em>
                    {
                      result.syllables
                    }{" "}
                    syl
                  </em>

                  {result.usedInSong && (
                    <small>
                      used{" "}
                      {
                        result.occurrenceCount
                      }
                      ×
                    </small>
                  )}
                </button>
              )
            )}
          </div>

          <p className="rhyme-explorer__note">
            Pronunciation-aware entries are preferred. Words outside the local lexicon use the existing deterministic spelling fallback.
          </p>
        </>
      )}
    </section>
  );
}
