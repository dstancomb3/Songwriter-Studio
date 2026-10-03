# Songwriter Studio

## Product, UX, and Implementation Specification

**Status:** Working product specification  
**Purpose:** Reference baseline for the visual reimagining and future development of Songwriter Studio.

> **Locked visual direction:** Dark studio shell + calm writing canvas + restrained section color + contextual intelligence.

---

## 1. Product Definition

Songwriter Studio is a desktop songwriting workspace built to help a songwriter move from a loose idea to a structured, revisable song without forcing the creative process into a generic document editor or a full digital audio workstation.

Its core value is the combination of a calm lyric-writing environment, visual song structure, contextual writing assistance, and revision intelligence. The software should feel like a creative instrument first and an analytics system second.

### North-star principle

**The song remains visually dominant. Every other feature exists to help the songwriter make the next useful creative decision.**

### Product goals

- Make it fast to capture, structure, revise, and compare song ideas.
- Keep lyrics, section order, notes, references, analysis, and versions in one workspace.
- Provide songwriting-specific intelligence such as rhyme quality, concept coherence, syllable and meter cues without turning writing into score chasing.
- Support direct editing in the song preview so the preview is the working surface, not a separate read-only representation.
- Use structure and progressive disclosure to keep a feature-rich app visually calm.

### Non-goals

- Songwriter Studio is not intended to replace a DAW.
- It should not expose every analytical tool at once.
- It should not require AI for basic editing, organization, versioning, or arrangement.
- It should not make numerical scores feel like grades for artistic quality.

---

## 2. UX Philosophy

| Principle | Meaning | Implementation consequence |
|---|---|---|
| Lyric-first | The current song is the primary object on screen. | The center canvas receives the most space and strongest contrast. |
| Progressive disclosure | Secondary tools appear when relevant. | The right panel changes by selection/context; advanced tools live in tabs, drawers, or dedicated workspaces. |
| Direct manipulation | Users edit what they see. | Lyrics are edited inline in the preview. No floating text editor over the preview. |
| Structure without friction | Song form is always understandable. | Sections use consistent labels/colors and can be reordered visually. |
| Intelligence, not judgment | Analysis should guide, not grade. | Scores are compact indicators by default and expand into explanation on demand. |
| Revision as a creative tool | Versions are part of songwriting, not backup mechanics. | Version history, comparison, notes, and score trends are first-class features. |

---

## 3. Information Architecture

The application is organized around four major workspaces.

| Workspace | Purpose | Primary object | Secondary tools |
|---|---|---|---|
| **Write** | Draft and revise lyrics | Live song canvas | Rhymes, alternatives, syllables, notes, chords |
| **Arrange** | Shape song structure | Section timeline / arrangement | Bars, order, duplication, timing metadata |
| **Explore** | Develop concepts and raw material | Ideas, prompts, snippets, references | Theme exploration, word associations, structure builder |
| **Versions** | Compare and recover iterations | Version history and diff | Notes, score trends, arrangement snapshots |

### Persistent shell

- **Top bar:** app identity, current workspace, current song, save state, share/export, overflow actions.
- **Left navigation:** project/song library and, when relevant, song sections.
- **Center canvas:** the active creative task.
- **Right contextual panel:** tools that respond to the current context.
- **Bottom strip:** compact arrangement overview and structural controls; collapsible when not needed.

---

## 4. Visual Direction

The preferred visual language is the calmer second-pass direction.

The strongest baseline is **Minimal Studio**, with selective warmth from **Creative Notebook** and the compact feature treatment of **Modern Composer**.

### Visual rules

- Dark or deep-neutral application shell with a light central writing canvas.
- The center canvas should occupy roughly half or more of usable horizontal space on a typical desktop layout.
- Section colors are identifiers, not decoration. Prefer labels, side accents, and low-opacity tints over fully saturated panels.
- Use generous whitespace and consistent alignment before adding more containers.
- Cards should be reserved for meaningful groups. Avoid putting every control inside a separate card.
- Persistent analytics should be compact. Large charts belong in expanded analysis views.
- The interface should fit comfortably at normal desktop zoom. Users should not need to zoom out to see core panels.

---

## 5. Write Workspace

> **The Write workspace is the product's home screen and must feel like a writing environment, not an analytics dashboard.**

### Center song canvas

- Displays song title, optional concept/subtitle, metadata, section labels, lyrics, and optional section notes.
- Lyrics are editable directly in place with a native-feeling text caret.
- No modal or floating edit box appears for ordinary lyric editing.
- Selecting a line or text range updates the contextual right panel.
- Section blocks may show a faint active tint, but the text remains the visual focus.
- Song-level scores may appear near the title as compact chips, for example **Rhyme 82** and **Concept 78**.

### Section panel

- Shows every section in song order.
- Supports drag-and-drop reorder.
- Supports add, duplicate, delete, rename, and change section type.
- Each section has a default type color and may be manually recolored.
- Displays optional bar count or structural length.
- Selecting a section scrolls/focuses the matching section in the song canvas.

### Contextual right panel

The panel changes based on user context rather than showing every tool simultaneously.

| Context | Preferred panel content |
|---|---|
| Caret in a lyric line | Rhymes, line alternatives, syllable count, meter hints |
| Text selected | Rewrite/alternative tools, word associations, rhyme family |
| Section selected | Section notes, section color/style, section-level concept guidance |
| Nothing selected | Song notes, compact song-level scores, suggested next steps |
| Chord mode active | Chord palette, key-aware chord suggestions, section chord notes |

### Bottom arrangement strip

- Always available as a thin overview, but visually secondary.
- Shows section order as colored blocks.
- Supports click-to-focus, drag reorder, and optionally resize when bar lengths are meaningful.
- Can expand into the dedicated Arrange workspace.
- Should snap cleanly and never force unrelated panels downward.

---

## 6. Arrange Workspace

Arrange turns the song into a visual structure. This workspace emphasizes section order, repetition, length, and macro form while preserving access to lyric content.

- Horizontal sequence of section blocks with section type, name, and optional bar count.
- Drag to reorder.
- Duplicate by explicit action.
- Delete with confirmation when content would be lost.
- Snap to structural units such as bars when bar-based mode is enabled.
- Compact mini-preview of the lyrics for the selected section.
- Optional metadata: tempo, key, time signature, intended duration, section notes.
- Arrangement changes create version-history events or are included in autosaved snapshots.

---

## 7. Explore Workspace

Explore is the idea-development environment. It should help a songwriter create and connect useful raw material without forcing generated content into the song.

- Idea collections: hooks, titles, emotions, imagery, lyrical directions, personal notes, references.
- Rhyme and word explorer: exact rhymes, near rhymes, slant rhymes, associations, phrases.
- Notebook snippets: fragments captured during writing or imported from elsewhere.
- Prompt tools: chorus angles, verse perspectives, bridge directions, imagery prompts.
- Structure builder: drag ideas/snippets into provisional song sections before committing them to the song.
- Every AI/generated suggestion is optional and insertable, never auto-applied.

---

## 8. Songwriting Intelligence

### Rhyme Score

Rhyme Score summarizes rhyme variety and flow. It should not reward rhyme density by itself. A strong score should reflect intentionality, useful repetition, variation, and natural phrasing.

- Default presentation: small score chip with trend arrow or status.
- Expanded analysis may show rhyme families, repeated endings, internal rhymes, exact/near/slant distribution, and overused patterns.
- Feedback should explain what changed the score rather than merely display a number.

### Concept Score

Concept Score summarizes how clearly the song develops a coherent lyrical idea or emotional center. It should measure thematic coherence and development, not subjective artistic value.

Possible signals:

- recurring imagery
- thematic consistency
- emotional progression
- perspective consistency
- hook relevance
- section contribution

The expanded view should identify supporting lines and areas that drift or repeat without development. The score should be interpretable and version-aware.

### Syllables and meter

- Per-line syllable count.
- Optional comparison against nearby lines or repeated sections.
- Soft warnings for major pattern breaks, never hard errors.
- Meter tools remain opt-in and should not imply irregularity is inherently wrong.

---

## 9. Version History

> **Version history is a signature feature, not merely an autosave log.**

- Automatic snapshots at meaningful edit boundaries, plus manual named versions.
- Version notes such as "stronger hook", "new bridge", or "simplified verse 2".
- Side-by-side compare with changed lines highlighted.
- Section-order changes shown explicitly.
- Arrangement snapshots per version.
- Rhyme and Concept score trends across versions.
- Restore a full version or selectively recover a section/line where technically practical.

### Version event model

Each version may include:

- timestamp
- version name / optional note
- song text snapshot
- section structure and order
- section metadata/colors
- arrangement metadata
- score snapshot
- source: autosave, manual save, restore, import, major AI-assisted insertion

---

## 10. Core Data Model

Implementation should keep content, structure, presentation, and analysis separable.

| Entity | Key fields | Notes |
|---|---|---|
| Song | id, title, subtitle/concept, genre, key, bpm, timeSignature, sections[], createdAt, updatedAt | Primary project object |
| Section | id, type, name, color, content, notes, bars, order | Type and name should remain separate |
| Line | id, text, optional annotations | Useful if fine-grained versioning/analysis requires stable identity |
| Note | id, scope, targetId, text, createdAt | Scope may be song, section, or line |
| Version | id, timestamp, label, note, snapshot, scores | Immutable snapshot |
| Idea | id, type, text, tags, source, linkedSongId | Explore workspace object |
| Analysis | songId/versionId, rhymeScore, conceptScore, metrics, explanations | Derived data, not source of truth |

---

## 11. Interaction Specification

- Inline lyric editing is immediate and visually seamless.
- Section selection and lyric selection are distinct states.
- Drag handles appear on hover/focus rather than dominating the layout.
- Right-panel tabs remember the last used tool where reasonable.
- Panels snap into stable layout regions. Avoid arbitrary free-floating panels.
- Collapsible panels preserve state and avoid layout jumps.
- Keyboard shortcuts should cover save/version, add section, duplicate section, move section, focus search, and undo/redo.
- Autosave should be continuous or near-continuous, with a clear non-intrusive saved state.
- Destructive actions should be recoverable through undo or version history where feasible.

---

## 12. Design System

### Section colors

| Section type | Default color | Use |
|---|---|---|
| Intro / Outro | `#93C5FD` | Blue accent / light tint |
| Verse | `#86EFAC` | Green accent / light tint |
| Pre-Chorus | `#FDE68A` | Yellow accent / light tint |
| Chorus | `#FCA5A5` | Pink accent / light tint |
| Bridge | `#C4B5FD` | Purple accent / light tint |
| Hook | `#FDBA74` or custom | Warm accent |

### Typography

- UI: clean modern sans-serif such as Inter.
- Song title / editorial emphasis: restrained display serif may be used.
- Handwritten styling is optional and should be limited to annotations or personality moments, not core controls.
- Lyrics prioritize readability and editing comfort over decorative type.

### Spacing and density

- Use an 8 px spacing system.
- Favor fewer, larger regions over many nested cards.
- Keep text line length comfortable on the central canvas.
- Use low-contrast borders and restrained shadows.
- Do not rely on zoom to make the full core workspace usable.

---

## 13. AI and Assistance Behavior

AI is an accelerator layered onto the deterministic application, not the foundation of the product. The app must remain useful when generative features are disabled or unavailable.

- Generate alternatives, ideas, prompts, and structural suggestions only on explicit user action.
- Never silently replace user lyrics.
- Display generated suggestions separately until the user inserts or accepts them.
- Preserve provenance where useful, especially for version history and undo.
- Prefer focused actions such as "give 5 near-rhyme alternatives for this line" over broad unsolicited rewrites.
- Analysis features may use deterministic language tools, AI, or a hybrid implementation, but should provide stable, explainable output.

---

## 14. Essential Product States

- Empty app / no songs
- New blank song
- Song with sections but little content
- Long song requiring internal canvas scrolling
- Right panel collapsed
- Arrangement collapsed / expanded
- Offline or AI unavailable
- Analysis pending
- Autosave in progress / saved / save error
- Version comparison mode
- Imported notes or song content awaiting organization

---

## 15. Recommended Development Order

1. Stabilize the visual shell and responsive panel layout.
2. Make the central preview the authoritative editable lyric surface.
3. Finish section color, add/reorder/duplicate/delete, and selection behavior.
4. Refine compact arrangement strip and dedicated Arrange workspace.
5. Implement robust local persistence/autosave and version snapshots.
6. Add contextual right-panel architecture.
7. Add deterministic syllable/rhyme helpers where practical.
8. Add Rhyme Score and Concept Score with explainable expanded views.
9. Build Version Compare.
10. Build Explore / Idea Lab.
11. Add optional AI generation and rewriting workflows after deterministic UX is stable.

---

## 16. Acceptance Criteria for the Reimagined Main Screen

- At normal desktop zoom, song navigation, section navigation, lyric canvas, contextual tools, and the compact arrangement strip are all usable without awkward panel overflow.
- The lyric canvas is visually dominant.
- A user can click directly into lyric text and edit without a floating editor box.
- Section identity is immediately readable but color does not overwhelm the page.
- The right panel shows a small number of relevant tools rather than the entire feature set.
- Rhyme Score and Concept Score are visible without becoming the focal point.
- The arrangement strip can be collapsed or expanded and does not push major panels off-screen.
- The visual system feels coherent across Write, Arrange, Explore, and Versions.
- Core editing and organization remain functional without AI.

---

## 17. Open Product Decisions

- Whether a Song contains explicit Line entities or stores each section as richer text and derives lines on demand.
- Whether bar counts are always present or only when the songwriter enables arrangement metadata.
- How much musical functionality Chord Mode should eventually include.
- Whether score calculation is continuous, debounced, or user-triggered for cost/performance reasons.
- Exact autosnapshot rules for version history.
- Whether imported notes become Ideas first or can be mapped directly into Sections.
- How much of Creative Notebook's tactile aesthetic should be optional theming versus the default product style.

---

## 18. Locked Direction

**Keep the feature set broad, but keep the default screen calm. Songwriter Studio should feel like a focused writing instrument that can reveal deep tools when the songwriter asks for them.**

This specification is the reference baseline for the visual rework. Individual implementation details may evolve, but changes that increase persistent visual density, split editing away from the preview, or make analytics dominate the songwriting surface should be treated as regressions unless intentionally approved.
