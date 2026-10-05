# Testing Rules

No test suite exists yet. `tests/` at the repo root is an empty placeholder, and neither package
has a test runner installed or a `test` script.

When tests are added, document:

- The runner per package (e.g. Vitest for `frontend/`, Vitest or `node:test` for `backend/`) and
  the command that runs it
- Where test files live (co-located `*.test.js` vs `tests/`)
- How the backend tests reach a database (a separate Neon branch, never the dev DB)
- Whether E2E uses Playwright (committed specs) and which flows count as critical
