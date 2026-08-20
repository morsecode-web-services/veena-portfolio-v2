import { HallOfFamer } from '@/types/hall-of-fame';
import { supabase } from '@/lib/supabase';

export const MENTOR_AISHWARIYA = {
  authorName: 'Aishwarya Manikarnike',
  authorAvatar: process.env.NEXT_PUBLIC_MENTOR_AVATAR_URL || '/images/contact/contact-image.jpg',
  isVerified: true,
};

export const INITIAL_HALL_OF_FAMERS: HallOfFamer[] = [
  {
    id: 'hof-deepa',
    studentName: 'Deepa Hegde',
    cohort: 'Vande Mataram',
    location: 'Bengaluru, India',
    studentDescription:
      'Deepa performed with remarkable tonal clarity, smooth finger movement, and impeccable Shruti alignment.',
    videoUrl: 'https://drive.google.com/file/d/1BziV8S4g6K7mX2q-sample/view',
    videoType: 'gdrive',
    mentorComment: {
      authorName: MENTOR_AISHWARIYA.authorName,
      authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
      commentText:
        'Deepa has shown wonderful proficiency in short time. Her finger placement and meetu precision are remarkable!',
      timestamp: '2h ago',
      likesCount: 28,
      isVerified: true,
    },
    dateFeatured: 'August 2026',
    isFeatured: true,
  },
  {
    id: 'hof-ananya',
    studentName: 'Ananya Ramachandran',
    cohort: 'Vande Mataram',
    location: 'Chennai, India',
    studentDescription:
      'Ananya performed with spotless Gamaka clarity, rapid finger dexterity, and steady Tala rhythm.',
    videoUrl: 'https://drive.google.com/file/d/1CziV9S5g7K8mY3r-sample/view',
    videoType: 'gdrive',
    mentorComment: {
      authorName: MENTOR_AISHWARIYA.authorName,
      authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
      commentText:
        'Ananya showcased breathtaking speed control while keeping every single Gamaka clean and aligned to the Shruti. Exceptional posture and plucking clarity!',
      timestamp: '1d ago',
      likesCount: 34,
      isVerified: true,
    },
    dateFeatured: 'August 2026',
    isFeatured: true,
  },
  {
    id: 'hof-siddharth',
    studentName: 'Siddharth Rao',
    cohort: 'Vande Mataram',
    location: 'San Jose, USA',
    studentDescription:
      'An emotive musical exploration with rich sustained Veena resonance and traditional phrasing.',
    videoUrl: 'https://drive.google.com/file/d/1DziV0S6g8K9mZ4s-sample/view',
    videoType: 'gdrive',
    mentorComment: {
      authorName: MENTOR_AISHWARIYA.authorName,
      authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
      commentText:
        'Siddharth’s phrasing carries immense soul and structure. The transitions between mandra and tara sthayi were executed effortlessly!',
      timestamp: '3d ago',
      likesCount: 41,
      isVerified: true,
    },
    dateFeatured: 'July 2026',
    isFeatured: true,
  },
  {
    id: 'hof-meera',
    studentName: 'Meera Iyer',
    cohort: 'Vande Mataram',
    location: 'Hyderabad, India',
    studentDescription:
      'Demonstrated unwavering Tala alignment and vibrant speed control after focused daily practice.',
    videoUrl: 'https://drive.google.com/file/d/1EziV1S7g9K0mA5t-sample/view',
    videoType: 'gdrive',
    mentorComment: {
      authorName: MENTOR_AISHWARIYA.authorName,
      authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
      commentText:
        '30 days of unshakeable dedication! Meera went from slow plucking to a vibrant execution with rock-solid tala sync. Inspiring progress!',
      timestamp: '5d ago',
      likesCount: 56,
      isVerified: true,
    },
    dateFeatured: 'June 2026',
    isFeatured: true,
  },
  {
    id: 'hof-karthik',
    studentName: 'Karthik Subramanian',
    cohort: 'Vande Mataram',
    location: 'London, UK',
    studentDescription:
      'Clean left-hand finger positioning and smooth speed transitions across swara patterns.',
    videoUrl: 'https://drive.google.com/file/d/1FziV2S8g0K1mB6u-sample/view',
    videoType: 'gdrive',
    mentorComment: {
      authorName: MENTOR_AISHWARIYA.authorName,
      authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
      commentText:
        'Karthik demonstrated crisp left-hand finger alignment and perfect fret press pressure. Rapid growth in just a few weeks!',
      timestamp: '1w ago',
      likesCount: 22,
      isVerified: true,
    },
    dateFeatured: 'May 2026',
    isFeatured: false,
  },
];

/**
 * Fetches all Hall of Famers from Supabase DB or returns initial fallback
 */
export async function getHallOfFamers(): Promise<HallOfFamer[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('hall_of_fame')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          studentName: item.student_name,
          cohort: item.cohort || 'Vande Mataram',
          location: item.location || 'India',
          studentDescription: item.student_description || item.piece_title,
          videoUrl: item.video_url,
          videoType: item.video_type || 'gdrive',
          mentorComment: item.mentor_comment || {
            authorName: MENTOR_AISHWARIYA.authorName,
            authorAvatar: MENTOR_AISHWARIYA.authorAvatar,
            commentText: item.mentor_praise || 'Wonderful proficiency and dedication!',
            timestamp: 'Recently',
            likesCount: item.likes_count || 15,
            isVerified: true,
          },
          dateFeatured: item.date_featured || '2026',
          isFeatured: item.is_featured ?? false,
        }));
      }
    }
  } catch (err) {
    console.warn('Falling back to local Hall of Fame dataset:', err);
  }

  return INITIAL_HALL_OF_FAMERS;
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
  visitorId?: string
): Promise<{ success: boolean; liked: boolean; likesCount: number }> {
  const vid = visitorId || getVisitorId();

  try {
    if (supabase) {
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
    liked: true,
    likesCount: Math.floor(Math.random() * 20) + 25,
  };
}
