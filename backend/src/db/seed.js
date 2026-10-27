import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { eq, inArray } from 'drizzle-orm';
import { db } from './index.js';
import { categories, events, locations, users } from './schema/index.js';
import { demoEvents, demoLocations } from './demoData.js';
import { daysToFriday, londonDay } from '../lib/londonTime.js';

// Same names, descriptions and order as the PHP project's insert data. Slugs match the
// category ids in frontend/src/data/eventsData.js (eventCategories)
const seedCategories = [
    { slug: 'music', name: 'Music', description: 'Live concerts, open mics, gigs, DJ sets and music festivals' },
    { slug: 'theatre-performance', name: 'Theatre & Performance', description: 'Plays, stand-up comedy, and live shows' },
    { slug: 'art-exhibitions', name: 'Art & Exhibitions', description: 'Gallery openings, artist talks, installations' },
    { slug: 'film-screenings', name: 'Film & Screenings', description: 'Film festivals, independent cinema, outdoor screenings' },
    { slug: 'food-drink', name: 'Food & Drink', description: 'Tastings, food and drink festivals, and food markets' },
    { slug: 'workshops-classes', name: 'Workshops & Classes', description: 'Skill-building workshops and classes' },
    { slug: 'tech-innovation', name: 'Tech & Innovation', description: 'Hackathons, product launches, and meetups' },
    { slug: 'community-culture', name: 'Community & Culture', description: 'Local gatherings and cultural celebrations' },
    { slug: 'health-wellness', name: 'Health & Wellness', description: 'Fitness, mindfulness, and wellbeing events' },
    { slug: 'markets-fairs', name: 'Markets & Fairs', description: 'Craft fairs, vintage sales, and makers markets' },
    { slug: 'literature-talks', name: 'Literature & Talks', description: 'Readings, book launches, and panel discussions' },
    { slug: 'festivals', name: 'Festivals', description: 'Large-scale festivals across any theme' },
    { slug: 'charity-causes', name: 'Charity & Causes', description: 'Fundraisers and community impact events' },
    { slug: 'nightlife', name: 'Nightlife', description: 'Nightclubs, bars, and late-night events' },
    { slug: 'family-kids', name: 'Family & Kids', description: 'Events suitable for children and families' },
    { slug: 'student-life', name: 'Student Life', description: 'University and student-led events' },
    { slug: 'lgbtq', name: 'LGBTQ+', description: 'Inclusive and queer-centred events' },
    { slug: 'history-heritage', name: 'History & Heritage', description: 'Tours and events focused on local history' },
    {
        slug: 'sports',
        name: 'Sports',
        description: 'Athletic competitions, games, matches, tournaments, training sessions, and sports meetups',
    },
];

const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_USERNAME } = process.env;

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_ADMIN_USERNAME) {
    throw new Error('SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD and SEED_ADMIN_USERNAME must be set in .env');
}

// Safe to run again: rows that already exist (same slug or email) are skipped
const addedCategories = await db
    .insert(categories)
    .values(seedCategories)
    .onConflictDoNothing({ target: categories.slug })
    .returning({ slug: categories.slug });

// Admins can't sign up, so the first one comes from here
const addedAdmins = await db
    .insert(users)
    .values({
        username: SEED_ADMIN_USERNAME,
        email: SEED_ADMIN_EMAIL.toLowerCase(),
        password: await bcrypt.hash(SEED_ADMIN_PASSWORD, 12),
        role: 'admin',
        emailVerifiedAt: new Date(),
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ email: users.email });

// One verified account per other role, for trying each dashboard by logging in
// as it. Optional: skipped until SEED_USER_EMAIL, SEED_ORGANISER_EMAIL and
// SEED_DEMO_PASSWORD are set
const { SEED_USER_EMAIL, SEED_ORGANISER_EMAIL, SEED_DEMO_PASSWORD } = process.env;
const seedDemos = Boolean(SEED_USER_EMAIL && SEED_ORGANISER_EMAIL && SEED_DEMO_PASSWORD);
let addedDemos = [];

if (seedDemos) {
    const password = await bcrypt.hash(SEED_DEMO_PASSWORD, 12);
    addedDemos = await db
        .insert(users)
        .values([
            { username: 'Demo User', email: SEED_USER_EMAIL.toLowerCase(), password, role: 'user', emailVerifiedAt: new Date() },
            { username: 'Demo Organiser', email: SEED_ORGANISER_EMAIL.toLowerCase(), password, role: 'organiser', emailVerifiedAt: new Date() },
        ])
        .onConflictDoNothing({ target: users.email })
        .returning({ email: users.email });
}

// The mock events' other organisers. Nobody logs in as them: the password is random
// and thrown away. mcrgigs is suspended, as in the mock users, so its events are hidden
const extraOrganisers = ['mcrgigs', 'northernfood', 'quaysevents', 'salfordarts', 'leoevents'];
const resetEvents = process.argv.includes('--reset-events');
let addedEvents = [];
let deletedEvents = [];

if (seedDemos) {
    const unusable = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
    await db
        .insert(users)
        .values(extraOrganisers.map((username) => ({
            username,
            email: `${username}@example.test`,
            password: unusable,
            role: 'organiser',
            emailVerifiedAt: new Date(),
            ...(username === 'mcrgigs' && {
                accStatus: 'suspended',
                suspensionReason: 'Ticket links sent people to a different event.',
            }),
        })))
        .onConflictDoNothing({ target: users.email });

    const organiserRows = await db
        .select({ userId: users.userId, email: users.email })
        .from(users)
        .where(inArray(users.email, [
            SEED_ORGANISER_EMAIL.toLowerCase(),
            ...extraOrganisers.map((username) => `${username}@example.test`),
        ]));
    const organiserIds = Object.fromEntries(organiserRows.map(({ userId, email }) => [
        email === SEED_ORGANISER_EMAIL.toLowerCase() ? 'organiserName' : email.split('@')[0],
        userId,
    ]));

    // Dates go stale, so --reset-events swaps the demo organisers' events for fresh ones.
    // Their favourites and notifications go with them (CASCADE)
    if (resetEvents) {
        deletedEvents = await db
            .delete(events)
            .where(inArray(events.organiserId, Object.values(organiserIds)))
            .returning({ eventId: events.eventId });
    }

    await db.insert(locations).values(demoLocations).onConflictDoNothing({ target: locations.placeId });
    const locationRows = await db
        .select({ locationId: locations.locationId, address: locations.address })
        .from(locations)
        .where(inArray(locations.placeId, demoLocations.map((location) => location.placeId)));
    const locationIds = Object.fromEntries(locationRows.map(({ locationId, address }) => [address, locationId]));

    const categoryRows = await db.select({ categoryId: categories.categoryId, slug: categories.slug }).from(categories);
    const categoryIds = Object.fromEntries(categoryRows.map(({ categoryId, slug }) => [slug, categoryId]));

    const [admin] = await db
        .select({ userId: users.userId })
        .from(users)
        .where(eq(users.email, SEED_ADMIN_EMAIL.toLowerCase()));

    // Only when the demo organisers have no events yet, so running the seed again
    // doesn't add a second copy
    const existing = await db
        .select({ eventId: events.eventId })
        .from(events)
        .where(inArray(events.organiserId, Object.values(organiserIds)))
        .limit(1);

    if (!existing.length) {
        addedEvents = await db
            .insert(events)
            .values(demoEvents.map((event) => demoEventRow(event, { organiserIds, locationIds, categoryIds, adminId: admin.userId })))
            .returning({ eventId: events.eventId });
    }
}

console.log(`Categories added: ${addedCategories.length} of ${seedCategories.length}`);
console.log(`Admin added: ${addedAdmins.length ? addedAdmins[0].email : 'no (already exists)'}`);
console.log(seedDemos
    ? `Demo accounts added: ${addedDemos.length ? addedDemos.map((u) => u.email).join(', ') : 'none (already exist)'}`
    : 'Demo accounts skipped: SEED_USER_EMAIL, SEED_ORGANISER_EMAIL and SEED_DEMO_PASSWORD are not all set');
if (seedDemos) {
    if (resetEvents) console.log(`Demo events deleted: ${deletedEvents.length}`);
    console.log(addedEvents.length
        ? `Demo events added: ${addedEvents.length}, dated from today`
        : 'Demo events: none added (they already exist; --reset-events replaces them)');
}

// A demo event as an events row: names looked up as ids, dates from today in
// Europe/London, and the approved version (if any) as approved_snapshot
function demoEventRow(event, { organiserIds, locationIds, categoryIds, adminId }) {
    const fields = (version) => ({
        eventName: version.name,
        eventDescription: version.description,
        startDatetime: londonDate(version.start),
        endDatetime: londonDate(version.end),
        locationId: locationIds[version.address],
        categoryId: categoryIds[version.category],
        ticketUrl: version.ticketUrl,
        imageUrl: version.image && `/images/events/${version.image}`,
    });
    const row = fields(event);

    return {
        ...row,
        organiserId: organiserIds[event.organiser],
        status: event.status,
        rejectionReason: event.rejectionReason ?? null,
        // The same keys as the row, dates as ISO strings (what jsonb stores)
        approvedSnapshot: event.approved
            ? JSON.parse(JSON.stringify(fields({ ...event, ...event.approved })))
            : null,
        createdAt: londonDate(event.createdAt),
        organiserUpdatedAt: londonDate(event.organiserUpdatedAt),
        adminUpdatedAt: londonDate(event.adminUpdatedAt),
        adminUpdatedBy: event.adminUpdatedAt ? adminId : null,
    };
}

// { days, time } or { weekend, time } as the moment it names in Manchester, the
// same rules as the frontend mock's daysFromToday() and thisWeekend()
function londonDate(when) {
    if (!when) return null;
    const now = new Date();
    const days = when.weekend
        ? daysToFriday(now) + { friday: 0, saturday: 1, sunday: 2 }[when.weekend]
        : when.days;
    const [hours, minutes] = when.time.split(':').map(Number);
    return londonDay(now, days, hours, minutes);
}
