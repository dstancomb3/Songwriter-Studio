# Songwriter Studio Architecture

## Vision Statement

Songwriter Studio is a songwriting workspace built around the idea that songs are systems rather than documents.

Traditional lyric editors treat songs as blocks of text. Songwriter Studio treats songs as collections of reusable components, relationships, themes, melodies, arrangements, and creative decisions.

The goal is not to write songs for the user.

The goal is to help songwriters understand, organize, experiment with, and develop the songs they are already creating.

The software acts as a collaborator, analyst, and creative mirror.

The songwriter remains the sole author.

---

# Core Philosophy

## Songs Are Systems

A song is not simply a sequence of lyrics.

A song consists of multiple interacting layers:

* Structure
* Lyrics
* Melody
* Chords
* Themes
* Motifs
* Dynamics
* Performance Notes
* Production Ideas
* Emotional Arc

Every feature should help reveal relationships between these layers.

---

## Discovery Over Generation

The application should prioritize discovery rather than replacement.

Good:

* Pattern detection
* Theme tracking
* Motif analysis
* Emotional arc visualization
* Cadence analysis
* Structural insights

Avoid:

* Automatically replacing creativity
* Generating entire songs by default
* Overwriting user work

The application should ask:

"What do I notice?"

before asking:

"What should I create?"

---

## Sections Are Reusable

Song sections should exist independently from arrangements.

A chorus should be written once and reused many times.

Changes to a section should automatically update every occurrence within an arrangement.

---

## Preserve Everything

Creative work should never be lost.

The application should support:

* Version history
* Alternative drafts
* Alternate arrangements
* Melody variations
* Chord variations

Users should be encouraged to experiment freely.

---

# Core Data Models

## Song

Represents a complete songwriting project.

```typescript
interface Song {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;

  sections: Section[];
  arrangements: Arrangement[];

  themes: Theme[];

  settings: SongSettings;
}
```

---

## Section

A reusable song component.

```typescript
interface Section {
  id: string;

  type:
    | "intro"
    | "verse"
    | "pre-chorus"
    | "chorus"
    | "post-chorus"
    | "bridge"
    | "hook"
    | "outro"
    | "custom";

  title: string;

  versions: SectionVersion[];

  activeVersionId: string;
}
```

---

## Section Version

Stores alternate versions of the same section.

```typescript
interface SectionVersion {
  id: string;

  lyrics: string;

  chords: ChordData[];

  melody: MelodyData;

  markers: Marker[];

  notes: string;
}
```

---

## Arrangement

Determines song order.

```typescript
interface Arrangement {
  id: string;

  name: string;

  sequence: ArrangementItem[];
}
```

---

## Arrangement Item

References a section.

```typescript
interface ArrangementItem {
  sectionId: string;
}
```

---

## Marker

Non-lyrical events within a section.

```typescript
interface Marker {
  id: string;

  category:
    | "performance"
    | "instrument"
    | "production"
    | "arrangement";

  label: string;

  position: number;
}
```

Examples:

* Whisper
* Scream
* Harmony
* Drums Enter
* Piano Only
* Instrumental Break
* Key Change

---

## Melody Data

Future MIDI support.

```typescript
interface MelodyData {
  notes: MidiNote[];
}
```

```typescript
interface MidiNote {
  pitch: string;
  start: number;
  duration: number;
  velocity: number;
}
```

---

## Theme

Tracks recurring concepts.

```typescript
interface Theme {
  id: string;

  name: string;

  keywords: string[];
}
```

---

# User Interface Architecture

## Left Panel

Section Editor

Purpose:

Create and edit reusable song components.

Contains:

* Section list
* Section editor
* Version management
* Lyrics
* Chords
* Melody
* Notes
* Markers

---

## Center Panel

Arrangement Builder

Purpose:

Define song structure.

Contains:

* Arrangement timeline
* Drag-and-drop ordering
* Song map
* Alternate arrangements

---

## Right Panel

Live Preview

Purpose:

Render the final song exactly as arranged.

Contains:

* Formatted lyrics
* Markers
* Chords
* Export preview

---

## Analysis Sidebar

Purpose:

Reveal patterns and structure.

Contains:

* Theme tracking
* Motif detection
* Discovery insights
* Emotional arc
* Cadence analysis
* Syllable analysis

---

# Feature Roadmap

## Phase 1 - Foundation

Goal:

Create a functional songwriting workspace.

Features:

* React application
* Song creation
* Section editor
* Arrangement builder
* Live preview
* Local storage save/load
* Dark mode

Success Criteria:

User can write and arrange complete songs.

---

## Phase 2 - Structure

Goal:

Improve organization.

Features:

* Drag and drop
* Song map
* Notes
* Markers
* Section versions
* Alternate arrangements

Success Criteria:

User can experiment with song structure safely.

---

## Phase 3 - Music Layer

Goal:

Add musical context.

Features:

* Chords
* Chord display
* Piano roll editor
* MIDI playback
* Tempo controls
* Instrument selection

Success Criteria:

User can hear rough song ideas inside the application.

---

## Phase 4 - Discovery

Goal:

Reveal song structure.

Features:

* Syllable counting
* Cadence analysis
* Theme tracking
* Motif tracking
* Emotional arc
* Discovery panel

Success Criteria:

Application provides meaningful observations without replacing creativity.

---

## Phase 5 - Creative Assistance

Goal:

Offer optional collaboration tools.

Features:

* Rhyme suggestions
* Rewrite line suggestions
* Expand idea tools
* Metaphor exploration
* Melody suggestions

Success Criteria:

AI assists without taking authorship away from the songwriter.

---

# Guiding Principle

Every new feature should answer this question:

"Does this help the songwriter understand, explore, organize, or develop their song?"

If the answer is no, the feature should not be added.



# Project Structure

```text
songwriter-studio/

├── docs/
│   └── architecture.md
│
├── public/
│
├── src/
│
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes/
│   │   └── layouts/
│   │
│   ├── components/
│   │
│   │   ├── sections/
│   │   ├── arrangement/
│   │   ├── preview/
│   │   ├── analysis/
│   │   ├── melody/
│   │   ├── chords/
│   │   └── common/
│   │
│   ├── features/
│   │
│   │   ├── songs/
│   │   ├── sections/
│   │   ├── arrangements/
│   │   ├── themes/
│   │   ├── melody/
│   │   └── analysis/
│   │
│   ├── store/
│   │   ├── songStore.ts
│   │   ├── uiStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── services/
│   │   ├── persistence/
│   │   ├── export/
│   │   ├── analysis/
│   │   ├── midi/
│   │   └── ai/
│   │
│   ├── hooks/
│   │
│   ├── types/
│   │
│   ├── utils/
│   │
│   └── styles/
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```


# State Actions

State actions define every operation that can modify application state.

All user interactions should eventually flow through these actions.

React components should remain as presentation layers whenever possible.

---

# State Flow

All data should move through a predictable path:

```text
User Input
      ↓
Store Action
      ↓
State Update
      ↓
Services (Optional)
      ↓
UI Refresh
```

The live preview should never directly modify song data.

The preview is a read-only representation of the current song state.

---

# Song Actions

These actions manage complete songwriting projects.

```typescript
createSong()
loadSong(songId: string)
saveSong()
deleteSong(songId: string)

renameSong(songId: string, title: string)

duplicateSong(songId: string)
```

Responsibilities:

* Create new projects
* Load existing projects
* Save projects
* Rename projects
* Duplicate projects

---

# Section Actions

These actions manage reusable song sections.

```typescript
createSection(type: SectionType)

updateSection(
  sectionId: string,
  updates: Partial<Section>
)

deleteSection(sectionId: string)

duplicateSection(sectionId: string)

reorderSections(
  sourceIndex: number,
  destinationIndex: number
)

setActiveSection(sectionId: string)
```

Responsibilities:

* Create sections
* Edit sections
* Delete sections
* Reorder sections
* Select active section

Examples:

* Intro
* Verse
* Pre-Chorus
* Chorus
* Bridge
* Outro

---

# Section Version Actions

Each section can contain multiple versions.

Example:

Chorus
├─ Version A
├─ Version B
└─ Version C

```typescript
createVersion(sectionId: string)

deleteVersion(
  sectionId: string,
  versionId: string
)

duplicateVersion(
  sectionId: string,
  versionId: string
)

renameVersion(
  sectionId: string,
  versionId: string,
  name: string
)

setActiveVersion(
  sectionId: string,
  versionId: string
)
```

Responsibilities:

* Preserve alternate drafts
* Compare ideas
* Prevent loss of creative work

---

# Arrangement Actions

Arrangements define song structure.

Sections exist independently.

Arrangements reference sections.

Example:

Intro
Verse 1
Chorus
Verse 2
Chorus
Bridge
Chorus
Outro

```typescript
createArrangement()

deleteArrangement(arrangementId: string)

duplicateArrangement(arrangementId: string)

renameArrangement(
  arrangementId: string,
  name: string
)

addSectionToArrangement(
  arrangementId: string,
  sectionId: string
)

removeSectionFromArrangement(
  arrangementId: string,
  itemIndex: number
)

moveArrangementItem(
  arrangementId: string,
  sourceIndex: number,
  destinationIndex: number
)

setActiveArrangement(arrangementId: string)
```

Responsibilities:

* Define song order
* Reuse sections
* Support alternate arrangements

---

# Marker Actions

Markers are non-lyrical events.

Examples:

* Whisper
* Scream
* Harmony
* Instrumental Break
* Drums Enter
* Piano Only
* Key Change

```typescript
createMarker(
  sectionId: string,
  marker: Marker
)

updateMarker(
  sectionId: string,
  markerId: string,
  updates: Partial<Marker>
)

deleteMarker(
  sectionId: string,
  markerId: string
)

moveMarker(
  sectionId: string,
  markerId: string,
  newPosition: number
)
```

Responsibilities:

* Track performance notes
* Track production notes
* Track arrangement notes

---

# Melody Actions

Reserved for future MIDI functionality.

```typescript
addMidiNote(
  sectionId: string,
  note: MidiNote
)

updateMidiNote(
  sectionId: string,
  noteId: string,
  updates: Partial<MidiNote>
)

deleteMidiNote(
  sectionId: string,
  noteId: string
)

moveMidiNote(
  sectionId: string,
  noteId: string,
  newStart: number
)

quantizeMelody(sectionId: string)
```

Responsibilities:

* MIDI editing
* Piano roll support
* Melody playback

---

# Theme Actions

Themes help track recurring ideas.

Example:

Theme:
Temptation

Keywords:
deal
price
gold
devil
soul

```typescript
createTheme(name: string)

updateTheme(
  themeId: string,
  updates: Partial<Theme>
)

deleteTheme(themeId: string)
```

Responsibilities:

* Manage song themes
* Support future analysis tools

---

# Analysis Actions

Analysis is read-only.

Analysis must never modify song data.

Analysis may observe.

Analysis may suggest.

Analysis may highlight.

Analysis may not rewrite content automatically.

```typescript
analyzeCadence()

analyzeThemes()

analyzeMotifs()

analyzeStructure()

analyzeMelody()

generateDiscoveryInsights()
```

Examples:

✓ "The bridge introduces no new imagery."

✓ "The word 'fire' appears 11 times."

✓ "Verse 2 and Verse 3 serve similar purposes."

✗ Automatically rewriting lyrics.

✗ Automatically changing structure.

---

# UI Actions

These actions manage temporary interface state.

```typescript
setActivePanel(panelId: string)

toggleDarkMode()

toggleChordMode()

toggleAnalysisPanel()

toggleMelodyPanel()

togglePreviewPanel()
```

These actions affect presentation only.

They should never modify song content.

---

# Guiding Rule

Every action must answer:

"Is this modifying song data, observing song data, or changing the user interface?"

The three responsibilities should remain separate whenever possible.


# MVP Scope Lock

The first release must support:

* Create Song
* Rename Song
* Create Section
* Edit Lyrics
* Create Arrangement
* Reorder Arrangement
* Live Preview
* Local Save
* Dark Mode

The first release will NOT include:

* MIDI
* Chords
* AI
* Theme Analysis
* Discovery Panel
* Exports
* Collaboration
* Cloud Sync

Rule:

If a feature is not required to write, arrange, preview, and save a song, it does not belong in the MVP.

---

# Initial Layout

```text
------------------------------------------------------
| Toolbar                                             |
------------------------------------------------------
| Sections | Arrangement | Live Preview              |
|          |             |                           |
|          |             |                           |
|          |             |                           |
------------------------------------------------------
```

## Sections Panel

Purpose:

Create and edit reusable song sections.

Contains:

* Section List
* Add Section Button
* Section Editor
* Section Metadata

---

## Arrangement Panel

Purpose:

Define song structure.

Contains:

* Arrangement List
* Arrangement Timeline
* Drag-and-Drop Reordering
* Repeated Section References

Example:

Intro
Verse 1
Chorus
Verse 2
Chorus
Bridge
Chorus
Outro

---

## Live Preview Panel

Purpose:

Render the song exactly as arranged.

Contains:

* Formatted Lyrics
* Section Labels
* Future Marker Display
* Future Chord Display

The preview is always generated from arrangement data and section data.

The preview never stores data.

---

## Future Expandable Panels

Reserved for future phases:

* Analysis
* Melody
* Chords
* Discovery
* Theme Tracking
* MIDI Editor

These should not be implemented during MVP development.

---

# Ownership Rules

Ownership rules define which parts of the application are responsible for specific data.

These rules should never be violated.

---

## Section Owns

Sections own:

* Lyrics
* Markers
* Notes
* Chords
* Melody
* Versions

Sections do NOT own:

* Song Order
* Arrangement Information

---

## Arrangement Owns

Arrangements own:

* Section Order
* Section Repetition
* Song Structure

Arrangements do NOT own:

* Lyrics
* Chords
* Melody
* Notes

Arrangements only reference sections.

---

## Preview Owns

Preview owns:

* Rendering
* Formatting
* Display

Preview does NOT own:

* Song Data
* Arrangement Data
* Editing Logic

Preview is read-only.

---

## Analysis Owns

Analysis owns:

* Observations
* Metrics
* Pattern Detection
* Theme Detection
* Structural Insights

Analysis does NOT own:

* Song Editing
* Song Rewriting
* Arrangement Changes

Analysis may observe.

Analysis may suggest.

Analysis may never modify song data automatically.

---

## Melody System Owns

Future responsibility:

* MIDI Notes
* Piano Roll Data
* Playback Information
* Tempo Information

The melody system does NOT own lyrics.

---

## Chord System Owns

Future responsibility:

* Chord Progressions
* Chord Display
* Chord Playback

The chord system does NOT own lyrics.

---

## AI System Owns

Future responsibility:

* Suggestions
* Brainstorming
* Rewrites
* Idea Expansion

The AI system does NOT own:

* Final Lyrics
* Song Structure
* Automatic Changes

The songwriter remains the author at all times.

---

# Architectural Laws

Law 1

Sections contain content.

Arrangements contain order.

Never combine these responsibilities.

---

Law 2

Preview renders data.

Preview never stores data.

---

Law 3

Analysis observes data.

Analysis never changes data.

---

Law 4

Every feature must answer:

"Does this help the songwriter understand, explore, organize, or develop their song?"

If the answer is no, the feature should not be added.

---

Law 5

Preserve everything.

No creative work should ever be permanently lost without deliberate user action.
