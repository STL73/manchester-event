import { deleteImage, uploadImage } from './images.js';

// Upload, then write. Every check has run before this, so the photo goes to
// Cloudinary only for a save that should succeed; if the write fails anyway,
// the photo it would have used is deleted again rather than left with nothing
// pointing at it. write() gets { url, publicId }, or null without a file.
// (Its own file, not lib/images.js, so tests that replace images.js still run it)
export async function withUpload(file, kind, write) {
    if (!file) return write(null);
    const uploaded = await uploadImage(file.buffer, kind);
    try {
        return await write(uploaded);
    } catch (error) {
        await deleteImage(uploaded.publicId);
        throw error;
    }
}
