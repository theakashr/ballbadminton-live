import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to White (Light) background' : 'Switch to Black (Dark) background'}
      title={isDark ? 'Switch to White (Light) background' : 'Switch to Black (Dark) background'}
      className={`tactile-btn inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-200 border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
        isDark
          ? 'bg-charcoal-800/80 hover:bg-charcoal-700/80 text-brand-yellow hover:text-white border-charcoal-700/80 shadow-sm'
          : 'bg-white hover:bg-surface-muted text-text-primary border-border-neutral shadow-sm'
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-brand-yellow transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-plum-900 transition-transform duration-300 hover:-rotate-12" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap">
          {isDark ? 'White Mode' : 'Black Mode'}
        </span>
      )}
    </button>
  );
};
