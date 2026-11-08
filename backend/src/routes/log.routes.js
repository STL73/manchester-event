import { Router } from "express";

import { listLogs } from '../lib/systemLogs.js';
import { readAs } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logsQuerySchema } from '../validation/logs.js';

const logRouter = Router();

// Matches get_system_logs(), but every row is reachable: the view, search and
// page are worked out here rather than in the browser (decided 2026-11-04),
// since the table grows with every sign-in. Reading, so a suspended admin may
logRouter.get('/', ...readAs('admin'), validate({ query: logsQuerySchema }), async (req, res) => {
    res.json(await listLogs(req.valid.query));
});

export default logRouter;
