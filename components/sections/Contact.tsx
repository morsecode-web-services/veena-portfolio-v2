'use client';

import { motion } from 'framer-motion';
import ContactForm from '@/components/features/ContactForm';

export default function Contact() {
  return (
    <section id="contact" className="px-4 sm:px-6 md:px-8" aria-label="Contact">
      <div id="contact-section" className="max-w-6xl mx-auto">
        <motion.div
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ContactForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 sm:mt-10 md:mt-12 text-center text-xs sm:text-sm text-gray-500 px-4"
        >
          <p>
            All inquiries are treated with the utmost professionalism and confidentiality.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
