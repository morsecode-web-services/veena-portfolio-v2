import { Metadata } from 'next';
import CohortClient from './CohortClient';
import CohortFAQ from '@/components/sections/CohortFAQ';
import { createClient } from '@supabase/supabase-js';
import { loadConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Next Avarthanam | Veena & Carnatic Music Programs',
  description:
    'Master the art of Veena with structured Avarthanam cohorts. Join our exclusive Carnatic music community and take your skills from basics to mastery.',
  openGraph: {
    title: 'Next Avarthanam | Aishwarya Manikarnike',
    description:
      'Structured Carnatic music programs designed for mastery. Enroll now to start your journey.',
    images: [
      { url: '/images/og-cohorts.png', width: 1200, height: 630, alt: 'Next Avarthanam Cohorts' },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Next Avarthanam | Veena & Carnatic Music',
    description: 'Master the Veena with structured learning cohorts.',
    images: ['/images/og-cohorts.png'],
  },
};

export const revalidate = 60;

export default async function CohortsPage() {
  const config = await loadConfig();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('*')
    .neq('status', 'completed')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-medium italic text-navy-900 tracking-tight mb-4">
            &quot;Next Avarthanam&quot;
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A 3 month Veena-driven learning journey. Learn two Indian classical / contemporary &amp;
            raaga-based songs every month. Breaking the barrier to entry with a flexible, accessible
            music learning community.
          </p>
        </div>

        <CohortClient initialCohorts={cohorts || []} config={config} />
        <CohortFAQ items={config.cohorts_faq?.items} />
      </div>

      {/* JSON-LD Schema for Courses */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: (cohorts || []).map((cohort, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Course',
                name: cohort.title,
                description: cohort.description,
                provider: {
                  '@type': 'Person',
                  name: 'Aishwarya Manikarnike',
                  sameAs: 'https://veenamanikarnike.com',
                },
                offers: {
                  '@type': 'Offer',
                  price: cohort.price / 100,
                  priceCurrency: 'INR',
                  availability:
                    cohort.status === 'active'
                      ? 'https://schema.org/InStock'
                      : 'https://schema.org/OutOfStock',
                },
              },
            })),
          }),
        }}
      />
    </main>
  );
}
