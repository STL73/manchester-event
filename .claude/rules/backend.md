# Backend Rules

The backend is at an early stage: the server, routers and the Drizzle/Neon connection are wired,
and the `users` table is defined. Everything else is stubs.

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
- Every table spreads the shared `timestamps` object (`created_at`, `updated_at` with `$onUpdate`)
- New schema files must be added to `schema/index.js` or drizzle-kit won't see them
- The full schema was agreed on 2026-10-05; check the project's brain page before inventing tables

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
