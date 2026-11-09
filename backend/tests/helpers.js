import { Agent } from 'node:http';
import request from 'supertest';

import app from '../src/app.js';

// Supertest closes the connection after every request by default, and on
// Windows an answer over 64 KB on a closing local connection sometimes stalls
// until it is reset about 19 s later (the admin's events list, 2026-11-09).
// One keep-alive connection per agent avoids it
const keepAlive = new Agent({ keepAlive: true });

// A Supertest agent: keeps its cookies, like a browser, and its connection
export function testAgent() {
    return request.agent(app).use((req) => req.agent(keepAlive));
}
