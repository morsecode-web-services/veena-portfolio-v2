import { Metadata } from 'next';
import { loadConfig } from '@/lib/config';
import HallOfFameClient from './HallOfFameClient';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadConfig();
  const rawTitle = config?.hallOfFame?.title || 'Cohort: Vande Mataram';
  const cleanTitle = rawTitle.replace(/^["']|["']$/g, '').trim();
  const description =
    config?.hallOfFame?.description ||
    'These students showed exceptional display of talent across our Veena learning challenges.';

  return {
    title: `${cleanTitle} | Hall of Fame`,
    description,
    openGraph: {
      title: `${cleanTitle} | Hall of Fame`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cleanTitle} | Hall of Fame`,
      description,
    },
  };
}

export default async function HallOfFamePage() {
  const config = await loadConfig();

  return <HallOfFameClient config={config} />;
}
