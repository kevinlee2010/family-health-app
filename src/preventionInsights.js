const patternLabelByLevel = {
  Average: 'No Strong Pattern Identified',
  High: 'Strong Family Pattern',
  Increased: 'Notable Family Pattern',
}

const patternToneByLabel = {
  'Limited Family Information': 'limited',
  'No Strong Pattern Identified': 'clear',
  'Notable Family Pattern': 'notable',
  'Strong Family Pattern': 'strong',
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
    return 'Limited Family Information'
  }

  return patternLabelByLevel[riskLevel] || 'Limited Family Information'
}

export function getPatternTone(patternLabel) {
  return patternToneByLabel[patternLabel] || 'limited'
}

export function getPatternExplanation(patternLabel) {
  if (patternLabel === 'Strong Family Pattern') {
    return 'Multiple close relatives report the same or related condition.'
  }

  if (patternLabel === 'Notable Family Pattern') {
    return 'One close relative or several more distant relatives report this health area.'
  }

  if (patternLabel === 'No Strong Pattern Identified') {
    return 'No meaningful pattern appears in the current family profile.'
  }

  return 'Too little family-history information is available for a confident educational insight.'
}

const insightPriority = {
  'Strong Family Pattern': 4,
  'Notable Family Pattern': 3,
  'No Strong Pattern Identified': 2,
  'Limited Family Information': 1,
}

const firstDegreeRelationships = ['Mother', 'Father', 'Sibling']

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
    .filter((insight) => insight.observationCount > 0)
    .sort((firstInsight, secondInsight) => {
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
    .slice(0, 3)
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

export function buildPreventionInsights({ familyHealthSummary }) {
  const insights = familyHealthSummary.categories.map((category) => {
    const patternLabel =
      category.observationCount === 0
        ? 'Limited Family Information'
        : getPatternLabel(category.riskLevel, category.observationCount)
    const content = getInsightContent(category)

    return {
      evidenceExplanation: getPatternExplanation(patternLabel),
      firstDegreeObservationCount: getFirstDegreeObservationCount(category),
      healthArea: content.title,
      id: category.id,
      conditionCount: category.conditions.length,
      observationCount: category.observationCount,
      patternLabel,
      preventionInsight: content.preventionInsight,
      sourceName: content.sourceName,
      sourceUrl: content.sourceUrl,
      strategies: content.strategies,
      tone: getPatternTone(patternLabel),
    }
  })

  return getRankedInsights(insights)
}

export function buildPersonalizedPreventionSummary({
  familyHealthSummary,
  preventionScore,
  profile = {},
}) {
  const rankedPatterns = (familyHealthSummary.topAreas || []).filter(
    (category) => category.observationCount > 0,
  )
  const sentences = [
    buildPatternSentence(rankedPatterns),
    buildPositiveHabitSentence({ familyHealthSummary, preventionScore, profile }),
    buildFocusSentence({
      preventionScore,
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
