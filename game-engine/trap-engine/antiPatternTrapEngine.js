export function detectPlayerPattern(session) {
  const history = session.history ?? [];

  if (history.length < 3) {
    return {
      patternDetected: false,
      patternType: null,
      trapLevel: 0,
    };
  }

  const recent = history.slice(-4);

  const avoidedAiCount = recent.filter((round) => {
    return round.playerChoice !== round.prediction.aiPredictedChoice;
  }).length;

  const alwaysOppositeRate = avoidedAiCount / recent.length;

  if (alwaysOppositeRate >= 0.75) {
    return {
      patternDetected: true,
      patternType: "ALWAYS_OPPOSITE_AI",
      trapLevel: Math.min(alwaysOppositeRate, 1),
    };
  }

  return {
    patternDetected: false,
    patternType: null,
    trapLevel: 0,
  };
}