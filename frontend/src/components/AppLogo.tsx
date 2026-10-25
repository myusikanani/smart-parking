import React from 'react';

interface AppLogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  text?: string;
  textClassName?: string;
}

const sizeClasses = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-8 h-8 rounded-xl',
  md: 'w-9 h-9 rounded-xl',
  lg: 'w-11 h-11 rounded-2xl',
  xl: 'w-14 h-14 rounded-2xl',
};

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  imgClassName = '',
  size = 'md',
  showText = false,
  text = 'ParkEase',
  textClassName = '',
}) => {
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClass} overflow-hidden shadow-lg shadow-cyan-500/30 border border-cyan-400/30 flex-shrink-0 transition-transform duration-300 hover:scale-105 hover:shadow-cyan-400/50 relative bg-[#06101d]`}
      >
        <img
          src="/logo.png"
          alt="ParkSmart Logo"
          className={`w-full h-full object-cover select-none pointer-events-none ${imgClassName}`}
          loading="eager"
        />
      </div>
      {showText && (
        <span className={`font-bold neon-text ${textClassName || 'text-xl'}`}>
          {text}
        </span>
      )}
    </div>
  );
};

export default AppLogo;
