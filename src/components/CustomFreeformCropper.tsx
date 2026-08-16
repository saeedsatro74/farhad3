import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface CropRect {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

interface CustomFreeformCropperProps {
  imageSrc: string;
  cropRect: CropRect;
  onChangeCropRect: (newRect: CropRect) => void;
  rotation: number;
  flip: { horizontal: boolean; vertical: boolean };
  zoomScale?: number;
}

type HandleType =
  | 'move'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | null;

export const CustomFreeformCropper: React.FC<CustomFreeformCropperProps> = ({
  imageSrc,
  cropRect,
  onChangeCropRect,
  rotation,
  flip,
  zoomScale = 1.0,
}) => {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [displayedMetrics, setDisplayedMetrics] = useState<{
    width: number;
    height: number;
    scale: number;
  }>({ width: 0, height: 0, scale: 1 });

  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    rect: CropRect;
  } | null>(null);

  // Load natural image
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (isMounted) {
        setImgElement(img);
        setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = imageSrc;
    return () => {
      isMounted = false;
    };
  }, [imageSrc]);

  // Calculate container dimensions and uniform scale factor
  const updateMetrics = useCallback(() => {
    if (!workspaceRef.current || !imgNaturalSize) return;

    const padding = 32;
    const wsWidth = Math.max(40, workspaceRef.current.clientWidth - padding);
    const wsHeight = Math.max(40, workspaceRef.current.clientHeight - padding);

    const rotRad = (rotation * Math.PI) / 180;
    const bBoxW =
      Math.abs(Math.cos(rotRad) * imgNaturalSize.width) +
      Math.abs(Math.sin(rotRad) * imgNaturalSize.height);
    const bBoxH =
      Math.abs(Math.sin(rotRad) * imgNaturalSize.width) +
      Math.abs(Math.cos(rotRad) * imgNaturalSize.height);

    if (bBoxW <= 0 || bBoxH <= 0) return;

    // Uniform scale to fit perfectly inside the workspace without distortion
    const scale = Math.min(wsWidth / bBoxW, wsHeight / bBoxH);

    const targetW = Math.max(40, Math.round(bBoxW * scale));
    const targetH = Math.max(40, Math.round(bBoxH * scale));

    setDisplayedMetrics({
      width: targetW,
      height: targetH,
      scale,
    });
  }, [imgNaturalSize, rotation]);

  useEffect(() => {
    updateMetrics();
  }, [updateMetrics]);

  useEffect(() => {
    if (!workspaceRef.current) return;
    const observer = new ResizeObserver(() => {
      updateMetrics();
    });
    observer.observe(workspaceRef.current);
    return () => observer.disconnect();
  }, [updateMetrics]);

  // Render rotated and flipped image on preview canvas with strictly preserved aspect ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      !imgElement ||
      !imgNaturalSize ||
      displayedMetrics.width <= 0 ||
      displayedMetrics.height <= 0
    ) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(displayedMetrics.width * dpr);
    canvas.height = Math.round(displayedMetrics.height * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);

    // Fill background
    ctx.fillStyle = '#020617'; // slate-950
    ctx.fillRect(0, 0, displayedMetrics.width, displayedMetrics.height);

    const rotRad = (rotation * Math.PI) / 180;

    // Calculate exact drawn dimensions preserving original natural aspect ratio
    const drawW = imgNaturalSize.width * displayedMetrics.scale;
    const drawH = imgNaturalSize.height * displayedMetrics.scale;

    ctx.translate(displayedMetrics.width / 2, displayedMetrics.height / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.drawImage(imgElement, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();
  }, [imgElement, imgNaturalSize, displayedMetrics, rotation, flip]);

  const handleStart = (
    e: React.MouseEvent | React.TouchEvent,
    handle: HandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setActiveHandle(handle);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      rect: { ...cropRect },
    };
  };

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!activeHandle || !dragStartRef.current || !containerRef.current)
        return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const container = containerRef.current.getBoundingClientRect();
      if (container.width === 0 || container.height === 0) return;

      const deltaXPercent =
        ((clientX - dragStartRef.current.mouseX) / container.width) * 100;
      const deltaYPercent =
        ((clientY - dragStartRef.current.mouseY) / container.height) * 100;

      const initial = dragStartRef.current.rect;
      const minSize = 2; // minimum 2% width/height

      const iLeft = initial.x;
      const iTop = initial.y;
      const iRight = initial.x + initial.width;
      const iBottom = initial.y + initial.height;

      let newX = initial.x;
      let newY = initial.y;
      let newWidth = initial.width;
      let newHeight = initial.height;

      switch (activeHandle) {
        case 'move': {
          newX = Math.max(
            0,
            Math.min(100 - initial.width, initial.x + deltaXPercent)
          );
          newY = Math.max(
            0,
            Math.min(100 - initial.height, initial.y + deltaYPercent)
          );
          break;
        }
        case 'top': {
          const proposedTop = Math.max(0, Math.min(iBottom - minSize, iTop + deltaYPercent));
          newY = proposedTop;
          newHeight = iBottom - proposedTop;
          break;
        }
        case 'bottom': {
          const proposedBottom = Math.min(100, Math.max(iTop + minSize, iBottom + deltaYPercent));
          newY = iTop;
          newHeight = proposedBottom - iTop;
          break;
        }
        case 'left': {
          const proposedLeft = Math.max(0, Math.min(iRight - minSize, iLeft + deltaXPercent));
          newX = proposedLeft;
          newWidth = iRight - proposedLeft;
          break;
        }
        case 'right': {
          const proposedRight = Math.min(100, Math.max(iLeft + minSize, iRight + deltaXPercent));
          newX = iLeft;
          newWidth = proposedRight - iLeft;
          break;
        }
        case 'top-left': {
          const proposedTop = Math.max(0, Math.min(iBottom - minSize, iTop + deltaYPercent));
          const proposedLeft = Math.max(0, Math.min(iRight - minSize, iLeft + deltaXPercent));
          newY = proposedTop;
          newHeight = iBottom - proposedTop;
          newX = proposedLeft;
          newWidth = iRight - proposedLeft;
          break;
        }
        case 'top-right': {
          const proposedTop = Math.max(0, Math.min(iBottom - minSize, iTop + deltaYPercent));
          const proposedRight = Math.min(100, Math.max(iLeft + minSize, iRight + deltaXPercent));
          newY = proposedTop;
          newHeight = iBottom - proposedTop;
          newX = iLeft;
          newWidth = proposedRight - iLeft;
          break;
        }
        case 'bottom-left': {
          const proposedBottom = Math.min(100, Math.max(iTop + minSize, iBottom + deltaYPercent));
          const proposedLeft = Math.max(0, Math.min(iRight - minSize, iLeft + deltaXPercent));
          newY = iTop;
          newHeight = proposedBottom - iTop;
          newX = proposedLeft;
          newWidth = iRight - proposedLeft;
          break;
        }
        case 'bottom-right': {
          const proposedBottom = Math.min(100, Math.max(iTop + minSize, iBottom + deltaYPercent));
          const proposedRight = Math.min(100, Math.max(iLeft + minSize, iRight + deltaXPercent));
          newY = iTop;
          newHeight = proposedBottom - iTop;
          newX = iLeft;
          newWidth = proposedRight - iLeft;
          break;
        }
      }

      onChangeCropRect({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    },
    [activeHandle, onChangeCropRect]
  );

  const handleEnd = useCallback(() => {
    setActiveHandle(null);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [activeHandle, handleMove, handleEnd]);

  const transformStyle = {
    transform: `scale(${zoomScale})`,
    transition: activeHandle ? 'none' : 'transform 0.15s ease-out',
  };

  return (
    <div
      ref={workspaceRef}
      className="relative w-full h-full min-h-0 min-w-0 flex items-center justify-center p-4 bg-slate-950 select-none overflow-hidden"
    >
      {displayedMetrics.width > 0 && displayedMetrics.height > 0 && (
        <div
          ref={containerRef}
          className="relative shadow-2xl transition-transform duration-100 shrink-0"
          style={{
            width: `${displayedMetrics.width}px`,
            height: `${displayedMetrics.height}px`,
            ...transformStyle,
          }}
        >
          {/* Base Rotated & Flipped Image Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full block rounded-xs pointer-events-none"
            style={{
              width: `${displayedMetrics.width}px`,
              height: `${displayedMetrics.height}px`,
            }}
          />

          {/* Active Crop Box Window */}
          <div
            className="absolute border-2 border-amber-400 cursor-move z-20 group"
            style={{
              left: `${cropRect.x}%`,
              top: `${cropRect.y}%`,
              width: `${cropRect.width}%`,
              height: `${cropRect.height}%`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
            }}
            onMouseDown={(e) => handleStart(e, 'move')}
            onTouchStart={(e) => handleStart(e, 'move')}
          >
            {/* Inner Grid Guidelines (Rule of thirds) */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div className="border-r border-b border-white/60" />
              <div />
            </div>

            {/* Corner Handles */}
            <div
              className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-amber-400 bg-white shadow-lg cursor-nwse-resize z-30 rounded-tl-xs hover:scale-125 transition-transform"
              onMouseDown={(e) => handleStart(e, 'top-left')}
              onTouchStart={(e) => handleStart(e, 'top-left')}
            />
            <div
              className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-amber-400 bg-white shadow-lg cursor-nesw-resize z-30 rounded-tr-xs hover:scale-125 transition-transform"
              onMouseDown={(e) => handleStart(e, 'top-right')}
              onTouchStart={(e) => handleStart(e, 'top-right')}
            />
            <div
              className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-amber-400 bg-white shadow-lg cursor-nesw-resize z-30 rounded-bl-xs hover:scale-125 transition-transform"
              onMouseDown={(e) => handleStart(e, 'bottom-left')}
              onTouchStart={(e) => handleStart(e, 'bottom-left')}
            />
            <div
              className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-amber-400 bg-white shadow-lg cursor-nwse-resize z-30 rounded-br-xs hover:scale-125 transition-transform"
              onMouseDown={(e) => handleStart(e, 'bottom-right')}
              onTouchStart={(e) => handleStart(e, 'bottom-right')}
            />

            {/* Edge Handles */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-amber-400 border border-white rounded-xs shadow-md cursor-ns-resize z-30 hover:scale-110 transition-transform"
              onMouseDown={(e) => handleStart(e, 'top')}
              onTouchStart={(e) => handleStart(e, 'top')}
            />
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-amber-400 border border-white rounded-xs shadow-md cursor-ns-resize z-30 hover:scale-110 transition-transform"
              onMouseDown={(e) => handleStart(e, 'bottom')}
              onTouchStart={(e) => handleStart(e, 'bottom')}
            />
            <div
              className="absolute top-1/2 -left-2 -translate-y-1/2 h-10 w-3.5 bg-amber-400 border border-white rounded-xs shadow-md cursor-ew-resize z-30 hover:scale-110 transition-transform"
              onMouseDown={(e) => handleStart(e, 'left')}
              onTouchStart={(e) => handleStart(e, 'left')}
            />
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 h-10 w-3.5 bg-amber-400 border border-white rounded-xs shadow-md cursor-ew-resize z-30 hover:scale-110 transition-transform"
              onMouseDown={(e) => handleStart(e, 'right')}
              onTouchStart={(e) => handleStart(e, 'right')}
            />
          </div>
        </div>
      )}
    </div>
  );
};
