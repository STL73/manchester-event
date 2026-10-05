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
- Comments explain *why*, often pointing at the PHP behaviour being matched. Keep that style;
  don't narrate what the code does
- No `console.log` left in frontend code. The backend's single startup log in `server.js` is fine
- Lint: ESLint flat config in each package (`eslint.config.js`). The frontend has the
  react-hooks and react-refresh plugins

## JavaScript, not TypeScript

The project is plain JS/JSX. Don't add `.ts` files or TS-only syntax. Use JSDoc only where a type
genuinely helps a shared helper.
