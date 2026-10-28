# Backend Rules

The full schema is applied to Neon and seeded. Auth and the account's own `/users/me` are real
(Phases 1 and 2), and so are the public event reads and categories (Phase 3) and favourites and
category follows (Phase 4); the rest of the
users and events routers are still stubs that don't touch the database.

## Stack constraints

- Node.js with **ES modules** (`"type": "module"`): always `import`/`export`, and always include
  the `.js` extension in relative imports (`./config/env.js`)
- Express 5
- PostgreSQL on **Neon**, accessed through **Drizzle ORM** (`drizzle-orm/neon-http` driver,
  `@neondatabase/serverless` client). No raw SQL strings in route code; query through `db`
- `dotenv` for config, Zod for validation, Arcjet and `helmet` for security. No TypeScript

## Layout

```text
backend/
├── src/
│   ├── app.js              the Express app: middleware, routers, error handling
│   ├── server.js           imports app and calls listen
│   ├── config/
│   │   ├── env.js          re-exports env vars (PORT, NODE_ENV, DB_URL, ARCJET_KEY, EMAIL_*, APP_URL)
│   │   └── arcjet.js       the one Arcjet client
│   ├── constants/          fixed names (logActions.js: system_logs actions; areas.js: area ids)
│   ├── lib/                AppError, tokens, sessions, authTokens, email + authEmails,
│   │                       systemLogs (logAction), users (publicUser),
│   │                       publicEvents (every public read), londonTime (date windows)
│   ├── middleware/         errorHandler (+ notFound), validate, security, auth
│   ├── validation/         Zod schemas per resource (auth.js, users.js, events.js)
│   ├── db/
│   │   ├── index.js        exports `db` (Drizzle client)
│   │   ├── seed.js         npm run db:seed
│   │   ├── demoData.js     the seed's demo locations and events
│   │   └── schema/
│   │       ├── index.js    barrel: re-exports every schema file
│   │       ├── app.js      app tables (users, enums...)
│   │       └── auth.js     auth tables (sessions, auth_tokens)
│   └── routes/<name>.routes.js
├── tests/                  Vitest + Supertest; setup.js points DB_URL at TEST_DB_URL
├── drizzle/                generated migrations + meta (commit these)
└── drizzle.config.js       points drizzle-kit at src/db/schema/index.js
```

## Schema conventions (Drizzle)

- Tables: `pgTable('<snake_plural>', ...)`, exported as camelCase (`users`)
- Columns: camelCase JS key, snake_case DB name: `userId: integer('user_id')`
- Primary keys: `integer(...).primaryKey().generatedAlwaysAsIdentity()`
- Enums: `pgEnum('<snake_name>', [...])`, exported as `<name>Enum`
- Shared column helpers live in `schema/columns.js` (`timestamptz`, `createdAt`, `timestamps`) and
  are deliberately not exported from `schema/index.js`. Every date column is `timestamptz`
- `updated_at` is set by Drizzle's `$onUpdate` in JavaScript, not by a database trigger: raw SQL
  updates leave it unchanged
- New schema files must be added to `schema/index.js` or drizzle-kit won't see them
- The full schema (3 enums, 9 tables) was agreed on 2026-10-05; see `schema-decisions.md` in project
  memory before inventing tables

## Seed

`npm run db:seed` inserts the 19 categories (slugs = frontend `eventCategories` ids) and the demo
admin from `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`, plus a
verified Demo User and Demo Organiser when `SEED_USER_EMAIL`, `SEED_ORGANISER_EMAIL` and
`SEED_DEMO_PASSWORD` are set (skipped otherwise). Passwords
are hashed with `bcryptjs` (cost 12). It skips rows that already exist, so it's safe to re-run.

With the demo accounts it also adds (decided 2026-10-27) five more organisers (`mcrgigs`,
`northernfood`, `quaysevents`, `salfordarts`, `leoevents` at `@example.test`, a random password
nobody knows; `mcrgigs` suspended), 29 locations with made-up `seed-` place ids and approximate
coordinates, and the 52 mock events from `demoData.js`, the Demo Organiser owning the mock's
`organiserName` ones. Event dates are offsets from the day the seed runs, in Europe/London, so
they go stale: `npm run db:seed -- --reset-events` deletes the demo organisers' events (their
favourites cascade) and adds fresh ones. Events are added only when the demo organisers have
none. None of this may reach production (Phase 12).

## Migrations

There are no npm scripts for drizzle-kit, so run them with npx from `backend/`:

```bash
npx drizzle-kit generate   # schema -> SQL in drizzle/
npx drizzle-kit migrate    # apply to the DB in DB_URL
```

Never edit a generated migration that has already been applied. Generate a new one instead.

## Config

- Read env vars through `src/config/env.js`. (`db/index.js` and `drizzle.config.js` read
  `process.env.DB_URL` directly and throw if it's missing. That fail-fast check is intentional)
- `.env` files are gitignored. Never commit one

## Commands

Run from `backend/`: `npm run dev` (nodemon), `npm start`, `npm test`, `npx eslint .`.
