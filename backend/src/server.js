import express from 'express';

import { PORT } from './config/env.js';

import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import eventRouter from './routes/event.routes.js';

const app = express();

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/events', eventRouter);

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`Hello, welcome to the Manchester Event API`)
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
})