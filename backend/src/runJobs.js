import { jobs, runJob } from './lib/scheduler.js';

// npm run jobs: every scheduled job once, now, in the order the day needs
// (reminders written before the email job sends them), then exit. For trying
// them by hand, or for a host's own scheduler if Phase 12 prefers one
const order = ['event-reminders', 'notification-emails', 'clean-up'];

let failed = false;
for (const name of order) {
    const result = await runJob(jobs.find((job) => job.name === name));
    if (result === null) failed = true;
    else console.info(`${name}:`, result);
}
process.exit(failed ? 1 : 0);
