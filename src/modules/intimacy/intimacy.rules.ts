export const INTIMACY_RULES = {
  coupleDailyCap: 300,
  note: {
    base: 8,
    lengthBonuses: [
      { minInclusive: 121, bonus: 4 },
      { minInclusive: 31, bonus: 2 },
      { minInclusive: 0, bonus: 0 },
    ],
    fullCount: 3,
    halfCount: 3,
  },
  moment: {
    base: 15,
    tagsBonus: 2,
    fullCount: 2,
    halfCount: 1,
  },
  quest: {
    createBase: 5,
    createDailyFullCount: 5,
    completeDailyCap: 120,
    completeMaxPoints: 50,
    crossCompleteBonus: 5,
  },
  pairing: {
    successPoints: 100,
  },
  anniversary: {
    setPoints: 20,
  },
  surprise: {
    cooldownSeconds: 30,
    userDailyCap: 15,
  },
  romantic: {
    userDailyCap: 12,
    sceneEnterPoints: 3,
  },
  level: {
    deltaBase: 80,
    deltaStep: 20,
  },
  titles: [
    { level: 1, title: '初遇', hint: '认识彼此，一切刚刚开始' },
    { level: 2, title: '心动', hint: '开始在意对方的小情绪' },
    { level: 3, title: '热恋', hint: '甜度超标，想每天见面' },
    { level: 4, title: '默契', hint: '不说也懂，你的习惯我都记得' },
    { level: 5, title: '依恋', hint: '在一起时安心，不在也想念' },
    { level: 6, title: '同频', hint: '价值观更靠近，沟通更顺畅' },
    { level: 7, title: '坚定', hint: '遇到问题也愿意一起解决' },
    { level: 8, title: '相守', hint: '把对方当作长期的“我们”' },
    { level: 9, title: '灵魂伴侣', hint: '被理解、被接住，也更懂得爱' },
    { level: 10, title: '命中注定', hint: '坚定选择彼此，彼此成就' },
  ],
} as const;

export type IntimacyTitle = (typeof INTIMACY_RULES.titles)[number];

export const getIntimacyTitle = (
  level: number,
): { title: string; hint: string } => {
  const found = INTIMACY_RULES.titles.find((row) => row.level === level);
  if (found) {
    return { title: found.title, hint: found.hint };
  }
  return { title: '永恒恋人', hint: '更懂得经营与陪伴，让爱长久发光' };
};

export const computeLevelProgress = (
  score: number,
): {
  level: number;
  levelStart: number;
  nextThreshold: number;
} => {
  const delta = (level: number) =>
    INTIMACY_RULES.level.deltaBase +
    INTIMACY_RULES.level.deltaStep * (level - 1);

  let level = 1;
  let levelStart = 0;
  let nextThreshold = delta(level);

  while (score >= nextThreshold) {
    levelStart = nextThreshold;
    level += 1;
    nextThreshold += delta(level);
    if (level > 10_000) break;
  }

  return { level, levelStart, nextThreshold };
};

