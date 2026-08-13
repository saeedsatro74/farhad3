import React from 'react';
import { Camera, Sparkles, RefreshCw, Film } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onLoadSamples: () => void;
  hasImages: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onLoadSamples, hasImages }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand & Creative Farhad Fotoset Logo */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          {/* Creative Logo Emblem */}
          <div className="relative group cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/20 shrink-0 border border-slate-800 transition-transform duration-300 group-hover:scale-105">
              <Camera className="w-5 h-5 text-teal-400 group-hover:rotate-12 transition-transform duration-300" />
              <Film className="w-3.5 h-3.5 text-amber-400 absolute -bottom-0.5 -right-0.5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-indigo-600 via-teal-600 to-amber-500 bg-clip-text text-transparent drop-shadow-2xs">
                  FARHAD FOTOSET
                </span>
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-slate-800 shadow-2xs font-mono">
                STUDIO
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
              <span>فرهاد فتوسِت</span>
              <span className="text-slate-300">•</span>
              <span>سامانه چیدمان هوشمند و صفحه‌بندی تصویر روی کاغذ A4</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!hasImages && (
            <button
              onClick={onLoadSamples}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              تست با تصاویر نمونه
            </button>
          )}

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="بازنشانی تنظیمات اولیه"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            بازنشانی
          </button>

        </div>
      </div>
    </header>
  );
};

