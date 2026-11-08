import { z } from 'zod';

// Category slugs, as the seed makes them
export const SLUG = /^[a-z0-9-]+$/;

// `/:id`, with the 404's wording for when it isn't a number
export const idParams = (notFound) => z.object({ id: z.coerce.number({ error: notFound }).int().positive() });

export const page = z.coerce.number().int().min(1).default(1);
// The page's own size is both the default and the most it may ask for
export const limit = (size) => z.coerce.number().int().min(1).max(size).default(size);
