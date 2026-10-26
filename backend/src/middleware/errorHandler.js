import { AppError } from '../lib/errors.js';

export function notFound(req, res, next) {
    next(new AppError(404, `Not found: ${req.method} ${req.originalUrl}`));
}

// Express 5 sends errors thrown in async routes here too, so routes don't need
// their own try/catch. Every error leaves in one shape: { error: { message, details } }
// eslint-disable-next-line no-unused-vars -- Express spots an error handler by its four parameters
export function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: { message: err.message, ...(err.details && { details: err.details }) },
        });
    }

    // express.json()'s own errors (bad JSON, body too large) are safe to show
    if (err.expose && err.status < 500) {
        return res.status(err.status).json({ error: { message: err.message } });
    }

    // Anything unexpected: the details stay in the server log, never in the response
    console.error(err);
    res.status(500).json({ error: { message: 'Something went wrong' } });
}
