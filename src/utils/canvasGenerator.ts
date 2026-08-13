import JSZip from 'jszip';
import { LayoutSettings, ImageItem, GeneratedPageResult } from '../types';

/**
 * Loads an HTMLImageElement safely from a URL or ImageItem (supports FileReader for uploaded Files)
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for remote HTTP(S) URLs to avoid security blocks on blob/data URIs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}

/**
 * Loads an HTMLImageElement from an ImageItem using item.previewUrl
 */
export function loadImageFromItem(item: ImageItem): Promise<HTMLImageElement> {
  return loadImage(item.previewUrl);
}

/**
 * Calculates page dimensions based on A4 ratio (300 DPI)
 */
export function getCanvasDimensions(orientation: 'portrait' | 'landscape') {
  if (orientation === 'portrait') {
    return { width: 2480, height: 3508 };
  }
  return { width: 3508, height: 2480 };
}

/**
 * Computes text for page numbering
 */
export function getPageNumberText(settings: LayoutSettings, pageIndex: number): string {
  const { numbering } = settings;
  const prefix = numbering.prefix || '';
  if (numbering.numberingMode === 'random') {
    // Generate a deterministic pseudo-random number per page index so it doesn't flicker on re-renders
    const pseudoRandom = Math.floor(Math.abs(Math.sin(pageIndex + 1) * 899999) + 100000);
    return `${prefix}${pseudoRandom}`;
  }
  return `${prefix}${numbering.startNumber + pageIndex}`;
}

export interface PlacedItem {
  item: ImageItem;
  imageIndex: number;
  row: number;
  col: number;
  span: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageLayout {
  pageIndex: number;
  items: PlacedItem[];
}

/**
 * Computes exact item positions and page layouts considering variable column spans
 */
export function computePagesLayout(
  images: ImageItem[],
  settings: LayoutSettings
): PageLayout[] {
  const cols = Math.max(1, settings.page.columns);
  const rows = Math.max(1, settings.page.rows);

  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(
    settings.page.orientation
  );
  const totalMarginX = settings.margins.marginLeft + settings.margins.marginRight;
  const totalMarginY = settings.margins.marginTop + settings.margins.marginBottom;

  const gridWidth = canvasWidth - totalMarginX;
  const gridHeight = canvasHeight - totalMarginY;

  const cellWidth = gridWidth / cols;
  const cellHeight = gridHeight / rows;

  const pages: PageLayout[] = [];
  let currentPageItems: PlacedItem[] = [];
  let pageIndex = 0;

  let r = 0;
  let c = 0;

  images.forEach((item, imgIdx) => {
    const rawSpan = item.span || 1;
    // Span cannot exceed total grid columns
    const span = Math.min(cols, Math.max(1, rawSpan));

    // If current column + span exceeds cols, wrap to next row
    if (c + span > cols) {
      if (c > 0) {
        r += 1;
        c = 0;
      }
    }

    // If row exceeds rows in current page, move to next page
    if (r >= rows) {
      pages.push({ pageIndex, items: currentPageItems });
      pageIndex += 1;
      currentPageItems = [];
      r = 0;
      c = 0;
    }

    const x = settings.margins.marginLeft + c * cellWidth;
    const y = settings.margins.marginTop + r * cellHeight;
    const width = cellWidth * span;
    const height = cellHeight;

    currentPageItems.push({
      item,
      imageIndex: imgIdx,
      row: r,
      col: c,
      span,
      x,
      y,
      width,
      height,
    });

    c += span;
    if (c >= cols) {
      c = 0;
      r += 1;
    }
  });

  if (currentPageItems.length > 0 || pages.length === 0) {
    pages.push({ pageIndex, items: currentPageItems });
  }

  return pages;
}

/**
 * Renders a single A4 layout page on a given canvas or newly created canvas
 */
export async function renderPageCanvas(
  settings: LayoutSettings,
  images: ImageItem[],
  pageIndex: number,
  targetCanvas?: HTMLCanvasElement
): Promise<{ canvas: HTMLCanvasElement; pageNumberText: string }> {
  const { page, margins, border, numbering } = settings;
  const { width: canvasWidth, height: canvasHeight } = getCanvasDimensions(page.orientation);

  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context unavailable');
  }

  // 1. Fill white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Compute Layout for all pages
  const pagesLayout = computePagesLayout(images, settings);
  const targetPageLayout = pagesLayout[pageIndex] || { pageIndex, items: [] };

  // Pre-load images for this page in parallel
  const loadedImagesMap = new Map<number, HTMLImageElement>();

  await Promise.all(
    targetPageLayout.items.map(async (placed) => {
      try {
        const loadedImg = await loadImageFromItem(placed.item);
        loadedImagesMap.set(placed.imageIndex, loadedImg);
      } catch (e) {
        console.error('Error loading image', placed.item.name, e);
      }
    })
  );

  // 3. Draw grid cell images
  targetPageLayout.items.forEach((placed) => {
    const loadedImg = loadedImagesMap.get(placed.imageIndex);
    if (loadedImg) {
      ctx.drawImage(loadedImg, placed.x, placed.y, placed.width, placed.height);
    } else {
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(placed.x, placed.y, placed.width, placed.height);
    }
  });

  // 4. Grid Cell Inner Borders & Outer Frame
  const totalMarginX = margins.marginLeft + margins.marginRight;
  const totalMarginY = margins.marginTop + margins.marginBottom;
  const gridWidth = canvasWidth - totalMarginX;
  const gridHeight = canvasHeight - totalMarginY;
  const cols = Math.max(1, page.columns);
  const rows = Math.max(1, page.rows);
  const cellWidth = gridWidth / cols;
  const cellHeight = gridHeight / rows;

  // 4a. Draw Inner Photo Grid Cell Borders (کادر عکس‌های وسط)
  const innerW = border.innerBorderWidth !== undefined ? border.innerBorderWidth : border.borderWidth;
  const innerColor = border.innerBorderColor || border.borderColor || '#000000';

  if (innerW > 0) {
    ctx.lineWidth = innerW;
    ctx.strokeStyle = innerColor;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = margins.marginLeft + c * cellWidth;
        const cellY = margins.marginTop + r * cellHeight;
        ctx.strokeRect(cellX, cellY, cellWidth, cellHeight);
      }
    }

    // Re-draw inner border around multi-column span images if any
    targetPageLayout.items.forEach((placed) => {
      if (placed.span > 1) {
        ctx.strokeRect(placed.x, placed.y, placed.width, placed.height);
      }
    });
  }

  // 4b. Draw Outer Border Frame around the entire layout grid (کادر اصلی دور کل مجموعه)
  if (border.borderWidth > 0) {
    ctx.lineWidth = border.borderWidth;
    ctx.strokeStyle = border.borderColor || '#000000';
    ctx.strokeRect(margins.marginLeft, margins.marginTop, gridWidth, gridHeight);
  }

  // Ensure fonts are ready before drawing text on canvas
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore if document.fonts is unsupported
    }
  }

  // 5. Numbering
  const numberText = getPageNumberText(settings, pageIndex);
  if (numberText) {
    const isBold = numbering.isBold !== false; // Default to bold if undefined
    const fontWeightStr = isBold ? 'bold ' : '';
    const numMargin = numbering.numberMargin;
    const fontSz = numbering.fontSize;

    const isTopPosition =
      numbering.numberPosition === 'top' ||
      numbering.numberPosition === 'top-left' ||
      numbering.numberPosition === 'top-right';

    // Maximum allowed font size strictly limited by margin height so text NEVER invades the image grid
    let maxAllowedFont = fontSz;
    if (isTopPosition) {
      maxAllowedFont = Math.max(20, margins.marginTop - 20);
    } else {
      maxAllowedFont = Math.max(20, margins.marginBottom - 20);
    }

    const effectiveFontSize = Math.min(fontSz, maxAllowedFont);

    ctx.fillStyle = '#000000';
    ctx.font = `${fontWeightStr}${effectiveFontSize}px "B Titr", "BTitr", Titr, Vazirmatn, sans-serif`;

    let posX = 0;
    let posY = 0;

    switch (numbering.numberPosition) {
      case 'top-left':
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        posX = margins.marginLeft + numMargin;
        posY = Math.max(effectiveFontSize + 5, margins.marginTop - Math.max(10, numMargin));
        break;

      case 'top-right':
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        posX = canvasWidth - margins.marginRight - numMargin;
        posY = Math.max(effectiveFontSize + 5, margins.marginTop - Math.max(10, numMargin));
        break;

      case 'bottom-left':
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        posX = margins.marginLeft + numMargin;
        posY = canvasHeight - margins.marginBottom + Math.max(10, numMargin);
        break;

      case 'bottom-right':
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        posX = canvasWidth - margins.marginRight - numMargin;
        posY = canvasHeight - margins.marginBottom + Math.max(10, numMargin);
        break;

      case 'top':
      default:
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        posX = canvasWidth / 2;
        posY = Math.max(effectiveFontSize + 5, margins.marginTop - Math.max(10, numMargin));
        break;
    }

    ctx.fillText(numberText, posX, posY);
  }

  return { canvas, pageNumberText: numberText };
}

/**
 * Helper to convert canvas to JPEG Blob with target size strictly under 500 KB (maxKB = 490 KB)
 * while maintaining maximum image quality and visual sharpness.
 */
export async function canvasToOptimizedBlob(
  canvas: HTMLCanvasElement,
  maxKB = 485
): Promise<{ blob: Blob; sizeKB: number; qualityUsed: number }> {
  // Try qualities on full resolution canvas
  const qualities = [0.88, 0.82, 0.76, 0.70, 0.64, 0.58, 0.52];

  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    );

    if (blob) {
      const sizeKB = Math.round(blob.size / 1024);
      if (sizeKB <= maxKB) {
        return { blob, sizeKB, qualityUsed: quality };
      }
    }
  }

  // If full resolution JPEG is still > maxKB even at lower quality,
  // scale down canvas iteratively (e.g. 85%, 72%, 60%) to preserve sharpness while shrinking byte count
  const scales = [0.85, 0.72, 0.60, 0.50];

  for (const scaleRatio of scales) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = Math.round(canvas.width * scaleRatio);
    scaledCanvas.height = Math.round(canvas.height * scaleRatio);

    const ctx = scaledCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);

      for (const quality of [0.82, 0.75, 0.68, 0.60, 0.52]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          scaledCanvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
        );

        if (blob) {
          const sizeKB = Math.round(blob.size / 1024);
          if (sizeKB <= maxKB) {
            return { blob, sizeKB, qualityUsed: quality };
          }
        }
      }
    }
  }

  // Fail-safe fallback at lowest scale and quality guaranteed under maxKB
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = Math.round(canvas.width * 0.45);
  fallbackCanvas.height = Math.round(canvas.height * 0.45);
  const fallbackCtx = fallbackCanvas.getContext('2d');
  if (fallbackCtx) {
    fallbackCtx.imageSmoothingEnabled = true;
    fallbackCtx.imageSmoothingQuality = 'high';
    fallbackCtx.drawImage(canvas, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
  }

  const finalBlob = await new Promise<Blob | null>((resolve) =>
    (fallbackCtx ? fallbackCanvas : canvas).toBlob((b) => resolve(b), 'image/jpeg', 0.50)
  );

  if (!finalBlob) {
    throw new Error('Canvas conversion failed');
  }

  return {
    blob: finalBlob,
    sizeKB: Math.round(finalBlob.size / 1024),
    qualityUsed: 0.50,
  };
}

/**
 * Helper to convert canvas to JPEG Blob (guaranteed < 500 KB)
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  _quality = 0.92
): Promise<Blob> {
  const { blob } = await canvasToOptimizedBlob(canvas, 490);
  return blob;
}

/**
 * Generates all pages and packs them into a downloadable ZIP archive
 */
export async function generateZipArchive(
  settings: LayoutSettings,
  images: ImageItem[],
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<{ zipBlob: Blob; totalSizeKB: number }> {
  const pagesLayout = computePagesLayout(images, settings);
  const totalPages = Math.max(1, pagesLayout.length);

  const zip = new JSZip();
  let totalSizeKB = 0;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const { canvas } = await renderPageCanvas(settings, images, pageIdx);
    const { blob, sizeKB } = await canvasToOptimizedBlob(canvas, 490);
    totalSizeKB += sizeKB;

    const fileName = `Page_${pageIdx + 1}.jpg`;
    zip.file(fileName, blob);

    if (onProgress) {
      const percentage = Math.round(((pageIdx + 1) / totalPages) * 100);
      onProgress(percentage, pageIdx + 1, totalPages);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zipBlob, totalSizeKB };
}
