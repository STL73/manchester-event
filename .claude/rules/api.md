# API Rules

## Current state

The shared middleware below is in place (Phase 0, 2026-10-26) and the auth routes are real
(Phase 1, passwords Phase 2), and so are the public event reads and categories (Phase 3) and
favourites and category follows (Phase 4). The
rest of the users and events routers are still stubs that return a placeholder string
(`res.send('Create event')`); database access comes with each feature.

## Routing

All routes are versioned under `/api/v1`, one router per resource, mounted in `src/app.js` (`server.js` only calls `listen`):

| Mount | File and endpoints |
| --- | --- |
| `/api/v1/auth` | `routes/auth.routes.js`: `POST /sign-up`, `/login`, `/logout`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`; `GET /me`; `PUT /password` |
| `/api/v1/users` | `routes/user.routes.js`: `PUT /me` (name, email switch), `DELETE /me` (password-confirmed), `GET /me/favourites`, `PUT` and `DELETE /me/favourites/:id`, `GET` and `PUT /me/follows`; REST CRUD on `/` and `/:id`, `/me` registered first |
| `/api/v1/events` | `routes/event.routes.js`: `GET /` (public list), `GET /summary` (counts), `GET /:id` (public details), `/summary` before `/:id`; the rest of REST CRUD, `GET /user/:id`, `PUT /user/:id/cancel` still stubs |
| `/api/v1/categories` | `routes/category.routes.js`: `GET /` (active categories A to Z, upcoming events each) |

- Router files: `const xRouter = Router();` then `export default xRouter;`
- REST verbs: `GET` list/detail, `POST` create, `PUT` update, `DELETE` remove. Actions that
  aren't CRUD are a sub-path verb (`/user/:id/cancel`)

## Middleware order

In `src/app.js`: `helmet()`, then `securityMiddleware` (Arcjet, before the body is parsed), then
`express.json()`, then `cookieParser()`, then the routers, then `notFound` and `errorHandler`, last. Middleware registered
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
  per request, run by `arcjetProtect(client, props)` from `middleware/security.js`. Rate limit =
  429, bot or shield = 403, a refused email = 400 on `body.email`; if Arcjet can't be reached the
  request goes through. The server won't start without `ARCJET_KEY`; tests skip Arcjet
- **Local testing gotcha:** Arcjet caches a denial for the client for about a minute, and locally
  every request comes from 127.0.0.1. One request it calls a bot (plain `curl`) makes every
  request 403 for that minute, browser included. Send a browser user agent with `curl -A`

## Auth (decided 2026-10-26)

Our own auth with **database sessions**: no auth library, no Neon Auth, no JWT. Chosen over Better
Auth so the agreed `users` table stays as it is (integer IDs, `email_verified_at`, bcryptjs) and
every part can be explained. Sessions rather than JWT because logout and suspension must take
effect on the next request, and a JWT can't be cancelled before it expires.

- Login checks the bcryptjs hash, creates a `sessions` row and sets an `httpOnly`, `sameSite: 'lax'`
  cookie (`secure` in production) holding a random ID from `crypto.randomBytes`
- The database stores only a SHA-256 hash of each session ID and token, never the value itself
- `requireAuth` (`middleware/auth.js`) loads the user from the `sid` cookie onto `req.user` and
  renews a 30-day session that has fewer than 15 days left. **A suspended account gets through**
  (it can still log in and read, with a banner); routes that change something add
  `requireActive`, which answers 403. A suspension whose `suspended_until` has passed is lifted
  the next time the account is seen. `requireRole(...)` checks the role on the server, never only
  in the frontend
- Same error for an unknown email and a wrong password ("Email or password is incorrect"), and
  an unknown email is still compared against a dummy hash so the timing matches. Failed logins go
  to `system_logs` (`User Login Failed`): linked to the account when the email has one, otherwise
  only the IP; the typed email is never stored
- Limits (decided 2026-10-26): login 10 per 15 minutes per IP; sign-up 5 per hour per IP with
  Arcjet `protectSignup` (also refuses disposable, invalid and no-MX emails); resend verification
  3 per hour per user
- Sign-up logs the person in straight away and emails a verification link; an email already in
  use is said plainly (409 on `body.email`). The link opens the frontend's `/auth/verify-email`,
  which POSTs the token: email scanners open GET links and would use it up. Tokens are 24 hours,
  one per user and purpose, deleted when used
- All email goes through `sendEmail()` in `lib/email.js` (Nodemailer with Gmail). Without
  `EMAIL_USER` locally it prints the email to the server terminal instead. It uses port 587 with
  `requireTLS`, not the `service: 'gmail'` shortcut: on Slav's machine port 465 is cut off
  ("Connection closed unexpectedly", likely Norton's mail scanning) while 587 works (2026-10-27)
- New session ID at every login; a password change deletes all of that user's sessions
- **Passwords and account (decided 2026-10-27):** forgot-password answers 204 whether or not the
  email has an account, and sends the email without waiting so the timing matches too (3 an hour
  per address, 10 per IP). Reset links are one hour; using one sets the new password, marks the
  email verified (the link reached the inbox), ends every session and sends the person to Log in.
  Changing the password in Settings needs the current one (400 under `body.currentPassword`,
  never 401, which would read as logged out), ends every session and starts a fresh one for this
  device (10 tries per 15 minutes per user). Both send a "password changed" email, which ignores
  the email switch. A suspended account may change or reset its password; `PUT /users/me` and
  `DELETE /users/me` are `requireActive`. Delete account: password-checked (400), admins 403, an
  organiser with an event that has been public (approved, cancelled, or with an
  `approved_snapshot`) 409; otherwise their other events and the account go in one `db.batch()`,
  which `events.organiser_id`'s RESTRICT undoes whole if an event went public meanwhile
  (checked on the test branch)
- Sign-up rejects the `admin` role. Unverified users can log in; the event-submit route checks
  `email_verified_at`

The frontend `.env`'s `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` are unused leftovers.

## Public events (decided 2026-10-27)

- Every public read goes through `lib/publicEvents.js`: an event is public when it is approved or
  cancelled, or pending or rejected with an `approved_snapshot`, which is what guests and users
  see (and what the filters search) until an admin approves the edit. `approved_snapshot` keys are
  the Drizzle names (`eventName`, `startDatetime`…), dates as ISO strings
- Lists (`GET /events`, `/summary`, `/categories`) show upcoming live events only:
  `COALESCE(end, start) >= now`, organiser active or suspension ended. `GET /:id` also opens
  past, cancelled and suspended organisers' events; anything never public is 404
- `GET /events` filters: `q` (name, category, venue, address; `%` and `_` taken literally),
  `category` (one slug or several, comma-separated), `location` (an area id from
  `constants/areas.js`, `locations.area`), `when` (`tonight`, `weekend`, `week`) or `date`,
  `page`, `limit` (12 at most). Soonest first, then by id
- Date windows are Europe/London, worked out in JavaScript (`lib/londonTime.js`) and passed to
  the query rather than SQL `now()`, so tests fix "now" with Vitest's fake `Date`. The rules match
  the frontend's `lib/eventDates.js`: tonight = starts before midnight, weekend = Friday 17:00 to
  the end of Sunday (the one in progress at a weekend), week = before midnight 7 days on
- `isListed(now)` is the lists' rule (live, not over, organiser visible) and also decides what can
  be saved. `GET /:id` and the favourites list send it as `listed`, so Event details can leave
  out Save without saying why (a suspension isn't the public's business)

## Favourites and follows (decided 2026-10-27)

- Under `/users/me`, for the `user` role only (organisers and admins 403); reads work while
  suspended, writes are `requireActive`. Unverified accounts may save and follow
- `PUT /me/favourites/:id` saves (204, saving twice leaves one row); an event never public is
  404, one the lists don't show (ended, cancelled, organiser suspended) is 400. Saves made
  before stay, and `DELETE` always works, so they can be cleared. `GET /me/favourites` lists
  them as the public sees them, past and cancelled too, with `listed` and `savedAt`, soonest
  first
- `PUT /me/follows` takes `{ categories: [slug…] }` and replaces the active categories followed
  in one `db.batch()`; an unknown or archived slug is 400 on `body.categories`. Follows of an
  archived category are kept, since Preferences doesn't show it to untick. Answers the sorted
  slugs, as `GET` does

## Status codes (decided 2026-10-26)

| Code | When |
| --- | --- |
| 200 | Read or action with a body (`login`, `me`, `verify-email`) |
| 201 | Something created (`sign-up`) |
| 204 | Done, nothing to send (`logout`, `resend-verification`) |
| 400 | Invalid input, or a request that can't apply (expired link, already verified) |
| 401 | Not logged in, or wrong email or password |
| 403 | Logged in but not allowed (role, suspended), or blocked by Arcjet |
| 404 | Not found |
| 409 | Clashes with what exists (email already in use) |
| 429 | Rate limited |
| 503 | A service we depend on failed (an email that was asked for couldn't be sent) |
