import { Router } from 'express';

import { listCategories } from '../lib/publicEvents.js';

const categoryRouter = Router();

// Archived categories are left out: they're hidden from filters and Preferences
categoryRouter.get('/', async (req, res) => {
    res.json({ data: await listCategories() });
});

export default categoryRouter;
