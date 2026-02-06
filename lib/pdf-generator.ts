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
  black: { r: 10, g: 10, b: 10 },     // #0a0a0a
  slate: { r: 51, g: 65, b: 85 },     // #334155
  white: { r: 255, g: 255, b: 255 },
  lightGray: { r: 240, g: 240, b: 240 },
};

// Gradient schemes for different sections - light, fun pastels with elegant aesthetic
const GRADIENT_SCHEMES = {
  cover: {
    start: { r: 255, g: 228, b: 230 },  // Soft blush pink
    end: { r: 255, g: 250, b: 245 },    // Warm white
    angle: 180, // vertical (top to bottom)
  },
  about: {
    start: { r: 224, g: 242, b: 254 },  // Light sky blue
    end: { r: 255, g: 255, b: 255 },    // Pure white
    angle: 135, // diagonal
  },
  spotlights: {
    start: { r: 237, g: 233, b: 254 },  // Soft lavender
    end: { r: 252, g: 231, b: 243 },    // Light pink
    angle: 180, // vertical
  },
  music: {
    start: { r: 204, g: 251, b: 241 },  // Mint/teal
    end: { r: 224, g: 242, b: 254 },    // Light blue
    angle: 135, // diagonal
  },
  gallery: {
    start: { r: 254, g: 235, b: 220 },  // Soft peach
    end: { r: 255, g: 250, b: 245 },    // Warm white
    angle: 180, // vertical
  },
  press: {
    start: { r: 254, g: 215, b: 215 },  // Light coral/rose
    end: { r: 255, g: 237, b: 240 },    // Blush white
    angle: 135, // diagonal
  },
  contact: {
    start: { r: 219, g: 234, b: 254 },  // Sky blue
    end: { r: 237, g: 233, b: 254 },    // Lavender
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
      pdf.setTextColor(COLORS.black.r, COLORS.black.g, COLORS.black.b);
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
          // Increased resolution for better print quality
          const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 200 });
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
        const gradientOpacity = config.pdf?.gradients?.opacity ?? 0.6; // Increased from 0.3 to 0.6 for visibility
        const scheme = GRADIENT_SCHEMES[sectionType];

        console.log(`[PDF] Rendering gradient for section: ${sectionType}, opacity: ${gradientOpacity}`);

        // Create canvas for gradient
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('[PDF] Failed to get canvas context for gradient');
          return;
        }

        // High resolution for quality
        canvas.width = pageWidth * 10;
        canvas.height = pageHeight * 10;

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

        const gradientImage = canvas.toDataURL('image/png');

        // Add to PDF with opacity
        pdf.saveGraphicsState();
        pdf.setGState(new (pdf as any).GState({ opacity: gradientOpacity }));
        pdf.addImage(gradientImage, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
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
    renderAboutSection(pdf, config, contentWidth, cursor, addHeader);

    // 3. Spotlights
    onProgress?.(45);
    await checkPageBreak(60);
    addHeader(pdf, 'Spotlights', cursor, setFontHeader);
    cursor.y += 15;

    if (config.spotlights) {
      for (const spotlight of config.spotlights) {
        await renderSpotlight(pdf, spotlight, contentWidth, pageHeight, cursor, loadImage, addNewPage);
      }
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
  // Background - Split design (only if gradients are disabled)
  if (!useGradients) {
    // Top 2/3 Cream
    pdf.setFillColor(COLORS.cream.r, COLORS.cream.g, COLORS.cream.b);
    pdf.rect(0, 0, pageWidth, pageHeight * 0.65, 'F');

    // Bottom 1/3 Navy
    pdf.setFillColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
    pdf.rect(0, pageHeight * 0.65, pageWidth, pageHeight * 0.35, 'F');
  }

  // Decorative Vertical Gold Line
  pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  pdf.setLineWidth(2);
  pdf.line(MARGIN, MARGIN, MARGIN, pageHeight - MARGIN);

  // 0. Logo (Top-Left, above the name)
  let currentY = MARGIN + 15;
  if (config.artist.logo) {
    const logoUrl = getAssetPath(config.artist.logo);
    try {
      const logoData = await loadImg(logoUrl);
      if (logoData) {
        const logoWidth = 20; // Consistent with header logo size (approx)
        const props = pdf.getImageProperties(logoData);
        const logoHeight = (props.height / props.width) * logoWidth;

        pdf.addImage(logoData, 'PNG', MARGIN + 10, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 10;
      }
    } catch (e) {
      console.warn("Failed to load cover page logo", e);
    }
  }

  currentY = Math.max(currentY, MARGIN + 40);

  // 1. Artist Name (Large, Navy, Top-Left aligned next to gold line)
  try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('times', 'bold'); }
  pdf.setFontSize(42);
  pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);

  // Split name if too long
  const nameParts = config.artist.name.split(' ');
  if (nameParts.length > 2) {
    pdf.text(nameParts.slice(0, -1).join(' '), MARGIN + 10, currentY);
    currentY += 18;
    pdf.text(nameParts.slice(-1)[0], MARGIN + 10, currentY);
  } else {
    pdf.text(config.artist.name, MARGIN + 10, currentY);
  }

  currentY += 10;

  // Tagline (Gold, Serif)
  try { pdf.setFont('PlayfairDisplay', 'normal'); } catch { pdf.setFont('times', 'italic'); }
  pdf.setFontSize(16);
  pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  pdf.text(config.artist.tagline, MARGIN + 10, currentY);

  // 2. Hero Image (Centered in the layout, overlapping the split)
  // Load primary image (Veena)
  let heroImgUrl = config.home?.images?.veena;
  // Fallback to first spotlight if no home image
  if (!heroImgUrl && config.spotlights?.[0]) {
    heroImgUrl = config.spotlights[0].imageUrl;
  }

  if (heroImgUrl) {
    const imgData = await loadImg(heroImgUrl);
    if (imgData) {
      const imgWidth = pageWidth * 0.5; // Half page width
      const props = pdf.getImageProperties(imgData);
      const imgHeight = (props.height / props.width) * imgWidth;

      // Position: Right aligned, somewhat overlapping the vertical center
      const xPos = pageWidth - imgWidth - MARGIN;
      const yPos = (pageHeight * 0.65) - (imgHeight * 0.6); // Overlap the split

      // White border for the image
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(3);
      pdf.rect(xPos - 1.5, yPos - 1.5, imgWidth + 3, imgHeight + 3);


      pdf.addImage(imgData, 'JPEG', xPos, yPos, imgWidth, imgHeight);
    }
  }

  // 3. Footer / Bottom Section (White text on Navy background)
  currentY = pageHeight * 0.65 + 30;

  // "PORTFOLIO"
  try { pdf.setFont('Inter', 'bold'); } catch { pdf.setFont('helvetica', 'bold'); }
  pdf.setFontSize(14);
  pdf.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  // pdf.setCharSpace(3); // Removed tracking as requested
  pdf.text('PORTFOLIO', MARGIN + 10, currentY);

  currentY += 15;
  // pdf.setCharSpace(0); // Removed tracking reset

  // Date
  try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 200);
  pdf.text(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long' }).toUpperCase(), MARGIN + 10, currentY);

  // Contact Info Preview (Optional)
  const contactText = config.artist.email || 'aishwaryamanikarnike.com';
  pdf.text(contactText, MARGIN + 10, pageHeight - MARGIN - 10);
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
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Image load fail", e);
    return null;
  }
}

function addHeader(pdf: jsPDF, text: string, cursor: Cursor, setFontFn: (s: number) => void) {
  setFontFn(20);
  pdf.text(text, MARGIN, cursor.y);

  // Gold flourish underline
  const textWidth = pdf.getTextWidth(text);
  pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  pdf.setLineWidth(0.4);
  pdf.line(MARGIN, cursor.y + 2, MARGIN + textWidth * 0.3, cursor.y + 2);
}

async function renderSpotlight(pdf: jsPDF, spotlight: any, width: number, pageHeight: number, cursor: Cursor, loadImg: any, addNewPage: any) {
  // Calculate total spotlight height for better page break decisions
  const spotlightTitleHeight = 16;
  const spotlightDescHeight = spotlight.description ? Math.ceil(spotlight.description.length / 100) * 12 : 20;
  const imageHeight = 100;
  const totalSpotlightHeight = spotlightTitleHeight + spotlightDescHeight + imageHeight + 30;

  if (cursor.y + totalSpotlightHeight > pageHeight - MARGIN) {
    await addNewPage('spotlights');
    cursor.y = MARGIN;
  }

  pdf.setFontSize(16);
  pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('helvetica', 'bold'); }
  pdf.text(spotlight.title, MARGIN, cursor.y);
  cursor.y += 8;

  pdf.setFontSize(12);
  pdf.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'italic'); }
  pdf.text(spotlight.subtitle, MARGIN, cursor.y);
  cursor.y += 10;

  const imgData = await loadImg(spotlight.imageUrl);
  if (imgData) {
    const props = pdf.getImageProperties(imgData);
    const imgWidth = width;
    const imgHeight = (props.height / props.width) * imgWidth;

    if (cursor.y + imgHeight > pageHeight - MARGIN) {
      await addNewPage('spotlights');
      cursor.y = MARGIN;
    }

    pdf.addImage(imgData, 'JPEG', MARGIN, cursor.y, imgWidth, imgHeight);
    cursor.y += imgHeight + 8;
  }

  try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
  pdf.setFontSize(12); // Increased font
  pdf.setTextColor(COLORS.black.r, COLORS.black.g, COLORS.black.b);
  const lines = pdf.splitTextToSize(spotlight.description, width);
  pdf.text(lines, MARGIN, cursor.y);
  cursor.y += (lines.length * 12 * LINE_HEIGHT_SCALE) + 12; // Adjusted spacing
}

function renderAboutSection(pdf: jsPDF, config: any, width: number, cursor: Cursor, headerFn: any) {
  headerFn(pdf, 'About', cursor, (s: number) => {
    try { pdf.setFont('PlayfairDisplay', 'bold'); } catch { pdf.setFont('times', 'bold'); }
    pdf.setFontSize(s);
    pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  });
  cursor.y += 10;

  try { pdf.setFont('Inter', 'normal'); } catch { pdf.setFont('helvetica', 'normal'); }
  pdf.setFontSize(12); // Increased font
  pdf.setTextColor(COLORS.black.r, COLORS.black.g, COLORS.black.b);
  const bio = config.artist.briefBio;
  const lines = pdf.splitTextToSize(bio, width);
  pdf.text(lines, MARGIN, cursor.y);
  cursor.y += (lines.length * 12 * LINE_HEIGHT_SCALE) + 10; // Adjusted spacing
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
  const THUMB_HEIGHT = 45; // 16:9 ratio for 80mm width
  const TITLE_HEIGHT = 10;

  // 1. Card border (subtle gold accent)
  pdf.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  pdf.setLineWidth(0.15);
  pdf.rect(x, y, width, height);

  // 2. Thumbnail area (top portion of card)
  const youtubeId = extractYoutubeId(video.url);
  const thumbUrl = video.thumbnail_url ||
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null);

  if (thumbUrl) {
    try {
      const thumbData = await loadImageFn(thumbUrl);
      if (thumbData) {
        // Fill full width, maintain aspect ratio
        pdf.addImage(thumbData, 'JPEG', x, y, width, THUMB_HEIGHT);
      }
    } catch (e) {
      console.warn("Failed to load video thumbnail", e);
    }
  }

  // 3. Separator line between thumbnail and title
  pdf.setDrawColor(COLORS.slate.r, COLORS.slate.g, COLORS.slate.b);
  pdf.setLineWidth(0.1);
  pdf.line(x, y + THUMB_HEIGHT, x + width, y + THUMB_HEIGHT);

  // 4. Title text area (below thumbnail)
  pdf.setFontSize(9);
  pdf.setTextColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  try {
    pdf.setFont('Inter', 'bold');
  } catch {
    pdf.setFont('helvetica', 'bold');
  }

  // Wrap title to fit width with padding
  const titleLines = pdf.splitTextToSize(video.title, width - 6); // 3mm padding on each side
  const displayLines = titleLines.slice(0, 2); // Max 2 lines

  // Center text vertically in the title area
  const lineHeight = 3.5;
  const totalTextHeight = displayLines.length * lineHeight;
  const titleStartY = y + THUMB_HEIGHT + (TITLE_HEIGHT - totalTextHeight) / 2 + lineHeight;

  for (let i = 0; i < displayLines.length; i++) {
    const line = displayLines[i];
    const textWidth = pdf.getTextWidth(line);
    const centeredX = x + (width - textWidth) / 2;
    pdf.text(line, centeredX, titleStartY + (i * lineHeight));
  }

  // 5. Make entire card clickable
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
        // Check if we need a page break before subcategory header
        if (cursor.y > 240) {
          await addNewPage('music');
          cursor.y = MARGIN;
        }

        // Subcategory header
        try { pdf.setFont('Inter', 'bold'); } catch { pdf.setFont('helvetica', 'bold'); }
        pdf.setFontSize(12);
        pdf.setTextColor(COLORS.slate.r, COLORS.slate.g, COLORS.slate.b);
        pdf.text(sub.name, MARGIN + 2, cursor.y);
        cursor.y += 10;

        // Merge DB and config videos (deduplicate)
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

        // Render videos as grid
        let startY = cursor.y; // Remember starting Y for this subcategory
        let cardIndex = 0;
        let maxY = startY; // Track the bottom of the lowest row

        for (const vid of mergedVideos) {
          const col = cardIndex % CARDS_PER_ROW;
          const row = Math.floor(cardIndex / CARDS_PER_ROW);

          const cardX = MARGIN + (col * (CARD_WIDTH + CARD_GAP));
          const cardY = startY + (row * (CARD_HEIGHT + ROW_SPACING));

          // Page break check: ensure full row fits on page
          // Only check at start of new row (col === 0)
          if (col === 0 && cardY + CARD_HEIGHT > pdf.internal.pageSize.getHeight() - MARGIN) {
            await addNewPage('music');
            cursor.y = MARGIN;
            cardIndex = 0; // Reset grid for new page
            startY = cursor.y; // Reset start Y for new page
            maxY = startY;
            continue; // Skip to next iteration to recalculate positions
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
      pdf.addImage(img1, 'JPEG', MARGIN, cursor.y, imgW, imgH);
      pdf.setFontSize(9);
      pdf.text(images[i].caption || '', MARGIN, cursor.y + imgH + 5);
    }

    if (i + 1 < images.length) {
      const img2 = await loadImg(images[i + 1].src);
      if (img2) {
        pdf.addImage(img2, 'JPEG', MARGIN + imgW + 10, cursor.y, imgW, imgH);
        pdf.text(images[i + 1].caption || '', MARGIN + imgW + 10, cursor.y + imgH + 5);
      }
    }
    cursor.y += imgH + 15;
  }
}
