import app from './app.js';
import { PORT } from './config/env.js';
import { startScheduledJobs } from './lib/scheduler.js';

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// Here, not in app.js, so tests (which import app) never start them
startScheduledJobs();
