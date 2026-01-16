'use client';

import dynamic from 'next/dynamic';

const PortfolioGenerator = dynamic(() => import('./PortfolioGenerator'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center py-8">
            <div className="animate-pulse text-gray-600">Loading portfolio generator...</div>
        </div>
    ),
});

export default function PortfolioGeneratorWrapper() {
    return <PortfolioGenerator />;
}
