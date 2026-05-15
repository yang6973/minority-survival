function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function getTimeMoodBias() {
  const hour = new Date().getHours();

  if ((hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 22)) {
    return randomBetween(-0.06, 0.08);
  }

  if (hour >= 0 && hour <= 8) {
    return randomBetween(-0.08, 0.04);
  }

  return randomBetween(-0.05, 0.05);
}

function getCrowdVolatility(difficulty) {
  return randomBetween(
    -0.14 + difficulty * 0.04,
    0.14 - difficulty * 0.02
  );
}

function getReverseCrowdShift(roundType, tension) {
  if (roundType !== "REVERSE_TRAP") {
    return 0;
  }

  return randomBetween(-0.18, 0.18) * tension;
}

function getTargetZoneShake(roundType) {
  if (roundType !== "TARGET_ZONE") {
    return 0;
  }

  return randomBetween(-0.1, 0.1);
}

function softenEarlyRoundPrediction(predictedA, difficulty) {
  if (difficulty >= 0.35) {
    return predictedA;
  }

  const gap = Math.abs(predictedA - 0.5);

  if (gap <= 0.06) {
    return predictedA;
  }

  const softened =
    0.5 + (predictedA - 0.5) * 0.45;

  return clamp(softened, 0.42, 0.58);
}

export function predictCrowdChoice({
  question,
  difficulty,
  roundType,
  playerPattern,
}) {
  const base = question.baseBiasA ?? 0.5;
  const tension = question.tension ?? 0.5;

  const timeMoodBias = getTimeMoodBias();
  const crowdVolatility = getCrowdVolatility(difficulty);
  const reverseShift = getReverseCrowdShift(roundType, tension);
  const targetShake = getTargetZoneShake(roundType);

  const patternShift =
    playerPattern?.patternDetected
      ? randomBetween(-0.08, 0.08)
      : 0;

  let predictedA = clamp(
    base +
      timeMoodBias +
      crowdVolatility +
      reverseShift +
      targetShake +
      patternShift,
    0.18,
    0.82
  );

  predictedA = softenEarlyRoundPrediction(
    predictedA,
    difficulty
  );

  const predictedB = 1 - predictedA;

  return {
    predictedA: Math.round(predictedA * 100),
    predictedB: Math.round(predictedB * 100),
    aiPredictedChoice: predictedA >= predictedB ? "A" : "B",
  };
}