import { AppError } from '../lib/errors.js';
import { SESSION_COOKIE, findSession, renewSessionIfDue, clearSessionCookie } from '../lib/sessions.js';
import { liftExpiredSuspension } from '../lib/users.js';

// Loads the signed-in user from the session cookie onto req.user. A suspended
// account gets through, since it can still read with a banner; routes that
// change something add requireActive after this
export async function requireAuth(req, res, next) {
    const token = req.cookies[SESSION_COOKIE];
    const found = await findSession(token);
    if (!found) {
        // An expired or unknown cookie is removed, so the browser stops sending it
        if (token) clearSessionCookie(res);
        throw new AppError(401, 'Please log in to continue');
    }
    await renewSessionIfDue(res, token, found.session);
    req.user = await liftExpiredSuspension(found.user);
    next();
}

// Checked on the server for every request: hiding a link in the frontend protects nothing
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) throw new AppError(403, "You don't have access to this");
        next();
    };
}

export function requireActive(req, res, next) {
    if (req.user.accStatus === 'suspended') throw new AppError(403, 'Your account is suspended');
    next();
}
