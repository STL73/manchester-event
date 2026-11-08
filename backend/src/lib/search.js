import { ilike } from 'drizzle-orm';

// `text` contains what was typed, ILIKE's own wildcards (% and _) searched for as typed
export function containsText(text, q) {
    return ilike(text, `%${q.replace(/[\\%_]/g, '\\$&')}%`);
}
