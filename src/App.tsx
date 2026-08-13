import React, { useState, useEffect } from 'react';
import { LayoutSettings, ImageItem } from './types';
import { Header } from './components/Header';
import { PageSettingsForm } from './components/PageSettingsForm';
import { ImageUploader } from './components/ImageUploader';
import { LivePreview } from './components/LivePreview';
import { Footer } from './components/Footer';
import { generateSampleImages } from './utils/sampleImages';
import { calculateSmartLayout, readImageDimensions } from './utils/smartLayout';

// Default layout configuration matching the exact prompt HTML defaults
const INITIAL_SETTINGS: LayoutSettings = {
  page: {
    orientation: 'landscape',
    rows: 2,
    columns: 8,
  },
  margins: {
    marginTop: 200,
    marginRight: 100,
    marginBottom: 100,
    marginLeft: 100,
  },
  border: {
    borderWidth: 12,
    borderColor: '#000000',
  },
  numbering: {
    prefix: 'B',
    fontSize: 60,
    isBold: true,
    startNumber: 1,
    numberingMode: 'sequential',
    numberPosition: 'top',
    numberMargin: 50,
  },
};

export default function App() {
  const [settings, setSettings] = useState<LayoutSettings>(INITIAL_SETTINGS);
  const [images, setImages] = useState<ImageItem[]>([]);

  // Automatically load 16 sample images on first mount so user sees live output immediately
  useEffect(() => {
    let mounted = true;
    generateSampleImages(16).then((samples) => {
      if (mounted) {
        setImages(samples);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle uploading files and automatically calculate smart grid layout
  const handleAddImages = async (files: FileList | File[], replaceExisting = false) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: ImageItem[] = fileArray.map((file, idx) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        name: file.name,
      };
    });

    const isAllSamples = images.length > 0 && images.every((item) => item.isSample);
    let updatedImages: ImageItem[];

    if (replaceExisting || isAllSamples || images.length === 0) {
      images.forEach((item) => {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      updatedImages = newItems;
    } else {
      updatedImages = [...images, ...newItems];
    }

    setImages(updatedImages);

    // Automatically adjust layout to smart grid based on total count
    const smart = calculateSmartLayout(updatedImages.length);
    setSettings((current) => ({
      ...current,
      page: {
        ...current.page,
        orientation: smart.orientation,
        rows: smart.rows,
        columns: smart.columns,
      },
    }));
  };

  // Remove individual image
  const handleRemoveImage = (id: string) => {
    const target = images.find((item) => item.id === id);
    if (target && target.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const updatedImages = images.filter((item) => item.id !== id);
    setImages(updatedImages);

    if (updatedImages.length > 0) {
      const smart = calculateSmartLayout(updatedImages.length);
      setSettings((current) => ({
        ...current,
        page: {
          ...current.page,
          orientation: smart.orientation,
          rows: smart.rows,
          columns: smart.columns,
        },
      }));
    }
  };

  // Reorder images
  const handleReorderImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setImages(updated);
  };

  // Update image with newly cropped data URL
  const handleUpdateImage = (id: string, newPreviewUrl: string) => {
    setImages((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
          }
          return {
            ...item,
            file: undefined, // now using cropped data URL
            previewUrl: newPreviewUrl,
          };
        }
        return item;
      })
    );
  };

  // Clear all images
  const handleClearAll = () => {
    images.forEach((item) => {
      if (item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setImages([]);
  };

  // Reset settings
  const handleResetSettings = () => {
    setSettings(INITIAL_SETTINGS);
  };

  // Load sample images on demand
  const handleLoadSamples = async () => {
    const samples = await generateSampleImages(16);
    setImages(samples);
    const smart = calculateSmartLayout(samples.length);
    setSettings((current) => ({
      ...current,
      page: {
        ...current.page,
        orientation: smart.orientation,
        rows: smart.rows,
        columns: smart.columns,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Vazirmatn',tahoma,sans-serif]" dir="rtl">
      {/* Top Navbar */}
      <Header
        onReset={handleResetSettings}
        onLoadSamples={handleLoadSamples}
        hasImages={images.length > 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Step 1: Upload & Reordering Gallery Section */}
        <div className="w-full">
          <ImageUploader
            images={images}
            onAddImages={handleAddImages}
            onRemoveImage={handleRemoveImage}
            onReorderImage={handleReorderImage}
            onUpdateImage={handleUpdateImage}
            onClearAll={handleClearAll}
            rows={settings.page.rows}
            columns={settings.page.columns}
          />
        </div>

        {/* Step 2 & 3: Settings & Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls & Configuration Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <PageSettingsForm
              settings={settings}
              onChange={(updated) => setSettings(updated)}
              imageCount={images.length}
            />
          </div>

          {/* Live Preview & Output Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sticky top-20">
            <LivePreview settings={settings} images={images} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
