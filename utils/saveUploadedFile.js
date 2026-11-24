const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');
const AppError = require('./AppError');

const uploadsDirectory = path.join(__dirname, '..', 'public', 'img', 'uploades');

async function saveUploadedFile(file) {
    if (!file || !Buffer.isBuffer(file.buffer)) {
        throw new AppError('The uploaded image could not be read.', 400);
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const hasBlobCredentials = Boolean(
        process.env.BLOB_READ_WRITE_TOKEN
        || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
    );

    if (hasBlobCredentials) {
        const { put } = require('@vercel/blob');
        const blob = await put(`movies/${randomUUID()}${extension}`, file.buffer, {
            access: 'public',
            contentType: file.mimetype
        });

        return blob.url;
    }

    if (process.env.VERCEL) {
        throw new AppError('Image uploads require a connected Vercel Blob store.', 503);
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
    await fs.mkdir(uploadsDirectory, { recursive: true });
    await fs.writeFile(path.join(uploadsDirectory, filename), file.buffer, { flag: 'wx' });

    return filename;
}

module.exports = saveUploadedFile;
