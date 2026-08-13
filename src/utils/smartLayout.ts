import { PageConfig, PageOrientation } from '../types';

export interface SmartLayoutResult extends PageConfig {
  explanation: string;
}

interface GridCandidate {
  orientation: PageOrientation;
  rows: number;
  columns: number;
  baseScore?: number;
}

// Well-proportioned A4 grid options prioritizing 2-row landscape layout
const CANDIDATES: GridCandidate[] = [
  // 2-Row Landscape (primary preference for tickets / coupons)
  { orientation: 'landscape', rows: 2, columns: 8, baseScore: 40 }, // Default 2x8 (16/page)
  { orientation: 'landscape', rows: 2, columns: 10, baseScore: 30 }, // 2x10 (20/page)
  { orientation: 'landscape', rows: 2, columns: 9, baseScore: 25 },  // 2x9 (18/page)
  { orientation: 'landscape', rows: 2, columns: 7, baseScore: 25 },  // 2x7 (14/page)
  { orientation: 'landscape', rows: 2, columns: 6, baseScore: 25 },  // 2x6 (12/page)
  { orientation: 'landscape', rows: 2, columns: 5, baseScore: 20 },  // 2x5 (10/page)
  { orientation: 'landscape', rows: 2, columns: 4, baseScore: 20 },  // 2x4 (8/page)
  { orientation: 'landscape', rows: 2, columns: 3, baseScore: 15 },  // 2x3 (6/page)
  { orientation: 'landscape', rows: 2, columns: 2, baseScore: 15 },  // 2x2 (4/page)
  { orientation: 'landscape', rows: 2, columns: 1, baseScore: 10 },  // 2x1 (2/page)
  { orientation: 'landscape', rows: 2, columns: 11, baseScore: 10 }, // 2x11 (22/page)
  { orientation: 'landscape', rows: 2, columns: 12, baseScore: 10 }, // 2x12 (24/page)

  // 1-Row Landscape
  { orientation: 'landscape', rows: 1, columns: 4, baseScore: 10 },
  { orientation: 'landscape', rows: 1, columns: 3, baseScore: 10 },
  { orientation: 'landscape', rows: 1, columns: 2, baseScore: 10 },
  { orientation: 'landscape', rows: 1, columns: 1, baseScore: 5 },

  // 3-Row Landscape
  { orientation: 'landscape', rows: 3, columns: 3, baseScore: 10 },
  { orientation: 'landscape', rows: 3, columns: 4, baseScore: 10 },
  { orientation: 'landscape', rows: 3, columns: 5, baseScore: 10 },
  { orientation: 'landscape', rows: 3, columns: 6, baseScore: 10 },

  // Portrait grids
  { orientation: 'portrait', rows: 4, columns: 3, baseScore: 5 },
  { orientation: 'portrait', rows: 3, columns: 3, baseScore: 5 },
  { orientation: 'portrait', rows: 2, columns: 2, baseScore: 5 },
  { orientation: 'portrait', rows: 1, columns: 1, baseScore: 0 },
];

/**
 * Automatically calculates the best grid size (rows, columns, orientation)
 * based on the exact count of uploaded images.
 */
export function calculateSmartLayout(imageCount: number): SmartLayoutResult {
  if (imageCount <= 0) {
    return {
      orientation: 'landscape',
      rows: 2,
      columns: 8,
      explanation: 'پیش‌فرض افقی ۲×۸ (۱۶ تصویر در صفحه)',
    };
  }

  let bestCandidate = CANDIDATES[0]; // default 2x8
  let bestScore = -Infinity;

  for (const cand of CANDIDATES) {
    const capacity = cand.rows * cand.columns;
    const pages = Math.ceil(imageCount / capacity);
    const totalCapacity = pages * capacity;
    const wasted = totalCapacity - imageCount; // Empty cells on last page

    // Score components:
    // 1. Pages penalty: Fewer pages is strictly better (e.g. 2 pages vs 3 pages)
    const pagePenalty = pages * 1000;

    // 2. Wasted cells penalty: Fewer empty slots on the last page is much better
    const wastePenalty = wasted * 35;

    // 3. Exact fit bonus: 0 empty slots on last page gives a large boost
    const exactFitBonus = wasted === 0 ? 250 : 0;

    // 4. Preference score
    const preferenceBonus = (cand.baseScore || 0) + (cand.orientation === 'landscape' && cand.rows === 2 ? 100 : 0);

    const totalScore = exactFitBonus + preferenceBonus - pagePenalty - wastePenalty;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestCandidate = cand;
    }
  }

  const capacity = bestCandidate.rows * bestCandidate.columns;
  const totalPages = Math.ceil(imageCount / capacity);
  const wasted = (totalPages * capacity) - imageCount;
  const orientFa = bestCandidate.orientation === 'landscape' ? 'افقی' : 'عمودی';

  const emptyText = wasted > 0 ? ` و ${wasted} جای خالی` : ' (بدون جای خالی)';
  const explanation = `چیدمان هوشمند ${orientFa} ${bestCandidate.rows}×${bestCandidate.columns} (${capacity} تصویر در صفحه | مجموعاً ${totalPages} صفحه A4${emptyText})`;

  return {
    orientation: bestCandidate.orientation,
    rows: bestCandidate.rows,
    columns: bestCandidate.columns,
    explanation,
  };
}

/**
 * Reads image dimensions from a URL
 */
export function readImageDimensions(
  url: string
): Promise<{ width: number; height: number; span: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      resolve({ width: w, height: h, span: 1 });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0, span: 1 });
    };
    img.src = url;
  });
}

