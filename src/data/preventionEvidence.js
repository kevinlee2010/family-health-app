export const preventionEvidenceRecords = [
  {
    category: 'physicalActivity',
    id: 'cdc-physical-activity',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'Adult Activity: An Overview',
    sourceUrl: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
    summary:
      'Regular physical activity supports physical and mental health, and adults can spread activity across the week in manageable amounts.',
  },
  {
    category: 'bloodPressure',
    id: 'cdc-blood-pressure',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'Measuring Your Blood Pressure',
    sourceUrl: 'https://www.cdc.gov/high-blood-pressure/measure/index.html',
    summary:
      'Measuring blood pressure is the only way to know whether it is high because high blood pressure often has no warning signs.',
  },
  {
    category: 'cholesterol',
    id: 'cdc-cholesterol-testing',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'Testing for Cholesterol',
    sourceUrl: 'https://www.cdc.gov/cholesterol/testing/index.html',
    summary:
      'A cholesterol test is the way to know your cholesterol levels, and family history can affect how often this is worth discussing with a health care professional.',
  },
  {
    category: 'nutrition',
    id: 'cdc-nutrition',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'Healthy Eating Tips',
    sourceUrl: 'https://www.cdc.gov/nutrition/features/healthy-eating-tips.html',
    summary:
      'Healthy eating patterns emphasize nutrient-dense foods such as vegetables, fruits, whole grains, proteins, and beverages with less added sugar.',
  },
  {
    category: 'sleep',
    id: 'cdc-sleep',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'About Sleep',
    sourceUrl: 'https://www.cdc.gov/sleep/about/index.html',
    summary:
      'Consistent sleep habits can support mood, stress, heart health, metabolism, attention, and daily functioning.',
  },
  {
    category: 'smokingCessation',
    id: 'cdc-smoking-cessation',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'How to Quit Smoking',
    sourceUrl: 'https://www.cdc.gov/tobacco/about/how-to-quit.html',
    summary:
      'Quitting tobacco is a meaningful health step, and counseling, quitlines, medications, and support tools can help when someone is ready.',
  },
  {
    category: 'breastScreening',
    id: 'uspstf-breast-screening',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'USPSTF',
    sourceTitle: 'Breast Cancer: Screening',
    sourceUrl:
      'https://www.uspreventiveservicestaskforce.org/uspstf/document/RecommendationStatementFinal/breast-cancer-screening',
    summary:
      'Breast screening guidance depends on age and personal context; family history is one factor worth discussing with a health care professional.',
  },
  {
    category: 'colorectalScreening',
    id: 'cdc-colorectal-screening',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'Screening for Colorectal Cancer',
    sourceUrl: 'https://www.cdc.gov/colorectal-cancer/screening/index.html',
    summary:
      'Colorectal screening can find precancerous polyps or cancer early, and family history can affect screening conversations.',
  },
  {
    category: 'airQuality',
    id: 'airnow-aqi',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'AirNow',
    sourceTitle: 'Air Quality Index',
    sourceUrl: 'https://www.airnow.gov/aqi/',
    summary:
      'The Air Quality Index helps people understand current outdoor air conditions before planning outdoor activity.',
  },
  {
    category: 'familyHistory',
    id: 'cdc-family-health-history',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'About Family Health History',
    sourceUrl: 'https://www.cdc.gov/family-health-history/about/index.html',
    summary:
      'Family health history can help create a more complete picture of health patterns and future prevention conversations.',
  },
  {
    category: 'alcohol',
    id: 'cdc-alcohol',
    lastReviewed: '2026-08-27',
    sourceOrganization: 'CDC',
    sourceTitle: 'About Moderate Alcohol Use',
    sourceUrl: 'https://www.cdc.gov/alcohol/about-alcohol-use/moderate-alcohol-use.html',
    summary:
      'Drinking less or not drinking can lower alcohol-related health risks compared with drinking more.',
  },
]

const evidenceById = new Map(
  preventionEvidenceRecords.map((record) => [record.id, record]),
)

function normalizeEvidenceText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getPreventionEvidenceById(evidenceId) {
  return evidenceById.get(evidenceId) || null
}

export function getEvidenceIdForAction(action = {}) {
  if (action.evidenceId && evidenceById.has(action.evidenceId)) {
    return action.evidenceId
  }

  const actionText = normalizeEvidenceText(
    [
      action.label,
      action.category,
      action.goalCategory,
      action.goalType,
      action.resourceIntent,
      action.resourceType,
    ].join(' '),
  )

  if (actionText.includes('air quality') || actionText.includes('air-quality')) {
    return 'airnow-aqi'
  }

  if (actionText.includes('blood pressure')) {
    return 'cdc-blood-pressure'
  }

  if (actionText.includes('cholesterol')) {
    return 'cdc-cholesterol-testing'
  }

  if (actionText.includes('breast') || actionText.includes('mammograph')) {
    return 'uspstf-breast-screening'
  }

  if (actionText.includes('colorectal') || actionText.includes('colon')) {
    return 'cdc-colorectal-screening'
  }

  if (
    actionText.includes('walk') ||
    actionText.includes('activity') ||
    actionText.includes('movement')
  ) {
    return 'cdc-physical-activity'
  }

  if (
    actionText.includes('fruit') ||
    actionText.includes('vegetable') ||
    actionText.includes('nutrition') ||
    actionText.includes('sugary drink') ||
    actionText.includes('sodium')
  ) {
    return 'cdc-nutrition'
  }

  if (actionText.includes('sleep') || actionText.includes('bedtime')) {
    return 'cdc-sleep'
  }

  if (
    actionText.includes('smoking') ||
    actionText.includes('vaping') ||
    actionText.includes('quit')
  ) {
    return 'cdc-smoking-cessation'
  }

  if (actionText.includes('family history') || actionText.includes('family tree')) {
    return 'cdc-family-health-history'
  }

  if (actionText.includes('alcohol')) {
    return 'cdc-alcohol'
  }

  return ''
}

export function getPreventionEvidenceForAction(action = {}) {
  return getPreventionEvidenceById(getEvidenceIdForAction(action))
}

export function getPersonalizationReasonForAction(action = {}) {
  const reasons = Array.isArray(action.personalizationReasons)
    ? action.personalizationReasons.filter(Boolean)
    : []

  if (reasons.length > 0) {
    return reasons[0]
  }

  if (action.reason) {
    return action.reason
  }

  if (action.category) {
    return `${action.category} is relevant to the prevention priorities identified in your Health Profile.`
  }

  return 'This action is connected to information saved in your Health Profile.'
}

export function buildRecommendationEvidence(action = {}) {
  const evidence = getPreventionEvidenceForAction(action)

  if (!evidence) {
    return null
  }

  return {
    evidence,
    whyInPlan: getPersonalizationReasonForAction(action),
    whyThisMatters: evidence.summary,
  }
}
