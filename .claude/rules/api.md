# API Rules

## Current state

The shared middleware below is in place (Phase 0, 2026-10-26) and the auth routes are real
(Phase 1, passwords Phase 2), and so are the public event reads and categories (Phase 3),
favourites and category follows (Phase 4), organisers' own events with venue search
(Phase 5) and photos on Cloudinary (Phase 6). The
rest of the users and events routers are still stubs that return a placeholder string
(`res.send('Create event')`); database access comes with each feature.

## Routing

All routes are versioned under `/api/v1`, one router per resource, mounted in `src/app.js` (`server.js` only calls `listen`):

| Mount | File and endpoints |
| --- | --- |
| `/api/v1/auth` | `routes/auth.routes.js`: `POST /sign-up`, `/login`, `/logout`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`; `GET /me`; `PUT /password` |
| `/api/v1/users` | `routes/user.routes.js`: `PUT /me` (name, email switch), `DELETE /me` (password-confirmed), `GET /me/favourites`, `PUT` and `DELETE /me/favourites/:id`, `GET` and `PUT /me/follows`, `GET /me/events` (an organiser's own), `PUT` and `DELETE /me/avatar` (the profile picture); REST CRUD on `/` and `/:id`, `/me` registered first |
| `/api/v1/events` | `routes/event.routes.js`: `GET /` (public list), `GET /summary` (counts), `GET /:id` (public details), `/summary` before `/:id`; `POST /`, `PUT /:id`, `PUT /:id/submit`, `PUT /:id/cancel`, `DELETE /:id` (organisers) |
| `/api/v1/categories` | `routes/category.routes.js`: `GET /` (active categories A to Z, upcoming events each) |
| `/api/v1/locations` | `routes/location.routes.js`: `GET /search?q=` (OpenStreetMap places for the venue box) |

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

## Organiser events and venues (decided 2026-11-02)

- **Venues come from OpenStreetMap**, not Google Places: Google's terms let only the place ID be
  kept for good, and `locations` keeps the name, address and coordinates. OSM's licence allows
  that with "© OpenStreetMap contributors" shown beside the data. `lib/osm.js`: Photon
  (photon.komoot.io) for the search box, since the public Nominatim server forbids
  search-as-you-type; Nominatim `/lookup` for one place by id. Both are free servers that ask for
  fair use: a `User-Agent`, a 10-minute cache of searches, 30 searches a minute per organiser.
  A server that fails or times out (5 s) is 503
- `GET /locations/search?q=` (organisers, active, 3+ characters): up to 5 places in Greater
  Manchester, bus and tram stops and repeats left out, each `{ placeId, name, address, area }`.
  `placeId` is the OSM id (`W30343319`)
- The event's body sends **only `placeId`**. A venue not yet in `locations` is looked up on
  Nominatim, refused (400 on `body.placeId`) outside Greater Manchester, and added; later events
  reuse the row. Name, address and coordinates never come from the request
- **Area** is worked out from the coordinates (`areaFor()` in `constants/areas.js`: a box per area,
  the small ones first, NULL outside), never picked. Seeded venues keep their stored areas
- `POST /events`, `PUT /:id`, `PUT /:id/submit`, `PUT /:id/cancel`, `DELETE /:id`: organisers,
  `requireActive`; someone else's event is 404. No `status` in the body: `submit: true` sends it
  for approval. Times are `YYYY-MM-DDTHH:mm` as a Manchester clock shows them (the form's
  datetime-local), converted with `londonInstant()`; the end must be after the start
- Sending for approval needs `email_verified_at` (403) and a start still to come (400 on
  `body.startDatetime`), checked when the start is new to the admin: a draft being sent, or a
  changed time. A live event that has started keeps its time and can still be edited
- Edit: a draft stays a draft unless sent; anything else goes to pending. The first edit of a
  live event copies it into `approved_snapshot` (later edits leave that copy alone), so the
  public keeps the approved version and its favourites. Cancelled and ended events are 400
- Cancel: only an event that has been public (400 otherwise). A waiting edit is dropped and the
  snapshot's fields are restored, so the approved version is the one cancelled. Delete: only one
  never public; the condition is in the `DELETE` itself, so one approved meanwhile is 409
- `GET /users/me/events`: every status, as the organiser last saved it, with `hasBeenPublic` and
  `editPending` from the server so Delete / Cancel and the banners agree with it. Reading works
  while suspended
- Logs: Event Created (with `status`), Event Updated, Draft Submitted, Event Cancelled, Event
  Deleted, each `{ eventId, name }`

## Photos (decided 2026-11-02)

- **Cloudinary, through our server.** The browser sends the file to us; `middleware/upload.js`
  (multer, in memory, 5 MB, JPG / PNG / WebP / GIF) checks it and `lib/images.js`, the only file
  that knows Cloudinary, uploads it. Cloudinary's `allowed_formats` checks the content too: a
  file it can't read is 400 under the field, Cloudinary failing is 503. The browser never names
  a Cloudinary image, so there are no signed browser uploads to trust
- **A photo travels with its form.** `POST /events` and `PUT /events/:id` take multipart when a
  photo is attached: the usual body as JSON in a `data` field and the file as `image`, so
  `eventBodySchema` reads the same booleans and nulls. JSON without a photo works as before.
  `removeImage: true` goes back to the default photo; a file sent with it wins. Changing the
  photo of a live event is an edit like any other
- **Upload only once every check has passed**, then write; `withUpload()` (`lib/uploads.js`)
  deletes the upload if the write fails. Nothing is uploaded on pick, so an abandoned form
  leaves nothing behind
- **Old photos are deleted** once the write has gone through: replaced, removed, a waiting
  edit's on Cancel, a deleted event's, and an account's picture and events on Delete account.
  `droppedPhotos()` keeps any photo `approved_snapshot` still shows (`imagePublicId` is a
  snapshot key). Deleting is best effort and never fails a save. Seeded photos have no public id
  and are never deleted. **Phase 7:** approving an edit must delete the snapshot's photo if the
  row's differs
- Stored as both the delivery URL (`image_url`, `avatar`; `f_auto,q_auto`) and the public id
  (`image_public_id`, `avatar_public_id`). Events are kept at most 1600 px wide, pictures
  400 x 400 cropped round the subject. Folders `manchester-event/<NODE_ENV>/events` and
  `…/avatars`, so development's can be told apart and cleared
- `PUT /users/me/avatar` (multipart, `avatar`; none is 400) and `DELETE /users/me/avatar`:
  `requireActive`, logged as Profile Updated `{ fields: ['avatar'] }`, answer the account
- 20 uploads an hour per account (Arcjet, only when a file is sent)

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
