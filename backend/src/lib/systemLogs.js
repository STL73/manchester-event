import { db } from '../db/index.js';
import { systemLogs } from '../db/schema/index.js';

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
