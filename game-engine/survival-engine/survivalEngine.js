import { ROUND_TYPES } from "../rule-engine/ruleEngine.js";

export function judgeSurvival({
  playerChoice,
  prediction,
  roundType,
}) {
  const playerPercent =
    playerChoice === "A"
      ? prediction.predictedA
      : prediction.predictedB;

  if (
    roundType === ROUND_TYPES.AVOID_AI_PREDICTION ||
    roundType === ROUND_TYPES.REVERSE_TRAP
  ) {
    return playerPercent <= 50;  }

  if (roundType === ROUND_TYPES.TARGET_ZONE) {
    return playerPercent >= 25 && playerPercent <= 55;
  }

  return false;
}