import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';

// What the frontend may see of an account: everything but the password hash
export function publicUser(user) {
    return {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        accStatus: user.accStatus,
        suspendedUntil: user.suspendedUntil,
        suspensionReason: user.suspensionReason,
        emailNotifications: user.emailNotifications,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };
}

// A suspension with an end date ends by itself: it's lifted the first time the
// account is seen after that date, so no scheduled job is needed for it
export async function liftExpiredSuspension(user) {
    if (user.accStatus !== 'suspended' || !user.suspendedUntil || user.suspendedUntil > new Date()) return user;
    const [lifted] = await db
        .update(users)
        .set({ accStatus: 'active', suspendedUntil: null, suspensionReason: null })
        .where(eq(users.userId, user.userId))
        .returning();
    return lifted;
}
