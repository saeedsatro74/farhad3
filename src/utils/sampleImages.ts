import { ImageItem } from '../types';

/**
 * Generates sample images on lightweight canvas elements for rapid testing
 */
export async function generateSampleImages(count = 16): Promise<ImageItem[]> {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#6366F1', '#14B8A6', '#F97316', '#D946EF',
    '#0284C7', '#059669', '#D97706', '#DC2626'
  ];

  const items: ImageItem[] = [];

  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw background pattern
      const bgColor = colors[i % colors.length];
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 400, 300);

      // Inner border
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeRect(12, 12, 376, 276);

      // Text label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Vazirmatn, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`تصویر شماره ${i + 1}`, 200, 130);

      ctx.font = '18px Vazirmatn, Arial, sans-serif';
      ctx.fillText(`Sample Image ${i + 1}`, 200, 180);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Convert dataUrl to blob to create a File object
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `sample_${i + 1}.jpg`, { type: 'image/jpeg' });

    items.push({
      id: `sample-${i + 1}-${Date.now()}`,
      file,
      previewUrl: dataUrl,
      originalUrl: dataUrl,
      name: `عکس نمونه ${i + 1}`,
      isSample: true,
    });
  }

  return items;
}
