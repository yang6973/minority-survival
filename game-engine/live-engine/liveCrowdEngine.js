export function buildLiveCrowdData(prediction) {
  const participantCount =
    randomBetween(3200, 18400);

  const trendType = buildTrendType(
    prediction.predictedA,
    prediction.predictedB
  );

  const trendMessage = buildTrendMessage(
    trendType
  );

  return {
    participantCount,
    trendType,
    trendMessage,
  };
}

function buildTrendType(a, b) {
  const diff = Math.abs(a - b);

  if (diff <= 6) {
    return "BALANCED";
  }

  if (a > b) {
    return "A_RISING";
  }

  return "B_RISING";
}

function buildTrendMessage(type) {
  const map = {
    BALANCED:
      "양쪽 선택이 팽팽하게 갈리고 있어요.",

    A_RISING:
      "A 선택 비율이 올라가는 중이에요.",

    B_RISING:
      "B 선택 비율이 올라가는 중이에요.",
  };

  return (
    map[type] ??
    "참가자 선택 집계 중..."
  );
}

function randomBetween(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}