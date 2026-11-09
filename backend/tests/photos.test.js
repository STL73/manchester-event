import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { and, eq, inArray, like } from 'drizzle-orm';

import app from '../src/app.js';
import { db } from '../src/db/index.js';
import { users, events, categories, locations, systemLogs } from '../src/db/schema/index.js';
import { AppError } from '../src/lib/errors.js';
import { deleteImage, uploadImage } from '../src/lib/images.js';
import { withUpload } from '../src/lib/uploads.js';
import { testAgent } from './helpers.js';

// Cloudinary is never called: every upload gets the next made-up id here
vi.mock('../src/lib/images.js', () => ({ uploadImage: vi.fn(), deleteImage: vi.fn() }));

// Every row made here starts with this, so afterAll can remove them all
const PREFIX = 'photos-test-';
const PASSWORD = 'correct-horse-battery';
const PLACE = 'N999999000101';
const DAY = 24 * 60 * 60 * 1000;
const inDays = (days) => new Date(Date.now() + days * DAY);
const londonInput = (date) =>
    new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/London', dateStyle: 'short', timeStyle: 'short' })
        .format(date)
        .replace(' ', 'T');

const PHOTO = Buffer.from('a photo');
const ids = {};
const agents = {};
let uploads = 0;

beforeAll(async () => {
    const [category] = await db.insert(categories).values({ slug: `${PREFIX}music`, name: `${PREFIX}Music` }).returning();
    ids.category = category.categoryId;
    const [venue] = await db
        .insert(locations)
        .values({ placeId: PLACE, locationName: `${PREFIX}Hall`, address: '1 Test Street', latitude: 53.48, longitude: -2.24, area: 'city-centre' })
        .returning();
    ids.venue = venue.locationId;

    const password = await bcrypt.hash(PASSWORD, 4);
    const account = (name, role, extra = {}) => ({
        username: `${PREFIX}${name}`,
        email: `${PREFIX}${name}@example.test`,
        password,
        role,
        emailVerifiedAt: new Date(),
        ...extra,
    });
    const created = await db
        .insert(users)
        .values([
            account('organiser', 'organiser'),
            account('other', 'organiser'),
            account('leaving', 'organiser'),
            account('user', 'user'),
            account('suspended', 'user', { accStatus: 'suspended' }),
        ])
        .returning();
    for (const user of created) ids[user.username.slice(PREFIX.length)] = user.userId;

    for (const name of ['organiser', 'other', 'leaving', 'user', 'suspended']) {
        const agent = testAgent();
        const res = await agent.post('/api/v1/auth/login').send({ email: `${PREFIX}${name}@example.test`, password: PASSWORD });
        expect(res.status, name).toBe(200);
        agents[name] = agent;
    }
});

afterAll(async () => {
    const testUsers = db.select({ userId: users.userId }).from(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(systemLogs).where(inArray(systemLogs.userId, testUsers));
    await db.delete(events).where(inArray(events.organiserId, testUsers));
    await db.delete(users).where(like(users.email, `${PREFIX}%`));
    await db.delete(locations).where(eq(locations.placeId, PLACE));
    await db.delete(categories).where(like(categories.slug, `${PREFIX}%`));
});

beforeEach(() => {
    vi.mocked(uploadImage).mockReset().mockImplementation(async () => {
        uploads += 1;
        return { url: `https://res.example.test/photo-${uploads}`, publicId: `${PREFIX}photo-${uploads}` };
    });
    vi.mocked(deleteImage).mockReset();
});

const form = (changes = {}) => ({
    eventName: `${PREFIX}Gig`,
    category: `${PREFIX}music`,
    description: 'A test event.',
    startDatetime: londonInput(inDays(10)),
    endDatetime: null,
    placeId: PLACE,
    ticketUrl: 'https://example.test/tickets',
    ...changes,
});

// The form as the browser sends it with a photo: multipart, the fields as JSON in `data`
function withPhoto(req, body, { field = 'image', file = PHOTO, type = 'image/png' } = {}) {
    return req.field('data', JSON.stringify(body)).attach(field, file, { filename: 'photo.png', contentType: type });
}

async function insertEvent(changes = {}) {
    const [row] = await db
        .insert(events)
        .values({
            organiserId: ids.organiser,
            eventName: `${PREFIX}Row`,
            eventDescription: 'A test event.',
            startDatetime: inDays(10),
            locationId: ids.venue,
            categoryId: ids.category,
            ticketUrl: 'https://example.test/tickets',
            status: 'draft',
            ...changes,
        })
        .returning();
    return row;
}

const readRow = async (eventId) => (await db.select().from(events).where(eq(events.eventId, eventId)))[0];
const readUser = async (userId) => (await db.select().from(users).where(eq(users.userId, userId)))[0];
const deleted = () => vi.mocked(deleteImage).mock.calls.map(([publicId]) => publicId).filter(Boolean);

describe('the photo on Create and Edit Event', () => {
    it('uploads a photo sent with Create and stores its address and id', async () => {
        const res = await withPhoto(agents.organiser.post('/api/v1/events'), form());

        expect(res.status).toBe(201);
        expect(uploadImage).toHaveBeenCalledWith(PHOTO, 'image');
        const { url, publicId } = await vi.mocked(uploadImage).mock.results[0].value;
        expect(res.body.data.imageUrl).toBe(url);
        expect((await readRow(res.body.data.eventId)).imagePublicId).toBe(publicId);
    });

    it('still takes the form as JSON, with no photo', async () => {
        const res = await agents.organiser.post('/api/v1/events').send(form());
        expect(res.status).toBe(201);
        expect(res.body.data.imageUrl).toBeNull();
        expect(uploadImage).not.toHaveBeenCalled();
    });

    it('refuses a file that isn\'t one of the four image types, under the field', async () => {
        const res = await withPhoto(agents.organiser.post('/api/v1/events'), form(), { type: 'application/pdf' });
        expect(res.status).toBe(400);
        expect(res.body.error.details).toEqual([{ path: 'body.image', message: 'Choose a JPG, PNG, WebP or GIF.' }]);
        expect(uploadImage).not.toHaveBeenCalled();
    });

    it('refuses a photo over 5 MB, under the field', async () => {
        const res = await withPhoto(agents.organiser.post('/api/v1/events'), form(), { file: Buffer.alloc(5 * 1024 * 1024 + 1) });
        expect(res.status).toBe(400);
        expect(res.body.error.details).toEqual([{ path: 'body.image', message: 'That photo is over 5 MB.' }]);
        expect(uploadImage).not.toHaveBeenCalled();
    });

    it('refuses a form it can\'t read', async () => {
        const res = await agents.organiser
            .post('/api/v1/events')
            .field('data', '{not json')
            .attach('image', PHOTO, { filename: 'photo.png', contentType: 'image/png' });
        expect(res.status).toBe(400);
        expect(uploadImage).not.toHaveBeenCalled();
    });

    it('uploads nothing for a save that fails its checks', async () => {
        const theirs = await insertEvent({ organiserId: ids.other });
        const notMine = await withPhoto(agents.organiser.put(`/api/v1/events/${theirs.eventId}`), form());
        expect(notMine.status).toBe(404);

        const passed = await withPhoto(agents.organiser.post('/api/v1/events'), form({ startDatetime: londonInput(inDays(-1)), submit: true }));
        expect(passed.status).toBe(400);

        const badVenue = await withPhoto(agents.organiser.post('/api/v1/events'), form({ placeId: 'not an id' }));
        expect(badVenue.status).toBe(400);

        expect(uploadImage).not.toHaveBeenCalled();
    });

    it('creates nothing when Cloudinary is down', async () => {
        vi.mocked(uploadImage).mockRejectedValue(new AppError(503, 'Photos can\'t be saved right now.'));
        const before = await db.select().from(events).where(eq(events.organiserId, ids.organiser));

        const res = await withPhoto(agents.organiser.post('/api/v1/events'), form());

        expect(res.status).toBe(503);
        expect(await db.select().from(events).where(eq(events.organiserId, ids.organiser))).toHaveLength(before.length);
    });

    it('replaces a draft\'s photo and deletes the old one', async () => {
        const draft = await insertEvent({ imageUrl: 'https://res.example.test/old', imagePublicId: `${PREFIX}old` });

        const res = await withPhoto(agents.organiser.put(`/api/v1/events/${draft.eventId}`), form());

        expect(res.status).toBe(200);
        const row = await readRow(draft.eventId);
        expect(row.imagePublicId).not.toBe(`${PREFIX}old`);
        expect(deleted()).toEqual([`${PREFIX}old`]);
    });

    it('keeps the photo when an edit sends none', async () => {
        const draft = await insertEvent({ imageUrl: 'https://res.example.test/kept', imagePublicId: `${PREFIX}kept` });
        const res = await agents.organiser.put(`/api/v1/events/${draft.eventId}`).send(form());
        expect(res.status).toBe(200);
        expect((await readRow(draft.eventId)).imagePublicId).toBe(`${PREFIX}kept`);
        expect(deleted()).toEqual([]);
    });

    it('goes back to the default photo on removeImage and deletes the old one', async () => {
        const draft = await insertEvent({ imageUrl: 'https://res.example.test/gone', imagePublicId: `${PREFIX}gone` });
        const res = await agents.organiser.put(`/api/v1/events/${draft.eventId}`).send(form({ removeImage: true }));
        expect(res.status).toBe(200);
        expect(res.body.data.imageUrl).toBeNull();
        expect((await readRow(draft.eventId)).imagePublicId).toBeNull();
        expect(deleted()).toEqual([`${PREFIX}gone`]);
    });

    it('never deletes a seed photo: it has no id', async () => {
        const draft = await insertEvent({ imageUrl: '/images/events/seed.jpg' });
        await withPhoto(agents.organiser.put(`/api/v1/events/${draft.eventId}`), form());
        expect(deleted()).toEqual([]);
    });
});

describe('the photo of a live event', () => {
    it('keeps the approved photo public while an edit with a new one waits', async () => {
        const live = await insertEvent({ status: 'approved', imageUrl: 'https://res.example.test/approved', imagePublicId: `${PREFIX}approved` });

        const first = await withPhoto(agents.organiser.put(`/api/v1/events/${live.eventId}`), form());
        expect(first.status).toBe(200);
        let row = await readRow(live.eventId);
        expect(row.approvedSnapshot).toMatchObject({ imageUrl: 'https://res.example.test/approved', imagePublicId: `${PREFIX}approved` });
        expect(deleted()).toEqual([]);

        // The public still sees the approved photo
        const shown = await request(app).get(`/api/v1/events/${live.eventId}`);
        expect(shown.body.data.imageUrl).toBe('https://res.example.test/approved');

        // A second edit replaces the waiting photo, never the approved one
        const waiting = row.imagePublicId;
        await withPhoto(agents.organiser.put(`/api/v1/events/${live.eventId}`), form());
        row = await readRow(live.eventId);
        expect(row.approvedSnapshot.imagePublicId).toBe(`${PREFIX}approved`);
        expect(deleted()).toEqual([waiting]);
    });

    it('drops the waiting edit\'s photo on Cancel and keeps the approved one', async () => {
        const live = await insertEvent({ status: 'approved', imageUrl: 'https://res.example.test/kept-live', imagePublicId: `${PREFIX}kept-live` });
        await withPhoto(agents.organiser.put(`/api/v1/events/${live.eventId}`), form());
        const waiting = (await readRow(live.eventId)).imagePublicId;

        const res = await agents.organiser.put(`/api/v1/events/${live.eventId}/cancel`);

        expect(res.status).toBe(200);
        const row = await readRow(live.eventId);
        expect(row.imagePublicId).toBe(`${PREFIX}kept-live`);
        expect(deleted()).toEqual([waiting]);
    });

    it('deletes the photo with an event that was never public', async () => {
        const draft = await insertEvent({ imageUrl: 'https://res.example.test/draft', imagePublicId: `${PREFIX}draft` });
        const res = await agents.organiser.delete(`/api/v1/events/${draft.eventId}`);
        expect(res.status).toBe(204);
        expect(deleted()).toEqual([`${PREFIX}draft`]);
    });
});

describe('a failed save after the upload', () => {
    it('deletes the photo it uploaded and passes the error on', async () => {
        const failure = new Error('write failed');
        await expect(withUpload({ buffer: PHOTO }, 'image', async () => { throw failure; })).rejects.toBe(failure);
        const { publicId } = await vi.mocked(uploadImage).mock.results[0].value;
        expect(deleted()).toEqual([publicId]);
    });

    it('uploads nothing without a file', async () => {
        const write = vi.fn(async () => 'saved');
        expect(await withUpload(undefined, 'image', write)).toBe('saved');
        expect(write).toHaveBeenCalledWith(null);
        expect(uploadImage).not.toHaveBeenCalled();
    });
});

describe('the profile picture', () => {
    it('stores a new picture, logs it and deletes the one it replaces', async () => {
        const first = await withPhoto(agents.user.put('/api/v1/users/me/avatar'), {}, { field: 'avatar' });
        expect(first.status).toBe(200);
        expect(uploadImage).toHaveBeenCalledWith(PHOTO, 'avatar');
        const firstId = (await readUser(ids.user)).avatarPublicId;
        expect(first.body.data.avatar).toMatch(/^https:\/\/res\.example\.test\//);
        expect(deleted()).toEqual([]);

        await withPhoto(agents.user.put('/api/v1/users/me/avatar'), {}, { field: 'avatar' });
        expect(deleted()).toEqual([firstId]);

        const logs = await db
            .select()
            .from(systemLogs)
            .where(and(eq(systemLogs.userId, ids.user), eq(systemLogs.action, 'Profile Updated')))
            // Oldest first, so .at(-1) is the newest (Postgres has no order otherwise)
            .orderBy(systemLogs.logId);
        expect(logs.at(-1).details).toEqual({ fields: ['avatar'] });
    });

    it('removes the picture and deletes it', async () => {
        await withPhoto(agents.user.put('/api/v1/users/me/avatar'), {}, { field: 'avatar' });
        const current = (await readUser(ids.user)).avatarPublicId;
        vi.mocked(deleteImage).mockReset();

        const res = await agents.user.delete('/api/v1/users/me/avatar');

        expect(res.status).toBe(200);
        expect(res.body.data.avatar).toBeNull();
        expect((await readUser(ids.user)).avatarPublicId).toBeNull();
        expect(deleted()).toEqual([current]);
    });

    it('asks for a picture when none is sent, and refuses the wrong type with its own wording', async () => {
        const none = await agents.user.put('/api/v1/users/me/avatar');
        expect(none.status).toBe(400);
        expect(none.body.error.details).toEqual([{ path: 'body.avatar', message: 'Choose a picture.' }]);

        const pdf = await withPhoto(agents.user.put('/api/v1/users/me/avatar'), {}, { field: 'avatar', type: 'application/pdf' });
        expect(pdf.body.error.details).toEqual([{ path: 'body.avatar', message: 'Choose a JPG, PNG, WebP or GIF image.' }]);

        const wrongField = await withPhoto(agents.user.put('/api/v1/users/me/avatar'), {}, { field: 'image' });
        expect(wrongField.status).toBe(400);
        expect(uploadImage).not.toHaveBeenCalled();
    });

    it('is closed to logged-out and suspended accounts', async () => {
        expect((await withPhoto(request(app).put('/api/v1/users/me/avatar'), {}, { field: 'avatar' })).status).toBe(401);
        expect((await withPhoto(agents.suspended.put('/api/v1/users/me/avatar'), {}, { field: 'avatar' })).status).toBe(403);
        expect((await agents.suspended.delete('/api/v1/users/me/avatar')).status).toBe(403);
        expect(uploadImage).not.toHaveBeenCalled();
    });
});

describe('deleting an account', () => {
    it('deletes its picture and its events\' photos', async () => {
        await withPhoto(agents.leaving.put('/api/v1/users/me/avatar'), {}, { field: 'avatar' });
        const avatar = (await readUser(ids.leaving)).avatarPublicId;
        await insertEvent({ organiserId: ids.leaving, imageUrl: 'https://res.example.test/leaving', imagePublicId: `${PREFIX}leaving` });
        vi.mocked(deleteImage).mockReset();

        const res = await agents.leaving.delete('/api/v1/users/me').send({ password: PASSWORD });

        expect(res.status).toBe(204);
        expect(deleted().sort()).toEqual([avatar, `${PREFIX}leaving`].sort());
    });
});
