import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: 'green' | 'purple' | 'amber';
  children?: React.ReactNode;
}

const colorMap = {
  green: { stroke: 'hsl(157, 90%, 51%)', glow: 'hsl(157, 90%, 51%, 0.3)', track: 'hsl(217, 33%, 22%)' },
  purple: { stroke: 'hsl(263, 100%, 64%)', glow: 'hsl(263, 100%, 64%, 0.3)', track: 'hsl(217, 33%, 22%)' },
  amber: { stroke: 'hsl(38, 92%, 50%)', glow: 'hsl(38, 92%, 50%, 0.3)', track: 'hsl(217, 33%, 22%)' },
};

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'green',
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const colors = colorMap[color];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
          style={{
            filter: `drop-shadow(0 0 6px ${colors.glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default ProgressRing;
