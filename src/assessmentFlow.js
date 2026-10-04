export const assessmentSteps = [
  {
    id: 'health',
    label: 'Your Current Health',
  },
  {
    id: 'lifestyle',
    label: 'Your Everyday Habits',
  },
  {
    id: 'structure',
    label: 'Your Family Structure',
  },
  {
    id: 'family',
    label: 'Your Family Health Tree',
  },
  {
    id: 'insights',
    label: 'Your Health Profile',
  },
  {
    id: 'coach',
    label: 'Your Prevention Plan',
  },
]

const requiredAssessmentStepIds = ['health', 'lifestyle', 'structure', 'family']

function getCompletionByViewId({
  hasCurrentHealthData = false,
  hasFamilyHistoryData = false,
  hasFamilyStructureData = false,
  hasLifestyleData = false,
} = {}) {
  return {
    family: hasFamilyHistoryData,
    health: hasCurrentHealthData,
    lifestyle: hasLifestyleData,
    structure: hasFamilyStructureData,
  }
}

export function getFirstIncompleteRequiredView(completion = {}) {
  const completionByViewId = getCompletionByViewId(completion)

  return (
    requiredAssessmentStepIds.find(
      (viewId) => !completionByViewId[viewId],
    ) || null
  )
}

export function getAssessmentNavigationAccess({
  targetView = '',
  ...completion
} = {}) {
  if (!assessmentSteps.some((step) => step.id === targetView)) {
    return {
      allowed: true,
      firstIncompleteView: getFirstIncompleteRequiredView(completion),
      message: '',
    }
  }

  const firstIncompleteView = getFirstIncompleteRequiredView(completion)

  if (!firstIncompleteView) {
    return { allowed: true, firstIncompleteView: null, message: '' }
  }

  const targetIndex = assessmentSteps.findIndex((step) => step.id === targetView)
  const firstIncompleteIndex = assessmentSteps.findIndex(
    (step) => step.id === firstIncompleteView,
  )
  const allowed = targetIndex <= firstIncompleteIndex

  return {
    allowed,
    firstIncompleteView,
    message: allowed ? '' : getAssessmentReminderMessage(firstIncompleteView),
  }
}

export function getNextIncompleteAssessmentView({
  hasCurrentHealthData = false,
  hasFamilyHistoryData = false,
  hasFamilyStructureData = false,
  hasLifestyleData = false,
} = {}) {
  if (!hasCurrentHealthData) {
    return 'health'
  }

  if (!hasLifestyleData) {
    return 'lifestyle'
  }

  if (!hasFamilyStructureData) {
    return 'structure'
  }

  if (!hasFamilyHistoryData) {
    return 'family'
  }

  return 'insights'
}

export function getAssessmentCompletionPercent({
  hasCurrentHealthData = false,
  hasFamilyHistoryData = false,
  hasFamilyStructureData = false,
  hasLifestyleData = false,
} = {}) {
  const completedSectionCount = [
    hasCurrentHealthData,
    hasFamilyStructureData,
    hasFamilyHistoryData,
    hasLifestyleData,
  ].filter(Boolean).length

  return Math.round((completedSectionCount / 4) * 100)
}

export function getAssessmentReminderMessage(viewId) {
  const reminderMessages = {
    family: 'Add health information for Mother and Father before continuing.',
    health: 'Complete Your Current Health before continuing.',
    lifestyle: 'Finish Your Everyday Habits before continuing.',
    structure: 'Complete Your Family Structure before continuing.',
  }

  return reminderMessages[viewId] || ''
}
