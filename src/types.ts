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
  borderWidth: number;
  borderColor: string;
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

export interface ImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  name: string;
  isSample?: boolean;
  span?: number; // 1 = 1 column, 2 = 2 columns (double width), 3 = 3 columns, 4 = 4 columns (quadruple width)
}

export interface GeneratedPageResult {
  pageIndex: number;
  pageNumberText: string;
  dataUrl: string;
  blob: Blob;
}
