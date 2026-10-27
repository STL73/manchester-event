import { z } from 'zod';
import { AREAS } from '../constants/areas.js';

const slug = /^[a-z0-9-]+$/;

// Explore Events' filters, the same names as its URL. The frontend leaves out
// filters that aren't in use
export const listEventsQuery = z.object({
    q: z.string().trim().max(100, 'Keep the search under 100 characters.').optional(),
    // One slug from Explore, several (comma-separated) from Preferences
    category: z
        .string()
        .transform((value) => value.split(',').filter(Boolean))
        .pipe(z.array(z.string().regex(slug, 'Choose a category from the list.')).max(50))
        .optional(),
    location: z.enum(AREAS, { error: 'Choose an area from the list.' }).optional(),
    when: z.enum(['tonight', 'weekend', 'week'], { error: 'Choose tonight, this weekend or the next 7 days.' }).optional(),
    date: z.iso.date({ error: 'Pick a date as YYYY-MM-DD.' }).optional(),
    page: z.coerce.number().int().min(1).default(1),
    // 12 fills whole rows in every Explore view; Home and Preferences ask for 3
    limit: z.coerce.number().int().min(1).max(12).default(12),
});

export const eventIdParams = z.object({
    id: z.coerce.number({ error: 'Event not found.' }).int().positive(),
});
