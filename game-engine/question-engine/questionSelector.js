const CATEGORY_COOLDOWN = 3;

export function selectQuestion({
  questions,
  usedQuestionIds = [],
  recentCategories = [],
}) {
  const availableQuestions = questions.filter((question) => {
    const alreadyUsed = usedQuestionIds.includes(question.id);
    const blockedCategory = recentCategories.includes(question.category);

    return !alreadyUsed && !blockedCategory;
  });

  const fallbackQuestions = questions.filter((question) => {
    return !usedQuestionIds.includes(question.id);
  });

  const pool =
    availableQuestions.length > 0
      ? availableQuestions
      : fallbackQuestions.length > 0
        ? fallbackQuestions
        : questions;

  const randomIndex = Math.floor(Math.random() * pool.length);

  return pool[randomIndex];
}

export function updateRecentCategories(recentCategories = [], newCategory) {
  const next = [...recentCategories, newCategory];

  return next.slice(-CATEGORY_COOLDOWN);
}