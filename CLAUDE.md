# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manchester Event Portal: users discover Greater Manchester events, organisers submit them, admins
approve them and manage users. It is a rewrite of an older PHP/MySQL university project, which lives
in a separate folder (`D:\MY PROJECTS\manchester-event-portal`). That code is the reference for
behaviour. Comments here that cite `*.php` files or PHP functions mark parity that is deliberate.

The two halves are **connected for every page** since Phase 10 (2026-11-04): auth, public
events, the user's favourites and interests, organisers' own events, moderation,
notifications, managing users, contact messages, System Logs and the analytics pages.
Scheduled jobs (reminders, notification emails, clean-ups) run inside the API since Phase 11
(2026-11-05). Deployment (Phase 12) is still to come:

- `frontend/` is a near-complete React port. Login, sign-up, logout, email verification and the
  signed-in account are real (Phase 1), and so are forgot and reset password and Settings' name,
  email switch, password and Delete account (Phase 2). Home, Explore Events, About's figure,
  Preferences and Event details for guests and users read real events (Phase 3), and the hearts,
  My Favourites, Preferences' picks and the user dashboard's Home are real (Phase 4), and so are
  Create / Edit Event, My Events, My Drafts and Organiser Home (Phase 5), event photos and
  Settings' profile picture on Cloudinary (Phase 6), and Manage Events, Admin Home's event cards and every role's Notifications (Phase 7), and Manage Users
  and Admin Home's New users card (Phase 8), and the Contact form and Contact Messages
  (Phase 9), and System Logs, Admin Home's Recent Admin Actions, Site Analytics, Event
  Analytics and Organiser Home's "Saved by users" card (Phase 10). No page reads mock data
- `backend/` is Express + Drizzle. Auth is real (sign-up, login, sessions, email verification;
  Phase 1, 2026-10-26; passwords and the account's own profile and deletion, Phase 2,
  2026-10-27), and so are the public event reads and categories (Phase 3, 2026-10-27) and
  favourites and category follows (Phase 4, 2026-10-27) and organisers' event writes with
  OpenStreetMap venues (Phase 5, 2026-11-02) and photos on Cloudinary (Phase 6, 2026-11-03)
  and moderation and notifications (Phase 7, 2026-11-03) and managing users and contact
  messages (Phases 8 and 9, 2026-11-03) and System Logs and the analytics rows (Phase 10,
  2026-11-04); no placeholder routes are left. Scheduled jobs (Phase 11, 2026-11-05):
  event reminders, the notification email outbox and a nightly clean-up, on node-cron. The
  full schema in `src/db/schema/` is applied to Neon and seeded, demo events included

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

`App.jsx` is effectively the app's data layer. It calls one hook per kind of cross-page state
(`hooks/useAccount`, `useNotifications`, `useUserLists`, `useOrganiserEvents`, `useAdminLists`;
batch 3, 2026-11-08), derives views from them, and passes data and handler functions
(`createOrganiserEvent`, `decideEvent`, `toggleFavourite` …) down as props. Those handlers
reproduce what the PHP backend did, and they are the clearest spec for what the API endpoints do.

- **Events come from the API** wherever a page has been wired: `organiserEvents`
  (`/users/me/events`) and `managedEvents` (`/events/manage`, Phase 7) are loaded per account.
  The mock events and accounts were removed in Phase 10 (2026-11-04); never add a mock event
  array back
- **`src/data/*Data.js`** files hold page config (copy, form fields, nav) and helpers; the mock
  records went in Phase 10
- **Roles are real** (Phase 1, 2026-10-27). `useAccount` asks `/auth/me` once at startup and keeps
  the answer as `account` (shows `PageLoading` until it arrives); `isUser` and `userType` are
  derived from it. Test each role's dashboard by logging in as it: the seed's admin and its Demo
  User and Demo Organiser. The role's sidebar links still come from `navigationData.js`. The
  Demo Organiser's events come from the API (`organiserEvents`, loaded per account like the
  user's favourites), and so do the admin's (`managedEvents`, `managedUsers`,
  `contactMessages`) and every role's notifications (`notifications`). System Logs and the
  analytics pages ask for their own rows as they open (`useApi`, Phase 10)
- **Routing:** public routes (`/`, `/events`, `/events/:eventId`, `/about`, `/contact`,
  `/auth/:pathname`) and a nested `/dashboard/*` tree, guarded only by `isUser`. Which sidebar links
  appear depends on the role. The public navbar and footer hide based on the pathname
- Analytics pages are `lazy()` imports so Recharts loads only when they're opened

### Backend

`src/app.js` mounts one router per resource under `/api/v1` (`auth`, `users`, `events`,
`categories`, `locations`, `contact-messages`, `analytics`, `logs`; `server.js` only listens). Drizzle
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
npm run lint               # ESLint
npx drizzle-kit generate   # schema -> SQL in drizzle/
npx drizzle-kit migrate    # apply to DB_URL
npm run db:seed            # 19 categories + demo admin, user and organiser (SEED_* in .env), demo events
npm run db:seed -- --reset-events   # replace the demo events with ones dated from today
npm run jobs               # every scheduled job once, now (they also run on a timer in npm run dev)
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
| `backend/.env` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Photos (Phase 6); the server won't start without them, tests replace `lib/images.js`. `CLOUDINARY_URL` may also be there, unused |
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
