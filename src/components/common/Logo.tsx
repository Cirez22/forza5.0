import React from 'react';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
};

const Logo: React.FC<LogoProps> = ({ size = 'md', withText = true }) => {
  const sizeMap = {
    sm: { text: 'text-lg', height: '24px' },
    md: { text: 'text-xl', height: '32px' },
    lg: { text: 'text-2xl', height: '40px' },
  };

  return (
    <div className="flex items-center gap-0">
      <img 
        src="/logo negro.png" 
        alt="FORZA" 
        height={sizeMap[size].height}
        style={{ height: sizeMap[size].height }}
      />
      <svg 
        width="12" 
        height="16" 
        viewBox="0 0 12 16" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="-ml-1"
      >
        <polygon 
          points="0,0 12,8 0,16" 
          fill="#FF8A00"
        />
      </svg>
    </div>
  );
};

export default Logo;