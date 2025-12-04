import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  onProgress?: (progress: number) => void;
  includeLinks?: boolean;
}

export interface PDFGenerationResult {
  success: boolean;
  error?: string;
}

/**
 * Generates a PDF portfolio using the browser's print functionality
 * This avoids html2canvas and its oklch/oklab compatibility issues
 */
export async function generatePDF(
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  const { onProgress } = options;

  try {
    onProgress?.(10);

    // Show print-optimized view
    document.body.classList.add('print-mode');

    onProgress?.(30);

    // Create a promise that resolves when user finishes printing
    await new Promise<void>((resolve) => {
      // Set up print event listeners
      const afterPrint = () => {
        window.removeEventListener('afterprint', afterPrint);
        resolve();
      };

      window.addEventListener('afterprint', afterPrint);

      onProgress?.(50);

      // Trigger print dialog
      setTimeout(() => {
        window.print();
      }, 100);
    });

    // Clean up
    document.body.classList.remove('print-mode');

    onProgress?.(100);

    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    document.body.classList.remove('print-mode');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
