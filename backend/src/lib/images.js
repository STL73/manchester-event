import { v2 as cloudinary } from 'cloudinary';
import { AppError } from './errors.js';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NODE_ENV } from '../config/env.js';

// Event photos and profile pictures live on Cloudinary (decided 2026-11-02).
// Files come to our server first, which checks them and uploads them, so the
// browser never names a Cloudinary image for us to trust. This is the only
// file that knows Cloudinary; tests replace it with vi.mock

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
});

const TIMEOUT_MS = 20000;

// What each kind of image is stored as. Cloudinary resizes on the way in, so a
// phone's 12-megapixel photo isn't kept at full size. Folders carry NODE_ENV so
// development uploads can be told apart from production's
const KINDS = {
    image: { folder: 'events', transformation: [{ width: 1600, crop: 'limit' }] },
    avatar: { folder: 'avatars', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }] },
};

// The address the frontend shows: WebP or AVIF where the browser takes them,
// at the quality Cloudinary picks
function deliveryUrl({ public_id: publicId, version }) {
    return cloudinary.url(publicId, { version, fetch_format: 'auto', quality: 'auto' });
}

function upload(buffer, options) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(options, (error, result) => (error ? reject(error) : resolve(result)))
            .end(buffer);
    });
}

// kind is the form field's name ('image' or 'avatar'), so a refusal lands
// under that field
export async function uploadImage(buffer, kind) {
    const { folder, transformation } = KINDS[kind];
    let result;
    try {
        result = await upload(buffer, {
            folder: `manchester-event/${NODE_ENV}/${folder}`,
            resource_type: 'image',
            // A second check on the content itself: multer only read the type the browser claimed
            allowed_formats: ['jpg', 'png', 'webp', 'gif'],
            transformation,
            timeout: TIMEOUT_MS,
        });
    } catch (error) {
        // 400 = Cloudinary couldn't read it as one of the allowed formats
        if (error.http_code === 400) {
            const message = 'This file isn\'t a JPG, PNG, WebP or GIF image we can read. Choose another.';
            throw new AppError(400, message, [{ path: `body.${kind}`, message }]);
        }
        console.error('Cloudinary upload failed:', error.message);
        throw new AppError(503, 'Photos can\'t be saved right now. Please try again in a minute.');
    }
    return { url: deliveryUrl(result), publicId: result.public_id };
}

// Best effort: a photo left behind on Cloudinary costs a little storage, while
// a save refused because of it would cost the organiser their changes. Seeded
// photos have no id (NULL) and are never deleted
export async function deleteImage(publicId) {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (error) {
        console.error('Cloudinary delete failed for', publicId, error.message);
    }
}
