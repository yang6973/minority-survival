export const AI_HOST_NAME = "복실이";

export function buildRoundNarrative({
  roundType,
  question,
  prediction,
}) {
  const ruleTitleMap = {
    AVOID_AI_PREDICTION: "눈치 생존",
    TARGET_ZONE: "애매존 생존",
    REVERSE_TRAP: "반대 몰림 주의",
    BIAS_COLLAPSE: "쏠림 주의",
    MINORITY_SURVIVES: "소수 생존",
  };

  const ruleHintMap = {
    AVOID_AI_PREDICTION:
      "많이 선택된 쪽은 탈락합니다.\n적게 선택된 쪽만 살아남아요.",

    TARGET_ZONE:
      "너무 튀어도 위험, 너무 몰려도 위험.\n애매한 선택이 살아남을 수도 있어요.",

    REVERSE_TRAP:
      "다들 반대로 가려다가\n오히려 같은 선택에 몰릴 수 있어요.",

    BIAS_COLLAPSE:
      "한쪽으로 확 몰리는 순간\n그 선택은 바로 위험해져요.",

    MINORITY_SURVIVES:
      "많이 몰린 쪽은 탈락.\n소수만 살아남아요.",
  };

  const crowdFocus =
    prediction.predictedA >= prediction.predictedB
      ? question.optionA
      : question.optionB;

  return {
    ruleTitle:
      ruleTitleMap[roundType] ?? "몰림 피하기",

    ruleHint:
      ruleHintMap[roundType] ??
      "사람들이 어디로 몰릴지 생각해보세요.",

    preChoiceMessage:
      buildPreChoiceMessage(roundType, crowdFocus),

    pressureMessage:
      buildPressureMessage(roundType, question.category),
  };
}

function pickRandom(items) {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}

function pickMessage(messages) {
  return messages[
    Math.floor(Math.random() * messages.length)
  ];
}

function buildPreChoiceMessage(roundType, crowdFocus) {
  const avoidMessages = [
    `복실이:\n“${crowdFocus}” 몰릴듯`,
    `복실이:\n이번 판 다들 여기 갈 것 같은데`,
    `복실이:\n지금 사람들 눈치 엄청 보는 중`,
    `복실이:\n“${crowdFocus}” 쪽 분위기 이상한데`,
    `복실이:\n여기 은근 많이 몰릴 느낌인데`,
  ];

  const targetMessages = [
    `복실이:\n이번 판은 애매하게 갈릴듯`,
    `복실이:\n너무 튀어도 위험할 수도`,
    `복실이:\n다들 서로 눈치 보는 중`,
  ];

  const reverseMessages = [
    `복실이:\n다들 반대로 갈 것 같은데`,
    `복실이:\n이번 판은 함정 냄새 남`,
    `복실이:\n눈치보다 같이 몰릴 수도`,
  ];

  const collapseMessages = [
    `복실이:\n한쪽으로 확 몰릴듯`,
    `복실이:\n지금 분위기 좀 위험한데`,
    `복실이:\n다들 비슷하게 생각 중인 듯`,
  ];

  const minorityMessages = [
    `복실이:\n소수만 살아남을 듯`,
    `복실이:\n이번 판은 몰리면 끝`,
    `복실이:\n튀는 선택이 살 수도`,
  ];

  const messages = {
    AVOID_AI_PREDICTION:
      pickRandom(avoidMessages),

    TARGET_ZONE:
      pickRandom(targetMessages),

    REVERSE_TRAP:
      pickRandom(reverseMessages),

    BIAS_COLLAPSE:
      pickRandom(collapseMessages),

    MINORITY_SURVIVES:
      pickRandom(minorityMessages),
  };

  return (
    messages[roundType] ??
    `복실이:\n사람들 선택 보는 중`
  );
}

function buildPressureMessage(roundType, category) {
  const reverseTrapMessage =
    roundType === "REVERSE_TRAP"
      ? "다른 사람들도 ‘반대로 가야지’ 하고 있을 수 있어요."
      : "";

  if (reverseTrapMessage) {
    return reverseTrapMessage;
  }

  const map = {
    food_choice:
      "음식 질문은 은근히 취향이 갈리는 척하면서 한쪽으로 몰려요.",

    delivery_life:
      "배달·돈 얘기는 사람들이 생각보다 비슷하게 움직여요.",

    dating_mind:
      "연애 질문은 속마음이랑 겉선택이 달라질 수 있어요.",

    social_media:
      "SNS 질문은 다들 쿨한 척하지만 결과가 자주 갈려요.",

    money_choice:
      "돈이 끼면 현실적인 선택으로 몰릴 수 있어요.",

    friendship:
      "친구 얘기는 착한 척 선택이 많이 나올 수 있어요.",

    daily_life:
      "일상 질문은 방심하면 남들이랑 같은 쪽에 서게 돼요.",

    work_school:
      "단체 상황은 눈치 때문에 한쪽으로 쏠리기 쉬워요.",

    social_pressure:
      "튀기 싫은 마음 때문에 비슷한 선택이 몰릴 수 있어요.",
  };

  return (
    map[category] ??
    "지금 들어온 사람들의 선택이 한쪽으로 몰릴 수 있어요."
  );
}

export function buildResultNarrative(round) {
  if (round.survived) {
    return buildSurvivalMessage(round);
  }

  return buildEliminationMessage(round);
}

function buildSurvivalMessage(round) {
  const map = {
    AVOID_AI_PREDICTION: [
      "사람들이 몰린 타이밍을 잘 피했어요.",
      "복실이 예측을 제대로 흘렸어요.",
      "이번 판은 진짜 잘 피했어요.",
      "눈치 흐름을 잘 읽었어요.",
      "다들 갈 것 같은 선택을 피해냈어요.",
    ],

    TARGET_ZONE: [
      "딱 애매한 흐름으로 빠졌어요.",
      "너무 튀지도, 너무 몰리지도 않았어요.",
      "이번 판 균형감 좋았어요.",
      "위험한 몰림을 잘 비켜갔어요.",
    ],

    REVERSE_TRAP: [
      "반대로 몰린 흐름을 잘 피했어요.",
      "역눈치 함정을 읽어냈어요.",
      "다들 꼬인 타이밍에 잘 빠져나왔어요.",
      "복실이 함정 예측을 피해냈어요.",
    ],

    BIAS_COLLAPSE: [
      "쏠리기 직전에 빠져나왔어요.",
      "위험한 분위기를 잘 감지했어요.",
      "몰림 직전 흐름을 잘 읽었어요.",
      "다들 같은 생각할 때 잘 벗어났어요.",
    ],

    MINORITY_SURVIVES: [
      "소수 흐름을 잘 탔어요.",
      "많이 몰린 쪽을 피해냈어요.",
      "이번 판은 눈치가 빨랐어요.",
      "튀는 선택이 오히려 살렸어요.",
    ],
  };

  const messages =
    map[round.roundType] ?? [
      "이번 판 몰림을 잘 피했어요.",
    ];

  return pickMessage(messages);
}

function buildEliminationMessage(round) {
  const map = {
    AVOID_AI_PREDICTION: [
      "사람들이 몰린 쪽에 같이 섰어요.",
      "다들 같은 생각을 하고 있었어요.",
      "이번엔 너무 자연스럽게 몰렸어요.",
      "눈치보다가 같이 들어가버렸어요.",
      "복실이 예측대로 몰려버렸어요.",
    ],

    TARGET_ZONE: [
      "너무 많이 몰린 흐름에 들어갔어요.",
      "애매존을 살짝 벗어났어요.",
      "이번 판 균형을 못 피했어요.",
      "다들 비슷하게 움직였어요.",
    ],

    REVERSE_TRAP: [
      "반대로 피하려던 사람들이 같이 몰렸어요.",
      "역눈치 흐름에 걸렸어요.",
      "다들 반대로 가려다 한쪽에 섰어요.",
      "이번 판 함정이 꽤 강했어요.",
    ],

    BIAS_COLLAPSE: [
      "한쪽으로 너무 확 몰렸어요.",
      "쏠리는 분위기에 같이 올라탔어요.",
      "이번 판은 분위기가 너무 강했어요.",
      "사람들 흐름이 한쪽으로 터졌어요.",
    ],

    MINORITY_SURVIVES: [
      "많이 몰린 쪽에 들어갔어요.",
      "이번 판은 소수만 살아남았어요.",
      "튀는 흐름을 못 탔어요.",
      "사람들이 너무 비슷하게 움직였어요.",
    ],
  };

  const messages =
    map[round.roundType] ?? [
      "사람들이 몰린 쪽에 같이 갔어요.",
    ];

  return pickMessage(messages);
}