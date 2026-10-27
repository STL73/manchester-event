import { aj } from '../config/arcjet.js';
import { AppError } from '../lib/errors.js';

// Runs an Arcjet client against the request. securityMiddleware uses the base
// client on every request; a route passes its stricter one from aj.withRule().
// `props` adds what a rule needs: the email for sign-up, the user for a per-user limit
export function arcjetProtect(client, props = () => ({})) {
    return async (req, res, next) => {
        if (!client) return next();

        const decision = await client.protect(req, props(req));

        // If Arcjet itself can't be reached, let the request through: an outage of a
        // protection service shouldn't take the whole site down with it
        if (decision.isErrored()) {
            console.warn('Arcjet error:', decision.reason.message);
            return next();
        }

        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) throw new AppError(429, 'Too many requests, please try again later');
            if (decision.reason.isBot()) throw new AppError(403, 'Automated requests are not allowed');
            // Disposable, invalid, or a domain that can't receive email. Shown under the field
            if (decision.reason.isEmail()) {
                const message = "This email address can't be used. Please use another one.";
                throw new AppError(400, message, [{ path: 'body.email', message }]);
            }
            throw new AppError(403, 'Request blocked');
        }

        next();
    };
}

export const securityMiddleware = arcjetProtect(aj);
