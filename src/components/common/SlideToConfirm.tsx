import React, { useState, useRef } from 'react';
import { ChevronRight, Check } from 'lucide-react';

interface SlideToConfirmProps {
  label: string;
  confirmedLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'success' | 'orange';
}

export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({
  label,
  confirmedLabel = 'Confirmed',
  onConfirm,
  isLoading = false,
  variant = 'orange',
}) => {
  const [sliderPos, setSliderPos] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = () => {
    if (isConfirmed || isLoading) return;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current || isConfirmed) return;
    const rect = trackRef.current.getBoundingClientRect();
    const handleWidth = 48;
    const maxDrag = rect.width - handleWidth;
    const currentX = e.clientX - rect.left - handleWidth / 2;
    const clamped = Math.max(0, Math.min(currentX, maxDrag));
    setSliderPos(clamped);

    // If dragged >= 90% across, confirm!
    if (clamped >= maxDrag * 0.88) {
      setIsConfirmed(true);
      setIsDragging(false);
      setSliderPos(maxDrag);
      if ('vibrate' in navigator) {
        navigator.vibrate([40, 60, 40]);
      }
      onConfirm();
    }
  };

  const handlePointerUp = () => {
    if (!isConfirmed) {
      setIsDragging(false);
      setSliderPos(0);
    }
  };

  const trackBg = {
    danger: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    orange: 'bg-surface-muted border-border-neutral',
  }[variant];

  const handleBg = {
    danger: 'bg-status-error hover:bg-red-700 text-white shadow-sm',
    success: 'bg-status-success hover:bg-green-700 text-white shadow-sm',
    orange: 'bg-brand-orange hover:bg-brand-orangeHover text-white shadow-sm',
  }[variant];

  return (
    <div
      ref={trackRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`relative w-full h-12 rounded-xl border flex items-center p-1 overflow-hidden select-none touch-none ${trackBg}`}
    >
      {/* Background track text */}
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-text-secondary/80 pointer-events-none transition-opacity duration-200">
        {isConfirmed ? confirmedLabel : label}
      </span>

      {/* Slide Thumb Button */}
      <div
        onPointerDown={handlePointerDown}
        style={{
          transform: `translateX(${sliderPos}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing font-bold shadow-md z-10 transition-colors ${handleBg}`}
      >
        {isConfirmed ? (
          <Check className="w-5 h-5 stroke-[2.5]" />
        ) : (
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        )}
      </div>
    </div>
  );
};
