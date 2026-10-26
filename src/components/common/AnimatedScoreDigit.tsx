import React, { useState, useEffect } from 'react';

interface AnimatedScoreDigitProps {
  score: number;
  colorVariant?: 'orange' | 'coral' | 'yellow' | 'neutral';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'massive';
  className?: string;
}

export const AnimatedScoreDigit: React.FC<AnimatedScoreDigitProps> = ({
  score,
  colorVariant = 'neutral',
  size = 'lg',
  className = '',
}) => {
  const [animating, setAnimating] = useState(false);
  const [prevScore, setPrevScore] = useState(score);

  useEffect(() => {
    if (score !== prevScore) {
      setAnimating(true);
      setPrevScore(score);
      const timer = setTimeout(() => {
        setAnimating(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [score, prevScore]);

  const sizeClasses = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-extrabold',
    lg: 'text-4xl font-extrabold tracking-tight',
    xl: 'text-5xl sm:text-6xl font-extrabold tracking-tighter',
    massive: 'text-6xl sm:text-8xl font-display font-black tracking-tighter',
  }[size];

  const colorClasses = {
    orange: 'text-brand-orange',
    coral: 'text-brand-coral',
    yellow: 'text-brand-yellow',
    neutral: 'text-text-primary',
  }[colorVariant];

  return (
    <span
      className={`inline-block score-digits transition-all select-none ${sizeClasses} ${colorClasses} ${
        animating ? 'animate-digit-pop' : ''
      } ${className}`}
    >
      {score}
    </span>
  );
};
