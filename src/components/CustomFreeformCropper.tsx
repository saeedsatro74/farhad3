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

  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [displayedSize, setDisplayedSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    rect: CropRect;
  } | null>(null);

  // Load natural image size
  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.onload = () => {
      if (isMounted) {
        setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = imageSrc;
    return () => {
      isMounted = false;
    };
  }, [imageSrc]);

  // Recalculate displayed size to fit exact image aspect ratio inside workspace
  const updateDisplayedSize = useCallback(() => {
    if (!workspaceRef.current || !imgNaturalSize) return;

    const padding = 32;
    const wsWidth = workspaceRef.current.clientWidth - padding;
    const wsHeight = workspaceRef.current.clientHeight - padding;

    if (wsWidth <= 0 || wsHeight <= 0) return;

    const isRotatedVertically = (Math.abs(rotation) % 180) !== 0;
    const imgW = isRotatedVertically ? imgNaturalSize.height : imgNaturalSize.width;
    const imgH = isRotatedVertically ? imgNaturalSize.width : imgNaturalSize.height;

    const aspect = imgW / imgH;
    let targetW = wsWidth;
    let targetH = wsWidth / aspect;

    if (targetH > wsHeight) {
      targetH = wsHeight;
      targetW = wsHeight * aspect;
    }

    setDisplayedSize({
      width: Math.max(40, targetW),
      height: Math.max(40, targetH),
    });
  }, [imgNaturalSize, rotation]);

  useEffect(() => {
    updateDisplayedSize();
  }, [updateDisplayedSize]);

  useEffect(() => {
    if (!workspaceRef.current) return;
    const observer = new ResizeObserver(() => {
      updateDisplayedSize();
    });
    observer.observe(workspaceRef.current);
    return () => observer.disconnect();
  }, [updateDisplayedSize]);

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
    transform: `scale(${zoomScale}) rotate(${rotation}deg) scale(${flip.horizontal ? -1 : 1}, ${flip.vertical ? -1 : 1})`,
    transition: activeHandle ? 'none' : 'transform 0.15s ease-out',
  };

  return (
    <div
      ref={workspaceRef}
      className="relative w-full h-full min-h-0 min-w-0 flex items-center justify-center p-4 bg-slate-950 select-none overflow-hidden"
    >
      {displayedSize.width > 0 && displayedSize.height > 0 && (
        <div
          ref={containerRef}
          className="relative shadow-2xl transition-transform duration-100 shrink-0"
          style={{
            width: `${displayedSize.width}px`,
            height: `${displayedSize.height}px`,
            ...transformStyle,
          }}
        >
          {/* Base Image */}
          <img
            src={imageSrc}
            alt="Cropper target"
            className="w-full h-full object-fill pointer-events-none block rounded-xs"
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
              <div className="border-r border-white/60" />
              <div className="border-r border-white/60" />
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
