import React from 'react';
import { X, BarChart2, Target } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-[#182230]/48 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white border border-border-neutral rounded-2xl shadow-card-hover overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-border-neutral bg-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-soft border border-brand-orange/30 flex items-center justify-center text-brand-orange">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-text-primary">
                Tournament Analytics &amp; Court Statistics
              </h3>
              <p className="text-xs text-text-secondary">
                70th Senior National Championship Benchmarks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border-neutral transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral text-center">
              <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
                Avg. Set Duration
              </span>
              <span className="text-2xl font-score font-bold text-text-primary">
                27.8m
              </span>
              <span className="text-[10px] text-brand-orange block mt-0.5">
                +3.2m in finals
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral text-center">
              <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
                Top Smash Velocity
              </span>
              <span className="text-2xl font-score font-bold text-text-primary">
                178 <span className="text-xs font-sans font-normal text-text-secondary">km/h</span>
              </span>
              <span className="text-[10px] text-brand-orangeHover block mt-0.5">
                Wool Ball Max
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral text-center">
              <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
                1st Hand Conversions
              </span>
              <span className="text-2xl font-score font-bold text-text-primary">
                68.4%
              </span>
              <span className="text-[10px] text-brand-orange block mt-0.5">
                Point holds
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-muted border border-border-neutral text-center">
              <span className="text-[10px] uppercase font-bold text-text-secondary block mb-1">
                Rallies &gt; 20 Shots
              </span>
              <span className="text-2xl font-score font-bold text-text-primary">
                42
              </span>
              <span className="text-[10px] text-brand-orange block mt-0.5">
                In tournament
              </span>
            </div>
          </div>

          {/* Ball Badminton Official Dimension Comparison */}
          <div className="p-4 rounded-xl bg-brand-soft border border-brand-orange/30 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Target className="w-4 h-4 text-brand-orange" />
              <span>Official Court &amp; Equipment Specifications (BBFI)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text-secondary">
              <div className="flex justify-between py-1 border-b border-border-neutral">
                <span>Official Ball:</span>
                <span className="text-text-primary font-medium">Yellow Wool (27g - 30g)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-neutral">
                <span>Outdoor Court Size:</span>
                <span className="text-text-primary font-medium">12m x 24m (Fives)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-neutral">
                <span>Net Height at Centre:</span>
                <span className="text-text-primary font-medium">1.52m (5 Feet)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-neutral">
                <span>Winning Score:</span>
                <span className="text-text-primary font-medium">29 Points (Best of 3 Sets)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-neutral bg-surface-muted flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Phase 1 Analytics Preview • Detailed charts coming in Phase 2
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-surface-muted text-text-primary border border-border-neutral transition-colors shadow-sm"
          >
            Close Analytics
          </button>
        </div>

      </div>
    </div>
  );
};
