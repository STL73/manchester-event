import { z } from 'zod';
import { AREAS } from '../constants/areas.js';
import { londonInstant } from '../lib/londonTime.js';
import { OSM_ID } from '../lib/osm.js';

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

// A time as a Manchester clock shows it, what the form's datetime-local input
// gives ('2026-11-14T19:30'), so the browser's own time zone never matters
const londonDateTime = (message) => z
    .string({ error: message })
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, message)
    .refine((value) => {
        const [date, time] = value.split('T');
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        // Date.UTC rolls 30 February over to March: a real date comes back unchanged
        const check = new Date(Date.UTC(year, month - 1, day));
        return check.getUTCMonth() === month - 1 && check.getUTCDate() === day && hours < 24 && minutes < 60;
    }, message)
    .transform((value) => {
        const [date, time] = value.split('T');
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        return londonInstant(year, month, day, hours, minutes);
    });

// Create and Edit Event. There is no status: the route decides it from the
// button (submit) and the event's state, so an organiser can never approve
// their own event. The venue comes as its OSM id only; its details are looked
// up on the server. A new photo comes as a file beside the form (middleware/upload.js)
export const eventBodySchema = z
    .object({
        eventName: z.string({ error: 'Enter the event\'s name.' }).trim().min(1, 'Enter the event\'s name.').max(255, 'Keep the name under 255 characters.'),
        category: z.string({ error: 'Choose a category.' }).regex(slug, 'Choose a category.'),
        description: z.string({ error: 'Describe the event.' }).trim().min(1, 'Describe the event.').max(5000, 'Keep the description under 5,000 characters.'),
        startDatetime: londonDateTime('Pick the start date and time.'),
        endDatetime: londonDateTime('Pick the end date and time, or leave it empty.').nullable().default(null),
        placeId: z.string({ error: 'Choose the venue from the list.' }).regex(OSM_ID, 'Choose the venue from the list.'),
        ticketUrl: z
            .url({ protocol: /^https?$/, error: 'Enter a link starting with https://' })
            .max(500, 'Keep the link under 500 characters.'),
        submit: z.boolean().default(false),
        // Back to the default photo. A file sent at the same time wins
        removeImage: z.boolean().default(false),
    })
    .refine((body) => !body.endDatetime || body.endDatetime > body.startDatetime, {
        message: 'The end must be after the start.',
        path: ['endDatetime'],
    });

export const locationSearchQuery = z.object({
    q: z.string({ error: 'Type at least 3 letters.' }).trim().min(3, 'Type at least 3 letters.').max(100, 'Keep the search under 100 characters.'),
});
