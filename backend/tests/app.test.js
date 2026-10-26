import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';

import app from '../src/app.js';
import { AppError } from '../src/lib/errors.js';
import { validate } from '../src/middleware/validate.js';
import { notFound, errorHandler } from '../src/middleware/errorHandler.js';

// A small app with the real middleware and routes made to fail on purpose
function makeTestApp() {
    const testApp = express();
    testApp.use(express.json());

    testApp.post(
        '/items/:id',
        validate({
            params: z.object({ id: z.coerce.number().int().positive() }),
            body: z.object({ name: z.string().trim().min(1) }),
        }),
        (req, res) => res.json({ data: req.valid }),
    );
    testApp.get('/known-error', () => {
        throw new AppError(409, 'Email already in use');
    });
    testApp.get('/crash', async () => {
        throw new Error('database password is hunter2');
    });

    testApp.use(notFound);
    testApp.use(errorHandler);
    return testApp;
}

describe('app', () => {
    it('answers the root route', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
    });

    it('sets security headers', async () => {
        const res = await request(app).get('/');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('answers an unknown address with 404 in the error shape', async () => {
        const res = await request(app).get('/api/v1/nothing-here');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: { message: 'Not found: GET /api/v1/nothing-here' } });
    });

    it('answers malformed JSON with 400 in the error shape', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .set('Content-Type', 'application/json')
            .send('{"email":');
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBeTypeOf('string');
    });
});

describe('validate', () => {
    const testApp = makeTestApp();

    it('passes cleaned values on and drops fields the schema does not list', async () => {
        const res = await request(testApp)
            .post('/items/7')
            .send({ name: '  Gig  ', status: 'approved' });
        expect(res.status).toBe(200);
        expect(res.body.data).toEqual({ params: { id: 7 }, body: { name: 'Gig' } });
    });

    it('answers bad input with 400 and a detail per problem', async () => {
        const res = await request(testApp).post('/items/abc').send({ name: '' });
        expect(res.status).toBe(400);
        expect(res.body.error.message).toBe('Invalid input');
        expect(res.body.error.details.map((d) => d.path)).toEqual(['params.id', 'body.name']);
    });
});

describe('errorHandler', () => {
    const testApp = makeTestApp();

    it('sends an AppError status and message as they are', async () => {
        const res = await request(testApp).get('/known-error');
        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: { message: 'Email already in use' } });
    });

    it('hides the details of an unexpected error', async () => {
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        const res = await request(testApp).get('/crash');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: { message: 'Something went wrong' } });
        expect(JSON.stringify(res.body)).not.toContain('hunter2');
        expect(log).toHaveBeenCalled();
        log.mockRestore();
    });
});
