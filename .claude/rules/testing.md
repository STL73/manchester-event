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
  caught 29 of 29, Phase 6 22 of 22. Retry a write Windows refuses, and resume from there

## Still to decide

- A frontend runner. `tests/` at the repo root is an empty placeholder
- Whether E2E uses Playwright (committed specs) and which flows count as critical
