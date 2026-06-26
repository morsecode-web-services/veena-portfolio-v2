'use client';

import { m } from 'framer-motion';
import type { SiteConfig } from '@/types';
import PressCard from '@/components/ui/PressCard';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { SectionWrapper } from '@/components/system/SectionWrapper';
import { SectionTitle } from '@/components/system/SectionTitle';

interface PressProps {
  config: SiteConfig;
}

export default function Press({ config }: PressProps) {
  // Config passed as prop
  const shouldReduceMotion = useReducedMotion();

  return (
    <SectionWrapper id="press" spacing="base">
      <SectionTitle
        title="Press & Recognition"
        description="Featured articles and media coverage highlighting achievements and contributions to classical music"
        alignment="center"
      />

      {/* Press Articles Grid */}
      {config.press.articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {config.press.articles.map((article, index) => (
            <m.div
              key={index}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 30 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.6,
                delay: shouldReduceMotion ? 0 : index * 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <PressCard article={article} />
            </m.div>
          ))}
        </div>
      ) : (
        <div className="text-center text-slate-600 px-4">
          <p className="text-base sm:text-lg">No press articles available at this time.</p>
        </div>
      )}
    </SectionWrapper>
  );
}
