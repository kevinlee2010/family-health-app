const organSpecificRules = [
  {
    requiredSexAtBirth: 'Male',
    terms: ['prostate cancer', 'testicular cancer'],
  },
  {
    requiredSexAtBirth: 'Female',
    terms: [
      'cervical cancer',
      'endometrial cancer',
      'ovarian cancer',
      'uterine cancer',
    ],
  },
]

function normalizeEligibilityText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

function getRequiredSexAtBirth(conditionName) {
  const normalizedCondition = normalizeEligibilityText(conditionName)

  return (
    organSpecificRules.find((rule) =>
      rule.terms.some((term) => normalizedCondition.includes(term)),
    )?.requiredSexAtBirth || ''
  )
}

function getConditionName(condition) {
  return typeof condition === 'string' ? condition : condition?.name || ''
}

function getKnownAge(profile = {}) {
  const exactAge = Number(profile.age)

  return Number.isFinite(exactAge) && exactAge > 0 ? exactAge : null
}

export function isConditionApplicableToProfile(conditionName, profile = {}) {
  const requiredSexAtBirth = getRequiredSexAtBirth(conditionName)

  if (!requiredSexAtBirth) {
    return true
  }

  return profile.sexAtBirth === requiredSexAtBirth
}

export function isBreastScreeningEligible(profile = {}) {
  if (profile.sexAtBirth !== 'Female') {
    return false
  }

  const knownAge = getKnownAge(profile)

  if (knownAge !== null) {
    return knownAge >= 40
  }

  return ['45-54', '55-64', '65+'].includes(profile.ageRange)
}

export function isColorectalScreeningEligible(profile = {}) {
  const knownAge = getKnownAge(profile)

  if (knownAge !== null) {
    return knownAge >= 45
  }

  return ['45-54', '55-64', '65+'].includes(profile.ageRange)
}

export function filterFamilyMembersByEligibility(
  familyMembers = [],
  profile = {},
) {
  return familyMembers.map((member) => {
    const conditions = Array.isArray(member.conditions)
      ? member.conditions.filter((condition) =>
          isConditionApplicableToProfile(getConditionName(condition), profile),
        )
      : member.conditions
    const illnesses = Array.isArray(member.illnesses)
      ? member.illnesses.filter((condition) =>
          isConditionApplicableToProfile(getConditionName(condition), profile),
        )
      : member.illnesses

    return { ...member, conditions, illnesses }
  })
}

export function filterHealthCategoryByEligibility(category = {}, profile = {}) {
  const conditions = Array.isArray(category.conditions)
    ? category.conditions.filter((condition) =>
        isConditionApplicableToProfile(condition.conditionName, profile),
      )
    : []
  const observationCount = conditions.reduce(
    (total, condition) => total + Number(condition.count || 0),
    0,
  )

  return {
    ...category,
    conditions,
    observationCount,
    riskLevel:
      observationCount >= 2
        ? 'High'
        : observationCount === 1
          ? 'Increased'
          : 'Average',
  }
}

export function isPreventionActionApplicable(action = {}, profile = {}) {
  const actionText = normalizeEligibilityText(
    [
      action.category,
      action.label,
      action.resourceIntent,
      action.resourceType,
    ].join(' '),
  )

  if (!isConditionApplicableToProfile(actionText, profile)) {
    return false
  }

  if (actionText.includes('breast screening') || actionText.includes('mammograph')) {
    return isBreastScreeningEligible(profile)
  }

  if (actionText.includes('colorectal screening') || actionText.includes('colonoscopy')) {
    return isColorectalScreeningEligible(profile)
  }

  return true
}
