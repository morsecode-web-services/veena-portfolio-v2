import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/lib/supabase-server';

async function checkAdminAuth(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (!authError && user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile && (profile.role === 'admin' || profile.role === 'editor')) {
        return true;
      }
    }
  }

  try {
    const serverSupabase = await createClient();
    const {
      data: { session },
    } = await serverSupabase.auth.getSession();
    if (session) return true;
  } catch (err) {
    console.warn('Server session check failed:', err);
  }

  return false;
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('hall_of_fame')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching hall_of_fame entries:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await checkAdminAuth(request);
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin login required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      studentName,
      cohort,
      location,
      studentDescription,
      videoUrl,
      videoType,
      thumbnailUrl,
      mentorPraise,
      mentorComment,
    } = body;

    if (!studentName || !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Student name and video URL are required.' },
        { status: 400 }
      );
    }

    const commentText =
      mentorComment?.commentText ||
      mentorPraise ||
      `${studentName} has shown wonderful proficiency!`;

    const mentorCommentObj = {
      authorName: mentorComment?.authorName || 'Aishwarya Manikarnike',
      authorAvatar: mentorComment?.authorAvatar || '/images/contact/contact-image.jpg',
      commentText: commentText,
      timestamp: mentorComment?.timestamp || 'Recently',
      likesCount: mentorComment?.likesCount ?? 18,
      isVerified: true,
    };

    const newRecord = {
      student_name: studentName,
      cohort: cohort || 'Vande Mataram',
      location: location || null,
      student_description: studentDescription || null,
      video_url: videoUrl,
      video_type: videoType || 'gdrive',
      thumbnail_url: thumbnailUrl || null,
      mentor_praise: commentText,
      mentor_comment: mentorCommentObj,
      likes_count: mentorCommentObj.likesCount,
    };

    const { data, error } = await supabaseAdmin
      .from('hall_of_fame')
      .insert([newRecord])
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating hall_of_fame entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create entry' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const isAuth = await checkAdminAuth(request);
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin login required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      studentName,
      cohort,
      location,
      studentDescription,
      videoUrl,
      videoType,
      thumbnailUrl,
      mentorPraise,
      mentorComment,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing entry ID' }, { status: 400 });
    }

    const mappedUpdates: Record<string, any> = {};
    if (studentName !== undefined) mappedUpdates.student_name = studentName;
    if (cohort !== undefined) mappedUpdates.cohort = cohort;
    if (location !== undefined) mappedUpdates.location = location;
    if (studentDescription !== undefined) mappedUpdates.student_description = studentDescription;
    if (videoUrl !== undefined) mappedUpdates.video_url = videoUrl;
    if (videoType !== undefined) mappedUpdates.video_type = videoType;
    if (thumbnailUrl !== undefined) mappedUpdates.thumbnail_url = thumbnailUrl;

    const commentText = mentorComment?.commentText || mentorPraise;
    if (commentText !== undefined) {
      mappedUpdates.mentor_praise = commentText;
      mappedUpdates.mentor_comment = {
        authorName: mentorComment?.authorName || 'Aishwarya Manikarnike',
        authorAvatar: mentorComment?.authorAvatar || '/images/contact/contact-image.jpg',
        commentText: commentText,
        timestamp: mentorComment?.timestamp || 'Recently',
        likesCount: mentorComment?.likesCount ?? 18,
        isVerified: true,
      };
    } else if (mentorComment !== undefined) {
      mappedUpdates.mentor_comment = mentorComment;
    }

    mappedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('hall_of_fame')
      .update(mappedUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating hall_of_fame entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const isAuth = await checkAdminAuth(request);
    if (!isAuth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin login required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing entry ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('hall_of_fame').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting hall_of_fame entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
