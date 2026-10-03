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
    <div className="preview-shell">
      <Panel title="Preview">
        <div className="preview-paper">
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
              <div
                key={item.id ?? index}
                className="preview-section"
              >
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

                <textarea
                  className="preview-lyrics"
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
                />
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}