import { loadConfig } from '@/lib/config';
import FormPageClient from './FormPageClient';
import { use } from 'react';

export default async function DynamicStandaloneFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const siteConfig = await loadConfig();

  return <FormPageClient slug={slug} siteConfig={siteConfig} />;
}
