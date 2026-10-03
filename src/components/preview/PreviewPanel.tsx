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

export function PreviewPanel() {
  const [hoveredSectionId, setHoveredSectionId] =
    useState<string | null>(null);
  const textareaRefs = useRef<
    Record<
      string,
      HTMLTextAreaElement | null
    >
  >({});

  const song = useSongStore(
    (state) => state.currentSong
  );

  const updateLyrics = useSongStore(
    (state) => state.updateLyrics
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

  if (!song) return null;

  const arrangement = song.arrangements[0];

  if (!arrangement) return null;

  const sectionColors =
    getSectionColors(
      song.settings.sectionColors
    );

  return (
    <Panel title="Preview">
      <div
        style={{
          padding: "0.375rem 1rem",

          maxWidth: "600px",

          margin: "0 auto",

          whiteSpace: "pre-wrap",

          lineHeight: 1.6,

          overflowY: "auto",
        }}
      >
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

          return (
            <div key={index}>
              <h3
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
                  marginTop: "1rem",
                  fontWeight: 700,
                  fontSize: "1.05em",
                  color: sectionColor,
                  filter:
                    hoveredSectionId ===
                    section.id
                      ? "brightness(1.15)"
                      : "none",
                  transition:
                    "filter 180ms ease",
                }}
              >
                [{section.title}]
              </h3>

              <textarea
                ref={(element) => {
                  textareaRefs.current[
                    section.id
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
                rows={1}
                style={{
                  width: "100%",
                  margin: 0,
                  resize: "none",
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  background: "transparent",
                  appearance: "none",
                  WebkitAppearance: "none",
                  borderRadius: 0,
                  padding: 0,
                  color: "inherit",
                  font: "inherit",
                  whiteSpace: "pre-wrap",
                  lineHeight: "inherit",
                  overflow: "hidden",
                  borderLeft: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}