# Backend Rules

The backend is at an early stage: the full schema is applied to Neon and seeded, but the routers are
still stubs that don't touch the database.

## Stack constraints

- Node.js with **ES modules** (`"type": "module"`): always `import`/`export`, and always include
  the `.js` extension in relative imports (`./config/env.js`)
- Express 5
- PostgreSQL on **Neon**, accessed through **Drizzle ORM** (`drizzle-orm/neon-http` driver,
  `@neondatabase/serverless` client). No raw SQL strings in route code; query through `db`
- `dotenv` for config. No TypeScript, no validation library yet

## Layout

```text
backend/
├── src/
│   ├── server.js           app setup, router mounting, listen
│   ├── config/env.js       re-exports env vars (PORT, NODE_ENV, DB_URL)
│   ├── db/
│   │   ├── index.js        exports `db` (Drizzle client)
│   │   └── schema/
│   │       ├── index.js    barrel: re-exports every schema file
│   │       ├── app.js      app tables (users, enums...)
│   │       └── auth.js     auth tables (empty so far)
│   └── routes/<name>.routes.js
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
admin from `SEED_ADMIN_USERNAME`, `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`. Passwords
are hashed with `bcryptjs` (cost 12). It skips rows that already exist, so it's safe to re-run.

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

Run from `backend/`: `npm run dev` (nodemon), `npm start`, `npx eslint .`.
