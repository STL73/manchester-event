# API Rules

## Current state

Every endpoint is a stub that returns a placeholder string (`res.send('Get all events')`). The
shared middleware below is in place (Phase 0, 2026-10-26); auth and database access come with each
feature.

## Routing

All routes are versioned under `/api/v1`, one router per resource, mounted in `src/app.js` (`server.js` only calls `listen`):

| Mount | File and endpoints |
| --- | --- |
| `/api/v1/auth` | `routes/auth.routes.js`: `POST /sign-up`, `/login`, `/logout` |
| `/api/v1/users` | `routes/user.routes.js`: REST CRUD on `/` and `/:id` |
| `/api/v1/events` | `routes/event.routes.js`: REST CRUD, plus `GET /user/:id`, `PUT /user/:id/cancel` |

- Router files: `const xRouter = Router();` then `export default xRouter;`
- REST verbs: `GET` list/detail, `POST` create, `PUT` update, `DELETE` remove. Actions that
  aren't CRUD are a sub-path verb (`/user/:id/cancel`)

## Middleware order

In `src/app.js`: `helmet()`, then `securityMiddleware` (Arcjet, before the body is parsed), then
`express.json()`, then the routers, then `notFound` and `errorHandler`, last. Middleware registered
after a router never runs for that router's routes, so `express.json()` must stay above them or
`req.body` is `undefined`.

## Responses and errors (decided 2026-10-26)

```js
{ data: {...} }                                                  // one item
{ data: [...], pagination: { page, limit, total, totalPages } }  // a list
{ error: { message: 'Email already in use', details: [...] } }   // an error
```

- **No try/catch in routes.** Express 5 passes errors from async routes to `errorHandler`
  (`middleware/errorHandler.js`). Throw `new AppError(status, message, details?)`
  (`lib/errors.js`) for anything the client should see; anything else becomes a 500 with a generic
  message, and the real error goes only to the server log
- **Validation:** Zod through `validate({ body, query, params })` (`middleware/validate.js`). It
  answers 400 `Invalid input` with one `{ path, message }` per problem, from every part at once.
  Routes read **`req.valid` only**, never `req.body`: fields a schema doesn't list (an organiser's
  `status`) never reach the database. (`req.valid` because Express 5 doesn't let `req.query` be
  replaced)
- **Security:** `config/arcjet.js` makes one Arcjet client (shield, bot detection allowing search
  engines and link previews). Stricter rules for a route use `aj.withRule()` at module level, never
  per request. Rate limit = 429, bot or shield = 403; if Arcjet can't be reached the request goes
  through. The server won't start without `ARCJET_KEY`; tests skip Arcjet

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

- Status codes per action
