import { pgTable, pgEnum, integer, varchar, timestamp } from 'drizzle-orm/pg-core';

const timestamps = {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
};
export const roleEnum = pgEnum('role', ['user', 'organiser', 'admin']);
export const accStatusEnum = pgEnum('acc_status', ['active', 'pending', 'suspended']);

export const users = pgTable('users', {
    userId: integer('user_id').primaryKey().generatedAlwaysAsIdentity(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    role: roleEnum('role').notNull().default('user'),
    accStatus: accStatusEnum('acc_status').notNull().default('active'),
    avatar: varchar('avatar', { length: 255 }),
    ...timestamps
});
