import { Metadata } from 'next';
import CohortClient from './CohortClient';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
    title: 'Veena & Carnatic Music Cohorts | Monthly Learning Journey',
    description: 'Master the art of Veena with structured monthly cohorts. Join our exclusive Carnatic music community and take your skills from basics to mastery.',
    openGraph: {
        title: 'Join Our Monthly Music Cohorts | Veena Manikarnike',
        description: 'Structured, monthly Carnatic music programs designed for mastery. Enroll now to start your journey.',
        images: [{ url: '/images/og-cohorts.png', width: 1200, height: 630, alt: 'Veena Learning Cohorts' }],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Veena & Carnatic Music Cohorts',
        description: 'Master the Veena with structured monthly programs.',
        images: ['/images/og-cohorts.png'],
    }
};

export const dynamic = 'force-dynamic';

export default async function CohortsPage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: cohorts, error } = await supabase
        .from('cohorts')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-slate-50 pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-4">
                        Monthly Learning Cohorts
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Choose a cohort that fits your schedule. Our structured monthly programs are designed to take you from basics to mastery.
                    </p>
                </div>

                <CohortClient initialCohorts={cohorts || []} />
            </div>

            {/* JSON-LD Schema for Courses */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": (cohorts || []).map((cohort, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "item": {
                                "@type": "Course",
                                "name": cohort.title,
                                "description": cohort.description,
                                "provider": {
                                    "@type": "Person",
                                    "name": "Veena Manikarnike",
                                    "sameAs": "https://veenamanikarnike.com"
                                },
                                "offers": {
                                    "@type": "Offer",
                                    "price": cohort.price / 100,
                                    "priceCurrency": "INR",
                                    "availability": cohort.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                                }
                            }
                        }))
                    })
                }}
            />
        </main>
    );
}
