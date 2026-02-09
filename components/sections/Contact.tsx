'use client';

import { m } from 'framer-motion';
import ContactForm from '@/components/features/ContactForm';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import siteConfig from '@/public/config/site-config.json';

export default function Contact() {
  const contactImage = siteConfig?.contact?.imageUrl || '/images/contact/contact-image.jpg';
  const contactImageAlt = siteConfig?.contact?.imageAlt || 'Contact';

  return (
    <section id="contact" className="px-4 sm:px-6 md:px-8" aria-label="Contact">
      <div id="contact-section" className="max-w-6xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-2 md:mb-3 px-4">
            Get in Touch
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
            I welcome inquiries for performances, collaborations, and teaching opportunities.
            Please share your details and I will respond promptly.
          </p>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column - Image */}
          <m.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg"
          >
            <ImageWithFallback
              src={contactImage}
              alt={contactImageAlt}
              fill
              className="object-cover"
            />
          </m.div>

          {/* Right Column - Form */}
          <m.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ContactForm />
          </m.div>
        </div>
      </div>
    </section>
  );
}
