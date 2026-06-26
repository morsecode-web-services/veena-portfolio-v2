/**
 * Extracts the public_id from a Cloudinary URL.
 * Example: https://res.cloudinary.com/cloud-name/image/upload/v12345678/folder/image.jpg
 * Returns: "folder/image"
 */
export function extractPublicId(url: string | undefined): string | null {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // Find the index of /upload/ (where the public parts of the URL usually start)
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    // Extract everything after /upload/
    // This will be something like "v12345678/folder/subfolder/image.jpg"
    let part = url.substring(uploadIndex + 8);

    // Remove the version segment (v followed by digits) if it exists
    // It's the first segment if it starts with 'v' and is followed by numerals
    if (part.startsWith('v')) {
      const firstSlashIndex = part.indexOf('/');
      if (firstSlashIndex !== -1) {
        const version = part.substring(0, firstSlashIndex);
        if (/^v\d+$/.test(version)) {
          part = part.substring(firstSlashIndex + 1);
        }
      }
    }

    // Remove the file extension at the end
    const lastDotIndex = part.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      part = part.substring(0, lastDotIndex);
    }

    return part;
  } catch (error) {
    console.error('Error extracting Cloudinary Public ID:', error);
    return null;
  }
}

/**
 * Calls Cloudinary Admin API to delete an image.
 * This must be executed server-side as it requires API Secret.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('[Cloudinary] Missing credentials for deletion');
    return false;
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Use crypto-js if available, or just use the built-in crypto module in Node
    const { createHash } = await import('crypto');

    // Generate signature: serialize all parameters + api_secret, then SHA-1
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = createHash('sha1').update(signatureStr).digest('hex');

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.result === 'ok') {
      console.log(`[Cloudinary] Successfully deleted: ${publicId}`);
      return true;
    } else {
      console.warn(`[Cloudinary] Deletion failed for ${publicId}:`, result);
      return false;
    }
  } catch (error) {
    console.error(`[Cloudinary] Error deleting ${publicId}:`, error);
    return false;
  }
}
