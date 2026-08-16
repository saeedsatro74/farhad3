export type PageOrientation = 'portrait' | 'landscape';

export type NumberingMode = 'sequential' | 'random';

export type NumberPosition = 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface PageConfig {
  orientation: PageOrientation;
  rows: number;
  columns: number;
}

export interface MarginConfig {
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export interface BorderConfig {
  borderWidth: number; // ضخامت کادر بیرونی (Outer Border Width)
  borderColor: string; // رنگ کادر بیرونی (Outer Border Color)
  innerBorderWidth: number; // ضخامت کادر عکس‌های وسط (Inner Grid Border Width)
  innerBorderColor: string; // رنگ کادر عکس‌های وسط (Inner Grid Border Color)
}

export interface NumberingConfig {
  prefix: string;
  fontSize: number;
  isBold?: boolean;
  startNumber: number;
  numberingMode: NumberingMode;
  numberPosition: NumberPosition;
  numberMargin: number;
}

export interface LayoutSettings {
  page: PageConfig;
  margins: MarginConfig;
  border: BorderConfig;
  numbering: NumberingConfig;
}

export interface CropSettings {
  cropRect: { x: number; y: number; width: number; height: number };
  rotation: number;
  flip: { horizontal: boolean; vertical: boolean };
}

export interface ImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  originalUrl?: string;
  name: string;
  isSample?: boolean;
  span?: number; // 1 = 1 column, 2 = 2 columns (double width), 3 = 3 columns, 4 = 4 columns (quadruple width)
  cropSettings?: CropSettings;
}

export interface GeneratedPageResult {
  pageIndex: number;
  pageNumberText: string;
  dataUrl: string;
  blob: Blob;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  avatar?: string;
  lastLogin?: string;
}

