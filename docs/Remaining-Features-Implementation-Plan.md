# Songwriter Studio
## Implementation Plan: Remaining Product Depth

**Status:** Approved planning baseline  
**Prepared against:** current `main` codebase and `docs/Songwriter-Studio-App-Spec.md`  
**Date:** October 4, 2026

---

## 1. Purpose

This document turns the eight remaining product priorities into an implementation sequence grounded in the current Songwriter Studio architecture.

The goal is not to add features as isolated panels. Each wave should deepen the songwriting workflow while preserving the locked product direction:

- Write remains visually dominant.
- Sections remain reusable content objects.
- Arrangement occurrences remain separate from Sections.
- Explore remains a non-destructive idea workspace.
- Versions remains the revision/recovery workspace.
- Deterministic/local tools remain useful without generative AI.
- Generative features never silently replace user lyrics.
- Analysis explains craft signals rather than grading artistic quality.
- Browser-native application dialogs/context menus remain prohibited.

The eight workstreams are:

1. Pronunciation-aware rhyme / word explorer
2. Text-selection tools
3. Title / Hook Lab + overuse / repetition analysis
4. Imported notes → Explore workflow
5. Optional generative assistance
6. Chord Mode / musical metadata
7. Smarter autosnapshots
8. Polish, accessibility, schema migrations, and hardening

---

## 2. Current Architecture Constraints

### 2.1 Relevant current model

The current data model is intentionally simple:

- `Song` owns metadata, Sections, Arrangements, Themes, Ideas, and settings.
- `Section` owns reusable content and an `activeVersionId`.
- `SectionVersion` already contains:
  - `lyrics: string`
  - `chords: string[]`
  - `melody`
  - `markers`
  - `notes`
- `Arrangement.sequence` stores occurrence records that reference reusable Section IDs.
- Lyric lines are derived from the active lyric string rather than stored as first-class entities.
- Explore ideas are persisted on the Song.
- Version snapshots persist full Song copies separately in local storage.

This architecture should be extended rather than replaced unless a migration is explicitly justified.

### 2.2 Selection limitation

`PreviewPanel.tsx` currently derives a caret-aware line and stores it as `SelectedLyricLine`:

- section ID
- line index
- line text
- start/end offsets for the whole line

The browser textarea may contain an actual selected word or phrase, but the store does not preserve that selection. Text-selection tools therefore require a richer selection model.

Do not overload `SelectedLyricLine` until its meaning becomes ambiguous. Introduce a new selection type that can represent both caret-line context and an optional explicit text range.

### 2.3 Rhyme limitation

`src/analysis/lyricsAnalysis.ts` currently uses deterministic spelling-based rhyme heuristics. That is useful and should remain available as a fallback, but it cannot reliably distinguish pronunciation cases.

The next rhyme layer should add pronunciation data rather than discard the existing scorer.

### 2.4 Semantic infrastructure

Local semantic analysis already runs in a Web Worker through:

- `src/semantic/semanticClient.ts`
- `src/semantic/semantic.worker.ts`
- `src/semantic/localEmbeddings.ts`

This is the correct foundation for concept-fit and semantic relatedness. Do not mix slow semantic model execution into synchronous React rendering.

### 2.5 Persistence limitation

`src/services/songPersistence.ts` currently checks basic compatibility but has:

- no schema version
- no migration pipeline
- no normalization of orphan arrangement references
- no migration reporting
- no structured recovery path for partially compatible older data

`src/services/songFile.ts` imports JSON with a direct cast and no validation/migration.

This must be strengthened before the model grows significantly.

### 2.6 CSS / UI debt

`src/index.css` is already a very large global stylesheet.

New work should begin moving toward feature-oriented CSS organization rather than continuing indefinite append-only global overrides. A wholesale styling rewrite is unnecessary, but each new feature should avoid making the debt worse.

### 2.7 Verification limitation

The repository currently has build and lint scripts but no dedicated automated test framework in `package.json`.

Each wave therefore requires:

- TypeScript/build validation
- lint validation
- a short deterministic manual verification checklist
- pure analysis functions written so automated tests can be added later without UI dependency

A small unit-test stack can be introduced during Workstream 8 if desired.

---

# 3. Execution Order

The product priority order remains 1–8, but implementation dependencies require one enabling slice from Workstream 8 to happen first.

## Phase 0: Persistence safety foundation

Before adding new persisted fields:

1. Add a schema version to saved/imported Song data.
2. Add `normalizeSong()` and a migration pipeline.
3. Filter invalid/orphan arrangement occurrences during normalization.
4. Fill missing optional/default fields safely.
5. Route both local load and JSON import through the same migration/normalization path.
6. Preserve a recoverable backup if migration fails rather than silently deleting usable data.

This is not the full polish wave. It is an enabling prerequisite.

## Main execution sequence

1. Pronunciation-aware rhyme / Word Explorer
2. Text-selection tools
3. Title / Hook Lab + lexical analysis
4. Imported notes → Explore
5. Optional generative assistance
6. Chord Mode / musical metadata
7. Smarter autosnapshots
8. Final hardening / accessibility / CSS consolidation / migration completion

Why this order:

- rhyme infrastructure benefits selection tools and Title/Hook Lab
- selection tools create the interaction contract generative assistance will later use
- lexical analysis strengthens title/hook evaluation
- import should land before generative expansion so user-owned raw material remains first-class
- generative assistance should reuse established selection/idea/version pathways
- Chord Mode is largely orthogonal and can be built once persistence is migration-safe
- autosnapshots should be designed after the major mutation classes exist
- final hardening happens after feature surfaces stabilize

---

# 4. Workstream 1: Pronunciation-Aware Rhyme / Word Explorer

## 4.1 Product goal

Upgrade rhyme assistance from spelling similarity into a serious local songwriting tool while preserving deterministic/offline behavior.

The user should be able to:

- select or enter a word
- see exact rhymes
- near/slant rhymes
- words already used in the song
- words not yet used
- pronunciation/rhyme-family grouping
- optional phrase/ending suggestions
- save useful words or fragments to Explore

The active-line rhyme panel should use the same underlying engine.

## 4.2 Architecture

Create a dedicated pronunciation/rhyme service rather than expanding `lyricsAnalysis.ts` indefinitely.

Suggested modules:

- `src/rhyme/types.ts`
- `src/rhyme/pronunciationLexicon.ts`
- `src/rhyme/rhymeEngine.ts`
- `src/rhyme/rhymeWorker.ts` if lexicon parsing/search is large
- `src/components/explore/RhymeExplorer.tsx`

Keep `lyricsAnalysis.ts` responsible for song analysis and score composition.

### Proposed types

```ts
type Pronunciation = {
  phonemes: string[];
  stress?: number[];
};

type RhymeCandidate = {
  word: string;
  kind: "exact" | "near" | "slant";
  score: number;
  pronunciation?: Pronunciation;
  usedInSong: boolean;
  occurrenceCount: number;
};
```

## 4.3 Lexicon strategy

Use a bundled/local pronunciation lexicon compatible with offline desktop use.

Decision gate before implementation:

- choose a source whose license permits bundling/distribution
- verify package size
- decide whether lexicon ships with app or is cached after first use

Do not make network lookup mandatory for basic rhyme behavior.

Unknown words should fall back to the current spelling heuristic.

## 4.4 Scoring

Rhyme classification should consider, where available:

- final stressed vowel
- phonemes following final stressed vowel
- consonant overlap
- vowel similarity
- syllable/stress distance
- identical-word penalty
- inflection penalty where useful

Keep results interpretable:

- Exact
- Near
- Slant
- Repeated word

Avoid presenting an unexplained single similarity score as truth.

## 4.5 Integration

Update:

- `SectionEditor.tsx` active-line rhyme family
- `lyricsAnalysis.ts` optional pronunciation-aware end-word comparison
- Explore with a dedicated Word/Rhyme Explorer surface
- idea-saving flow so a candidate word/phrase can become a Hook, Title, or Snippet

Do not block Rhyme Score on lexicon availability. The current heuristic remains the fallback.

## 4.6 Acceptance criteria

- common words return pronunciation-based rhyme families offline
- unknown words still return heuristic results when possible
- exact/slant distinction is stable across refreshes
- words already used in the song are visibly marked
- repeated-word matches are not treated as high-quality rhymes
- active-line rhyme matches and Explore use the same rhyme engine
- selecting a rhyme candidate never overwrites lyrics automatically
- build works without a network connection after required assets are installed/cached

---

# 5. Workstream 2: Text-Selection Tools

## 5.1 Product goal

Move beyond caret-line context. Selecting a word or phrase in Write should reveal tools specific to that exact selection.

Initial tools:

- rhyme selected word
- related words / associations
- save selection to Explore
- compare selected phrase against concept
- replace only when the user explicitly chooses a replacement
- future generative actions attach here without changing the interaction model

## 5.2 Selection model

Replace the current implicit assumption that all selection context is a full lyric line.

Add a store type such as:

```ts
type LyricSelection = {
  sectionId: string;
  arrangementItemId: string;
  lineIndex: number;
  lineText: string;
  lineStart: number;
  lineEnd: number;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
};
```

Important:

- `selectionStart === selectionEnd` means caret-only context.
- Explicit selection means `selectedText.trim().length > 0`.
- Store absolute offsets within the active SectionVersion lyrics.
- Include `arrangementItemId` for UI focus, even though editing the shared Section updates repeated occurrences.

Consider keeping `SelectedLyricLine` as a derived compatibility selector during migration rather than changing every consumer at once.

## 5.3 Preview integration

In `PreviewPanel.tsx`:

- read `selectionStart` and `selectionEnd`
- derive line and explicit-selection ranges
- update on `onSelect`, keyboard navigation, click, and input
- preserve current active-line behavior when no range is selected
- clear stale selection when switching active versions or deleting a section

Add a store action:

- `replaceLyricRange(sectionId, start, end, replacement)`

This must participate in undo/redo and update selected offsets predictably.

## 5.4 Context panel states

Priority:

1. explicit text selection
2. caret line
3. selected Section
4. song overview

Explicit text-selection panel should initially include deterministic/local actions:

- Save as idea
- Rhyme ending/word
- Related ideas/terms
- Concept fit
- replace with chosen deterministic candidate

Later Workstream 5 adds generative actions into the same surface.

## 5.5 Acceptance criteria

- selecting a single word displays that exact word, not the entire line
- selecting across spaces inside one line works
- multiline selection is either supported intentionally or clearly limited in v1
- replacing a selection changes only the intended range
- Ctrl/Cmd+Z restores the exact prior text
- repeated Section occurrences stay synchronized because content remains Section-based
- caret-only behavior remains unchanged when no explicit range exists

---

# 6. Workstream 3: Title / Hook Lab + Overuse / Repetition Analysis

## 6.1 Product goal

Create a songwriting-specific analysis surface for two high-value tasks:

1. develop titles/hooks
2. identify accidental lexical repetition without penalizing intentional repetition

This belongs primarily in Explore, with compact warnings available in Context.

## 6.2 Lexical analysis service

Create:

- `src/analysis/lexicalAnalysis.ts`

Keep this pure and deterministic.

Output should include:

- normalized word frequencies
- meaningful-word frequencies excluding configurable stop words
- repeated multi-word phrases
- section distribution of repeated words/phrases
- concentration score
- candidate filler/overused words
- repeated imagery terms where detectable lexically
- intentional-repeat context, especially Chorus/Hook repetitions

Important distinction:

A word repeated in the same shared Chorus should not be counted as several independently authored repetitions merely because the Chorus appears three times in the arrangement.

Default lexical analysis should operate over **unique active Section content**. A separate performance/arrangement count may optionally include occurrences.

## 6.3 Cliché handling

Do not ship a subjective “bad writing” detector.

If cliché detection is added:

- use a transparent local phrase list
- label results as “common phrase” or “familiar phrase,” not “bad”
- allow dismissal/ignore
- show exact matched phrase and location
- do not subtract from a global artistic score

## 6.4 Title / Hook Lab

Add an Explore sub-surface that can collect candidate Titles and Hooks.

Capabilities:

- promote an existing Idea into candidate list
- capture new candidates
- rank concept fit using existing local semantic stack
- show word/phrase reuse
- show whether candidate language appears in Chorus/Hook lyrics
- compare candidates side by side
- pin/favorite
- apply a Title candidate to Song title only on explicit action
- preserve prior title in undo/version history

Avoid a new persisted entity initially if existing `SongIdea` can carry the workflow.

Recommended first implementation:

- candidate = `SongIdea` with kind `title` or `hook`
- add optional metadata later only if needed

## 6.5 Integration

Potential files:

- `src/analysis/lexicalAnalysis.ts`
- `src/components/explore/TitleHookLab.tsx`
- `ExploreWorkspace.tsx`
- `SectionEditor.tsx` for compact overuse hints
- semantic worker/client for bulk candidate concept-fit requests

If semantic candidate ranking becomes repetitive, add a batch operation rather than spawning many individual worker calls.

## 6.6 Acceptance criteria

- repeated meaningful words are correctly counted across unique section text
- repeated arrangement occurrences do not inflate authored-word counts by default
- common phrase findings show exact locations
- no cliché/overuse result is framed as a quality grade
- Title candidates can be applied and undone
- Hook/Title candidates can be compared without inserting them into lyrics
- concept-fit ranking uses the local semantic infrastructure

---

# 7. Workstream 4: Imported Notes → Explore

## 7.1 Product goal

Let users bring scattered material into Songwriter Studio without forcing immediate structural decisions.

Initial supported input:

- pasted text
- TXT
- Markdown
- imported plain-text extraction where already available
- JSON song import remains a separate song-import path

Future document formats can be added after the text pipeline is stable.

## 7.2 Import staging model

Do not immediately mutate the Song.

Create an import staging object:

```ts
type ImportedNoteDraft = {
  id: string;
  sourceName?: string;
  rawText: string;
  fragments: ImportedFragment[];
};

type ImportedFragment = {
  id: string;
  text: string;
  suggestedKind?: SongIdeaKind;
  confidence?: number;
  selected: boolean;
};
```

The staging object may remain transient for v1. Persist only after the user confirms import.

## 7.3 Deterministic segmentation first

Start with local deterministic parsing:

- blank-line paragraph split
- bullet detection
- heading detection
- quote/lyric-like short-line clusters
- duplicate cleanup
- minimum/maximum fragment size

Semantic/local classification may then suggest:

- hook
- title
- image
- emotion
- snippet
- concept

User correction must always be available before commit.

## 7.4 Import review UI

Add an Explore import flow:

1. paste/select source
2. preview fragments
3. edit fragment boundaries/text
4. choose or correct types
5. deselect junk
6. import selected fragments into Explore
7. optionally place specific fragments into Sections afterward using the existing Explore placement flow

Never auto-build the song without user confirmation.

## 7.5 Service boundaries

Create:

- `src/services/noteImport.ts`
- optional semantic classification operation in existing worker
- `src/components/explore/ImportNotesModal.tsx` or dedicated staged panel

Reuse Studio modal infrastructure for confirmation, but a full import-review surface should be larger than a simple prompt modal.

## 7.6 Acceptance criteria

- paste a large block of notes and receive editable fragments
- user can merge/split or at minimum edit/delete suggested fragments before import
- type suggestions are clearly suggestions
- cancel leaves Song untouched
- confirmed fragments become normal Song Ideas
- imported content can then use existing related-idea and placement tools
- duplicate import does not silently create uncontrolled copies without warning/visibility

---

# 8. Workstream 5: Optional Generative Assistance

## 8.1 Product goal

Add AI as an explicit accelerator on top of the deterministic product, not as the application's foundation.

Initial actions should be narrow and songwriting-specific:

- 3–5 alternate phrasings for selected text
- preserve meaning but change syllable count
- near-rhyme alternatives for selected line ending
- alternate Hook angles
- alternate Title ideas
- imagery expansion
- bridge-direction prompts

Do not begin with unrestricted “write my song” generation.

## 8.2 Provider abstraction

No component should call an AI provider directly.

Create an interface such as:

```ts
interface WritingAssistant {
  generate(request: WritingAssistRequest): Promise<WritingAssistResult>;
}
```

Request includes:

- action type
- selected text / active line
- surrounding section context
- optional Song concept
- target syllable count where relevant
- user constraints

Result includes:

- candidates
- provenance/model metadata
- request timestamp
- optional structured attributes

This makes local/remote providers swappable and keeps UI independent of a vendor.

## 8.3 Privacy and consent

Before sending content to a remote provider:

- user explicitly invokes the action
- UI indicates that generation is external if applicable
- send the minimum context necessary
- never silently upload the whole Song when a selected line is sufficient

If a local generation model is added later, it can implement the same interface.

## 8.4 Suggestion staging

Generated content appears in a candidate tray, never directly in lyrics.

Actions:

- Preview
- Replace selection
- Insert after line
- Save to Explore
- Dismiss

Accepted insertion must:

- go through store mutation actions
- participate in undo
- optionally create provenance for future version history
- preserve the original through undo/safety/version mechanisms

## 8.5 Version provenance

Extend version/snapshot metadata only when needed.

Potential addition:

```ts
type EditProvenance = {
  kind: "user" | "ai-assisted";
  provider?: string;
  action?: string;
};
```

Do not attach provenance to every keystroke. Attach it to accepted generated insertions and meaningful version events.

## 8.6 Integration order

Implement generative actions first in:

1. explicit text selection
2. active line
3. Title/Hook Lab
4. Explore prompts

Do not add generative controls everywhere simultaneously.

## 8.7 Acceptance criteria

- generation only starts from explicit user action
- remote/local source is clear
- user lyrics are never silently overwritten
- candidate results can be saved to Explore without insertion
- accepted replacement is undoable
- surrounding Song context sent to a provider is bounded and intentional
- app remains fully usable with the assistant disabled/unavailable
- failures surface through Studio UI without losing text

---

# 9. Workstream 6: Chord Mode / Musical Metadata

## 9.1 Product goal

Add lightweight musical scaffolding without turning Songwriter Studio into a DAW.

The first Chord Mode should support:

- song key
- section chord progression
- simple key-aware chord palette
- common diatonic chord labels
- manual chord entry
- optional per-section notes
- arrangement-level bar counts later

## 9.2 Existing model advantage

`SectionVersion.chords: string[]` already exists.

Do not immediately replace it.

First clarify semantics:

- Is each array item a chord event?
- Is it one chord per bar?
- Does chord timing matter yet?

Recommended v1 contract:

- `chords` is an ordered progression with no precise timing
- optional future `ChordEvent` migration adds bar/beat positioning

This avoids premature timing complexity.

## 9.3 Chord analysis utility

Create:

- `src/music/keyTheory.ts`
- `src/music/chords.ts`

Keep v1 deterministic.

Capabilities:

- parse common key names
- derive diatonic major/minor chords
- roman numeral display
- transpose a progression
- validate common chord spelling

Do not claim advanced harmonic correctness for borrowed chords. Allow any manually entered chord.

## 9.4 UI

Chord Mode should be a contextual mode, not a permanent fourth column.

Possible interaction:

- toggle Chords in Context for selected Section
- show progression chips
- add/remove/reorder chord tokens
- key-aware palette below
- optional roman numeral label

Future canvas display may show a subtle chord row above lyrics, but it must not disrupt lyric editing by default.

## 9.5 Data-model expansion

Later, only if bar/timing features become real:

```ts
type ChordEvent = {
  id: string;
  symbol: string;
  bar?: number;
  beat?: number;
};
```

That change requires schema migration and should not happen in the first Chord Mode slice.

## 9.6 Acceptance criteria

- chord progression persists per SectionVersion
- changing active lyric version changes to that version's chord progression
- key-aware palette updates when Song key changes
- user may enter chords outside the suggested key
- chord editing is undoable
- Write remains lyric-first with chord UI hidden unless requested
- no audio/DAW promises are introduced

---

# 10. Workstream 7: Smarter Autosnapshots

## 10.1 Product goal

Preserve meaningful creative milestones automatically without turning Versions into a noisy keystroke log.

Current safety snapshots remain unchanged.

Add meaningful automatic snapshots for state transitions that a songwriter may later regret losing.

## 10.2 Event model

Introduce snapshot triggers such as:

- major arrangement change
- Section deletion
- active version replacement/deletion
- large lyric rewrite
- accepted generative replacement above a threshold
- explicit “checkpoint” shortcut
- import commit
- possibly title/concept pivot

Avoid autosnapshot on:

- every keystroke
- minor punctuation changes
- ordinary drag adjustments made seconds apart

## 10.3 Debounced change accumulation

Create a lightweight change accumulator service.

Possible model:

```ts
type ChangeKind =
  | "lyrics"
  | "structure"
  | "metadata"
  | "import"
  | "ai-assisted";

type PendingVersionEvent = {
  startedAt: number;
  lastChangedAt: number;
  kinds: Set<ChangeKind>;
  changedSections: Set<string>;
  magnitude: number;
};
```

Flush an autosnapshot only when rules justify it.

## 10.4 Lyric rewrite magnitude

For automatic checkpoints, compare previous and current active lyrics by:

- changed line count
- inserted/removed character ratio
- number of changed Sections
- elapsed editing burst

Example initial threshold:

- save before a rewrite replaces/removes a substantial percentage of a Section
- do not snapshot normal continuous typing

Exact thresholds should be configurable constants and tuned through real use.

## 10.5 Deduplication

Before saving:

- compare serialized meaningful state or content fingerprint
- skip snapshots identical to the newest snapshot
- coalesce multiple structure actions within a short session window

Add source:

- `autosave` or `checkpoint`

Update `VersionSnapshotSource` accordingly.

## 10.6 Retention

Current history caps at roughly 50 snapshots.

Autosnapshots need separate retention policy so they do not evict valuable manual versions too aggressively.

Recommended:

- manual/safety snapshots have higher retention priority
- autosnapshots can be thinned by age
- never silently delete the latest manual checkpoint to make room for low-value autosnapshots

## 10.7 Acceptance criteria

- normal typing does not create snapshot spam
- deleting a Section remains protected
- a clearly large rewrite produces a recoverable checkpoint
- multiple quick reorders coalesce rather than generating many snapshots
- identical snapshots are skipped
- manual snapshots remain prominent
- Versions clearly labels automatic checkpoints
- restore behavior remains unchanged

---

# 11. Workstream 8: Hardening, Accessibility, CSS, and Migrations

This workstream has two parts:

- **8A enabling foundation** before other model changes
- **8B final hardening** after feature work

## 11.1 8A: schema version and normalization

Add a schema version to exported/persisted Song data.

Recommended approach:

```ts
const CURRENT_SONG_SCHEMA_VERSION = 1;
```

Avoid requiring every historic in-memory sample to be rewritten at once by allowing normalization to infer version 0 for existing data.

Create:

- `src/services/songSchema.ts`
- `normalizeSong(raw: unknown): Song`
- `migrateSong(raw: unknown): Song`

Normalization should:

- validate required IDs/types
- supply missing optional arrays/fields
- ensure at least one valid arrangement if required
- remove arrangement occurrences whose Section no longer exists
- repair invalid activeVersionId when possible
- ensure every Section has at least one valid version
- normalize optional Ideas/settings
- preserve unknown data only when safe/intentional

Local persistence and file import both use this same path.

Do not delete saved data automatically just because a newer optional field is absent.

## 11.2 Import safety

`songFile.ts` currently parses and casts JSON directly.

Change flow to:

1. parse JSON
2. validate/migrate
3. return normalized Song
4. show user-facing import error if irrecoverable
5. do not mutate current Song until import succeeds

## 11.3 Storage failure state

Current `saveSong()` logs failures.

Add application-visible save status:

- saved
- saving
- error

The persistent header should not say “Saved locally” after storage throws.

## 11.4 Accessibility pass

Audit:

- keyboard focus order
- visible focus indicators
- buttons with icon-only labels
- custom context-menu keyboard navigation
- modal focus trapping/restoration
- Escape behavior
- color contrast
- drag-and-drop keyboard alternatives
- textarea labels/relationships
- reduced-motion behavior
- screen-reader naming for score/status chips

Structural actions need non-drag alternatives.

Examples:

- Move occurrence up/down
- Move to beginning/end
- Add Section through keyboard-accessible control

## 11.5 Keyboard shortcuts

Document and implement a compact set:

- Undo / Redo
- Save snapshot/checkpoint
- Add Section
- focus Search/Explore if introduced
- open Versions
- optional move occurrence controls

Avoid shortcuts that conflict with normal text editing.

## 11.6 CSS consolidation

Do not rewrite the entire design system at once.

Refactor opportunistically:

- `src/styles/base.css`
- `src/styles/write.css`
- `src/styles/arrange.css`
- `src/styles/explore.css`
- `src/styles/versions.css`
- `src/styles/intelligence.css`

Move stable blocks out of `index.css` feature by feature.

Remove confirmed stale rules such as old drop-zone styles after validating no runtime references remain.

## 11.7 Test strategy

Add a lightweight unit-test framework when the first migration/analysis modules are extracted.

Highest-value automated tests:

### Persistence

- version-0 Song migrates
- orphan occurrence is removed
- invalid activeVersionId repairs
- invalid import rejects safely

### Rhyme

- exact phonetic rhyme
- slant rhyme
- repeated-word penalty
- unknown-word fallback

### Lexical analysis

- repeated Chorus occurrence does not inflate unique authored-text counts
- phrase detection
- stop-word handling

### Autosnapshot rules

- small typing burst does not trigger
- large rewrite triggers
- duplicate state is skipped
- quick reorder burst coalesces

### Selection replacement

- exact range replacement
- offsets after replacement
- undo round trip

UI verification remains necessary for drag/focus/textarea behavior.

## 11.8 Acceptance criteria

- older saved Songs load after model additions
- JSON import is validated and migrated
- save failure is visible
- core actions can be completed without pointer-only drag
- custom modal/context UI is keyboard navigable
- no known orphan arrangement IDs survive normalization
- CSS additions no longer rely exclusively on the monolithic global file
- build, lint, and core manual regression checklist pass

---

# 12. Cross-Workstream Data Decisions

## 12.1 Do not introduce stable Line entities yet

None of the first seven workstreams requires persistent Line IDs.

Text selection can use character ranges in active SectionVersion lyrics.

Delay stable Line entities until a feature truly requires durable line identity across rewrites, such as:

- line-scoped annotations that must survive arbitrary edits
- individual-line version restore with identity tracking
- line-level collaboration/comments

This avoids a high-risk migration without immediate payoff.

## 12.2 Keep Ideas as the shared creative staging object

Title candidates, Hook candidates, imported fragments, and saved AI candidates should use `SongIdea` where practical.

Only create specialized entities when Idea fields become insufficient.

This preserves Explore as the common staging area.

## 12.3 Derived analysis stays out of source-of-truth Song data

Rhyme, lexical, semantic, and structure analyses should remain derived/cached data.

Do not persist large analysis result blobs inside Song merely to make UI rendering easier.

Snapshots may persist compact score summaries.

## 12.4 Mutation path rule

Any accepted action that changes the Song must go through Zustand store mutations so that:

- undo/redo works
- updatedAt is touched consistently
- persistence sees the change
- semantic freshness can invalidate correctly

Avoid component-local mutation of Song objects.

---

# 13. Proposed File Map

Expected new files:

```text
src/
  analysis/
    lexicalAnalysis.ts
    conceptAnalysisState.ts          # existing
    lyricsAnalysis.ts                # existing
    structureAnalysis.ts             # existing

  rhyme/
    types.ts
    pronunciationLexicon.ts
    rhymeEngine.ts
    rhyme.worker.ts                  # optional depending on asset size

  music/
    keyTheory.ts
    chords.ts

  services/
    songSchema.ts
    noteImport.ts
    autosnapshot.ts
    writingAssistant.ts
    songPersistence.ts               # existing, route through schema
    songFile.ts                      # existing, route through schema
    versionHistory.ts                # existing, extend sources/retention

  components/
    explore/
      RhymeExplorer.tsx
      TitleHookLab.tsx
      ImportNotesPanel.tsx
      ExploreWorkspace.tsx           # existing

    sections/
      SelectionTools.tsx
      ChordPanel.tsx
      SectionEditor.tsx              # existing

    assistant/
      SuggestionTray.tsx

  types/
    selection.ts
    import.ts
    assistant.ts
    music.ts                         # only if chord model expands
```

Names are planning targets, not mandatory API commitments. Keep modules cohesive rather than creating files solely to match this tree.

---

# 14. Store Evolution

Expected store additions over the roadmap:

### Selection

- `lyricSelection`
- `setLyricSelection()`
- `replaceLyricRange()`

### Chords

- `setSectionChords()`
- `addChord()`
- `removeChord()`
- `moveChord()`

### Import

Prefer committing imported Ideas through existing `addIdea`/bulk equivalent.

Add:

- `addIdeasBulk()`

A bulk mutation avoids creating one undo entry per imported fragment.

### AI-assisted acceptance

- `replaceLyricRange()`
- `insertLyricText()`
- normal Idea actions

The generator itself should not mutate the store.

### Snapshot integration

Autosnapshot monitoring should observe committed store changes or explicit mutation metadata without turning every Zustand setter into snapshot logic.

---

# 15. Suggested Delivery Waves

## Wave A: Foundation + Rhyme

**Status:** In progress.

Implemented:
- schema version / normalization
- safe import pipeline
- initial local pronunciation lexicon
- pronunciation-aware rhyme engine with deterministic spelling fallback
- Explore Rhyme Explorer
- active-line rhyme integration

Still required before Wave A is complete:
- broaden the pronunciation dataset beyond the initial songwriting vocabulary
- verify exact/near/slant behavior against a representative QA word set
- decide the distributable long-term pronunciation data source and licensing
- run real-song regression testing and tune ranking

**Exit condition:** offline rhyme exploration is materially better than the current spelling heuristic and old Songs still load.

## Wave B: Selection + Lexical Intelligence

- rich lyric selection
- range replacement
- selection-specific Context
- lexical analysis
- overuse/repetition view
- Title/Hook Lab

**Exit condition:** selecting text feels like a first-class interaction and Title/Hook development has a dedicated useful workflow.

## Wave C: Import + Generative Assistance

- note segmentation
- import review
- bulk Idea commit
- WritingAssistant abstraction
- candidate tray
- selected-text/active-line generation actions
- provenance metadata where necessary

**Exit condition:** user-owned notes and generated suggestions both enter through non-destructive staging workflows.

## Wave D: Musical Layer + Version Intelligence

- Chord Mode v1
- key-aware palette
- progression editing
- autosnapshot event model
- retention/deduplication

**Exit condition:** lightweight harmony is useful without DAW creep, and Versions captures meaningful milestones without noise.

## Wave E: Hardening

- accessibility audit
- keyboard structural actions
- visible save-error state
- CSS consolidation
- migration regression tests
- analysis unit tests
- stale rule cleanup
- final full-workspace regression

**Exit condition:** the app is stable enough for repeated real songwriting sessions without known data-loss or interaction traps.

---

# 16. Regression Checklist for Every Wave

Before a wave is considered complete:

1. Write opens and existing saved Song loads.
2. Direct lyric editing works.
3. Repeated Section occurrences still share content correctly.
4. Section-library drag into Write still uses stable insertion feedback.
5. Arrange reorder/duplicate/remove remains synchronized with Write.
6. Explore Ideas persist.
7. Concept analysis still runs in the worker and stale state invalidates correctly.
8. Versions can save, compare, and restore.
9. Undo/redo works after the new mutations.
10. No browser-native application alert/confirm/prompt is introduced.
11. `npm run build` passes.
12. `npm run lint` passes or any pre-existing lint exception is explicitly documented.

---

# 17. Product Guardrails

During implementation, reject or redesign work that causes any of these regressions:

- Write becomes an analytics dashboard.
- AI suggestions overwrite lyrics automatically.
- a repeated Chorus becomes duplicated source content instead of repeated arrangement occurrences.
- a score is presented as artistic quality.
- remote AI becomes required for core use.
- Chord Mode begins turning the product into a DAW.
- autosnapshots become a noisy keystroke history.
- imported notes are automatically rearranged into the Song without review.
- pronunciation/rhyme tools require permanent internet access.
- new persistence fields make older Songs unloadable.
- feature work keeps expanding global CSS without consolidation.
- structural actions become pointer-only.

---

# 18. Definition of Roadmap Complete

These eight priorities are complete when a songwriter can:

1. find high-quality offline rhyme families using pronunciation rather than spelling alone
2. select an exact phrase and act on that phrase contextually
3. develop and compare Titles/Hooks while seeing lexical repetition intelligently
4. import messy notes and curate them into Explore
5. optionally request focused generated alternatives without surrendering control of the lyric
6. attach and work with lightweight chord progressions in context
7. trust Versions to preserve meaningful creative milestones automatically
8. trust older files, keyboard interaction, save state, and core app behavior after upgrades

At that point Songwriter Studio should be treated as feature-complete for its core songwriting/revision identity. Further work should be driven primarily by real songwriting-session friction, not by adding breadth for its own sake.
