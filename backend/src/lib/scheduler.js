import cron from 'node-cron';

import { cleanUp, sendNotificationEmails, sendReminders } from './jobs.js';

// When the jobs run (Phase 11): node-cron inside the API (Slav, 2026-11-05),
// on London clocks. The jobs catch up on whatever is due, so a missed run
// only delays things. Reminders every 15 minutes reach people soon after
// 09:00, and the email job picks them up within 5 minutes. noOverlap skips a
// run while the last one is still going
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

export function startScheduledJobs() {
    for (const job of jobs) {
        cron.schedule(job.expression, () => runJob(job), { name: job.name, timezone: 'Europe/London', noOverlap: true });
    }
}

export { jobs };
