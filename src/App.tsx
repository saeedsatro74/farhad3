import React, { useState, useEffect } from 'react';
import { LayoutSettings, ImageItem, CropSettings, AuthUser } from './types';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
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
    innerBorderWidth: 6,
    innerBorderColor: '#000000',
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

const AUTH_STORAGE_KEY = 'farhad_fotoset_auth_user';

export default function App() {
  const [settings, setSettings] = useState<LayoutSettings>(INITIAL_SETTINGS);
  const [images, setImages] = useState<ImageItem[]>([]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogin = (user: AuthUser, rememberMe: boolean) => {
    setCurrentUser(user);
    if (rememberMe) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } catch (e) {
        console.error('Failed to save auth to localStorage', e);
      }
    } else {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {
        console.error('Failed to remove auth', e);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove auth', e);
    }
  };

  // Daily / Session Cumulative Statistics
  const [cumulativeCount, setCumulativeCount] = useState<number>(0);
  const [cumulativePages, setCumulativePages] = useState<number>(0);
  const [completedBatches, setCompletedBatches] = useState<number>(0);


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

  // Handle adding images (either append to current batch, or load as a NEW batch continuing numbering)
  const handleAddImages = async (
    files: FileList | File[],
    mode: 'append' | 'new_batch' = 'append'
  ) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: ImageItem[] = fileArray.map((file, idx) => {
      const previewUrl = URL.createObjectURL(file);
      return {
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        originalUrl: previewUrl,
        name: file.name,
      };
    });

    const isAllSamples = images.length > 0 && images.every((item) => item.isSample);

    let updatedImages: ImageItem[];

    if (mode === 'new_batch' || isAllSamples) {
      // Archive previous real images count
      if (!isAllSamples && images.length > 0) {
        const prevBatchCount = images.length;
        const itemsPerPage = Math.max(1, settings.page.rows * settings.page.columns);
        const prevPages = Math.max(1, Math.ceil(prevBatchCount / itemsPerPage));

        setCumulativeCount((prev) => prev + prevBatchCount);
        setCumulativePages((prev) => prev + prevPages);
        setCompletedBatches((prev) => prev + 1);

        // Advance start number to continue numbering seamlessly
        setSettings((current) => ({
          ...current,
          numbering: {
            ...current.numbering,
            startNumber: current.numbering.startNumber + prevPages,
          },
        }));

        // Clean up previous blob URLs
        images.forEach((item) => {
          if (item.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
      } else {
        // Replacing sample images on first real upload
        images.forEach((item) => {
          if (item.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
      }

      updatedImages = newItems;
    } else {
      updatedImages = [...images, ...newItems];
    }

    setImages(updatedImages);

    // Automatically adjust layout to smart grid based on active batch count
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

  // Start a completely fresh project (Clear daily stats and all active images)
  const handleStartNewProject = () => {
    const isAllSamples = images.length > 0 && images.every((item) => item.isSample);
    
    if (!isAllSamples && (images.length > 0 || cumulativeCount > 0)) {
      if (!window.confirm('آیا از شروع پروژه جدید و صفر کردن آمار کل اطمینان دارید؟ تمامی تصاویر بارگذاری شده و آمار پاک خواهند شد.')) {
        return;
      }
    }

    images.forEach((item) => {
      if (item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setImages([]);
    setCumulativeCount(0);
    setCumulativePages(0);
    setCompletedBatches(0);
    setSettings((prev) => ({
      ...prev,
      numbering: {
        ...prev.numbering,
        startNumber: 1,
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
  const handleUpdateImage = (id: string, newPreviewUrl: string, cropSettings?: CropSettings) => {
    setImages((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const originalUrl = item.originalUrl || item.previewUrl;
          return {
            ...item,
            previewUrl: newPreviewUrl,
            originalUrl,
            cropSettings: cropSettings || item.cropSettings,
          };
        }
        return item;
      })
    );
  };

  // Archive current active batch into cumulative total and clear active list & preview, advancing numbering for next batch
  const handleCompleteCurrentBatch = () => {
    const isAllSamples = images.length > 0 && images.every((item) => item.isSample);

    if (images.length === 0 || isAllSamples) {
      images.forEach((item) => {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      setImages([]);
      return;
    }

    const prevBatchCount = images.length;
    const itemsPerPage = Math.max(1, settings.page.rows * settings.page.columns);
    const prevPages = Math.max(1, Math.ceil(prevBatchCount / itemsPerPage));

    setCumulativeCount((prev) => prev + prevBatchCount);
    setCumulativePages((prev) => prev + prevPages);
    setCompletedBatches((prev) => prev + 1);

    // Advance start number seamlessly (e.g. B1 -> B2)
    setSettings((current) => ({
      ...current,
      numbering: {
        ...current.numbering,
        startNumber: current.numbering.startNumber + prevPages,
      },
    }));

    // Clear current images from state & preview
    images.forEach((item) => {
      if (item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setImages([]);
  };

  // Clear current active batch without archiving
  const handleClearCurrentBatch = () => {
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

  const isAllSamples = images.length > 0 && images.every((item) => item.isSample);
  const totalDailyImages = cumulativeCount + (isAllSamples ? 0 : images.length);

  // If user is not authenticated, show the Login Page
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Vazirmatn',tahoma,sans-serif]" dir="rtl">
      {/* Top Navbar */}
      <Header
        onReset={handleResetSettings}
        onLoadSamples={handleLoadSamples}
        onStartNewProject={handleStartNewProject}
        hasImages={images.length > 0}
        totalDailyImages={totalDailyImages}
        completedBatches={completedBatches}
        currentUser={currentUser}
        onLogout={handleLogout}
      />


      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Step 1: Upload & Reordering Gallery Section */}
        <div className="w-full">
          <ImageUploader
            images={images}
            cumulativeCount={cumulativeCount}
            totalDailyImages={totalDailyImages}
            completedBatches={completedBatches}
            startNumber={settings.numbering.startNumber}
            prefix={settings.numbering.prefix}
            onAddImages={handleAddImages}
            onCompleteBatch={handleCompleteCurrentBatch}
            onStartNewProject={handleStartNewProject}
            onRemoveImage={handleRemoveImage}
            onReorderImage={handleReorderImage}
            onUpdateImage={handleUpdateImage}
            onClearAll={handleClearCurrentBatch}
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
              totalDailyImages={totalDailyImages}
              cumulativeCount={cumulativeCount}
            />
          </div>

          {/* Live Preview & Output Panel (7 cols) */}
          <div className="lg:col-span-7 space-y-6 sticky top-20">
            <LivePreview
              settings={settings}
              images={images}
              totalDailyImages={totalDailyImages}
              completedBatches={completedBatches}
              cumulativeCount={cumulativeCount}
              cumulativePages={cumulativePages}
              onCompleteBatch={handleCompleteCurrentBatch}
              onStartNewProject={handleStartNewProject}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
