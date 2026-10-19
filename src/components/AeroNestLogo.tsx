import React from 'react';

export const AeroNestLogo: React.FC<{ size?: number }> = ({ size = 36 }) => {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="m3AeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
        </defs>
        <path
          d="M50 8 L86 29 L86 71 L50 92 L14 71 L14 29 Z"
          stroke="url(#m3AeroGrad)"
          strokeWidth="5"
          strokeLinejoin="round"
          fill="rgba(19, 27, 38, 0.7)"
        />
        <path
          d="M32 38 L50 28 L68 38 L68 58 L50 68 L32 58 Z"
          stroke="#00f2fe"
          strokeWidth="3.5"
          strokeDasharray="4 2"
        />
        <circle cx="50" cy="48" r="6" fill="#10b981" />
      </svg>
      <span className="font-bold text-lg text-m3-on-surface tracking-tight font-ui leading-none">
        Aero<span className="text-m3-primary">Nest</span>
      </span>
    </div>
  );
};
