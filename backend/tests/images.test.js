import { describe, it, expect, beforeEach, vi } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';

import { deleteImage, uploadImage } from '../src/lib/images.js';
import { droppedPhotos } from '../src/lib/organiserEvents.js';

// lib/images.js against a stand-in for the Cloudinary SDK: no request leaves
// the machine. What Cloudinary's upload answers is set per test
vi.mock('cloudinary', () => ({
    v2: {
        config: vi.fn(),
        url: vi.fn((publicId, { version }) => `https://res.example.test/v${version}/${publicId}`),
        uploader: { upload_stream: vi.fn(), destroy: vi.fn() },
    },
}));

const answerUpload = (error, result) =>
    cloudinary.uploader.upload_stream.mockImplementation((options, callback) => ({ end: () => callback(error, result) }));

beforeEach(() => {
    vi.mocked(cloudinary.uploader.upload_stream).mockReset();
    vi.mocked(cloudinary.uploader.destroy).mockReset();
});

describe('uploadImage', () => {
    it('stores an event photo in its folder, resized, with only the four formats allowed', async () => {
        answerUpload(null, { public_id: 'manchester-event/test/events/abc', version: 7 });

        const uploaded = await uploadImage(Buffer.from('photo'), 'image');

        expect(uploaded).toEqual({
            url: 'https://res.example.test/v7/manchester-event/test/events/abc',
            publicId: 'manchester-event/test/events/abc',
        });
        const [options] = cloudinary.uploader.upload_stream.mock.lastCall;
        expect(options).toMatchObject({
            folder: 'manchester-event/test/events',
            allowed_formats: ['jpg', 'png', 'webp', 'gif'],
            transformation: [{ width: 1600, crop: 'limit' }],
        });
        // Delivered as WebP or AVIF where the browser takes them
        expect(cloudinary.url).toHaveBeenLastCalledWith('manchester-event/test/events/abc', expect.objectContaining({ fetch_format: 'auto', quality: 'auto' }));
    });

    it('crops a profile picture square in its own folder', async () => {
        answerUpload(null, { public_id: 'manchester-event/test/avatars/me', version: 1 });
        await uploadImage(Buffer.from('face'), 'avatar');
        expect(cloudinary.uploader.upload_stream.mock.lastCall[0]).toMatchObject({
            folder: 'manchester-event/test/avatars',
            transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'auto' }],
        });
    });

    it('turns a file Cloudinary can\'t read into a 400 under the field', async () => {
        answerUpload({ http_code: 400, message: 'Invalid image file' });
        await expect(uploadImage(Buffer.from('not an image'), 'avatar')).rejects.toMatchObject({
            status: 400,
            details: [{ path: 'body.avatar', message: expect.stringContaining('JPG, PNG, WebP or GIF') }],
        });
    });

    it('answers 503 when Cloudinary fails or times out', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        answerUpload({ http_code: 499, message: 'Request Timeout' });
        await expect(uploadImage(Buffer.from('photo'), 'image')).rejects.toMatchObject({ status: 503 });
    });
});

describe('deleteImage', () => {
    it('deletes by public id', async () => {
        await deleteImage('manchester-event/test/events/old');
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('manchester-event/test/events/old', { invalidate: true });
    });

    it('leaves seeded photos alone: they have no id', async () => {
        await deleteImage(null);
        expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('never fails the save that asked for it', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        cloudinary.uploader.destroy.mockRejectedValue(new Error('down'));
        await expect(deleteImage('manchester-event/test/events/old')).resolves.toBeUndefined();
    });
});

describe('droppedPhotos', () => {
    const live = { imagePublicId: 'a', approvedSnapshot: null };

    it('finds the photo a row no longer shows', () => {
        expect(droppedPhotos(live, { imagePublicId: 'b', approvedSnapshot: null })).toEqual(['a']);
        expect(droppedPhotos(live, { imagePublicId: null, approvedSnapshot: null })).toEqual(['a']);
    });

    it('keeps a photo the approved version still shows', () => {
        expect(droppedPhotos(live, { imagePublicId: 'b', approvedSnapshot: { imagePublicId: 'a' } })).toEqual([]);
    });

    it('finds nothing when the photo is unchanged or was a seed photo', () => {
        expect(droppedPhotos(live, live)).toEqual([]);
        expect(droppedPhotos({ imagePublicId: null }, { imagePublicId: 'b' })).toEqual([]);
    });
});
