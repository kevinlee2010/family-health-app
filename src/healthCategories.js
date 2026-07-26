const NO_CONDITION_VALUES = [
  'none',
  'no conditions',
  'no known conditions',
  'no illness',
  'no illnesses',
]

export const healthCategoryDefinitions = [
  {
    id: 'cardiovascular',
    name: 'Cardiovascular Health',
    description:
      'Heart and blood vessel conditions, including blood pressure, cholesterol, heart disease, and stroke patterns.',
    keywords: [
      'heart',
      'cardiac',
      'cardiovascular',
      'blood pressure',
      'hypertension',
      'cholesterol',
      'stroke',
      'heart attack',
      'coronary',
      'atrial fibrillation',
      'familial hypercholesterolemia',
    ],
  },
  {
    id: 'metabolic',
    name: 'Metabolic Health',
    description:
      'Conditions related to blood sugar, body weight, and how the body uses and stores energy.',
    keywords: [
      'diabetes',
      'type 2 diabetes',
      'type 1 diabetes',
      'prediabetes',
      'obesity',
      'metabolic',
      'insulin',
    ],
  },
  {
    id: 'cancer',
    name: 'Cancer',
    description:
      'Cancer history patterns, including breast, colon, colorectal, and other cancer entries.',
    keywords: [
      'cancer',
      'tumor',
      'tumour',
      'breast',
      'colon',
      'colorectal',
      'prostate',
      'lung cancer',
      'melanoma',
      'leukemia',
      'lymphoma',
    ],
  },
  {
    id: 'neurological',
    name: 'Neurological Health',
    description:
      'Brain, memory, nerve, and nervous-system conditions, including dementia and stroke entries.',
    keywords: [
      'alzheimer',
      'dementia',
      'stroke',
      'parkinson',
      'seizure',
      'epilepsy',
      'migraine',
      'multiple sclerosis',
      'neuropathy',
      'neurological',
    ],
  },
  {
    id: 'respiratory',
    name: 'Respiratory Health',
    description:
      'Lung and breathing conditions such as asthma, COPD, and other chronic respiratory concerns.',
    keywords: [
      'asthma',
      'copd',
      'chronic obstructive',
      'emphysema',
      'bronchitis',
      'respiratory',
      'lung disease',
    ],
  },
  {
    id: 'kidney',
    name: 'Kidney Health',
    description:
      'Kidney and renal conditions, including chronic kidney disease and kidney failure entries.',
    keywords: [
      'kidney',
      'renal',
      'ckd',
      'nephritis',
      'kidney failure',
      'polycystic kidney',
    ],
  },
  {
    id: 'mental',
    name: 'Mental Health',
    description:
      'Mental and behavioral health history patterns, including depression and anxiety entries.',
    keywords: [
      'depression',
      'anxiety',
      'bipolar',
      'ptsd',
      'mental health',
      'substance use',
      'addiction',
      'schizophrenia',
      'adhd',
      'autism',
      'autism spectrum',
    ],
  },
]

const riskPriority = {
  High: 3,
  Increased: 2,
  Average: 1,
}

export function normalizeCategoryCondition(value) {
  return value
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\.+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function isNoCondition(value) {
  return NO_CONDITION_VALUES.includes(normalizeCategoryCondition(value))
}

function matchesCategory(conditionName, category) {
  const normalizedCondition = normalizeCategoryCondition(conditionName)

  return category.keywords.some((keyword) =>
    normalizedCondition.includes(normalizeCategoryCondition(keyword)),
  )
}

function getRiskLevel(observationCount) {
  if (observationCount >= 2) {
    return 'High'
  }

  if (observationCount === 1) {
    return 'Increased'
  }

  return 'Average'
}

function getExplanation({ categoryName, conditionCount, riskLevel }) {
  if (riskLevel === 'High') {
    return `${categoryName} shows a strong family pattern because two or more family-history entries map to this area.`
  }

  if (riskLevel === 'Increased') {
    return `${categoryName} shows a notable family pattern because one family-history entry maps to this area.`
  }

  if (conditionCount > 0) {
    return `${categoryName} has limited mapped family-history information so far.`
  }

  return `No family-history entries currently map to ${categoryName.toLowerCase()}.`
}

function addConditionContribution(conditionMap, conditionName, relationship) {
  const conditionKey = normalizeCategoryCondition(conditionName)
  const existingCondition = conditionMap.get(conditionKey)

  if (existingCondition) {
    existingCondition.count += 1

    if (!existingCondition.relatives.includes(relationship)) {
      existingCondition.relatives.push(relationship)
    }

    return
  }

  conditionMap.set(conditionKey, {
    conditionName,
    count: 1,
    relatives: [relationship],
  })
}

function buildCategorySummary(category, familyMembers) {
  const conditionMap = new Map()
  let observationCount = 0

  familyMembers.forEach((member) => {
    member.illnesses.forEach((illness) => {
      if (!illness || isNoCondition(illness) || !matchesCategory(illness, category)) {
        return
      }

      observationCount += 1
      addConditionContribution(conditionMap, illness, member.relationship)
    })
  })

  const conditions = Array.from(conditionMap.values())
  const riskLevel = getRiskLevel(observationCount)

  return {
    ...category,
    conditions,
    explanation: getExplanation({
      categoryName: category.name,
      conditionCount: conditions.length,
      riskLevel,
    }),
    observationCount,
    riskLevel,
  }
}

function getRiskCounts(categories) {
  return categories.reduce(
    (counts, category) => ({
      ...counts,
      [category.riskLevel]: counts[category.riskLevel] + 1,
    }),
    {
      Average: 0,
      Increased: 0,
      High: 0,
    },
  )
}

function getTopAreas(categories) {
  return [...categories]
    .sort((firstCategory, secondCategory) => {
      const riskDifference =
        riskPriority[secondCategory.riskLevel] -
        riskPriority[firstCategory.riskLevel]

      if (riskDifference !== 0) {
        return riskDifference
      }

      return secondCategory.observationCount - firstCategory.observationCount
    })
    .slice(0, 3)
}

export function buildFamilyHealthSummary({ familyMembers }) {
  const categories = healthCategoryDefinitions.map((category) =>
    buildCategorySummary(category, familyMembers),
  )

  return {
    categories,
    riskCounts: getRiskCounts(categories),
    topAreas: getTopAreas(categories),
  }
}
