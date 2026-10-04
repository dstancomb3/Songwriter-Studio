import type {
  Song,
} from "../types";

export function getConceptAnalysisFingerprint(
  song: Song
) {
  return JSON.stringify({
    concept:
      song.concept?.trim() ?? "",
    title:
      song.title.trim(),
    notes:
      song.notes.trim(),
    arrangement:
      song.arrangements[0]?.sequence.map(
        (item) =>
          item.sectionId
      ) ?? [],
    sections:
      song.sections.map(
        (section) => {
          const active =
            section.versions.find(
              (version) =>
                version.id ===
                section.activeVersionId
            );

          return {
            id:
              section.id,
            type:
              section.type,
            title:
              section.title,
            activeVersionId:
              section.activeVersionId,
            lyrics:
              active?.lyrics ?? "",
          };
        }
      ),
  });
}
