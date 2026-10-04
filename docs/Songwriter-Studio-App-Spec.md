# Songwriter Studio

## Product, UX, and Implementation Specification

**Status:** Living implementation specification  
**Last aligned with verified app behavior:** October 4, 2026  
**Purpose:** Product, UX, and implementation reference for the current Songwriter Studio application and its next development phases.

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
| **Write** | Draft lyrics and directly shape the live song | Editable arrangement canvas | Active-line help, rhyme matches, section context, concept analysis |
| **Arrange** | Evaluate and reshape macro song structure | Horizontal arrangement + occurrence map | Repetition, section length, hook spacing, structural notes |
| **Explore** | Develop concepts and reusable raw material | Persistent idea bank | Related ideas, concept fit, section placement, snippets |
| **Versions** | Compare, recover, and evaluate iterations | Version history and line diff | Safety snapshots, selective restore, score trends |

### Persistent shell

- **Top bar:** app identity, workspace navigation, undo/redo, and local save state.
- **Song strip:** compact song metadata and project-level controls.
- **Left region:** reusable song sections where appropriate.
- **Center canvas:** the active creative task and visually dominant surface.
- **Right contextual region:** tools that respond to current song, section, or line context.
- **No persistent bottom arrangement strip in Write.** Direct arrangement manipulation happens on the Write canvas; macro structural work belongs in Arrange.

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

The center canvas is both the lyric editor and the authoritative visible arrangement.

- Displays the song as ordered **arrangement occurrences**, not merely one copy of each section.
- Lyrics are editable directly in place with a native-feeling caret.
- No modal or floating edit box appears for ordinary lyric editing.
- Repeated sections such as Chorus may appear multiple times as separate arrangement occurrences while sharing the same underlying reusable Section.
- Existing occurrences are vertically sortable from dedicated drag handles.
- Sections from the left library may be dragged into any insertion position, including the beginning and end of the song.
- Insert position is determined from the pointer's vertical position against visible section midpoints so the drop indicator remains deterministic and stable.
- Right-clicking an occurrence opens Songwriter Studio's custom context menu with occurrence-level actions such as **Remove this occurrence** and destructive section-level actions where appropriate.
- Selecting or editing a lyric line updates caret-aware line context in the right panel.
- Section identity uses restrained color accents; lyrics remain visually dominant.

### Section library

The left **Sections** panel is a reusable section library, not the canonical song-order list.

- A Section stores reusable content and may appear zero, one, or many times in the arrangement.
- Drag a section from the library into the Write canvas to add a new occurrence.
- **Add a Section** is a single dropdown control; choosing a section type creates it immediately, while Escape or clicking away cancels.
- Section names display as text normally.
- Double-clicking a section name enters inline rename mode.
- Right-click **Rename section** activates the same inline rename field rather than opening a rename modal.
- Enter saves an inline rename, Escape cancels, and clicking away commits.
- Full section deletion removes that section and all its arrangement occurrences, saves a safety snapshot, and requires custom confirmation.
- Section colors are type-based defaults with user customization.

### Contextual right panel

The right panel uses current selection and caret context.

| Context | Current / intended panel content |
|---|---|
| Caret in a lyric line | Syllables, end word, target delta, rhyme matches, line assistance, duplicate-line warning |
| Section selected | Version controls, color, deterministic lyric analysis, Concept section fit |
| No active line | Section or song-level context, Concept Score, score overview |
| Future text selection | Rewrite/alternative tools, associations, rhyme family |
| Future chord mode | Chord palette, key-aware suggestions, section chord notes |

### Active-line assistance

The active lyric line has a local deterministic assistance layer.

- Per-line syllable count and delta against the section's current syllable target.
- End-word detection.
- Matching line endings elsewhere in the song using the deterministic rhyme heuristic.
- Exact duplicate-line detection across active section versions.
- Rhyme-family words already present in the song's vocabulary.
- Clicking a suggested rhyme-family word saves a non-destructive line variant to Explore rather than overwriting lyrics.
- Active-line suggestions are assistance, not automatic rewriting.

### Write interaction rules

- Normal lyric editing retains a text cursor.
- During structural drag, the app consistently displays a grabbing cursor and suppresses text-selection interference.
- Global undo/redo supports **Ctrl/Cmd+Z**, **Ctrl+Y**, and **Ctrl/Cmd+Shift+Z** where applicable.
- Structural and lyric actions participate in song-level history.
- Browser-native alert, confirm, prompt, and structural context menus are not used for application actions. Songwriter Studio uses its own modal, toast, and context-menu system.

---

## 6. Arrange Workspace

Arrange is the macro-structure workspace. Write remains the best place for lyric editing and direct vertical arrangement; Arrange is where the songwriter judges the full song shape.

### Horizontal arrangement

- Horizontal sortable sequence of arrangement occurrences.
- Sections from the library may be added to the arrangement.
- Existing occurrences may be reordered.
- Arrangement edits update the same underlying sequence used by Write.

### Occurrence map

Arrange includes a larger song-flow map that summarizes every occurrence.

Each occurrence may show:

- absolute song position
- section title and type
- occurrence count such as **2/3** for the second of three Chorus appearances
- active lyric line count
- active lyric word count

Clicking an occurrence selects its underlying section and opens Write.

Right-clicking an occurrence uses the custom Studio context menu and supports:

- **Duplicate this occurrence**
- **Remove this occurrence**

These actions operate on the arrangement occurrence without duplicating or deleting the reusable Section itself.

### Deterministic structure analysis

Arrange derives structural guidance from the current song without requiring AI.

Current metrics include:

- total blocks
- unique used sections
- chorus/hook returns
- repetition percentage
- total arranged lyric lines and words
- section-length range
- unused library sections

Current structural notes may identify:

- back-to-back repeated occurrences
- unusually long gaps between Chorus/Hook returns
- large section-length contrast
- sections in the library that are unused in the arrangement
- absence of Chorus/Hook types in a sufficiently developed arrangement
- a positive no-obvious-structural-flags state

These notes describe **form**, not artistic quality.

### Future Arrange metadata

Optional later layers may include bar counts, intended duration, tempo-aware timing, section notes, and bar-based snapping. They should extend the current occurrence model rather than replace it.

---

## 7. Explore Workspace

Explore is the persistent idea-development environment. It keeps raw material available without forcing it into the song.

### Current idea bank

Ideas are stored with the Song and may be categorized as:

- hook
- title
- image
- emotion
- snippet
- concept

Current interactions include:

- quick capture
- edit
- pin
- archive
- delete
- use an idea as the song concept
- create a new section from an idea
- append an idea to an existing section
- jump back into Write after placement

### Local semantic Explore assistance

The local semantic stack may be used to:

- find related ideas
- rank likely section placement
- estimate concept alignment

Explore suggestions remain optional. They never silently modify the song.

### Future Explore tools

Planned extensions include a richer rhyme/word explorer, associations, imported note organization, imagery prompts, perspective prompts, and provisional structure building.

---

## 8. Songwriting Intelligence

Songwriter Studio separates deterministic craft metrics from local semantic analysis. Scores describe measurable aspects of the current draft and must not be presented as grades of artistic value.

### Rhyme Score

Rhyme Score v1 is deterministic and currently combines:

- 45% rhyme coverage
- 30% recurring-pattern structure
- 25% match quality
- repeated-end-word penalties

Current rhyme analysis includes:

- inferred rhyme families
- strong/slant/repeated-word classification
- rhyme coverage
- pattern score
- match quality
- repeated end words
- per-line end-word analysis

The current heuristic is spelling-based rather than a pronunciation-dictionary engine. A future pronunciation-aware rhyme layer may improve phonetic accuracy.

### Syllable consistency

The current implementation measures syllable-count consistency, not true poetic stress meter.

- Per-line syllable counts are deterministic.
- Each section derives a current syllable target from its active lyrics.
- Lines are identified as short, balanced, or long relative to that target.
- Section consistency and syllable spread are available.
- UI should prefer **Syllable consistency** where a true stress-meter claim would be misleading.
- Future prosodic/stress analysis may be added separately.

### Concept Score

Concept Score uses local semantic models and is user-triggered.

Current local stack:

- embedding model: `onnx-community/bge-small-en-v1.5-ONNX`
- reranker: `Xenova/ms-marco-MiniLM-L-6-v2`
- Transformers.js + ONNX Runtime Web/WASM
- single WASM thread
- local/private after required model assets are cached

Concept Score v1 combines:

- 50% relevance
- 25% section consistency
- 25% Chorus/Hook anchoring

Concept analysis rules:

- only sections whose active version contains non-empty lyrics are scored
- blank section titles/types must not inflate the score
- an explicit Song Concept is preferred
- if no explicit concept exists, title and notes may be used as a clearly labeled fallback
- the UI must identify which concept source was used
- each scored section receives a concept-fit score and may be ranked strongest to weakest
- selecting a ranked section should focus it for inspection

### Analysis freshness

Semantic analysis is not silently treated as current after the song changes.

Concept analysis states include:

- Not analyzed
- Analyzing
- Current
- Out of date
- Unavailable/error where applicable

A fingerprint of concept-relevant song state is compared against the last analyzed state. Changes to lyrics, active versions, relevant metadata, structure, or concept preserve the previous result for reference but mark it **Out of date** until reanalysis.

Deterministic Rhyme and Syllable consistency metrics may update directly from the current song while Concept Score remains stale.

### Song score overview

The contextual intelligence layer may show a compact overview containing:

- Concept
- Rhyme
- Syllable consistency

The overview must distinguish current deterministic scores from stale semantic results.

---

## 9. Version History

> **Version history is a signature feature, not merely an autosave log.**

### Snapshot types

Songwriter Studio currently supports:

- manual named snapshots
- automatic safety snapshots before destructive actions and restores
- source labels such as manual, safety, restore, and import

Snapshots preserve the full Song state and a craft-score summary.

### Version comparison

Current comparison includes:

- changed, added, removed, and unchanged sections
- line-level diff
- automatic expansion of changed sections
- arrangement-change detection
- concept/title change flags
- notes and snapshot metadata

### Restore behavior

- Restore an entire snapshot.
- Selectively restore one section from a snapshot.
- Create a safety snapshot before destructive restore operations.
- Full restore resets working history appropriately while preserving the safety copy.

### Score history

Snapshots may store:

- Concept Score when available
- Rhyme Score
- Syllable consistency score
- line count
- word count

Versions displays:

- current-vs-selected score deltas
- recent snapshot score summaries
- compact score trends across recent manual versions
- Concept analysis freshness, including **Out of date** state after relevant edits

A stale Concept Score must not be silently recorded as current. Manual snapshot creation should refresh stale semantic analysis when possible before storing the score.

### Future history behavior

Meaningful autosnapshot boundaries may be expanded later, but automatic history should remain useful rather than creating noise for every keystroke.

---

## 10. Core Data Model

Implementation should keep content, structure, presentation, and analysis separable.

| Entity | Key fields | Notes |
|---|---|---|
| Song | id, title, subtitle/concept, genre, key, bpm, timeSignature, sections[], createdAt, updatedAt | Primary project object |
| Section | id, type, title, versions[], activeVersionId | Reusable content object; arrangement order is not stored on Section |
| SectionVersion | id, name, lyrics, chords, melody, markers, notes | A Section owns one or more lyric/content versions |
| Arrangement | id/name + sequence[] | Sequence contains occurrence records that reference Section IDs |
| Arrangement occurrence | id, sectionId | Lets the same reusable Section appear multiple times independently in song order |
| Line selection | derived sectionId, lineIndex, text range | Lines are currently derived from lyric text rather than persisted as first-class entities |
| Note | id, scope, targetId, text, createdAt | Scope may be song, section, or line |
| Version | id, timestamp, label, note, snapshot, scores | Immutable snapshot |
| Idea | id, type, text, tags, source, linkedSongId | Explore workspace object |
| Analysis | songId/versionId, rhymeScore, conceptScore, metrics, explanations | Derived data, not source of truth |

---

## 11. Interaction Specification

- Inline lyric editing is immediate and visually seamless.
- Section selection, arrangement occurrence, and lyric-line selection are distinct concepts.
- Structural drag handles are explicit and use stable pointer-driven insertion logic where appropriate.
- Direct manipulation should avoid competing hidden drop geometry that makes insertion feedback flicker.
- Panels snap into stable layout regions. Avoid arbitrary free-floating panels.
- Inline rename is preferred for lightweight naming interactions.
- Application dialogs, confirmations, notifications, and structural context menus use Studio UI rather than browser-native alert/confirm/prompt/context-menu behavior.
- Global undo/redo covers song mutations and groups rapid lyric-only edits into practical history units.
- Autosave is continuous/local with a clear non-intrusive saved state.
- Destructive actions should be recoverable through undo and/or safety snapshots.

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

## 15. Development Status and Next Priorities

> Detailed implementation sequencing for the remaining product-depth work lives in [Remaining Features Implementation Plan](./Remaining-Features-Implementation-Plan.md).

### Verified foundation

The following major systems are implemented and have been interaction-tested:

1. Tauri desktop shell and local persistence.
2. Editable Write canvas as the live arrangement surface.
3. Reusable Section library and occurrence-based arrangement model.
4. Stable pointer-driven section insertion in Write.
5. Inline section rename, custom context menus, custom modals/toasts.
6. Global undo/redo.
7. Dedicated structural Arrange workspace with deterministic analysis.
8. Persistent Explore idea bank with local semantic assistance.
9. Deterministic rhyme and syllable analysis.
10. Local Concept Score with section ranking and freshness state.
11. Version history, safety snapshots, line diff, selective restore, and score trends.

### Next development priorities

1. Expand songwriting utilities without increasing default-screen density.
2. Improve rhyme accuracy with pronunciation-aware rhyme data while preserving deterministic behavior.
3. Add richer title/hook exploration and word-overuse/cliché/repetition tools.
4. Finish text-selection-specific contextual tools.
5. Define and implement imported-notes organization.
6. Decide the scope of Chord Mode and musical metadata.
7. Add optional generative writing assistance only after deterministic workflows remain strong and explainable.
8. Consolidate CSS/layout debt as feature surfaces stabilize.
9. Add schema normalization/migrations for older persisted songs as data structures evolve.
10. Continue accessibility and keyboard interaction passes.

---

## 16. Acceptance Criteria for the Reimagined Main Screen

- At normal desktop zoom, section library, lyric/arrangement canvas, and contextual tools are usable without awkward panel overflow.
- The lyric canvas is visually dominant.
- A user can click directly into lyric text and edit without a floating editor box.
- Section identity is immediately readable but color does not overwhelm the page.
- The right panel shows a small number of relevant tools rather than the entire feature set.
- Rhyme Score and Concept Score are visible without becoming the focal point.
- Write supports direct arrangement manipulation without requiring a persistent bottom arrangement strip.
- The visual system feels coherent across Write, Arrange, Explore, and Versions.
- Core editing and organization remain functional without AI.

---

## 17. Open Product Decisions

- Whether future persistence should introduce explicit stable Line entities or continue deriving lines from active lyric text.
- Whether bar counts and intended duration should always exist or only when arrangement metadata is enabled.
- How much musical functionality Chord Mode should include.
- Exact rules for future meaningful autosnapshots beyond the current safety-snapshot system.
- Whether imported notes become Ideas first or may be mapped directly into Sections with user correction.
- How much of Creative Notebook's tactile aesthetic should be optional theming versus the default product style.
- Which pronunciation/rhyme data source best improves rhyme accuracy while preserving offline/local use.
- Whether Concept Score should remain fully user-triggered or gain optional debounced/background refresh after performance is characterized.

---

## 18. Locked Direction

**Keep the feature set broad, but keep the default screen calm. Songwriter Studio should feel like a focused writing instrument that can reveal deep tools when the songwriter asks for them.**

This specification is the reference baseline for the visual rework. Individual implementation details may evolve, but changes that increase persistent visual density, split editing away from the preview, or make analytics dominate the songwriting surface should be treated as regressions unless intentionally approved.
