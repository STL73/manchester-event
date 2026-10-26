# API Rules

## Current state

Every endpoint is a stub that returns a placeholder string (`res.send('Get all events')`). There
is no auth, validation or database access in the routes yet.

## Routing

All routes are versioned under `/api/v1`, one router per resource, mounted in `src/server.js`:

| Mount | File and endpoints |
| --- | --- |
| `/api/v1/auth` | `routes/auth.routes.js`: `POST /sign-up`, `/login`, `/logout` |
| `/api/v1/users` | `routes/user.routes.js`: REST CRUD on `/` and `/:id` |
| `/api/v1/events` | `routes/event.routes.js`: REST CRUD, plus `GET /user/:id`, `PUT /user/:id/cancel` |

- Router files: `const xRouter = Router();` then `export default xRouter;`
- REST verbs: `GET` list/detail, `POST` create, `PUT` update, `DELETE` remove. Actions that
  aren't CRUD are a sub-path verb (`/user/:id/cancel`)

## Middleware order

`app.use(express.json())` must stay **above** the `app.use('/api/v1/...')` lines in `server.js`.
Middleware registered after a router never runs for that router's routes, so `req.body` would be
`undefined`.

## Auth (decided 2026-10-26)

Our own auth with **database sessions**: no auth library, no Neon Auth, no JWT. Chosen over Better
Auth so the agreed `users` table stays as it is (integer IDs, `email_verified_at`, bcryptjs) and
every part can be explained. Sessions rather than JWT because logout and suspension must take
effect on the next request, and a JWT can't be cancelled before it expires.

- Login checks the bcryptjs hash, creates a `sessions` row and sets an `httpOnly`, `sameSite: 'lax'`
  cookie (`secure` in production) holding a random ID from `crypto.randomBytes`
- The database stores only a SHA-256 hash of each session ID and token, never the value itself
- `requireAuth` middleware loads the user from the cookie on every request and refuses a suspended
  account; `requireRole(...)` checks the role on the server, never only in the frontend
- Same error for an unknown email and a wrong password; login is rate-limited
- New session ID at every login; a password change deletes all of that user's sessions
- Sign-up rejects the `admin` role. Unverified users can log in; the event-submit route checks
  `email_verified_at`

The frontend `.env`'s `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` are unused leftovers.

## To decide when handlers are written

Record each decision here once it's made:

- Response shape (success and error envelope)
- Status codes per action
- Input validation approach
- Central error-handling middleware
