import type {
  SectionColorMap,
  SectionType,
} from "../types";

export const defaultSectionColors: SectionColorMap = {
  intro: "#64748b",
  verse: "#3b82f6",
  "pre-chorus": "#f59e0b",
  chorus: "#22c55e",
  "post-chorus": "#14b8a6",
  bridge: "#a855f7",
  hook: "#ec4899",
  outro: "#ef4444",
  custom: "#9ca3af",
};

export const sectionTypeLabels: Record<SectionType, string> = {
  intro: "Intro",
  verse: "Verse",
  "pre-chorus": "Pre-Chorus",
  chorus: "Chorus",
  "post-chorus": "Post-Chorus",
  bridge: "Bridge",
  hook: "Hook",
  outro: "Outro",
  custom: "Custom",
};

export const sectionTypeOrder: SectionType[] = [
  "intro",
  "verse",
  "pre-chorus",
  "chorus",
  "post-chorus",
  "bridge",
  "hook",
  "outro",
  "custom",
];

export function getSectionColors(
  overrides?: Partial<SectionColorMap>
): SectionColorMap {
  return {
    ...defaultSectionColors,
    ...overrides,
  };
}
