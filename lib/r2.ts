import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'veena-courses';

/**
 * Shared Cloudflare R2 S3-compatible client.
 * Only instantiated on the server (API routes).
 */
export function getR2Client() {
    if (!accountId || !accessKeyId || !secretAccessKey) {
        throw new Error('Cloudflare R2 environment variables are not configured.');
    }
    return new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
}

/**
 * Generate a short-lived GET presigned URL for a private R2 object.
 * Used by the student portal to stream videos/PDFs securely.
 *
 * @param key - The R2 object key (e.g. 'courses/lesson-123/video.mp4')
 * @param expiresInSeconds - How long the URL is valid (default: 3600 = 60 min)
 */
export async function getPresignedGetUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const client = getR2Client();
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Generate a short-lived PUT presigned URL for uploading directly to R2.
 * Used by the admin curriculum builder to upload large files without
 * hitting the Next.js server.
 *
 * @param key - The R2 object key to upload to
 * @param contentType - MIME type (e.g. 'video/mp4', 'application/pdf')
 * @param expiresInSeconds - How long the upload URL is valid (default: 900 = 15 min)
 */
export async function getPresignedPutUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 900
): Promise<string> {
    const client = getR2Client();
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export { bucketName };
