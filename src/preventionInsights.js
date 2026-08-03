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
}) {
  const strongestPattern = familyHealthSummary.topAreas.find(
    (category) => category.observationCount > 0,
  )
  const positiveSignal =
    preventionScore.positives[0] ||
    'you are building a clearer family-health record'
  const learningArea =
    preventionScore.topPriorities[0]?.title ||
    strongestPattern?.name ||
    'routine preventive care'

  if (!strongestPattern) {
    return `Your family profile has limited health-history information so far. A positive step is that ${positiveSignal.toLowerCase()}. You may benefit from learning more about ${learningArea.toLowerCase()} and continuing to update your profile as you learn more. These insights are educational and are not a diagnosis.`
  }

  return `Your family profile shows the clearest pattern around ${strongestPattern.name.toLowerCase()}. A positive preventive signal is that ${positiveSignal.toLowerCase()}. You may benefit from learning more about ${learningArea.toLowerCase()} and sharing relevant family history during a future healthcare visit. These insights are educational and are not a diagnosis.`
}
