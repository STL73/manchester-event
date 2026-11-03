import { AppError } from '../lib/errors.js';
import { SESSION_COOKIE, findSession, renewSessionIfDue, clearSessionCookie } from '../lib/sessions.js';
import { liftExpiredSuspension } from '../lib/users.js';

// Loads the signed-in user from the session cookie onto req.user. A suspended
// account gets through, since it can still read with a banner; routes that
// change something add requireActive after this
export async function requireAuth(req, res, next) {
    if (!(await loadUser(req, res))) throw new AppError(401, 'Please log in to continue');
    next();
}

// For a route guests can use too (the Contact form): req.user when signed in,
// undefined otherwise
export async function optionalAuth(req, res, next) {
    await loadUser(req, res);
    next();
}

async function loadUser(req, res) {
    const token = req.cookies[SESSION_COOKIE];
    const found = await findSession(token);
    if (!found) {
        // An expired or unknown cookie is removed, so the browser stops sending it
        if (token) clearSessionCookie(res);
        return null;
    }
    await renewSessionIfDue(res, token, found.session);
    req.user = await liftExpiredSuspension(found.user);
    return req.user;
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
