# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Manchester Event Portal: users discover Greater Manchester events, organisers submit them, admins
approve them and manage users. It is a rewrite of an older PHP/MySQL university project, which lives
in a separate folder (`D:\MY PROJECTS\manchester-event-portal`). That code is the reference for
behaviour. Comments here that cite `*.php` files or PHP functions mark parity that is deliberate.

The migration is half done, and **the two halves are not connected yet**:

- `frontend/` is a near-complete React port that runs entirely on in-memory mock data
- `backend/` is an Express + Drizzle skeleton: routers return placeholder strings, and only the
  `users` table is defined

There are no `fetch` calls, no API client and no Vite proxy. Wiring the frontend to the API is
future work, so don't assume an endpoint exists because a page shows the data.

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
- **Roles are simulated.** `TEST_USER_TYPE` in `src/data/navigationData.js` sets the starting role
  (`user` / `organiser` / `admin`). `App.jsx` keeps `userType` and `isUser` state, and the
  `Navbar`/`Sidebar` let you cycle roles and toggle signed-in, which is how you test each role's
  dashboard. There's no real auth
- **Routing:** public routes (`/`, `/events`, `/events/:eventId`, `/about`, `/contact`,
  `/auth/:pathname`) and a nested `/dashboard/*` tree, guarded only by `isUser`. Which sidebar links
  appear depends on the role. The public navbar and footer hide based on the pathname
- Analytics pages are `lazy()` imports so Recharts loads only when they're opened

### Backend

`src/server.js` mounts one router per resource under `/api/v1` (`auth`, `users`, `events`). Drizzle
schema files sit in `src/db/schema/` behind a barrel `index.js`, which `drizzle.config.js` points at.
Migrations generate into `backend/drizzle/`.

### Database schema: approved but not yet written

The full Postgres schema (3 enums, 10 tables) was agreed on 2026-10-05 and is recorded in project
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

Migration `0000_flowery_rafael_vega.sql` predates this schema and has probably not been applied. Check
Neon read-only, and get Slav's OK, before deleting or replacing it. Show the generated SQL before
applying anything to Neon.

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
```

There is no test runner in either package yet.

## Environment Variables

| Package | Variable | Use |
| --- | --- | --- |
| `backend/.env` | `DB_URL` | Neon connection string. `db/index.js` and `drizzle.config.js` throw without it |
| `backend/.env` | `PORT`, `NODE_ENV` | Read through `src/config/env.js` |
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

- Known bug: in `backend/src/server.js`, `app.use(express.json())` comes after the routers, so
  `req.body` is undefined in routes. Fix it before writing the first handler that reads a body
- Icons: lucide-react only. Extend `EventCard` / `DashboardCard` / `Button` with optional props
  rather than wrapping or copying them
