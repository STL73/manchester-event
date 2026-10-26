import { pgTable, pgEnum, integer, varchar, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { timestamptz, createdAt } from './columns.js';
import { users } from './app.js';

export const tokenPurposeEnum = pgEnum('token_purpose', ['email_verification', 'password_reset']);

// Own auth with database sessions (decided 2026-10-26), so logout and suspension
// take effect on the next request. Only SHA-256 hashes are stored: a leaked row
// can't be used to sign in, because the real value lives only in the cookie
export const sessions = pgTable('sessions', {
    sessionId: varchar('session_id', { length: 64 }).primaryKey(),
    userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
    // 30 days, moved forward when fewer than 15 are left
    expiresAt: timestamptz('expires_at').notNull(),
    createdAt,
}, (table) => [
    // Signing a user out everywhere (password change, suspension)
    index('sessions_user_id_idx').on(table.userId),
]);

// Email verification and password reset links; deleted as soon as they're used
export const authTokens = pgTable('auth_tokens', {
    tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
    userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
    purpose: tokenPurposeEnum('purpose').notNull(),
    // 24 hours for verification, 1 hour for a reset
    expiresAt: timestamptz('expires_at').notNull(),
    createdAt,
}, (table) => [
    // One live link per purpose: resending replaces it, so an older email stops
    // working. Also serves lookups by user_id, its first column
    uniqueIndex('auth_tokens_user_purpose_unique').on(table.userId, table.purpose),
]);
