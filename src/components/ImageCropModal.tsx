import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  Crop as CropIcon,
  RefreshCw,
  Move,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
} from 'lucide-react';
import { ImageItem, CropSettings } from '../types';
import { CustomFreeformCropper, CropRect } from './CustomFreeformCropper';

interface ImageCropModalProps {
  images: ImageItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSaveCurrentImage: (id: string, croppedDataUrl: string, cropSettings?: CropSettings) => void;
  onNavigateIndex: (newIndex: number) => void;
}

const PRESET_RECTS = [
  { label: 'کامل (آزاد)', rect: { x: 0, y: 0, width: 100, height: 100 } },
  { label: 'نیمه چپ (۱/۲)', rect: { x: 0, y: 0, width: 50, height: 100 } },
  { label: 'نیمه راست (۱/۲)', rect: { x: 50, y: 0, width: 50, height: 100 } },
  { label: 'ربع بالا-چپ', rect: { x: 0, y: 0, width: 50, height: 50 } },
  { label: 'ربع بالا-راست', rect: { x: 50, y: 0, width: 50, height: 50 } },
  { label: 'ربع پایین-چپ', rect: { x: 0, y: 50, width: 50, height: 50 } },
  { label: 'ربع پایین-راست', rect: { x: 50, y: 50, width: 50, height: 50 } },
  { label: 'مربعی (۱:۱)', rect: { x: 15, y: 15, width: 70, height: 70 } },
];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function getCroppedImgFreeform(
  imageSrc: string,
  cropRect: CropRect,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<string> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const pixelX = (cropRect.x / 100) * bBoxWidth;
  const pixelY = (cropRect.y / 100) * bBoxHeight;
  const pixelWidth = (cropRect.width / 100) * bBoxWidth;
  const pixelHeight = (cropRect.height / 100) * bBoxHeight;

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) throw new Error('No 2d context');

  croppedCanvas.width = Math.max(1, Math.round(pixelWidth));
  croppedCanvas.height = Math.max(1, Math.round(pixelHeight));

  croppedCtx.drawImage(
    canvas,
    pixelX,
    pixelY,
    pixelWidth,
    pixelHeight,
    0,
    0,
    croppedCanvas.width,
    croppedCanvas.height
  );

  return croppedCanvas.toDataURL('image/jpeg', 0.92);
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onSaveCurrentImage,
  onNavigateIndex,
}) => {
  const [cropRect, setCropRect] = useState<CropRect>({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [isSaving, setIsSaving] = useState(false);

  const [showSavedToast, setShowSavedToast] = useState(false);

  const currentImage = images[currentIndex];
  const baseImageSrc = currentImage?.originalUrl || currentImage?.previewUrl || '';

  // Initialize/Restore crop settings when switching active image
  useEffect(() => {
    if (!currentImage) return;
    if (currentImage.cropSettings) {
      setCropRect(currentImage.cropSettings.cropRect);
      setRotation(currentImage.cropSettings.rotation);
      setFlip(currentImage.cropSettings.flip);
    } else {
      setCropRect({ x: 0, y: 0, width: 100, height: 100 });
      setRotation(0);
      setFlip({ horizontal: false, vertical: false });
    }
    setShowSavedToast(false);
  }, [currentIndex, currentImage]);

  // Save changes ONLY (does NOT close modal and preserves exact crop rectangle)
  const handleSaveOnly = useCallback(async () => {
    if (!currentImage || isSaving) return;
    try {
      setIsSaving(true);
      const sourceUrl = currentImage.originalUrl || currentImage.previewUrl;
      const croppedImage = await getCroppedImgFreeform(
        sourceUrl,
        cropRect,
        rotation,
        flip
      );
      onSaveCurrentImage(currentImage.id, croppedImage, {
        cropRect,
        rotation,
        flip,
      });
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2200);
    } catch (e) {
      console.error('Error cropping image', e);
    } finally {
      setIsSaving(false);
    }
  }, [currentImage, isSaving, cropRect, rotation, flip, onSaveCurrentImage]);

  const handleSaveAndClose = useCallback(async () => {
    if (!currentImage || isSaving) return;
    try {
      setIsSaving(true);
      const sourceUrl = currentImage.originalUrl || currentImage.previewUrl;
      const croppedImage = await getCroppedImgFreeform(
        sourceUrl,
        cropRect,
        rotation,
        flip
      );
      onSaveCurrentImage(currentImage.id, croppedImage, {
        cropRect,
        rotation,
        flip,
      });
      onClose();
    } catch (e) {
      console.error('Error cropping image', e);
    } finally {
      setIsSaving(false);
    }
  }, [currentImage, isSaving, cropRect, rotation, flip, onSaveCurrentImage, onClose]);

  const handleSaveAndNavigate = useCallback(
    async (step: number) => {
      if (!currentImage || isSaving) return;
      const targetIndex = currentIndex + step;
      if (targetIndex < 0 || targetIndex >= images.length) return;

      try {
        setIsSaving(true);
        const sourceUrl = currentImage.originalUrl || currentImage.previewUrl;
        const croppedImage = await getCroppedImgFreeform(
          sourceUrl,
          cropRect,
          rotation,
          flip
        );
        onSaveCurrentImage(currentImage.id, croppedImage, {
          cropRect,
          rotation,
          flip,
        });
        onNavigateIndex(targetIndex);
      } catch (e) {
        console.error('Error cropping image', e);
      } finally {
        setIsSaving(false);
      }
    },
    [
      currentImage,
      isSaving,
      currentIndex,
      images.length,
      cropRect,
      rotation,
      flip,
      onSaveCurrentImage,
      onNavigateIndex,
    ]
  );

  // Keyboard navigation & save shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveOnly(); // Enter now ONLY saves, doesn't close
      } else if (e.key === 'ArrowLeft') {
        // Next image in RTL
        e.preventDefault();
        handleSaveAndNavigate(1);
      } else if (e.key === 'ArrowRight') {
        // Prev image in RTL
        e.preventDefault();
        handleSaveAndNavigate(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSaveOnly, handleSaveAndNavigate, onClose]);

  if (!isOpen || !currentImage) return null;

  const handleReset = () => {
    const defaultRect = { x: 0, y: 0, width: 100, height: 100 };
    const defaultRot = 0;
    const defaultFlip = { horizontal: false, vertical: false };
    setCropRect(defaultRect);
    setRotation(defaultRot);
    setFlip(defaultFlip);
    if (currentImage) {
      const sourceUrl = currentImage.originalUrl || currentImage.previewUrl;
      onSaveCurrentImage(currentImage.id, sourceUrl, {
        cropRect: defaultRect,
        rotation: defaultRot,
        flip: defaultFlip,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  ویرایش و برش تصویر
                </h3>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  عکس {currentIndex + 1} از {images.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px] sm:max-w-xs">
                {currentImage.name}
              </p>
            </div>
          </div>

          {/* Quick Nav & Close Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentIndex === 0 || isSaving}
              onClick={() => handleSaveAndNavigate(-1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold disabled:opacity-30 cursor-pointer"
              title="ذخیره و عکس قبلی (کلید ➔)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">قبلی</span>
            </button>

            <button
              type="button"
              disabled={currentIndex === images.length - 1 || isSaving}
              onClick={() => handleSaveAndNavigate(1)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold disabled:opacity-30 cursor-pointer"
              title="ذخیره و عکس بعدی (کلید )"
            >
              <span className="hidden sm:inline">بعدی</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Hint Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 py-1.5 px-3 bg-amber-50 border-b border-amber-200/60 text-[11px] text-amber-900 font-semibold">
          <span className="flex items-center gap-1 text-amber-800">
            <CornerDownLeft className="w-3.5 h-3.5 text-amber-600" />
            <kbd className="bg-white border border-amber-300 rounded px-1.5 py-0.2 font-mono text-[10px]">Enter</kbd>
            <span>فقط ذخیره عکس</span>
          </span>
          <span className="text-amber-300">|</span>
          <span className="flex items-center gap-1 text-amber-800">
            <kbd className="bg-white border border-amber-300 rounded px-1.5 py-0.2 font-mono text-[10px]"> / ➔</kbd>
            <span>ذخیره و عکس بعدی / قبلی</span>
          </span>
          <span className="text-amber-300">|</span>
          <span className="flex items-center gap-1 text-amber-800">
            <kbd className="bg-white border border-amber-300 rounded px-1.5 py-0.2 font-mono text-[10px]">Esc</kbd>
            <span>خروج</span>
          </span>
        </div>

        {/* Freeform Cropper Area */}
        <div className="relative w-full flex-1 min-h-[360px] h-[52vh] sm:h-[58vh] max-h-[560px] bg-slate-950 flex items-center justify-center overflow-hidden">
          {showSavedToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <Check className="w-4 h-4 text-emerald-200" />
              <span>تغییرات تصویر با موفقیت ذخیره شد</span>
            </div>
          )}

          <CustomFreeformCropper
            imageSrc={baseImageSrc}
            cropRect={cropRect}
            onChangeCropRect={setCropRect}
            rotation={rotation}
            flip={flip}
          />
        </div>

        {/* Controls Panel */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          
          {/* Quick Presets & Instructions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
              <Move className="w-3.5 h-3.5 text-amber-500" />
              <span>پیش‌فرض‌های کادر:</span>
              <div className="flex flex-wrap gap-1">
                {PRESET_RECTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCropRect(item.rect)}
                    className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50 text-[11px] font-medium text-slate-700 transition-all cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              ابعاد کادر: {Math.round(cropRect.width)}٪ × {Math.round(cropRect.height)}٪
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            
            {/* Rotate and Flip Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev - 90) % 360)}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-teal-700 transition-colors cursor-pointer"
                title="۹۰ درجه پادساعتگرد"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-teal-700 transition-colors cursor-pointer"
                title="۹۰ درجه ساعتگرد"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setFlip((f) => ({ ...f, horizontal: !f.horizontal }))}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  flip.horizontal
                    ? 'bg-teal-100 border-teal-300 text-teal-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="قرینه‌سازی افقی"
              >
                <FlipHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setFlip((f) => ({ ...f, vertical: !f.vertical }))}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  flip.vertical
                    ? 'bg-teal-100 border-teal-300 text-teal-800 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="قرینه‌سازی عمودی"
              >
                <FlipVertical className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                title="بازنشانی کادر"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                ریست
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                خروج (Esc)
              </button>

              <button
                type="button"
                onClick={handleSaveOnly}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                title="ذخیره تغییرات بدون خروج (کلید Enter)"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره عکس (Enter)'}
              </button>

              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                ذخیره و بستن
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

