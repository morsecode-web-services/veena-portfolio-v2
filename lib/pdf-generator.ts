import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { getBasePath, getAssetPath } from './config';
import { extractYoutubeId } from './utils';
import { supabase } from './supabase';

export interface PDFGenerationOptions {
  onProgress?: (progress: number) => void;
  includeLinks?: boolean;
}

export interface PDFGenerationResult {
  success: boolean;
  error?: string;
}

// Color palette
const COLORS = {
  navy: { r: 20, g: 33, b: 61 },      // #14213d
  gold: { r: 184, g: 134, b: 11 },    // #b8860b
  cream: { r: 250, g: 248, b: 245 },  // #faf8f5
  gray: { r: 107, g: 114, b: 128 },   // #6b7280
  charcoal: { r: 64, g: 64, b: 64 },  // #404040
  slate: { r: 51, g: 65, b: 85 },     // #334155
  white: { r: 255, g: 255, b: 255 },
  lightGray: { r: 240, g: 240, b: 240 },
};

// Premium minimal gradient schemes with enhanced visibility
// Each section gets unique color variation for visual interest
const GRADIENT_SCHEMES = {
  cover: {
    start: { r: 250, g: 248, b: 245 },  // Cream
    end: { r: 255, g: 255, b: 255 },    // White
    angle: 180, // vertical (top to bottom)
  },
  about: {
    start: { r: 235, g: 240, b: 248 },  // Light navy-tinted blue
    end: { r: 255, g: 255, b: 255 },    // Pure white
    angle: 135, // diagonal
  },
  featuredCarousel: {
    start: { r: 255, g: 248, b: 235 },  // Light gold/warm cream
    end: { r: 250, g: 248, b: 245 },    // Cream
    angle: 180, // vertical
  },
  music: {
    start: { r: 250, g: 248, b: 245 },  // Cream
    end: { r: 242, g: 244, b: 250 },    // Light navy tint
    angle: 135, // diagonal
  },
  gallery: {
    start: { r: 252, g: 246, b: 238 },  // Warm cream
    end: { r: 248, g: 252, b: 255 },    // Cool white
    angle: 180, // vertical
  },
  press: {
    start: { r: 248, g: 245, b: 250 },  // Subtle lavender tint
    end: { r: 255, g: 255, b: 255 },    // White
    angle: 135, // diagonal
  },
  contact: {
    start: { r: 245, g: 248, b: 250 },  // Cool light blue
    end: { r: 250, g: 248, b: 245 },    // Cream
    angle: 180, // vertical
  },
};

// Layout constants
const MARGIN = 20;
const LINE_HEIGHT_SCALE = 0.4;

interface Cursor {
  y: number;
}

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
    const basePath = getBasePath().replace(/\/$/, '');
    const configPath = '/config/site-config.json'.replace(/^\//, '');
    const fullPath = basePath ? `${basePath}/${configPath}` : `/${configPath}`;

    const response = await fetch(fullPath);
    if (!response.ok) {
      throw new Error(`Failed to load site configuration from ${fullPath}`);
    }
    const config = await response.json();

    // Fetch Videos from Supabase
    const { data: dbVideos } = await supabase
      .from('videos')
      .select('*')
      .order('order_index', { ascending: true });

    onProgress?.(10);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Helper to load fonts
    await loadCustomFonts(pdf, basePath);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - (MARGIN * 2);

    // Initialize Cursor
    const cursor: Cursor = { y: MARGIN };

    // --- Helpers ---

    const setFontHeader = (size: number = 24) => {
      try {
        pdf.setFont('PlayfairDisplay', 'bold');
      } catch {
        pdf.setFont('times', 'bold');
      }
      pdf.setFontSize(size);
      pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    };

    const setFontSubheader = (size: number = 16) => {
      try {
        pdf.setFont('PlayfairDisplay', 'bold');
      } catch {
        pdf.setFont('helvetica', 'bold');
      }
      pdf.setFontSize(size);
      pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    };

    const setFontBody = (size: number = 12, bold = false) => {
      try {
        pdf.setFont('Inter', bold ? 'bold' : 'normal');
      } catch {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      }
      pdf.setFontSize(size);
      pdf.setTextColor(COLORS.charcoal.r, COLORS.charcoal.g, COLORS.charcoal.b);
    };

    const setFontAccent = (size: number = 10) => {
      try {
        pdf.setFont('Inter', 'normal');
      } catch {
        pdf.setFont('helvetica', 'italic');
      }
      pdf.setFontSize(size);
      pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    };

    const calculateTextHeight = (
      text: string,
      fontSize: number,
      maxWidth: number
    ): number => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      const lineHeight = fontSize * LINE_HEIGHT_SCALE + 1; // 1mm line spacing
      return lines.length * lineHeight;
    };

    const addText = async (text: string, size: number = 12, bold = false) => {
      setFontBody(size, bold);
      const lines = pdf.splitTextToSize(text, contentWidth);
      const lineHeight = size * LINE_HEIGHT_SCALE + 1;

      for (const line of lines) {
        // Check before each line
        if (cursor.y + lineHeight > pageHeight - MARGIN) {
          await addNewPage();
          cursor.y = MARGIN;
        }

        pdf.text(line, MARGIN, cursor.y);
        cursor.y += lineHeight;
      }

      cursor.y += 3; // Extra spacing after paragraph
    };

    const addLink = async (text: string, url: string, size: number = 12, withQR = false, x = MARGIN) => {
      setFontBody(size);
      pdf.setTextColor(0, 102, 204);

      pdf.text(text, x, cursor.y);

      if (includeLinks) {
        const textWidth = pdf.getTextWidth(text);
        pdf.link(x, cursor.y - size * 0.7, textWidth, size, { url });
      }

      const textHeight = size * LINE_HEIGHT_SCALE + 2;

      if (withQR) {
        try {
          // Reduced resolution for smaller file size (was 200)
          const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 128 });
          // Increased physicial size on paper (mm)
          const qrSize = 25;
          const xPos = pageWidth - MARGIN - qrSize;
          // Align top of QR mostly with top of text (approx adjustment)
          pdf.addImage(qrDataUrl, 'PNG', xPos, cursor.y - size * 0.8, qrSize, qrSize);
        } catch (e) {
          console.warn("Failed to generate QR code", e);
        }
      }

      // Add extra spacing if QR is present to accommodate its height
      // 3mm standard spacing, or enough to clear the QR code + padding
      const spacing = withQR ? 28 : 3;
      cursor.y += textHeight + spacing;
    };

    const renderGradientBackground = (sectionType: keyof typeof GRADIENT_SCHEMES) => {
      try {
        const gradientOpacity = config.pdf?.gradients?.opacity ?? 0.65; // Enhanced visibility while maintaining elegance
        const scheme = GRADIENT_SCHEMES[sectionType];

        console.log(`[PDF] Rendering gradient for section: ${sectionType}, opacity: ${gradientOpacity}`);

        // Create canvas for gradient
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('[PDF] Failed to get canvas context for gradient');
          return;
        }

        // Reduced resolution to 3x for smaller file size (was 10x)
        canvas.width = pageWidth * 3;
        canvas.height = pageHeight * 3;

        // Calculate gradient direction based on angle
        let x0 = 0, y0 = 0, x1 = 0, y1 = canvas.height;
        if (scheme.angle === 135) {
          // Diagonal: top-left to bottom-right
          x0 = 0;
          y0 = 0;
          x1 = canvas.width;
          y1 = canvas.height;
        } else if (scheme.angle === 180) {
          // Vertical: top to bottom
          x0 = 0;
          y0 = 0;
          x1 = 0;
          y1 = canvas.height;
        }

        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);

        gradient.addColorStop(0, `rgb(${scheme.start.r}, ${scheme.start.g}, ${scheme.start.b})`);
        gradient.addColorStop(1, `rgb(${scheme.end.r}, ${scheme.end.g}, ${scheme.end.b})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Use JPEG with 70% quality instead of PNG for much smaller file size
        const gradientImage = canvas.toDataURL('image/jpeg', 0.7);

        // Add to PDF with opacity
        pdf.saveGraphicsState();
        pdf.setGState(new (pdf as any).GState({ opacity: gradientOpacity }));
        pdf.addImage(gradientImage, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        pdf.restoreGraphicsState();

        console.log(`[PDF] Gradient rendered successfully for ${sectionType}`);
      } catch (e) {
        console.error("[PDF] Failed to render gradient background", e);
      }
    };

    const renderGrayscaleBackgroundLegacy = async (imageSrc: string) => {
      try {
        const bgOpacity = config.pdf?.backgroundOpacity ?? 0.12;
        const bgBrightness = config.pdf?.backgroundBrightness ?? 0.8;

        const imgData = await loadImage(imageSrc);
        if (!imgData) return;

        // Use canvas to convert to grayscale if in browser
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgData;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            // Weighted grayscale for more natural tones
            const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            // Apply configurable brightness adjustment
            const adjustedAvg = avg * bgBrightness;
            data[i] = adjustedAvg;
            data[i + 1] = adjustedAvg;
            data[i + 2] = adjustedAvg;
          }
          ctx.putImageData(imageData, 0, 0);
        }

        const grayscaleData = canvas.toDataURL('image/jpeg', 0.6);

        // Add to PDF with configurable opacity
        pdf.saveGraphicsState();
        pdf.setGState(new (pdf as any).GState({ opacity: bgOpacity }));

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Cover full page, maintaining aspect ratio (center crop)
        const imgProps = pdf.getImageProperties(grayscaleData);
        const ratio = imgProps.width / imgProps.height;
        const pageRatio = pdfWidth / pdfHeight;

        let renderW, renderH, x, y;
        if (ratio > pageRatio) {
          renderH = pdfHeight;
          renderW = pdfHeight * ratio;
          x = (pdfWidth - renderW) / 2;
          y = 0;
        } else {
          renderW = pdfWidth;
          renderH = pdfWidth / ratio;
          x = 0;
          y = (pdfHeight - renderH) / 2;
        }

        pdf.addImage(grayscaleData, 'JPEG', x, y, renderW, renderH, undefined, 'FAST');

        // Premium touch: subtle cream overlay to "feather" edges if background is present
        pdf.saveGraphicsState();
        pdf.setGState(new (pdf as any).GState({ opacity: 0.05 }));
        pdf.setFillColor(COLORS.cream.r, COLORS.cream.g, COLORS.cream.b);
        // Draw very thin rectangles at edges to fade the background
        pdf.rect(0, 0, pageWidth, 5, 'F'); // Top
        pdf.rect(0, pageHeight - 5, pageWidth, 5, 'F'); // Bottom
        pdf.rect(0, 0, 5, pageHeight, 'F'); // Left
        pdf.rect(pageWidth - 5, 0, 5, pageHeight, 'F'); // Right
        pdf.restoreGraphicsState();

        pdf.restoreGraphicsState();
      } catch (e) {
        console.warn("Failed to render background image", e);
      }
    };

    const drawPremiumElements = () => {
      // 1. Page Border (Subtle Gold)
      pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
      pdf.setLineWidth(0.4);
      // Main border frame
      pdf.rect(5, 5, pageWidth - 10, pageHeight - 10);
    };

    let backgroundIndex = 0;
    const galleryImages = config.gallery?.images || [];
    let currentSection: keyof typeof GRADIENT_SCHEMES = 'cover';

    const addNewPage = async (sectionType?: keyof typeof GRADIENT_SCHEMES) => {
      if (sectionType) {
        currentSection = sectionType;
      }
      pdf.addPage();

      const useGradients = config.pdf?.gradients?.enabled ?? true; // Default to gradients

      if (useGradients) {
        renderGradientBackground(currentSection); // Gradient FIRST (background)
      } else if (galleryImages.length > 0) {
        // Legacy: grayscale image backgrounds
        const bgImg = galleryImages[backgroundIndex % galleryImages.length];
        await renderGrayscaleBackgroundLegacy(bgImg.src);
        backgroundIndex++;
      }

      drawPremiumElements(); // Border AFTER (on top)
    };

    const checkPageBreak = async (
      neededSpace: number = 40,
      actualContent?: { text: string; fontSize: number; width: number }
    ): Promise<boolean> => {
      let requiredSpace = neededSpace;

      // Calculate actual space if content provided
      if (actualContent) {
        requiredSpace = calculateTextHeight(
          actualContent.text,
          actualContent.fontSize,
          actualContent.width
        ) + 10; // Add 10mm buffer
      }

      if (cursor.y + requiredSpace > pageHeight - MARGIN) {
        await addNewPage();
        cursor.y = MARGIN;
        return true;
      }
      return false;
    };

    const loadImage = async (url: string): Promise<string | null> => {
      return loadExternalImage(url, basePath);
    };

    // --- Sections ---

    // 1. Cover Page
    onProgress?.(15);
    currentSection = 'cover';
    const useGradients = config.pdf?.gradients?.enabled ?? true;
    console.log(`[PDF] Starting cover page, useGradients: ${useGradients}`);
    if (useGradients) {
      renderGradientBackground('cover');
    }
    drawPremiumElements(); // Add border to cover page too
    await renderCoverPage(pdf, config, pageWidth, pageHeight, loadImage, useGradients);

    // Start Content on new page
    await addNewPage('about');
    cursor.y = MARGIN;

    // 2. About
    onProgress?.(30);
    await renderAboutSection(pdf, config, contentWidth, pageHeight, cursor, addHeader, addNewPage);

    // 3. Featured Carousel
    onProgress?.(45);
    await checkPageBreak(60);
    addHeader(pdf, 'Highlights', cursor, setFontHeader);
    cursor.y += 15;

    if (config.home.featuredCarousel?.enabled && config.home.featuredCarousel.items) {
      await renderFeaturedCarousel(
        pdf,
        config.home.featuredCarousel.items,
        contentWidth,
        pageHeight,
        cursor,
        loadImage,
        addNewPage
      );
    }

    // 4. Music
    onProgress?.(60);
    await checkPageBreak(60);
    addHeader(pdf, 'Music', cursor, setFontHeader);
    cursor.y += 10;
    await renderMusicSection(pdf, config.music, dbVideos || [], cursor, addLink, loadImage, addNewPage);

    // 5. Gallery
    onProgress?.(75);
    await addNewPage('gallery');
    cursor.y = MARGIN;
    addHeader(pdf, 'Performance Gallery', cursor, setFontHeader);
    cursor.y += 15;
    await renderGallery(pdf, config.gallery?.images || [], contentWidth, pageHeight, cursor, loadImage, addNewPage);

    // 6. Press
    if (config.sections?.press) {
      onProgress?.(85);
      await addNewPage('press');
      cursor.y = MARGIN;
      addHeader(pdf, 'Press & Recognition', cursor, setFontHeader);
      cursor.y += 10;
      if (config.press?.articles) {
        for (const article of config.press.articles) {
          // Calculate full article height
          const titleHeight = 13;
          const excerptLines = Math.ceil(article.excerpt.length / 100);
          const excerptHeight = excerptLines * 12;
          const metaHeight = 8; // Date + publication lines
          const totalArticleHeight = titleHeight + excerptHeight + metaHeight + 10;

          // Check if full article fits
          if (cursor.y + totalArticleHeight > pageHeight - MARGIN) {
            await addNewPage('press');
            cursor.y = MARGIN;
          }

          setFontSubheader(13);
          pdf.text(article.title, MARGIN, cursor.y);
          cursor.y += 6;

          setFontAccent(10);
          pdf.text(`${article.publication} - ${new Date(article.date).toLocaleDateString()}`, MARGIN, cursor.y);
          cursor.y += 6;

          await addText(article.excerpt, 10);
          await addLink(article.title, article.url, 10);
          cursor.y += 5;
        }
      }
    }

    // 7. Contact
    onProgress?.(95);
    await checkPageBreak(60);
    addHeader(pdf, 'Contact', cursor, setFontHeader);
    cursor.y += 10;

    addText("For bookings, collaborations, or inquiries, please reach out:", 11);
    cursor.y += 5;

    if (config.artist.email) {
      await addLink(`Email: ${config.artist.email}`, `mailto:${config.artist.email}`, 12, false);
    }

    if (config.socialMedia) {
      if (config.socialMedia.youtube) await addLink('YouTube Channel', config.socialMedia.youtube, 12, true);
      if (config.socialMedia.instagram) await addLink('Instagram Profile', config.socialMedia.instagram, 12, true);
      if (config.socialMedia.linkedin) await addLink('LinkedIn Profile', config.socialMedia.linkedin, 12, true);
      if (config.socialMedia.facebook) await addLink('Facebook Page', config.socialMedia.facebook, 12, true);
      if (config.socialMedia.twitter) await addLink('Twitter Profile', config.socialMedia.twitter, 12, true);
    }

    addFooter(pdf, config, pageWidth, pageHeight);

    // Save
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `${config.artist.name.replace(/\s+/g, '_')}_Portfolio_${dateStr}.pdf`;
    pdf.save(fileName);

    onProgress?.(100);
    return { success: true };

  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// --- Helper Functions ---

async function loadCustomFonts(pdf: jsPDF, basePath: string) {
  const fonts = [
    { name: 'PlayfairDisplay', style: 'bold', file: 'PlayfairDisplay-Bold.ttf' },
    { name: 'Inter', style: 'normal', file: 'Inter-Regular.ttf' },
    { name: 'Inter', style: 'bold', file: 'Inter-Bold.ttf' },
  ];

  for (const font of fonts) {
    try {
      const url = basePath ? `${basePath}/fonts/${font.file}` : `/fonts/${font.file}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const text = await resp.clone().text();
        if (text.startsWith('404') || text.includes('Not Found') || text.length < 1000) {
          console.warn(`Invalid font file detected for ${font.file}`);
          continue;
        }

        const blob = await resp.blob();
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            if (result && result.includes(',')) {
              const base64 = result.split(',')[1];
              if (base64) {
                try {
                  pdf.addFileToVFS(font.file, base64);
                  pdf.addFont(font.file, font.name, font.style);
                } catch (fontError) {
                  console.warn(`Failed to add font ${font.file} to jsPDF`, fontError);
                }
              }
            }
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } else {
        console.warn(`Could not load font ${font.file}: ${resp.status}`);
      }
    } catch (e) {
      console.warn(`Error loading font ${font.file}`, e);
    }
  }
}

async function renderCoverPage(pdf: jsPDF, config: any, pageWidth: number, pageHeight: number, loadImg: any, useGradients: boolean = true) {
  // Premium minimal design with full-bleed hero image

  // 1. Load and add full-bleed hero image (use the hero background image)
  let heroImgUrl = config.home?.heroBackground || '/images/home/hero-bg.jpg';

  if (heroImgUrl) {
    const imgData = await loadImg(heroImgUrl);
    if (imgData) {
      const props = pdf.getImageProperties(imgData);
      const imgRatio = props.width / props.height;
      const pageRatio = pageWidth / pageHeight;

      let renderW, renderH, renderX, renderY;

      // Cover full page while maintaining aspect ratio
      if (imgRatio > pageRatio) {
        renderH = pageHeight;
        renderW = pageHeight * imgRatio;
        renderX = (pageWidth - renderW) / 2;
        renderY = 0;
      } else {
        renderW = pageWidth;
        renderH = pageWidth / imgRatio;
        renderX = 0;
        renderY = (pageHeight - renderH) / 2;
      }

      pdf.addImage(imgData, 'JPEG', renderX, renderY, renderW, renderH, undefined, 'MEDIUM');

      // Subtle gradient overlays for text legibility
      // Dark overlay at top for name
      pdf.setFillColor(0, 0, 0);
      pdf.setGState(new (pdf as any).GState({ opacity: 0.4 }));
      pdf.rect(0, 0, pageWidth, 60, 'F');

      // Dark overlay at bottom for portfolio text
      pdf.setGState(new (pdf as any).GState({ opacity: 0.5 }));
      pdf.rect(0, pageHeight - 50, pageWidth, 50, 'F');

      pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
    }
  }

  // 2. Elegant thin gold line at top
  pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, MARGIN + 8, pageWidth - MARGIN, MARGIN + 8);

  // 3. Artist Name (Top, centered, elegant serif)
  try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('times', 'bold'); }
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);

  const nameWidth = pdf.getTextWidth(config.artist.name);
  const nameX = (pageWidth - nameWidth) / 2;
  pdf.text(config.artist.name, nameX, MARGIN + 25);

  // 4. Tagline (Small, gold, centered below name)
  try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
  pdf.setFontSize(10);
  pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);

  const taglineWidth = pdf.getTextWidth(config.artist.tagline.toUpperCase());
  const taglineX = (pageWidth - taglineWidth) / 2;
  pdf.text(config.artist.tagline.toUpperCase(), taglineX, MARGIN + 35);

  // 5. Elegant thin gold line at bottom section
  pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN, pageHeight - 40, pageWidth - MARGIN, pageHeight - 40);

  // 6. "PORTFOLIO" - centered, elegant
  try { pdf.setFont('Inter', 'bold'); } catch { pdf.setFont('helvetica', 'bold'); }
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);

  const portfolioText = 'PORTFOLIO';
  const portfolioWidth = pdf.getTextWidth(portfolioText);
  const portfolioX = (pageWidth - portfolioWidth) / 2;
  pdf.text(portfolioText, portfolioX, pageHeight - 28);

  // 7. Date - centered, subtle
  try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);

  const dateText = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' }).toUpperCase();
  const dateWidth = pdf.getTextWidth(dateText);
  const dateX = (pageWidth - dateWidth) / 2;
  pdf.text(dateText, dateX, pageHeight - 18);

  // 8. Contact - centered at very bottom
  pdf.setFontSize(8);
  const contactText = config.artist.email || 'aishwaryamanikarnike.com';
  const contactWidth = pdf.getTextWidth(contactText);
  const contactX = (pageWidth - contactWidth) / 2;
  pdf.text(contactText, contactX, pageHeight - MARGIN - 5);
}

function addFooter(pdf: jsPDF, config: any, pageWidth: number, pageHeight: number) {
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1) continue;
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setTextColor(COLORS.gray.r, COLORS.gray.g, COLORS.gray.b);
    pdf.text(`${config.artist.name} - Portfolio`, MARGIN, pageHeight - 10);
    pdf.text(`Page ${i - 1} of ${totalPages - 1}`, pageWidth - MARGIN, pageHeight - 10, { align: 'right' });
  }
}

async function loadExternalImage(url: string, basePath: string): Promise<string | null> {
  try {
    let finalUrl = url;
    if (url.startsWith('/') && !url.startsWith('//')) {
      const sanitizedUrl = url.replace(/^\//, '');
      finalUrl = basePath ? `${basePath}/${sanitizedUrl}` : `/${sanitizedUrl}`;
    }
    const response = await fetch(finalUrl);
    const blob = await response.blob();

    // Check if image is PNG (preserve transparency)
    const isPNG = blob.type === 'image/png' || url.toLowerCase().endsWith('.png');

    // Resize image to reduce file size
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback to original if canvas fails
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
          return;
        }

        // Limit max dimensions to 1200px (sufficient for PDF quality)
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // For PNG, preserve transparency by not filling background
        if (!isPNG) {
          // For JPEG, fill with white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG format for transparency, use JPEG for others
        if (isPNG) {
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        }
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });
  } catch (e) {
    console.error("Image load fail", e);
    return null;
  }
}

function addHeader(pdf: jsPDF, text: string, cursor: Cursor, setFontFn: (s: number) => void) {
  setFontFn(20);
  pdf.text(text, MARGIN, cursor.y);

  // Gold underline spanning full text width
  const textWidth = pdf.getTextWidth(text);
  pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, cursor.y + 2, MARGIN + textWidth, cursor.y + 2);
}

async function renderFeaturedCarousel(
  pdf: jsPDF,
  items: any[],
  width: number,
  pageHeight: number,
  cursor: Cursor,
  loadImg: any,
  addNewPage: any
) {
  const IMAGE_WIDTH = 70; // Medium-sized images
  const IMAGE_GAP = 10;
  const ITEM_SPACING = 15;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isImageLeft = i % 2 === 0; // Alternating layout

    // Load image
    let imgData = null;
    let imgHeight = 0;
    if (item.image) {
      imgData = await loadImg(item.image);
      if (imgData) {
        const props = pdf.getImageProperties(imgData);
        const aspectRatio = props.width / props.height;
        imgHeight = IMAGE_WIDTH / aspectRatio;
      }
    }

    // Use pdfDescription if available, otherwise fall back to description
    const description = item.pdfDescription || item.description;

    // Calculate required height for this item
    const textWidth = width - IMAGE_WIDTH - IMAGE_GAP;
    const titleHeight = 10;

    // Calculate description height (for justified text)
    try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
    pdf.setFontSize(11);
    const descLines = pdf.splitTextToSize(description, textWidth);
    const descHeight = descLines.length * 5.5; // Slightly more spacing for justified text

    const totalTextHeight = titleHeight + descHeight;
    const requiredHeight = Math.max(imgHeight, totalTextHeight) + ITEM_SPACING;

    // Check page break
    if (cursor.y + requiredHeight > pageHeight - MARGIN) {
      await addNewPage('featuredCarousel');
      cursor.y = MARGIN;
    }

    const startY = cursor.y;

    if (isImageLeft) {
      // Image on left, text on right
      if (imgData) {
        pdf.addImage(imgData, 'JPEG', MARGIN, startY, IMAGE_WIDTH, imgHeight, undefined, 'MEDIUM');
      }

      const textX = MARGIN + IMAGE_WIDTH + IMAGE_GAP;
      let textY = startY;

      // Title (gold, large serif)
      try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('times', 'bold'); }
      pdf.setFontSize(15);
      pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
      const titleLines = pdf.splitTextToSize(item.title, textWidth);
      pdf.text(titleLines, textX, textY);
      textY += titleLines.length * 6;

      // Description (charcoal, justified)
      try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
      pdf.setFontSize(11);
      pdf.setTextColor(COLORS.charcoal.r, COLORS.charcoal.g, COLORS.charcoal.b);
      pdf.text(description, textX, textY, { maxWidth: textWidth, align: 'justify' });
    } else {
      // Image on right, text on left
      const textX = MARGIN;
      let textY = startY;

      // Title (gold, large serif)
      try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('times', 'bold'); }
      pdf.setFontSize(15);
      pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
      const titleLines = pdf.splitTextToSize(item.title, textWidth);
      pdf.text(titleLines, textX, textY);
      textY += titleLines.length * 6;

      // Description (charcoal, justified)
      try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
      pdf.setFontSize(11);
      pdf.setTextColor(COLORS.charcoal.r, COLORS.charcoal.g, COLORS.charcoal.b);
      pdf.text(description, textX, textY, { maxWidth: textWidth, align: 'justify' });

      // Image on right
      if (imgData) {
        const imgX = MARGIN + textWidth + IMAGE_GAP;
        pdf.addImage(imgData, 'JPEG', imgX, startY, IMAGE_WIDTH, imgHeight, undefined, 'MEDIUM');
      }
    }

    cursor.y += requiredHeight;
  }
}

async function renderAboutSection(
  pdf: jsPDF,
  config: any,
  width: number,
  pageHeight: number,
  cursor: Cursor,
  headerFn: any,
  addNewPage: any
) {
  headerFn(pdf, 'About', cursor, (s: number) => {
    try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('times', 'bold'); }
    pdf.setFontSize(s);
    pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  });
  cursor.y += 10;

  const fullBio = config.artist.fullBio || [];

  for (const block of fullBio) {
    // Check if block is structured or legacy string format
    if (typeof block === 'string') {
      // Legacy format: render as paragraph (justified)
      try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
      pdf.setFontSize(11);
      pdf.setTextColor(COLORS.charcoal.r, COLORS.charcoal.g, COLORS.charcoal.b);

      const lines = pdf.splitTextToSize(block, width);
      const blockHeight = lines.length * 5.5 + 8;

      if (cursor.y + blockHeight > pageHeight - MARGIN) {
        await addNewPage('about');
        cursor.y = MARGIN;
      }

      pdf.text(block, MARGIN, cursor.y, { maxWidth: width, align: 'justify' });
      cursor.y += blockHeight;
      continue;
    }

    // Structured block format
    if (block.type === 'heading') {
      const headingHeight = 12;

      if (cursor.y + headingHeight > pageHeight - MARGIN) {
        await addNewPage('about');
        cursor.y = MARGIN;
      }

      // Gold left border (1.4mm width)
      pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
      pdf.setLineWidth(1.4);
      pdf.line(MARGIN, cursor.y - 4, MARGIN, cursor.y + 5);

      // Heading text
      try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('times', 'bold'); }
      pdf.setFontSize(14);
      pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
      pdf.text(block.content, MARGIN + 4, cursor.y);
      cursor.y += headingHeight;

    } else if (block.type === 'paragraph') {
      try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
      pdf.setFontSize(11);
      pdf.setTextColor(COLORS.charcoal.r, COLORS.charcoal.g, COLORS.charcoal.b);

      const lines = pdf.splitTextToSize(block.content, width);
      const blockHeight = lines.length * 5.5 + 8;

      if (cursor.y + blockHeight > pageHeight - MARGIN) {
        await addNewPage('about');
        cursor.y = MARGIN;
      }

      pdf.text(block.content, MARGIN, cursor.y, { maxWidth: width, align: 'justify' });
      cursor.y += blockHeight;

    } else if (block.type === 'list') {
      try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
      pdf.setFontSize(11);
      pdf.setTextColor(COLORS.charcoal.r, COLORS.charcoal.g, COLORS.charcoal.b);

      for (const item of block.items) {
        const itemLines = pdf.splitTextToSize(item, width - 8);
        const itemHeight = itemLines.length * 5.5 + 2;

        if (cursor.y + itemHeight > pageHeight - MARGIN) {
          await addNewPage('about');
          cursor.y = MARGIN;
        }

        // Gold bullet
        pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
        pdf.text('•', MARGIN, cursor.y);

        // Item text (justified)
        pdf.setTextColor(COLORS.charcoal.r, COLORS.charcoal.g, COLORS.charcoal.b);
        pdf.text(item, MARGIN + 5, cursor.y, { maxWidth: width - 8, align: 'justify' });
        cursor.y += itemHeight;
      }
      cursor.y += 5; // Extra spacing after list
    }
  }
}

async function renderMusicCard(
  pdf: jsPDF,
  video: any,
  x: number,
  y: number,
  width: number,
  height: number,
  loadImageFn: any,
  linkFn: any
): Promise<void> {
  const THUMB_MAX_HEIGHT = 45; // Maximum height constraint
  const TITLE_HEIGHT = 10;

  // 1. Thumbnail area - preserve aspect ratio
  const youtubeId = extractYoutubeId(video.url);
  const thumbUrl = video.thumbnail_url ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null);

  let actualThumbHeight = THUMB_MAX_HEIGHT;
  let thumbWidth = width;
  let thumbX = x;

  if (thumbUrl) {
    try {
      const thumbData = await loadImageFn(thumbUrl);
      if (thumbData) {
        // Calculate actual aspect ratio from loaded image
        const props = pdf.getImageProperties(thumbData);
        const aspectRatio = props.width / props.height;

        // Calculate height to preserve aspect ratio
        actualThumbHeight = width / aspectRatio;

        // Constrain to max height
        if (actualThumbHeight > THUMB_MAX_HEIGHT) {
          actualThumbHeight = THUMB_MAX_HEIGHT;
          // Center-crop horizontally if needed
          const constrainedWidth = THUMB_MAX_HEIGHT * aspectRatio;
          const xOffset = (width - constrainedWidth) / 2;
          thumbWidth = constrainedWidth;
          thumbX = x + xOffset;
          pdf.addImage(thumbData, 'JPEG', thumbX, y, thumbWidth, THUMB_MAX_HEIGHT, undefined, 'MEDIUM');
        } else {
          // Normal: full width, preserved aspect ratio
          pdf.addImage(thumbData, 'JPEG', x, y, width, actualThumbHeight, undefined, 'MEDIUM');
        }
      }
    } catch (e) {
      console.warn("Failed to load video thumbnail", e);
    }
  }

  // 2. Title text area (below thumbnail) - matches actual thumbnail dimensions
  pdf.setFontSize(8);
  pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  try {
    pdf.setFont('Inter', 'bold');
  } catch {
    pdf.setFont('helvetica', 'bold');
  }

  // Text width and position match actual thumbnail for perfect alignment
  const TEXT_WIDTH = thumbWidth;
  const TEXT_START_X = thumbX;

  // Manually truncate text to fit
  let line1 = '';
  let line2 = '';
  const words = video.title.split(' ');

  // Build first line
  for (const word of words) {
    const testLine = line1 ? line1 + ' ' + word : word;
    if (pdf.getTextWidth(testLine) <= TEXT_WIDTH) {
      line1 = testLine;
    } else {
      // Word doesn't fit, start second line
      line2 = word;
      break;
    }
  }

  // Build second line with remaining words
  const remainingWords = words.slice(line1.split(' ').length);
  for (let i = 0; i < remainingWords.length; i++) {
    const word = remainingWords[i];
    const testLine = line2 ? line2 + ' ' + word : word;
    if (pdf.getTextWidth(testLine) <= TEXT_WIDTH) {
      line2 = testLine;
    } else {
      // Doesn't fit - truncate with ellipsis
      if (i > 0) {
        // Already have some words in line2, add ellipsis
        while (pdf.getTextWidth(line2 + '...') > TEXT_WIDTH && line2.length > 0) {
          line2 = line2.slice(0, -1).trim();
        }
        line2 = line2 + '...';
      } else {
        // First word itself is too long, truncate it
        let truncWord = word;
        while (pdf.getTextWidth(truncWord + '...') > TEXT_WIDTH && truncWord.length > 0) {
          truncWord = truncWord.slice(0, -1);
        }
        line2 = truncWord + '...';
      }
      break;
    }
  }

  // If there are more words after line2, add ellipsis
  if (remainingWords.length > line2.split(' ').length && !line2.endsWith('...')) {
    while (pdf.getTextWidth(line2 + '...') > TEXT_WIDTH && line2.length > 0) {
      line2 = line2.slice(0, -1).trim();
    }
    line2 = line2 + '...';
  }

  const displayLines = [line1, line2].filter(l => l);

  // Render text with small spacing below thumbnail
  const lineHeight = 3.2;
  const titleStartY = y + actualThumbHeight + 4; // 4mm spacing below thumbnail

  for (let i = 0; i < displayLines.length; i++) {
    pdf.text(displayLines[i], TEXT_START_X, titleStartY + (i * lineHeight));
  }

  // 3. Make entire card clickable
  if (video.url) {
    pdf.link(x, y, width, height, { url: video.url });
  }
}

async function renderMusicSection(pdf: jsPDF, musicConfig: any, dbVideos: any[], cursor: Cursor, linkFn: any, loadImageFn: any, addNewPage: any) {
  const CARD_WIDTH = 80;
  const CARD_HEIGHT = 55; // 45mm thumbnail + 10mm title
  const CARD_GAP = 10;
  const CARDS_PER_ROW = 2;
  const ROW_SPACING = 8;

  for (let i = 0; i < musicConfig.categories.length; i++) {
    const cat = musicConfig.categories[i];

    // Check if category has any videos before rendering
    let hasVideos = false;
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        const dbMatches = dbVideos.filter(
          v => v.category_id === cat.id && v.subcategory_id === sub.id
        );
        if (dbMatches.length > 0 || (sub.videos && sub.videos.length > 0)) {
          hasVideos = true;
          break;
        }
      }
    }

    // Skip empty categories
    if (!hasVideos) {
      continue;
    }

    // Force new page for second category onwards
    if (i > 0) {
      await addNewPage('music');
      cursor.y = MARGIN;
    } else if (cursor.y > 200) {
      // Safety break for first category
      await addNewPage('music');
      cursor.y = MARGIN;
    }

    // Category header
    try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('helvetica', 'bold'); }
    pdf.setFontSize(16);
    pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    pdf.text(cat.name, MARGIN, cursor.y);

    // Gold underline accent
    pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN, cursor.y + 2, MARGIN + 20, cursor.y + 2);

    cursor.y += 12;

    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        // Merge DB and config videos (deduplicate) BEFORE rendering header
        const seenIds = new Set<string>();
        const mergedVideos: any[] = [];

        // Add DB videos first
        const dbMatches = dbVideos.filter(
          v => v.category_id === cat.id && v.subcategory_id === sub.id
        );
        dbMatches.forEach(v => {
          const id = extractYoutubeId(v.url);
          if (id) {
            seenIds.add(id);
            mergedVideos.push({ title: v.title, url: v.url, thumbnail_url: v.thumbnail_url });
          }
        });

        // Add config videos if unique
        if (sub.videos) {
          sub.videos.forEach((vid: any) => {
            const id = extractYoutubeId(vid.url);
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              mergedVideos.push(vid);
            }
          });
        }

        // Skip this subcategory if no videos
        if (mergedVideos.length === 0) {
          continue;
        }

        // Check if we need a page break before subcategory header
        if (cursor.y > 240) {
          await addNewPage('music');
          cursor.y = MARGIN;
        }

        // Subcategory header (only if we have videos)
        try { pdf.setFont('Inter', 'bold'); } catch { pdf.setFont('helvetica', 'bold'); }
        pdf.setFontSize(12);
        pdf.setTextColor(COLORS.slate.r, COLORS.slate.g, COLORS.slate.b);
        pdf.text(sub.name, MARGIN + 2, cursor.y);
        cursor.y += 10;

        // Render videos as grid
        let startY = cursor.y; // Remember starting Y for this subcategory
        let cardIndex = 0;
        let maxY = startY; // Track the bottom of the lowest row

        for (const vid of mergedVideos) {
          const col = cardIndex % CARDS_PER_ROW;
          const row = Math.floor(cardIndex / CARDS_PER_ROW);

          let cardX = MARGIN + (col * (CARD_WIDTH + CARD_GAP));
          let cardY = startY + (row * (CARD_HEIGHT + ROW_SPACING));

          // Page break check: ensure full row fits on page
          // Only check at start of new row (col === 0)
          if (col === 0 && cardY + CARD_HEIGHT > pdf.internal.pageSize.getHeight() - MARGIN) {
            await addNewPage('music');
            cursor.y = MARGIN;
            cardIndex = 0; // Reset grid for new page
            startY = cursor.y; // Reset start Y for new page
            maxY = startY;

            // Recalculate positions for this video on the new page
            const newCol = cardIndex % CARDS_PER_ROW;
            const newRow = Math.floor(cardIndex / CARDS_PER_ROW);
            cardX = MARGIN + (newCol * (CARD_WIDTH + CARD_GAP));
            cardY = startY + (newRow * (CARD_HEIGHT + ROW_SPACING));
          }

          await renderMusicCard(
            pdf,
            vid,
            cardX,
            cardY,
            CARD_WIDTH,
            CARD_HEIGHT,
            loadImageFn,
            linkFn
          );

          // Track the maximum Y position
          maxY = Math.max(maxY, cardY + CARD_HEIGHT);
          cardIndex++;
        }

        // Update cursor to after the last row
        cursor.y = maxY + ROW_SPACING;

        // Extra spacing after subcategory
        cursor.y += 4;
      }
    }

    // Extra spacing after category
    cursor.y += 6;
  }
}

async function renderGallery(pdf: jsPDF, images: any[], width: number, pageHeight: number, cursor: Cursor, loadImg: any, addNewPage: any) {
  const imgW = (width - 10) / 2;
  const imgH = imgW * 0.67;

  for (let i = 0; i < Math.min(images.length, 6); i += 2) {
    if (cursor.y + imgH > pageHeight - MARGIN) {
      await addNewPage('gallery');
      cursor.y = MARGIN;
    }

    const img1 = await loadImg(images[i].src);
    if (img1) {
      pdf.addImage(img1, 'JPEG', MARGIN, cursor.y, imgW, imgH, undefined, 'MEDIUM');
      pdf.setFontSize(9);
      pdf.text(images[i].caption || '', MARGIN, cursor.y + imgH + 5);
    }

    if (i + 1 < images.length) {
      const img2 = await loadImg(images[i + 1].src);
      if (img2) {
        pdf.addImage(img2, 'JPEG', MARGIN + imgW + 10, cursor.y, imgW, imgH, undefined, 'MEDIUM');
        pdf.text(images[i + 1].caption || '', MARGIN + imgW + 10, cursor.y + imgH + 5);
      }
    }
    cursor.y += imgH + 15;
  }
}
