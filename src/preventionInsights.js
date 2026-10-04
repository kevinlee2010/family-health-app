import {
  filterFamilyMembersByEligibility,
  filterHealthCategoryByEligibility,
  isBreastScreeningEligible,
  isColorectalScreeningEligible,
} from './healthEligibility.js'

const patternLabelByLevel = {
  Average: 'limited',
  High: 'high',
  Increased: 'elevated',
}

const patternToneByLabel = {
  elevated: 'notable',
  high: 'strong',
  limited: 'limited',
}

const healthAreaContent = {
  cancer: {
    preventionInsight:
      'Your reported family history suggests that cancer-prevention awareness may deserve extra attention. Accurate family-history tracking, healthy lifestyle habits, and age-appropriate screening conversations can support informed prevention planning without treating the pattern as a prediction.',
    strategies: [
      'Keep family history updated',
      'Stay physically active',
      'Limit alcohol intake',
      'Review screening guidance',
    ],
    sourceName: 'American Cancer Society',
    sourceUrl: 'https://www.cancer.org/cancer/risk-prevention.html',
    title: 'Cancer Prevention',
  },
  cardiovascular: {
    preventionInsight:
      'A repeated family pattern of heart disease, high blood pressure, high cholesterol, or stroke may make heart-health habits especially relevant. Physical activity, balanced nutrition, and regular awareness of blood pressure and cholesterol can help address modifiable cardiovascular risk factors.',
    strategies: [
      'Monitor blood pressure',
      'Stay physically active',
      'Choose heart-healthy foods',
      'Maintain healthy cholesterol levels',
    ],
    sourceName: 'American Heart Association',
    sourceUrl: 'https://www.heart.org/en/healthy-living',
    title: 'Cardiovascular Health',
  },
  kidney: {
    preventionInsight:
      'Your reported family history may make kidney-health awareness useful, especially because blood pressure and blood sugar can affect kidney function over time. Tracking family history and supporting healthy daily habits can help guide preventive conversations.',
    strategies: [
      'Monitor blood pressure',
      'Support healthy blood sugar',
      'Stay well hydrated',
      'Keep family history updated',
    ],
    sourceName: 'Centers for Disease Control and Prevention',
    sourceUrl: 'https://www.cdc.gov/kidney-disease/prevention/index.html',
    title: 'Kidney Health',
  },
  mental: {
    preventionInsight:
      'A family pattern involving mental-health conditions may make consistent emotional-wellness habits especially valuable. Regular sleep, physical activity, stress management, and strong social connections can support long-term mental well-being.',
    strategies: [
      'Maintain regular sleep',
      'Use stress-management techniques',
      'Stay physically active',
      'Maintain social connections',
    ],
    sourceName: 'National Institute of Mental Health',
    sourceUrl: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
    title: 'Mental Well-Being',
  },
  metabolic: {
    preventionInsight:
      'A family pattern of diabetes or metabolic conditions may make blood-sugar prevention habits especially relevant. Regular movement, balanced meals, weight management, and limiting sugary drinks can help reduce modifiable risk factors.',
    strategies: [
      'Stay physically active',
      'Choose fiber-rich meals',
      'Limit sugary drinks',
      'Maintain a healthy weight',
    ],
    sourceName: 'National Institute of Diabetes and Digestive and Kidney Diseases',
    sourceUrl: 'https://www.niddk.nih.gov/health-information/diabetes',
    title: 'Diabetes Prevention',
  },
  neurological: {
    preventionInsight:
      'Your reported family history suggests that long-term brain and cardiovascular health may deserve extra attention. Regular movement, consistent sleep, blood-pressure awareness, and continued mental and social engagement can support healthier brain aging.',
    strategies: [
      'Stay physically active',
      'Maintain consistent sleep',
      'Monitor blood pressure',
      'Stay socially engaged',
    ],
    sourceName: 'Centers for Disease Control and Prevention',
    sourceUrl: 'https://www.cdc.gov/aging/index.html',
    title: 'Brain and Stroke Prevention',
  },
  respiratory: {
    preventionInsight:
      'A family pattern involving asthma or other respiratory conditions may make lung-health habits more important. Avoiding smoke exposure, staying active, reducing indoor irritants, and paying attention to recurring breathing symptoms can support respiratory health.',
    strategies: [
      'Avoid smoke exposure',
      'Reduce indoor air irritants',
      'Stay physically active',
      'Track breathing symptoms',
    ],
    sourceName: 'American Lung Association',
    sourceUrl: 'https://www.lung.org/lung-health-diseases/wellness',
    title: 'Respiratory Health',
  },
}

const conditionSpecificContent = [
  {
    categoryId: 'cancer',
    keywords: ['breast cancer'],
    preventionInsight:
      'A reported family pattern of breast cancer may make accurate family-history tracking and screening awareness especially important. Healthy lifestyle habits and awareness of family patterns can support informed prevention planning.',
    strategies: [
      'Keep family history updated',
      'Stay physically active',
      'Limit alcohol intake',
      'Review screening guidance',
    ],
    sourceName: 'American Cancer Society',
    sourceUrl: 'https://www.cancer.org/cancer/types/breast-cancer.html',
    title: 'Breast Cancer Prevention',
  },
  {
    categoryId: 'cancer',
    keywords: ['colon cancer', 'colorectal cancer'],
    preventionInsight:
      'A family pattern of colorectal cancer may make screening awareness and digestive-health habits more relevant. Physical activity, fiber-rich foods, healthy weight management, and accurate family-history records can support prevention planning.',
    strategies: [
      'Eat fiber-rich foods',
      'Stay physically active',
      'Maintain a healthy weight',
      'Keep family history updated',
    ],
    sourceName: 'American Cancer Society',
    sourceUrl: 'https://www.cancer.org/cancer/types/colon-rectal-cancer.html',
    title: 'Colon Cancer Prevention',
  },
  {
    categoryId: 'cardiovascular',
    keywords: ['high cholesterol', 'cholesterol'],
    preventionInsight:
      'Your reported family history suggests that cholesterol awareness may be especially useful. Heart-healthy eating, regular movement, and routine cholesterol conversations can support modifiable cardiovascular prevention factors.',
    strategies: [
      'Choose heart-healthy foods',
      'Stay physically active',
      'Know cholesterol numbers',
      'Limit saturated fats',
    ],
    sourceName: 'American Heart Association',
    sourceUrl: 'https://www.heart.org/en/health-topics/cholesterol',
    title: 'Cholesterol Awareness',
  },
  {
    categoryId: 'cardiovascular',
    keywords: ['high blood pressure', 'hypertension'],
    preventionInsight:
      'Your reported family history suggests that blood-pressure awareness may deserve extra attention. Regular movement, balanced nutrition, sodium awareness, and routine blood-pressure checks can support modifiable heart-health factors.',
    strategies: [
      'Monitor blood pressure',
      'Reduce sodium intake',
      'Stay physically active',
      'Choose balanced meals',
    ],
    sourceName: 'American Heart Association',
    sourceUrl: 'https://www.heart.org/en/health-topics/high-blood-pressure',
    title: 'Blood Pressure Awareness',
  },
]

export function getPatternLabel(riskLevel, observationCount = 0) {
  if (observationCount === 0 && riskLevel !== 'Average') {
    return 'limited'
  }

  return patternLabelByLevel[riskLevel] || 'limited'
}

export function getPatternTone(patternLabel) {
  return patternToneByLabel[patternLabel] || 'limited'
}

export function getPatternExplanation(patternLabel) {
  if (patternLabel === 'high') {
    return 'Multiple close relatives report the same or related condition.'
  }

  if (patternLabel === 'elevated') {
    return 'One close relative or several more distant relatives report this health area.'
  }

  if (patternLabel === 'limited') {
    return 'No meaningful pattern appears in the current family profile.'
  }

  return 'Too little family-history information is available for a confident educational insight.'
}

function formatInsightList(items) {
  const uniqueItems = [...new Set(items.filter(Boolean))]

  if (uniqueItems.length === 0) {
    return ''
  }

  if (uniqueItems.length === 1) {
    return uniqueItems[0]
  }

  if (uniqueItems.length === 2) {
    return `${uniqueItems[0]} and ${uniqueItems[1]}`
  }

  return `${uniqueItems.slice(0, -1).join(', ')}, and ${uniqueItems.at(-1)}`
}

function getConditionEvidence(category) {
  const conditionSummaries = category.conditions
    .filter((condition) => condition.count > 0)
    .map((condition) => {
      const relatives = formatInsightList(condition.relatives)
      const relativeText = relatives ? ` in ${relatives}` : ''

      return `${condition.conditionName}${relativeText}`
    })

  return formatInsightList(conditionSummaries.slice(0, 3))
}

function getPersonalizedEvidenceExplanation(category, patternLabel) {
  const conditionEvidence = getConditionEvidence(category)

  if (!conditionEvidence) {
    return getPatternExplanation(patternLabel)
  }

  if (category.observationCount >= 2) {
    return `${conditionEvidence} appears across ${category.observationCount} family-history entries in your profile.`
  }

  return `${conditionEvidence} appears in your family-health profile.`
}

const insightPriority = {
  high: 4,
  elevated: 3,
  limited: 1,
}

const firstDegreeRelationships = ['Mother', 'Father', 'Sibling']
const firstDegreeRelationshipTypes = new Set(['mother', 'father', 'brother', 'sister'])
const secondDegreeRelationshipTypes = new Set([
  'maternal-grandmother',
  'maternal-grandfather',
  'paternal-grandmother',
  'paternal-grandfather',
  'maternal-aunt',
  'maternal-uncle',
  'paternal-aunt',
  'paternal-uncle',
])
const relationshipGeneration = {
  father: 2,
  mother: 2,
  'maternal-aunt': 2,
  'maternal-grandfather': 1,
  'maternal-grandmother': 1,
  'maternal-uncle': 2,
  'paternal-aunt': 2,
  'paternal-grandfather': 1,
  'paternal-grandmother': 1,
  'paternal-uncle': 2,
  brother: 3,
  sister: 3,
  self: 3,
  daughter: 4,
  son: 4,
}
const maternalRelationshipTypes = new Set([
  'maternal-grandmother',
  'maternal-grandfather',
  'maternal-aunt',
  'maternal-uncle',
  'mother',
])
const paternalRelationshipTypes = new Set([
  'paternal-grandmother',
  'paternal-grandfather',
  'paternal-aunt',
  'paternal-uncle',
  'father',
])
const relationshipDisplayNames = {
  brother: 'Brother',
  daughter: 'Daughter',
  father: 'Father',
  mother: 'Mother',
  'maternal-aunt': 'Maternal Aunt',
  'maternal-grandfather': 'Maternal Grandfather',
  'maternal-grandmother': 'Maternal Grandmother',
  'maternal-uncle': 'Maternal Uncle',
  'paternal-aunt': 'Paternal Aunt',
  'paternal-grandfather': 'Paternal Grandfather',
  'paternal-grandmother': 'Paternal Grandmother',
  'paternal-uncle': 'Paternal Uncle',
  self: 'You',
  sister: 'Sister',
  son: 'Son',
}

const currentConditionCategoryMap = {
  cardiovascular: [
    'heart',
    'blood pressure',
    'hypertension',
    'cholesterol',
    'stroke',
  ],
  metabolic: ['diabetes', 'prediabetes', 'obesity'],
  cancer: ['cancer', 'breast', 'colon', 'colorectal'],
  mental: ['depression', 'anxiety', 'mental health'],
  respiratory: ['asthma', 'copd', 'respiratory'],
  kidney: ['kidney', 'renal'],
  neurological: ['dementia', 'alzheimer', 'parkinson', 'stroke'],
}

const noConditionValues = new Set([
  'none',
  'no health conditions added',
  'no known conditions',
  'no conditions',
  'unknown',
])

function normalizeProfileValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function getCurrentConditionMatches(category, profile = {}, content = {}) {
  const currentConditions = Array.isArray(profile.illnesses) ? profile.illnesses : []
  const focalTerms = getFocalConditionTerms(content)
  const keywords = focalTerms.length > 0 ? focalTerms : currentConditionCategoryMap[category.id] || []
  const matchedConditions = currentConditions.filter((condition) => {
    const normalizedCondition = normalizeProfileValue(condition)

    return keywords.some((keyword) => normalizedCondition.includes(keyword))
  })

  if (
    category.id === 'cardiovascular' &&
    ['Yes', 'Unknown'].includes(profile.knownHighBloodPressure)
  ) {
    matchedConditions.push(
      profile.knownHighBloodPressure === 'Yes'
        ? 'reported high blood pressure'
        : 'unknown blood pressure status',
    )
  }

  if (
    category.id === 'cardiovascular' &&
    ['Yes', 'Unknown'].includes(profile.knownHighCholesterol)
  ) {
    matchedConditions.push(
      profile.knownHighCholesterol === 'Yes'
        ? 'reported high cholesterol'
        : 'unknown cholesterol status',
    )
  }

  if (
    category.id === 'metabolic' &&
    ['Prediabetes', 'Diabetes', 'Diabetes, type unknown', 'Unknown'].includes(
      profile.diabetesStatus,
    )
  ) {
    matchedConditions.push(
      profile.diabetesStatus === 'Unknown'
        ? 'unknown blood-sugar status'
        : profile.diabetesStatus.toLowerCase(),
    )
  }

  return [...new Set(matchedConditions)]
}

function getLifestyleSignals(category, profile = {}) {
  const signals = []

  if (
    ['cardiovascular', 'metabolic', 'mental', 'neurological'].includes(category.id) &&
    ['Rarely', '1-2 days/week'].includes(profile.exercise)
  ) {
    signals.push('your activity level has room to become more consistent')
  }

  if (
    ['cardiovascular', 'metabolic', 'cancer'].includes(category.id) &&
    (['Poor', 'Fair'].includes(profile.dietQuality) ||
      ['0-1 servings', '2 servings'].includes(profile.fruitVegIntake))
  ) {
    signals.push('your nutrition answers point to room for more produce and fiber-rich meals')
  }

  if (
    ['cardiovascular', 'cancer', 'respiratory'].includes(category.id) &&
    profile.smokingStatus === 'Current'
  ) {
    signals.push('current smoking or vaping is part of your profile')
  }

  if (category.id === 'cancer' && ['Weekly', 'Daily'].includes(profile.alcoholUse)) {
    signals.push('your alcohol-use answer makes moderation a relevant prevention topic')
  }

  if (
    ['mental', 'neurological'].includes(category.id) &&
    ['Less than 6 hours', 'More than 9 hours'].includes(profile.sleep)
  ) {
    signals.push('your sleep answer suggests recovery rhythm is worth attention')
  }

  if (category.id === 'mental' && ['High', 'Very high'].includes(profile.stressLevel)) {
    signals.push('your stress response makes daily recovery support relevant')
  }

  if (category.id === 'metabolic' && ['Most days', 'Daily'].includes(profile.sugaryDrinks)) {
    signals.push('frequent sugary drinks are part of your current habits')
  }

  if (
    ['cardiovascular', 'cancer', 'metabolic'].includes(category.id) &&
    ['Unknown', 'Need to schedule', 'Not sure'].includes(profile.preventiveScreenings)
  ) {
    signals.push('your screening answer shows room to clarify routine preventive care')
  }

  return signals
}

function hasLimitedAlcohol(profile = {}) {
  return ['Never', 'Occasionally'].includes(profile.alcoholUse)
}

function hasSupportiveSleep(profile = {}) {
  return profile.sleep === '7-9 hours'
}

function hasLowSugaryDrinks(profile = {}) {
  return profile.sugaryDrinks === 'Rarely'
}

function hasManageableStress(profile = {}) {
  return ['Low', 'Moderate'].includes(profile.stressLevel)
}

function hasNoCurrentSmoking(profile = {}) {
  return ['Never', 'Former'].includes(profile.smokingStatus)
}

function hasBloodPressureAwareness(profile = {}) {
  return profile.knownHighBloodPressure === 'Yes'
}

function hasCholesterolAwareness(profile = {}) {
  return profile.knownHighCholesterol === 'Yes'
}

function hasPreventiveCareAwareness(profile = {}) {
  return profile.preventiveScreenings === 'Up to date'
}

function addPositiveSignal(signals, signal) {
  if (signal?.id && signal.text && !signals.some((item) => item.id === signal.id)) {
    signals.push(signal)
  }
}

function getSupportedPositiveSignalCandidates(category, profile = {}) {
  const signals = []

  if (category.id === 'cardiovascular') {
    if (hasHelpfulExercise(profile)) {
      addPositiveSignal(signals, {
        id: 'regular-activity',
        text: 'Your regular physical activity is a positive habit for supporting cardiovascular health.',
      })
    }

    if (hasNoCurrentSmoking(profile)) {
      addPositiveSignal(signals, {
        id: 'not-smoking',
        text: 'You reported not currently smoking or vaping, an important protective habit for cardiovascular health.',
      })
    }

    if (hasBloodPressureAwareness(profile)) {
      addPositiveSignal(signals, {
        id: 'blood-pressure-awareness',
        text: 'You reported knowing about your blood pressure, which supports cardiovascular awareness.',
      })
    }

    if (hasCholesterolAwareness(profile)) {
      addPositiveSignal(signals, {
        id: 'cholesterol-awareness',
        text: 'You reported knowing about your cholesterol, which supports heart-health awareness.',
      })
    }

    if (hasHelpfulNutrition(profile)) {
      addPositiveSignal(signals, {
        id: 'balanced-nutrition',
        text: 'Your nutrition answers point to habits that can support cardiovascular health.',
      })
    }

    if (hasLimitedAlcohol(profile)) {
      addPositiveSignal(signals, {
        id: 'limited-alcohol',
        text: 'You reported limiting alcohol, which supports your cardiovascular prevention habits.',
      })
    }
  }

  if (category.id === 'cancer') {
    if (hasLimitedAlcohol(profile)) {
      addPositiveSignal(signals, {
        id: 'limited-alcohol',
        text: 'You reported limiting alcohol, which supports your overall cancer-prevention habits.',
      })
    }

    if (hasNoCurrentSmoking(profile)) {
      addPositiveSignal(signals, {
        id: 'not-smoking',
        text: 'You reported not currently smoking or vaping, an important protective habit for cancer prevention.',
      })
    }

    if (hasHelpfulExercise(profile)) {
      addPositiveSignal(signals, {
        id: 'regular-activity',
        text: 'Your regular physical activity is a positive habit for supporting long-term cancer prevention.',
      })
    }

    if (hasHelpfulNutrition(profile)) {
      addPositiveSignal(signals, {
        id: 'balanced-nutrition',
        text: 'Your nutrition answers point to produce or fiber habits that can support prevention.',
      })
    }

    if (hasPreventiveCareAwareness(profile)) {
      addPositiveSignal(signals, {
        id: 'preventive-care',
        text: 'You reported being up to date with preventive checkups, which can support screening conversations.',
      })
    }
  }

  if (category.id === 'mental') {
    if (hasSupportiveSleep(profile)) {
      addPositiveSignal(signals, {
        id: 'supportive-sleep',
        text: 'You reported a consistent sleep range, which can support mood and emotional well-being.',
      })
    }

    if (hasHelpfulExercise(profile)) {
      addPositiveSignal(signals, {
        id: 'regular-activity',
        text: 'Your regular physical activity is a helpful habit for supporting mood and stress management.',
      })
    }

    if (hasManageableStress(profile)) {
      addPositiveSignal(signals, {
        id: 'manageable-stress',
        text: 'Your stress response suggests a steadier foundation for emotional well-being.',
      })
    }

    if (hasLimitedAlcohol(profile)) {
      addPositiveSignal(signals, {
        id: 'limited-alcohol',
        text: 'You reported limiting alcohol, which can support emotional wellness and sleep quality.',
      })
    }
  }

  if (category.id === 'respiratory') {
    if (hasNoCurrentSmoking(profile)) {
      addPositiveSignal(signals, {
        id: 'not-smoking',
        text: 'You reported not currently smoking or vaping, an important protective habit for lung health.',
      })
    }

    if (hasHelpfulExercise(profile)) {
      addPositiveSignal(signals, {
        id: 'regular-activity',
        text: 'Your regular physical activity can help support overall respiratory fitness.',
      })
    }
  }

  if (category.id === 'metabolic') {
    if (hasLowSugaryDrinks(profile)) {
      addPositiveSignal(signals, {
        id: 'low-sugary-drinks',
        text: 'You reported rarely drinking sugary drinks, which supports blood-sugar prevention habits.',
      })
    }

    if (hasHelpfulNutrition(profile)) {
      addPositiveSignal(signals, {
        id: 'balanced-nutrition',
        text: 'Your nutrition answers point to balanced habits that can support metabolic health.',
      })
    }

    if (hasHelpfulExercise(profile)) {
      addPositiveSignal(signals, {
        id: 'regular-activity',
        text: 'Your regular physical activity is a positive habit for supporting blood-sugar health.',
      })
    }
  }

  if (category.id === 'neurological') {
    if (hasSupportiveSleep(profile)) {
      addPositiveSignal(signals, {
        id: 'supportive-sleep',
        text: 'You reported a consistent sleep range, which can support brain health and daily recovery.',
      })
    }

    if (hasHelpfulExercise(profile)) {
      addPositiveSignal(signals, {
        id: 'regular-activity',
        text: 'Your regular physical activity is a positive habit for supporting brain and vascular health.',
      })
    }

    if (hasNoCurrentSmoking(profile)) {
      addPositiveSignal(signals, {
        id: 'not-smoking',
        text: 'You reported not currently smoking or vaping, which supports long-term brain and vascular health.',
      })
    }

    if (hasLimitedAlcohol(profile)) {
      addPositiveSignal(signals, {
        id: 'limited-alcohol',
        text: 'You reported limiting alcohol, which can support brain health and sleep quality.',
      })
    }
  }

  if (category.id === 'kidney') {
    if (hasBloodPressureAwareness(profile)) {
      addPositiveSignal(signals, {
        id: 'blood-pressure-awareness',
        text: 'You reported knowing about your blood pressure, which supports kidney-health awareness.',
      })
    }

    if (hasHelpfulNutrition(profile)) {
      addPositiveSignal(signals, {
        id: 'balanced-nutrition',
        text: 'Your nutrition answers point to balanced habits that can support kidney and metabolic health.',
      })
    }
  }

  return signals
}

function getPersonalStrengths(category, profile = {}) {
  const candidate = getSupportedPositiveSignalCandidates(category, profile)[0]

  return candidate ? [candidate.text] : []
}

function getPositiveFactorFallback() {
  return 'Your answers give you a starting point for building habits that support this area.'
}

function getInsightRelevanceScore(category, profile = {}) {
  return (
    category.observationCount * 12 +
    getFirstDegreeObservationCount(category) * 5 +
    getCurrentConditionMatches(category, profile).length * 8 +
    getLifestyleSignals(category, profile).length * 4 +
    (getPersonalStrengths(category, profile).length > 0 ? 1 : 0)
  )
}

function getFirstDegreeObservationCount(category) {
  return category.conditions.reduce(
    (total, condition) =>
      total +
      condition.relatives.filter((relative) =>
        firstDegreeRelationships.includes(relative),
      ).length,
    0,
  )
}

function getRankedInsights(insights) {
  return insights
    .filter((insight) => insight.relevanceScore > 0)
    .sort((firstInsight, secondInsight) => {
      const relevanceDifference =
        secondInsight.relevanceScore - firstInsight.relevanceScore

      if (relevanceDifference !== 0) {
        return relevanceDifference
      }

      const patternDifference =
        insightPriority[secondInsight.patternLabel] -
        insightPriority[firstInsight.patternLabel]

      if (patternDifference !== 0) {
        return patternDifference
      }

      const observationDifference =
        secondInsight.observationCount - firstInsight.observationCount

      if (observationDifference !== 0) {
        return observationDifference
      }

      const firstDegreeDifference =
        secondInsight.firstDegreeObservationCount -
        firstInsight.firstDegreeObservationCount

      if (firstDegreeDifference !== 0) {
        return firstDegreeDifference
      }

      return secondInsight.conditionCount - firstInsight.conditionCount
    })
    .slice(0, 4)
}

function assignPositiveFactorsToInsights(insights, profile = {}) {
  const usedSignalIds = new Set()

  return insights.map((insight) => {
    const candidates = getSupportedPositiveSignalCandidates(
      { id: insight.id },
      profile,
    )
    const selectedCandidate =
      candidates.find((candidate) => !usedSignalIds.has(candidate.id)) ||
      candidates[0]

    if (selectedCandidate) {
      usedSignalIds.add(selectedCandidate.id)

      return {
        ...insight,
        positiveFactors: [selectedCandidate.text],
        positiveSignalId: selectedCandidate.id,
      }
    }

    return {
      ...insight,
      positiveFactors: [getPositiveFactorFallback()],
      positiveSignalId: 'fallback',
    }
  })
}

function normalizeInsightCondition(value) {
  return String(value || '')
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\.+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function getInsightContent(category) {
  const categoryConditions = category.conditions.map((condition) =>
    normalizeInsightCondition(condition.conditionName),
  )
  const matchedContent = conditionSpecificContent.find(
    (content) =>
      content.categoryId === category.id &&
      content.keywords.some((keyword) =>
        categoryConditions.some((conditionName) =>
          conditionName.includes(normalizeInsightCondition(keyword)),
        ),
      ),
  )

  return matchedContent || healthAreaContent[category.id] || {
    preventionInsight:
      'Your reported family history may make preventive-health awareness useful in this area. Keeping your profile updated and focusing on practical daily habits can support better conversations about prevention.',
    sourceName: 'Centers for Disease Control and Prevention',
    sourceUrl: 'https://www.cdc.gov/',
    strategies: [
      'Update family history',
      'Stay physically active',
      'Choose balanced meals',
    ],
    title: category.name,
  }
}

function getRelationshipDisplayName(member = {}) {
  const relationshipType = normalizeProfileValue(member.relationshipType)
  const baseLabel =
    relationshipDisplayNames[relationshipType] ||
    String(member.relationship || '').trim() ||
    'Relative'
  const slotIndex = Number(member.slotIndex)

  return Number.isInteger(slotIndex) && slotIndex > 0 && !['mother', 'father', 'self'].includes(relationshipType)
    ? `${baseLabel} ${slotIndex}`
    : baseLabel
}

function getFamilySide({ relationship = '', relationshipLabel = '', relationshipType = '' }) {
  const normalizedRelationship = normalizeProfileValue(relationship)
  const normalizedRelationshipLabel = normalizeProfileValue(relationshipLabel)
  const normalizedRelationshipType = normalizeProfileValue(relationshipType)

  if (
    maternalRelationshipTypes.has(normalizedRelationshipType) ||
    normalizedRelationship === 'mother' ||
    normalizedRelationshipLabel.includes('maternal')
  ) {
    return 'maternal'
  }

  if (
    paternalRelationshipTypes.has(normalizedRelationshipType) ||
    normalizedRelationship === 'father' ||
    normalizedRelationshipLabel.includes('paternal')
  ) {
    return 'paternal'
  }

  return ''
}

function getConditionDiagnosisAge(condition = {}) {
  if (!condition || typeof condition !== 'object') {
    return null
  }

  const age = String(condition.diagnosisAge || '').trim()

  if (!/^\d+$/.test(age)) {
    return null
  }

  const parsedAge = Number(age)

  return parsedAge > 0 && parsedAge <= 120 ? parsedAge : null
}

function getFamilyConditionEntriesForCategory(category, familyMembers = []) {
  if (!Array.isArray(familyMembers)) {
    return []
  }

  return familyMembers.flatMap((member) => {
    const relationshipType = normalizeProfileValue(member.relationshipType)

    if (relationshipType === 'self' || member.isPlaceholder) {
      return []
    }

    const conditionEntries =
      Array.isArray(member.conditions) && member.conditions.length > 0
        ? member.conditions
        : Array.isArray(member.illnesses)
          ? member.illnesses.map((illness) => ({
              name: illness,
            }))
          : []

    return conditionEntries
      .filter((condition) => {
        const conditionName = condition?.name || condition

        return (
          conditionName &&
          !noConditionValues.has(normalizeInsightCondition(conditionName)) &&
          conditionMatchesInsightCategory(conditionName, category)
        )
      })
      .map((condition) => {
        const relationshipLabel = getRelationshipDisplayName(member)

        return {
          conditionName: condition.name || condition,
          diagnosisAge: getConditionDiagnosisAge(condition),
          generation: relationshipGeneration[relationshipType] || null,
          isFirstDegree:
            firstDegreeRelationshipTypes.has(relationshipType) ||
              ['Mother', 'Father', 'Sibling'].includes(member.relationship),
          isSecondDegree: secondDegreeRelationshipTypes.has(relationshipType),
          relationshipLabel,
          relationshipType,
          side: getFamilySide({
            relationship: member.relationship,
            relationshipLabel,
            relationshipType,
          }),
          sourceId: member.id || '',
        }
      })
  })
}

function getFocalConditionTerms(content = {}) {
  const normalizedTitle = normalizeInsightCondition(content.title)

  if (normalizedTitle.includes('breast cancer')) {
    return ['breast cancer']
  }

  if (normalizedTitle.includes('colon cancer') || normalizedTitle.includes('colorectal')) {
    return ['colon cancer', 'colorectal cancer']
  }

  if (normalizedTitle.includes('blood pressure')) {
    return ['high blood pressure', 'hypertension']
  }

  if (normalizedTitle.includes('cholesterol')) {
    return ['high cholesterol', 'cholesterol']
  }

  return []
}

function conditionMatchesTerms(conditionName, terms = []) {
  const normalizedCondition = normalizeInsightCondition(conditionName)

  return terms.some((term) =>
    normalizedCondition.includes(normalizeInsightCondition(term)),
  )
}

function getInterpretationEntries(entries = [], content = {}) {
  const focalTerms = getFocalConditionTerms(content)

  if (focalTerms.length === 0) {
    return entries
  }

  const focalEntries = entries.filter((entry) =>
    conditionMatchesTerms(entry.conditionName, focalTerms),
  )

  return focalEntries.length > 0 ? focalEntries : entries
}

function getConditionGroups(entries = []) {
  const groups = new Map()

  entries.forEach((entry) => {
    const key = normalizeInsightCondition(entry.conditionName)
    const existing = groups.get(key)

    if (existing) {
      existing.entries.push(entry)
      return
    }

    groups.set(key, {
      conditionName: entry.conditionName,
      entries: [entry],
    })
  })

  return Array.from(groups.values()).sort(
    (firstGroup, secondGroup) =>
      secondGroup.entries.length - firstGroup.entries.length ||
      firstGroup.conditionName.localeCompare(secondGroup.conditionName),
  )
}

function getSidePhrase(entries = []) {
  const sides = new Set(entries.map((entry) => entry.side).filter(Boolean))

  if (sides.has('maternal') && sides.has('paternal')) {
    return 'on both sides of your family'
  }

  if (sides.has('maternal')) {
    return 'on your maternal side'
  }

  if (sides.has('paternal')) {
    return 'on your paternal side'
  }

  return 'in your family history'
}

function getCloseRelativePhrase(entries = []) {
  const closeEntries = entries.filter((entry) => entry.isFirstDegree)

  if (closeEntries.length === 0) {
    return ''
  }

  return formatInsightList(
    closeEntries.slice(0, 2).map((entry) => entry.relationshipLabel),
  )
}

function getMultiGenerationGroup(entries = []) {
  return getConditionGroups(entries).find((group) => {
    const generations = new Set(group.entries.map((entry) => entry.generation).filter(Boolean))

    return group.entries.length >= 2 && generations.size >= 2
  })
}

function getBestKnownAgeEntry(entries = []) {
  return entries.find((entry) => Number.isInteger(entry.diagnosisAge))
}

function buildConditionSpecificFamilySentence({ entries, category, content }) {
  if (entries.length === 0) {
    return ''
  }

  const repeatedGroup = getMultiGenerationGroup(entries)
  const sidePhrase = getSidePhrase(entries)
  const closeRelatives = getCloseRelativePhrase(entries)
  const conditionGroups = getConditionGroups(entries)
  const primaryCondition = conditionGroups[0]?.conditionName || category.name.toLowerCase()
  const validAgeEntry = getBestKnownAgeEntry(entries)
  const isConditionSpecific = getFocalConditionTerms(content).length > 0

  if (repeatedGroup) {
    return `${repeatedGroup.conditionName} appears across more than one generation ${getSidePhrase(repeatedGroup.entries)}, making that specific pattern useful context for prevention conversations.`
  }

  if (isConditionSpecific && entries.length >= 2) {
    return `${primaryCondition} appears ${sidePhrase}, so keeping that condition-specific family history accurate may be useful for future screening conversations.`
  }

  if (closeRelatives) {
    return `${primaryCondition} in ${closeRelatives} makes this a close family-history signal rather than just a distant background detail.`
  }

  if (validAgeEntry) {
    return `${primaryCondition} ${sidePhrase} is the main family-history signal here, and the diagnosis age you entered for ${validAgeEntry.relationshipLabel} adds useful context.`
  }

  if (entries.length === 1) {
    return `${primaryCondition} ${sidePhrase} is the main family-history signal for this area.`
  }

  return `Your profile shows related ${category.name.toLowerCase()} details ${sidePhrase}, with ${primaryCondition} as the clearest specific signal.`
}

function conditionMatchesInsightCategory(conditionName, category) {
  const normalizedCondition = normalizeInsightCondition(conditionName)
  const categoryConditionMatch = category.conditions.some((condition) =>
    normalizedCondition.includes(
      normalizeInsightCondition(condition.conditionName),
    ) ||
    normalizeInsightCondition(condition.conditionName).includes(normalizedCondition),
  )

  if (categoryConditionMatch) {
    return true
  }

  return (currentConditionCategoryMap[category.id] || []).some((keyword) =>
    normalizedCondition.includes(normalizeInsightCondition(keyword)),
  )
}

function getCurrentHealthInterpretation(category, content, profile = {}) {
  const matches = getCurrentConditionMatches(category, profile, content).filter(
    (match) => !match.includes('unknown'),
  )

  if (matches.length === 0) {
    return ''
  }

  return `Your own health information also includes ${formatInsightList(matches.slice(0, 2))}, so this theme is not based on family history alone.`
}

function buildProfileSuggestion({ category, content, entries, profile }) {
  const currentHealthText = getCurrentHealthInterpretation(category, content, profile)
  const familySentence = buildConditionSpecificFamilySentence({
    category,
    content,
    entries,
  })
  const lifestyleSignals = getLifestyleSignals(category, profile)
  const lifestyleText =
    lifestyleSignals.length > 0
      ? `Your everyday habits add a practical prevention focus: ${lifestyleSignals[0]}.`
      : ''
  const summary = [familySentence, currentHealthText, lifestyleText]
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')

  return cleanSummary(
    summary ||
      `This area is based on the current-health or everyday-habit information you provided, not a recorded family-history pattern.`,
  )
}

function addPersonalFactor(factors, factor) {
  if (factor && !factors.includes(factor) && factors.length < 3) {
    factors.push(factor)
  }
}

function buildPersonalFactors({ category, content, entries, profile }) {
  const factors = []
  const firstDegreeEntries = entries.filter((entry) => entry.isFirstDegree)
  const knownAgeEntries = entries.filter((entry) => Number.isInteger(entry.diagnosisAge))
  const repeatedGroup = getMultiGenerationGroup(entries)
  const conditionGroups = getConditionGroups(entries)
  const sideCounts = entries.reduce(
    (counts, entry) => ({
      ...counts,
      [entry.side || 'unspecified']: (counts[entry.side || 'unspecified'] || 0) + 1,
    }),
    {},
  )
  const currentMatches = getCurrentConditionMatches(category, profile, content).filter(
    (match) => !match.includes('unknown'),
  )

  if (repeatedGroup) {
    addPersonalFactor(
      factors,
      `${repeatedGroup.conditionName} across generations ${getSidePhrase(repeatedGroup.entries)}.`,
    )
  }

  if (firstDegreeEntries.length > 0) {
    addPersonalFactor(
      factors,
      `Close-relative history: ${formatInsightList(
        firstDegreeEntries.slice(0, 2).map((entry) => entry.relationshipLabel),
      )}.`,
    )
  }

  if (category.id === 'cardiovascular') {
    if (profile.knownHighBloodPressure === 'Yes' || profile.knownHighBloodPressure === 'Unknown') {
      addPersonalFactor(factors, 'Blood-pressure awareness is especially relevant in your profile.')
    }
    if (profile.knownHighCholesterol === 'Yes' || profile.knownHighCholesterol === 'Unknown') {
      addPersonalFactor(factors, 'Cholesterol awareness is one of the more actionable details.')
    }
  }

  if (currentMatches.length > 0) {
    addPersonalFactor(
      factors,
      `Your own current-health answers include ${formatInsightList(currentMatches.slice(0, 2))}.`,
    )
  }

  if (category.id === 'cancer') {
    const breastEntries = entries.filter((entry) =>
      conditionMatchesTerms(entry.conditionName, ['breast cancer']),
    )
    const colonEntries = entries.filter((entry) =>
      conditionMatchesTerms(entry.conditionName, ['colon cancer', 'colorectal cancer']),
    )

    if (breastEntries.length > 0 && getFocalConditionTerms(content).includes('breast cancer')) {
      addPersonalFactor(factors, `Breast-cancer history ${getSidePhrase(breastEntries)}.`)
    } else if (colonEntries.length > 0 && getFocalConditionTerms(content).some((term) => term.includes('colon'))) {
      addPersonalFactor(factors, `Colorectal-cancer history ${getSidePhrase(colonEntries)}.`)
    } else if (conditionGroups.length > 1) {
      addPersonalFactor(
        factors,
        `Different cancer types are recorded, so condition-specific details matter.`,
      )
    }

    if (['Weekly', 'Daily'].includes(profile.alcoholUse)) {
      addPersonalFactor(factors, 'Alcohol use is a modifiable factor connected to this prevention theme.')
    }
    if (hasNutritionOpportunity(profile)) {
      addPersonalFactor(factors, 'Your nutrition answers make produce and fiber intake a relevant focus.')
    }
  }

  if (category.id === 'mental') {
    if (['Less than 6 hours', 'More than 9 hours'].includes(profile.sleep)) {
      addPersonalFactor(factors, 'Your sleep answer is one of the most actionable mental well-being details.')
    }
    if (['High', 'Very high'].includes(profile.stressLevel)) {
      addPersonalFactor(factors, 'Your stress response makes daily recovery support more relevant.')
    }
  }

  if (category.id === 'respiratory' && profile.smokingStatus === 'Current') {
    addPersonalFactor(factors, 'Smoking or vaping is the most actionable respiratory factor in your profile.')
  }

  if (category.id === 'kidney' && conditionGroups.length > 0) {
    addPersonalFactor(
      factors,
      `${conditionGroups[0].conditionName} is the specific kidney-related detail driving this card.`,
    )
  }

  if (category.id === 'metabolic') {
    if (['Most days', 'Daily'].includes(profile.sugaryDrinks)) {
      addPersonalFactor(factors, 'Sugary drinks are one of the more actionable blood-sugar habits.')
    }
    if (hasNutritionOpportunity(profile)) {
      addPersonalFactor(factors, 'Your nutrition answers make balanced, fiber-rich meals especially relevant.')
    }
  }

  if (hasLowExercise(profile) && ['cardiovascular', 'metabolic', 'mental', 'neurological'].includes(category.id)) {
    addPersonalFactor(factors, 'Physical activity is a practical lever in your current habits.')
  }

  if (sideCounts.maternal >= 2 || sideCounts.paternal >= 2) {
    addPersonalFactor(
      factors,
      `${sideCounts.maternal >= 2 ? 'Maternal' : 'Paternal'}-side clustering is the main family-history signal.`,
    )
  }

  if (entries.length >= 2 && factors.length < 2) {
    addPersonalFactor(
      factors,
      `More than one blood relative contributes to this prevention theme.`,
    )
  }

  if (knownAgeEntries.length > 0) {
    addPersonalFactor(
      factors,
      `Recorded diagnosis age for ${knownAgeEntries[0].relationshipLabel}.`,
    )
  }

  return factors.slice(0, 3)
}

function buildNextBestStep({ category, profile }) {
  const hasBreastCancer = hasCategoryCondition(category, ['breast cancer'])
  const hasColonCancer = hasCategoryCondition(category, ['colon cancer', 'colorectal cancer'])

  if (category.id === 'cardiovascular') {
    if (profile.knownHighBloodPressure === 'Yes' || hasCategoryCondition(category, ['high blood pressure', 'hypertension'])) {
      return 'Use Your Prevention Plan to find a blood-pressure check or track your latest reading.'
    }

    if (profile.knownHighCholesterol === 'Yes' || hasCategoryCondition(category, ['high cholesterol', 'cholesterol'])) {
      return 'Use Your Prevention Plan to review cholesterol resources or prepare a question for routine care.'
    }

    return 'Bring this heart-health family pattern to a future routine healthcare visit.'
  }

  if (category.id === 'cancer') {
    if (hasBreastCancer && isBreastScreeningEligible(profile)) {
      return 'Use Your Prevention Plan to review breast-screening resources connected to your profile.'
    }

    if (hasColonCancer && isColorectalScreeningEligible(profile)) {
      return 'Use Your Prevention Plan to review colorectal-screening resources connected to your profile.'
    }

    return 'Keep the condition details in your family history current for future healthcare conversations.'
  }

  if (category.id === 'respiratory') {
    return profile.smokingStatus === 'Current'
      ? 'Use Your Prevention Plan to find tobacco or vaping cessation support.'
      : 'Use Your Prevention Plan to check air quality before outdoor activity.'
  }

  if (category.id === 'mental') {
    return 'Choose one brief recovery habit in Your Prevention Plan for today.'
  }

  if (category.id === 'metabolic') {
    return 'Use Your Prevention Plan to choose one blood-sugar-supportive nutrition step today.'
  }

  if (category.id === 'neurological') {
    return 'Prepare one question about this family pattern for a future routine-care conversation.'
  }

  if (category.id === 'kidney') {
    return 'Use Your Prevention Plan to focus on blood-pressure awareness as the next practical step.'
  }

  return 'Review this pattern in Your Prevention Plan and choose one practical next step.'
}

function buildInsightInterpretation({ category, content, familyMembers, profile }) {
  const familyPatternEntries = getFamilyConditionEntriesForCategory(
    category,
    familyMembers,
  )
  const interpretationEntries = getInterpretationEntries(
    familyPatternEntries,
    content,
  )

  return {
    familyPattern: null,
    nextBestStep: buildNextBestStep({
      category,
      profile,
    }),
    personalizedFactors: buildPersonalFactors({
      category,
      content,
      entries: interpretationEntries,
      profile,
    }),
    profileSuggestion: buildProfileSuggestion({
      category,
      content,
      entries: interpretationEntries,
      profile,
    }),
  }
}

function getCurrentHealthLead(category, content, profile) {
  const currentMatches = getCurrentConditionMatches(category, profile, content)

  if (currentMatches.length === 0) {
    return ''
  }

  return `Your current health information also includes ${formatInsightList(currentMatches.slice(0, 2))}.`
}

function getLifestyleLead(category, profile) {
  const lifestyleSignals = getLifestyleSignals(category, profile)

  if (lifestyleSignals.length === 0) {
    return ''
  }

  return `Your current habits add context: ${formatInsightList(lifestyleSignals.slice(0, 2))}.`
}

function getAreaSupportPhrase(category) {
  const supportById = {
    cancer: 'cancer prevention awareness',
    cardiovascular: 'long-term heart health',
    kidney: 'kidney-health awareness',
    mental: 'overall emotional well-being',
    metabolic: 'blood-sugar and metabolic health',
    neurological: 'brain and stroke prevention',
    respiratory: 'long-term respiratory health',
  }

  return supportById[category.id] || category.name.toLowerCase()
}

function buildPersonalizedInsightSummary({ category, content, familyMembers, profile }) {
  const familyEntries = getInterpretationEntries(
    getFamilyConditionEntriesForCategory(category, familyMembers),
    content,
  )
  const sentences = [
    familyEntries.length > 0 ? buildConditionSpecificFamilySentence({
      category,
      content,
      entries: familyEntries,
    }) : '',
    getCurrentHealthLead(category, content, profile),
    getLifestyleLead(category, profile),
  ].filter(Boolean)

  const finalSentence = `Based on your profile, focusing on ${getAreaSupportPhrase(category)} can help make your prevention plan more specific.`

  return cleanSummary([...sentences, finalSentence].slice(0, 4).join(' '))
}

function addNextStep(steps, step) {
  if (step && !steps.includes(step) && steps.length < 3) {
    steps.push(step)
  }
}

function addPreventionHabit(habits, habit) {
  if (habit && !habits.includes(habit) && habits.length < 3) {
    habits.push(habit)
  }
}

function hasCategoryCondition(category, terms) {
  return category.conditions.some((condition) => {
    const normalizedCondition = normalizeInsightCondition(condition.conditionName)

    return terms.some((term) =>
      normalizedCondition.includes(normalizeInsightCondition(term)),
    )
  })
}

function hasHelpfulExercise(profile = {}) {
  return ['3-5 days/week', 'Nearly every day'].includes(profile.exercise)
}

function hasLowExercise(profile = {}) {
  return ['Rarely', '1-2 days/week'].includes(profile.exercise)
}

function hasHelpfulNutrition(profile = {}) {
  return (
    ['Good', 'Excellent'].includes(profile.dietQuality) ||
    ['3-4 servings', '5 or more servings'].includes(profile.fruitVegIntake)
  )
}

function hasNutritionOpportunity(profile = {}) {
  return (
    ['Poor', 'Fair'].includes(profile.dietQuality) ||
    ['0-1 servings', '2 servings'].includes(profile.fruitVegIntake)
  )
}

function buildCancerPreventionHabits({ category, content, profile }) {
  const habits = []
  const isBreastCancer = content.title === 'Breast Cancer Prevention'
  const isColonCancer = content.title === 'Colon Cancer Prevention'
  const hasSupportedScreeningContext =
    (isBreastCancer && isBreastScreeningEligible(profile)) ||
    (isColonCancer && isColorectalScreeningEligible(profile))

  if (hasLowExercise(profile) || hasHelpfulExercise(profile)) {
    addPreventionHabit(habits, 'Stay physically active')
  }

  if (isColonCancer || hasNutritionOpportunity(profile)) {
    addPreventionHabit(habits, 'Eat more fruits, vegetables, and fiber')
  }

  if (isBreastCancer && ['Weekly', 'Daily'].includes(profile.alcoholUse)) {
    addPreventionHabit(habits, 'Limit alcohol when possible')
  }

  if (profile.smokingStatus === 'Current') {
    addPreventionHabit(habits, 'Limit smoke and vaping exposure')
  }

  if (hasSupportedScreeningContext) {
    addPreventionHabit(habits, 'Keep up with age-appropriate screening conversations')
  }

  if (isColonCancer && isColorectalScreeningEligible(profile)) {
    addPreventionHabit(habits, 'Ask when colorectal screening is appropriate')
  }

  if (hasCategoryCondition(category, ['colon cancer', 'colorectal cancer'])) {
    addPreventionHabit(habits, 'Choose fiber-rich foods more often')
  }

  if (hasHelpfulNutrition(profile)) {
    addPreventionHabit(habits, 'Continue produce-rich meals')
  }

  addPreventionHabit(habits, 'Stay physically active')
  addPreventionHabit(habits, 'Eat more fruits, vegetables, and fiber')

  return habits.slice(0, 3)
}

function buildHeartPreventionHabits({ category, profile }) {
  const habits = []
  const hasBloodPressureFocus =
    profile.knownHighBloodPressure === 'Yes' ||
    profile.knownHighBloodPressure === 'Unknown' ||
    hasCategoryCondition(category, ['high blood pressure', 'hypertension'])
  const hasCholesterolFocus =
    profile.knownHighCholesterol === 'Yes' ||
    profile.knownHighCholesterol === 'Unknown' ||
    hasCategoryCondition(category, ['high cholesterol', 'cholesterol'])

  if (hasLowExercise(profile) || hasHelpfulExercise(profile)) {
    addPreventionHabit(habits, 'Stay physically active')
  }

  if (hasBloodPressureFocus && hasCholesterolFocus) {
    addPreventionHabit(habits, 'Pay attention to blood pressure and cholesterol')
  } else if (hasBloodPressureFocus) {
    addPreventionHabit(habits, 'Pay attention to blood pressure')
  } else if (hasCholesterolFocus) {
    addPreventionHabit(habits, 'Know your cholesterol numbers')
  }

  if (hasNutritionOpportunity(profile)) {
    addPreventionHabit(habits, 'Choose heart-healthy foods more often')
  }

  if (profile.smokingStatus === 'Current') {
    addPreventionHabit(habits, 'Limit smoke and vaping exposure')
  }

  addPreventionHabit(habits, 'Stay physically active')
  addPreventionHabit(habits, 'Pay attention to blood pressure and cholesterol')
  addPreventionHabit(habits, 'Choose heart-healthy foods more often')

  return habits.slice(0, 3)
}

function buildMentalPreventionHabits({ profile }) {
  const habits = []

  if (profile.sleep === '7-9 hours') {
    addPreventionHabit(habits, 'Keep your sleep routine consistent')
  } else {
    addPreventionHabit(habits, 'Keep a consistent sleep routine')
  }

  if (['High', 'Very high'].includes(profile.stressLevel)) {
    addPreventionHabit(habits, 'Make time for stress management')
  }

  if (hasLowExercise(profile) || hasHelpfulExercise(profile)) {
    addPreventionHabit(habits, 'Use regular movement to support mood')
  }

  addPreventionHabit(habits, 'Stay socially connected')
  addPreventionHabit(habits, 'Make time for stress management')
  addPreventionHabit(habits, 'Keep a consistent sleep routine')

  return habits.slice(0, 3)
}

function buildRespiratoryPreventionHabits({ profile }) {
  const habits = []

  addPreventionHabit(habits, 'Check air quality before outdoor activity')

  if (profile.smokingStatus === 'Current') {
    addPreventionHabit(habits, 'Reduce tobacco or vaping exposure')
  } else {
    addPreventionHabit(habits, 'Limit smoke and vaping exposure')
  }

  addPreventionHabit(habits, 'Pay attention to persistent breathing symptoms')

  return habits.slice(0, 3)
}

function buildMetabolicPreventionHabits({ profile }) {
  const habits = []

  if (hasLowExercise(profile) || hasHelpfulExercise(profile)) {
    addPreventionHabit(habits, 'Stay physically active')
  }

  if (['Most days', 'Daily'].includes(profile.sugaryDrinks)) {
    addPreventionHabit(habits, 'Replace sugary drinks with water more often')
  }

  if (hasNutritionOpportunity(profile) || hasHelpfulNutrition(profile)) {
    addPreventionHabit(habits, 'Choose balanced meals with more fiber')
  }

  addPreventionHabit(habits, 'Pay attention to routine blood sugar screening when appropriate')
  addPreventionHabit(habits, 'Stay physically active')
  addPreventionHabit(habits, 'Choose balanced meals with more fiber')

  return habits.slice(0, 3)
}

function buildKeyPreventionHabits({ category, content, profile }) {
  if (category.id === 'cancer') {
    return buildCancerPreventionHabits({ category, content, profile })
  }

  if (category.id === 'cardiovascular') {
    return buildHeartPreventionHabits({ category, profile })
  }

  if (category.id === 'mental') {
    return buildMentalPreventionHabits({ profile })
  }

  if (category.id === 'respiratory') {
    return buildRespiratoryPreventionHabits({ profile })
  }

  if (category.id === 'metabolic') {
    return buildMetabolicPreventionHabits({ profile })
  }

  if (category.id === 'kidney') {
    return [
      'Pay attention to blood pressure',
      'Support healthy blood sugar',
      'Keep hydration steady',
    ]
  }

  if (category.id === 'neurological') {
    return [
      'Stay physically active',
      'Keep sleep routines consistent',
      'Pay attention to blood pressure',
    ]
  }

  return [
    'Stay physically active',
    'Choose balanced meals',
    'Keep up with routine preventive care',
  ]
}

function buildSuggestedNextSteps({ category, content, profile }) {
  const steps = []
  const currentMatches = getCurrentConditionMatches(category, profile)
  const lifestyleSignals = getLifestyleSignals(category, profile).join(' ')

  if (category.observationCount > 0) {
    addNextStep(steps, 'Discuss your family history during your next routine healthcare visit.')
  }

  if (category.id === 'cardiovascular') {
    if (
      currentMatches.some((match) => match.includes('blood pressure')) ||
      lifestyleSignals.includes('activity') ||
      lifestyleSignals.includes('screening')
    ) {
      addNextStep(steps, 'Learn your blood pressure numbers.')
    }

    if (
      currentMatches.some((match) => match.includes('cholesterol')) ||
      category.conditions.some((condition) =>
        normalizeInsightCondition(condition.conditionName).includes('cholesterol'),
      )
    ) {
      addNextStep(steps, 'Learn your cholesterol numbers.')
    }

    addNextStep(steps, 'Keep regular physical activity in your weekly routine.')
  }

  if (category.id === 'metabolic') {
    addNextStep(steps, 'Choose one fiber-rich meal or snack today.')
    addNextStep(steps, 'Ask about blood-sugar screening during routine care.')
    if (['Most days', 'Daily'].includes(profile.sugaryDrinks)) {
      addNextStep(steps, 'Replace one sugary drink with water today.')
    }
  }

  if (category.id === 'cancer') {
    addNextStep(steps, 'Keep family-history details current.')
    if (
      (content.title === 'Breast Cancer Prevention' &&
        isBreastScreeningEligible(profile)) ||
      (content.title === 'Colon Cancer Prevention' &&
        isColorectalScreeningEligible(profile))
    ) {
      addNextStep(steps, 'Review which screenings fit your age and family history.')
    }
    if (['Weekly', 'Daily'].includes(profile.alcoholUse)) {
      addNextStep(steps, 'Consider one alcohol-free day this week.')
    }
  }

  if (category.id === 'mental') {
    addNextStep(steps, 'Choose a 10-minute recovery habit for today.')
    addNextStep(steps, 'Protect a consistent sleep and wake time tonight.')
    addNextStep(steps, 'Plan one supportive social connection this week.')
  }

  if (category.id === 'respiratory') {
    addNextStep(steps, 'Avoid smoke or vape exposure today.')
    addNextStep(steps, 'Check outdoor air quality before exercising outside.')
    addNextStep(steps, 'Track recurring breathing symptoms if they appear.')
  }

  if (category.id === 'kidney') {
    addNextStep(steps, 'Learn your blood pressure numbers.')
    addNextStep(steps, 'Keep hydration steady today.')
    addNextStep(steps, 'Ask about kidney-health screening during routine care.')
  }

  if (category.id === 'neurological') {
    addNextStep(steps, 'Keep movement and sleep routines consistent this week.')
    addNextStep(steps, 'Learn your blood pressure numbers.')
    addNextStep(steps, 'Choose one mentally engaging activity today.')
  }

  content.strategies.forEach((strategy) => addNextStep(steps, strategy))

  return steps.slice(0, 3)
}

function getInsightTitle(content) {
  const titleByContentTitle = {
    'Blood Pressure Awareness': 'Heart Health',
    'Cardiovascular Health': 'Heart Health',
    'Cholesterol Awareness': 'Heart Health',
    'Cancer Prevention': 'Cancer Prevention Awareness',
  }

  return titleByContentTitle[content.title] || content.title
}

export function buildPreventionInsights({
  familyHealthSummary,
  familyMembers = [],
  profile = {},
}) {
  const eligibleFamilyMembers = filterFamilyMembersByEligibility(
    familyMembers,
    profile,
  )
  const insights = familyHealthSummary.categories.map((sourceCategory) => {
    const category = filterHealthCategoryByEligibility(sourceCategory, profile)
    const patternLabel =
      category.observationCount === 0
        ? 'Limited Family Information'
        : getPatternLabel(category.riskLevel, category.observationCount)
    const content = getInsightContent(category)
    const relevanceScore = getInsightRelevanceScore(category, profile)
    const interpretation = buildInsightInterpretation({
      category,
      content,
      familyMembers: eligibleFamilyMembers,
      profile,
    })
    const suggestedNextSteps = buildSuggestedNextSteps({
      category,
      content,
      profile,
    })

    return {
      evidenceExplanation: getPersonalizedEvidenceExplanation(category, patternLabel),
      firstDegreeObservationCount: getFirstDegreeObservationCount(category),
      healthArea: getInsightTitle(content),
      id: category.id,
      conditionCount: category.conditions.length,
      observationCount: category.observationCount,
      patternLabel,
      preventionInsight: buildPersonalizedInsightSummary({
        category,
        content,
        familyMembers: eligibleFamilyMembers,
        profile,
      }),
      keyPreventionHabits: buildKeyPreventionHabits({
        category,
        content,
        profile,
      }),
      familyPattern: interpretation.familyPattern,
      nextBestStep: interpretation.nextBestStep,
      personalizedFactors: interpretation.personalizedFactors,
      positiveFactors: [],
      profileSuggestion: interpretation.profileSuggestion,
      relevanceScore,
      sourceName: content.sourceName,
      sourceUrl: content.sourceUrl,
      strategies: suggestedNextSteps,
      tone: getPatternTone(patternLabel),
    }
  })

  return assignPositiveFactorsToInsights(getRankedInsights(insights), profile)
}

export function buildPersonalizedPreventionSummary({
  familyHealthSummary,
  familyMembers = [],
  preventionPlan,
  preventionScore,
  profile = {},
}) {
  const preventionSignals = preventionPlan || preventionScore || {}
  const rankedPatterns = (familyHealthSummary.topAreas || []).filter(
    (category) => getFamilyConditionEntriesForCategory(category, familyMembers).length > 0,
  )
  const sentences = [
    buildPatternSentence(rankedPatterns),
    buildPositiveHabitSentence({
      familyHealthSummary,
      preventionScore: preventionSignals,
      profile,
    }),
    buildFocusSentence({
      preventionScore: preventionSignals,
      profile,
      strongestPattern: rankedPatterns[0],
    }),
  ].filter(Boolean)

  return cleanSummary(sentences.slice(0, 3).join(' '))
}

function cleanSummary(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([.!?]){2,}/g, '$1')
    .replace(/\b(\w+)\s+\1\b/gi, '$1')
    .trim()
}

function finishSentence(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[.!?]+$/g, '')

  return cleaned ? `${cleaned}.` : ''
}

function formatList(items) {
  const uniqueItems = [...new Set(items.filter(Boolean))]

  if (uniqueItems.length === 0) {
    return ''
  }

  if (uniqueItems.length === 1) {
    return uniqueItems[0]
  }

  if (uniqueItems.length === 2) {
    return `${uniqueItems[0]} and ${uniqueItems[1]}`
  }

  return `${uniqueItems.slice(0, -1).join(', ')}, and ${uniqueItems.at(-1)}`
}

function getFriendlyAreaName(category = {}) {
  const title = String(category.name || category.healthArea || '').trim()
  const nameById = {
    cancer: 'cancer history',
    cardiovascular: 'cardiovascular health',
    kidney: 'kidney health',
    mental: 'mental well-being',
    metabolic: 'diabetes',
    neurological: 'brain and stroke prevention',
    respiratory: 'respiratory health',
  }

  return nameById[category.id] || title.toLowerCase() || 'preventive health'
}

function buildPatternSentence(rankedPatterns) {
  if (rankedPatterns.length === 0) {
    return 'Your family history is still light on mapped condition details, so the clearest next step is building a more complete health record.'
  }

  const topNames = rankedPatterns.slice(0, 2).map(getFriendlyAreaName)

  if (topNames.length === 1) {
    return finishSentence(
      `Your family history suggests the strongest pattern relates to ${topNames[0]}`,
    )
  }

  return finishSentence(
    `Your profile shows stronger family patterns for ${formatList(topNames)} than for other areas`,
  )
}

function getPositiveHabitLabels({ familyHealthSummary, preventionScore, profile }) {
  const labels = []

  if (profile.smokingStatus === 'Never') {
    labels.push('not smoking')
  }

  if (profile.exercise === '3-5 days/week' || profile.exercise === 'Nearly every day') {
    labels.push('regular physical activity')
  }

  if (
    profile.dietQuality === 'Good' ||
    profile.dietQuality === 'Excellent' ||
    profile.fruitVegIntake === '3-4 servings' ||
    profile.fruitVegIntake === '5 or more servings'
  ) {
    labels.push('balanced nutrition habits')
  }

  if (profile.sleep === '7-9 hours') {
    labels.push('supportive sleep habits')
  }

  if (profile.preventiveScreenings === 'Up to date') {
    labels.push('staying current with preventive screenings')
  }

  if (
    familyHealthSummary?.categories?.length > 0 &&
    !familyHealthSummary.categories.some((category) => category.observationCount > 0) &&
    !familyHealthSummary.categories.some((category) => category.riskLevel === 'High')
  ) {
    labels.push('no strong family-health pattern standing out yet')
  }

  if (labels.length > 0) {
    return labels
  }

  return (preventionScore.positives || [])
    .map((positive) =>
      String(positive)
        .replace(/[.!?]+$/g, '')
        .replace(/^your\s+/i, '')
        .replace(/^you reported\s+/i, '')
        .replace(/^no smoking or vaping reported$/i, 'not smoking'),
    )
    .filter(Boolean)
    .slice(0, 2)
}

function buildPositiveHabitSentence({ familyHealthSummary, preventionScore, profile }) {
  const positives = getPositiveHabitLabels({
    familyHealthSummary,
    preventionScore,
    profile,
  }).slice(0, 2)

  if (positives.length === 0) {
    return ''
  }

  return finishSentence(
    `Your responses also point to helpful strengths, including ${formatList(positives)}`,
  )
}

const priorityFocusById = {
  cancer: 'keeping family history current and reviewing age-appropriate screening timelines',
  cardiovascular:
    'regular movement, heart-healthy nutrition, and blood pressure or cholesterol awareness',
  hydration: 'steady hydration and simple daily routines',
  kidney: 'blood pressure awareness, hydration, and routine preventive care',
  mental: 'consistent sleep, stress management, and supportive relationships',
  metabolic: 'balanced meals, healthy weight habits, and limiting sugary drinks',
  movement: 'short, repeatable activity goals',
  neurological: 'regular movement, quality sleep, and blood pressure awareness',
  nutrition: 'adding more fiber-rich foods, produce, and balanced meals',
  respiratory: 'avoiding smoke exposure and staying aware of recurring breathing symptoms',
  screenings: 'routine preventive visits and screening conversations',
  sleep: 'a steadier sleep routine',
  'screen-time': 'regular screen breaks and more movement during the day',
  stress: 'stress management and restorative routines',
  'sugary-drinks': 'reducing sugary drinks and choosing balanced meals',
  tobacco: 'reducing tobacco or vaping exposure with support',
}

function getPriorityFocus(priority = {}) {
  return (
    priorityFocusById[priority.id] ||
    priorityFocusById[String(priority.title || '').toLowerCase()] ||
    ''
  )
}

function getPatternFocus(pattern) {
  if (!pattern) {
    return 'keeping your family history up to date and maintaining practical daily health habits'
  }

  return (
    priorityFocusById[pattern.id] ||
    `${getFriendlyAreaName(pattern)} awareness and routine preventive care`
  )
}

function buildFocusSentence({ preventionScore, profile, strongestPattern }) {
  const focusAreas = (preventionScore.topPriorities || [])
    .map(getPriorityFocus)
    .filter(Boolean)
    .slice(0, 2)

  if (profile.knownHighBloodPressure === 'Not sure') {
    focusAreas.push('knowing your blood pressure numbers')
  }

  if (profile.knownHighCholesterol === 'Not sure') {
    focusAreas.push('knowing your cholesterol numbers')
  }

  if (
    profile.preventiveScreenings === 'Not sure' &&
    !focusAreas.some((focusArea) => focusArea.includes('screening'))
  ) {
    focusAreas.push('reviewing which screenings fit your age and family history')
  }

  const selectedFocusAreas =
    focusAreas.length > 0 ? [...new Set(focusAreas)].slice(0, 2) : [getPatternFocus(strongestPattern)]

  return finishSentence(
    `Focusing on ${formatList(selectedFocusAreas)} can strengthen your prevention plan`,
  )
}
