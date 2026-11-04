import { and, desc, eq, getTableColumns, ilike, inArray, notInArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '../db/index.js';
import { events, systemLogs, users } from '../db/schema/index.js';
import { LOG, LOG_EVENT_ACTIONS, LOG_SIGN_IN_ACTIONS, LOG_VIEWS } from '../constants/logActions.js';

// One row in System Logs. `user` did it, or is null when nobody is known (a
// failed login with an email that has no account). Name and role are copied,
// so the row still reads right after the account changes or is deleted
export async function logAction(action, user, details = null) {
    await db.insert(systemLogs).values({
        action,
        userId: user?.userId ?? null,
        username: user?.username ?? null,
        role: user?.role ?? null,
        details,
    });
}

// The accounts and event a row names, as they are now. A deleted one comes
// back NULL, so the page shows the copied name without a link to nowhere
const actors = alias(users, 'actors');
const targets = alias(users, 'targets');
const detail = (key) => sql`${systemLogs.details}->>${key}`;

function fromLogs(columns) {
    return db
        .select(columns)
        .from(systemLogs)
        .leftJoin(actors, eq(actors.userId, systemLogs.userId))
        .leftJoin(targets, eq(targets.userId, sql`(${detail('userId')})::int`))
        .leftJoin(events, eq(events.eventId, sql`(${detail('eventId')})::int`));
}

// Each pill's rule, the same as the page's describers (constants/logActions.js)
const viewConditions = {
    all: undefined,
    events: inArray(systemLogs.action, LOG_EVENT_ACTIONS),
    accounts: notInArray(systemLogs.action, [...LOG_EVENT_ACTIONS, ...LOG_SIGN_IN_ACTIONS]),
    signins: inArray(systemLogs.action, LOG_SIGN_IN_ACTIONS),
    failed: eq(systemLogs.action, LOG.USER_LOGIN_FAILED),
    admin: eq(systemLogs.role, 'admin'),
    'admin-actions': and(eq(systemLogs.role, 'admin'), notInArray(systemLogs.action, LOG_SIGN_IN_ACTIONS)),
};

// The words a row is shown with: who, the action, the event or account named
// (as copied and as it is now) and the email or reason under the sentence
function searchCondition(q) {
    if (!q) return undefined;
    // ILIKE's own wildcards are searched for as typed
    const pattern = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
    const text = sql`concat_ws(' ', ${systemLogs.username}, ${systemLogs.action}, ${detail('name')}, ${detail('username')}, ${detail('email')}, ${detail('reason')}, ${events.eventName}, ${targets.username})`;
    return ilike(text, pattern);
}

// System Logs (Phase 10, decided 2026-11-04): newest first, one page of one
// view, and how many rows each pill would show for the same search
export async function listLogs({ view, q, page, limit }) {
    const search = searchCondition(q);
    const counts = Object.fromEntries(
        LOG_VIEWS.map((name) => [
            name,
            viewConditions[name]
                ? sql`count(*) filter (where ${viewConditions[name]})`.mapWith(Number)
                : sql`count(*)`.mapWith(Number),
        ]),
    );

    const [rows, [viewCounts]] = await db.batch([
        fromLogs({
            ...getTableColumns(systemLogs),
            actorName: actors.username,
            targetName: targets.username,
            eventName: events.eventName,
        })
            .where(and(viewConditions[view], search))
            .orderBy(desc(systemLogs.createdAt), desc(systemLogs.logId))
            .limit(limit)
            .offset((page - 1) * limit),
        fromLogs(counts).where(search),
    ]);

    const total = viewCounts[view];
    return {
        data: rows,
        counts: viewCounts,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
}
