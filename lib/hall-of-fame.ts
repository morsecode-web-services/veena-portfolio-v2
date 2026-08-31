import { HallOfFamer } from '@/types/hall-of-fame';
import { supabase } from '@/lib/supabase';

export const MENTOR_AISHWARIYA = {
  authorName: 'Aishwarya Manikarnike',
  authorAvatar: process.env.NEXT_PUBLIC_MENTOR_AVATAR_URL || '/images/contact/contact-image.jpg',
  isVerified: true,
};

// No hardcoded fallback entries — all data comes from Supabase.
export const INITIAL_HALL_OF_FAMERS: HallOfFamer[] = [];

/**
 * Fetches all Hall of Famers from Supabase. Returns only real DB entries —
 * no hardcoded fallback data is merged in.
 */
export async function getHallOfFamers(): Promise<HallOfFamer[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('hall_of_fame')
        .select('*')
        .order('order_index', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item) => {
          const mentorComment = item.mentor_comment || {
            authorName: MENTOR_AISHWARIYA.authorName,
            authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
            commentText: item.mentor_praise || 'Wonderful proficiency and dedication!',
            timestamp: 'Recently',
            likesCount: item.likes_count || 15,
            isVerified: true,
          };

          if (mentorComment) {
            mentorComment.likesCount = item.likes_count;
          }

          return {
            id: item.id,
            studentName: item.student_name,
            cohort: item.cohort || 'Vande Mataram',
            location: item.location || 'India',
            studentDescription: item.student_description || item.piece_title,
            videoUrl: item.video_url,
            videoType: item.video_type || 'gdrive',
            customThumbnailUrl: item.thumbnail_url,
            mentorComment,
            dateFeatured: item.date_featured || '2026',
            isFeatured: item.is_featured ?? false,
            order_index: item.order_index ?? 0,
            orderIndex: item.order_index ?? 0,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Error fetching Hall of Fame from Supabase:', err);
  }

  return [];
}

/**
 * Gets or creates a persistent visitor ID from localStorage
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server-visitor';
  let id = localStorage.getItem('veena_visitor_id');
  if (!id) {
    id = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('veena_visitor_id', id);
  }
  return id;
}

/**
 * Toggles a like for a Hall of Fame entry safely using Supabase RPC function.
 * Prevents race conditions and duplicate likes per visitor.
 */
export async function toggleHallOfFameLike(
  performerId: string,
  visitorId?: string,
  currentLikedState: boolean = false,
  currentLikesCount: number = 0
): Promise<{ success: boolean; liked: boolean; likesCount: number }> {
  const vid = visitorId || getVisitorId();
  const isUuid =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      performerId
    );

  try {
    if (supabase && isUuid) {
      const { data, error } = await supabase.rpc('toggle_hall_of_fame_like', {
        p_performer_id: performerId,
        p_visitor_id: vid,
      });

      if (!error && data && data.success) {
        return {
          success: true,
          liked: data.liked,
          likesCount: data.likes_count,
        };
      }
    }
  } catch (err) {
    console.warn('Supabase RPC like toggle fallback:', err);
  }

  return {
    success: true,
    liked: !currentLikedState,
    likesCount: currentLikedState ? Math.max(0, currentLikesCount - 1) : currentLikesCount + 1,
  };
}
