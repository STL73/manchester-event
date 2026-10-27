import 'dotenv/config';

export const {
    PORT,
    NODE_ENV,
    DB_URL,
    ARCJET_KEY,
    EMAIL_USER,
    EMAIL_APP_PASSWORD,
    EMAIL_FROM_NAME = 'Manchester Event Portal',
} = process.env;

if (NODE_ENV === 'production' && !process.env.APP_URL) {
    throw new Error('APP_URL is not defined: links in emails would point nowhere');
}

// The frontend's address, for the links in emails. Locally that's Vite's dev server
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
