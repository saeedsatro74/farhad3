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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Scan,
  Maximize,
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

  // Center of crop box in image pixel coordinates
  const cx = ((cropRect.x + cropRect.width / 2) / 100) * image.width;
  const cy = ((cropRect.y + cropRect.height / 2) / 100) * image.height;

  // Size of crop box in image pixel coordinates
  const cropW = (cropRect.width / 100) * image.width;
  const cropH = (cropRect.height / 100) * image.height;

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) throw new Error('No 2d context');

  const finalW = Math.max(1, Math.round(cropW));
  const finalH = Math.max(1, Math.round(cropH));

  croppedCanvas.width = finalW;
  croppedCanvas.height = finalH;

  // White background fallback
  croppedCtx.fillStyle = '#FFFFFF';
  croppedCtx.fillRect(0, 0, finalW, finalH);

  // Sample image with inverse rotation relative to crop box
  croppedCtx.translate(finalW / 2, finalH / 2);
  croppedCtx.rotate((-rotation * Math.PI) / 180);
  croppedCtx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  croppedCtx.translate(-cx, -cy);

  croppedCtx.drawImage(image, 0, 0);

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
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isFullScreen, setIsFullScreen] = useState(false);
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
    setZoomScale(1.0);
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
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-200 border border-slate-200 ${
          isFullScreen
            ? 'w-[99vw] h-[98vh] max-w-none rounded-none'
            : 'w-[98vw] max-w-6xl xl:max-w-7xl h-[92vh] max-h-[920px]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-slate-50 gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-xs">
              <CropIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                  ویرایش و برش پیشرفته تصویر
                </h3>
                <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
                  عکس {currentIndex + 1} از {images.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[180px] sm:max-w-md">
                {currentImage.name}
              </p>
            </div>
          </div>

          {/* Controls: Fullscreen, Nav & Close */}
          <div className="flex items-center gap-1.5">
            {/* Quick Select All Button */}
            <button
              type="button"
              onClick={() => setCropRect({ x: 0, y: 0, width: 100, height: 100 })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="کادر برش را روی ۱۰۰٪ کل عکس تنظیم می‌کند"
            >
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">انتخاب کل عکس</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

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

            <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title={isFullScreen ? 'خروج از حالت تمام‌صفحه' : 'حالت تمام‌صفحه پنجره'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
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

        {/* Shortcuts & Zoom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-4 bg-slate-900 text-slate-200 text-xs shrink-0 border-b border-slate-800">
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">بزرگ‌نمایی عکس:</span>
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.15))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
              title="کوچک‌نمایی (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={zoomScale}
              onChange={(e) => setZoomScale(parseFloat(e.target.value))}
              className="w-24 sm:w-32 accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />

            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
              title="بزرگ‌نمایی (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setZoomScale(1.0)}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-amber-400 font-mono cursor-pointer"
            >
              {Math.round(zoomScale * 100)}٪
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.2 font-mono text-[10px] text-amber-300">Enter</kbd>
              <span>ذخیره تغییرات</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.2 font-mono text-[10px] text-amber-300"> / ➔</kbd>
              <span>عکس بعدی / قبلی</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.2 font-mono text-[10px] text-amber-300">Esc</kbd>
              <span>بستن</span>
            </span>
          </div>
        </div>

        {/* Freeform Cropper Workspace */}
        <div className="relative w-full flex-1 min-h-0 bg-slate-950 flex items-center justify-center overflow-hidden">
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
            zoomScale={zoomScale}
          />
        </div>

        {/* Controls Panel */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          
          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Rotate, Angle Fine-Tuning and Flip Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Fine Rotation Slider & Angle Input */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <RotateCw className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">چرخش دقیق:</span>
                
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value, 10) || 0)}
                  className="w-20 sm:w-28 accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  title="زاویه چرخش (از -۱۸۰ تا +۱۸۰ درجه)"
                />

                <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg px-2 py-0.5 border border-slate-200">
                  <input
                    type="number"
                    value={rotation}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setRotation(isNaN(val) ? 0 : ((val % 360 + 540) % 360) - 180);
                    }}
                    className="w-10 text-center text-xs font-bold font-mono bg-transparent text-slate-800 outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">°</span>
                </div>

                {/* Quick Angle Adjustments */}
                <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r - 1)}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="۱ درجه پادساعتگرد"
                  >
                    -۱°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation(0)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                      rotation === 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="تراز اولیه (۰ درجه)"
                  >
                    ۰°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => r + 1)}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="۱ درجه ساعتگرد"
                  >
                    +۱°
                  </button>
                </div>
              </div>

              {/* 90-degree step buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev - 90) % 360)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-amber-700 transition-colors cursor-pointer"
                  title="۹۰ درجه پادساعتگرد"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-amber-700 transition-colors cursor-pointer"
                  title="۹۰ درجه ساعتگرد"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setFlip((f) => ({ ...f, horizontal: !f.horizontal }))}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    flip.horizontal
                      ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="قرینه‌سازی افقی"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setFlip((f) => ({ ...f, vertical: !f.vertical }))}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    flip.vertical
                      ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="قرینه‌سازی عمودی"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  title="بازنشانی کادر و زاویه چرخش به حالت اولیه"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ریست
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                خروج (Esc)
              </button>

              <button
                type="button"
                onClick={handleSaveOnly}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                title="ذخیره تغییرات بدون خروج (کلید Enter)"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره عکس (Enter)'}
              </button>

              <button
                type="button"
                onClick={handleSaveAndClose}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
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

