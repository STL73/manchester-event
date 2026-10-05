import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DB_URL) {
    throw new Error('DB_URL is not defined in the environment variables');
}

export default defineConfig({
    schema: './src/db/schema/index.js',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DB_URL,
    },
});
