import React from 'react';

interface Props {
  count: number;
}

export const CountdownOverlay: React.FC<Props> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 animate-pulse drop-shadow-[0_0_20px_rgba(255,165,0,0.8)]">
        {count}
      </div>
    </div>
  );
};