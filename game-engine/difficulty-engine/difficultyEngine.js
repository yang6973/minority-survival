export function calculateDifficulty({ roundNumber, survivalStreak }) {
  const roundPressure = Math.min(roundNumber * 0.08, 0.55);
  const streakPressure = Math.min(survivalStreak * 0.06, 0.35);

  return Math.min(0.15 + roundPressure + streakPressure, 0.95);
}