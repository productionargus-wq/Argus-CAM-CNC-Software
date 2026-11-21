import React, { useRef, useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export default function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = '80vh'
}) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentY(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setCurrentY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 120) {
      onClose?.();
    }
    setCurrentY(0);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Tap backdrop to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        className="w-full bg-slate-900 border-t border-slate-700/80 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 transition-transform duration-150 ease-out"
        style={{
          maxHeight: maxHeight,
          transform: `translateY(${currentY}px)`,
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 16px))'
        }}
      >
        {/* Drag Handle Bar */}
        <div 
          className="w-full py-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-slate-600 rounded-full mb-1" />
        </div>

        {/* Header */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white active:scale-95"
            title="Close Sheet"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
