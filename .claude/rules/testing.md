# Testing Rules

## Backend (set up 2026-10-26)

- **Vitest + Supertest**, `npm test` (once) or `npm run test:watch`, from `backend/`
- Files: `backend/tests/*.test.js`. Supertest sends requests to `src/app.js` directly, with no
  port, which is why `server.js` only calls `listen`
- **Database:** the Neon branch `test` (`TEST_DB_URL`). `tests/setup.js` runs first, points
  `DB_URL` at it and refuses to run without it, so tests can never touch the development database
- Arcjet is off in tests (`NODE_ENV=test`): no calls to its service, nothing rate-limited
- Each phase adds tests for its endpoints
- Outside services are never called: `osm.test.js` stubs `fetch` with OpenStreetMap-shaped
  answers, and route tests replace `lib/osm.js` with `vi.mock` (Phase 5). Cloudinary the same
  way: `images.test.js` replaces the `cloudinary` SDK, and `photos.test.js` replaces
  `lib/images.js` (Phase 6). The upload limit and the start-up key check aren't tested, since
  Arcjet is off and `NODE_ENV` is `test`
- Each phase also breaks its rules one at a time on purpose (a scratchpad script edits one line,
  runs the tests, restores the file and checks it matches) to show a test catches each; Phase 5
  caught 29 of 29, Phase 6 22 of 22, Phase 7 39 of 39, Phase 8 27 of 27, Phase 9 29 of 29,
  Phase 10 27 of 27, Phase 11 33 of 33. Retry a write Windows refuses, and resume from there
- Rows other test files write at the same moment (sign-ins, logs) can't be counted exactly.
  Give the rows a test makes a marker of their own and search for it: Phase 10's log rows
  carry a token that the test accounts' own sign-ins don't, so the pill counts are exact
- Two guards for one rule hide each other: breaking either alone changes nothing, so the pass
  reads MISSED twice. Phase 9's reply had a check before its `UPDATE … WHERE replied_at IS
  NULL`; the check went, leaving the one guard that holds under a race, and a test catches it
- **Log in through `testAgent()`** (`tests/helpers.js`), never `request.agent(app)`: it keeps
  one connection open. Supertest closes the connection after every request by default, and on
  Windows an answer over 64 KB on a closing local connection sometimes stalls until it is reset
  about 19 s later. That was the moderation list test's "Test timed out in 15000ms"
  (2026-11-09): Neon and the server answered in under a second every time, while a bare
  Express route sending 66 KB through Supertest stalled 32 times in 300, 0 with keep-alive. The
  admin's events list (66 KB) was the only answer over 64 KB, Manage Users (21 KB) the next.
  `request(app)` alone is fine for small answers
- To find where a test waits, time every Neon request by wrapping `globalThis.fetch` in
  `tests/setup.js` (the neon-http driver calls it at query time) and write the times to a file,
  which works whether or not Vitest shows the console. Time the server's side too
  (`res.on('finish')`) before blaming the database
- `notifyAdmins()` writes to every admin, including the ones other test files are deleting, so
  `deliver()` reads its recipients again after a foreign-key failure (2026-11-08). Without that,
  "tells every admin about a new account" failed now and then in full runs
- Read rows back in an order (`orderBy`) before taking `.at(-1)` or `[0]`: Postgres promises
  none, and with every test file running at once a Phase 8 test failed now and then
- **A race test must force the interleaving.** Phase 11's first overlap test ran two email
  jobs with `Promise.all` and passed with the claim removed: run B's read reached Neon after
  run A's claim, so they never raced. `jobs.test.js` now holds run A inside its first send (a
  mock that awaits a promise the test resolves), runs B, then lets A go
- The jobs read the whole table while other files write rows, so `jobs.test.js` checks only
  its own accounts' rows, stubs `sendEmail`, fixes "now" at 12:00 London so 09:00 reminders are
  always due, and runs the email job with a high limit so older rows can't crowd its own out
- A side effect that logs its failure instead of throwing (notifications, photo deletion) needs a
  test that reads the rows it should have written: Phase 7's first `notify()` failed on every
  call while all 137 tests passed

## Still to decide

- A frontend runner. `tests/` at the repo root is an empty placeholder
- Whether E2E uses Playwright (committed specs) and which flows count as critical
