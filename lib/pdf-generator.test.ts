import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePDF } from './pdf-generator';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

// Mock jsPDF and html2canvas
vi.mock('jspdf', () => {
  const mockGState = vi.fn().mockImplementation(() => ({}));
  const mockInstance = {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
      pages: [null, {}, {}], // Mock pages array
    },
    setFontSize: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    addImage: vi.fn(),
    link: vi.fn(),
    setPage: vi.fn(),
    save: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    saveGraphicsState: vi.fn(),
    setGState: vi.fn(),
    restoreGraphicsState: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    getTextWidth: vi.fn().mockReturnValue(50),
    getImageProperties: vi.fn().mockReturnValue({ width: 100, height: 100 }),
    addFileToVFS: vi.fn(),
    addFont: vi.fn(),
    splitTextToSize: vi.fn().mockImplementation((text) => [text]),
    getNumberOfPages: vi.fn().mockReturnValue(3),
    GState: mockGState,
  };

  return {
    default: vi.fn().mockImplementation(() => mockInstance),
  };
});

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    width: 1200,
    height: 800,
    toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mock'),
  }),
}));

describe('PDF Generator', () => {
  beforeEach(() => {
    // Mock global fetch to handle relative URLs in Node environment
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/admin/config')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              artist: { name: 'Veena', email: 'veena@example.com' },
              home: { featuredCarousel: { enabled: false } },
              sections: { press: false },
              pdf: { gradients: { enabled: true, opacity: 0.5 } },
              gallery: { images: [] },
            }),
          blob: () => Promise.resolve(new Blob([''], { type: 'image/jpeg' })),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        blob: () => Promise.resolve(new Blob([''], { type: 'image/jpeg' })),
      } as unknown as Response);
    });

    // Mock URL object methods for JSDOM
    URL.createObjectURL = vi.fn().mockReturnValue('mock-object-url');
    URL.revokeObjectURL = vi.fn();

    // Mock global Image to fire onload immediately in JSDOM
    vi.stubGlobal(
      'Image',
      class {
        width = 1200;
        height = 800;
        onload = null;
        onerror = null;
        _src = '';
        set src(val) {
          this._src = val;
          setTimeout(() => {
            if (this.onload) (this.onload as any)();
          }, 10);
        }
        get src() {
          return this._src;
        }
      }
    );

    // Mock canvas methods to avoid jsdom errors
    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/jpeg;base64,mock');
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      createLinearGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      translate: vi.fn(),
      transform: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      arc: vi.fn(),
      arcTo: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      isPointInPath: vi.fn(),
      isPointInStroke: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      measureText: vi.fn(),
      canvas: document.createElement('canvas'),
    });

    // Setup DOM with mock sections
    document.body.innerHTML = `
      <div id="home-section">
        <h1>Home Section</h1>
        <a href="https://example.com">External Link</a>
      </div>
      <div id="about-section">
        <h2>About Section</h2>
      </div>
      <div id="gallery-section">
        <h2>Gallery Section</h2>
      </div>
      <div id="music-section">
        <h2>Music Section</h2>
      </div>
      <div id="press-section">
        <h2>Press Section</h2>
      </div>
      <div id="faq-section">
        <h2>FAQ Section</h2>
      </div>
      <div id="contact-section">
        <h2>Contact Section</h2>
      </div>
    `;
  });

  it('should successfully generate PDF with all sections', async () => {
    const result = await generatePDF();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should call progress callback during generation', async () => {
    const onProgress = vi.fn();

    await generatePDF({ onProgress });

    expect(onProgress).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(expect.any(Number));
  });

  it('should handle missing sections gracefully', async () => {
    // Mock global fetch to return a 500 failure
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    const result = await generatePDF();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to load site configuration');
  });

  it('should include links when includeLinks is true', async () => {
    const result = await generatePDF({ includeLinks: true });

    expect(result.success).toBe(true);
  });

  it('should work without links when includeLinks is false', async () => {
    const result = await generatePDF({ includeLinks: false });

    expect(result.success).toBe(true);
  });
});
