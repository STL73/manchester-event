import { sql } from 'drizzle-orm';
import {
    pgTable,
    pgEnum,
    integer,
    varchar,
    text,
    boolean,
    numeric,
    jsonb,
    primaryKey,
    index,
    uniqueIndex,
    check,
} from 'drizzle-orm/pg-core';
import { timestamptz, createdAt, timestamps } from './columns.js';

export const roleEnum = pgEnum('role', ['user', 'organiser', 'admin']);
export const accStatusEnum = pgEnum('acc_status', ['active', 'suspended']);
// No 'past': an event is past when it's approved and COALESCE(end, start) has gone by
export const eventStatusEnum = pgEnum('event_status', ['draft', 'pending', 'approved', 'rejected', 'cancelled']);

export const users = pgTable('users', {
    userId: integer('user_id').primaryKey().generatedAlwaysAsIdentity(),
    // Display name only; people log in by email, so it doesn't need to be unique
    username: varchar('username', { length: 50 }).notNull(),
    // Stored lowercase: the app lowercases it on sign-up and login
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    // Sign-up rejects 'admin'; admins come from the seed script
    role: roleEnum('role').notNull().default('user'),
    // NULL = not verified yet
    emailVerifiedAt: timestamptz('email_verified_at'),
    accStatus: accStatusEnum('acc_status').notNull().default('active'),
    // NULL while suspended = indefinite
    suspendedUntil: timestamptz('suspended_until'),
    suspensionReason: text('suspension_reason'),
    // Security emails (password changed, account status) are sent regardless
    emailNotifications: boolean('email_notifications').notNull().default(true),
    // NULL = the frontend shows the default icon
    avatar: varchar('avatar', { length: 255 }),
    ...timestamps,
});

export const categories = pgTable('categories', {
    categoryId: integer('category_id').primaryKey().generatedAlwaysAsIdentity(),
    // Generated from the name on create and never changed, so renames don't break links
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    // Archived categories are hidden from new events, filters and preferences
    isActive: boolean('is_active').notNull().default(true),
});

// Shared venues and addresses, always picked from Google Places, never typed in
export const locations = pgTable('locations', {
    locationId: integer('location_id').primaryKey().generatedAlwaysAsIdentity(),
    placeId: varchar('place_id', { length: 255 }).notNull().unique(),
    locationName: varchar('location_name', { length: 255 }).notNull(),
    address: varchar('address', { length: 255 }).notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 8, mode: 'number' }).notNull(),
    longitude: numeric('longitude', { precision: 11, scale: 8, mode: 'number' }).notNull(),
    ...timestamps,
});

export const events = pgTable('events', {
    eventId: integer('event_id').primaryKey().generatedAlwaysAsIdentity(),
    // RESTRICT: account deletion removes an organiser's non-public events first,
    // and an organiser with public events can only be suspended
    organiserId: integer('organiser_id').notNull().references(() => users.userId, { onDelete: 'restrict' }),
    eventName: varchar('event_name', { length: 255 }).notNull(),
    eventDescription: text('event_description').notNull(),
    startDatetime: timestamptz('start_datetime').notNull(),
    endDatetime: timestamptz('end_datetime'),
    locationId: integer('location_id').notNull().references(() => locations.locationId, { onDelete: 'restrict' }),
    // Categories are archived rather than deleted while events use them
    categoryId: integer('category_id').notNull().references(() => categories.categoryId, { onDelete: 'restrict' }),
    ticketUrl: varchar('ticket_url', { length: 500 }),
    // NULL = the frontend shows the default image
    imageUrl: varchar('image_url', { length: 1000 }),
    status: eventStatusEnum('status').notNull().default('draft'),
    // Required by the app when an admin rejects
    rejectionReason: text('rejection_reason'),
    // Copy of the last approved version: stays public while an edit is pending review,
    // and gives the admin a before/after view
    approvedSnapshot: jsonb('approved_snapshot'),
    // Set by the app on edit, cancel and draft submission, not on draft saves
    organiserUpdatedAt: timestamptz('organiser_updated_at'),
    // Status changes only. Pending with this set = re-submission
    adminUpdatedAt: timestamptz('admin_updated_at'),
    adminUpdatedBy: integer('admin_updated_by').references(() => users.userId, { onDelete: 'set null' }),
    ...timestamps,
}, (table) => [
    check('events_end_after_start', sql`${table.endDatetime} > ${table.startDatetime}`),
    index('events_organiser_id_idx').on(table.organiserId),
    index('events_category_id_idx').on(table.categoryId),
    index('events_location_id_idx').on(table.locationId),
    index('events_status_idx').on(table.status),
]);

export const favourites = pgTable('favourites', {
    userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
    eventId: integer('event_id').notNull().references(() => events.eventId, { onDelete: 'cascade' }),
    createdAt,
}, (table) => [
    primaryKey({ columns: [table.userId, table.eventId] }),
    index('favourites_event_id_idx').on(table.eventId),
]);

export const categoryFollows = pgTable('category_follows', {
    userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
    categoryId: integer('category_id').notNull().references(() => categories.categoryId, { onDelete: 'cascade' }),
    createdAt,
}, (table) => [
    primaryKey({ columns: [table.userId, table.categoryId] }),
    index('category_follows_category_id_idx').on(table.categoryId),
]);

// In-app inbox. Emails are sent directly; failures go to system_logs
export const notifications = pgTable('notifications', {
    notificationId: integer('notification_id').primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
    eventId: integer('event_id').references(() => events.eventId, { onDelete: 'cascade' }),
    // Fixed names, kept in one backend constants file
    type: varchar('type', { length: 50 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    // Plain text; escaping happens when it's rendered
    body: text('body').notNull(),
    readAt: timestamptz('read_at'),
    createdAt,
}, (table) => [
    index('notifications_user_id_idx').on(table.userId),
    // One reminder per user per event, however often the reminder job runs
    uniqueIndex('notifications_event_reminder_unique')
        .on(table.userId, table.eventId)
        .where(sql`type = 'event_reminder'`),
]);

export const systemLogs = pgTable('system_logs', {
    logId: integer('log_id').primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id').references(() => users.userId, { onDelete: 'set null' }),
    // Copies taken at the time, so the log still reads correctly after changes or deletion
    username: varchar('username', { length: 50 }),
    role: roleEnum('role'),
    // Fixed names, kept in one backend constants file
    action: varchar('action', { length: 100 }).notNull(),
    details: jsonb('details'),
    createdAt,
}, (table) => [
    index('system_logs_created_at_idx').on(table.createdAt),
    index('system_logs_user_id_idx').on(table.userId),
]);

export const contactMessages = pgTable('contact_messages', {
    messageId: integer('message_id').primaryKey().generatedAlwaysAsIdentity(),
    // NULL = sent by a guest
    userId: integer('user_id').references(() => users.userId, { onDelete: 'set null' }),
    // Taken from the account on the server when the sender is logged in
    name: varchar('name', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    message: text('message').notNull(),
    createdAt,
    readAt: timestamptz('read_at'),
    repliedAt: timestamptz('replied_at'),
    repliedBy: integer('replied_by').references(() => users.userId, { onDelete: 'set null' }),
    replyBody: text('reply_body'),
});
