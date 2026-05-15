const BEST_STREAK_KEY = "last_signal_best_streak";

export function getBestStreak() {
  const value = localStorage.getItem(BEST_STREAK_KEY);
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
}

export function updateBestStreak(currentStreak) {
  const bestStreak = getBestStreak();

  if (currentStreak > bestStreak) {
    localStorage.setItem(BEST_STREAK_KEY, String(currentStreak));

    return {
      bestStreak: currentStreak,
      isNewRecord: true,
    };
  }

  return {
    bestStreak,
    isNewRecord: false,
  };
}

export function resetBestStreak() {
  localStorage.removeItem(BEST_STREAK_KEY);
}