import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Coming Soon | Aishwarya Manikarnike',
    description: 'Something beautiful is on its way.',
    robots: { index: false, follow: false },
};

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
