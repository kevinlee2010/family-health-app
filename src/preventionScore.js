const noKnownConditionKeys = new Set([
  'none',
  'none of the conditions listed',
  'no known conditions',
])

const healthCategoryIcons = {
  cancer: '◇',
  cardiovascular: '♡',
  kidney: '○',
  mental: '◌',
  metabolic: '◍',
  neurological: '◎',
  respiratory: '△',
}

function normalize(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function clampScore(score) {
  if (!Number.isFinite(score)) {
    return null
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function getCategoryScore(value, scoreMap) {
  if (!value) {
    return null
  }

  return scoreMap[value] ?? null
}

function getNutritionScore(profile) {
  const dietScore = getCategoryScore(profile.dietQuality, {
    Excellent: 8,
    Good: 6,
    Fair: 3,
    Poor: 1,
  })
  const produceScore = getCategoryScore(profile.fruitVegIntake, {
    '5 or more servings': 7,
    '3-4 servings': 6,
    '2 servings': 3,
    '0-1 servings': 1,
  })
  const answeredScores = [dietScore, produceScore].filter((score) => score !== null)

  if (answeredScores.length === 0) {
    return null
  }

  if (answeredScores.length === 1) {
    return Math.round((answeredScores[0] / (dietScore === null ? 7 : 8)) * 15)
  }

  return dietScore + produceScore
}

function getScreeningAwarenessScore(profile) {
  const screeningScore = getCategoryScore(profile.preventiveScreenings, {
    'Up to date': 6,
    'Not age appropriate yet': 5,
    'Need to schedule': 3,
    'Not sure': 2,
  })
  const bloodPressureScore = getCategoryScore(profile.knownHighBloodPressure, {
    No: 3,
    Yes: 3,
    'Not sure': 1,
    'Prefer not to answer': 0,
  })
  const cholesterolScore = getCategoryScore(profile.knownHighCholesterol, {
    No: 3,
    Yes: 3,
    'Not sure': 1,
    'Prefer not to answer': 0,
  })
  const diabetesScore = getCategoryScore(profile.diabetesStatus, {
    No: 3,
    Prediabetes: 3,
    Diabetes: 3,
    'Diabetes, not sure what type': 3,
    'Not sure': 1,
    'Prefer not to answer': 0,
  })
  const scores = [
    screeningScore,
    bloodPressureScore,
    cholesterolScore,
    diabetesScore,
  ]
  const answeredScores = scores.filter((score) => score !== null)

  if (answeredScores.length === 0) {
    return null
  }

  return Math.min(
    15,
    Math.round(
      (answeredScores.reduce((total, score) => total + score, 0) /
        answeredScores.length) *
        (15 / 4),
    ),
  )
}

function hasMeaningfulFamilyHistory(familyMembers = []) {
  return familyMembers.some((member) =>
    member.illnesses?.some(
      (illness) => !noKnownConditionKeys.has(normalize(illness).replace(/\.+$/g, '')),
    ),
  )
}

function getFamilyHistoryScore(familyMembers = []) {
  if (familyMembers.length === 0) {
    return null
  }

  return hasMeaningfulFamilyHistory(familyMembers) ? 10 : 6
}

function getPositivePreventionSignals(profile, familyHealthSummary) {
  const positives = []

  if (profile.smokingStatus === 'Never') {
    positives.push('No smoking or vaping reported.')
  }

  if (profile.exercise === '3-5 days/week' || profile.exercise === 'Nearly every day') {
    positives.push('Your exercise routine is already a strong prevention habit.')
  }

  if (
    profile.dietQuality === 'Good' ||
    profile.dietQuality === 'Excellent' ||
    profile.fruitVegIntake === '3-4 servings' ||
    profile.fruitVegIntake === '5 or more servings'
  ) {
    positives.push('Your nutrition answers show helpful daily choices.')
  }

  if (profile.sleep === '7-9 hours') {
    positives.push('Your sleep duration is in a generally supportive range.')
  }

  if (profile.waterIntake === '6-8 cups' || profile.waterIntake === 'More than 8 cups') {
    positives.push('Your hydration response is a useful foundation.')
  }

  if (profile.preventiveScreenings === 'Up to date') {
    positives.push('You reported being up to date with preventive screenings.')
  }

  if (
    familyHealthSummary.categories.filter((category) => category.riskLevel === 'High')
      .length === 0
  ) {
    positives.push('No strong family-health pattern is visible from the entries so far.')
  }

  return positives.slice(0, 5)
}

function getLifestylePriority(profile) {
  const priorities = []
  const addPriority = (id, icon, title, detail, scoreImpact) => {
    if (!priorities.some((priority) => priority.id === id)) {
      priorities.push({ detail, icon, id, scoreImpact, title })
    }
  }

  if (profile.exercise === 'Rarely' || profile.exercise === '1-2 days/week') {
    addPriority(
      'movement',
      '↗',
      'Build consistent movement',
      'Your activity response suggests that short, repeatable walks could make prevention feel more doable.',
      20,
    )
  }

  if (
    profile.dietQuality === 'Poor' ||
    profile.dietQuality === 'Fair' ||
    profile.fruitVegIntake === '0-1 servings' ||
    profile.fruitVegIntake === '2 servings'
  ) {
    addPriority(
      'nutrition',
      '◇',
      'Improve everyday nutrition',
      'Your food responses show an opportunity to add more produce, fiber-rich foods, and balanced meals.',
      15,
    )
  }

  if (profile.sleep === 'Less than 6 hours' || profile.sleep === 'More than 9 hours') {
    addPriority(
      'sleep',
      '◒',
      'Protect sleep rhythm',
      'Your sleep response may affect energy, stress, and follow-through on healthy habits.',
      10,
    )
  }

  if (profile.smokingStatus === 'Current') {
    addPriority(
      'tobacco',
      '!',
      'Reduce tobacco or vaping exposure',
      'Current smoking or vaping is one of the strongest modifiable prevention signals in the intake.',
      20,
    )
  }

  if (profile.waterIntake === 'Less than 3 cups' || profile.waterIntake === '3-5 cups') {
    addPriority(
      'hydration',
      '◦',
      'Improve hydration',
      'Your water intake response suggests a simple daily habit target could help.',
      6,
    )
  }

  if (profile.sugaryDrinks === 'Most days' || profile.sugaryDrinks === 'Daily') {
    addPriority(
      'sugary-drinks',
      '−',
      'Cut back sugary drinks',
      'Frequent sugary drinks can make nutrition, weight, and metabolic prevention goals harder.',
      9,
    )
  }

  if (profile.stressLevel === 'High' || profile.stressLevel === 'Very high') {
    addPriority(
      'stress',
      '◌',
      'Lower stress load',
      'Your stress response suggests breathing, walking, or mindfulness routines could support prevention.',
      10,
    )
  }

  if (profile.screenTime === '8+ hours') {
    addPriority(
      'screen-time',
      '□',
      'Add screen breaks',
      'Long screen time can crowd out movement, sleep, and outdoor time.',
      6,
    )
  }

  if (
    profile.preventiveScreenings === 'Not sure' ||
    profile.preventiveScreenings === 'Need to schedule'
  ) {
    addPriority(
      'screening',
      '✓',
      'Check preventive screening timing',
      'Your screening response suggests it may be worth asking a healthcare professional what is appropriate for your age and family history.',
      15,
    )
  }

  return priorities
}

function getHealthCategoryIcon(categoryId) {
  return healthCategoryIcons[categoryId] || '○'
}

function getScoringBreakdown({ familyMembers, profile }) {
  return [
    {
      id: 'activity',
      label: 'Physical activity',
      max: 20,
      score: getCategoryScore(profile.exercise, {
        'Nearly every day': 20,
        '3-5 days/week': 16,
        '1-2 days/week': 8,
        Rarely: 2,
      }),
    },
    {
      id: 'smoking',
      label: 'Smoking status',
      max: 20,
      score: getCategoryScore(profile.smokingStatus, {
        Never: 20,
        Former: 14,
        Current: 0,
      }),
    },
    {
      id: 'nutrition',
      label: 'Nutrition habits',
      max: 15,
      score: getNutritionScore(profile),
    },
    {
      id: 'sleep',
      label: 'Sleep habits',
      max: 10,
      score: getCategoryScore(profile.sleep, {
        '7-9 hours': 10,
        '6-7 hours': 7,
        'Less than 6 hours': 3,
        'More than 9 hours': 3,
      }),
    },
    {
      id: 'stress',
      label: 'Stress management',
      max: 10,
      score: getCategoryScore(profile.stressLevel, {
        Low: 10,
        Moderate: 7,
        High: 3,
        'Very high': 1,
      }),
    },
    {
      id: 'screening',
      label: 'Preventive screening awareness',
      max: 15,
      score: getScreeningAwarenessScore(profile),
    },
    {
      id: 'family-history',
      label: 'Family history completion and awareness',
      max: 10,
      score: getFamilyHistoryScore(familyMembers),
    },
  ]
}

export function calculatePreventionScore({
  familyHealthSummary = {},
  familyMembers = [],
  profile = {},
}) {
  const safeFamilyHealthSummary = {
    categories: [],
    topAreas: [],
    ...familyHealthSummary,
  }
  const breakdown = getScoringBreakdown({ familyMembers, profile })
  const answeredCategories = breakdown.filter((category) => category.score !== null)

  if (answeredCategories.length < 3) {
    return {
      areasForImprovement: [],
      breakdown,
      explanation: '',
      positives: [],
      score: null,
      topPriorities: [],
    }
  }

  const weightedScore = answeredCategories.reduce(
    (total, category) => total + (category.score / category.max) * category.max,
    0,
  )
  const answeredMax = answeredCategories.reduce(
    (total, category) => total + category.max,
    0,
  )
  const score = clampScore((weightedScore / answeredMax) * 100)
  const lifestylePriorities = getLifestylePriority(profile)
  const familyPriorities = safeFamilyHealthSummary.topAreas
    .filter((category) => category.riskLevel !== 'Average')
    .map((category) => ({
      detail: category.explanation,
      icon: getHealthCategoryIcon(category.id),
      id: category.id,
      scoreImpact: category.riskLevel === 'High' ? 8 : 5,
      title: category.name,
    }))
  const topPriorities = [...lifestylePriorities, ...familyPriorities]
    .sort((first, second) => second.scoreImpact - first.scoreImpact)
    .slice(0, 3)
  const positives = getPositivePreventionSignals(profile, safeFamilyHealthSummary)
  const improvements = lifestylePriorities.map((priority) => priority.title).slice(0, 5)

  return {
    areasForImprovement:
      improvements.length > 0
        ? improvements
        : ['Keep family history updated', 'Review routine checkups', 'Maintain healthy habits'],
    breakdown,
    explanation: '',
    positives,
    score,
    topPriorities,
  }
}

export function getPreventionScoreStatus(score) {
  if (score === null || score === undefined) {
    return {
      className: 'unknown',
      label: '',
      tone: '#94a3b8',
    }
  }

  if (score >= 80) {
    return {
      className: 'excellent',
      label: 'Excellent',
      tone: '#0f766e',
    }
  }

  if (score >= 60) {
    return {
      className: 'good',
      label: 'Good',
      tone: '#16a34a',
    }
  }

  if (score >= 40) {
    return {
      className: 'improving',
      label: 'Improving',
      tone: '#f59e0b',
    }
  }

  return {
    className: 'needs-attention',
    label: 'Needs Attention',
    tone: '#f97366',
  }
}
