import { timestamp } from 'drizzle-orm/pg-core';

// Shared column helpers. Not exported from schema/index.js: they are not tables.

// Every date column is timestamptz, so stored times don't depend on the server's time zone
export const timestamptz = (name) => timestamp(name, { withTimezone: true });

export const createdAt = timestamptz('created_at').notNull().defaultNow();

export const timestamps = {
    createdAt,
    updatedAt: timestamptz('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
};
