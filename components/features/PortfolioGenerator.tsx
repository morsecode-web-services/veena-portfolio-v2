'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDownload, FaFilePdf, FaSpinner } from 'react-icons/fa';
import { generatePDF } from '@/lib/pdf-generator';

export default function PortfolioGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const result = await generatePDF({
        onProgress: (progressValue) => {
          setProgress(Math.round(progressValue));
        },
        includeLinks: true,
      });

      if (!result.success) {
        setError(result.error || 'Failed to generate PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 px-4">
      <motion.button
        onClick={handleGeneratePDF}
        disabled={isGenerating}
        whileHover={!isGenerating ? { scale: 1.05, y: -2 } : {}}
        whileTap={!isGenerating ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`
          flex items-center gap-2 sm:gap-3 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium
          transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base
          touch-manipulation
          ${isGenerating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gold-600 hover:bg-gold-700 active:bg-gold-800 text-white'
          }
        `}
        aria-label="Download portfolio as PDF"
      >
        {isGenerating ? (
          <>
            <FaSpinner className="animate-spin text-lg sm:text-xl" />
            <span className="hidden sm:inline">Generating PDF...</span>
            <span className="sm:hidden">Generating...</span>
          </>
        ) : (
          <>
            <FaDownload className="text-lg sm:text-xl" />
            <span className="hidden sm:inline">Download Portfolio PDF</span>
            <span className="sm:hidden">Download PDF</span>
            <FaFilePdf className="text-lg sm:text-xl" />
          </>
        )}
      </motion.button>

      {/* Progress indicator */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span>Generating your portfolio...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-gold-600 h-2 sm:h-2.5 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This may take a few moments depending on content size
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-w-md p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-xs sm:text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Please try again or contact support if the issue persists.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
