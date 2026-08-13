import React, { useState } from 'react';
import {
  LayoutSettings,
  PageOrientation,
  NumberingMode,
  NumberPosition,
} from '../types';
import {
  Sliders,
  Maximize2,
  Minimize2,
  FileText,
  Frame,
  Hash,
  Palette,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bold,
} from 'lucide-react';
import { calculateSmartLayout } from '../utils/smartLayout';

interface PageSettingsFormProps {
  settings: LayoutSettings;
  onChange: (updated: LayoutSettings) => void;
  imageCount: number;
  totalDailyImages?: number;
  cumulativeCount?: number;
}

export const PageSettingsForm: React.FC<PageSettingsFormProps> = ({
  settings,
  onChange,
  imageCount,
  totalDailyImages = 0,
  cumulativeCount = 0,
}) => {
  const [activeSection, setActiveSection] = useState<
    'page' | 'margins' | 'border' | 'numbering' | 'all'
  >('all');

  const [smartFeedback, setSmartFeedback] = useState<string | null>(null);

  const handleApplySmartLayout = () => {
    const result = calculateSmartLayout(imageCount);
    onChange({
      ...settings,
      page: {
        ...settings.page,
        orientation: result.orientation,
        rows: result.rows,
        columns: result.columns,
      },
    });
    setSmartFeedback(result.explanation);
  };

  const updatePage = (key: keyof LayoutSettings['page'], value: any) => {
    onChange({
      ...settings,
      page: {
        ...settings.page,
        [key]: value,
      },
    });
  };

  const updateMargins = (key: keyof LayoutSettings['margins'], value: number) => {
    onChange({
      ...settings,
      margins: {
        ...settings.margins,
        [key]: value,
      },
    });
  };

  const updateBorder = (key: keyof LayoutSettings['border'], value: any) => {
    onChange({
      ...settings,
      border: {
        ...settings.border,
        [key]: value,
      },
    });
  };

  const updateNumbering = (
    key: keyof LayoutSettings['numbering'],
    value: any
  ) => {
    const updatedNumbering = {
      ...settings.numbering,
      [key]: value,
    };

    let updatedMargins = { ...settings.margins };

    // When fontSize is updated, ensure top or bottom margin is large enough
    if (key === 'fontSize' && typeof value === 'number') {
      const minMarginNeeded = value + 40;
      const pos = updatedNumbering.numberPosition;
      if (pos === 'top' || pos === 'top-left' || pos === 'top-right') {
        if (updatedMargins.marginTop < minMarginNeeded) {
          updatedMargins.marginTop = minMarginNeeded;
        }
      } else {
        if (updatedMargins.marginBottom < minMarginNeeded) {
          updatedMargins.marginBottom = minMarginNeeded;
        }
      }
    }

    onChange({
      ...settings,
      margins: updatedMargins,
      numbering: updatedNumbering,
    });
  };

  // Quick preset loader matching original HTML parameters
  const applyPreset = (preset: 'default_2x8' | 'grid_2x4' | 'grid_3x3' | 'compact_margins') => {
    if (preset === 'default_2x8') {
      onChange({
        page: { orientation: 'landscape', rows: 2, columns: 8 },
        margins: { marginTop: 200, marginRight: 100, marginBottom: 100, marginLeft: 100 },
        border: { borderWidth: 12, borderColor: '#000000' },
        numbering: {
          prefix: 'B',
          fontSize: 60,
          isBold: true,
          startNumber: 1,
          numberingMode: 'sequential',
          numberPosition: 'top',
          numberMargin: 50,
        },
      });
    } else if (preset === 'grid_2x4') {
      onChange({
        page: { orientation: 'landscape', rows: 2, columns: 4 },
        margins: { marginTop: 180, marginRight: 120, marginBottom: 120, marginLeft: 120 },
        border: { borderWidth: 10, borderColor: '#000000' },
        numbering: {
          prefix: 'A',
          fontSize: 55,
          isBold: true,
          startNumber: 1,
          numberingMode: 'sequential',
          numberPosition: 'top',
          numberMargin: 40,
        },
      });
    } else if (preset === 'grid_3x3') {
      onChange({
        page: { orientation: 'portrait', rows: 3, columns: 3 },
        margins: { marginTop: 150, marginRight: 100, marginBottom: 100, marginLeft: 100 },
        border: { borderWidth: 8, borderColor: '#1e293b' },
        numbering: {
          prefix: 'P',
          fontSize: 50,
          isBold: true,
          startNumber: 1,
          numberingMode: 'sequential',
          numberPosition: 'top-right',
          numberMargin: 40,
        },
      });
    } else if (preset === 'compact_margins') {
      onChange({
        ...settings,
        margins: { marginTop: 100, marginRight: 50, marginBottom: 50, marginLeft: 50 },
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
      
      {/* Form Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-teal-600" />
          <h2 className="text-base font-bold text-slate-800">
            تنظیمات چیدمان و صفحه
          </h2>
        </div>
        <span className="text-xs text-slate-400">تنظیم متغیرها</span>
      </div>

      {/* Quick Presets & Smart Layout */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600">
            پیش‌فرض‌های آماده و چیدمان خودکار:
          </label>
          {imageCount > 0 && (
            <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              تعداد عکس‌ها: {imageCount.toLocaleString('fa-IR')}
            </span>
          )}
        </div>

        {/* Smart Layout Button */}
        <button
          type="button"
          onClick={handleApplySmartLayout}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-teal-600 to-cyan-600 hover:from-amber-600 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-teal-500/15 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>چیدمان هوشمند خودکار (براساس {imageCount.toLocaleString('fa-IR')} عکس)</span>
        </button>

        {smartFeedback && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold rounded-lg p-2 text-center transition-all">
            ✨ {smartFeedback}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => applyPreset('default_2x8')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors text-center cursor-pointer"
          >
            افقی ۲×۸ (کد اولیه)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('grid_2x4')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors text-center cursor-pointer"
          >
            افقی ۲×۴
          </button>
          <button
            type="button"
            onClick={() => applyPreset('grid_3x3')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors text-center cursor-pointer"
          >
            عمودی ۳×۳
          </button>
          <button
            type="button"
            onClick={() => applyPreset('compact_margins')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors text-center cursor-pointer"
          >
            حاشیه کم
          </button>
        </div>
      </div>

      {/* 1. PAGE SETTINGS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <FileText className="w-4 h-4 text-teal-600" />
          <span>تنظیمات صفحه (Page Settings)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Orientation */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              جهت کاغذ (Orientation)
            </label>
            <select
              value={settings.page.orientation}
              onChange={(e) =>
                updatePage('orientation', e.target.value as PageOrientation)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="landscape">افقی (Landscape)</option>
              <option value="portrait">عمودی (Portrait)</option>
            </select>
          </div>

          {/* Rows */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              تعداد سطر در صفحه (Rows)
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={settings.page.rows}
              onChange={(e) => updatePage('rows', parseInt(e.target.value) || 1)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Columns */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              تعداد ستون در صفحه (Columns)
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={settings.page.columns}
              onChange={(e) => updatePage('columns', parseInt(e.target.value) || 1)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 2. MARGINS SETTINGS */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Maximize2 className="w-4 h-4 text-teal-600" />
            <span>تنظیمات حاشیه‌ها (Margins)</span>
          </div>
          <span className="text-[11px] text-slate-400">برحسب پیکسل بوم (mm / px)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              حاشیه بالا (Top)
            </label>
            <input
              type="number"
              min={0}
              value={settings.margins.marginTop}
              onChange={(e) =>
                updateMargins('marginTop', parseInt(e.target.value) || 0)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              حاشیه راست (Right)
            </label>
            <input
              type="number"
              min={0}
              value={settings.margins.marginRight}
              onChange={(e) =>
                updateMargins('marginRight', parseInt(e.target.value) || 0)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              حاشیه پایین (Bottom)
            </label>
            <input
              type="number"
              min={0}
              value={settings.margins.marginBottom}
              onChange={(e) =>
                updateMargins('marginBottom', parseInt(e.target.value) || 0)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              حاشیه چپ (Left)
            </label>
            <input
              type="number"
              min={0}
              value={settings.margins.marginLeft}
              onChange={(e) =>
                updateMargins('marginLeft', parseInt(e.target.value) || 0)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* 3. IMAGE BORDER SETTINGS */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Frame className="w-4 h-4 text-teal-600" />
          <span>تنظیمات کادر تصویر (Outer Border)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ضخامت کادر بیرونی (Border Width px)
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={settings.border.borderWidth}
              onChange={(e) =>
                updateBorder('borderWidth', parseInt(e.target.value) || 0)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              رنگ کادر بیرونی (Border Color)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.border.borderColor}
                onChange={(e) => updateBorder('borderColor', e.target.value)}
                className="w-10 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-slate-50"
              />
              <input
                type="text"
                value={settings.border.borderColor}
                onChange={(e) => updateBorder('borderColor', e.target.value)}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. NUMBERING SETTINGS */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Hash className="w-4 h-4 text-teal-600" />
          <span>تنظیمات شماره‌گذاری (Numbering Settings)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                پیشوند شماره‌ها (فونت B Titr)
              </label>
              <button
                type="button"
                onClick={() =>
                  updateNumbering('isBold', !(settings.numbering.isBold !== false))
                }
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  settings.numbering.isBold !== false
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300/60'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
                title="تغییر حالت پررنگ / ضخیم (Bold)"
              >
                <Bold className="w-3 h-3" />
                <span>پررنگ (Bold)</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="مثلا B یا شماره"
              value={settings.numbering.prefix}
              onChange={(e) => updateNumbering('prefix', e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-btitr font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              شماره شروع (Start Number)
            </label>
            <input
              type="number"
              min={1}
              value={settings.numbering.startNumber}
              onChange={(e) =>
                updateNumbering('startNumber', parseInt(e.target.value) || 1)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              حالت شماره‌گذاری (Mode)
            </label>
            <select
              value={settings.numbering.numberingMode}
              onChange={(e) =>
                updateNumbering('numberingMode', e.target.value as NumberingMode)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="sequential">متوالی (Sequential)</option>
              <option value="random">تصادفی (Random)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              اندازه قلم شماره (Font Size)
            </label>
            <input
              type="number"
              min={10}
              max={200}
              value={settings.numbering.fontSize}
              onChange={(e) =>
                updateNumbering('fontSize', parseInt(e.target.value) || 20)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              موقعیت شماره (Position)
            </label>
            <select
              value={settings.numbering.numberPosition}
              onChange={(e) =>
                updateNumbering(
                  'numberPosition',
                  e.target.value as NumberPosition
                )
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="top">بالای وسط (Top Center)</option>
              <option value="top-left">بالا چپ (Top Left)</option>
              <option value="top-right">بالا راست (Top Right)</option>
              <option value="bottom-left">پایین چپ (Bottom Left)</option>
              <option value="bottom-right">پایین راست (Bottom Right)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              فاصله شماره از حاشیه (Margin mm)
            </label>
            <input
              type="number"
              min={0}
              value={settings.numbering.numberMargin}
              onChange={(e) =>
                updateNumbering('numberMargin', parseInt(e.target.value) || 0)
              }
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
