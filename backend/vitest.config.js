import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.js'],
        setupFiles: ['tests/setup.js'],
        // The Neon test branch sometimes answers slowly: a full run once
        // failed "Test timed out in 5000ms" on a list that passed alone in
        // well under that (2026-11-05). 15 s keeps a hung test visible
        testTimeout: 15000,
        hookTimeout: 15000,
    },
});
