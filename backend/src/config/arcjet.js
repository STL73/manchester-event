import arcjet, { shield, detectBot } from '@arcjet/node';
import { ARCJET_KEY, NODE_ENV } from './env.js';

if (!ARCJET_KEY && NODE_ENV !== 'test') {
    throw new Error('ARCJET_KEY is not defined in the environment variables');
}

// The one Arcjet client, made at start-up; null in tests, which run offline.
// Routes add stricter rules with aj.withRule() at module level, never per request
export const aj = NODE_ENV === 'test' ? null : arcjet({
    key: ARCJET_KEY,
    rules: [
        // Common attacks in the request: SQL injection and the rest of the OWASP Top 10
        shield({ mode: 'LIVE' }),
        // Automated clients, except search engines and link previews (a shared event link)
        detectBot({ mode: 'LIVE', allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'] }),
    ],
});
