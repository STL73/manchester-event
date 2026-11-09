# Code Style

There's no Prettier config. Match the file you're in. The two packages differ:

| Convention | `frontend/` | `backend/` |
| --- | --- | --- |
| Quotes | double | single (routers use double, leave them) |
| Semicolons | yes | yes |
| Indent | 2 spaces | 4 spaces |
| Trailing commas | yes, multi-line | not consistently |

## Shared conventions

- ES modules everywhere; no CommonJS
- `const` by default; arrow functions for callbacks, `function` declarations for components and
  top-level helpers
- Derive values instead of storing them in extra state (see `App.jsx`)
- Immutable updates: spread or `map`/`filter`, never mutate state or props
- No `console.log` left in frontend code. The backend's single startup log in `server.js` is fine
- Lint: ESLint flat config in each package (`eslint.config.js`). The frontend has the
  react-hooks and react-refresh plugins

## Comments (agreed 2026-11-09)

- **One line above each component and exported function** saying what it does, in plain words
- **A "why" only when the code can't show it**, at most two lines. Don't narrate what the code
  does
- **No history in code:** no "(Phase N)", no dates ("decided …", "Slav, …"), no "used to",
  and no references to the old PHP project. Decisions and their dates live in `.claude/rules/`
  and git
- **Tests are the exception for length:** a comment that explains how a test forces its
  situation (a race, a fixed clock) may be as long as it needs. The other rules still apply, and
  `tests/helpers.js` follows the one-liner rule

## JavaScript, not TypeScript

The project is plain JS/JSX. Don't add `.ts` files or TS-only syntax. Use JSDoc only where a type
genuinely helps a shared helper.
