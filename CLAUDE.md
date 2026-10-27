# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manchester Event Portal: users discover Greater Manchester events, organisers submit them, admins
approve them and manage users. It is a rewrite of an older PHP/MySQL university project, which lives
in a separate folder (`D:\MY PROJECTS\manchester-event-portal`). That code is the reference for
behaviour. Comments here that cite `*.php` files or PHP functions mark parity that is deliberate.

The migration is half done, and **the two halves are connected for auth and public events so far**:

- `frontend/` is a near-complete React port. Login, sign-up, logout, email verification and the
  signed-in account are real (Phase 1), and so are forgot and reset password and Settings' name,
  email switch, password and Delete account (Phase 2). Home, Explore Events, About's figure,
  Preferences and Event details for guests and users read real events (Phase 3); every other page
  still runs on in-memory mock data
- `backend/` is Express + Drizzle. Auth is real (sign-up, login, sessions, email verification;
  Phase 1, 2026-10-26; passwords and the account's own profile and deletion, Phase 2,
  2026-10-27), and so are the public event reads and categories (Phase 3, 2026-10-27); the rest of
  the users and events routers still return placeholder strings. The full schema in
  `src/db/schema/` is applied to Neon and seeded, demo events included

Calls go through `frontend/src/lib/api.js` and a Vite proxy for `/api`. Pages are wired phase by
phase, so don't assume an endpoint exists because a page shows the data.

## Tech Stack

| Package | Stack |
| --- | --- |
| `frontend/` | React 19, Vite 8, React Router 7, Tailwind CSS v4 (`@tailwindcss/vite`, no config file), lucide-react, Recharts |
| `backend/` | Node ESM, Express 5, Drizzle ORM + drizzle-kit, Neon serverless Postgres (`neon-http` driver), dotenv |

Plain JavaScript throughout; there's no TypeScript.

## Folder Structure

There are two independent npm packages and no root `package.json` or workspace. Run every command
from inside the package folder.

## Architecture

### Frontend state lives in `App.jsx`

`App.jsx` is effectively the app's data layer. It holds all cross-page state in `useState` (events,
users, favourites, contact messages), derives views from it, and passes data and handler functions
(`createOrganiserEvent`, `updateEventStatus`, `toggleFavourite` …) down as props. Those handlers
reproduce what the PHP backend did, and they are the clearest spec for what the real API endpoints
will need to do.

- **Single events list:** `initialEvents` (`src/data/eventsData.js`) feeds `publicEvents`
  (`isPublicEvent` = approved), `organiserEvents` (filtered by `currentOrganiser.id`) and
  `managedEvents`. Never add a parallel event array
- **`src/data/*Data.js`** files hold both mock records and page config (copy, form fields, nav)
- **Roles are real** (Phase 1, 2026-10-27). `App.jsx` asks `/auth/me` once at startup and keeps
  the answer as `account` (shows `PageLoading` until it arrives); `isUser` and `userType` are
  derived from it. Test each role's dashboard by logging in as it: the seed's admin and its Demo
  User and Demo Organiser. The role's sidebar links still come from `navigationData.js`, and pages
  other than auth still read mock records (the Demo Organiser sees the mock organiser's events
  until Phase 5)
- **Routing:** public routes (`/`, `/events`, `/events/:eventId`, `/about`, `/contact`,
  `/auth/:pathname`) and a nested `/dashboard/*` tree, guarded only by `isUser`. Which sidebar links
  appear depends on the role. The public navbar and footer hide based on the pathname
- Analytics pages are `lazy()` imports so Recharts loads only when they're opened

### Backend

`src/server.js` mounts one router per resource under `/api/v1` (`auth`, `users`, `events`). Drizzle
schema files sit in `src/db/schema/` behind a barrel `index.js`, which `drizzle.config.js` points at.
Migrations generate into `backend/drizzle/`.

### Database schema

The full Postgres schema (3 enums, 9 tables) was agreed on 2026-10-05 and is recorded in project
memory (`schema-decisions.md`). Build from that, not from the old MySQL `create tables.txt`. The
decisions that change how the code should behave:

- Login is by **email**; `username` is a non-unique display name. Admins come from a seed, never
  from sign-up
- **`past` is not a stored status.** An event is past when it's approved and
  `COALESCE(end_datetime, start_datetime)` has gone by, and a pending event in that state shows as
  Expired. (The frontend mock data still stores `status: "past"`)
- Editing an approved event keeps the last approved version public through `approved_snapshot`, and
  favourites survive the edit
- An event can be deleted only before it has ever been public; after that it can only be cancelled.
  Users with public events can be suspended but not deleted
- All date columns are `timestamp(..., { withTimezone: true })`

Migration `0000_flowery_rafael_vega.sql` predates this schema. Neon was confirmed empty on 2026-10-05,
so it was never applied. Show the generated SQL before applying anything to Neon.

## Active Feature

@docs/current-feature.md

## Build Commands

```bash
# frontend/
npm run dev        # Vite dev server
npm run build      # production build to dist/
npm run lint       # ESLint
npm run preview

# backend/
npm run dev                # nodemon src/server.js
npm start
npx eslint .               # no lint script defined
npx drizzle-kit generate   # schema -> SQL in drizzle/
npx drizzle-kit migrate    # apply to DB_URL
npm run db:seed            # 19 categories + demo admin, user and organiser (SEED_* in .env), demo events
npm run db:seed -- --reset-events   # replace the demo events with ones dated from today
npm test                   # Vitest, against the Neon test branch (TEST_DB_URL)
```

The frontend has no test runner yet.

## Environment Variables

| Package | Variable | Use |
| --- | --- | --- |
| `backend/.env` | `DB_URL` | Neon connection string. `db/index.js` and `drizzle.config.js` throw without it |
| `backend/.env` | `PORT`, `NODE_ENV` | Read through `src/config/env.js` |
| `backend/.env` | `ARCJET_KEY`, `ARCJET_ENV` | Arcjet; the server won't start without the key. `ARCJET_ENV=development` locally only |
| `backend/.env` | `TEST_DB_URL` | The Neon `test` branch. `npm test` refuses to run without it |
| `backend/.env` | `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Demo admin for `npm run db:seed` |
| `backend/.env` | `SEED_USER_EMAIL`, `SEED_ORGANISER_EMAIL`, `SEED_DEMO_PASSWORD` | Optional demo user and organiser for the seed |
| `backend/.env` | `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM_NAME` | Gmail sender (an app password). Unset locally = emails print to the terminal; required in production |
| `backend/.env` | `APP_URL` | The frontend's address for links in emails; defaults to `http://localhost:5173`, required in production |
| `frontend/.env` | `VITE_NEON_AUTH_URL`, `VITE_NEON_DATA_API_URL` | Defined but not yet read by any code |

All `.env*` files are gitignored.

## Rules

- [frontend.md](.claude/rules/frontend.md)
- [backend.md](.claude/rules/backend.md)
- [api.md](.claude/rules/api.md)
- [code-style.md](.claude/rules/code-style.md)
- [testing.md](.claude/rules/testing.md)
- [deployment.md](.claude/rules/deployment.md)

## Notes

- Icons: lucide-react only. Extend `EventCard` / `DashboardCard` / `Button` with optional props
  rather than wrapping or copying them
