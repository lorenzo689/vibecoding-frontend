# CURRENT_STATE.md

Last reviewed: 2026-09-08

This document is an advisory snapshot and may become outdated.

Before implementation, verify relevant claims against the repositories. Source code,
`package.json`, `package-lock.json`, migrations, generated types, configuration, and
other repository artifacts remain authoritative.

The repository contents are the source of truth.

---

## Last Reviewed Against

Backend:

- Repository: `../backend`
- Branch: `main`
- Commit: `9296b19`

The frontend state was reviewed together with this document.

At the time of the initial repository review, the frontend `main` branch matched the
locally available `origin/main` tracking reference.

No network fetch is implied by this statement.

Do not silently use `origin/dev` as the frontend contract.

At the time of review, the locally available `origin/dev` tracking reference pointed
to newer backend work than `main`, but it is not the stable contract unless explicitly
selected by the user or team.

---

## Current Frontend State

The frontend is currently close to the default `create-next-app` scaffold.

Current state:

- Next.js App Router under `app/`
- default Next.js landing page still present
- default metadata still present
- document language still set to `en`
- Geist and Geist Mono configured
- basic Tailwind/global color setup only
- no product UI implemented
- no reusable product component library
- no frontend data-access layer
- no Supabase integration
- no authentication implementation
- no automated frontend tests
- no Playwright configuration

---

## Current Frontend Dependency Snapshot

At the time of review:

- Next.js 16.3.4
- React 19.2.8
- React DOM 19.2.8
- TypeScript 5.9.3
- Tailwind CSS 4.3.3
- ESLint 9.39.5

These values are informational only.

Before implementation, inspect:

- `package.json`
- `package-lock.json`

The lockfile and repository contents are authoritative.

---

## Current Frontend Quality State

Currently available:

- ESLint

Currently not configured:

- Playwright
- automated frontend tests

Do not claim Playwright coverage or automated frontend-test coverage currently exists.

When a task explicitly introduces frontend E2E testing, Playwright is the planned tool
unless the project changes.

Until then, run and report only validation commands that actually exist in the
repository.

---

## Current Frontend / Backend Integration State

No Supabase integration currently exists in the frontend.

Do not assume that:

- a Supabase client already exists
- Supabase packages are already installed
- public environment-variable names are already established
- browser/server auth helpers already exist
- session handling already exists
- generated database types are already wired into the frontend
- a frontend data-access layer already exists

When an integration task is requested, create only the minimum frontend integration
required by that task and use the real backend contract.

---

## Current Backend Architecture

The sibling backend is Supabase-based and currently has no custom standalone API
server.

It uses:

- PostgreSQL schema and RLS through migrations
- Supabase Auth
- Supabase Storage infrastructure
- Supabase Realtime infrastructure
- Supabase REST / GraphQL platform interfaces
- Supabase Edge Functions with Deno
- generated database types
- local Supabase development through Docker / Supabase CLI

The backend repository owns all Supabase-side schema, migrations, policies, functions,
and configuration.

---

## Current Backend Contract

At the reviewed backend `main` commit, only the authentication/profile foundation
exists.

### Supabase Auth

Current backend configuration includes:

- email registration enabled
- anonymous login disabled
- external OAuth providers disabled
- local email confirmation disabled
- minimum password length: 6 characters
- JWT lifetime: 3600 seconds
- MFA disabled

Do not present the backend password minimum as a different value.

A stricter frontend product rule may be used only when explicitly required by the
current feature prompt.

### `public.profiles`

Current fields:

- `id: uuid`
- `display_name: text`
- `created_at: timestamptz`
- `updated_at: timestamptz`

Current constraints:

- `display_name` must contain between 1 and 60 characters

Current behavior:

- profile is linked 1:1 to `auth.users`
- a profile is automatically created after registration
- `display_name` is populated from `raw_user_meta_data.display_name`
- if that metadata value is missing or null, the backend falls back to the local part
  of the email address
- the backend does not currently normalize, trim, or replace an empty metadata value
- `updated_at` is maintained automatically

### Registration / Profile Contract

The backend automatically creates `public.profiles` after Supabase Auth registration.

During registration:

- pass the supported display name through Supabase Auth user metadata
- do not manually insert a second profile
- do not assume `first_name` or `last_name` database columns exist
- ensure any frontend `display_name` validation respects the current 1–60 character
  backend constraint

The current backend profile contract exposes `display_name`.

If a feature explicitly asks the frontend to collect first name and last name
separately, combine them into the supported `display_name` metadata value unless the
backend contract changes.

### Current Profile RLS

At the database-policy level:

- authenticated users can currently read all profiles
- users can insert only their own profile
- users can update only their own profile
- users can delete only their own profile
- anonymous users cannot access profiles

Do not describe profiles as owner-private.

Do not rely on frontend filtering as an authorization mechanism.

Query or display other users' profiles only when required by the requested feature.

### Existing Edge Function: `me`

The backend currently provides a `me` Edge Function.

It:

- requires an `Authorization` header
- validates the Supabase Auth user
- forwards the caller's token into the Supabase client
- therefore operates under normal RLS
- returns HTTP 401 for missing or invalid authentication

On success, the function returns:

```json
{
  "profile": {
    "id": "...",
    "display_name": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

Profile lookup failures currently return HTTP 400 with an error object.

Do not assume additional product-specific Edge Functions exist.

---

## Supabase Platform Services

Supabase platform services currently enabled:

- Storage infrastructure
- Realtime infrastructure

This does **not** mean application-level Storage or Realtime behavior already exists.

No application-specific Storage buckets, upload policies, document model, or Realtime
behavior is currently implemented.

More specifically, there are currently no documented application-specific:

- Storage buckets for lecture documents
- upload contracts
- document Storage policies
- document persistence model
- Realtime subscriptions
- product-level Realtime behavior

Do not infer PDF-upload or Realtime product capabilities merely because these Supabase
services are enabled.

The configured maximum platform file size was 50 MiB at the time of review, but there
is currently no application-level lecture-document upload contract.

---

## Current Local Backend Development

At the time of review, the local Supabase configuration used:

- API: 54321
- PostgreSQL: 54322
- Studio: 54323
- Mailpit: 54324
- Shadow Database: 54320
- PostgreSQL major version: 17

These values are a local-development snapshot and may change.

Verify backend configuration before relying on them.

### Local Seed Users

The backend contains local-only seed users for development/testing:

- `anna@example.com`
- `ben@example.com`

These are development fixtures only.

Never hardcode seed credentials or test users into production frontend code.

Never assume these users exist outside the local development backend.

---

## Current Backend Tests and CI

The backend currently contains pgTAP coverage for the `profiles` schema, profile
trigger behavior, seed state, and profile RLS policies.

The current database tests cover:

- existence of the `profiles` table
- existence of expected columns
- primary key
- enabled RLS
- exact profile policies
- local seed profiles
- display-name propagation
- authenticated read behavior
- protection against modifying another user's profile
- updating the user's own profile
- anonymous-access denial

Backend CI currently checks:

- `npm ci`
- Prettier
- Deno linting
- Deno type-checking
- startup of a local Supabase stack
- SQL linting
- pgTAP database tests
- freshness of generated database types

This backend test infrastructure does not imply frontend tests exist.

Do not modify or invoke backend deployment behavior as part of a frontend task.

---

## Current Backend Deployment

The backend deployment workflow:

- starts only after successful CI on `main`
- checks out the exact tested commit
- connects to the configured remote Supabase project
- shows pending migrations
- runs `supabase db push`
- deploys existing Edge Functions
- prevents parallel production deployments

The frontend repository must not change or rely on this deployment process as a
substitute for its own implementation requirements.

---

## Generated Backend Types

The backend currently provides generated types at:

`../backend/types/database.types.ts`

At the reviewed backend state, these types represent `public.profiles` and the exposed
GraphQL schema.

Supabase Auth user and session types come from the Supabase client library rather than
this generated database type file.

Inspect the file read-only when exact public database types are needed.

Do not edit generated backend types from the frontend repository.

---

## Product Domains Not Yet Implemented in the Backend

At the reviewed backend state, there is **no** implemented product-domain schema or
backend contract for:

- courses
- lectures
- documents
- slides
- annotations
- calendar events
- grades
- summaries
- flashcards
- processing jobs
- subscriptions
- entitlements
- usage limits

Do not invent these contracts from the frontend.

A missing backend capability does not authorize fake persistence, undocumented APIs,
or production-looking mock behavior.

If a requested frontend task depends on one of these domains:

1. inspect the current backend `main` contract read-only
2. confirm the capability is still absent
3. implement only the frontend work explicitly permitted by the feature prompt
4. report the exact missing backend dependency

A missing backend capability does not automatically authorize a UI-only substitute.

Build a UI-only prototype only when the current feature prompt explicitly requests or
permits it.

Do not silently use `localStorage`, in-memory state, mock APIs, or other fake
persistence as a substitute for missing production persistence.
