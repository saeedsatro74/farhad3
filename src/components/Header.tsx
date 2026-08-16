import React from 'react';
import { Camera, Sparkles, RefreshCw, Film, Trash2, Layers, LogOut, UserCheck } from 'lucide-react';
import { AuthUser } from '../types';

interface HeaderProps {
  onReset: () => void;
  onLoadSamples: () => void;
  onStartNewProject: () => void;
  hasImages: boolean;
  totalDailyImages: number;
  completedBatches: number;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onLoadSamples,
  onStartNewProject,
  hasImages,
  totalDailyImages,
  completedBatches,
  currentUser,
  onLogout,
}) => {
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

        {/* Action Controls & Daily Stats & User Profile */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* Daily Cumulative Stats Counter */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-amber-400 text-xs font-bold border border-slate-800 shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>آمار کل پروژه/امروز: {totalDailyImages.toLocaleString('fa-IR')} عکس</span>
            {completedBatches > 0 && (
              <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-md font-normal">
                ({completedBatches.toLocaleString('fa-IR')} سری)
              </span>
            )}
          </div>

          {!hasImages && (
            <button
              onClick={onLoadSamples}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              تصاویر نمونه
            </button>
          )}

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="بازنشانی تنظیمات قالب"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تنظیمات
          </button>

          <button
            onClick={onStartNewProject}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
            title="حذف و صفر کردن آمار روزانه جهت شروع پروژه جدید"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            پروژه جدید
          </button>

          {/* Logged in User Badge & Logout */}
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-slate-100/90 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-bold text-slate-800 leading-tight">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[9px] text-teal-700 font-medium">
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="mr-1.5 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="خروج از حساب کاربری"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


