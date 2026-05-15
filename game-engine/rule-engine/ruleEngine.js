export const ROUND_TYPES = {
  AVOID_AI_PREDICTION: "AVOID_AI_PREDICTION",
  TARGET_ZONE: "TARGET_ZONE",
  REVERSE_TRAP: "REVERSE_TRAP",
};

export function selectRoundRule(roundNumber, difficulty) {
  if (roundNumber <= 3) {
    return ROUND_TYPES.AVOID_AI_PREDICTION;
  }
  
  if (difficulty < 0.35) {
    return ROUND_TYPES.AVOID_AI_PREDICTION;
  }

  const pool = [
    ROUND_TYPES.AVOID_AI_PREDICTION,
    ROUND_TYPES.TARGET_ZONE,
    ROUND_TYPES.REVERSE_TRAP,
  ];

  return pool[Math.floor(Math.random() * pool.length)];
}