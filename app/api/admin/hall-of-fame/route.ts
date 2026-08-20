import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabase
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
    const serverSupabase = await createClient();
    const {
      data: { session },
    } = await serverSupabase.auth.getSession();

    // Verify session
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentName,
      studentAvatar,
      cohort,
      location,
      studentDescription,
      challengeId,
      challengeTitle,
      pieceTitle,
      ragaName,
      videoUrl,
      videoType,
      thumbnailUrl,
      mentorPraise,
      mentorComment,
      dateFeatured,
      badges,
      isFeatured,
    } = body;

    if (!studentName || !videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newRecord = {
      student_name: studentName,
      student_avatar: studentAvatar || null,
      cohort: cohort || 'Vande Mataram',
      location: location || null,
      student_description: studentDescription || null,
      challenge_id: challengeId || 'c-general',
      challenge_title: challengeTitle || 'Music Challenge',
      piece_title: pieceTitle || studentName,
      raga_name: ragaName || null,
      video_url: videoUrl,
      video_type: videoType || 'gdrive',
      thumbnail_url: thumbnailUrl || null,
      mentor_praise: mentorPraise || null,
      mentor_comment: mentorComment || {
        authorName: 'Aishwarya Manikarnike',
        authorAvatar: '/images/contact/contact-image.jpg',
        commentText: mentorPraise || `${studentName} has shown wonderful proficiency!`,
        timestamp: 'Just now',
        likesCount: 0,
        isVerified: true,
      },
      date_featured: dateFeatured || '2026',
      badges: badges || [],
      is_featured: isFeatured ?? false,
    };

    const { data, error } = await serverSupabase
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
    const serverSupabase = await createClient();
    const {
      data: { session },
    } = await serverSupabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing entry ID' }, { status: 400 });
    }

    const mappedUpdates: Record<string, any> = {};
    if (updates.studentName !== undefined) mappedUpdates.student_name = updates.studentName;
    if (updates.studentAvatar !== undefined) mappedUpdates.student_avatar = updates.studentAvatar;
    if (updates.cohort !== undefined) mappedUpdates.cohort = updates.cohort;
    if (updates.location !== undefined) mappedUpdates.location = updates.location;
    if (updates.studentDescription !== undefined)
      mappedUpdates.student_description = updates.studentDescription;
    if (updates.challengeTitle !== undefined)
      mappedUpdates.challenge_title = updates.challengeTitle;
    if (updates.pieceTitle !== undefined) mappedUpdates.piece_title = updates.pieceTitle;
    if (updates.ragaName !== undefined) mappedUpdates.raga_name = updates.ragaName;
    if (updates.videoUrl !== undefined) mappedUpdates.video_url = updates.videoUrl;
    if (updates.thumbnailUrl !== undefined) mappedUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.mentorPraise !== undefined) mappedUpdates.mentor_praise = updates.mentorPraise;
    if (updates.mentorComment !== undefined) mappedUpdates.mentor_comment = updates.mentorComment;
    if (updates.dateFeatured !== undefined) mappedUpdates.date_featured = updates.dateFeatured;
    if (updates.badges !== undefined) mappedUpdates.badges = updates.badges;
    if (updates.isFeatured !== undefined) mappedUpdates.is_featured = updates.isFeatured;
    mappedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await serverSupabase
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
    const serverSupabase = await createClient();
    const {
      data: { session },
    } = await serverSupabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing entry ID' }, { status: 400 });
    }

    const { error } = await serverSupabase.from('hall_of_fame').delete().eq('id', id);

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
