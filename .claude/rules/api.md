# API Rules

## Current state

The shared middleware below is in place (Phase 0, 2026-10-26) and the auth routes are real
(Phase 1, passwords Phase 2), and so are the public event reads and categories (Phase 3),
favourites and category follows (Phase 4), organisers' own events with venue search
(Phase 5), photos on Cloudinary (Phase 6), moderation and notifications (Phase 7) and
managing users (Phase 8) and contact messages (Phase 9). The users and events routers have
no placeholder stubs left. System Logs and the analytics rows (Phase 10) came last of the
routes; Phase 11 added the scheduled jobs, which have no routes of their own.

## Routing

All routes are versioned under `/api/v1`, one router per resource, mounted in `src/app.js` (`server.js` only calls `listen` and starts the scheduled jobs):

| Mount | File and endpoints |
| --- | --- |
| `/api/v1/auth` | `routes/auth.routes.js`: `POST /sign-up`, `/login`, `/logout`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`; `GET /me`; `PUT /password` |
| `/api/v1/users` | `routes/user.routes.js`: `PUT /me` (name, email switch), `DELETE /me` (password-confirmed), `GET /me/favourites`, `PUT` and `DELETE /me/favourites/:id`, `GET` and `PUT /me/follows`, `GET /me/events` (an organiser's own), `PUT` and `DELETE /me/avatar` (the profile picture), `GET /me/notifications`, `PUT /me/notifications/read`; `/me` registered first; admins: `GET /` (every account), `PUT /:id/status`, `DELETE /:id` |
| `/api/v1/events` | `routes/event.routes.js`: `GET /` (public list), `GET /summary` (counts), `GET /:id` (public details), `/summary` and `/manage` before `/:id`; `POST /`, `PUT /:id`, `PUT /:id/submit`, `PUT /:id/cancel`, `DELETE /:id` (organisers); `GET /manage`, `PUT /:id/approve`, `/:id/reject`, `/:id/take-down` (admins) |
| `/api/v1/categories` | `routes/category.routes.js`: `GET /` (active categories A to Z, upcoming events each) |
| `/api/v1/locations` | `routes/location.routes.js`: `GET /search?q=` (OpenStreetMap places for the venue box) |
| `/api/v1/contact-messages` | `routes/contact.routes.js`: `POST /` (anyone, guests too); admins: `GET /`, `PUT /:id/read`, `PUT /:id/reply` |
| `/api/v1/analytics` | `routes/analytics.routes.js`: `GET /site` (admins), `GET /organiser` (organisers) |
| `/api/v1/logs` | `routes/log.routes.js`: `GET /?view=&q=&page=&limit=` (admins) |

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
  (`lib/errors.js`) for anything the client should see, or `fieldError(status, field, message)`
  for one shown under a form field (`body.<field>`); anything else becomes a 500 with a generic
  message, and the real error goes only to the server log
- **Validation:** Zod through `validate({ body, query, params })` (`middleware/validate.js`). It
  answers 400 `Invalid input` with one `{ path, message }` per problem, from every part at once.
  Routes read **`req.valid` only**, never `req.body`: fields a schema doesn't list (an organiser's
  `status`) never reach the database. (`req.valid` because Express 5 doesn't let `req.query` be
  replaced). Ids, page, limit and the slug pattern come from `validation/common.js`
  (`idParams('Event not found.')`, `limit(12)`)
- **Search:** `containsText(text, q)` (`lib/search.js`) is every `ILIKE` search, `%` and `_`
  taken literally
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
  in the frontend. Routes spread one of two guards (2026-11-08): `...readAs('admin')`
  (`requireAuth` + `requireRole`) or `...writeAs('organiser')` (with `requireActive` between).
  The few writes a suspended account may still make use `requireAuth` alone
- Same error for an unknown email and a wrong password ("Email or password is incorrect"), and
  an unknown email is still compared against a dummy hash so the timing matches
  (`lib/passwords.js`). Failed logins go to `system_logs` (`User Login Failed`): linked to
  the account when the email has one, otherwise only the IP; the typed email is never stored
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
  and are never deleted. Approving an edit deletes the snapshot's photo when the row's differs
  (Phase 7)
- Stored as both the delivery URL (`image_url`, `avatar`; `f_auto,q_auto`) and the public id
  (`image_public_id`, `avatar_public_id`). Events are kept at most 1600 px wide, pictures
  400 x 400 cropped round the subject. Folders `manchester-event/<NODE_ENV>/events` and
  `…/avatars`, so development's can be told apart and cleared
- `PUT /users/me/avatar` (multipart, `avatar`; none is 400) and `DELETE /users/me/avatar`:
  `requireActive`, logged as Profile Updated `{ fields: ['avatar'] }`, answer the account
- 20 uploads an hour per account (Arcjet, only when a file is sent)

## Moderation and notifications (decided 2026-11-03)

- **Admins' list:** `GET /events/manage` (admins), every event but drafts, newest first, in the
  organiser list's shape plus `organiser`, `adminUpdatedAt`, `adminId`, `adminName` and `approvedSnapshot`
  in the same shape (category and venue looked up), so Manage Events can show what an edit
  changed. All of them at once; the page filters in the browser (Slav, 2026-11-03)
- **Decisions** (`requireActive` admins; a draft is 404): `PUT /:id/approve`, `PUT /:id/reject`
  and `PUT /:id/take-down`, the last two with `{ reason }` (1 to 1000 characters, under
  `body.reason`). Each answers the event in the list's shape and logs Event Status Changed
  `{ eventId, name, status, reason? }`. The status read is part of the `UPDATE`, so a second
  admin deciding at the same moment gets 409
- Only a **pending** event is approved or rejected (400 otherwise). One never public whose start
  has passed is Expired (400); an edit of a live event can be decided until the live version
  has ended. Approve clears `approved_snapshot` and `rejection_reason` and records
  `admin_updated_at` / `admin_updated_by`. Reject keeps the snapshot, so a rejected edit leaves
  the approved version public
- **Take down** (Slav chose admin cancel over reject, 2026-11-03): an approved event that hasn't
  ended becomes cancelled, saves kept, the reason in `rejection_reason`. A reject would make it
  look never public, and deletable. On a cancelled event a reason therefore means an admin took it
  down, which is why the organiser's Cancel clears an old one
- **Notifications are inbox rows, emailed later by a job** (Slav, 2026-11-03; emails since
  Phase 11, see Scheduled jobs); the password emails are unchanged. `lib/notifications.js` holds who gets each
  type and its wording (plain text); type names are in `constants/notificationTypes.js` and
  match the frontend's `notificationTypes`. Recipients are read, then all their rows go in one
  `INSERT` (Drizzle's `insert().select()` needs every column in the table's order, so it was
  dropped). An account deleted between that read and the `INSERT` fails it for everyone, so
  `deliver()` reads the recipients again once. Written after the change succeeds; a failure
  goes to the server log and never fails the request

| Type | To | When |
| --- | --- | --- |
| `event_pending_review` | admins | an event starts waiting (created and sent, a draft sent, a live or rejected one edited); not again for each save while it waits |
| `event_status` | the organiser | approved, rejected or taken down; the reason in the body |
| `category_new_event` | active users following the category | the first approval (no `approved_snapshot`) |
| `event_update` | users who saved it | an edit of a live event approved |
| `event_cancelled` | users who saved it | the organiser cancels, or an admin takes it down |
| `event_cancelled_by_organiser` | admins | the organiser cancels |
| `password_changed` | the account | Settings or a reset link |
| `user_registered` | admins | sign-up |
| `account_status` | the account | suspended (until when, and why), its terms changed, or reactivated (Phase 8) |
| `event_reminder_week` | users who saved it | 09:00 London a week before its day (Phase 11) |
| `event_reminder_day` | users who saved it | 09:00 London the day before (Phase 11) |

- **Inbox:** `GET /users/me/notifications` (every role, also while suspended): the newest 200,
  each `{ notificationId, eventId, type, subject, body, readAt, createdAt, listed }`; `listed`
  is `isListed` for the row's event (false without one), so User Home counts only new events
  Explore still shows: a follower who didn't save one is never told it was cancelled.
  `PUT /users/me/notifications/read` takes `{ ids: [...] }` or `{ all: true }` (400 for both or
  neither), changes only the account's own unread rows, keeps the first read time, answers 204;
  allowed while suspended. No push: the frontend reloads it
- Reminders, the emails and clearing read rows after 90 days are the scheduled jobs (Phase 11)

## Manage users (decided 2026-11-03)

- **Admins only**, under `/users`: writes are `requireActive`, the list reads while suspended
  (2026-11-08). Accounts are made by sign-up and admins by the seed, so there's no create. **Admin accounts aren't changed here** (403), nor
  your own (400, "Change it on Settings"); an unknown id is 404 (Slav, 2026-11-03)
- `GET /users`: every account, newest first, as `publicUser()` plus `updatedAt`, `eventCount`
  (every event but drafts) and `hasBeenPublic` (`lib/accounts.js` `listManagedUsers()`), so the
  panel's counts and Delete rule come from the server. All at once; the page filters in the
  browser, like Manage Events
- `PUT /users/:id/status`: `{ status: 'active' }` or `{ status: 'suspended', reason, days }`,
  `days` 7, 30 or `null` (until lifted), left out to keep the current end (only while already
  suspended, 400 under `body.days` otherwise); the reason 1 to 1000 characters, under
  `body.reason`. The server works out `suspended_until`; reactivating clears it and the reason.
  Answers the account in the list's shape. Logs User Status Changed `{ userId, username,
  status, reason?, until? }` and sends `account_status`; reactivating an active account
  changes, logs and sends nothing
- **A suspension doesn't end sessions** (Slav, 2026-11-03): `requireActive` reads the account on
  every request, so it applies from the next one, and the person keeps reading with the banner.
  `liftExpiredSuspension()` runs on the target first, so an ended suspension isn't kept
- `DELETE /users/:id`: 204, the same rule as Settings' Delete through `deleteAccount()`
  (`lib/accounts.js`): an organiser whose events have been public is 409 (they can only be
  suspended), otherwise their never-public events, photos and the account go in one
  `db.batch()`; a RESTRICT failure from an event approved meanwhile is 409 too. Sessions,
  follows, favourites and notifications cascade. Logs User Deleted `{ userId, username, role,
  eventsDeleted }`

## Contact messages (decided 2026-11-03)

- `POST /contact-messages` takes guests and every role but admins (403). `optionalAuth`
  (`middleware/auth.js`) loads the account when the cookie has one and carries on as a guest
  otherwise. Signed in, only `message` is read and the name and email are the account's
  (`memberMessageSchema`), so they can't be forged; a guest sends `name`, `email` and
  `message` (`guestMessageSchema`). **A suspended account may write** (Slav, 2026-11-03): it
  is how they ask about the suspension. Answers 201 `{ messageId, createdAt }`
- Spam: a hidden `website` field (Contact.jsx keeps it off-screen and out of the tab order);
  filled in, the answer is the same 201 and nothing is stored. Arcjet: 5 messages an hour per
  IP and `validateEmail` (disposable, invalid, no MX: 400 under `body.email`)
- Admins: `GET /` lists every message newest first with `repliedByName`, all at once (the page
  filters in the browser). `PUT /:id/read` `{ read }` sets `read_at`, keeping the first time,
  or clears it (Mark as unread). Writes are `requireActive`
- **The reply is emailed at once** (Slav, 2026-11-03; notification emails go through the
  Phase 11 outbox instead): `PUT /:id/reply` `{ reply }` (1 to 5000 characters) claims the message with an
  `UPDATE … WHERE replied_at IS NULL` (one reply per message; a second, or another admin's at
  the same moment, is 409), then sends `lib/contactEmails.js` `sendContactReply()` (the reply,
  then their message quoted). If the email fails the claim is undone, Email Failed is logged
  and the answer is 503, so Replied never shows for a reply nobody got. Replying reads the
  message. Logs Contact Message Replied `{ messageId, name }`

## System Logs and analytics (decided 2026-11-04)

- **System Logs are filtered and paged on the server** (Slav, 2026-11-04): the table grows with
  every sign-in, so the PHP's "newest 100" would hide the rest. `GET /logs` (admins, suspended
  ones too: it only reads) takes `view` (`all`, `events`, `accounts`, `signins`, `failed`,
  `admin`), `q`, `page` and `limit` (25, the page's size; Admin Home asks for 5 with
  `view=admin-actions`, an admin's rows without sign-ins and sign-outs: Slav, 2026-11-04).
  Newest first. It answers `{ data, counts, pagination }`: `counts` is what each
  pill would show for the same search, so the counts follow the search box
- The views match the frontend describers' `kind` through `constants/logActions.js`
  (`LOG_EVENT_ACTIONS`, `LOG_SIGN_IN_ACTIONS`): Sign-ins includes the failed ones, Accounts is
  every action in neither list (a new action lands there, as on the page), Admins only is the
  copied `role`
- `q` searches what the sentence shows (`ILIKE`, `%` and `_` taken literally): the copied
  username, the action, the details' `name`, `username`, `email` and `reason`, and the event's
  and named account's names now. Each row also carries `eventName`, `actorName` and
  `targetName` as they are now, NULL once deleted, so the page links only to what still exists
- **Analytics figures are worked out in the browser** (Slav, 2026-11-04): the server sends only
  the rows `frontend/src/lib/analytics.js` reads that no other page loads (`lib/analytics.js`),
  and never who saved or followed. `GET /analytics/site` (admins): every save as `{ eventId,
  createdAt }`, followers per category `{ categoryId: slug, count }`, failed sign-ins of the
  last 15 days (the chart shows 14 in London days). `GET /analytics/organiser` (organisers):
  saves on their own events, followers of the categories they post in, and `audience`, each
  person once. Both read while suspended
- Followers are counted by `notifyFollowers()`'s rule (`reachableUser`, `lib/accounts.js`):
  active `user` accounts, the people a new event would reach. Users, events and messages come
  from the admin's lists App already holds; events there leave out drafts, which stay their
  organiser's
- Approval rate and review time use each event's latest `organiser_updated_at` /
  `admin_updated_at`: only the last round counts, since Event Updated doesn't record whether
  an edit went for review

## Scheduled jobs (decided 2026-11-05)

- **node-cron inside the API** (Slav, 2026-11-05): `lib/scheduler.js` starts them from
  `server.js` (not `app.js`, so tests never do), on London clocks with `noOverlap`: emails every
  5 minutes, reminders every 15, the clean-up at 03:30. `runJob()` logs a failure to the server
  log and never throws. `npm run jobs` (`src/runJobs.js`) runs all three once, reminders first,
  for trying them by hand or a host's own scheduler in Phase 12
- Each job in `lib/jobs.js` is a function of `now` that does whatever is due and not yet done,
  so a server asleep at 09:00 catches up on its next run and running twice changes nothing
- **Reminders** (decided 2026-10-11): `event_reminder_week` at 09:00 London a week before the
  day the event starts, `event_reminder_day` at 09:00 the day before, to everyone who saved it.
  Only events `isListed` shows, at the public version's time and name (`pub`, so a waiting
  edit's new date doesn't count). Not when the save came after the reminder fell due. Each
  only on its own day, since the wording counts from it: a week one missed until the next
  day, or a day one until the event's day, isn't sent late. The unique index on
  `(user_id, event_id, type)` for the two types keeps each to one row (`onConflictDoNothing`);
  a date change after sending is covered by `event_update`
- **Emails are an outbox** (Slav, 2026-11-05): `notifications.email_sent_at` (migration 0004).
  The job sends rows of `EMAILED_TYPES` (every type but `user_registered` and
  `password_changed`, which has its own email) created in the last 24 hours, oldest first, 100
  a run, to **verified** addresses (Slav, 2026-11-05) whose owner has `email_notifications`
  on; `account_status` (`ALWAYS_EMAILED_TYPES`) goes even with it off. The batch is claimed
  in one `UPDATE … WHERE email_sent_at IS NULL RETURNING` before any email goes (2026-11-09,
  replacing one claim per row), and only the rows it returns are sent, so two runs can't both
  send one; a failed email gives back that row and every one after it, to be tried next run
  (the rows already sent stay sent), logs Email Failed
  `{ email: 'notification', notificationId, error }` and ends the run (Gmail refusing one
  usually means all; about 500 a day). After 24 hours a row stays in the inbox only
- `lib/notificationEmails.js`: the row's subject and body, a link to `/dashboard/events/:id`
  (each role's own view) or `/dashboard/notifications`, and the Settings link to turn them off,
  left out of security emails. `lib/html.js` `escapeHtml()` is shared by every email file
- **Clean-up** (decided 2026-10-05): read notifications after 90 days, contact messages after
  12 months, and sessions and email links that have expired (`expires_at <= now`, the
  complement of the checks that accept them), in one `db.batch()`

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
