import { QUESTIONS_V1 } from "../../data/questions/questions_v1.js";
import { selectRoundRule, ROUND_TYPES } from "../rule-engine/ruleEngine.js";
import { calculateDifficulty } from "../difficulty-engine/difficultyEngine.js";
import { predictCrowdChoice } from "../prediction-engine/predictionEngine.js";
import { judgeSurvival } from "../survival-engine/survivalEngine.js";
import { detectPlayerPattern } from "../trap-engine/antiPatternTrapEngine.js";
import {
  selectQuestion,
  updateRecentCategories,
} from "../question-engine/questionSelector.js";

export function createInitialGameSession() {
  return {
    roundNumber: 1,
    survivalStreak: 0,
    isAlive: true,
    reviveUsed: false,
    sharedReviveUsed: false,
    usedQuestionIds: [],
    recentCategories: [],
    history: [],
    currentRound: null,
    playerPattern: {
      patternDetected: false,
      patternType: null,
      trapLevel: 0,
    },
  };
}

export function prepareNextRound(session) {
  if (!session.isAlive) {
    return session;
  }

  const playerPattern = detectPlayerPattern(session);

  const difficulty = calculateDifficulty({
    roundNumber: session.roundNumber,
    survivalStreak: session.survivalStreak,
  });

  let roundType = selectRoundRule(session.roundNumber, difficulty);

  if (
    playerPattern.patternDetected &&
    playerPattern.patternType === "ALWAYS_OPPOSITE_AI"
  ) {
    roundType = ROUND_TYPES.REVERSE_TRAP;
  }

  const question = selectQuestion({
    questions: QUESTIONS_V1,
    usedQuestionIds: session.usedQuestionIds,
    recentCategories: session.recentCategories,
  });

  const prediction = predictCrowdChoice({
    question,
    difficulty,
    roundType,
    playerPattern,
  });

  return {
    ...session,
    playerPattern,
    recentCategories: updateRecentCategories(
      session.recentCategories,
      question.category
    ),
    currentRound: {
      roundNumber: session.roundNumber,
      difficulty,
      roundType,
      question,
      prediction,
      playerPattern,
      status: "WAITING_FOR_PLAYER",
    },
  };
}

export function submitPlayerChoice(session, playerChoice) {
  if (!session.currentRound) {
    throw new Error("No active round. Call prepareNextRound() first.");
  }

  if (!["A", "B"].includes(playerChoice)) {
    throw new Error("playerChoice must be A or B.");
  }

  const survived = judgeSurvival({
    playerChoice,
    prediction: session.currentRound.prediction,
    roundType: session.currentRound.roundType,
  });

  const completedRound = {
    ...session.currentRound,
    playerChoice,
    survived,
    status: "COMPLETED",
  };

  return {
    ...session,
    roundNumber: survived
      ? session.roundNumber + 1
      : session.roundNumber,

    survivalStreak: survived
      ? session.survivalStreak + 1
      : session.survivalStreak,

    isAlive: survived,

    usedQuestionIds: [
      ...session.usedQuestionIds,
      session.currentRound.question.id,
    ],

    history: [
      ...session.history,
      completedRound,
    ],

    currentRound: completedRound,
  };
}

export function restartGameSession() {
  return prepareNextRound(createInitialGameSession());
}

export function useRevive(session) {
  if (session.reviveUsed) {
    return session;
  }

  return prepareNextRound({
    ...session,
    isAlive: true,
    reviveUsed: true,
    roundNumber: session.roundNumber + 1,
    currentRound: null,
  });
}

export function useSharedRevive(session) {
  if (session.sharedReviveUsed) {
    return session;
  }

  return prepareNextRound({
    ...session,
    isAlive: true,
    sharedReviveUsed: true,
    roundNumber: session.roundNumber + 1,
    currentRound: null,
  });
}