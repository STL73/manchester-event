import 'dotenv/config';

export const {
    PORT,
    NODE_ENV,
    ARCJET_KEY,
    EMAIL_USER,
    EMAIL_APP_PASSWORD,
    EMAIL_FROM_NAME = 'Manchester Event Portal',
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} = process.env;

// Photos have nowhere to go without them. Tests replace lib/images.js
if (NODE_ENV !== 'test' && !(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)) {
    throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must all be defined');
}

if (NODE_ENV === 'production' && !process.env.APP_URL) {
    throw new Error('APP_URL is not defined: links in emails would point nowhere');
}

// The frontend's address, for the links in emails. Locally that's Vite's dev server
export const APP_URL = process.env.APP_URL ?? 'http://localhost:5173';
