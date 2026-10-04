function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const moreInheritedConditionGroup = {
  id: 'more-inherited',
  label: 'More inherited conditions',
  description: 'Blood, digestive, vision, heart, and genetic conditions.',
  conditions: [
    'Blood clots (DVT or pulmonary embolism)',
    'Cardiomyopathy',
    'Sudden cardiac death',
    "Crohn's disease",
    'Ulcerative colitis',
    'Thyroid disease',
    'Glaucoma',
    'Macular degeneration',
    'Sickle cell disease',
    'Thalassemia',
    'Hemophilia',
    'Cystic fibrosis',
    "Huntington's disease",
    'Marfan syndrome',
  ],
}

const conditionAliases = {
  'high blood pressure': ['hypertension', 'high bp', 'elevated blood pressure'],
  'high cholesterol': ['hyperlipidemia', 'dyslipidemia'],
  'heart attack': ['myocardial infarction', 'mi'],
  stroke: ['cerebrovascular accident', 'cva'],
  'colon cancer': ['colorectal cancer', 'bowel cancer'],
  diabetes: ['type 2 diabetes', 't2d', 'blood sugar'],
  copd: ['chronic obstructive pulmonary disease'],
  "alzheimer's disease": ['alzheimers', 'alzheimer disease'],
  'blood clots (dvt or pulmonary embolism)': [
    'blood clot',
    'deep vein thrombosis',
    'dvt',
    'pulmonary embolism',
  ],
  'thyroid disease': ['hypothyroidism', 'hyperthyroidism'],
  'sickle cell disease': ['sickle cell anemia'],
}

export function searchFamilyConditions(groups = [], query = '', limit = 12) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  return groups
    .flatMap((group) =>
      group.conditions.map((condition) => {
        const normalizedCondition = normalizeSearchText(condition)
        const aliases = conditionAliases[normalizedCondition] || []
        const searchableTerms = [condition, ...aliases].map(normalizeSearchText)
        const matchingTerm = searchableTerms.find((term) =>
          term.includes(normalizedQuery),
        )

        if (!matchingTerm) {
          return null
        }

        return {
          condition,
          groupId: group.id,
          groupLabel: group.label,
          score:
            normalizedCondition === normalizedQuery
              ? 3
              : normalizedCondition.startsWith(normalizedQuery)
                ? 2
                : 1,
        }
      }),
    )
    .filter(Boolean)
    .sort(
      (firstResult, secondResult) =>
        secondResult.score - firstResult.score ||
        firstResult.condition.localeCompare(secondResult.condition),
    )
    .slice(0, limit)
}

export function resolveFamilyConditionSelection({
  noConditionLabels = [],
  noKnownConditionsLabel,
  selectedConditions = [],
  unknownConditionLabel,
} = {}) {
  const unknownKey = normalizeSearchText(unknownConditionLabel)

  if (
    unknownKey &&
    selectedConditions.some(
      (condition) => normalizeSearchText(condition) === unknownKey,
    )
  ) {
    return [unknownConditionLabel]
  }

  const noConditionKeys = new Set(noConditionLabels.map(normalizeSearchText))
  const seenConditions = new Set()
  const conditions = selectedConditions.reduce((resolvedConditions, condition) => {
    const conditionName = String(condition || '').trim()
    const conditionKey = normalizeSearchText(conditionName)

    if (
      !conditionKey ||
      noConditionKeys.has(conditionKey) ||
      seenConditions.has(conditionKey)
    ) {
      return resolvedConditions
    }

    seenConditions.add(conditionKey)
    return [...resolvedConditions, conditionName]
  }, [])

  return conditions.length > 0
    ? conditions
    : noKnownConditionsLabel
      ? [noKnownConditionsLabel]
      : []
}
