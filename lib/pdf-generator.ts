import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  onProgress?: (progress: number) => void;
  includeLinks?: boolean;
}

export interface PDFGenerationResult {
  success: boolean;
  error?: string;
}

// Color palette (using RGB to avoid oklch issues)
const COLORS = {
  navy: { r: 20, g: 33, b: 61 },      // #14213d
  gold: { r: 184, g: 134, b: 11 },    // #b8860b
  cream: { r: 250, g: 248, b: 245 },  // #faf8f5
  gray: { r: 107, g: 114, b: 128 },   // #6b7280
  white: { r: 255, g: 255, b: 255 },
};

/**
 * Generates a professional portfolio PDF from the website's config data
 */
export async function generatePDF(
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> {
  const { onProgress, includeLinks = true } = options;

  try {
    onProgress?.(5);

    // Load config data
    const { getBasePath } = await import('./config');
    const basePath = getBasePath().replace(/\/$/, '');
    const configPath = '/config/site-config.json'.replace(/^\//, '');
    const fullPath = basePath ? `${basePath}/${configPath}` : `/${configPath}`;

    const response = await fetch(fullPath);
    if (!response.ok) {
      throw new Error(`Failed to load site configuration from ${fullPath}`);
    }
    const config = await response.json();

    onProgress?.(10);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let currentY = margin;

    // Helper functions
    const getImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = dataUrl;
      });
    };

    const addHeader = (text: string, size: number = 20) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(size);
      pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
      pdf.text(text, margin, currentY);
      currentY += size * 0.5;
    };

    const addSubheader = (text: string, size: number = 14) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(size);
      pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
      pdf.text(text, margin, currentY);
      currentY += size * 0.5;
    };

    const addText = (text: string, size: number = 11) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      const lines = pdf.splitTextToSize(text, contentWidth);
      pdf.text(lines, margin, currentY);
      currentY += (lines.length * size * 0.4) + 3;
    };

    const addLink = (text: string, url: string, size: number = 11) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(size);
      pdf.setTextColor(0, 102, 204); // Blue for links

      // Use text() instead of textWithLink() to avoid spacing issues
      pdf.text(text, margin, currentY);

      // Add clickable link area if links are enabled
      if (includeLinks) {
        const textWidth = pdf.getTextWidth(text);
        pdf.link(margin, currentY - size * 0.7, textWidth, size, { url });
      }

      currentY += size * 0.5;
    };

    const addSpace = (space: number = 5) => {
      currentY += space;
    };

    const checkPageBreak = (neededSpace: number = 40) => {
      if (currentY + neededSpace > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
        return true;
      }
      return false;
    };

    const loadImage = async (url: string): Promise<string | null> => {
      try {
        let finalUrl = url;

        // Handle local paths for GitHub Pages / Netlify variety
        if (url.startsWith('/') && !url.startsWith('//')) {
          const { getBasePath } = await import('./config');
          const basePath = getBasePath().replace(/\/$/, '');
          const sanitizedUrl = url.replace(/^\//, '');
          finalUrl = basePath ? `${basePath}/${sanitizedUrl}` : `/${sanitizedUrl}`;
        }

        const response = await fetch(finalUrl);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error(`[PDF] Failed to load image: ${url}`, error);
        return null;
      }
    };

    // ===== PAGE 1: HOME =====
    onProgress?.(20);

    // Title
    pdf.setFont('times', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    pdf.text(config.artist.name, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Tagline
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(14);
    pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    pdf.text(config.artist.tagline, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Load and add home images
    const imgWidth = (contentWidth - 10) / 2;
    const imgHeight = imgWidth * 0.75;

    const veenaImg = await loadImage(config.home.images.veena);
    const vocalImg = await loadImage(config.home.images.vocal);

    if (veenaImg) {
      pdf.addImage(veenaImg, 'JPEG', margin, currentY, imgWidth, imgHeight);
    }
    if (vocalImg) {
      pdf.addImage(vocalImg, 'JPEG', margin + imgWidth + 10, currentY, imgWidth, imgHeight);
    }
    currentY += imgHeight + 10;

    // Brief bio
    addText(config.artist.briefBio, 12);
    addSpace(10);

    onProgress?.(30);

    // ===== HIGHLIGHTS SECTION (SPOTLIGHTS) =====
    checkPageBreak(60);
    if (currentY > margin + 20) {
      pdf.addPage();
      currentY = margin;
    }

    addHeader('Highlights', 18);
    addSpace(10);

    // Add each spotlight
    if (config.spotlights && config.spotlights.length > 0) {
      for (const spotlight of config.spotlights) {
        checkPageBreak(100);

        // Spotlight title
        addSubheader(spotlight.title, 14);

        // Spotlight image
        const spotlightImg = await loadImage(spotlight.imageUrl);
        if (spotlightImg) {
          const dims = await getImageDimensions(spotlightImg);
          const spotlightImgWidth = contentWidth;

          let spotlightImgHeight;
          if (dims.width > 0 && dims.height > 0) {
            // Maintain aspect ratio
            const aspectRatio = dims.height / dims.width;
            spotlightImgHeight = spotlightImgWidth * aspectRatio;

            // Limit height if it's too tall (e.g. portrait images taking up whole page)
            const maxHeight = pageHeight * 0.6;
            if (spotlightImgHeight > maxHeight) {
              spotlightImgHeight = maxHeight;
              const newWidth = spotlightImgHeight / aspectRatio;
              const xOffset = (contentWidth - newWidth) / 2;

              checkPageBreak(spotlightImgHeight + 10);
              pdf.addImage(spotlightImg, 'JPEG', margin + xOffset, currentY, newWidth, spotlightImgHeight);
            } else {
              checkPageBreak(spotlightImgHeight + 10);
              pdf.addImage(spotlightImg, 'JPEG', margin, currentY, spotlightImgWidth, spotlightImgHeight);
            }
          } else {
            // Fallback if dimensions load failed
            spotlightImgHeight = spotlightImgWidth * 0.5625; // 16:9
            checkPageBreak(spotlightImgHeight + 10);
            pdf.addImage(spotlightImg, 'JPEG', margin, currentY, spotlightImgWidth, spotlightImgHeight);
          }

          currentY += spotlightImgHeight + 8;
        }

        // Spotlight subtitle
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(12);
        pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
        pdf.text(spotlight.subtitle, margin, currentY);
        currentY += 8;

        // Spotlight description
        addText(spotlight.description, 11);
        addSpace(2);

        // Spotlight features
        if (spotlight.features && spotlight.features.length > 0) {
          spotlight.features.forEach((feature: any) => {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(10);
            pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
            pdf.text(`• ${feature.title}:`, margin + 5, currentY);
            currentY += 5;

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(10);
            pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
            const featureLines = pdf.splitTextToSize(feature.description, contentWidth - 10);
            pdf.text(featureLines, margin + 10, currentY);
            currentY += (featureLines.length * 10 * 0.4) + 3;
          });
        }

        addSpace(15);
      }
    }

    onProgress?.(40);

    // ===== ABOUT SECTION =====
    checkPageBreak(60);
    if (currentY > margin + 20) {
      pdf.addPage();
      currentY = margin;
    }

    addHeader('About', 18);
    addSpace(5);
    config.artist.fullBio.forEach((block: any) => {
      // Handle rich text blocks or fallback string
      if (typeof block === 'string') {
        checkPageBreak();
        addText(block);
        addSpace(3);
      } else {
        if (block.type === 'heading') {
          checkPageBreak(30);
          addSpace(5);
          addSubheader(block.content, 14);
          addSpace(2);
        } else if (block.type === 'list') {
          if (block.items && Array.isArray(block.items)) {
            block.items.forEach((item: string) => {
              checkPageBreak();
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(11);
              pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
              // Add bullet point
              pdf.text('•', margin + 2, currentY);

              // Add item text
              const lines = pdf.splitTextToSize(item, contentWidth - 10);
              pdf.text(lines, margin + 8, currentY);
              currentY += (lines.length * 11 * 0.4) + 3;
            });
            addSpace(3);
          }
        } else {
          // Paragraph (default)
          checkPageBreak();
          addText(block.content || '');
          addSpace(3);
        }
      }
    });

    onProgress?.(50);

    // ===== MUSIC SECTION =====
    checkPageBreak(60);
    if (currentY > margin + 20) {
      pdf.addPage();
      currentY = margin;
    }

    addHeader('Music', 20);
    addSpace(10);

    config.music.categories.forEach((category: any, catIndex: number) => {
      checkPageBreak();
      addSubheader(category.name, 14);
      addText(category.description, 10);
      addSpace(3);

      // Iterate through subcategories
      if (category.subcategories && Array.isArray(category.subcategories)) {
        category.subcategories.forEach((subcategory: any) => {
          checkPageBreak();

          // Subcategory name
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
          pdf.text(`${subcategory.name}:`, margin + 5, currentY);
          currentY += 6;

          // Videos in this subcategory
          if (subcategory.videos && Array.isArray(subcategory.videos)) {
            subcategory.videos.forEach((video: any) => {
              // Extract video ID from various YouTube URL formats
              let videoId = '';
              try {
                const url = new URL(video.url);
                if (url.hostname.includes('youtu.be')) {
                  videoId = url.pathname.slice(1).split('?')[0];
                } else if (url.hostname.includes('youtube.com')) {
                  videoId = url.searchParams.get('v') || url.pathname.split('/').pop() || '';
                }
              } catch {
                videoId = video.url.split('/').pop()?.split('?')[0] || '';
              }

              const youtubeLink = videoId ? `https://www.youtube.com/watch?v=${videoId}` : video.url;
              addLink(`  • ${video.title}`, youtubeLink, 9);
            });
          }

          addSpace(5);
        });
      }

      addSpace(8);
    });

    onProgress?.(65);

    // ===== GALLERY SECTION =====
    checkPageBreak(60);
    if (currentY > margin + 20) {
      pdf.addPage();
      currentY = margin;
    }

    addHeader('Performance Gallery', 20);
    addSpace(10);

    // Load gallery images
    const galleryImages = config.gallery.images.slice(0, 6); // Limit to 6 images
    const galleryImgWidth = (contentWidth - 10) / 2;
    const galleryImgHeight = galleryImgWidth * 0.67;

    for (let i = 0; i < galleryImages.length; i += 2) {
      checkPageBreak(galleryImgHeight + 20);

      const img1 = await loadImage(galleryImages[i].src);
      if (img1) {
        pdf.addImage(img1, 'JPEG', margin, currentY, galleryImgWidth, galleryImgHeight);
        pdf.setFontSize(9);
        pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
        pdf.text(galleryImages[i].caption, margin, currentY + galleryImgHeight + 4);
      }

      if (i + 1 < galleryImages.length) {
        const img2 = await loadImage(galleryImages[i + 1].src);
        if (img2) {
          pdf.addImage(img2, 'JPEG', margin + galleryImgWidth + 10, currentY, galleryImgWidth, galleryImgHeight);
          pdf.setFontSize(9);
          pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
          pdf.text(galleryImages[i + 1].caption, margin + galleryImgWidth + 10, currentY + galleryImgHeight + 4);
        }
      }

      currentY += galleryImgHeight + 15;
    }

    onProgress?.(75);

    // ===== PRESS SECTION =====
    checkPageBreak(60);
    if (currentY > margin + 20) {
      pdf.addPage();
      currentY = margin;
    }

    addHeader('Press & Recognition', 20);
    addSpace(10);

    config.press.articles.forEach((article: any) => {
      checkPageBreak();
      addSubheader(article.title, 13);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      pdf.text(`${article.publication} - ${new Date(article.date).toLocaleDateString()}`, margin, currentY);
      currentY += 6;

      addText(article.excerpt, 10);
      addLink(article.title, article.url, 10);
      addSpace(8);
    });

    onProgress?.(85);

    // ===== FAQ SECTION =====
    checkPageBreak(60);
    if (currentY > margin + 20) {
      pdf.addPage();
      currentY = margin;
    }

    addHeader('Frequently Asked Questions', 20);
    addSpace(10);

    config.faq.items.forEach((item: any, index: number) => {
      checkPageBreak();
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
      const qLines = pdf.splitTextToSize(`Q${index + 1}: ${item.question}`, contentWidth);
      pdf.text(qLines, margin, currentY);
      currentY += (qLines.length * 11 * 0.4) + 3;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
      const aLines = pdf.splitTextToSize(`A: ${item.answer}`, contentWidth);
      pdf.text(aLines, margin, currentY);
      currentY += (aLines.length * 10 * 0.4) + 8;
    });

    onProgress?.(92);

    // ===== CONTACT SECTION =====
    checkPageBreak(60);
    if (currentY > margin + 20) {
      pdf.addPage();
      currentY = margin;
    }

    addHeader('Contact', 20);
    addSpace(10);

    addText('For bookings, collaborations, or inquiries, please reach out through the following channels:', 11);
    addSpace(8);

    // Social Media Links
    if (config.socialMedia) {
      if (config.socialMedia.youtube) {
        addLink('YouTube: ' + config.socialMedia.youtube, config.socialMedia.youtube, 11);
        addSpace(3);
      }
      if (config.socialMedia.instagram) {
        addLink('Instagram: ' + config.socialMedia.instagram, config.socialMedia.instagram, 11);
        addSpace(3);
      }
      if (config.socialMedia.facebook) {
        addLink('Facebook: ' + config.socialMedia.facebook, config.socialMedia.facebook, 11);
        addSpace(3);
      }
      if (config.socialMedia.twitter) {
        addLink('Twitter: ' + config.socialMedia.twitter, config.socialMedia.twitter, 11);
        addSpace(3);
      }
      if (config.socialMedia.linkedin) {
        addLink('LinkedIn: ' + config.socialMedia.linkedin, config.socialMedia.linkedin, 11);
        addSpace(3);
      }
    }

    addSpace(10);
    addText('Thank you for your interest in my musical journey. I look forward to connecting with you!', 11);

    onProgress?.(95);

    // Add footer to all pages
    const totalPages = pdf.getNumberOfPages();
    const generationDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);

      // Left: Date
      pdf.text(
        `Generated: ${generationDate}`,
        margin,
        pageHeight - 10
      );

      // Center: Artist Name
      pdf.text(
        `${config.artist.name} - Portfolio`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Right: Page Numbers
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      );
    }

    // Download the PDF
    const fileName = `${config.artist.name.replace(/\s+/g, '_')}_Portfolio_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    onProgress?.(100);

    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
