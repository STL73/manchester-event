import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { securityMiddleware } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import eventRouter from './routes/event.routes.js';

// The app without app.listen(), so tests can send it requests without a port
const app = express();

app.use(helmet());
// Before the body is parsed: a blocked request costs as little as possible
app.use(securityMiddleware);
app.use(express.json());
// Fills req.cookies, where requireAuth finds the session cookie
app.use(cookieParser());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/events', eventRouter);

app.get('/', (req, res) => {
    res.send('Hello, welcome to the Manchester Event API');
});

// Both last: notFound catches every address no router answered, and
// errorHandler catches everything thrown above it
app.use(notFound);
app.use(errorHandler);

export default app;
