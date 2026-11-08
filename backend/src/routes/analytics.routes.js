import { Router } from "express";

import { organiserAnalytics, siteAnalytics } from '../lib/analytics.js';
import { readAs } from '../middleware/auth.js';

const analyticsRouter = Router();

// Reading only, so a suspended account may, as with its other lists
analyticsRouter.get('/site', ...readAs('admin'), async (req, res) => {
    res.json({ data: await siteAnalytics() });
});

analyticsRouter.get('/organiser', ...readAs('organiser'), async (req, res) => {
    res.json({ data: await organiserAnalytics(req.user.userId) });
});

export default analyticsRouter;
