import { Router } from "express";

import { listLogs } from '../lib/systemLogs.js';
import { readAs } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logsQuerySchema } from '../validation/logs.js';

const logRouter = Router();

// System Logs, paged here rather than in the browser since the table grows with
// every sign-in. Reading, so a suspended admin may
logRouter.get('/', ...readAs('admin'), validate({ query: logsQuerySchema }), async (req, res) => {
    res.json(await listLogs(req.valid.query));
});

export default logRouter;
