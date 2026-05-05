import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractPublicId, deleteFromCloudinary } from '@/lib/cloudinary';

// Initialize Supabase (server-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST - Delete images from Cloudinary
 * req body: { urls: string[] }
 */
export async function POST(request: Request) {
    try {
        // 1. Session Check (Admin only)
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        // Check if user is admin/editor
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Parse Request
        const { urls } = await request.json();
        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        console.log(`[Cloudinary API] Deleting ${urls.length} images...`);

        // 3. Process Deletions
        const results = await Promise.all(
            urls.map(async (url) => {
                const publicId = extractPublicId(url);
                if (publicId) {
                    return await deleteFromCloudinary(publicId);
                }
                return false;
            })
        );

        const successCount = results.filter(Boolean).length;
        
        return NextResponse.json({ 
            success: true, 
            message: `Deleted ${successCount} of ${urls.length} images` 
        });
    } catch (error: any) {
        console.error('[Cloudinary API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
