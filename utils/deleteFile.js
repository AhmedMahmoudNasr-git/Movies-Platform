const fs = require('fs').promises;
const path = require('path');

async function deleteUploadedFile(filename) {
    if (!filename || typeof filename !== 'string') {
        return;
    }

    if (filename.startsWith('http')) {
        let isVercelBlob = false;
        try {
            const hostname = new URL(filename).hostname;
            isVercelBlob = hostname === 'public.blob.vercel-storage.com'
                || hostname.endsWith('.public.blob.vercel-storage.com');
        } catch {
            return;
        }

        if (isVercelBlob) {
            const hasBlobCredentials = Boolean(
                process.env.BLOB_READ_WRITE_TOKEN
                || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
            );
            if (!hasBlobCredentials) {
                throw new Error('Deleting this image requires a connected Vercel Blob store.');
            }

            const { del } = require('@vercel/blob');
            await del(filename);
        }

        return;
    }

    // Bundled deployment files are immutable; only Blob URLs can be deleted on Vercel.
    if (process.env.VERCEL) {
        return;
    }

    const filePath = path.join(__dirname, '..', 'public', 'img', 'uploades', filename);
    try {
        await fs.unlink(filePath);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
}

module.exports = deleteUploadedFile;
