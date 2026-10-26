import dotenv from 'dotenv';

// Runs before any test file imports the app. Tests use the Neon `test` branch,
// never the development database: DB_URL is pointed at TEST_DB_URL before
// db/index.js reads it, and dotenv never overwrites a variable that's already set
dotenv.config({ quiet: true });

if (!process.env.TEST_DB_URL) {
    throw new Error('TEST_DB_URL is not defined: tests refuse to run against the development database');
}

process.env.DB_URL = process.env.TEST_DB_URL;
process.env.NODE_ENV = 'test';
