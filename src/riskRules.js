const NO_CONDITION_VALUES = ['none', 'no conditions', 'no illness', 'no illnesses']

const defaultSuggestions = [
  'Discuss screening with a healthcare professional.',
  'Track symptoms and family history changes.',
  'Maintain regular physical activity.',
]

const conditionSuggestions = [
  {
    keywords: ['blood pressure', 'hypertension', 'heart', 'stroke', 'cholesterol'],
    suggestions: [
      'Discuss screening with a healthcare professional.',
      'Monitor blood pressure and cholesterol as advised.',
      'Avoid tobacco and maintain regular physical activity.',
    ],
  },
  {
    keywords: ['diabetes', 'obesity'],
    suggestions: [
      'Discuss screening with a healthcare professional.',
      'Eat a balanced diet and maintain regular physical activity.',
      'Track symptoms and family history changes.',
    ],
  },
  {
    keywords: ['cancer', 'breast', 'colon'],
    suggestions: [
      'Discuss screening options with a healthcare professional.',
      'Track symptoms and family history changes.',
      'Avoid tobacco and keep up with preventive care visits.',
    ],
  },
]

export function normalizeConditionName(value) {
  return value
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function isNoCondition(value) {
  return NO_CONDITION_VALUES.includes(normalizeConditionName(value))
}

function getConditionKey(condition) {
  return normalizeConditionName(condition)
}

function addConditionToMap(conditionMap, condition, source) {
  if (!condition || isNoCondition(condition)) {
    return
  }

  const key = getConditionKey(condition)
  const existingCondition = conditionMap.get(key)

  if (existingCondition) {
    existingCondition.sources.push(source)
    return
  }

  conditionMap.set(key, {
    conditionName: condition,
    sources: [source],
  })
}

function getSuggestions(conditionName) {
  const normalizedCondition = normalizeConditionName(conditionName)
  const matchingSuggestionSet = conditionSuggestions.find(({ keywords }) =>
    keywords.some((keyword) => normalizedCondition.includes(keyword)),
  )

  return matchingSuggestionSet?.suggestions || defaultSuggestions
}

function getFamilyContributors(sources) {
  return sources
    .filter((source) => source.type === 'family')
    .map((source) => source.relationship)
}

function getUserHasCondition(sources) {
  return sources.some((source) => source.type === 'self')
}

function getRiskLevel({ familyContributors, userHasCondition }) {
  if (userHasCondition) {
    return 'Current condition'
  }

  if (familyContributors.length >= 2) {
    return 'High'
  }

  if (familyContributors.length === 1) {
    return 'Increased'
  }

  return 'Average'
}

function getExplanation({ conditionName, familyContributors, riskLevel }) {
  if (riskLevel === 'Current condition') {
    if (familyContributors.length > 0) {
      return `You listed ${conditionName} in your own profile. This card is shown as a current condition, and ${familyContributors.length} family member${familyContributors.length === 1 ? '' : 's'} also listed it.`
    }

    return `You listed ${conditionName} in your own profile. This card is shown as a current condition rather than a prediction.`
  }

  if (riskLevel === 'High') {
    return `Two or more family members listed ${conditionName}, so this educational tool marks it as high family-history awareness.`
  }

  if (riskLevel === 'Increased') {
    return `One family member listed ${conditionName}, so this educational tool marks it as increased family-history awareness.`
  }

  return `No family members currently list ${conditionName}, so this educational tool marks it as average family-history awareness.`
}

export function buildRiskAssessments({ familyMembers, userProfile }) {
  const conditionMap = new Map()

  familyMembers.forEach((member) => {
    member.illnesses.forEach((illness) => {
      addConditionToMap(conditionMap, illness, {
        relationship: member.relationship,
        type: 'family',
      })
    })
  })

  if (userProfile) {
    userProfile.illnesses.forEach((illness) => {
      addConditionToMap(conditionMap, illness, {
        relationship: 'Self',
        type: 'self',
      })
    })
  }

  return Array.from(conditionMap.values()).map(({ conditionName, sources }) => {
    const familyContributors = getFamilyContributors(sources)
    const userHasCondition = getUserHasCondition(sources)
    const riskLevel = getRiskLevel({ familyContributors, userHasCondition })

    return {
      conditionName,
      contributors: userHasCondition
        ? ['Self', ...familyContributors]
        : familyContributors,
      explanation: getExplanation({
        conditionName,
        familyContributors,
        riskLevel,
      }),
      riskLevel,
      suggestions: getSuggestions(conditionName),
    }
  })
}
