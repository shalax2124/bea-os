---
phase: 01-shell-and-auth
plan: 01
subsystem: auth
tags: [nextjs, clerk, neon, typescript, tailwind, middleware]

# Dependency graph
requires: []
provides:
  - Next.js 16 app scaffold with TypeScript, Tailwind CSS, ESLint, App Router
  - Clerk auth provider wrapping entire app via ClerkProvider in root layout
  - Clerk middleware protecting all routes except /sign-in and /sign-up
  - Sign-in page using Clerk's hosted SignIn component
  - Neon PostgreSQL dependency installed (connection string in .env.local placeholder)
  - .env.example committed to git with required env var keys
affects: [01-02, 01-03, all-phases]

# Tech tracking
tech-stack:
  added: [next@16.2.2, @clerk/nextjs@7.0.11, @neondatabase/serverless, typescript, tailwindcss, @tailwindcss/postcss]
  patterns: [ClerkProvider wraps html/body in root layout, clerkMiddleware with createRouteMatcher for public routes, catch-all route [[...sign-in]] for Clerk auth flows]

key-files:
  created:
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css
    - src/middleware.ts
    - src/app/sign-in/[[...sign-in]]/page.tsx
    - .env.local
    - .env.example
    - package.json
    - tsconfig.json
    - next.config.ts
    - tailwind.config.ts
    - postcss.config.mjs
    - .gitignore
  modified: []

key-decisions:
  - "Scaffolded in /tmp then copied to project root (create-next-app blocks if directory has existing files)"
  - "Used Inter font instead of Geist as specified in plan — both supported in Next.js 16"
  - "Updated .gitignore to exclude .env* but whitelist .env.example so it gets committed"
  - "ClerkProvider wraps <html> and <body> — required for Clerk to work with RSC/SSR in Next.js App Router"

patterns-established:
  - "ClerkProvider at root layout level: wraps html+body to enable auth across all server and client components"
  - "Middleware pattern: createRouteMatcher defines public routes, auth.protect() called for all protected routes"
  - "Catch-all sign-in route: [[...sign-in]] required for Clerk's multi-step auth flows"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-04-08
---

# Phase 01 Plan 01: Initialize Next.js + Clerk Auth + Neon Connection

**Next.js 16 app scaffolded with TypeScript + Tailwind, Clerk auth provider and route-protection middleware, sign-in page, and Neon dependency — builds cleanly, ready for dashboard shell**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-08T09:37:25Z
- **Completed:** 2026-04-08T09:42:17Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Next.js 16 project initialized with TypeScript, Tailwind CSS, ESLint, App Router, src/ directory
- @clerk/nextjs and @neondatabase/serverless installed; ClerkProvider wraps root layout
- Clerk middleware (clerkMiddleware + createRouteMatcher) protects all routes except /sign-in and /sign-up
- Sign-in page renders Clerk's hosted SignIn component centered on screen
- .env.local created with placeholder values; .env.example committed to git as documentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js project with Clerk and Neon dependencies** - `7468074` (feat)
2. **Task 2: Create Clerk middleware and sign-in page** - `fca0c42` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/app/layout.tsx` - Root layout with ClerkProvider, Inter font, Bea's OS metadata
- `src/app/page.tsx` - Temporary placeholder page (replaced in Plan 03)
- `src/app/globals.css` - Global Tailwind CSS styles
- `src/middleware.ts` - Clerk auth middleware protecting all non-public routes
- `src/app/sign-in/[[...sign-in]]/page.tsx` - Clerk SignIn component page
- `package.json` - Project deps including @clerk/nextjs, @neondatabase/serverless
- `.env.local` - Placeholder env vars (gitignored — user must fill in)
- `.env.example` - Committed env template with key names and example values
- `.gitignore` - Excludes .env* but whitelists .env.example
- `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` - Project config files

## Decisions Made
- Scaffolded Next.js in /tmp first to work around create-next-app's restriction on directories with existing files. Copied files over, cleaned node_modules after copy to restore symlinks.
- Kept Inter font (as specified in plan) even though Next.js 16 scaffold defaults to Geist — both work fine.
- Updated .gitignore to use `!.env.example` exception so .env.example gets committed despite `.env*` catch-all pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded in temp dir to bypass create-next-app directory conflict**
- **Found during:** Task 1 (Initialize Next.js project)
- **Issue:** create-next-app refuses to scaffold in a directory that already contains files (.planning/ directory existed)
- **Fix:** Ran create-next-app in /tmp/bea-os-temp, then copied all files to project root. Ran `rm -rf node_modules && npm install` to restore symlinks that were broken by flat-file copy.
- **Files modified:** All scaffolded files
- **Verification:** npm run build succeeded cleanly
- **Committed in:** 7468074 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** Necessary workaround — no scope creep, same end result as direct scaffolding.

## Issues Encountered
- node_modules/.bin/next was a regular file after copy (symlinks broken by cp), causing MODULE_NOT_FOUND. Fixed by deleting node_modules and running npm install to restore proper symlinks.

## User Setup Required

Before running the dev server, you must:

1. **Create a Clerk application:**
   - Go to https://dashboard.clerk.com -> Create application (name: bea-os)
   - Copy the Publishable Key and Secret Key

2. **Create Neon database:**
   - Go to https://console.neon.tech -> New Project (name: bea-os)
   - Copy the connection string from Connection Details

3. **Fill in .env.local** at `/Users/shariebeldizon/bea-os/.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
   DATABASE_URL=postgresql://YOUR_NEON_CONNECTION_STRING
   ```

4. **Create users in Clerk Dashboard:**
   - Users -> Create user: Bea (bea@ally.com)
   - Users -> Create user: Sharie

5. **Verify:** Run `npm run dev` — should start on localhost:3000 and redirect unauthenticated users to /sign-in

## Next Phase Readiness
- Project scaffold complete, builds cleanly — ready for Plan 02 (dashboard shell UI)
- Credentials must be filled in .env.local before dev server will authenticate users
- Plan 02 can scaffold nav, tabs, and stat cards on top of this foundation without credentials

---
*Phase: 01-shell-and-auth*
*Completed: 2026-04-08*

## Self-Check: PASSED

- FOUND: src/app/layout.tsx
- FOUND: src/middleware.ts
- FOUND: src/app/sign-in/[[...sign-in]]/page.tsx
- FOUND: .env.local
- FOUND: .env.example
- FOUND: package.json
- FOUND commit: 7468074 (Task 1)
- FOUND commit: fca0c42 (Task 2)
