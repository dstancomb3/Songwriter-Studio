import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useSongStore } from "../../store/songStore";
import { Panel } from "../ui/Panel";

import {
  getSectionColors,
} from "../../constants/sectionColors";

import {
  analyzeLyrics,
} from "../../analysis/lyricsAnalysis";

export function PreviewPanel() {
  const [hoveredSectionId, setHoveredSectionId] =
    useState<string | null>(null);
  const textareaRefs = useRef<
    Record<
      string,
      HTMLTextAreaElement | null
    >
  >({});

  const sectionRefs = useRef<
    Record<
      string,
      HTMLDivElement | null
    >
  >({});

  const song = useSongStore(
    (state) => state.currentSong
  );

  const updateLyrics = useSongStore(
    (state) => state.updateLyrics
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

  function resizeTextarea(
    element: HTMLTextAreaElement | null
  ) {
    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${element.scrollHeight}px`;
  }

  useEffect(() => {
    Object.values(
      textareaRefs.current
    ).forEach((element) =>
      resizeTextarea(element)
    );
  }, [song]);

  useEffect(() => {
    if (!selectedSectionId) {
      return;
    }

    const element =
      sectionRefs.current[
        selectedSectionId
      ];

    element?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedSectionId]);

  if (!song) return null;

  const arrangement = song.arrangements[0];

  if (!arrangement) return null;

  const sectionColors =
    getSectionColors(
      song.settings.sectionColors
    );

  return (
    <div className="preview-shell">
      <Panel title="Write">
        <div className="preview-paper">
          <div className="preview-song-header">
            <div>
              <div className="preview-song-kicker">Current song</div>
              <h1 className="preview-song-title">
                {song.title || "Untitled Song"}
              </h1>
              {song.artist && (
                <div className="preview-song-artist">
                  {song.artist}
                </div>
              )}
            </div>

            <div className="preview-song-meta">
              {song.genre && (
                <span>{song.genre}</span>
              )}
              {song.key && (
                <span>{song.key}</span>
              )}
              {song.tempo > 0 && (
                <span>{song.tempo} BPM</span>
              )}
              {song.timeSignature && (
                <span>{song.timeSignature}</span>
              )}
            </div>
          </div>

          <div className="preview-song-divider" />
          {arrangement.sequence.map((item, index) => {
            const section = song.sections.find(
              (s) => s.id === item.sectionId
            );

            if (!section) return null;

            const version = section.versions.find(
              (v) => v.id === section.activeVersionId
            );

            if (!version) return null;

            const sectionColor =
              sectionColors[section.type] ??
              sectionColors.custom;

            const lyricAnalysis =
              analyzeLyrics(
                version.lyrics
              );

            const isSelected =
              selectedSectionId ===
              section.id;

            return (
              <div
                key={item.id ?? index}
                ref={(element) => {
                  if (
                    index ===
                    arrangement.sequence.findIndex(
                      (candidate) =>
                        candidate.sectionId ===
                        section.id
                    )
                  ) {
                    sectionRefs.current[
                      section.id
                    ] = element;
                  }
                }}
                data-section-id={section.id}
                className={
                  isSelected
                    ? "preview-section preview-section--selected"
                    : "preview-section"
                }
                onClick={() =>
                  setSelectedSection(
                    section.id
                  )
                }
              >
                <div className="preview-section__heading">
                  <h3
                  className="preview-section__title"
                  onMouseEnter={() =>
                    setHoveredSectionId(
                      section.id
                    )
                  }
                  onMouseLeave={() =>
                    setHoveredSectionId((id) =>
                      id === section.id
                        ? null
                        : id
                    )
                  }
                  style={{
                    color: sectionColor,
                    filter:
                      hoveredSectionId ===
                      section.id
                        ? "brightness(0.82)"
                        : "none",
                  }}
                >
                  {section.title}
                  </h3>

                  {isSelected && lyricAnalysis.lineCount > 0 && (
                    <div className="preview-section__metrics">
                      <span>
                        {lyricAnalysis.targetSyllables} syl
                      </span>
                      <span>
                        {lyricAnalysis.rhymeScheme || "—"}
                      </span>
                      <span>
                        R {lyricAnalysis.rhymeScore.total}
                      </span>
                    </div>
                  )}
                </div>

                {isSelected && lyricAnalysis.lines.length > 0 && (
                  <div className="preview-line-guide">
                    {lyricAnalysis.lines.map(
                      (line, lineIndex) => (
                        <span
                          key={lineIndex}
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
                      item.id
                    ] = element;
                    resizeTextarea(element);
                  }}
                  value={version.lyrics}
                  onChange={(e) =>
                    updateLyrics(
                      section.id,
                      e.target.value
                    )
                  }
                  onInput={(e) =>
                    resizeTextarea(
                      e.currentTarget
                    )
                  }
                  onFocus={() =>
                    setSelectedSection(
                      section.id
                    )
                  }
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                  rows={1}
                />
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}