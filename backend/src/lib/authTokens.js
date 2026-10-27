import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { authTokens } from '../db/schema/index.js';
import { newToken, hashToken } from './tokens.js';

const HOUR = 60 * 60 * 1000;
const LIFETIME = { email_verification: 24 * HOUR, password_reset: HOUR };

// A new link token for one purpose. It replaces the user's previous one (the
// table allows one per user and purpose), so an older email stops working
export async function createAuthToken(userId, purpose) {
    const { token, hash } = newToken();
    const expiresAt = new Date(Date.now() + LIFETIME[purpose]);
    await db
        .insert(authTokens)
        .values({ tokenHash: hash, userId, purpose, expiresAt })
        .onConflictDoUpdate({
            target: [authTokens.userId, authTokens.purpose],
            set: { tokenHash: hash, expiresAt, createdAt: new Date() },
        });
    return token;
}

// Deletes a valid token and returns its row, or null if it's unknown, expired
// or already used. Deleting and reading in one statement means a link can't be
// used twice, even by two requests at the same moment
export async function consumeAuthToken(token, purpose) {
    const [row] = await db
        .delete(authTokens)
        .where(and(
            eq(authTokens.tokenHash, hashToken(token)),
            eq(authTokens.purpose, purpose),
            gt(authTokens.expiresAt, new Date()),
        ))
        .returning();
    return row ?? null;
}
