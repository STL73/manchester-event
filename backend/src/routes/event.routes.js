import { Router } from "express";

import { AppError } from '../lib/errors.js';
import { findPublicEvent, listPublicEvents, summarisePublicEvents } from '../lib/publicEvents.js';
import { validate } from '../middleware/validate.js';
import { eventIdParams, listEventsQuery } from '../validation/events.js';

const eventRouter = Router();

// The public lists: Explore Events, Home's What's on, Preferences, About
eventRouter.get('/', validate({ query: listEventsQuery }), async (req, res) => {
    res.json(await listPublicEvents(req.valid.query));
});

// Counts for Home and About. Before /:id, or "summary" would be read as an ID
eventRouter.get('/summary', async (req, res) => {
    res.json({ data: await summarisePublicEvents() });
});

// Event details for guests and users. An event that was never public reads as
// not found rather than forbidden, so its existence isn't given away
eventRouter.get('/:id', validate({ params: eventIdParams }), async (req, res) => {
    const event = await findPublicEvent(req.valid.params.id);
    if (!event) throw new AppError(404, 'Event not found.');
    res.json({ data: event });
});

eventRouter.post('/', (req, res) => {
    res.send('Create event')
})

eventRouter.put('/:id', (req, res) => {
    res.send('Update event')
})

eventRouter.delete('/:id', (req, res) => {
    res.send('Delete event')
})

eventRouter.get('/user/:id', (req, res) => {
    res.send('Get all user events')
})

eventRouter.put('/user/:id/cancel', (req, res) => {
    res.send('Cancel event by user')
})

export default eventRouter;