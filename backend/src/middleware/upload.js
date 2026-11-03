import multer from 'multer';
import { slidingWindow } from '@arcjet/node';

import { aj } from '../config/arcjet.js';
import { AppError } from '../lib/errors.js';
import { arcjetProtect } from './security.js';

// A form that sends a photo comes as multipart/form-data: the file under its
// field's name and the rest of the form as JSON in a `data` field, so the Zod
// schemas read the same booleans and nulls as from a JSON request. Requests
// without a photo stay plain JSON and pass straight through

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// The frontend's own wording (createEventsData.js, profileSettingsData.js), so
// the server's refusal reads like the browser's check
const MESSAGES = {
    image: { type: 'Choose a JPG, PNG, WebP or GIF.', size: 'That photo is over 5 MB.' },
    avatar: { type: 'Choose a JPG, PNG, WebP or GIF image.', size: 'That image is over 5 MB. Choose a smaller one.' },
};

const fieldError = (field, message) => new AppError(400, message, [{ path: `body.${field}`, message }]);

// Each upload is a Cloudinary call we pay for in credits: 20 an hour per account
const uploadGuard = aj?.withRule(slidingWindow({ mode: 'LIVE', characteristics: ['userId'], interval: '1h', max: 20 }));
const limitUploads = arcjetProtect(uploadGuard, (req) => ({ userId: String(req.user.userId) }));

// After requireAuth: the limit counts per account
export function acceptImage(field) {
    const parse = multer({
        // Kept in memory and streamed to Cloudinary: nothing is written to our disk
        storage: multer.memoryStorage(),
        limits: { fileSize: MAX_BYTES, files: 1, fields: 1 },
        fileFilter: (req, file, done) => {
            if (file.fieldname !== field) return done(new AppError(400, `Send the file as "${field}".`));
            if (!TYPES.includes(file.mimetype)) return done(fieldError(field, MESSAGES[field].type));
            done(null, true);
        },
    }).single(field);

    const readMultipart = (req, res, next) => {
        parse(req, res, (error) => {
            if (error instanceof multer.MulterError) {
                return next(error.code === 'LIMIT_FILE_SIZE'
                    ? fieldError(field, MESSAGES[field].size)
                    : new AppError(400, 'Send one photo and the form, nothing else.'));
            }
            if (error) return next(error);
            if (!req.is('multipart/form-data')) return next();

            try {
                req.body = req.body.data === undefined ? {} : JSON.parse(req.body.data);
            } catch {
                return next(new AppError(400, 'The form couldn\'t be read. Please try again.'));
            }
            next();
        });
    };

    const limitWhenFile = (req, res, next) => (req.file ? limitUploads(req, res, next) : next());

    return [readMultipart, limitWhenFile];
}
