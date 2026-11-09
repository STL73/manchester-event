import cron from 'node-cron';

import { cleanUp, sendNotificationEmails, sendReminders } from './jobs.js';

// When the jobs run, on London clocks. Each catches up on whatever is due, so a
// missed run only delays things
const jobs = [
    { name: 'notification-emails', expression: '*/5 * * * *', run: sendNotificationEmails },
    { name: 'event-reminders', expression: '*/15 * * * *', run: sendReminders },
    { name: 'clean-up', expression: '30 3 * * *', run: cleanUp },
];

// A job that fails is logged and tried again at its next time; it never
// takes the server down
export async function runJob({ name, run }) {
    try {
        const result = await run(new Date());
        if (Object.values(result).some((value) => value)) console.info(`Job ${name}:`, result);
        return result;
    } catch (err) {
        console.error(`Job ${name} failed:`, err);
        return null;
    }
}

// Starts every job on its schedule, skipping a run while the last is still going
export function startScheduledJobs() {
    for (const job of jobs) {
        cron.schedule(job.expression, () => runJob(job), { name: job.name, timezone: 'Europe/London', noOverlap: true });
    }
}

export { jobs };
