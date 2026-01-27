'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FaFilePdf, FaSpinner } from 'react-icons/fa';
import { generatePDF } from '@/lib/pdf-generator';
import { analytics } from '@/components/GoogleAnalytics';

interface HeaderPDFButtonProps {
    showLabel?: boolean;
}

export default function HeaderPDFButton({ showLabel = false }: HeaderPDFButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePDF = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isGenerating) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generatePDF({
                includeLinks: true,
            });

            if (!result.success) {
                setError(result.error || 'Failed');
                setTimeout(() => setError(null), 3000);
            } else {
                // Track successful PDF download
                analytics.pdfDownload('portfolio.pdf');
            }
        } catch (err) {
            setError('Error');
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative flex items-center">
            <m.button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                whileHover={!isGenerating ? { scale: 1.05 } : {}}
                whileTap={!isGenerating ? { scale: 0.95 } : {}}
                className={`
          flex items-center transition-all duration-300
          ${showLabel
                        ? 'gap-3 px-4 py-3 w-full text-left text-base font-medium'
                        : 'justify-center w-8 h-8 rounded-full shadow-sm border border-gold-100'
                    }
          ${isGenerating
                        ? 'text-gray-400 cursor-not-allowed'
                        : error
                            ? 'text-red-500 bg-red-50'
                            : showLabel
                                ? 'text-gray-700 hover:text-gold-600'
                                : 'text-gold-600 bg-white hover:bg-gold-50'
                    }
        `}
                aria-label={isGenerating ? 'Generating PDF...' : error ? error : 'Download Portfolio PDF'}
                title={isGenerating ? 'Generating PDF...' : error ? error : 'Download Portfolio PDF'}
            >
                {isGenerating ? (
                    <FaSpinner className="animate-spin text-sm" />
                ) : (
                    <FaFilePdf className={showLabel ? 'text-lg' : 'text-sm'} />
                )}
                {showLabel && (
                    <span>
                        {isGenerating ? 'Generating PDF...' : error ? `Error: ${error}` : 'Download Portfolio PDF'}
                    </span>
                )}
            </m.button>
        </div>
    );
}
