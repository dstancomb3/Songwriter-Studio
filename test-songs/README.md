# Songwriter Studio Test Songs

These files are intentionally designed for manual QA. Import them through Songwriter Studio's existing JSON import control.

## 01 — Neon After Midnight

**Control / healthy song**

Use this to verify:
- repeated Chorus occurrences
- stable Write/Arrange synchronization
- reasonably coherent Concept Score
- rhyme and syllable analysis on regular material
- section-fit ranking
- score freshness after editing one lyric
- chords surviving import even though Chord Mode is not yet exposed

## 02 — Static Between Us

**Messy-analysis stress test**

Contains:
- duplicate lines (`You say my name`)
- very uneven line lengths
- a deliberately overlong Bridge
- common/cliché phrases such as `at the end of the day` and `it is what it is`
- Verse 2 concept drift
- deliberate repetition

Use it to test current line assistance and, later, lexical/cliché/overuse work.

## 03 — Glass House Summer

**Structure test**

Contains almost every Section type plus an **unused alternate Section**.

Use this to verify:
- occurrence counts
- Hook/Post-Chorus handling
- repetition percentage
- unused-section warning
- Chorus/Hook spacing
- structure metrics and occurrence map
- adding the unused Section into the arrangement

## 04 — Paper Satellites

**Incomplete-song / Explore test**

Contains:
- no explicit Song Concept
- blank Verse 2 and Bridge
- multiple versions of Verse 1
- a large Explore idea bank

Use this to verify:
- Concept analysis clearly reports title/notes fallback
- blank Sections do not affect Concept Score
- active version switching
- Explore related ideas and placement
- filling a blank Section causes Concept analysis to become stale

## 05 — The Long Way Home

**Long-form / performance / version test**

Contains:
- longer sections and arrangement
- four Chorus occurrences
- multiple Chorus lyric versions
- populated chord arrays
- many lines for scrolling and analysis

Use this to verify:
- long Write canvas behavior
- repeated-occurrence synchronization
- active Chorus version changes all Chorus occurrences
- score analysis on a larger song
- Arrange metrics
- snapshot/restore behavior after a substantial rewrite

## General regression pass

For every test song:

1. Import the file.
2. Edit lyrics directly in Write.
3. Drag a Section from the library into Write.
4. Reorder an occurrence.
5. Open Arrange and confirm the sequence matches.
6. Duplicate/remove an occurrence.
7. Run Concept analysis.
8. Change a lyric and verify Concept becomes **Out of date**.
9. Add an Explore idea and place it into a Section.
10. Save a Version snapshot.
11. Make a change and compare/restore it.
12. Undo/redo the new mutation.

The songs are artificial QA fixtures, not intended as production/demo songs.
