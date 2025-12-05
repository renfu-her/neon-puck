
import React from 'react';
import { MatchRecord } from '../types';

interface Props {
  result: MatchRecord | null;
  onHome: () => void;
  onReplay: () => void;
}

export const ResultModal: React.FC<Props> = ({ result, onHome, onReplay }) => {
  if (!result) return null;

  const isWin = result.winner === 'PLAYER';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
        <h2 className={`text-5xl font-black mb-2 tracking-tighter italic ${isWin ? 'text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'text-[#ff003c] drop-shadow-[0_0_15px_rgba(255,0,60,0.5)]'}`}>
          {isWin ? 'VICTORY' : 'DEFEAT'}
        </h2>
        
        <p className="text-slate-400 mb-8 font-bold text-xs uppercase tracking-[0.2em]">
          Match Result
        </p>

        <div className="flex justify-center items-center gap-8 mb-10 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-[#ff003c] uppercase tracking-wider mb-1">You</span>
                <span className="text-6xl font-mono font-bold text-white leading-none drop-shadow-lg">{result.playerScore}</span>
            </div>
            <div className="text-xl font-black text-slate-600 italic">VS</div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-1">CPU</span>
                <span className="text-6xl font-mono font-bold text-white leading-none drop-shadow-lg">{result.aiScore}</span>
            </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onReplay}
            className="w-full py-4 px-4 bg-white text-slate-900 font-black uppercase tracking-wide rounded-xl shadow-lg hover:bg-slate-100 transform transition active:scale-95"
          >
            Play Again
          </button>
          <button 
            onClick={onHome}
            className="w-full py-4 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold uppercase tracking-wide rounded-xl transition"
          >
            Exit to Menu (Alt+R)
          </button>
        </div>
      </div>
    </div>
  );
};
