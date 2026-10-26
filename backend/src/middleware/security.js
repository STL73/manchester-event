import { aj } from '../config/arcjet.js';
import { AppError } from '../lib/errors.js';

export async function securityMiddleware(req, res, next) {
    if (!aj) return next();

    const decision = await aj.protect(req);

    // If Arcjet itself can't be reached, let the request through: an outage of a
    // protection service shouldn't take the whole site down with it
    if (decision.isErrored()) {
        console.warn('Arcjet error:', decision.reason.message);
        return next();
    }

    if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) throw new AppError(429, 'Too many requests, please try again later');
        if (decision.reason.isBot()) throw new AppError(403, 'Automated requests are not allowed');
        throw new AppError(403, 'Request blocked');
    }

    next();
}
