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
} from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';

interface ImageUploaderProps {
  images: ImageItem[];
  onAddImages: (files: FileList | File[], replaceExisting?: boolean) => void;
  onRemoveImage: (id: string) => void;
  onReorderImage: (fromIndex: number, toIndex: number) => void;
  onUpdateImage: (id: string, newPreviewUrl: string, cropSettings?: CropSettings) => void;
  onClearAll: () => void;
  rows: number;
  columns: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onAddImages,
  onRemoveImage,
  onReorderImage,
  onUpdateImage,
  onClearAll,
  rows,
  columns,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const itemsPerPage = Math.max(1, rows * columns);
  const totalPages = Math.ceil(images.length / itemsPerPage) || 0;
  const isSampleList = images.length > 0 && images.every((img) => img.isSample);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, replace = false) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImages(e.target.files, replace);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (replaceInputRef.current) replaceInputRef.current.value = '';
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
      onAddImages(e.dataTransfer.files, isSampleList);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, isSampleList)}
        multiple
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={(e) => handleFileChange(e, true)}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-800">
              ۱. بارگذاری تصاویر (Upload Images)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            تصاویر دلخواه خود را آپلود کنید تا در شبکه A4 چیده شوند.
          </p>
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {!isSampleList && (
              <button
                type="button"
                onClick={() => replaceInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                جایگزینی با تصاویر جدید
              </button>
            )}

            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف همه ({images.length})
            </button>
          </div>
        )}
      </div>

      {/* Sample Images Warning Banner */}
      {isSampleList && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              تصاویر نمونه روی صفحه قرار دارند. با انتخاب یا کشیدن فایل‌های خودتان، این تصاویر نمونه به‌طور خودکار پاک خواهند شد.
            </span>
          </div>
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
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
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
            : 'border-slate-300 hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/30'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-teal-100/70 text-teal-600 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-800">
            تصاویر را اینجا بکشید و رها کنید یا{' '}
            <span className="text-teal-600 underline">انتخاب فایل</span>
          </div>
          <p className="text-xs text-slate-500">
            فرمت‌های پشتیبانی شده: JPG, PNG, WEBP, GIF (امکان انتخاب چندتایی)
          </p>
        </div>
      </div>

      {/* Stats Summary Badges */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-teal-700 font-bold">
              <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
              تعداد تصاویر: {images.length.toLocaleString('fa-IR')}
            </span>
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-amber-700 font-bold">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              تعداد صفحات A4: {totalPages.toLocaleString('fa-IR')}
            </span>
          </div>
          <div className="text-slate-500 text-[11px]">
            ظرفیت هر صفحه: {itemsPerPage} تصویر ({rows} سطر × {columns} ستون)
          </div>
        </div>
      )}

      {/* Thumbnails Grid */}
      {images.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>لیست تصاویر بارگذاری شده:</span>
            <span>برای تغییر اولویت چیدمان از کلیدهای جهت‌نما استفاده کنید</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-80 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
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
                    <span className="absolute bottom-1 left-1 bg-teal-600/90 text-white text-[9px] px-1 py-0.5 rounded-md">
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
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">
            هنوز تصویری آپلود نشده است
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            تصاویر مورد نظر خود را آپلود کنید تا خروجی چیدمان A4 ساخته شود
          </p>
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
