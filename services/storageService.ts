import { MatchRecord } from '../types';

const STORAGE_KEY = 'neon_hockey_leaderboard';

export const getLeaderboard = (): MatchRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load leaderboard", e);
    return [];
  }
};

export const saveMatch = (record: MatchRecord) => {
  try {
    const current = getLeaderboard();
    const updated = [record, ...current].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save match", e);
  }
};