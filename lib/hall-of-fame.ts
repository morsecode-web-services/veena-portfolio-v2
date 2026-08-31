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
 * Fetches all Hall of Famers from Supabase. Returns only real DB entries.
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
          const dbLikes = typeof item.likes_count === 'number' ? item.likes_count : 0;
          const mentorComment = item.mentor_comment || {
            authorName: MENTOR_AISHWARIYA.authorName,
            authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
            commentText: item.mentor_praise || 'Wonderful proficiency and dedication!',
            timestamp: 'Recently',
            likesCount: dbLikes,
            isVerified: true,
          };

          if (mentorComment) {
            mentorComment.likesCount = dbLikes;
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
            likesCount: dbLikes,
            likes_count: dbLikes,
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
  try {
    let id = localStorage.getItem('veena_visitor_id');
    if (!id) {
      id = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('veena_visitor_id', id);
    }
    return id;
  } catch {
    return 'fallback-visitor';
  }
}

/**
 * Fetches the set of performer IDs that this visitor has liked from Supabase
 * with cached fallback to localStorage.
 */
export async function getVisitorLikedIds(visitorId?: string): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  const vid = visitorId || getVisitorId();

  try {
    if (supabase && vid) {
      const { data, error } = await supabase
        .from('hall_of_fame_likes')
        .select('performer_id')
        .eq('visitor_id', vid);

      if (!error && data) {
        const ids = data.map((row: any) => row.performer_id);
        try {
          localStorage.setItem('veena_liked_performers', JSON.stringify(ids));
        } catch {}
        return ids;
      }
    }
  } catch (err) {
    console.warn('Error fetching visitor likes from Supabase:', err);
  }

  try {
    const cached = localStorage.getItem('veena_liked_performers');
    if (cached) return JSON.parse(cached);
  } catch {}

  return [];
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
        const returnedLiked = Boolean(data.liked);
        const returnedCount =
          typeof data.likes_count === 'number' ? data.likes_count : currentLikesCount;

        try {
          const storedLikes = localStorage.getItem('veena_liked_performers');
          let likedPerformers: string[] = storedLikes ? JSON.parse(storedLikes) : [];
          if (returnedLiked && !likedPerformers.includes(performerId)) {
            likedPerformers.push(performerId);
          } else if (!returnedLiked && likedPerformers.includes(performerId)) {
            likedPerformers = likedPerformers.filter((id) => id !== performerId);
          }
          localStorage.setItem('veena_liked_performers', JSON.stringify(likedPerformers));
        } catch {}

        return {
          success: true,
          liked: returnedLiked,
          likesCount: returnedCount,
        };
      }
    }
  } catch (err) {
    console.warn('Supabase RPC like toggle error:', err);
  }

  // Fallback if network or Supabase is unavailable
  const fallbackLiked = !currentLikedState;
  const fallbackCount = currentLikedState
    ? Math.max(0, currentLikesCount - 1)
    : currentLikesCount + 1;

  try {
    const storedLikes = localStorage.getItem('veena_liked_performers');
    let likedPerformers: string[] = storedLikes ? JSON.parse(storedLikes) : [];
    if (fallbackLiked && !likedPerformers.includes(performerId)) {
      likedPerformers.push(performerId);
    } else if (!fallbackLiked && likedPerformers.includes(performerId)) {
      likedPerformers = likedPerformers.filter((id) => id !== performerId);
    }
    localStorage.setItem('veena_liked_performers', JSON.stringify(likedPerformers));
  } catch {}

  return {
    success: true,
    liked: fallbackLiked,
    likesCount: fallbackCount,
  };
}
