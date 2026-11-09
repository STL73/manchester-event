import { deleteImage, uploadImage } from './images.js';

// Uploads the file, then runs write({ url, publicId }, or null without one), and
// deletes the upload if the write fails. Apart from images.js so tests that mock it run this
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
