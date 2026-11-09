import { Router } from "express";
import { slidingWindow } from '@arcjet/node';

import { aj } from '../config/arcjet.js';
import { searchPlaces } from '../lib/osm.js';
import { writeAs } from '../middleware/auth.js';
import { arcjetProtect } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { locationSearchQuery } from '../validation/events.js';

const locationRouter = Router();

// Photon throttles heavy users, and all our searches come from one address: 30
// a minute per organiser is plenty for a form that waits for typing to pause
const searchGuard = aj?.withRule(slidingWindow({ mode: 'LIVE', characteristics: ['userId'], interval: '1m', max: 30 }));

// Create and Edit Event's venue box. Only organisers pick venues
locationRouter.get(
    '/search',
    ...writeAs('organiser'),
    arcjetProtect(searchGuard, (req) => ({ userId: String(req.user.userId) })),
    validate({ query: locationSearchQuery }),
    async (req, res) => {
        res.json({ data: await searchPlaces(req.valid.query.q) });
    },
);

export default locationRouter;
