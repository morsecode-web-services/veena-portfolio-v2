import { Metadata } from 'next';
import { loadConfig } from '@/lib/config';
import HallOfFameClient from './HallOfFameClient';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string }>;
}): Promise<Metadata> {
  const { entry } = (await searchParams) || {};
  const config = await loadConfig();
  const rawTitle = config?.hallOfFame?.title || 'Cohort: Vande Mataram';
  const cleanTitle = rawTitle.replace(/^["']|["']$/g, '').trim();
  const description =
    config?.hallOfFame?.description ||
    'These students showed exceptional display of talent across our Veena learning challenges.';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aishwaryamanikarnike.com';
  let title = `${cleanTitle} | Hall of Fame`;
  let desc = description;
  const ogImageUrl = `${siteUrl}/api/og/hall-of-fame${entry ? `?entry=${encodeURIComponent(entry)}` : ''}`;

  if (entry && supabase) {
    try {
      const { data } = await supabase
        .from('hall_of_fame')
        .select('student_name, cohort, mentor_praise, mentor_comment')
        .eq('id', entry)
        .single();

      if (data) {
        title = `${data.student_name} — Hall of Fame | Aishwarya Manikarnike`;
        desc = `Celebrating ${data.student_name}'s performance in ${data.cohort || 'Vande Mataram'}. "${data.mentor_comment?.commentText || data.mentor_praise || 'Wonderful proficiency!'}"`;
      }
    } catch (err) {
      console.warn('Metadata lookup error:', err);
    }
  }

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: `${siteUrl}/hall-of-fame${entry ? `?entry=${entry}` : ''}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [ogImageUrl],
    },
  };
}

export default async function HallOfFamePage() {
  const config = await loadConfig();

  return <HallOfFameClient config={config} />;
}
