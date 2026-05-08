import React from 'react';

interface AtomicIconProps {
  className?: string;
  size?: number;
}

const AtomicIcon: React.FC<AtomicIconProps> = ({ className = '', size = 20 }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      className={className}
    >
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1.5" transform="rotate(-60 12 12)" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="22" cy="12" r="1.2" fill="currentColor" opacity="0.7" />
    </svg>
  );
};

export default AtomicIcon;
