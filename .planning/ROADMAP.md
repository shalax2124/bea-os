# Bea's OS — Roadmap

## Project Goal
An AI-powered task management tool for Bea Fenol (EP at Ally) to manage tasks from Fathom, Slack, WhatsApp, and email — with intelligent prioritization, Jeff pattern tracking, and a Monday Slack briefing.

## Stack
- Next.js + TypeScript + Tailwind CSS
- Clerk (auth)
- Neon (PostgreSQL database)
- Claude API (task parsing + analysis)
- Vercel (deployment)

---

## Phase 1: Shell + Auth
**Goal:** Live Next.js app on Vercel with Clerk auth. Bea and Sharie can both log in and see the empty dashboard shell.

**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Initialize Next.js project with Clerk auth + Neon connection + middleware
- [x] 01-02-PLAN.md — Dashboard shell UI (nav with UserButton, tabs, stat cards)
- [ ] 01-03-PLAN.md — Deploy to Vercel + end-to-end verification

**Delivers:**
- Next.js app initialized with TypeScript + Tailwind
- Clerk auth (sign-in via Clerk components)
- Neon PostgreSQL connection string configured (tables in Phase 2)
- Nav with "Bea's OS" branding + current week label + Clerk UserButton
- Tab bar: Dashboard / Log Task / Jeff Tracker / Archive
- Empty dashboard with placeholder stat cards
- Environment variables configured
- Deployed to bea-os.vercel.app

**Out of scope:** Task logic, Claude API, real dashboard data, database tables

---

## Phase 2: Smart Paste + Task Logging
**Goal:** Bea can paste raw text from any source, Claude extracts the task, she reviews and submits. Tasks save to Neon via Drizzle ORM.

---

## Phase 3: Dashboard
**Goal:** Live dashboard with stats bar, daily capacity view (impact + time estimates), Requires Jeff list — all from real logged data.

---

## Phase 4: Intelligence Layer
**Goal:** Priority change detection, triage alerts, impact scoring, scope creep log — system coaches Bea automatically.

---

## Phase 5: Monday Slack DM
**Goal:** Automated Monday 9am Slack DM with weekly brief. No app required.
