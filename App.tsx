
import React, { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { CountdownOverlay } from './components/CountdownOverlay';
import { ResultModal } from './components/ResultModal';
import { GameState, MatchRecord } from './types';
import { getLeaderboard, saveMatch } from './services/storageService';
import { COUNTDOWN_SECONDS, WINNING_SCORE, COLOR_PLAYER, COLOR_AI } from './constants';
import { Trophy, Play, User, Keyboard } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'IDLE',
    scores: { player: 0, ai: 0 },
    winner: null,
    countdown: COUNTDOWN_SECONDS,
  });

  const [playerName, setPlayerName] = useState('');
  const [matchResult, setMatchResult] = useState<MatchRecord | null>(null);
  const [leaderboard, setLeaderboard] = useState<MatchRecord[]>([]);

  // Load leaderboard on mount and update when game ends
  useEffect(() => {
    setLeaderboard(getLeaderboard());
  }, [gameState.status]); 

  // Reset Shortcut (Alt + R)
  const resetToHome = useCallback(() => {
    setGameState({
      status: 'IDLE',
      scores: { player: 0, ai: 0 },
      winner: null,
      countdown: COUNTDOWN_SECONDS // Reset countdown timer for next game
    });
    setMatchResult(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt + R (case insensitive)
      if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        resetToHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetToHome]);

  // Countdown Logic
  useEffect(() => {
    if (gameState.status === 'COUNTDOWN') {
      const interval = setInterval(() => {
        setGameState(prev => {
          if (prev.countdown <= 1) {
            clearInterval(interval);
            return { ...prev, status: 'PLAYING', countdown: 0 };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.status]);

  const startGame = () => {
    if (!playerName.trim()) {
      alert("Please enter a name!");
      return;
    }
    setMatchResult(null);
    setGameState({
      status: 'COUNTDOWN',
      scores: { player: 0, ai: 0 },
      winner: null,
      countdown: COUNTDOWN_SECONDS
    });
  };

  const handleScoreUpdate = (pScore: number, aScore: number) => {
    if (pScore >= WINNING_SCORE || aScore >= WINNING_SCORE) {
      const winner = pScore > aScore ? 'PLAYER' : 'AI';
      finishGame(pScore, aScore, winner);
    } else {
      setGameState(prev => ({
        ...prev,
        scores: { player: pScore, ai: aScore }
      }));
    }
  };

  const finishGame = (pScore: number, aScore: number, winner: 'PLAYER' | 'AI') => {
    const result: MatchRecord = {
      id: Date.now().toString(),
      playerName: playerName,
      playerScore: pScore,
      aiScore: aScore,
      winner,
      date: Date.now()
    };
    
    saveMatch(result);
    setMatchResult(result);
    setGameState(prev => ({ ...prev, status: 'ENDED', scores: { player: pScore, ai: aScore }, winner }));
  };

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-start p-2 font-sans select-none overflow-hidden relative touch-none">
      
      {/* Background Hint (Desktop only) */}
      <div className="absolute top-4 left-4 text-slate-700 text-[10px] font-mono hidden lg:flex items-center gap-2 z-50">
         <Keyboard className="w-3 h-3" />
         <span>ALT + R to Reset</span>
      </div>

      {/* Header / Scoreboard */}
      {gameState.status !== 'IDLE' && (
        <div className="w-full max-w-[500px] flex justify-between items-center mb-2 px-6 py-2 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg shrink-0 z-20">
          <div className="flex flex-col items-start">
            <span className="text-[10px] text-[#ff003c] font-extrabold tracking-widest uppercase mb-1">YOU</span>
            <span className="text-4xl font-mono text-white font-bold drop-shadow-[0_0_15px_rgba(255,0,60,0.6)]">
              {gameState.scores.player}
            </span>
          </div>
          
          <div className="flex flex-col items-center px-4">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Target {WINNING_SCORE}</span>
            <div className="w-px h-6 bg-slate-700"></div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#00f0ff] font-extrabold tracking-widest uppercase mb-1">CPU</span>
            <span className="text-4xl font-mono text-white font-bold drop-shadow-[0_0_15px_rgba(0,240,255,0.6)]">
              {gameState.scores.ai}
            </span>
          </div>
        </div>
      )}

      {/* Main Game Container - Responsive flex filling */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative min-h-0">
        
        {/* Welcome Screen */}
        {gameState.status === 'IDLE' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-fade-in ring-1 ring-white/5 z-30 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-2 italic tracking-tighter">
                NEON<span className="text-[#ff003c]">PUCK</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm">First to {WINNING_SCORE} Wins!</p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1 tracking-wider">Player Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500 group-focus-within:text-[#ff003c] transition-colors" />
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter name"
                  maxLength={10}
                  className="w-full bg-slate-800 text-white pl-10 pr-4 py-3.5 rounded-xl border border-slate-700 focus:border-[#ff003c] focus:ring-1 focus:ring-[#ff003c] outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-[#ff003c] to-red-600 hover:from-red-500 hover:to-[#ff003c] text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(255,0,60,0.4)] flex items-center justify-center gap-2 group transition-all transform active:scale-95 border-t border-white/10"
            >
              <Play className="h-5 w-5 fill-current" />
              PLAY GAME (5s)
            </button>
            
            <p className="mt-4 text-[10px] text-center text-slate-600">
               <span className="font-bold text-slate-400">ALT + R</span> to Reset
            </p>

            {/* Leaderboard */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-4 text-amber-400">
                <Trophy className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Recent Matches</h3>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {leaderboard.length === 0 ? (
                  <div className="text-center text-slate-600 text-xs py-4 italic">No matches recorded yet.</div>
                ) : (
                  leaderboard.map((record) => (
                    <div key={record.id} className="flex justify-between items-center text-xs p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_5px] ${record.winner === 'PLAYER' ? 'bg-green-500 shadow-green-500/50' : 'bg-[#00f0ff] shadow-[#00f0ff]/50'}`} />
                        <span className="text-slate-300 font-bold truncate max-w-[100px]">{record.playerName}</span>
                      </div>
                      <div className="font-mono text-slate-400 font-bold">
                        <span className={record.winner === 'PLAYER' ? 'text-green-400' : ''}>{record.playerScore}</span>
                        <span className="mx-1 opacity-30">/</span>
                        <span className={record.winner === 'AI' ? 'text-[#00f0ff]' : ''}>{record.aiScore}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Canvas */}
        {gameState.status !== 'IDLE' && (
          <div className="flex-1 w-full h-full flex items-center justify-center p-0 md:p-2">
             <GameCanvas 
               gameState={gameState} 
               onScoreUpdate={handleScoreUpdate}
               onGameEnd={() => {}} 
             />
          </div>
        )}

        {/* Overlays */}
        {gameState.status === 'COUNTDOWN' && (
          <CountdownOverlay count={gameState.countdown} />
        )}
        
        {gameState.status === 'ENDED' && matchResult && (
          <ResultModal 
            result={matchResult} 
            onHome={resetToHome} 
            onReplay={startGame} 
          />
        )}

      </div>
    </div>
  );
}
