import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    try {
        // Auth check
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const subfolder = (formData.get('subfolder') as string) || 'gallery';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Ensure target directory exists
        const targetDir = path.join(process.cwd(), 'public', 'images', subfolder);
        await mkdir(targetDir, { recursive: true });

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'jpg';
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
        const fileName = `${baseName}-${Date.now()}.${ext}`;
        const filePath = path.join(targetDir, fileName);

        // Write file
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // Return the public path relative to /public
        const publicPath = `/images/${subfolder}/${fileName}`;

        return NextResponse.json({ success: true, path: publicPath, fileName });
    } catch (error) {
        console.error('[Upload API] Error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
