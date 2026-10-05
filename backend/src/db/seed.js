import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './index.js';
import { categories, users } from './schema/index.js';

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

console.log(`Categories added: ${addedCategories.length} of ${seedCategories.length}`);
console.log(`Admin added: ${addedAdmins.length ? addedAdmins[0].email : 'no (already exists)'}`);
