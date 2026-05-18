# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Runtime is **Bun**. Always use `bun` / `bunx` (not `node`/`npm`/`npx`).

- `bun run dev` — Next.js dev server (http://localhost:3000)
- `bun run build` — production build
- `bun run start` — start production server
- `bun run lint` — Biome lint + check (`biome check`)
- `bun run format` — Biome formatter (`biome format --write`)

No test runner is configured.

## Stack & Conventions

- **Next.js 16.2 / React 19.2** with the App Router. `next.config.ts` enables `reactCompiler: true` (babel-plugin-react-compiler) — do not manually memoize what the compiler already handles.
- **TypeScript strict**. Path alias `@/*` → `src/*`.
- **Tailwind v4** via `@tailwindcss/postcss`. Theme tokens (`--bg-0`, `--ink-0`, `--line`, `--safe-bottom`, etc.) are defined in `src/app/globals.css`; **use CSS variables, not hardcoded colors**.
- **Biome 2.2** is the linter/formatter (2-space indent). Next.js and React rule domains are enabled. `noUnknownAtRules` is off (for Tailwind directives).
- **Animations**: `motion/react` (v12).
- **Drag & drop**: `@dnd-kit/*`.
- **Date math**: `date-fns`. IDs: `nanoid`.

Per AGENTS.md: this Next.js may have breaking changes vs. training data — consult `node_modules/next/dist/docs/` before writing non-trivial Next.js code.

## Architecture

Single-page client app shell rendering one of three tabs. There is no backend: all persistence is **IndexedDB via Dexie**, client-only.

### Top-level shape

- `src/app/page.tsx` is a thin server component that renders `<AppShell />`.
- `src/components/shell/AppShell.tsx` owns the tab chrome (desktop top-nav, mobile bottom-nav), keyboard shortcuts (`1`/`2`/`3` switches tabs), and mounts one of:
  - `TimerPanel` (timer tab)
  - `TimeboxView` (timebox tab — dump column + task board + progress dash)
  - `CalendarView` (calendar tab — day/week/month/year + metrics sidebar)
- Mobile vs. desktop layout is decided by `useMediaQuery("(max-width: 768px)")`.

### State (Zustand)

State is split into two stores:

- `src/stores/app.ts` — **session UI state** (`activeTab`, `calendarView`, `calendarCursor`, `taskBoardView`, selected ids, `mobileTimeboxPane`). Non-persisted.
- `src/stores/system.ts` — system-level persistence (e.g. `lastTab` restored on mount in `AppShell`).

Domain data is **not** in Zustand — it lives in IndexedDB and is read via `dexie-react-hooks` `useLiveQuery`.

### Persistence layer (`src/db/`)

- `dexie.ts` — `DoroDB` definition. Tables: `tasks`, `dumpItems`, `events`, `sessions`, `settings` (singleton, id=`"singleton"`). DB name: `doro-doro`. `getDB()` is browser-only and throws on SSR; never call it from a server component or top-level module.
- `hooks.ts` — `useTasks`, `useTasksInRange`, `useDumpItems`, `useEvents`, `useEventsInRange`, `useSessions`, `useSessionsInRange`, `useSettings`. All wrap `useLiveQuery` with SSR-safe fallbacks. Prefer the range variants for calendar/timeline views.
- `repositories/*.ts` — write-side functions (one repo per table). Keep mutations here; components should not call `getDB()` directly for writes.
- `DEFAULT_SETTINGS` in `dexie.ts` is the fallback shape for the settings singleton; `ensureSettings()` bootstraps it.

When adding a new field/table, bump the Dexie version and add a migration in `DoroDB.constructor` — current schema is `version(1)`.

### Domain types (`src/types/domain.ts`)

Single source of truth: `Task`, `DumpItem`, `CalendarEvent`, `PomodoroSession` (with optional `SessionReflection`), `Settings`. `CalendarItem` is a tagged union (`kind: "task" | "event"`) used by the unified calendar render path.

Times are stored as **epoch ms** (number), not Date objects. `priority: 1` is highest. Tasks have `order` for manual drag-sort.

### Feature folders

Each tab has a self-contained folder under `src/components/`:

- `timer/` — `TimerPanel` composes `PomodoroDial` + `HourGauge`. `useTimerEngine.ts` is the timer state machine (work/short/long phases, session writes). `SessionReflectionModal` captures post-session reflection.
- `timebox/` — `TimeboxView` arranges `DumpColumn` (brain dump → promotable to tasks), `TaskBoard` (with `TaskListView` / `TaskTimelineView` toggled by `taskBoardView`), `ProgressDash`, and `TaskDetailDrawer`. Drag from dump → tasks uses `@dnd-kit`.
- `calendar/` — `CalendarView` switches between day/week/month/year via `views.tsx`. `useCalendarItems.ts` merges tasks + events into `CalendarItem[]` for the active range (see `range.ts`). `MetricsSidebar` summarizes sessions. `EventEditorModal` is the CRUD modal.

### Utilities

- `src/lib/cn.ts` — `cn(...)` clsx wrapper for Tailwind class merging.
- `src/lib/time.ts` — shared date-fns helpers; keep all date arithmetic here.
- `src/lib/useMediaQuery.ts` — SSR-safe media query hook.

## Patterns to follow

- **Client-only data access**: anything that calls `getDB()` must be inside a `"use client"` component or a hook that guards `typeof window === "undefined"`. The `useClientDB` wrapper in `db/hooks.ts` is the template.
- **Reads through hooks, writes through repositories.** Don't open Dexie inside a component for writes.
- **Theme via CSS vars** (e.g. `bg-[var(--bg-0)]`). Don't introduce raw hex in components — extend `globals.css` instead.
- **React Compiler is on** — don't add `useMemo`/`useCallback` defensively; only when profiling shows a need or when stable identity is required for an external API.
