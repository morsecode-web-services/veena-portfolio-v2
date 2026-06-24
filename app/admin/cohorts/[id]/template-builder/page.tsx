import { TemplateBuilder } from '@/components/admin/TemplateBuilder';
import React from 'react';

// Required for Next.js 15 App router with dynamic segments
type Props = {
    params: Promise<{ id: string }>;
};

export default async function TemplateBuilderPage({ params }: Props) {
    // Await params object before extracting its properties
    const { id } = await params;
    
    return <TemplateBuilder cohortId={id} />;
}
