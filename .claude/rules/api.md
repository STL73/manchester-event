# API Rules

## Current state

Every endpoint is a stub that returns a placeholder string (`res.send('Get all events')`). There
is no auth, validation or database access in the routes yet.

## Routing

All routes are versioned under `/api/v1`, one router per resource, mounted in `src/server.js`:

| Mount | File and endpoints |
| --- | --- |
| `/api/v1/auth` | `routes/auth.routes.js`: `POST /sign-up`, `/login`, `/logout` |
| `/api/v1/users` | `routes/user.routes.js`: REST CRUD on `/` and `/:id` |
| `/api/v1/events` | `routes/event.routes.js`: REST CRUD, plus `GET /user/:id`, `PUT /user/:id/cancel` |

- Router files: `const xRouter = Router();` then `export default xRouter;`
- REST verbs: `GET` list/detail, `POST` create, `PUT` update, `DELETE` remove. Actions that
  aren't CRUD are a sub-path verb (`/user/:id/cancel`)

## Middleware order

`app.use(express.json())` must stay **above** the `app.use('/api/v1/...')` lines in `server.js`.
Middleware registered after a router never runs for that router's routes, so `req.body` would be
`undefined`.

## To decide when handlers are written

Nothing is set yet. Record each decision here once it's made:

- Response shape (success and error envelope)
- Status codes per action
- Input validation approach
- Auth mechanism (the frontend `.env` has `VITE_NEON_AUTH_URL`, which suggests Neon Auth) and role
  checks for `user` / `organiser` / `admin`
- Central error-handling middleware
