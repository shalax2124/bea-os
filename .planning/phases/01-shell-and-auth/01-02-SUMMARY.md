---
phase: 01-shell-and-auth
plan: 02
subsystem: ui
tags: [nextjs, clerk, react, tailwind, route-groups, tab-navigation]

# Dependency graph
requires:
  - phase: 01-shell-and-auth-01
    provides: ClerkProvider in root layout, Clerk middleware, Next.js 16 scaffold
provides:
  - Nav component with Bea's OS branding, current week label, and Clerk UserButton
  - TabBar client component with 4-tab navigation and active state detection
  - StatCard reusable presentational component
  - Dashboard shell at / via (dashboard) route group
  - Placeholder pages at /log-task, /jeff-tracker, /archive
affects: [01-03, 02-smart-paste, 03-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [Route group (dashboard) for shared nav layout, client component for usePathname-based active tab, server component for nav with UserButton]

key-files:
  created:
    - src/components/nav.tsx
    - src/components/tab-bar.tsx
    - src/components/stat-card.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/page.tsx
    - src/app/(dashboard)/log-task/page.tsx
    - src/app/(dashboard)/jeff-tracker/page.tsx
    - src/app/(dashboard)/archive/page.tsx
  modified:
    - src/app/page.tsx (deleted — route group takes over /)

key-decisions:
  - "Used (dashboard) route group so sign-in page sits outside nav/tab layout without extra wrapper"
  - "TabBar is 'use client' for usePathname active state; Nav stays server component"
  - "Deleted root src/app/page.tsx — route group (dashboard)/page.tsx handles / cleanly"

patterns-established:
  - "Route group pattern: (dashboard)/layout.tsx wraps all authenticated pages with Nav+TabBar"
  - "Active tab detection: tab.href === '/' exact match, all others use pathname.startsWith()"
  - "StatCard component: title + value + optional subtitle — reused for all dashboard metrics"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-04-08
---

# Phase 01 Plan 02: Dashboard Shell UI Summary

**Nav with Clerk UserButton + 4-tab bar + responsive stat cards wired into a (dashboard) route group — authenticated users see the full app shell**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-08T09:45:34Z
- **Completed:** 2026-04-08T09:47:18Z
- **Tasks:** 2
- **Files modified:** 8 (7 created, 1 deleted)

## Accomplishments
- Three reusable components created: Nav (server), TabBar (client with active state), StatCard (presentational)
- Dashboard route group `(dashboard)` established — layout wraps all authenticated pages with Nav + TabBar
- Dashboard page renders 4 placeholder stat cards in responsive 2-col/4-col grid
- Placeholder pages at /log-task, /jeff-tracker, /archive — all tab routes functional
- Temporary root page.tsx deleted — route group handles / cleanly
- `npm run build` passes with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create nav, tab bar, and stat card components** - `60a7ad4` (feat)
2. **Task 2: Create dashboard layout and page routes** - `4934f13` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/components/nav.tsx` - Server component: "Bea's OS" heading, current week label, Clerk UserButton
- `src/components/tab-bar.tsx` - Client component: 4 tabs with usePathname active state highlighting
- `src/components/stat-card.tsx` - Presentational: title, value, optional subtitle
- `src/app/(dashboard)/layout.tsx` - Route group layout: Nav + TabBar + max-w-5xl main container
- `src/app/(dashboard)/page.tsx` - Dashboard: 4 StatCards (Total Tasks, Overdue, Blocked on Jeff, Done This Week)
- `src/app/(dashboard)/log-task/page.tsx` - Placeholder: "Smart Paste — coming in Phase 2"
- `src/app/(dashboard)/jeff-tracker/page.tsx` - Placeholder: "Jeff Tracker — coming in Phase 3"
- `src/app/(dashboard)/archive/page.tsx` - Placeholder: "Archive — coming soon"
- `src/app/page.tsx` - DELETED (route group handles /)

## Decisions Made
- Route group `(dashboard)` keeps the sign-in page cleanly outside the nav layout without any extra conditionals.
- `TabBar` needs `'use client'` for `usePathname` — Nav stays server component since UserButton works server-side in @clerk/nextjs.
- Deleted the temporary root `page.tsx` from Plan 01 — the route group's page.tsx handles `/` directly.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

The following stat cards render placeholder `0` values intentionally — real data wiring is Phase 3 scope:
- `src/app/(dashboard)/page.tsx` lines 8-11: StatCards with `value={0}` (Total Tasks, Overdue, Blocked on Jeff, Done This Week)

These stubs are tracked. The dashboard goal (Phase 3) will replace these with live data from Neon.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required for this plan. Clerk credentials from Plan 01 remain required to run the dev server.

## Next Phase Readiness
- Dashboard shell complete — authenticated users will see Nav + TabBar + stat cards
- Plan 03 (Deploy to Vercel) can proceed immediately
- Phase 2 (Smart Paste) will wire up /log-task
- Phase 3 (Dashboard) will wire up real data for stat cards

---
*Phase: 01-shell-and-auth*
*Completed: 2026-04-08*

## Self-Check: PASSED

- FOUND: src/components/nav.tsx
- FOUND: src/components/tab-bar.tsx
- FOUND: src/components/stat-card.tsx
- FOUND: src/app/(dashboard)/layout.tsx
- FOUND: src/app/(dashboard)/page.tsx
- FOUND: src/app/(dashboard)/log-task/page.tsx
- FOUND: src/app/(dashboard)/jeff-tracker/page.tsx
- FOUND: src/app/(dashboard)/archive/page.tsx
- DELETED: src/app/page.tsx (correct)
- FOUND commit: 60a7ad4 (Task 1)
- FOUND commit: 4934f13 (Task 2)
