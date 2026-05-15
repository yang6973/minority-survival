export function calculateSenseScore(round) {
  const playerPercent =
    round.playerChoice === "A"
      ? round.prediction.predictedA
      : round.prediction.predictedB;

  const baseScore = 100 - playerPercent;

  const ruleBonusMap = {
    AVOID_AI_PREDICTION: 5,
    TARGET_ZONE: 8,
    REVERSE_TRAP: 12,
    BIAS_COLLAPSE: 10,
    MINORITY_SURVIVES: 7,
  };

  const bonus = round.survived
    ? ruleBonusMap[round.roundType] ?? 5
    : 0;

  return Math.max(0, Math.min(100, Math.round(baseScore + bonus)));
}

export function buildSenseGrade(score) {
  if (score >= 90) {
    return "눈치 괴물";
  }

  if (score >= 75) {
    return "눈치 빠름";
  }

  if (score >= 55) {
    return "평균 이상";
  }

  if (score >= 35) {
    return "조금 읽힘";
  }

  return "너무 정직함";
}

export function buildSenseTitle(score) {
  if (score >= 95) {
    return "복실이도 못 읽음";
  }

  if (score >= 88) {
    return "눈치 만렙";
  }

  if (score >= 80) {
    return "단톡 눈치 장인";
  }

  if (score >= 72) {
    return "분위기 캐치 고수";
  }

  if (score >= 64) {
    return "적당히 눈치 빠름";
  }

  if (score >= 56) {
    return "살짝 불안한 눈치";
  }

  if (score >= 48) {
    return "눈치 반응 느림";
  }

  return "복실이한테 읽힘";
}