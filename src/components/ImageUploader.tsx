import React, { useRef, useState } from 'react';
import { ImageItem, CropSettings } from '../types';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  ArrowRight,
  ArrowLeft,
  FileText,
  AlertCircle,
  Plus,
  Crop,
  Layers,
  Sparkles,
  FolderPlus,
  RotateCcw,
} from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';

interface ImageUploaderProps {
  images: ImageItem[];
  cumulativeCount: number;
  totalDailyImages: number;
  completedBatches: number;
  startNumber: number;
  prefix: string;
  onAddImages: (files: FileList | File[], mode: 'append' | 'new_batch') => void;
  onStartNewProject: () => void;
  onRemoveImage: (id: string) => void;
  onReorderImage: (fromIndex: number, toIndex: number) => void;
  onUpdateImage: (id: string, newPreviewUrl: string, cropSettings?: CropSettings) => void;
  onClearAll: () => void;
  rows: number;
  columns: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  cumulativeCount,
  totalDailyImages,
  completedBatches,
  startNumber,
  prefix,
  onAddImages,
  onStartNewProject,
  onRemoveImage,
  onReorderImage,
  onUpdateImage,
  onClearAll,
  rows,
  columns,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newBatchInputRef = useRef<HTMLInputElement>(null);
  const appendInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const itemsPerPage = Math.max(1, rows * columns);
  const totalPages = Math.ceil(images.length / itemsPerPage) || 0;
  const isSampleList = images.length > 0 && images.every((img) => img.isSample);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'append' | 'new_batch') => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files, mode);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (newBatchInputRef.current) newBatchInputRef.current.value = '';
      if (appendInputRef.current) appendInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddImages(e.dataTransfer.files, isSampleList ? 'new_batch' : 'append');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
      {/* Hidden file inputs for different upload modes */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, isSampleList ? 'new_batch' : 'append')}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={newBatchInputRef}
        onChange={(e) => handleFileChange(e, 'new_batch')}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={appendInputRef}
        onChange={(e) => handleFileChange(e, 'append')}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-800">
              ۱. بارگذاری تصاویر (Upload Images)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            تصاویر را سری به سری آپلود کنید تا در بوم A4 چیده شوند. لیست فقط سری جاری را نشان می‌دهد.
          </p>
        </div>

        {/* Action Toolbars */}
        <div className="flex flex-wrap items-center gap-2">
          {images.length > 0 && !isSampleList && (
            <button
              type="button"
              onClick={() => newBatchInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 px-3.5 py-2 rounded-xl shadow-xs transition-all transform active:scale-95 cursor-pointer"
              title="بارگذاری سری جدید تصاویر (سری قبلی در آمار کل ثبت می‌شود و شماره‌گذاری ادامه می‌یابد)"
            >
              <FolderPlus className="w-4 h-4 text-emerald-200" />
              ➕ بارگذاری سری جدید ({images.length} عکس بعدی)
            </button>
          )}

          {images.length > 0 && (
            <button
              type="button"
              onClick={onStartNewProject}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition-colors cursor-pointer"
              title="شروع پروژه جدید از صفر و پاکسازی تمامی آمار روزانه"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              پروژه جدید (صفر کردن آمار)
            </button>
          )}
        </div>
      </div>

      {/* Sample Images Warning Banner */}
      {isSampleList && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              تصاویر نمونه روی صفحه قرار دارند. با آپلود عکس‌های جدید، تصاویر نمونه پاک خواهند شد.
            </span>
          </div>
          <button
            type="button"
            onClick={() => newBatchInputRef.current?.click()}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
          >
            آپلود عکس‌های من
          </button>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-11 h-11 rounded-full bg-teal-100/70 text-teal-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-slate-800">
            تصاویر سری جدید را اینجا بکشید و رها کنید یا{' '}
            <span className="text-teal-600 underline">انتخاب فایل</span>
          </div>
          <p className="text-xs text-slate-500">
            پشتیبانی از انواع فرمت‌های تصویر (JPG, PNG, WEBP) • انتخاب دسته‌جمعی تصاویر
          </p>
        </div>
      </div>

      {/* Comprehensive Daily & Batch Statistics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-3.5 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cumulative Total Badge */}
          <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30 font-bold">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span>آمار کل تصاویر امروز/پروژه:</span>
            <span className="text-sm font-black text-amber-200 font-mono">
              {totalDailyImages.toLocaleString('fa-IR')} عکس
            </span>
          </div>

          {/* Active Batch Badge */}
          <div className="flex items-center gap-1.5 bg-teal-500/20 text-teal-300 px-3 py-1.5 rounded-lg border border-teal-500/30 font-bold">
            <ImageIcon className="w-4 h-4 text-teal-400 shrink-0" />
            <span>سری جاری:</span>
            <span className="text-sm font-black text-teal-200 font-mono">
              {images.length.toLocaleString('fa-IR')} عکس
            </span>
          </div>

          {/* Active Range Numbering Badge */}
          <div className="flex items-center gap-1 bg-indigo-500/20 text-indigo-200 px-3 py-1.5 rounded-lg border border-indigo-500/30 font-medium">
            <span>شماره‌گذاری فعال:</span>
            <span className="font-bold text-amber-300 font-btitr">
              {prefix || ''}{startNumber}
            </span>
            {images.length > 0 && (
              <span>
                تا {prefix || ''}{startNumber + Math.max(0, totalPages - 1)}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls inside Stats Banner */}
        {images.length > 0 && !isSampleList && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => appendInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3 text-teal-400" />
              افزودن به همین سری
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/60 hover:bg-rose-900/80 px-2.5 py-1 rounded-lg border border-rose-800/80 transition-colors cursor-pointer"
              title="حذف فقط همین ۱۶ عکس سری جاری"
            >
              <RotateCcw className="w-3 h-3" />
              پاکسازی سری جاری
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails Grid */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>لیست تصاویر بارگذاری شده سری جاری ({images.length} عکس):</span>
            <span className="text-slate-500 text-[11px]">
              برای تغییر اولویت چیدمان از کلیدهای جهت‌نما استفاده کنید
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-80 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
            {images.map((img, index) => {
              const pageNumber = Math.floor(index / itemsPerPage) + 1;
              return (
                <div
                  key={img.id}
                  className="group relative bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Image Preview with Hover Crop Trigger */}
                  <div
                    onClick={() => setEditingIndex(index)}
                    className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100 border border-slate-100 cursor-pointer group/img"
                    title="برای ویرایش و کراپ کلیک کنید"
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                    />
                    {/* Hover Overlay with Edit Icon */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-[10px] font-bold">
                      <Crop className="w-4 h-4 text-amber-300" />
                      <span>کراپ و ویرایش</span>
                    </div>

                    {/* Index Badge */}
                    <span className="absolute top-1 right-1 bg-slate-900/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                      #{index + 1}
                    </span>
                    {/* Page Badge */}
                    <span className="absolute bottom-1 left-1 bg-teal-600/90 text-white text-[9px] px-1 py-0.5 rounded-md font-semibold">
                      ص {pageNumber}
                    </span>
                  </div>

                  {/* Title & Edit Quick Button */}
                  <div className="flex items-center justify-between gap-1 mt-1.5 px-0.5">
                    <span className="text-[10px] text-slate-600 font-medium truncate">
                      {img.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(index)}
                      className="text-[9px] text-teal-600 hover:text-teal-700 font-semibold shrink-0 bg-teal-50 hover:bg-teal-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer"
                      title="ویرایش و کراپ تصویر"
                    >
                      <Crop className="w-2.5 h-2.5" />
                      کراپ
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 text-slate-500">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onReorderImage(index, index - 1)}
                      className="p-1 hover:text-teal-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                      title="انتقال به قبلی"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveImage(img.id)}
                      className="p-1 hover:text-rose-600 text-slate-400 cursor-pointer"
                      title="حذف تصویر"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => onReorderImage(index, index + 1)}
                      className="p-1 hover:text-teal-600 disabled:opacity-30 disabled:hover:text-slate-500 cursor-pointer"
                      title="انتقال به بعدی"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            لیست تصاویر سری جاری خالی است
          </p>
          <p className="text-[11px] text-slate-400">
            برای ادامه کار، فایل‌های سری جدید را آپلود کنید
          </p>
          <button
            type="button"
            onClick={() => newBatchInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-colors cursor-pointer mt-1"
          >
            <Upload className="w-3.5 h-3.5" />
            بارگذاری تصاویر سری جدید
          </button>
        </div>
      )}

      {/* Image Crop & Edit Modal */}
      {editingIndex !== null && editingIndex >= 0 && editingIndex < images.length && (
        <ImageCropModal
          images={images}
          currentIndex={editingIndex}
          isOpen={editingIndex !== null}
          onClose={() => setEditingIndex(null)}
          onSaveCurrentImage={(id, croppedDataUrl, cropSettings) => {
            onUpdateImage(id, croppedDataUrl, cropSettings);
          }}
          onNavigateIndex={(newIndex) => {
            setEditingIndex(newIndex);
          }}
        />
      )}
    </div>
  );
};
