# CURRENT_STATE.md

Last reviewed: 2026-09-16

This document is an advisory snapshot and may become outdated. Repository
contents, installed dependencies, migrations and generated types remain
authoritative.

## Reviewed Revisions

Frontend baseline:

- Repository: this repository
- Branch: `main`
- Commit: `9c8b9c9`

Selected backend contract:

- Repository: `../backend`
- Branch: `dev`
- Commit: `367a8c9`, plus two uncommitted follow-up migrations at the time of
  this review: `grade_assessments_ects.sql` (`weight` → `ects_credits`),
  `calendar_events_end_after_start.sql` (`ends_at > starts_at` check), and
  `calendar_events_all_day.sql` (`all_day` flag)

The backend was inspected read-only. This task explicitly selected `dev`; that
does not permanently replace the default branch rule in `AGENTS.md`.

## Frontend Stack

- Next.js 16.3.4 with App Router and `proxy.ts`
- React 19.2.8
- TypeScript 5.9.3 with strict checking
- Supabase JS 2.116.0
- `@supabase/ssr` 0.12.7
- Tailwind CSS 4.3.3 and CSS Modules
- ESLint 9.39.5
- Node test runner for deterministic unit tests

The exact lockfile remains authoritative.

## Authentication

Implemented:

- email/password registration
- `display_name` Auth metadata for trigger-created profiles
- explicit email-link confirmation via `/auth/confirm`
- legacy PKCE code callback via `/auth/callback`
- login and persistent cookie-backed SSR sessions
- session refresh and route protection through the Proxy
- password-reset request and `/auth/reset-password`
- logout

Backend Auth currently requires email confirmation and at least eight password
characters. The frontend uses `getClaims()` for route/session protection and
`getUser()` when a fresh Auth user record is required.

Protected product areas:

- `/dashboard`
- `/assistant`
- `/courses` and nested course routes
- `/calendar`
- `/documents`
- `/flashcards`
- `/summaries`
- `/grades`
- `/profile`

## Database Contract

Frontend Supabase clients use the synchronized types in
`lib/supabase/database.types.ts`, copied from backend `dev` at `1bf6374`.

The current profile contract is:

- `id`
- `user_id`
- `name`
- `avatar_url`
- `created_at`
- `updated_at`

Registration metadata remains named `display_name`; the backend trigger stores
it in `profiles.name`. Clients may read only their own profile and update only
`name`.

Currently database-backed frontend features:

- owned courses
- file metadata belonging to owned courses
- materials used for summaries and flashcard decks
- summaries serialized by the frontend as `{ "text": string }`
- flashcard decks and flashcards
- calendar events (own events only; optional course link, optional end, all-day flag; click-to-view detail card before editing)
- grade assessments (own course's assessments only; ECTS credits, grade, status, points, notes; ECTS-weighted current standing and target-grade calculator use real stored data, no assumed 100% target)
- document processing status per uploaded course file (read-only view of
  `source_documents.processing_status` and `indexing_status`, polled while a
  document is still being extracted or indexed)

RLS remains the authorization boundary. Frontend filters and route parameters
are not treated as authorization.

## Storage Limitation

The backend defines the `files` metadata table but no application-specific
Supabase Storage bucket or Storage object policies. Actual file upload and
download are therefore disabled. The frontend does not use IndexedDB or
`localStorage` as a production persistence substitute.

Required backend dependency for real uploads:

- a private Storage bucket
- owner-scoped Storage policies
- a documented object-path and lifecycle contract

## Intentionally Static Areas

The following remain explicit UI previews or examples rather than persisted
user records:

- dashboard overview content
- global document-library preview
- AI-assistant conversation

`/calendar` no longer has a mock detected-date suggestion section; automatic
date detection has no backend contract yet and was removed entirely rather
than left as a disabled placeholder.

## Testing and CI

Available frontend checks:

- `npm test`
- `npm run lint`
- `npm run build`

Frontend CI runs installation, linting, unit tests and the production build.
There is currently no committed Playwright configuration in this repository.
Live email delivery, cross-browser confirmation and authenticated persistence
still require manual or future E2E verification against the selected Supabase
environment.
