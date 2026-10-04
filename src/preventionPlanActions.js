import { getPreventionEvidenceById } from './data/preventionEvidence.js'
import {
  filterFamilyMembersByEligibility,
  isBreastScreeningEligible,
  isColorectalScreeningEligible,
  isConditionApplicableToProfile,
  isPreventionActionApplicable,
} from './healthEligibility.js'

function normalizeActionText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getActionSlug(value) {
  return normalizeActionText(value).replace(/\s+/g, '-')
}

function addAction(actions, action) {
  if (!action?.label) {
    return
  }

  const id = action.id || `${action.timeframe || 'plan'}-${getActionSlug(action.label)}`

  if (actions.some((existingAction) => existingAction.id === id)) {
    return
  }

  actions.push({
    category: action.category || 'Prevention',
    completionAmount: action.completionAmount,
    evidenceId: action.evidenceId || '',
    goalCategory: action.goalCategory || action.category || 'Prevention',
    goalType: action.goalType || id,
    id,
    label: action.label,
    personalizationReasons: Array.isArray(action.personalizationReasons)
      ? action.personalizationReasons
      : action.reason
        ? [action.reason]
        : [],
    reason: action.reason,
    resourceIntent: action.resourceIntent || '',
    resourceNeeded: Boolean(action.resourceNeeded),
    resourceType: action.resourceType || action.resourceIntent || '',
    target: action.target || null,
    adaptationLevel: Number.isInteger(action.adaptationLevel)
      ? action.adaptationLevel
      : 0,
    timeframe: action.timeframe || 'month',
  })
}

function getActionCategoryKey(action) {
  return normalizeActionText(action.category || action.id || action.label)
}

function getDistinctActions(actions, limit) {
  const usedCategories = new Set()
  const distinctActions = []

  actions.forEach((action) => {
    const categoryKey = getActionCategoryKey(action)

    if (usedCategories.has(categoryKey) || distinctActions.length >= limit) {
      return
    }

    usedCategories.add(categoryKey)
    distinctActions.push(action)
  })

  return distinctActions
}

export function getPreventionActionTheme(action = {}) {
  const text = normalizeActionText(
    [action.category, action.goalType, action.label, action.resourceIntent].join(
      ' ',
    ),
  )
  const themes = [
    ['family-history', ['family history', 'family health', 'diagnosis age']],
    ['blood-pressure', ['blood pressure', 'hypertension']],
    ['cholesterol', ['cholesterol']],
    ['breast-screening', ['breast screening', 'mammograph']],
    ['colorectal-screening', ['colorectal', 'colon screening', 'fit kit']],
    ['air-quality', ['air quality']],
    ['smoking', ['smoking', 'vaping', 'quit support']],
    ['sleep', ['sleep', 'bedtime']],
    ['mental-reset', ['stress', 'mental reset', 'relax']],
    ['hydration', ['water', 'hydration', 'sugary drink']],
    [
      'nutrition',
      ['fruit', 'vegetable', 'fiber', 'nutrition', 'healthy meal', 'sodium'],
    ],
    ['movement', ['walk', 'movement', 'physical activity', 'exercise']],
  ]

  return themes.find(([, terms]) => terms.some((term) => text.includes(term)))?.[0] ||
    normalizeActionText(action.category || action.id)
}

export function arePreventionActionsSemanticallyDuplicate(
  firstAction,
  secondAction,
) {
  const firstTheme = getPreventionActionTheme(firstAction)
  const secondTheme = getPreventionActionTheme(secondAction)

  if (firstTheme !== secondTheme) {
    return false
  }

  const weeklyAction =
    firstAction.timeframe === 'week'
      ? firstAction
      : secondAction.timeframe === 'week'
        ? secondAction
        : null
  const weeklyTarget = weeklyAction?.target || {}
  const hasMeasuredWeeklyProgress = Boolean(
    Number(weeklyTarget.targetMinutes) > 0 ||
      Number(weeklyTarget.targetSessions) > 1 ||
      Number(weeklyTarget.sessions) > 1 ||
      Number(weeklyTarget.days) > 1 ||
      Number(weeklyTarget.count) > 1,
  )

  // A cumulative weekly target is distinct from a one-time daily action.
  // Vague weekly rewordings of the same action remain duplicates.
  if (
    firstAction.timeframe !== secondAction.timeframe &&
    hasMeasuredWeeklyProgress
  ) {
    return false
  }

  return true
}

function getDistinctWeeklyActions(actions, todayActions, limit) {
  const usedCategories = new Set()
  const usedThemes = new Set()

  return actions.reduce((selectedActions, action) => {
    const categoryKey = getActionCategoryKey(action)
    const theme = getPreventionActionTheme(action)

    if (
      selectedActions.length >= limit ||
      todayActions.some((todayAction) =>
        arePreventionActionsSemanticallyDuplicate(todayAction, action),
      ) ||
      usedCategories.has(categoryKey) ||
      usedThemes.has(theme)
    ) {
      return selectedActions
    }

    usedCategories.add(categoryKey)
    usedThemes.add(theme)
    return [...selectedActions, action]
  }, [])
}

export function isWeeklyPlanningAction(action = {}) {
  if (action.timeframe !== 'week') {
    return false
  }

  const target = action.target || {}
  const hasMultiDayOrCumulativeTarget = Boolean(
    Number(target.targetMinutes) > 20 ||
      Number(target.targetSessions) > 1 ||
      Number(target.sessions) > 1 ||
      Number(target.days) > 1 ||
      Number(target.count) > 1,
  )

  return hasMultiDayOrCumulativeTarget || Boolean(action.resourceNeeded)
}

function isSupportedAction(action, profile) {
  return Boolean(
    action?.label &&
      action.evidenceId &&
      getPreventionEvidenceById(action.evidenceId) &&
      isPreventionActionApplicable(action, profile),
  )
}

function clampNumber(value, min, max) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return min
  }

  return Math.min(max, Math.max(min, number))
}

function getCompletionRatio(entry = {}) {
  if (typeof entry.recentCompletionRate === 'number') {
    return clampNumber(entry.recentCompletionRate, 0, 1)
  }

  if (typeof entry.completionAmount === 'number' && entry.target) {
    const targetValue =
      Number(entry.target.targetSessions) ||
      Number(entry.target.sessions) ||
      Number(entry.target.days) ||
      Number(entry.target.count) ||
      1

    return clampNumber(entry.completionAmount / targetValue, 0, 1)
  }

  if (entry.completionStatus === 'complete' || entry.completed === true) {
    return 1
  }

  return 0
}

function getHistoryForGoalType(actionHistory = [], goalType) {
  if (!Array.isArray(actionHistory) || !goalType) {
    return []
  }

  return actionHistory
    .filter((entry) => entry?.goalType === goalType)
    .sort((firstEntry, secondEntry) =>
      String(firstEntry.dateAssigned || firstEntry.periodKey || '').localeCompare(
        String(secondEntry.dateAssigned || secondEntry.periodKey || ''),
      ),
    )
}

function getAdaptiveGoalState(actionHistory = [], goalType) {
  const entries = getHistoryForGoalType(actionHistory, goalType)
  const lastEntry = entries.at(-1) || {}
  const recentEntries = entries.slice(-4)
  const lastTwo = entries.slice(-2)
  const lastThree = entries.slice(-3)
  const lowCompletionStreak =
    lastTwo.length >= 2 && lastTwo.every((entry) => getCompletionRatio(entry) < 0.5)
  const highCompletionStreak =
    lastThree.length >= 3 && lastThree.every((entry) => getCompletionRatio(entry) >= 1)
  const averageCompletion =
    recentEntries.length > 0
      ? recentEntries.reduce((sum, entry) => sum + getCompletionRatio(entry), 0) /
        recentEntries.length
      : 0
  const currentLevel = clampNumber(lastEntry.adaptationLevel, 0, 3)
  let adaptationLevel = currentLevel

  if (lowCompletionStreak) {
    adaptationLevel = Math.min(3, currentLevel + 1)
  } else if (highCompletionStreak && currentLevel > 0) {
    adaptationLevel = Math.max(0, currentLevel - 1)
  }

  return {
    adaptationLevel,
    averageCompletion,
    consecutivePeriodsAttempted: entries.length,
    highCompletionStreak,
    lowCompletionStreak,
    recentCompletionRate: averageCompletion,
  }
}

function getPhysicalActivityWeeklyAction(profile = {}, actionHistory = []) {
  const adaptiveState = getAdaptiveGoalState(actionHistory, 'weekly-physical-activity')
  const isLowerActivity = ['Rarely', '1-2 days/week'].includes(profile.exercise)
  const adaptedOptions = [
    {
      id: 'week-physical-activity-target',
      label: 'Work toward 150 minutes of moderate physical activity this week.',
      target: { targetMinutes: 150, targetSessions: 5 },
    },
    {
      id: 'week-physical-activity-15x3',
      label: 'Do at least 15 minutes of moderate physical activity on 3 days this week.',
      target: { targetMinutes: 45, targetSessions: 3 },
    },
    {
      id: 'week-physical-activity-10x3',
      label: 'Take three 10-minute walks this week.',
      resourceIntent: 'physical-activity',
      resourceNeeded: true,
      target: { targetMinutes: 30, targetSessions: 3 },
    },
    {
      id: 'week-physical-activity-one-walk-3-days',
      label: 'Take one 10-minute walk on 3 different days this week.',
      resourceIntent: 'physical-activity',
      resourceNeeded: true,
      target: { targetMinutes: 30, targetSessions: 3 },
    },
  ]
  const activeBaseline = {
    id: 'week-keep-movement-routine',
    label: 'Do at least 20 minutes of moderate physical activity on 3 days this week.',
    target: { targetMinutes: 60, targetSessions: 3 },
  }
  const selectedAction = isLowerActivity
    ? adaptedOptions[adaptiveState.adaptationLevel]
    : adaptiveState.lowCompletionStreak
      ? adaptedOptions[Math.max(1, adaptiveState.adaptationLevel)]
      : activeBaseline

  return {
    ...selectedAction,
    adaptationLevel: adaptiveState.adaptationLevel,
    category: 'Weekly Movement',
    evidenceId: 'cdc-physical-activity',
    goalType: 'weekly-physical-activity',
    personalizationReasons: ['Your activity answer makes weekly movement useful to track.'],
    reason: 'Your activity answer makes weekly movement useful to track.',
    resourceType: selectedAction.resourceIntent ? 'parks_trails' : 'none',
    timeframe: 'week',
  }
}

function getAdaptedWeeklyLabel({
  actionHistory = [],
  baseId,
  baseLabel,
  category,
  goalType,
  levels,
  reason,
}) {
  const adaptiveState = getAdaptiveGoalState(actionHistory, goalType)
  const level = adaptiveState.adaptationLevel
  const selectedLevel = levels[Math.min(level, levels.length - 1)] || levels[0]

  return {
    adaptationLevel: level,
    category,
    evidenceId: selectedLevel.evidenceId || '',
    goalType,
    id: selectedLevel.id || baseId,
    label: selectedLevel.label || baseLabel,
    personalizationReasons: [reason],
    reason,
    resourceIntent: selectedLevel.resourceIntent,
    resourceNeeded: Boolean(selectedLevel.resourceNeeded),
    resourceType: selectedLevel.resourceType || selectedLevel.resourceIntent || 'none',
    target: selectedLevel.target || null,
    timeframe: 'week',
  }
}

function conditionMatches(conditionName, terms = []) {
  const normalizedCondition = normalizeActionText(conditionName)

  return terms.some((term) => normalizedCondition.includes(normalizeActionText(term)))
}

function getKnownConditionEntries(familyMembers = []) {
  return familyMembers.flatMap((member) => {
    const conditions =
      Array.isArray(member.conditions) && member.conditions.length > 0
        ? member.conditions
        : Array.isArray(member.illnesses)
          ? member.illnesses.map((illness) => ({
              diagnosisAge: member.diagnosisAge || '',
              name: illness,
            }))
          : []

    return conditions
      .filter((condition) => {
        const name = condition?.name || condition
        const normalizedName = normalizeActionText(name)

        return (
          normalizedName &&
          !['none', 'unknown', 'no health conditions added'].includes(normalizedName)
        )
      })
      .map((condition) => ({
        conditionName: condition.name || condition,
        diagnosisAge: String(condition.diagnosisAge || member.diagnosisAge || '').trim(),
        relationship:
          member.relationshipType ||
          member.relationship ||
          'family member',
      }))
  })
}

function getMissingDiagnosisAgeEntry(familyMembers = []) {
  return getKnownConditionEntries(familyMembers).find(
    (entry) => !entry.diagnosisAge,
  )
}

function getConditionType(entries = []) {
  const conditionText = entries.map((entry) => entry.conditionName).join(' ')

  if (conditionMatches(conditionText, ['breast cancer'])) return 'breast'
  if (conditionMatches(conditionText, ['colon cancer', 'colorectal'])) return 'colon'
  if (conditionMatches(conditionText, ['blood pressure', 'heart', 'cholesterol', 'stroke'])) return 'heart'
  if (conditionMatches(conditionText, ['asthma', 'copd', 'lung', 'respiratory'])) return 'respiratory'
  if (conditionMatches(conditionText, ['diabetes', 'prediabetes', 'metabolic'])) return 'metabolic'
  if (conditionMatches(conditionText, ['depression', 'anxiety', 'mental'])) return 'mental'

  return ''
}

function getRelativeLabel(value = '') {
  return String(value || 'family member')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getInsightReason(insight) {
  return `${insight.healthArea} is one of the areas highlighted by your profile.`
}

function addInsightDrivenActions(actions, insight, familyMembers, profile) {
  const insightText = normalizeActionText(
    [
      insight.id,
      insight.healthArea,
      insight.profileSuggestion,
      insight.nextBestStep,
      ...(insight.personalizedFactors || []),
    ].join(' '),
  )
  const relatedEntries = getKnownConditionEntries(familyMembers).filter(
    (entry) =>
      isConditionApplicableToProfile(entry.conditionName, profile) &&
      conditionMatches(
        entry.conditionName,
        insight.id === 'cardiovascular'
          ? ['blood pressure', 'heart', 'cholesterol', 'stroke']
          : insight.id === 'cancer'
            ? ['cancer', 'breast', 'colon', 'colorectal']
            : insight.id === 'respiratory'
              ? ['asthma', 'copd', 'lung', 'respiratory']
              : insight.id === 'metabolic'
                ? ['diabetes', 'prediabetes', 'metabolic']
                : insight.id === 'mental'
                  ? ['depression', 'anxiety', 'mental']
                  : [insight.healthArea],
      ),
  )
  const reason = getInsightReason(insight)

  if (insightText.includes('blood pressure') || profile.knownHighBloodPressure === 'Yes') {
    addAction(actions, {
      category: 'Blood Pressure',
      evidenceId: 'cdc-blood-pressure',
      id: 'month-know-blood-pressure',
      label: 'Know your blood pressure.',
      personalizationReasons: [reason],
      reason,
      resourceIntent: 'cardiovascular-screening',
      resourceNeeded: true,
      resourceType: 'blood_pressure_options',
      timeframe: 'month',
    })
  }

  if (insightText.includes('cholesterol') || profile.knownHighCholesterol === 'Yes') {
    addAction(actions, {
      category: 'Cholesterol',
      evidenceId: 'cdc-cholesterol-testing',
      id: 'month-learn-cholesterol-status',
      label: 'Learn your cholesterol status.',
      personalizationReasons: [reason],
      reason,
      resourceIntent: 'cardiovascular-screening',
      resourceNeeded: true,
      resourceType: 'cholesterol_options',
      timeframe: 'month',
    })
  }

  if (
    isBreastScreeningEligible(profile) &&
    conditionMatches(
      relatedEntries.map((entry) => entry.conditionName).join(' '),
      ['breast cancer'],
    )
  ) {
    addAction(actions, {
      category: 'Screening Awareness',
      evidenceId: 'uspstf-breast-screening',
      id: 'month-breast-screening-guidance',
      label: 'Understand when breast screening may become relevant to you.',
      personalizationReasons: [reason],
      reason,
      resourceIntent: 'breast-screening',
      resourceNeeded: true,
      resourceType: 'screening_guidance',
      timeframe: 'month',
    })
    addAction(actions, {
      category: 'Screening Locations',
      evidenceId: 'uspstf-breast-screening',
      id: 'month-find-breast-screening-locations',
      label: 'Find breast screening locations near you.',
      personalizationReasons: [reason],
      reason,
      resourceIntent: 'mammography-facility',
      resourceNeeded: true,
      resourceType: 'breast_screening',
      timeframe: 'month',
    })
  }

  if (
    isColorectalScreeningEligible(profile) &&
    conditionMatches(
      relatedEntries.map((entry) => entry.conditionName).join(' '),
      ['colon cancer', 'colorectal'],
    )
  ) {
    addAction(actions, {
      category: 'Screening Awareness',
      evidenceId: 'cdc-colorectal-screening',
      id: 'month-colorectal-screening-guidance',
      label: 'Understand when colorectal screening may become relevant to you.',
      personalizationReasons: [reason],
      reason,
      resourceIntent: 'colorectal-screening',
      resourceNeeded: true,
      resourceType: 'screening',
      timeframe: 'month',
    })
  }

  const conditionType = getConditionType(relatedEntries)

  if (conditionType === 'respiratory') {
    addAction(actions, {
      category: 'Respiratory Health',
      evidenceId: 'airnow-aqi',
      id: 'today-check-air-quality',
      label: "Check today's local air quality before outdoor exercise.",
      personalizationReasons: [reason],
      reason,
      resourceIntent: 'air-quality',
      resourceNeeded: true,
      resourceType: 'air_quality',
      timeframe: 'today',
    })
  }

  if (conditionType === 'mental' && ['Less than 6 hours', 'More than 9 hours'].includes(profile.sleep)) {
    addAction(actions, {
      category: 'Sleep',
      evidenceId: 'cdc-sleep',
      id: 'today-follow-sleep-routine',
      label: 'Keep your bedtime within a consistent window tonight.',
      personalizationReasons: [
        'Mental well-being is highlighted in your profile, and your sleep answer makes tonight a useful place to start.',
      ],
      reason: 'Mental well-being is highlighted in your profile, and your sleep answer makes tonight a useful place to start.',
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }

  if (
    insight.id === 'cardiovascular' &&
    (profile.knownHighBloodPressure === 'Yes' || ['Poor', 'Fair'].includes(profile.dietQuality))
  ) {
    addAction(actions, {
      category: 'Heart Habit',
      evidenceId: 'cdc-nutrition',
      id: 'today-lower-sodium-option',
      label: 'Choose a lower-sodium option for one meal today.',
      personalizationReasons: [reason],
      reason,
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }

  if (
    insight.id === 'metabolic' &&
    ['Often', 'Daily'].includes(profile.sugaryDrinks)
  ) {
    addAction(actions, {
      category: 'Hydration',
      evidenceId: 'cdc-nutrition',
      id: 'today-choose-water',
      label: 'Choose water instead of one sugary drink today.',
      personalizationReasons: [reason],
      reason,
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }

  if (
    insight.id === 'cancer' &&
    !['Poor', 'Fair'].includes(profile.dietQuality) &&
    !['0-1 servings', '2 servings'].includes(profile.fruitVegIntake)
  ) {
    addAction(actions, {
      category: 'Nutrition',
      evidenceId: 'cdc-nutrition',
      id: 'today-higher-fiber-food',
      label: 'Choose a higher-fiber food today.',
      personalizationReasons: [reason],
      reason,
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }

  if (
    insight.id === 'mental' &&
    !['High', 'Very high'].includes(profile.stressLevel)
  ) {
    addAction(actions, {
      category: 'Mental Well-Being',
      evidenceId: 'cdc-physical-activity',
      id: 'today-relaxing-time',
      label: 'Take 10 minutes for a mental reset.',
      personalizationReasons: [reason],
      reason,
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }
}

function addDailyLifestyleActions(actions, profile = {}) {
  if (['Rarely', '1-2 days/week'].includes(profile.exercise)) {
    addAction(actions, {
      category: 'Movement',
      evidenceId: 'cdc-physical-activity',
      id: 'today-20-minute-walk',
      label: 'Take a 20-minute walk.',
      personalizationReasons: [
        'Your activity answer makes an easy place to move one of the most useful actions today.',
      ],
      reason: 'Your activity answer makes an easy place to move one of the most useful actions today.',
      resourceIntent: 'physical-activity',
      resourceNeeded: true,
      resourceType: 'parks_trails',
      timeframe: 'today',
    })
  }

  if (['3-5 days/week', 'Daily'].includes(profile.exercise)) {
    addAction(actions, {
      category: 'Movement',
      evidenceId: 'cdc-physical-activity',
      id: 'today-20-minute-walk',
      label: 'Take a 20-minute walk.',
      personalizationReasons: [
        'Your activity answer suggests keeping your usual movement routine visible today.',
      ],
      reason: 'Your activity answer suggests keeping your usual movement routine visible today.',
      resourceIntent: 'physical-activity',
      resourceNeeded: true,
      resourceType: 'parks_trails',
      timeframe: 'today',
    })
  }

  if (profile.exercise && !['Rarely', '1-2 days/week', '3-5 days/week', 'Daily'].includes(profile.exercise)) {
    addAction(actions, {
      category: 'Movement',
      evidenceId: 'cdc-physical-activity',
      id: 'today-20-minute-walk',
      label: 'Take a 20-minute walk.',
      personalizationReasons: ['A simple movement break is a concrete action for today.'],
      reason: 'A simple movement break is a concrete action for today.',
      resourceIntent: 'physical-activity',
      resourceNeeded: true,
      resourceType: 'parks_trails',
      timeframe: 'today',
    })
  }

  if (!profile.exercise) {
    addAction(actions, {
      category: 'Movement',
      evidenceId: 'cdc-physical-activity',
      id: 'today-20-minute-walk',
      label: 'Take a 20-minute walk.',
      personalizationReasons: ['A simple movement break is a concrete action for today.'],
      reason: 'A simple movement break is a concrete action for today.',
      resourceIntent: 'physical-activity',
      resourceNeeded: true,
      resourceType: 'parks_trails',
      timeframe: 'today',
    })
  }

  if (['Often', 'Daily', 'Most days'].includes(profile.sugaryDrinks)) {
    addAction(actions, {
      category: 'Hydration',
      evidenceId: 'cdc-nutrition',
      id: 'today-choose-water',
      label: 'Choose water instead of one sugary drink today.',
      personalizationReasons: ['Your sugary-drink answer makes this a useful daily action.'],
      reason: 'Your sugary-drink answer makes this a useful daily action.',
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }

  if (['Poor', 'Fair'].includes(profile.dietQuality) || ['0-1 servings', '2 servings'].includes(profile.fruitVegIntake)) {
    addAction(actions, {
      category: 'Nutrition',
      evidenceId: 'cdc-nutrition',
      id: 'today-add-produce',
      label: 'Add a fruit or vegetable to one meal today.',
      personalizationReasons: ['Your nutrition answers make one produce-focused meal a practical step today.'],
      reason: 'Your nutrition answers make one produce-focused meal a practical step today.',
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }

  if (['High', 'Very high'].includes(profile.stressLevel)) {
    addAction(actions, {
      category: 'Mental Well-Being',
      evidenceId: 'cdc-sleep',
      id: 'today-short-reset',
      label: 'Take 10 minutes for a mental reset.',
      personalizationReasons: ['Your stress answer makes a brief reset a useful action today.'],
      reason: 'Your stress answer makes a brief reset a useful action today.',
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }

  if (profile.sleep) {
    addAction(actions, {
      category: 'Sleep',
      evidenceId: 'cdc-sleep',
      id: 'today-consistent-bedtime',
      label: 'Keep your bedtime within a consistent window tonight.',
      personalizationReasons: ['Your sleep answer makes a consistent bedtime a practical action today.'],
      reason: 'Your sleep answer makes a consistent bedtime a practical action today.',
      resourceNeeded: false,
      resourceType: 'none',
      timeframe: 'today',
    })
  }
}

function addMonthlyLifestyleActions(actions, profile = {}) {
  if (profile.smokingStatus === 'Current') {
    addAction(actions, {
      category: 'Smoking/Vaping',
      evidenceId: 'cdc-smoking-cessation',
      id: 'month-find-quit-support',
      label: 'Find one quit-support option for smoking or vaping.',
      personalizationReasons: [
        'Your profile includes current smoking or vaping, so support resources may be useful when you are ready.',
      ],
      reason: 'Your profile includes current smoking or vaping, so support resources may be useful when you are ready.',
      resourceIntent: 'smoking-cessation',
      resourceNeeded: true,
      resourceType: 'quit_support',
      timeframe: 'month',
    })
  }
}

function addWeeklyActions(actions, familyMembers = [], profile = {}, actionHistory = []) {
  if (profile.exercise) {
    addAction(actions, getPhysicalActivityWeeklyAction(profile, actionHistory))
  }

  const missingAgeEntry = getMissingDiagnosisAgeEntry(familyMembers)

  if (missingAgeEntry) {
    const familyHistoryAction = getAdaptedWeeklyLabel({
      actionHistory,
      baseId: `week-missing-age-${getActionSlug(missingAgeEntry.relationship)}-${getActionSlug(missingAgeEntry.conditionName)}`,
      baseLabel: 'Ask a family member about a missing diagnosis age, if you have the opportunity.',
      category: 'Weekly Family History',
      goalType: 'weekly-family-history',
      levels: [
        {
          evidenceId: 'cdc-family-health-history',
          id: `week-missing-age-${getActionSlug(missingAgeEntry.relationship)}-${getActionSlug(missingAgeEntry.conditionName)}`,
          label: 'Ask a family member about a missing diagnosis age, if you have the opportunity.',
          resourceIntent: 'family-history',
          resourceNeeded: true,
          resourceType: 'family_tree',
          target: { count: 1 },
        },
        {
          evidenceId: 'cdc-family-health-history',
          id: 'week-review-known-family-history',
          label: 'Review the family-health information you already know.',
          resourceIntent: 'family-history',
          resourceNeeded: true,
          resourceType: 'family_tree',
          target: { count: 1 },
        },
        {
          evidenceId: 'cdc-family-health-history',
          id: 'week-mark-unavailable-family-history',
          label: 'Mark one unavailable family-history detail as unknown if you cannot find it.',
          resourceIntent: 'family-history',
          resourceNeeded: true,
          resourceType: 'family_tree',
          target: { count: 1 },
        },
      ],
      reason: 'A missing diagnosis age is a useful family-history detail to clarify over time.',
    })

    addAction(actions, familyHistoryAction)
  }

  if (['Poor', 'Fair'].includes(profile.dietQuality) || ['0-1 servings', '2 servings'].includes(profile.fruitVegIntake)) {
    addAction(actions, getAdaptedWeeklyLabel({
      actionHistory,
      baseId: 'week-produce-5-days',
      baseLabel: 'Include a fruit or vegetable in at least one meal on 5 days this week.',
      category: 'Weekly Nutrition',
      goalType: 'weekly-nutrition-produce',
      levels: [
        {
          evidenceId: 'cdc-nutrition',
          id: 'week-produce-5-days',
          label: 'Include a fruit or vegetable in at least one meal on 5 days this week.',
          target: { days: 5 },
        },
        {
          evidenceId: 'cdc-nutrition',
          id: 'week-produce-3-days',
          label: 'Add a fruit or vegetable to one meal on 3 days this week.',
          target: { days: 3 },
        },
        {
          evidenceId: 'cdc-nutrition',
          id: 'week-produce-2-days',
          label: 'Add a fruit or vegetable to one meal twice this week.',
          target: { days: 2 },
        },
      ],
      reason: 'Your nutrition answers make produce consistency useful over several days.',
    }))
  }

  if (['Often', 'Daily', 'Most days'].includes(profile.sugaryDrinks)) {
    addAction(actions, {
      category: 'Weekly Hydration',
      evidenceId: 'cdc-nutrition',
      id: 'week-replace-sugary-drinks',
      label: 'Choose water instead of a sugary drink at least 3 times this week.',
      personalizationReasons: ['Your sugary-drink answer makes this a useful weekly habit.'],
      reason: 'Your sugary-drink answer makes this a useful weekly habit.',
      resourceNeeded: false,
      resourceType: 'none',
      target: { count: 3 },
      timeframe: 'week',
    })
  }

  if (profile.sleep) {
    addAction(actions, getAdaptedWeeklyLabel({
      actionHistory,
      baseId: 'week-consistent-sleep-5-nights',
      baseLabel: 'Keep your bedtime within the same 1-hour window on at least 5 nights this week.',
      category: 'Weekly Sleep',
      goalType: 'weekly-sleep-consistency',
      levels: [
        {
          evidenceId: 'cdc-sleep',
          id: 'week-consistent-sleep-5-nights',
          label: 'Keep your bedtime within the same 1-hour window on at least 5 nights this week.',
          target: { days: 5 },
        },
        {
          evidenceId: 'cdc-sleep',
          id: 'week-consistent-sleep-3-nights',
          label: 'Keep your bedtime within the same 1-hour window on 3 nights this week.',
          target: { days: 3 },
        },
      ],
      reason: 'Your sleep answer makes sleep consistency useful over the week.',
    }))
  }

  if (['High', 'Very high'].includes(profile.stressLevel)) {
    addAction(actions, getAdaptedWeeklyLabel({
      actionHistory,
      baseId: 'week-five-stress-resets',
      baseLabel: 'Take 10 minutes for stress management on 5 days this week.',
      category: 'Weekly Mental Well-Being',
      goalType: 'weekly-mental-reset',
      levels: [
        {
          evidenceId: 'cdc-sleep',
          id: 'week-five-stress-resets',
          label: 'Take 10 minutes for stress management on 5 days this week.',
          target: { days: 5 },
        },
        {
          evidenceId: 'cdc-sleep',
          id: 'week-three-short-stress-resets',
          label: 'Take 5 minutes for a mental reset on 3 days this week.',
          target: { days: 3 },
        },
      ],
      reason: 'Your stress answer makes short reset breaks useful to plan ahead.',
    }))
  }
}

function addWeeklyInsightActions(actions, preventionInsights = [], familyMembers = [], profile = {}) {
  const conditionText = getKnownConditionEntries(familyMembers)
    .filter((entry) => isConditionApplicableToProfile(entry.conditionName, profile))
    .map((entry) => entry.conditionName)
    .join(' ')

  preventionInsights.slice(0, 3).forEach((insight) => {
    if (
      insight.id === 'cardiovascular' &&
      (profile.knownHighBloodPressure === 'Yes' ||
        profile.knownHighBloodPressure === 'Unknown' ||
        conditionMatches(conditionText, ['blood pressure', 'hypertension']))
    ) {
      addAction(actions, {
        category: 'Weekly Blood Pressure Awareness',
        evidenceId: 'cdc-blood-pressure',
        id: 'week-review-blood-pressure-option',
        label: 'Review one trusted way to check or track blood pressure this week.',
        personalizationReasons: [getInsightReason(insight)],
        reason: getInsightReason(insight),
        resourceIntent: 'cardiovascular-screening',
        resourceNeeded: true,
        resourceType: 'blood_pressure_options',
        timeframe: 'week',
      })
    }

    if (
      insight.id === 'cardiovascular' &&
      (profile.knownHighCholesterol === 'Yes' ||
        profile.knownHighCholesterol === 'Unknown' ||
        conditionMatches(conditionText, ['cholesterol']))
    ) {
      addAction(actions, {
        category: 'Weekly Cholesterol Awareness',
        evidenceId: 'cdc-cholesterol-testing',
        id: 'week-review-cholesterol-guidance',
        label: 'Review one trusted explanation of cholesterol testing this week.',
        personalizationReasons: [getInsightReason(insight)],
        reason: getInsightReason(insight),
        resourceIntent: 'cardiovascular-screening',
        resourceNeeded: true,
        resourceType: 'cholesterol_options',
        timeframe: 'week',
      })
    }

    if (
      insight.healthArea === 'Breast Cancer Prevention' &&
      isBreastScreeningEligible(profile)
    ) {
      addAction(actions, {
        category: 'Weekly Screening Education',
        evidenceId: 'uspstf-breast-screening',
        id: 'week-review-breast-screening-guidance',
        label: 'Review one trusted breast-screening guidance resource this week.',
        personalizationReasons: [getInsightReason(insight)],
        reason: getInsightReason(insight),
        resourceIntent: 'breast-screening',
        resourceNeeded: true,
        resourceType: 'screening_guidance',
        timeframe: 'week',
      })
    }

    if (
      insight.healthArea === 'Colon Cancer Prevention' &&
      isColorectalScreeningEligible(profile)
    ) {
      addAction(actions, {
        category: 'Weekly Screening Education',
        evidenceId: 'cdc-colorectal-screening',
        id: 'week-review-colorectal-screening-guidance',
        label: 'Review one trusted colorectal-screening guidance resource this week.',
        personalizationReasons: [getInsightReason(insight)],
        reason: getInsightReason(insight),
        resourceIntent: 'colorectal-screening',
        resourceNeeded: true,
        resourceType: 'screening',
        timeframe: 'week',
      })
    }
  })
}

function addFamilyHistoryActions(actions, familyMembers = []) {
  const missingAgeEntry = getMissingDiagnosisAgeEntry(familyMembers)

  if (missingAgeEntry) {
    addAction(actions, {
      category: 'Family History',
      evidenceId: 'cdc-family-health-history',
      id: `month-missing-age-${getActionSlug(missingAgeEntry.relationship)}-${getActionSlug(missingAgeEntry.conditionName)}`,
      label: `Ask a family member when your ${getRelativeLabel(missingAgeEntry.relationship).toLowerCase()} was diagnosed with ${missingAgeEntry.conditionName}, if you have the opportunity.`,
      personalizationReasons: [
        'A missing diagnosis age is one of the clearest ways to make your family pattern more specific.',
      ],
      reason: 'A missing diagnosis age is one of the clearest ways to make your family pattern more specific.',
      resourceIntent: 'family-history',
      resourceNeeded: true,
      resourceType: 'family_tree',
      timeframe: 'month',
    })
  }
}

function buildKeepTrackItems({ preventionInsights = [], profile = {} }) {
  const items = []
  const addItem = (label, reason) => {
    if (label && !items.some((item) => item.label === label) && items.length < 5) {
      items.push({ label, reason })
    }
  }

  preventionInsights.slice(0, 3).forEach((insight) => {
    if (insight.id === 'cardiovascular') {
      addItem('Blood pressure', 'Heart-health patterns and current-health answers make this useful to know over time.')
      addItem('Cholesterol', 'Cholesterol is a practical number to keep track of for heart-health conversations.')
    }

    if (insight.id === 'cancer') {
      if (
        (insight.healthArea === 'Breast Cancer Prevention' &&
          isBreastScreeningEligible(profile)) ||
        (insight.healthArea === 'Colon Cancer Prevention' &&
          isColorectalScreeningEligible(profile))
      ) {
        addItem('Screening timing', 'Family-history details can shape which screening questions are worth asking about later.')
      }
      addItem('Family-history changes', 'New cancer-history details can make your profile more specific.')
    }

    if (insight.id === 'respiratory') {
      addItem('Air quality', 'Respiratory history makes outdoor air conditions useful context.')
    }

    if (insight.id === 'metabolic') {
      addItem('Blood sugar', 'Diabetes or metabolic patterns make routine blood-sugar awareness useful.')
    }

    if (insight.id === 'mental') {
      addItem('Sleep and stress patterns', 'Mental well-being is easier to support when sleep and stress trends are visible.')
    }
  })

  if (profile.knownHighBloodPressure === 'Unknown') {
    addItem('Blood pressure status', 'Your profile marks this as unknown right now.')
  }

  return items
}

export function buildPreventionActionPlan({
  actionHistory = [],
  familyMembers = [],
  preventionInsights = [],
  profile = {},
}) {
  const eligibleFamilyMembers = filterFamilyMembersByEligibility(
    familyMembers,
    profile,
  )
  const today = []
  const thisWeek = []
  const thisMonth = []

  preventionInsights.slice(0, 3).forEach((insight) => {
    addInsightDrivenActions(today, insight, eligibleFamilyMembers, profile)
    addInsightDrivenActions(thisMonth, insight, eligibleFamilyMembers, profile)
  })

  addDailyLifestyleActions(today, profile)
  addWeeklyInsightActions(
    thisWeek,
    preventionInsights,
    eligibleFamilyMembers,
    profile,
  )
  addWeeklyActions(thisWeek, eligibleFamilyMembers, profile, actionHistory)
  addMonthlyLifestyleActions(thisMonth, profile)
  addFamilyHistoryActions(thisMonth, eligibleFamilyMembers)

  const todayActions = getDistinctActions(
    today.filter(
      (action) =>
        action.timeframe === 'today' && isSupportedAction(action, profile),
    ),
    4,
  )
  const monthActions = getDistinctActions(
    thisMonth.filter(
      (action) =>
        action.timeframe === 'month' && isSupportedAction(action, profile),
    ),
    3,
  )
  const weekActions = getDistinctWeeklyActions(
    thisWeek.filter(
      (action) =>
        isWeeklyPlanningAction(action) && isSupportedAction(action, profile),
    ),
    todayActions,
    3,
  )

  return {
    keepTrack: buildKeepTrackItems({ preventionInsights, profile }),
    thisMonth: monthActions,
    thisWeek: weekActions,
    today: todayActions,
  }
}

export function buildPreventionProgressSummary(actionHistory = []) {
  if (!Array.isArray(actionHistory) || actionHistory.length === 0) {
    return []
  }

  const labelsByType = {
    'weekly-family-history': 'Family history',
    'weekly-mental-reset': 'Mental well-being',
    'weekly-nutrition-produce': 'Nutrition',
    'weekly-physical-activity': 'Physical activity',
    'weekly-sleep-consistency': 'Sleep',
  }
  const summaries = []

  Object.entries(labelsByType).forEach(([goalType, label]) => {
    const entries = getHistoryForGoalType(actionHistory, goalType).slice(-3)

    if (entries.length === 0) {
      return
    }

    const completedCount = entries.filter((entry) => getCompletionRatio(entry) >= 1).length
    const average =
      entries.reduce((sum, entry) => sum + getCompletionRatio(entry), 0) /
      entries.length

    summaries.push({
      goalType,
      label,
      status:
        average >= 1
          ? `${completedCount} of ${entries.length} recent weekly goals completed`
          : average >= 0.5
            ? 'Building consistency'
            : 'Personalized to your profile',
    })
  })

  return summaries.slice(0, 4)
}
