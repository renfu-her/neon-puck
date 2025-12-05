export interface Vector {
  x: number;
  y: number;
}

export interface GameState {
  status: 'IDLE' | 'COUNTDOWN' | 'PLAYING' | 'ENDED';
  scores: {
    player: number;
    ai: number;
  };
  winner: 'PLAYER' | 'AI' | null;
  countdown: number;
}

export interface MatchRecord {
  id: string;
  playerName: string;
  playerScore: number;
  aiScore: number;
  winner: 'PLAYER' | 'AI';
  date: number;
}

export enum SoundEffect {
  HIT = 'hit',
  WALL = 'wall',
  GOAL = 'goal',
  WIN = 'win',
  LOSE = 'lose'
}