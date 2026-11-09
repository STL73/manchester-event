import { and, asc, count, eq, gte, inArray, isNotNull, lt, lte, or, sql } from 'drizzle-orm';

import { db } from '../db/index.js';
import { containsText } from './search.js';
import { categories, events, favourites, locations, users } from '../db/schema/index.js';
import { dayRange, whenRange } from './londonTime.js';

// What guests and users see of an event; every public read goes through here.
// A waiting or rejected edit still shows, and is searched as, its approved version

// Pending or rejected with an approved version kept: the public sees the snapshot
const showsSnapshot = and(inArray(events.status, ['pending', 'rejected']), isNotNull(events.approvedSnapshot));

// The snapshot's value when it applies, otherwise the column's. Its keys are the
// Drizzle names (eventName, startDatetime...), dates as ISO strings
function current(column, key, type) {
    return sql`case when ${showsSnapshot} then (${events.approvedSnapshot} ->> ${key})::${sql.raw(type)} else ${column} end`;
}

// An event's columns as the public sees them
export const pub = {
    name: current(events.eventName, 'eventName', 'text'),
    description: current(events.eventDescription, 'eventDescription', 'text'),
    startDatetime: current(events.startDatetime, 'startDatetime', 'timestamptz').mapWith(events.startDatetime),
    endDatetime: current(events.endDatetime, 'endDatetime', 'timestamptz').mapWith(events.endDatetime),
    locationId: current(events.locationId, 'locationId', 'integer'),
    categoryId: current(events.categoryId, 'categoryId', 'integer'),
    ticketUrl: current(events.ticketUrl, 'ticketUrl', 'text'),
    imageUrl: current(events.imageUrl, 'imageUrl', 'text'),
    status: sql`case when ${showsSnapshot} then 'approved' else ${events.status}::text end`,
};

// Approved or cancelled, or an edit hiding behind its approved version
const isPublic = or(inArray(events.status, ['approved', 'cancelled']), showsSnapshot);
const isLive = or(eq(events.status, 'approved'), showsSnapshot);
// Public at some point, so it can be cancelled but never deleted. hasBeenPublic
// asks the database, wasPublic a row already read
const PUBLIC_STATUSES = ['approved', 'cancelled'];
export const hasBeenPublic = or(inArray(events.status, PUBLIC_STATUSES), isNotNull(events.approvedSnapshot));
export const wasPublic = (row) => PUBLIC_STATUSES.includes(row.status) || Boolean(row.approvedSnapshot);
const isUpcoming = (now) => gte(sql`coalesce(${pub.endDatetime}, ${pub.startDatetime})`, now);
// An ended suspension hides nothing, even before it is lifted. isNotNull goes
// first: NULL <= now is unknown, which would come back as null, not false
const organiserVisible = (now) =>
    or(eq(users.accStatus, 'active'), and(isNotNull(users.suspendedUntil), lte(users.suspendedUntil, now)));
// What the lists show, and so what can be saved: live, not over, organiser not suspended
export const isListed = (now) => and(isLive, isUpcoming(now), organiserVisible(now));

const fields = {
    eventId: events.eventId,
    name: pub.name,
    description: pub.description,
    startDatetime: pub.startDatetime,
    endDatetime: pub.endDatetime,
    ticketUrl: pub.ticketUrl,
    imageUrl: pub.imageUrl,
    status: pub.status,
    category: { slug: categories.slug, name: categories.name },
    location: {
        name: locations.locationName,
        address: locations.address,
        area: locations.area,
        latitude: locations.latitude,
        longitude: locations.longitude,
    },
    organiser: { userId: users.userId, username: users.username },
};

function fromPublicEvents() {
    return db
        .select(fields)
        .from(events)
        .innerJoin(categories, eq(categories.categoryId, pub.categoryId))
        .innerJoin(locations, eq(locations.locationId, pub.locationId))
        .innerJoin(users, eq(users.userId, events.organiserId))
        .$dynamic();
}

// Upcoming live events matching Explore's filters, soonest first, one page of them
export async function listPublicEvents({ q, category, location, when, date, page, limit }, now = new Date()) {
    const conditions = [isListed(now)];

    if (q) {
        conditions.push(containsText(sql`concat_ws(' ', ${pub.name}, ${categories.name}, ${locations.locationName}, ${locations.address})`, q));
    }
    if (category?.length) conditions.push(inArray(categories.slug, category));
    if (location) conditions.push(eq(locations.area, location));
    for (const [from, to] of [when && whenRange(when, now), date && dayRange(date)].filter(Boolean)) {
        if (from) conditions.push(gte(pub.startDatetime, from));
        conditions.push(lt(pub.startDatetime, to));
    }

    const where = and(...conditions);
    const [rows, [{ total }]] = await db.batch([
        fromPublicEvents()
            .where(where)
            .orderBy(asc(pub.startDatetime), asc(events.eventId))
            .limit(limit)
            .offset((page - 1) * limit),
        db
            .select({ total: count() })
            .from(events)
            .innerJoin(categories, eq(categories.categoryId, pub.categoryId))
            .innerJoin(locations, eq(locations.locationId, pub.locationId))
            .innerJoin(users, eq(users.userId, events.organiserId))
            .where(where),
    ]);

    return {
        data: rows,
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
}

// How many upcoming live events there are in all, in each `when` range and in
// each area: Home's What's on and area tiles, About's figure
export async function summarisePublicEvents(now = new Date()) {
    const live = isListed(now);
    const inRange = (when) => {
        const [from, to] = whenRange(when, now);
        return from ? and(gte(pub.startDatetime, from), lt(pub.startDatetime, to)) : lt(pub.startDatetime, to);
    };
    const countWhere = (condition) => sql`count(*) filter (where ${condition})`.mapWith(Number);

    const [[totals], areaRows] = await db.batch([
        db
            .select({
                total: count(),
                tonight: countWhere(inRange('tonight')),
                weekend: countWhere(inRange('weekend')),
                week: countWhere(inRange('week')),
            })
            .from(events)
            .innerJoin(users, eq(users.userId, events.organiserId))
            .where(live),
        db
            .select({ area: locations.area, total: count() })
            .from(events)
            .innerJoin(users, eq(users.userId, events.organiserId))
            .innerJoin(locations, eq(locations.locationId, pub.locationId))
            .where(and(live, isNotNull(locations.area)))
            .groupBy(locations.area),
    ]);

    const { total, ...when } = totals;
    return { total, when, areas: Object.fromEntries(areaRows.map(({ area, total: n }) => [area, n])) };
}

// One event by link: anything that has been public, otherwise null (not found).
// `listed` says whether it can be saved, without saying why not
export async function findPublicEvent(eventId, now = new Date()) {
    const [event] = await db
        .select({ ...fields, listed: sql`${isListed(now)}`.mapWith(Boolean) })
        .from(events)
        .innerJoin(categories, eq(categories.categoryId, pub.categoryId))
        .innerJoin(locations, eq(locations.locationId, pub.locationId))
        .innerJoin(users, eq(users.userId, events.organiserId))
        .where(and(eq(events.eventId, eventId), isPublic));
    return event ?? null;
}

// A user's saved events, past and cancelled ones too (My Favourites greys them),
// each as the public sees it, soonest first
export function listFavouriteEvents(userId, now = new Date()) {
    return db
        .select({ ...fields, listed: sql`${isListed(now)}`.mapWith(Boolean), savedAt: favourites.createdAt })
        .from(favourites)
        .innerJoin(events, eq(events.eventId, favourites.eventId))
        .innerJoin(categories, eq(categories.categoryId, pub.categoryId))
        .innerJoin(locations, eq(locations.locationId, pub.locationId))
        .innerJoin(users, eq(users.userId, events.organiserId))
        .where(and(eq(favourites.userId, userId), isPublic))
        .orderBy(asc(pub.startDatetime), asc(events.eventId));
}

// Whether an event can be saved now; null when there's no public event by that id
export async function canSaveEvent(eventId, now = new Date()) {
    const [event] = await db
        .select({ listed: sql`${isListed(now)}`.mapWith(Boolean) })
        .from(events)
        .innerJoin(users, eq(users.userId, events.organiserId))
        .where(and(eq(events.eventId, eventId), isPublic));
    return event ? event.listed : null;
}

// Active categories A to Z, each with how many upcoming live events it has
export async function listCategories(now = new Date()) {
    const upcoming = db
        // Drizzle names a subquery's columns without the table, so not 'category_id'
        .select({ categoryId: sql`${pub.categoryId}`.as('upcoming_category_id'), total: count().as('total') })
        .from(events)
        .innerJoin(users, eq(users.userId, events.organiserId))
        .where(isListed(now))
        // By position: written out again, the expression gets its own parameters
        // and Postgres can't tell it's the one selected
        .groupBy(sql`1`)
        .as('upcoming');

    return db
        .select({
            slug: categories.slug,
            name: categories.name,
            description: categories.description,
            upcomingEvents: sql`coalesce(${upcoming.total}, 0)`.mapWith(Number),
        })
        .from(categories)
        .leftJoin(upcoming, eq(upcoming.categoryId, categories.categoryId))
        .where(eq(categories.isActive, true))
        // The database compares bytes, which puts every lowercase name after Z
        .orderBy(asc(sql`lower(${categories.name})`));
}
