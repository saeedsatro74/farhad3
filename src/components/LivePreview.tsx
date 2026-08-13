import React, { useEffect, useRef, useState } from 'react';
import { LayoutSettings, ImageItem } from '../types';
import {
  renderPageCanvas,
  canvasToOptimizedBlob,
  generateZipArchive,
  getCanvasDimensions,
  computePagesLayout,
} from '../utils/canvasGenerator';
import {
  Eye,
  Download,
  Archive,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  FileImage,
  BarChart3,
  HardDrive,
  Layers,
  Sparkles,
  Grid,
  ShieldCheck,
} from 'lucide-react';

interface LivePreviewProps {
  settings: LayoutSettings;
  images: ImageItem[];
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  settings,
  images,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pagesLayout = computePagesLayout(images, settings);
  const totalPages = Math.max(1, pagesLayout.length);
  const itemsPerPage = Math.max(1, settings.page.rows * settings.page.columns);

  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [currentPageSizeKB, setCurrentPageSizeKB] = useState<number | null>(null);

  const [zipProgress, setZipProgress] = useState<{
    percent: number;
    current: number;
    total: number;
  }>({ percent: 0, current: 0, total: 0 });

  const [pageNumberText, setPageNumberText] = useState<string>('');

  // Keep page in valid bounds
  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  // Render current page canvas whenever settings, images or selected page changes
  useEffect(() => {
    let isCancelled = false;

    async function draw() {
      if (!canvasRef.current) return;
      setIsRendering(true);

      try {
        const { pageNumberText: text } = await renderPageCanvas(
          settings,
          images,
          currentPage,
          canvasRef.current
        );

        // Compute actual output file size for the current page
        const { sizeKB } = await canvasToOptimizedBlob(canvasRef.current, 490);

        if (!isCancelled) {
          setPageNumberText(text);
          setCurrentPageSizeKB(sizeKB);
        }
      } catch (err) {
        console.error('Error rendering canvas', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    draw();

    return () => {
      isCancelled = true;
    };
  }, [settings, images, currentPage]);

  // Download individual page as JPEG (< 500 KB)
  const handleDownloadSinglePage = async () => {
    if (!canvasRef.current) return;
    try {
      const { blob } = await canvasToOptimizedBlob(canvasRef.current, 490);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Page_${currentPage + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error', e);
    }
  };

  // Generate and Download ZIP file containing all pages (< 500 KB per page)
  const handleDownloadZip = async () => {
    if (images.length === 0) {
      alert('لطفا ابتدا حداقل یک تصویر بارگذاری کنید.');
      return;
    }

    setIsZipping(true);
    setZipProgress({ percent: 0, current: 1, total: totalPages });

    try {
      const { zipBlob } = await generateZipArchive(
        settings,
        images,
        (percent, current, total) => {
          setZipProgress({ percent, current, total });
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP Error', e);
      alert('خطا در تولید فایل فشرده ZIP');
    } finally {
      setIsZipping(false);
    }
  };

  const { width: origWidth, height: origHeight } = getCanvasDimensions(
    settings.page.orientation
  );

  const estimatedTotalKB = (currentPageSizeKB || 380) * totalPages;
  const estimatedTotalMB = (estimatedTotalKB / 1024).toFixed(2);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-teal-600" />
          <div>
            <h2 className="text-base font-bold text-slate-800">
              پیش‌نمایش خروجی A4 (Live Output Preview)
            </h2>
            <p className="text-xs text-slate-500">
              صفحه {currentPage + 1} از {totalPages} (ابعاد اصلی: {origWidth} × {origHeight} پیکسل - A4 300DPI)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSinglePage}
            disabled={isRendering || images.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors disabled:opacity-40 cursor-pointer"
            title="دانلود فقط همین صفحه به صورت JPG (زیر ۵۰۰KB)"
          >
            <Download className="w-4 h-4 text-slate-600" />
            دانلود این صفحه (JPG)
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping || images.length === 0}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md shadow-teal-600/20 transition-all disabled:opacity-40 cursor-pointer"
          >
            {isZipping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            تولید و دانلود ZIP تمام صفحات
          </button>
        </div>
      </div>

      {/* Progress Bar for ZIP generation */}
      {isZipping && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-teal-800">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              در حال تولید صفحات A4 ({zipProgress.current} از {zipProgress.total})...
            </span>
            <span>{zipProgress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-teal-200/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-200 rounded-full"
              style={{ width: `${zipProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Page Switcher Navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            صفحه قبلی
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>صفحه</span>
            <span className="bg-teal-600 text-white px-2 py-0.5 rounded-md font-mono">
              {currentPage + 1}
            </span>
            <span>از {totalPages}</span>
            {pageNumberText && (
              <span className="text-slate-400 font-mono text-[11px] mr-2">
                (شماره: {pageNumberText})
              </span>
            )}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
          >
            صفحه بعدی
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas Viewport Box */}
      <div className="relative bg-slate-900 rounded-2xl p-4 sm:p-6 overflow-hidden flex flex-col items-center justify-center min-h-[350px] shadow-inner">
        {isRendering && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-10 flex items-center justify-center text-white text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
            <span>در حال به‌روزرسانی پیش‌نمایش...</span>
          </div>
        )}

        {/* Scaled Canvas Container */}
        <div className="w-full flex justify-center max-w-full overflow-auto py-2">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-sm border border-slate-700 bg-white"
            style={{
              aspectRatio: `${origWidth} / ${origHeight}`,
            }}
          />
        </div>

        {images.length === 0 && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
            <FileImage className="w-10 h-10 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">
              تصویری آپلود نشده است
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              برای دیدن پیش‌نمایش واقعی خروجی A4، تصاویر خود را از بخش بالا آپلود کنید یا دکمه «تست با تصاویر نمونه» را بزنید.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* STATS SUMMARY BOX (باکس آمار کلی پایان کار و وضعیت خروجی) */}
      {/* ========================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-800 space-y-4">
        {/* Box Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>آمار و گزارش کلی پروژه خروجی</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  حجم خروجی زیر ۵۰۰KB
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                خلاصه وضعیت عکس‌های ورودی، صفحات تولید شده و کیفیت خروجی A4
              </p>
            </div>
          </div>

          <div className="text-xs text-teal-400 font-semibold bg-teal-950/60 border border-teal-800/80 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span>کیفیت بالا (300 DPI) + فشرده‌سازی هوشمند</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Stat 1: Total Uploaded Photos */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>عکس‌های ارسال شده</span>
              <FileImage className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {images.length}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">عدد</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {images.filter((i) => !i.isSample).length} عکس کاربر + {images.filter((i) => i.isSample).length} نمونه
            </div>
          </div>

          {/* Stat 2: Total Generated Output A4 Pages */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>صفحات A4 تولید شده</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              {totalPages}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">صفحه</span>
            </div>
            <div className="text-[11px] text-slate-400">
              ظرفیت کل: {totalPages * itemsPerPage} عکس
            </div>
          </div>

          {/* Stat 3: Grid Layout */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>چیدمان هر صفحه</span>
              <Grid className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base font-extrabold text-white font-mono">
              {settings.page.rows} × {settings.page.columns}
            </div>
            <div className="text-[11px] text-slate-400">
              {itemsPerPage} تصویر در هر صفحه A4
            </div>
          </div>

          {/* Stat 4: File Size Optimization (< 500 KB) */}
          <div className="bg-emerald-950/30 rounded-xl p-3 border border-emerald-800/50 flex flex-col justify-between space-y-1">
            <div className="flex items-center justify-between text-emerald-300 text-xs">
              <span>حجم هر صفحه خروجی</span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono">
              {currentPageSizeKB ? `${currentPageSizeKB} KB` : '< ۵۰۰ KB'}
            </div>
            <div className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>کمتر از ۵۰۰KB - بهینه‌شده</span>
            </div>
          </div>
        </div>

        {/* Box Footer Summary Note */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              مجموع تقریبی تمام خروجی‌ها (در ZIP):{' '}
              <strong className="text-slate-200 font-mono">{estimatedTotalMB} MB</strong>{' '}
              ({totalPages} فایل با میانگین ~{currentPageSizeKB || 380}KB)
            </span>
          </div>
          <div className="text-slate-400">
            آماده برای دانلود تک‌تک یا یکجای ZIP 📦
          </div>
        </div>
      </div>
    </div>
  );
};
