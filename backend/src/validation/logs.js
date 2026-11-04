import { z } from 'zod';
import { LOG_VIEWS } from '../constants/logActions.js';

// System Logs (Phase 10): one view, a search and a page. 25 a page as the
// page shows them; Admin Home's Recent Admin Actions asks for 5
export const logsQuerySchema = z.object({
    view: z.enum(LOG_VIEWS, { error: 'Choose a view from the list.' }).default('all'),
    q: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(25).default(25),
});
