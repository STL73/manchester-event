# Deployment Rules

No production deployment exists yet. The project runs locally only (`npm run dev` in each package).
The `backend/.env.production.local` file and the Neon database are the only production-adjacent
pieces.

When it's deployed, document:

- Hosting for the frontend (static Vite build from `frontend/dist`) and for the Express API
- Environment variables needed in production for each package (`PORT`, `NODE_ENV`, `DB_URL`,
  `VITE_NEON_AUTH_URL`, `VITE_NEON_DATA_API_URL`) and where they're set
- How migrations run against the production database, and who runs them
- The build and deploy commands, and how to roll back
