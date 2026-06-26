'use server';

import { revalidateTag } from 'next/cache';

export async function invalidateSmartLinksCache() {
  revalidateTag('smart-links');
}
