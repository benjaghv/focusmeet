// src/components/ProgressBar.tsx
'use client';

// No React hooks needed here

interface ProgressBarProps {
  progress: number;
  status: string;
}

export function ProgressBar({ progress, status }: ProgressBarProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{status}</span>
        <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}