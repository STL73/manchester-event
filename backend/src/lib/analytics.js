import { and, asc, count, countDistinct, eq, gte, inArray } from 'drizzle-orm';

import { db } from '../db/index.js';
import { categories, categoryFollows, events, favourites, systemLogs, users } from '../db/schema/index.js';
import { LOG } from '../constants/logActions.js';
import { DAY } from './londonTime.js';
import { reachableUser } from './accounts.js';

// The rows the analytics pages read that no other page loads. The browser works
// out the figures, and who saved or followed is never sent

// A save is when and which event: the favourites row without its user
const saveColumns = { eventId: favourites.eventId, createdAt: favourites.createdAt };

function followCounts(categoryCondition) {
    return db
        .select({ categoryId: categories.slug, count: count() })
        .from(categoryFollows)
        .innerJoin(users, eq(users.userId, categoryFollows.userId))
        .innerJoin(categories, eq(categories.categoryId, categoryFollows.categoryId))
        .where(and(reachableUser, categoryCondition))
        .groupBy(categories.slug)
        .orderBy(asc(categories.slug));
}

// Admins: every save, followers per category and failed sign-ins. The page
// charts 14 days of those; 15 are sent so the first day is whole in London
export async function siteAnalytics(now = new Date()) {
    const [saves, follows, failedSignIns] = await db.batch([
        db.select(saveColumns).from(favourites).orderBy(asc(favourites.createdAt), asc(favourites.eventId)),
        followCounts(),
        db
            .select({ createdAt: systemLogs.createdAt })
            .from(systemLogs)
            .where(and(eq(systemLogs.action, LOG.USER_LOGIN_FAILED), gte(systemLogs.createdAt, new Date(now - 15 * DAY))))
            .orderBy(asc(systemLogs.createdAt), asc(systemLogs.logId)),
    ]);
    return { saves, follows, failedSignIns };
}

// Organisers: saves on their own events, and the followers of the categories
// they post in, each category and everyone once (Audience Reach)
export async function organiserAnalytics(organiserId) {
    const ownCategories = inArray(
        categoryFollows.categoryId,
        db.selectDistinct({ categoryId: events.categoryId }).from(events).where(eq(events.organiserId, organiserId)),
    );
    const [saves, follows, [{ audience }]] = await db.batch([
        db
            .select(saveColumns)
            .from(favourites)
            .innerJoin(events, eq(events.eventId, favourites.eventId))
            .where(eq(events.organiserId, organiserId))
            .orderBy(asc(favourites.createdAt), asc(favourites.eventId)),
        followCounts(ownCategories),
        db
            .select({ audience: countDistinct(categoryFollows.userId) })
            .from(categoryFollows)
            .innerJoin(users, eq(users.userId, categoryFollows.userId))
            .where(and(reachableUser, ownCategories)),
    ]);
    return { saves, follows, audience };
}
