<div align="center">

# doro-doro

**A keyboard-first focus workspace — pomodoro timer, time-boxed task board, calendar, and future-back goal planner, all running 100% on-device.**

[![Next.js 16.2](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19.2](https://img.shields.io/badge/React-19.2-149eca?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1?logo=bun&logoColor=black)](https://bun.sh)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Dexie](https://img.shields.io/badge/Dexie-IndexedDB-006acc)](https://dexie.org)

</div>

---

doro-doro is a single-page focus tool built around four ideas: **time it, box it, schedule it, work backward from it**. Everything lives in your browser — no server, no account, no telemetry. Data persists locally in IndexedDB via Dexie.

## Features

- 🍅 **Pomodoro timer** with a 12-wedge dial, live hour gauge, custom session length, optional auto-cycle (work / short / long), and a sun-like animated gradient backdrop derived from your chosen accent color.
- 🧠 **Brain dump → tasks** — capture thoughts in a column, promote them into prioritized tasks with one click, drag to reorder.
- 🗂 **Task board** — list and timeline views, priority/status color tokens, label chips, drag-and-drop ordering.
- 📅 **Calendar** — day / week / month / year views, recurring events (RFC-5545-ish rrule), per-occurrence exclusions, side-panel metrics with sparklines.
- 🎯 **Future-back planner** — pick a target date, work backward through WHY / OBSTACLES / PLAN / OKR / KPI.
- 🏷 **Labels** — custom color-coded tags shared across tasks, events, and goals.
- ⌨️ **Linear-style shortcuts** — `g t` / `g b` / `g c` / `g f` to navigate, `c t` / `c e` / `c d` / `c s` to create, `s s` to toggle the timer, `d d` to delete, `?` for the cheat sheet.
- 🎨 **Command palette** — `⌘P` or `⌘K` opens a fuzzy-matched action launcher.
- 🌗 **Light & dark themes** with semantic CSS variables (no hard-coded hex in components).
- 📱 **Mobile-first responsive** layout with a bottom tab bar and safe-area awareness.
- 🔌 **Offline-first** — IndexedDB only; no network round-trips required after the first load.

## Quick Start

> doro-doro uses **[Bun](https://bun.sh)** as the package manager and runtime. `npm` / `yarn` / `pnpm` will not be used in scripts.

```bash
# Install dependencies
bun install

# Start the dev server (http://localhost:3000)
bun run dev

# Production build
bun run build
bun run start

# Lint + format check
bun run lint
bun run format
```

## Keyboard Shortcuts

| Action | Keys |
| --- | --- |
| Open command palette | `⌘P` / `⌘K` |
| Open shortcuts cheat sheet | `?` |
| Switch tab | `1` `2` `3` `4` |
| Go to Timer / Timebox / Calendar / Futureback | `g t` / `g b` / `g c` / `g f` |
| New Task | `c t` |
| New Event | `c e` |
| Focus Dump input | `c d` |
| Start timer session | `c s` |
| Pause / resume timer | `s s` |
| Delete selected item | `d d` |
| Close any modal | `Esc` |

Sequences fire when the second key is pressed within 1.2 seconds.

## Tech Stack

| Layer | Choice |
| --- | --- |
| Runtime / package manager | **Bun** |
| Framework | **Next.js 16.2** (App Router, Turbopack, `reactCompiler: true`) |
| UI | **React 19.2** + **Tailwind CSS v4** + `motion/react` |
| State | **Zustand** — session UI state + persisted system state |
| Storage | **IndexedDB** via **Dexie 4** with versioned migrations |
| Drag-and-drop | **@dnd-kit** |
| Dates | **date-fns** |
| Linter / formatter | **Biome 2.2** |
| Icons | **react-icons** (Feather set) |

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    AppShell (client)                       │
│  ┌──────────┬───────────┬──────────┬─────────────────┐    │
│  │  Timer   │  Timebox  │ Calendar │   Futureback    │    │
│  └────┬─────┴─────┬─────┴─────┬────┴─────────┬───────┘    │
│       │           │           │              │            │
│       ▼           ▼           ▼              ▼            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │   Hooks layer (dexie-react-hooks · useLiveQuery)    │  │
│  │   useTasks · useEvents · useSessions · useLabels    │  │
│  └─────────────────────────────────────────────────────┘  │
│       │                                                    │
│       ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Repositories (writes) · Dexie (IndexedDB schema)   │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

- **Reads** flow through hooks in `src/db/hooks.ts` wrapping `useLiveQuery` with SSR-safe fallbacks.
- **Writes** go through repositories in `src/db/repositories/*` — components never call `getDB()` directly to mutate.
- **State** is split: `src/stores/app.ts` for ephemeral session UI, `src/stores/system.ts` for persisted preferences (theme, last tab).
- **Theme** is driven entirely by CSS custom properties declared in `src/app/globals.css`. Components reference `var(--bg-0)`, `var(--ink-0)`, `var(--prio-1)`, `var(--danger)`, etc. — never raw hex.

## Project Structure

```
src/
├─ app/                       # Next.js App Router entry, global styles
├─ components/
│  ├─ shell/                  # AppShell, CommandPalette, ShortcutsHelpModal, LabelPicker
│  ├─ timer/                  # PomodoroDial, HourGauge, TimerBackdrop, FocusSummaryCards
│  ├─ timebox/                # DumpColumn, TaskBoard, ProgressDash, TaskDetailDrawer
│  ├─ calendar/               # CalendarView, MetricsSidebar, EventEditorModal, recurrence
│  ├─ futureback/             # FutureBackView, GoalEditor
│  ├─ charts/                 # Sparkline, MiniBars, ProgressRing
│  └─ templates/              # Reusable task template editor
├─ db/
│  ├─ dexie.ts                # Versioned IndexedDB schema
│  ├─ hooks.ts                # Read hooks
│  └─ repositories/           # Write functions, one per table
├─ lib/
│  ├─ shortcuts/              # Linear-style shortcut engine + command bus
│  ├─ colorShades.ts          # Hex → shade mix for the timer backdrop
│  ├─ taskColors.ts           # Priority / status color tokens
│  └─ time.ts                 # Shared date-fns helpers
├─ stores/                    # Zustand stores (app + system)
└─ types/                     # Domain types (Task, CalendarEvent, Goal, Label, …)
```

## Data Model

All timestamps are stored as **epoch milliseconds**. The current Dexie schema is `version(5)`:

| Table | Purpose |
| --- | --- |
| `tasks` | Prioritized work items with status, optional schedule, labels |
| `dumpItems` | Brain-dump rows promotable to tasks |
| `events` | Calendar events with optional `rrule` and `exDates` |
| `sessions` | Pomodoro sessions with phase, completion, reflection |
| `goals` | Future-back goals with KRs / KPIs |
| `labels` | Color-coded tags referenced by `labelIds` on other entities |
| `taskTemplates` | Reusable task bundles |
| `settings` | Singleton (timer color, cycle config, theme) |

## Privacy

doro-doro is fully client-side. No requests are made to any backend after the static assets are served. Clearing site data wipes everything.

## Scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Start Next.js in dev mode |
| `bun run build` | Production build (Turbopack) |
| `bun run start` | Serve the production build |
| `bun run lint` | `biome check` |
| `bun run format` | `biome format --write` |

## Contributing

This is a personal-focus tool that doubles as a Next.js / React 19 / Bun reference. PRs that keep things small, theme-token-driven, and offline-only are welcome.

Conventions:

- Use **CSS variables**, not raw hex, when touching component styling.
- **Reads** go through hooks in `src/db/hooks.ts`; **writes** go through repositories.
- The React Compiler is on — do **not** add defensive `useMemo` / `useCallback`.
- When adding a new field or table, bump the Dexie version in `src/db/dexie.ts` and add a migration.

## License

MIT
