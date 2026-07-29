import {
  defaultRadiusMiles,
  getDistanceInMiles,
  getEventDateTimestamp,
  getEventLocation,
  getLocationForZip,
  getZipFromAddress,
  isValidCoordinatePair,
} from './eventLocationRanking.js'
import { getCityForZip, normalizeZip } from './zipCodeMap.js'

const noConditionValues = new Set([
  'none',
  'none of the conditions listed',
  'no known conditions',
  'no known conditions.',
])

const relationshipWeights = {
  Father: 4,
  Mother: 4,
  Sibling: 4,
  Grandparent: 2,
}

const riskLevelWeights = {
  Average: 0,
  High: 60,
  Increased: 35,
}

const healthPriorityDefinitions = [
  {
    id: 'cardiovascular',
    label: 'Cardiovascular health',
    matchLabel: 'Recommended for cardiovascular prevention',
    includes: 'Includes heart disease, high blood pressure, high cholesterol, and stroke prevention.',
    familyKeywords: [
      'heart disease',
      'heart attack',
      'high blood pressure',
      'hypertension',
      'high cholesterol',
      'cholesterol',
      'stroke',
    ],
    eventKeywords: [
      'blood pressure',
      'hypertension',
      'heart health',
      'cardiovascular',
      'cholesterol',
      'stroke prevention',
      'CPR',
      'walking group',
      'fitness',
      'exercise',
      'heart screening',
    ],
    preventionActions: [
      'Check blood pressure regularly',
      'Stay physically active',
      'Discuss cholesterol screening',
    ],
    question:
      'Should I discuss cardiovascular screening earlier because of my family history?',
  },
  {
    id: 'diabetes',
    label: 'Diabetes prevention',
    matchLabel: 'Matches your diabetes-prevention plan',
    includes: 'Includes type 2 diabetes, nutrition, activity, and blood-sugar screening conversations.',
    familyKeywords: ['type 2 diabetes', 'diabetes', 'obesity'],
    eventKeywords: [
      'diabetes',
      'blood sugar',
      'A1C',
      'glucose',
      'nutrition',
      'healthy eating',
      'weight management',
      'cooking class',
      'exercise',
    ],
    preventionActions: [
      'Move regularly each week',
      'Choose balanced meals with fiber-rich foods',
      'Ask about blood-sugar screening',
    ],
    question:
      'Should I ask about diabetes screening or prevention programs based on my family history?',
  },
  {
    id: 'breast-cancer',
    label: 'Breast cancer prevention',
    matchLabel: 'Relevant to breast-cancer family history',
    includes: 'Includes breast cancer family-history patterns and screening conversations.',
    familyKeywords: ['breast cancer'],
    eventKeywords: [
      'breast cancer',
      'mammogram',
      'mammography',
      'breast health',
      'genetic counseling',
      'breast screening',
    ],
    preventionActions: [
      'Keep your family history updated',
      'Discuss screening timing',
      'Consider whether genetic counseling is appropriate',
    ],
    question:
      'Does my family history suggest I should discuss breast-cancer screening timing earlier?',
  },
  {
    id: 'colon-cancer',
    label: 'Colon cancer prevention',
    matchLabel: 'Relevant to colon-cancer family history',
    includes: 'Includes colon or colorectal cancer family-history patterns and screening conversations.',
    familyKeywords: ['colon cancer', 'colorectal cancer'],
    eventKeywords: [
      'colon cancer',
      'colorectal',
      'FIT kit',
      'colonoscopy',
      'cancer screening',
      'colorectal awareness',
    ],
    preventionActions: [
      'Discuss colorectal screening timing',
      'Eat a healthy diet and stay active',
      'Share your family history with your healthcare professional',
    ],
    question:
      'Should my family history change when I start colorectal cancer screening?',
  },
  {
    id: 'mental-wellness',
    label: 'Mental wellness',
    matchLabel: 'Recommended for mental-wellness support',
    includes: 'Includes depression, anxiety, stress, mindfulness, and support resources.',
    familyKeywords: ['depression', 'anxiety', 'mental health'],
    eventKeywords: [
      'stress',
      'anxiety',
      'depression',
      'counseling',
      'mindfulness',
      'meditation',
      'support group',
      'mental health',
      'wellness',
    ],
    preventionActions: [
      'Practice a simple stress-management habit',
      'Protect sleep and recovery time',
      'Consider counseling or support resources',
    ],
    question:
      'Are there preventive mental-wellness resources that fit my current stress or family history?',
  },
]

const generalPreventionDefinition = {
  id: 'general-prevention',
  label: 'General preventive care',
  matchLabel: 'General preventive-care resource',
  eventKeywords: [
    'vaccination',
    'vaccine',
    'immunization',
    'health screening',
    'wellness fair',
    'preventive care',
    'primary care',
    'community health',
    'health education',
  ],
}

const lifestylePriorityCategoryMap = {
  movement: ['cardiovascular', 'diabetes', 'mental-wellness'],
  nutrition: ['diabetes', 'cardiovascular'],
  screening: ['cardiovascular'],
  sleep: ['mental-wellness'],
  stress: ['mental-wellness'],
  'sugary-drinks': ['diabetes'],
  tobacco: ['cardiovascular'],
}

function normalize(value) {
  return String(value || '')
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function hasKeyword(text, keyword) {
  return normalizeSearchText(text).includes(normalizeSearchText(keyword))
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[-_/]/g, ' ')
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .replace(/\bmammography\b/g, 'mammogram mammography')
    .replace(/\bmammograms\b/g, 'mammogram')
    .replace(/\bcolorectal\b/g, 'colon colorectal')
    .replace(/\bclasses\b/g, 'class')
    .replace(/\bgroups\b/g, 'group')
    .replace(/\bscreenings\b/g, 'screening')
    .replace(/\bchecks\b/g, 'check')
    .replace(/\bclinics\b/g, 'clinic')
    .replace(/\s+/g, ' ')
    .trim()
}

function textContainsKeyword(text, keyword) {
  const normalizedText = normalizeSearchText(text)
  const normalizedKeyword = normalizeSearchText(keyword)

  return Boolean(normalizedText && normalizedKeyword && normalizedText.includes(normalizedKeyword))
}

function getEventTextFields(event) {
  return {
    description: [
      event?.shortDescription,
      event?.summary,
      event?.description,
    ].join(' '),
    organizer: [event?.organizer, event?.source, event?.sourceName].join(' '),
    tags: [
      Array.isArray(event?.tags) ? event.tags.join(' ') : '',
      Array.isArray(event?.healthTopics) ? event.healthTopics.join(' ') : '',
      event?.category,
    ].join(' '),
    title: event?.title || '',
    venue: [
      event?.locationName,
      event?.venueName,
      event?.location?.name,
      event?.location,
    ].join(' '),
  }
}

function getCombinedEventText(event) {
  const fields = getEventTextFields(event)

  return [
    fields.title,
    fields.description,
    fields.tags,
    fields.organizer,
    fields.venue,
  ].join(' ')
}

const eventMatchingDiagnosticsEnabled =
  globalThis?.localStorage?.getItem?.('eventMatchDebug') === '1' ||
  globalThis?.process?.env?.EVENT_MATCH_DEBUG === '1'
const stagedResourceDiagnosticsEnabled =
  globalThis?.localStorage?.getItem?.('resourceSearchDebug') === '1' ||
  globalThis?.process?.env?.RESOURCE_SEARCH_DEBUG === '1'

const eventMatchingRules = {
  cardiovascular: {
    strong: [
      'blood pressure screening',
      'blood pressure check',
      'hypertension',
      'cholesterol screening',
      'heart health',
      'cardiovascular screening',
      'stroke prevention',
      'blood pressure',
      'cholesterol',
      'cardiovascular',
    ],
    supporting: [
      'walking group',
      'fitness class',
      'exercise class',
      'healthy cooking',
      'cooking class',
      'nutrition workshop',
      'wellness screening',
      'community health fair',
      'fitness',
      'exercise',
      'nutrition',
    ],
    actionKeywords: {
      'Check blood pressure regularly': [
        'blood pressure screening',
        'blood pressure check',
        'wellness screening',
        'community health fair',
      ],
      'Discuss cholesterol screening': [
        'cholesterol screening',
        'cardiovascular screening',
        'heart health',
        'community health fair',
      ],
      'Stay physically active': [
        'walking group',
        'fitness class',
        'exercise class',
        'physical activity',
      ],
    },
    exclude: [
      'breast cancer',
      'mammogram',
      'colon cancer',
      'colonoscopy',
      'colorectal',
      'dementia',
      'alzheimer',
      'neurology',
      'oncology',
      'pregnancy',
      'baby storytime',
    ],
  },
  diabetes: {
    strong: [
      'diabetes',
      'blood sugar',
      'a1c',
      'glucose',
      'diabetes prevention',
    ],
    supporting: [
      'nutrition',
      'healthy eating',
      'healthy cooking',
      'cooking class',
      'weight management',
      'exercise',
      'fitness class',
      'walking group',
    ],
    actionKeywords: {
      'Ask about blood-sugar screening': [
        'blood sugar',
        'a1c',
        'glucose',
        'diabetes prevention',
      ],
      'Choose balanced meals with fiber-rich foods': [
        'nutrition',
        'healthy eating',
        'healthy cooking',
        'cooking class',
      ],
      'Move regularly each week': [
        'walking group',
        'fitness class',
        'exercise class',
        'physical activity',
      ],
    },
    exclude: [
      'breast cancer',
      'mammogram',
      'colon cancer',
      'colorectal',
      'colonoscopy',
      'dementia',
      'alzheimer',
      'neurology',
      'neuro oncology',
      'brain tumor',
      'brain tumors',
      'pregnancy',
      'baby storytime',
    ],
  },
  'breast-cancer': {
    strong: [
      'breast cancer',
      'breast screening',
      'mammogram',
      'mammography',
      'breast health',
      'genetic counseling',
    ],
    supporting: [
      'cancer prevention',
      "women's health",
      'womens health',
      'family history workshop',
      'wellness screening',
      'community health fair',
      'cancer screening',
    ],
    actionKeywords: {
      'Discuss screening timing': [
        'mammogram',
        'mammography',
        'breast screening',
        'breast health',
        'cancer screening',
      ],
      'Consider whether genetic counseling is appropriate': [
        'genetic counseling',
        'family history workshop',
      ],
    },
    exclude: [
      'colon cancer',
      'colorectal',
      'colonoscopy',
      'fit kit',
      'diabetes',
      'blood pressure',
      'cholesterol',
      'cardiovascular',
      'dementia',
      'alzheimer',
      'neurology',
      'neuro oncology',
      'brain tumor',
      'brain tumors',
      'pregnancy',
      'baby storytime',
    ],
  },
  'colon-cancer': {
    strong: [
      'colon cancer',
      'colorectal cancer',
      'colorectal screening',
      'colonoscopy',
      'fit test',
      'fit kit',
      'stool test',
      'cancer screening',
    ],
    supporting: [
      'cancer prevention',
      'healthy eating',
      'cooking class',
      'nutrition',
      'physical activity',
      'family history workshop',
      'genetic counseling',
    ],
    actionKeywords: {
      'Discuss colorectal screening timing': [
        'colorectal screening',
        'colon cancer',
        'colorectal cancer',
        'fit kit',
        'fit test',
        'colonoscopy',
        'cancer screening',
      ],
      'Eat a healthy diet and stay active': [
        'nutrition',
        'healthy eating',
        'physical activity',
        'exercise',
      ],
      'Share your family history with your healthcare professional': [
        'family history workshop',
        'genetic counseling',
      ],
    },
    exclude: [
      'breast cancer',
      'mammogram',
      'mammography',
      'diabetes',
      'blood pressure',
      'cholesterol',
      'cardiovascular',
      'dementia',
      'alzheimer',
      'neurology',
      'neuro oncology',
      'brain tumor',
      'brain tumors',
      'pregnancy',
      'baby storytime',
    ],
  },
  'mental-wellness': {
    strong: [
      'mental health',
      'counseling',
      'anxiety',
      'stress',
      'mindfulness',
      'meditation',
      'support group',
      'behavioral health',
    ],
    supporting: [
      'wellness',
      'sleep',
      'walking group',
      'fitness class',
      'community health fair',
    ],
    actionKeywords: {
      'Practice a simple stress-management habit': [
        'stress',
        'mindfulness',
        'meditation',
      ],
      'Protect sleep and recovery time': ['sleep', 'wellness'],
      'Consider counseling or support resources': [
        'mental health',
        'counseling',
        'support group',
      ],
    },
    exclude: [
      'breast cancer',
      'mammogram',
      'colon cancer',
      'colorectal',
      'colonoscopy',
      'diabetes',
      'blood pressure',
      'cholesterol',
      'cardiovascular',
      'pregnancy',
      'baby storytime',
    ],
  },
  'general-prevention': {
    strong: generalPreventionDefinition.eventKeywords,
    supporting: [
      'nutrition workshop',
      'walking group',
      'fitness class',
      'exercise class',
      'wellness screening',
      'community health fair',
    ],
    exclude: ['baby storytime', 'staff meeting', 'town hall'],
  },
}

const actionResourceRules = {
  cardiovascular: {
    'Check blood pressure regularly': {
      mode: 'medical',
      keywords: [
        'free blood pressure check',
        'blood pressure screening',
        'blood pressure check',
        'hypertension screening',
        'community health fair',
        'pharmacy screening',
        'wellness clinic',
        'preventive screening',
      ],
      resourceTypes: ['screening', 'clinic', 'health fair'],
    },
    'Stay physically active': {
      mode: 'lifestyle',
      keywords: [
        'nearby parks',
        'park',
        'walking trail',
        'walking path',
        'running path',
        'walking group',
        'recreation center',
        'fitness class',
        'community exercise',
        'senior exercise',
        'tennis court',
        'exercise class',
      ],
      resourceTypes: ['park', 'trail', 'fitness', 'recreation'],
    },
    'Discuss cholesterol screening': {
      mode: 'medical',
      keywords: [
        'cholesterol screening',
        'cardiovascular screening',
        'heart health workshop',
        'preventive health fair',
        'primary care outreach',
        'community health fair',
      ],
      resourceTypes: ['screening', 'clinic', 'health fair'],
    },
  },
  diabetes: {
    'Move regularly each week': {
      mode: 'lifestyle',
      keywords: [
        'walking group',
        'walking path',
        'nearby parks',
        'park',
        'fitness class',
        'exercise class',
        'community exercise',
        'recreation center',
      ],
      resourceTypes: ['park', 'trail', 'fitness', 'recreation'],
    },
    'Choose balanced meals with fiber-rich foods': {
      mode: 'lifestyle',
      keywords: [
        'farmers market',
        'produce market',
        'nutrition workshop',
        'healthy eating',
        'healthy cooking',
        'cooking class',
        'dietitian',
      ],
      resourceTypes: ['nutrition', 'farmers market', 'education'],
    },
    'Ask about blood-sugar screening': {
      mode: 'medical',
      keywords: [
        'diabetes prevention',
        'blood sugar',
        'a1c',
        'glucose',
        'health screening',
        'community health fair',
        'wellness screening',
      ],
      resourceTypes: ['screening', 'clinic', 'health fair'],
    },
  },
  'colon-cancer': {
    'Discuss colorectal screening timing': {
      mode: 'medical',
      keywords: [
        'colorectal screening',
        'fit kit distribution',
        'fit kit',
        'fit test',
        'colon cancer education',
        'cancer screening fair',
        'community clinic',
        'preventive care event',
        'colonoscopy',
      ],
      resourceTypes: ['screening', 'clinic', 'education'],
    },
    'Eat a healthy diet and stay active': {
      mode: 'lifestyle',
      keywords: [
        'farmers market',
        'produce market',
        'nutrition workshop',
        'healthy cooking class',
        'cooking class',
        'nearby parks',
        'park',
        'walking group',
        'recreation program',
        'walking path',
      ],
      resourceTypes: ['park', 'nutrition', 'farmers market', 'fitness'],
    },
    'Share your family history with your healthcare professional': {
      mode: 'medical',
      keywords: [
        'family history workshop',
        'genetic counseling event',
        'genetic counseling',
        'cancer education seminar',
        'patient navigation program',
        'community health education',
      ],
      resourceTypes: ['education', 'clinic'],
    },
  },
  'breast-cancer': {
    'Keep your family history updated': {
      mode: 'medical',
      keywords: [
        'genetic counseling',
        'family history education',
        'breast health workshop',
        'cancer education event',
      ],
      resourceTypes: ['education', 'clinic'],
    },
    'Discuss screening timing': {
      mode: 'medical',
      keywords: [
        'mammography event',
        'mammogram',
        'breast screening',
        "women's health clinic",
        'womens health clinic',
        'cancer screening fair',
        'preventive care event',
      ],
      resourceTypes: ['screening', 'clinic', 'education'],
    },
    'Consider whether genetic counseling is appropriate': {
      mode: 'medical',
      keywords: [
        'genetic counseling session',
        'genetic counseling',
        'hereditary cancer workshop',
        'breast cancer education',
        'family risk seminar',
      ],
      resourceTypes: ['education', 'clinic'],
    },
  },
  'mental-wellness': {
    'Practice a simple stress-management habit': {
      mode: 'lifestyle',
      keywords: [
        'mindfulness',
        'meditation',
        'stress management',
        'yoga',
        'wellness class',
        'support group',
      ],
      resourceTypes: ['wellness', 'education', 'support'],
    },
    'Protect sleep and recovery time': {
      mode: 'lifestyle',
      keywords: [
        'sleep',
        'stress',
        'mindfulness',
        'meditation',
        'wellness',
      ],
      resourceTypes: ['wellness', 'education'],
    },
    'Consider counseling or support resources': {
      mode: 'medical',
      keywords: [
        'mental health',
        'counseling',
        'behavioral health',
        'support group',
        'anxiety',
        'depression',
      ],
      resourceTypes: ['clinic', 'support', 'education'],
    },
  },
}

function isKnownCondition(value) {
  return value && !noConditionValues.has(normalize(value).replace(/\.+$/g, ''))
}

function getRelationshipWeight(relationship) {
  return relationshipWeights[relationship] || 1
}

function getDiagnosisAge(member) {
  const age = Number(member?.diagnosisAge)

  return Number.isFinite(age) && age > 0 ? age : null
}

function getDiagnosisAgeBonus(member) {
  const age = getDiagnosisAge(member)

  if (member?.earlyDiagnosis) {
    return 4
  }

  if (age === null) {
    return 0
  }

  if (age < 50) {
    return 4
  }

  if (age < 60) {
    return 2
  }

  return 0
}

function getRiskLevel(affectedCount) {
  if (affectedCount >= 2) {
    return 'Higher-priority pattern'
  }

  if (affectedCount === 1) {
    return 'Increased priority'
  }

  return ''
}

function getPriorityExplanation(priority) {
  const relationshipList = priority.affectedRelationships.join(', ')
  const conditionList = priority.conditions.join(', ')

  if (priority.affectedCount >= 2) {
    return `${conditionList} appears in multiple reported relatives (${relationshipList}). Based on the information provided, this may be worth discussing with a healthcare professional.`
  }

  if (priority.affectedCount === 1) {
    return `${conditionList} appears in one reported ${relationshipList.toLowerCase()}. Based on the information provided, this is an increased prevention priority.`
  }

  return `${priority.label} is supported by lifestyle information from your profile.`
}

function getResourceCategoryDefinition(categoryId) {
  if (categoryId === 'general-prevention') {
    return generalPreventionDefinition
  }

  return healthPriorityDefinitions.find((category) => category.id === categoryId)
}

function createPriority(definition) {
  return {
    affectedCount: 0,
    affectedRelationships: [],
    closenessScore: 0,
    conditions: [],
    diagnosisAgeScore: 0,
    earliestDiagnosisAge: null,
    id: definition.id,
    includes: definition.includes,
    label: definition.label,
    lifestyleScore: 0,
    preventionActions: definition.preventionActions,
    question: definition.question,
    score: 0,
    sources: [],
  }
}

function addUnique(list, value) {
  if (value && !list.includes(value)) {
    list.push(value)
  }
}

function addFamilySignal(priorityMap, definition, member, condition) {
  const priority = priorityMap.get(definition.id) || createPriority(definition)
  const relationship = member.relationship || 'relative'
  const diagnosisAge = getDiagnosisAge(member)

  priority.affectedCount += 1
  priority.closenessScore += getRelationshipWeight(member.relationship)
  priority.diagnosisAgeScore += getDiagnosisAgeBonus(member)
  priority.score += 12 + getRelationshipWeight(member.relationship) + getDiagnosisAgeBonus(member)
  priorityMap.set(definition.id, priority)

  addUnique(priority.conditions, condition)
  addUnique(priority.affectedRelationships, relationship)
  addUnique(priority.sources, `${relationship} reported ${condition}`)

  if (
    diagnosisAge !== null &&
    (priority.earliestDiagnosisAge === null || diagnosisAge < priority.earliestDiagnosisAge)
  ) {
    priority.earliestDiagnosisAge = diagnosisAge
  }
}

function addLifestyleSignal(priorityMap, categoryId, source) {
  const definition = getResourceCategoryDefinition(categoryId)

  if (!definition || categoryId === 'general-prevention') {
    return
  }

  const priority = priorityMap.get(categoryId) || createPriority(definition)

  priority.lifestyleScore += 2
  priority.score += 2
  addUnique(priority.sources, source)
  priorityMap.set(categoryId, priority)
}

export function getEventResourceCategories(event) {
  const searchableText = getCombinedEventText(event)
  const categories = healthPriorityDefinitions
    .filter((category) =>
      [
        ...(eventMatchingRules[category.id]?.strong || category.eventKeywords),
      ].some((keyword) => hasKeyword(searchableText, keyword)),
    )
    .map((category) => category.id)

  if (
    eventMatchingRules['general-prevention'].strong.some((keyword) =>
      hasKeyword(searchableText, keyword),
    )
  ) {
    categories.push(generalPreventionDefinition.id)
  }

  return categories
}

function getMatchedKeywords(fields, keywords, { score, sourceLabel }) {
  return keywords
    .filter((keyword) => textContainsKeyword(fields, keyword))
    .map((keyword) => ({
      keyword,
      score,
      sourceLabel,
    }))
}

function scoreStrongKeywordInTitle(keyword) {
  return normalizeSearchText(keyword).includes(' ') ? 10 : 7
}

function getExcludedTerm(eventText, excludeTerms = []) {
  return excludeTerms.find((term) => textContainsKeyword(eventText, term)) || ''
}

function getActionMatches(priority, eventText) {
  const rules = eventMatchingRules[priority.id]

  if (!rules?.actionKeywords) {
    return []
  }

  return Object.entries(rules.actionKeywords).flatMap(([action, keywords]) =>
    keywords
      .filter((keyword) => textContainsKeyword(eventText, keyword))
      .map((keyword) => ({
        action,
        keyword,
      })),
  )
}

function getActionRule(priorityId, action) {
  return actionResourceRules[priorityId]?.[action] || null
}

function getResourceIdentity(resource) {
  return [
    resource.resourceType || 'event',
    resource.id || resource.eventLink || resource.sourceUrl || resource.title || resource.name,
  ]
    .filter(Boolean)
    .join(':')
}

function getResourceDedupeIdentity(resource) {
  return [
    normalizeSearchText(resource.title || resource.name),
    normalizeSearchText(
      resource.address ||
        resource.locationName ||
        resource.venueName ||
        resource.city ||
        '',
    ),
    resource.resourceType === 'park' ? 'park' : getEventDateTimestamp(resource),
  ].join('|')
}

function getResourceSearchText(resource) {
  if (resource?.resourceType === 'park') {
    return [
      resource.name,
      resource.title,
      resource.description,
      resource.address,
      Array.isArray(resource.amenities) ? resource.amenities.join(' ') : '',
      'park nearby parks walking trail walking path running path recreation outdoor exercise',
    ].join(' ')
  }

  return getCombinedEventText(resource)
}

function createParkResource(park) {
  return {
    ...park,
    eventMatchKeywords: [],
    hasLocation: Boolean(park?.address),
    isLocalCity: true,
    recommendationLabel: 'Local movement resource',
    resourceType: 'park',
    title: park?.name || 'Local park',
  }
}

function getResourceCity(resource) {
  const addressZip = getZipFromAddress(resource?.address)

  return (
    getCityForZip(resource?.zipCode) ||
    getCityForZip(addressZip) ||
    resource?.city ||
    resource?.location?.city ||
    resource?.location?.address?.addressLocality ||
    resource?.addressLocality ||
    ''
  )
}

function getResourceZip(resource) {
  const directZip = resource?.zipCode || resource?.postalCode || getZipFromAddress(resource?.address)
  const normalized = normalizeZip(directZip)

  return String(directZip ?? '').replace(/\D/g, '').length > 0 ? normalized : ''
}

function getResourceCoordinates(resource) {
  if (resource?.resourceType === 'park' && isValidCoordinatePair(resource)) {
    return {
      latitude: Number(resource.latitude),
      longitude: Number(resource.longitude),
      source: 'park-coordinates',
    }
  }

  return getEventLocation(resource)
}

function isOnlineResource(resource) {
  return Boolean(
    resource?.isOnline ||
      resource?.isOnlineEvent ||
      resource?.attendanceMode === 'online' ||
      resource?.attendanceMode === 'hybrid',
  )
}

function normalizeCity(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function getBestResourceActionMatch(resource, priorities) {
  return priorities
    .flatMap((priority, priorityIndex) =>
      priority.preventionActions.map((action, actionIndex) => ({
        action,
        actionIndex,
        match: scoreResourceForAction(resource, priority, action),
        priority,
        priorityIndex,
      })),
    )
    .filter(({ match }) => match)
    .sort((first, second) => {
      if (second.match.score !== first.match.score) {
        return second.match.score - first.match.score
      }

      if (first.priorityIndex !== second.priorityIndex) {
        return first.priorityIndex - second.priorityIndex
      }

      return first.actionIndex - second.actionIndex
    })[0]
}

function getStageForResource({
  distanceMiles,
  isOnline,
  resourceCity,
  resourceZip,
  selectedCity,
  zipCode,
}) {
  if (resourceZip && resourceZip === zipCode) {
    return 'exact'
  }

  if (
    resourceCity &&
    selectedCity &&
    normalizeCity(resourceCity) === normalizeCity(selectedCity)
  ) {
    return 'same-city'
  }

  if (typeof distanceMiles === 'number' && distanceMiles <= 10) {
    return 'within-10'
  }

  if (typeof distanceMiles === 'number' && distanceMiles <= 25) {
    return 'within-25'
  }

  if (isOnline) {
    return 'fallback'
  }

  return ''
}

const stagedSearchMetadata = {
  exact: {
    label: 'Exact ZIP results',
    rank: 1,
    score: 8,
  },
  'same-city': {
    label: 'Same-city results',
    rank: 2,
    score: 5,
  },
  'within-10': {
    label: 'Within 10 miles',
    rank: 3,
    score: 3,
  },
  'within-25': {
    label: 'Within 25 miles',
    rank: 4,
    score: 1,
  },
  fallback: {
    label: 'Online and statewide resources',
    rank: 5,
    score: 1,
  },
}

const trustedHealthOrganizations = [
  {
    description: 'Heart-health education, prevention guidance, and blood-pressure resources.',
    id: 'american-heart-association',
    priorityIds: ['cardiovascular'],
    title: 'American Heart Association',
    url: 'https://www.heart.org/',
  },
  {
    description: 'Diabetes prevention, nutrition, activity, and blood-sugar education.',
    id: 'american-diabetes-association',
    priorityIds: ['diabetes'],
    title: 'American Diabetes Association',
    url: 'https://diabetes.org/',
  },
  {
    description: 'Cancer prevention, screening education, and family-history guidance.',
    id: 'american-cancer-society',
    priorityIds: ['breast-cancer', 'colon-cancer'],
    title: 'American Cancer Society',
    url: 'https://www.cancer.org/',
  },
  {
    description: 'Cancer research and education from the U.S. National Cancer Institute.',
    id: 'national-cancer-institute',
    priorityIds: ['breast-cancer', 'colon-cancer'],
    title: 'National Cancer Institute',
    url: 'https://www.cancer.gov/',
  },
  {
    description: 'Public-health prevention guidance and screening information.',
    id: 'cdc',
    priorityIds: ['cardiovascular', 'diabetes', 'breast-cancer', 'colon-cancer', 'mental-wellness'],
    title: 'CDC',
    url: 'https://www.cdc.gov/',
  },
  {
    description: 'Health education from the National Institutes of Health.',
    id: 'nih',
    priorityIds: ['cardiovascular', 'diabetes', 'breast-cancer', 'colon-cancer', 'mental-wellness'],
    title: 'NIH',
    url: 'https://www.nih.gov/',
  },
  {
    description: 'Mental-health education and support resources.',
    id: 'nami',
    priorityIds: ['mental-wellness'],
    title: 'NAMI',
    url: 'https://www.nami.org/',
  },
  {
    description: 'Mental-health education from the National Institute of Mental Health.',
    id: 'nimh',
    priorityIds: ['mental-wellness'],
    title: 'National Institute of Mental Health',
    url: 'https://www.nimh.nih.gov/',
  },
]

function logStagedResourceDiagnostic(details) {
  if (!stagedResourceDiagnosticsEnabled) {
    return
  }

  console.debug('Resource search diagnostic', details)
}

function compareStagedResources(firstResource, secondResource) {
  if (secondResource.recommendationScore !== firstResource.recommendationScore) {
    return secondResource.recommendationScore - firstResource.recommendationScore
  }

  if (firstResource.resourceSearchStageRank !== secondResource.resourceSearchStageRank) {
    return firstResource.resourceSearchStageRank - secondResource.resourceSearchStageRank
  }

  const firstDistance = firstResource.distanceMiles ?? Number.MAX_SAFE_INTEGER
  const secondDistance = secondResource.distanceMiles ?? Number.MAX_SAFE_INTEGER

  if (firstDistance !== secondDistance) {
    return firstDistance - secondDistance
  }

  return getEventDateTimestamp(firstResource) - getEventDateTimestamp(secondResource)
}

function getTrustedOrganizationsForPriorities(priorities = []) {
  const priorityIds = new Set(priorities.map((priority) => priority.id))
  const organizations = trustedHealthOrganizations.filter((organization) =>
    organization.priorityIds.some((priorityId) => priorityIds.has(priorityId)),
  )

  return organizations.slice(0, 5).map((organization) => {
    const matchedPriority = priorities.find((priority) =>
      organization.priorityIds.includes(priority.id),
    )

    return {
      attendanceMode: 'online',
      description: organization.description,
      eventMatchReason: matchedPriority
        ? `Recommended because ${matchedPriority.label.toLowerCase()} is one of your top health priorities.`
        : 'Recommended as a trusted prevention resource.',
      eventPriorityId: matchedPriority?.id || 'general-prevention',
      id: `organization-${organization.id}`,
      isOnline: true,
      isOnlineEvent: true,
      platform: 'Trusted website',
      recommendationAction: 'Learn from trusted health organizations',
      recommendationLabel: 'Trusted health organization',
      recommendationScore: 2,
      resourceSearchStage: 'fallback',
      resourceSearchStageLabel: 'Online and statewide resources',
      resourceSearchStageRank: stagedSearchMetadata.fallback.rank,
      resourceType: 'organization',
      shortDescription: organization.description,
      sourceUrl: organization.url,
      title: organization.title,
    }
  })
}

function createFallbackSections({ buckets, priorities }) {
  const nearbyCommunityEvents = dedupeFallbackResources([
    ...buckets['same-city'],
    ...buckets['within-10'],
    ...buckets['within-25'],
  ]).filter(
    (resource) =>
      resource.resourceType !== 'park' &&
      resource.resourceType !== 'organization' &&
      !resource.isOnlineEvent,
  )
  const onlineResources = dedupeFallbackResources(buckets.fallback).filter(
    (resource) => resource.isOnlineEvent && resource.resourceType !== 'organization',
  )
  const trustedOrganizations = getTrustedOrganizationsForPriorities(priorities)
  const generalPreventiveResources = dedupeFallbackResources([
    ...buckets.exact,
    ...buckets['same-city'],
    ...buckets['within-10'],
    ...buckets['within-25'],
  ]).filter((resource) => resource.resourceType === 'park')

  return [
    {
      description: 'Community wellness events, health screenings, health fairs, and prevention programs.',
      id: 'nearby-community-events',
      resources: nearbyCommunityEvents.slice(0, 4),
      title: '📍 Nearby Community Events',
    },
    {
      description: 'Virtual workshops, educational programs, and online support groups.',
      id: 'online-resources',
      resources: onlineResources.slice(0, 4),
      title: '💻 Online Resources',
    },
    {
      description: 'Reliable organizations connected to your top health priorities.',
      id: 'trusted-health-organizations',
      resources: trustedOrganizations,
      title: '🏥 Trusted Health Organizations',
    },
    {
      description: 'Nearby options that support healthy habits such as movement, nutrition, and prevention routines.',
      id: 'general-preventive-resources',
      resources: generalPreventiveResources.slice(0, 4),
      title: '🌱 General Preventive Resources',
    },
  ]
}

function dedupeFallbackResources(resources) {
  const deduped = new Map()

  resources.sort(compareStagedResources).forEach((resource) => {
    const key = getResourceDedupeIdentity(resource)
    const existing = deduped.get(key)

    if (!existing || compareStagedResources(resource, existing) < 0) {
      deduped.set(key, resource)
    }
  })

  return [...deduped.values()].sort(compareStagedResources)
}

function scoreResourceForAction(resource, priority, action) {
  const rule = getActionRule(priority.id, action)

  if (!rule) {
    return null
  }

  const searchableText = getResourceSearchText(resource)
  const priorityRules = eventMatchingRules[priority.id]
  const excludedTerm =
    resource.resourceType === 'park'
      ? ''
      : getExcludedTerm(searchableText, priorityRules?.exclude)

  if (excludedTerm) {
    return null
  }

  const titleText = resource.title || resource.name || ''
  const descriptionText =
    resource.resourceType === 'park'
      ? [resource.description, Array.isArray(resource.amenities) ? resource.amenities.join(' ') : ''].join(' ')
      : [
          resource.shortDescription,
          resource.summary,
          resource.description,
          Array.isArray(resource.healthTopics) ? resource.healthTopics.join(' ') : '',
          Array.isArray(resource.tags) ? resource.tags.join(' ') : '',
          resource.category,
          resource.organizer,
          resource.source,
          resource.sourceName,
          resource.locationName,
        ].join(' ')
  const keywordMatches = rule.keywords.flatMap((keyword) => {
    const matches = []

    if (textContainsKeyword(titleText, keyword)) {
      matches.push({ keyword, score: 10 })
    }

    if (textContainsKeyword(descriptionText, keyword)) {
      matches.push({ keyword, score: 5 })
    }

    return matches
  })
  const priorityMatch = scoreEventForPriority(resource, priority)
  const resourceTypeMatch =
    resource.resourceType === 'park' && rule.resourceTypes.includes('park')
      ? [{ keyword: 'park', score: rule.mode === 'lifestyle' ? 12 : 2 }]
      : []
  const supportingMatches =
    priorityMatch?.keywords
      ?.filter((keyword) =>
        rule.keywords.some(
          (ruleKeyword) =>
            textContainsKeyword(ruleKeyword, keyword) ||
            textContainsKeyword(keyword, ruleKeyword),
        ),
      )
      .map((keyword) => ({ keyword, score: 3 })) || []
  const matches = [...keywordMatches, ...resourceTypeMatch, ...supportingMatches]

  if (matches.length === 0) {
    return null
  }

  const score = matches.reduce((total, match) => total + match.score, 0)

  if (score < 2) {
    return null
  }

  const keywords = [...new Set(matches.map((match) => match.keyword))]

  return {
    action,
    keywords,
    reason: `Recommended for "${action}" because it matches ${keywords.join(', ')}.`,
    score,
  }
}

function compareActionResources(firstResource, secondResource) {
  if (secondResource.recommendationScore !== firstResource.recommendationScore) {
    return secondResource.recommendationScore - firstResource.recommendationScore
  }

  const firstDistance = firstResource.distanceMiles ?? Number.MAX_SAFE_INTEGER
  const secondDistance = secondResource.distanceMiles ?? Number.MAX_SAFE_INTEGER

  if (firstDistance !== secondDistance) {
    return firstDistance - secondDistance
  }

  return getEventDateTimestamp(firstResource) - getEventDateTimestamp(secondResource)
}

function isFutureOrUndatedEvent(event, now = new Date()) {
  const timestamp = getEventDateTimestamp(event)

  return timestamp === Number.MAX_SAFE_INTEGER || timestamp >= now.getTime()
}

function logEventMatchDiagnostic({
  event,
  included,
  keywords = [],
  priority,
  reason,
  score = 0,
}) {
  if (!eventMatchingDiagnosticsEnabled) {
    return
  }

  console.debug('Event match diagnostic', {
    eventTitle: event?.title,
    included,
    matchedKeywords: keywords,
    matchedPriority: priority?.label || priority?.id || '',
    reason,
    relevanceScore: score,
  })
}

export function scoreEventForPriority(event, priority) {
  const definition = getResourceCategoryDefinition(priority.id)
  const rules = eventMatchingRules[priority.id]

  if (!definition?.eventKeywords || !rules) {
    return null
  }

  const fields = getEventTextFields(event)
  const combinedText = getCombinedEventText(event)
  const excludedTerm = getExcludedTerm(combinedText, rules.exclude)

  if (excludedTerm) {
    logEventMatchDiagnostic({
      event,
      included: false,
      priority,
      reason: `Excluded because it matched unrelated term "${excludedTerm}".`,
    })

    return null
  }

  const titleMatches = rules.strong
    .filter((keyword) => textContainsKeyword(fields.title, keyword))
    .map((keyword) => ({
      keyword,
      score: scoreStrongKeywordInTitle(keyword),
      sourceLabel: 'title',
    }))

  const matches = [
    ...titleMatches,
    ...getMatchedKeywords(fields.description, rules.strong, {
      score: 5,
      sourceLabel: 'description',
    }),
    ...getMatchedKeywords([fields.tags, fields.organizer, fields.venue].join(' '), rules.strong, {
      score: 3,
      sourceLabel: 'tags or source',
    }),
    ...getMatchedKeywords(fields.title, rules.supporting, {
      score: 2,
      sourceLabel: 'supporting title term',
    }),
    ...getMatchedKeywords(combinedText, rules.supporting, {
      score: 1,
      sourceLabel: 'supporting prevention term',
    }),
  ]
  const actionMatches = getActionMatches(priority, combinedText)

  if (matches.length === 0) {
    logEventMatchDiagnostic({
      event,
      included: false,
      priority,
      reason: 'No matching priority keywords found.',
    })

    return null
  }

  const uniqueKeywords = [...new Set(matches.map((match) => match.keyword))]
  const score = matches.reduce((total, match) => total + match.score, 0)

  if (score < 2) {
    logEventMatchDiagnostic({
      event,
      included: false,
      keywords: uniqueKeywords,
      priority,
      reason: `Score ${score} is below the minimum relevance score.`,
      score,
    })

    return null
  }

  const actionText = [...new Set(actionMatches.map((match) => match.action))]

  const result = {
    actionMatches: actionText,
    keywords: uniqueKeywords,
    reason:
      actionText.length > 0
        ? `Recommended because it supports: ${actionText.join(', ')}.`
        : `Recommended because it matches ${priority.label.toLowerCase()} keywords: ${uniqueKeywords.join(', ')}.`,
    score,
  }

  logEventMatchDiagnostic({
    event,
    included: true,
    keywords: uniqueKeywords,
    priority,
    reason: result.reason,
    score,
  })

  return result
}

export function groupEventsByPriority(
  events = [],
  priorities = [],
  { limitPerPriority = 3, now = new Date() } = {},
) {
  const assignments = new Map()

  events.forEach((event) => {
    if (!isFutureOrUndatedEvent(event, now)) {
      logEventMatchDiagnostic({
        event,
        included: false,
        reason: 'Excluded because the event date has passed.',
      })
      return
    }

    const matches = priorities
      .map((priority, priorityIndex) => ({
        match: scoreEventForPriority(event, priority),
        priority,
        priorityIndex,
      }))
      .filter(({ match }) => match)
      .sort((first, second) => {
        if (second.match.score !== first.match.score) {
          return second.match.score - first.match.score
        }

        return first.priorityIndex - second.priorityIndex
      })

    if (matches.length === 0) {
      logEventMatchDiagnostic({
        event,
        included: false,
        reason: 'Excluded because it did not match any top health priority.',
      })
      return
    }

    const bestMatch = matches[0]
    const assignmentKey = event.id || event.eventLink || event.title

    assignments.set(assignmentKey, {
      ...event,
      eventMatchKeywords: bestMatch.match.keywords,
      eventMatchReason: bestMatch.match.reason,
      eventPriorityId: bestMatch.priority.id,
      recommendationLabel: getResourceCategoryDefinition(bestMatch.priority.id)?.matchLabel,
      recommendationScore: bestMatch.match.score,
    })
  })

  return priorities.map((priority) => {
    const matchedEvents = [...assignments.values()]
      .filter((event) => event.eventPriorityId === priority.id)
      .sort(comparePersonalizedEvents)
      .slice(0, limitPerPriority)

    return {
      events: matchedEvents,
      priority,
    }
  })
}

export function groupResourcesByPriorityAction(
  events = [],
  priorities = [],
  { limitPerAction = 2, now = new Date(), parks = [] } = {},
) {
  const eventResources = events.filter((event) => isFutureOrUndatedEvent(event, now))
  const resources = [
    ...eventResources.map((event) => ({
      ...event,
      resourceType: event.resourceType || 'event',
    })),
    ...parks.map(createParkResource),
  ]
  const assignments = new Map()

  resources.forEach((resource) => {
    const possibleMatches = priorities
      .flatMap((priority, priorityIndex) =>
        priority.preventionActions.map((action, actionIndex) => ({
          action,
          actionIndex,
          match: scoreResourceForAction(resource, priority, action),
          priority,
          priorityIndex,
        })),
      )
      .filter(({ match }) => match)
      .sort((first, second) => {
        if (second.match.score !== first.match.score) {
          return second.match.score - first.match.score
        }

        if (first.priorityIndex !== second.priorityIndex) {
          return first.priorityIndex - second.priorityIndex
        }

        return first.actionIndex - second.actionIndex
      })

    if (possibleMatches.length === 0) {
      return
    }

    const bestMatch = possibleMatches[0]
    const assignmentKey = getResourceIdentity(resource)

    assignments.set(assignmentKey, {
      ...resource,
      eventMatchKeywords: bestMatch.match.keywords,
      eventMatchReason: bestMatch.match.reason,
      eventPriorityId: bestMatch.priority.id,
      recommendationAction: bestMatch.action,
      recommendationLabel: getResourceCategoryDefinition(bestMatch.priority.id)?.matchLabel,
      recommendationScore: bestMatch.match.score,
    })
  })

  return priorities.map((priority) => ({
    actions: priority.preventionActions.map((action) => ({
      action,
      resources: [...assignments.values()]
        .filter(
          (resource) =>
            resource.eventPriorityId === priority.id &&
            resource.recommendationAction === action,
        )
        .sort(compareActionResources)
        .slice(0, limitPerAction),
    })),
    priority,
  }))
}

export function groupAssignedResourcesByPriorityAction(
  resources = [],
  priorities = [],
  { limitPerAction = 2 } = {},
) {
  return priorities.map((priority) => ({
    actions: priority.preventionActions.map((action) => ({
      action,
      resources: resources
        .filter(
          (resource) =>
            resource.eventPriorityId === priority.id &&
            resource.recommendationAction === action,
        )
        .sort(compareActionResources)
        .slice(0, limitPerAction),
    })),
    priority,
  }))
}

export function getStagedResourceSearch({
  events = [],
  minUsefulResults = 3,
  now = new Date(),
  parks = [],
  priorities = [],
  radiusMiles = defaultRadiusMiles,
  zipCode = '',
} = {}) {
  const origin = getLocationForZip(zipCode)
  const normalizedZip = origin?.zipCode || normalizeZip(zipCode)
  const selectedCity = origin?.city || getCityForZip(normalizedZip)

  if (!origin || priorities.length === 0) {
    return {
      city: selectedCity,
      counts: {
        exact: 0,
        fallback: 0,
        online: 0,
        sameCity: 0,
        within10: 0,
        within25: 0,
      },
      eventsLoaded: events.length,
      fallbackSections: [],
      resources: [],
      selectedStage: '',
      stageLabel: '',
      status: priorities.length === 0 ? 'no-priorities' : 'invalid-location',
      zipCode: normalizedZip,
    }
  }

  const resources = [
    ...events
      .filter((event) => isFutureOrUndatedEvent(event, now))
      .map((event) => ({
        ...event,
        resourceType: event.resourceType || 'event',
      })),
    ...parks.map(createParkResource),
  ]
  const stageBuckets = {
    exact: [],
    fallback: [],
    'same-city': [],
    'within-10': [],
    'within-25': [],
  }

  resources.forEach((resource) => {
    const match = getBestResourceActionMatch(resource, priorities)
    const resourceZip = getResourceZip(resource)
    const resourceCity = getResourceCity(resource)
    const isOnline = isOnlineResource(resource)
    const resourceCoordinates = isOnline ? null : getResourceCoordinates(resource)
    const distanceMiles =
      !isOnline && resourceCoordinates
        ? getDistanceInMiles(origin, resourceCoordinates)
        : null
    const stage = match
      ? getStageForResource({
          distanceMiles,
          isOnline,
          resourceCity,
          resourceZip,
          selectedCity,
          zipCode: normalizedZip,
        })
      : ''
    const metadata = stagedSearchMetadata[stage]

    if (!match || !stage || !metadata) {
      logStagedResourceDiagnostic({
        city: resourceCity,
        coordinates: resourceCoordinates,
        distance: distanceMiles,
        eventZip: resourceZip,
        included: false,
        matchedKeywords: match?.match?.keywords || [],
        matchedPriority: match?.priority?.label || '',
        reason: !match
          ? 'No action-level match for the top priorities.'
          : 'No supported ZIP, city, distance, or online fallback stage.',
        relevanceScore: match?.match?.score || 0,
        title: resource.title || resource.name,
      })
      return
    }

    if (
      !isOnline &&
      typeof distanceMiles === 'number' &&
      distanceMiles > radiusMiles &&
      stage !== 'fallback'
    ) {
      logStagedResourceDiagnostic({
        city: resourceCity,
        coordinates: resourceCoordinates,
        distance: distanceMiles,
        eventZip: resourceZip,
        included: false,
        matchedKeywords: match.match.keywords,
        matchedPriority: match.priority.label,
        reason: `Outside ${radiusMiles}-mile search radius.`,
        relevanceScore: match.match.score,
        title: resource.title || resource.name,
      })
      return
    }

    const locationScore = metadata.score
    const stagedResource = {
      ...resource,
      city: resourceCity || resource.city,
      distanceMiles,
      distanceUnavailable: !isOnline && distanceMiles === null,
      eventCity: resourceCity,
      eventMatchKeywords: match.match.keywords,
      eventMatchReason: match.match.reason,
      eventPriorityId: match.priority.id,
      isLocalCity:
        normalizeCity(resourceCity) === normalizeCity(selectedCity),
      isOnlineEvent: isOnline,
      recommendationAction: match.action,
      recommendationLabel: getResourceCategoryDefinition(match.priority.id)?.matchLabel,
      recommendationScore: match.match.score + locationScore,
      resourceSearchStage: stage,
      resourceSearchStageLabel: metadata.label,
      resourceSearchStageRank: metadata.rank,
      zipCode: resourceZip || resource.zipCode,
    }

    stageBuckets[stage].push(stagedResource)

    logStagedResourceDiagnostic({
      city: resourceCity,
      coordinates: resourceCoordinates,
      distance: distanceMiles,
      eventZip: resourceZip,
      included: true,
      matchedKeywords: match.match.keywords,
      matchedPriority: match.priority.label,
      reason: metadata.label,
      relevanceScore: stagedResource.recommendationScore,
      title: resource.title || resource.name,
    })
  })

  const dedupeAndSort = (items) => {
    const deduped = new Map()

    items.sort(compareStagedResources).forEach((item) => {
      const key = getResourceDedupeIdentity(item)
      const existing = deduped.get(key)

      if (!existing || compareStagedResources(item, existing) < 0) {
        deduped.set(key, item)
      }
    })

    return [...deduped.values()].sort(compareStagedResources)
  }

  const stageOrder = ['exact', 'same-city', 'within-10', 'within-25', 'fallback']
  const dedupedBuckets = Object.fromEntries(
    stageOrder.map((stage) => [stage, dedupeAndSort(stageBuckets[stage])]),
  )
  const matchedResources = Object.values(dedupedBuckets).flat()
  const counts = {
    exact: dedupedBuckets.exact.length,
    fallback: dedupedBuckets.fallback.length,
    online: matchedResources.filter((resource) => resource.isOnlineEvent).length,
    sameCity: dedupedBuckets['same-city'].length,
    within10: dedupedBuckets['within-10'].length,
    within25: dedupedBuckets['within-25'].length,
  }
  const selectedStage =
    stageOrder.find((stage) => dedupedBuckets[stage].length >= minUsefulResults) ||
    stageOrder.find((stage) => dedupedBuckets[stage].length > 0) ||
    ''
  const fallbackSections = createFallbackSections({
    buckets: dedupedBuckets,
    priorities,
  })
  const hasFallbackResources = fallbackSections.some(
    (section) => section.resources.length > 0,
  )

  return {
    city: selectedCity,
    counts,
    eventsLoaded: events.length,
    fallbackSections,
    resources: selectedStage ? dedupedBuckets[selectedStage] : [],
    selectedStage,
    stageLabel: selectedStage ? stagedSearchMetadata[selectedStage].label : '',
    status: selectedStage || hasFallbackResources ? 'success' : 'empty',
    zipCode: normalizedZip,
  }
}

export function getUserResourcePriorities({
  familyHealthSummary = {},
  familyMembers = [],
  preventionScore = {},
} = {}) {
  const priorityMap = new Map()

  familyHealthSummary.categories
    ?.filter((category) => category.riskLevel !== 'Average')
    .forEach((category) => {
      const categoryDefinitionMap = {
        cancer: ['breast-cancer', 'colon-cancer'],
        cardiovascular: ['cardiovascular'],
        mental: ['mental-wellness'],
        metabolic: ['diabetes'],
      }

      categoryDefinitionMap[category.id]?.forEach((categoryId) => {
        const definition = getResourceCategoryDefinition(categoryId)
        const priority = priorityMap.get(categoryId) || createPriority(definition)

        priority.score += riskLevelWeights[category.riskLevel] || 0
        addUnique(priority.sources, category.explanation)
        priorityMap.set(categoryId, priority)
      })
    })

  familyMembers.forEach((member) => {
    member.illnesses?.filter(isKnownCondition).forEach((condition) => {
      healthPriorityDefinitions.forEach((definition) => {
        if (
          definition.familyKeywords.some((keyword) =>
            hasKeyword(condition, keyword),
          )
        ) {
          addFamilySignal(priorityMap, definition, member, condition)
        }
      })
    })
  })

  preventionScore.topPriorities?.forEach((priority) => {
    lifestylePriorityCategoryMap[priority.id]?.forEach((categoryId) => {
      addLifestyleSignal(priorityMap, categoryId, priority.title)
    })
  })

  return [...priorityMap.values()]
    .filter((priority) => priority.affectedCount > 0 || priority.score >= 10)
    .map((priority) => ({
      ...priority,
      explanation: getPriorityExplanation(priority),
      riskLevel: getRiskLevel(priority.affectedCount),
    }))
    .filter((priority) => priority.riskLevel)
    .sort(comparePriorities)
    .slice(0, 3)
}

function comparePriorities(firstPriority, secondPriority) {
  if (secondPriority.score !== firstPriority.score) {
    return secondPriority.score - firstPriority.score
  }

  if (secondPriority.affectedCount !== firstPriority.affectedCount) {
    return secondPriority.affectedCount - firstPriority.affectedCount
  }

  if (secondPriority.closenessScore !== firstPriority.closenessScore) {
    return secondPriority.closenessScore - firstPriority.closenessScore
  }

  const firstAge = firstPriority.earliestDiagnosisAge ?? Number.MAX_SAFE_INTEGER
  const secondAge = secondPriority.earliestDiagnosisAge ?? Number.MAX_SAFE_INTEGER

  if (firstAge !== secondAge) {
    return firstAge - secondAge
  }

  return firstPriority.label.localeCompare(secondPriority.label)
}

export function getEventRecommendation(event, priorities = []) {
  const eventCategories = getEventResourceCategories(event)
  const priorityMatches = priorities.filter((priority) =>
    eventCategories.includes(priority.id),
  )

  if (priorityMatches.length > 0) {
    const strongestMatch = priorityMatches[0]
    const definition = getResourceCategoryDefinition(strongestMatch.id)

    return {
      categories: eventCategories,
      label: definition?.matchLabel || `Recommended for ${strongestMatch.label}`,
      score: priorityMatches.reduce((total, priority) => total + priority.score, 0),
      type: 'priority',
    }
  }

  if (priorities.length === 0 && eventCategories.includes('general-prevention')) {
    return {
      categories: eventCategories,
      label: generalPreventionDefinition.matchLabel,
      score: 1,
      type: 'general',
    }
  }

  return null
}

export function personalizeEventsForResources(events = [], priorities = []) {
  return events
    .map((event) => {
      const recommendation = getEventRecommendation(event, priorities)

      if (!recommendation) {
        return null
      }

      return {
        ...event,
        recommendationCategories: recommendation.categories,
        recommendationLabel: recommendation.label,
        recommendationScore: recommendation.score,
        recommendationType: recommendation.type,
      }
    })
    .filter(Boolean)
    .sort(comparePersonalizedEvents)
}

function comparePersonalizedEvents(firstEvent, secondEvent) {
  if (secondEvent.recommendationScore !== firstEvent.recommendationScore) {
    return secondEvent.recommendationScore - firstEvent.recommendationScore
  }

  if (Boolean(firstEvent.isLocalCity) !== Boolean(secondEvent.isLocalCity)) {
    return firstEvent.isLocalCity ? -1 : 1
  }

  const firstDistance = firstEvent.distanceMiles ?? Number.MAX_SAFE_INTEGER
  const secondDistance = secondEvent.distanceMiles ?? Number.MAX_SAFE_INTEGER

  if (firstDistance !== secondDistance) {
    return firstDistance - secondDistance
  }

  return getEventDateTimestamp(firstEvent) - getEventDateTimestamp(secondEvent)
}

export function getFallbackResourceGroups(events = [], priorities = []) {
  const onlineMatchingEvents = personalizeEventsForResources(
    events.filter(
      (event) =>
        event.isOnlineEvent || event.isOnline || event.attendanceMode === 'online',
    ),
    priorities,
  ).filter((event) => event.recommendationType === 'priority')
  const generalPreventiveEvents = personalizeEventsForResources(events, []).filter(
    (event) => event.recommendationType === 'general',
  )

  return {
    generalPreventiveEvents,
    onlineMatchingEvents,
  }
}

export { healthPriorityDefinitions }
