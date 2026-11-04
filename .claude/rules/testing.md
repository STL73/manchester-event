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
  Phase 10 27 of 27. Retry a write Windows refuses, and resume from there
- Rows other test files write at the same moment (sign-ins, logs) can't be counted exactly.
  Give the rows a test makes a marker of their own and search for it: Phase 10's log rows
  carry a token that the test accounts' own sign-ins don't, so the pill counts are exact
- Two guards for one rule hide each other: breaking either alone changes nothing, so the pass
  reads MISSED twice. Phase 9's reply had a check before its `UPDATE … WHERE replied_at IS
  NULL`; the check went, leaving the one guard that holds under a race, and a test catches it
- Read rows back in an order (`orderBy`) before taking `.at(-1)` or `[0]`: Postgres promises
  none, and with every test file running at once a Phase 8 test failed now and then
- A side effect that logs its failure instead of throwing (notifications, photo deletion) needs a
  test that reads the rows it should have written: Phase 7's first `notify()` failed on every
  call while all 137 tests passed

## Still to decide

- A frontend runner. `tests/` at the repo root is an empty placeholder
- Whether E2E uses Playwright (committed specs) and which flows count as critical
