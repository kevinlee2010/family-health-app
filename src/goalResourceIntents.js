const trustedGoalSources = {
  airQuality: [
    {
      description:
        'Official U.S. air-quality lookup for current AQI, forecasts, smoke, and local monitoring information.',
      id: 'airnow',
      title: 'AirNow Local Air Quality',
      url: 'https://www.airnow.gov/',
    },
    {
      description:
        'Regional Bay Area air-quality forecasts, Spare the Air updates, and local air-quality information.',
      id: 'bay-area-air-quality',
      title: 'Bay Area Air Quality Management District',
      url: 'https://www.baaqmd.gov/',
      cityKeywords: ['san francisco', 'berkeley', 'oakland', 'south san francisco'],
    },
  ],
  alcohol: [
    {
      description:
        'CDC education and behavior-change tools for understanding alcohol use and making a plan to drink less.',
      id: 'cdc-alcohol',
      title: 'CDC Alcohol Use and Your Health',
      url: 'https://www.cdc.gov/alcohol/about-alcohol-use/index.html',
    },
    {
      description:
        'A CDC tool to check drinking patterns and build a personalized plan to drink less.',
      id: 'cdc-check-your-drinking',
      title: 'CDC Check Your Drinking',
      url: 'https://www.cdc.gov/alcohol/checkyourdrinking/index.html',
    },
  ],
  breastScreening: [
    {
      description:
        'CDC guidance on mammograms, breast cancer screening timing, and screening conversations.',
      id: 'cdc-breast-screening',
      title: 'CDC Breast Cancer Screening',
      url: 'https://www.cdc.gov/breast-cancer/screening/index.html',
    },
    {
      description:
        'American Cancer Society information on breast cancer screening guidance and mammograms.',
      id: 'acs-breast-screening',
      title: 'American Cancer Society Breast Cancer Screening',
      url: 'https://www.cancer.org/cancer/types/breast-cancer.html',
    },
  ],
  colorectalScreening: [
    {
      description:
        'CDC information on colorectal cancer screening tests and why screening matters.',
      id: 'cdc-colorectal-screening',
      title: 'CDC Colorectal Cancer Screening',
      url: 'https://www.cdc.gov/colorectal-cancer/use-screening-tests/',
    },
    {
      description:
        'American Cancer Society colorectal cancer information and screening guidance.',
      id: 'acs-colorectal-screening',
      title: 'American Cancer Society Colorectal Cancer Screening',
      url: 'https://www.cancer.org/cancer/types/colon-rectal-cancer.html',
    },
  ],
  cardiovascular: [
    {
      description:
        'American Heart Association education about blood pressure, cholesterol, and heart-health prevention.',
      id: 'aha-heart-health',
      title: 'American Heart Association Heart Health',
      url: 'https://www.heart.org/en/healthy-living',
    },
    {
      description:
        'American Heart Association information about understanding and managing blood pressure.',
      id: 'aha-blood-pressure',
      title: 'American Heart Association Blood Pressure',
      url: 'https://www.heart.org/en/health-topics/high-blood-pressure',
    },
  ],
  mentalWellness: [
    {
      description:
        'National Institute of Mental Health education on caring for mental health and emotional well-being.',
      id: 'nimh-mental-health',
      title: 'NIMH Caring for Your Mental Health',
      url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
    },
  ],
  nutrition: [
    {
      description:
        'MyPlate guidance on building balanced meals with fruits, vegetables, grains, protein, and dairy.',
      id: 'myplate',
      title: 'MyPlate Nutrition Guidance',
      url: 'https://www.myplate.gov/',
    },
    {
      description:
        'CDC information on healthy eating patterns and practical nutrition education.',
      id: 'cdc-nutrition',
      title: 'CDC Nutrition',
      url: 'https://www.cdc.gov/nutrition/',
    },
  ],
  respiratory: [
    {
      description:
        'American Lung Association resources for lung health, respiratory wellness, and avoiding smoke exposure.',
      id: 'american-lung-association',
      title: 'American Lung Association Lung Health',
      url: 'https://www.lung.org/lung-health-diseases/wellness',
    },
  ],
  sleep: [
    {
      description:
        'CDC sleep-health guidance on consistent sleep routines and habits that support better sleep.',
      id: 'cdc-sleep',
      title: 'CDC Sleep Health',
      url: 'https://www.cdc.gov/sleep/about/index.html',
    },
  ],
  smokingCessation: [
    {
      description:
        'Smokefree.gov quit plans, tips, apps, and text-message tools for tobacco cessation support.',
      id: 'smokefree',
      title: 'Smokefree.gov Quit Support',
      url: 'https://smokefree.gov/quit-smoking',
    },
    {
      description:
        'Smokefree.gov tools and tips for quit plans, cravings, apps, and text-message support.',
      id: 'smokefree-tools',
      title: 'Smokefree.gov Tools and Tips',
      url: 'https://smokefree.gov/tools-tips',
    },
  ],
}

const goalIntentDefinitions = [
  {
    actionLabel: 'Open Family Health Tree',
    intent: 'family-history',
    keywords: ['family history', 'family health tree', 'diagnosis ages', 'relatives'],
    locationRequired: false,
    priorityHealthTheme: 'family-history',
    resourceTypes: [],
    searchTerms: ['family history', 'diagnosis age', 'relative health conditions'],
    target: 'family',
    trustedSourceGroups: [],
  },
  {
    actionLabel: 'Check Air Quality',
    intent: 'air-quality',
    keywords: ['air quality', 'poor air', 'aqi', 'smoke', 'outdoor exercise'],
    locationRequired: false,
    priorityHealthTheme: 'respiratory',
    resourceTypes: ['air_quality', 'online_tool', 'trusted_goal_resource'],
    searchTerms: ['airnow', 'air quality', 'aqi', 'smoke', 'pollution', 'spare the air'],
    target: 'nearby-resources',
    trustedSourceGroups: ['airQuality', 'respiratory'],
  },
  {
    actionLabel: 'Find Screening Locations',
    intent: 'mammography-facility',
    keywords: [
      'breast cancer screening location',
      'breast screening location',
      'breast screening near me',
      'find a mammogram',
      'find a place for breast cancer screening',
      'find breast screening',
      'find mammogram',
      'get a mammogram',
      'learn where to get a mammogram',
      'mammogram location',
      'mammography facility',
    ],
    locationRequired: true,
    priorityHealthTheme: 'breast-cancer',
    resourceTypes: ['mammography_facility', 'screening', 'clinic', 'trusted_goal_resource'],
    searchTerms: [
      'mammography facility',
      'mammogram',
      'breast cancer screening',
      'breast screening',
      'mqsa',
      'fda mammography',
    ],
    target: 'nearby-resources',
    trustedSourceGroups: ['breastScreening'],
  },
  {
    actionLabel: 'View Screening Guidance',
    intent: 'breast-screening',
    keywords: ['breast cancer screening', 'breast screening', 'mammogram', 'mammography'],
    locationRequired: false,
    priorityHealthTheme: 'breast-cancer',
    resourceTypes: ['screening', 'clinic', 'health_fair', 'trusted_goal_resource'],
    searchTerms: [
      'breast cancer screening',
      'breast screening',
      'mammogram',
      'mammography',
      'breast health clinic',
    ],
    target: 'nearby-resources',
    trustedSourceGroups: ['breastScreening'],
  },
  {
    actionLabel: 'Find Colorectal Screening Options',
    intent: 'colorectal-screening',
    keywords: ['colon cancer screening', 'colorectal screening', 'colorectal', 'fit kit'],
    locationRequired: false,
    priorityHealthTheme: 'colon-cancer',
    resourceTypes: ['screening', 'clinic', 'health_fair', 'trusted_goal_resource'],
    searchTerms: [
      'colorectal cancer screening',
      'colorectal screening',
      'colon cancer screening',
      'cancer screening',
      'fit kit',
      'clinic',
    ],
    target: 'nearby-resources',
    trustedSourceGroups: ['colorectalScreening'],
  },
  {
    actionLabel: 'Find Blood Pressure Options',
    intent: 'cardiovascular-screening',
    keywords: [
      'blood pressure',
      'cholesterol',
      'numbers',
      'heart screening',
      'preventive screening',
      'screening question',
    ],
    locationRequired: false,
    priorityHealthTheme: 'cardiovascular',
    resourceTypes: ['screening', 'clinic', 'pharmacy', 'health_fair', 'trusted_goal_resource'],
    searchTerms: [
      'blood pressure',
      'cholesterol',
      'heart health',
      'screening',
      'pharmacy',
      'clinic',
    ],
    target: 'nearby-resources',
    trustedSourceGroups: ['cardiovascular'],
  },
  {
    actionLabel: 'Find Parks & Trails',
    intent: 'physical-activity',
    keywords: [
      'active',
      'activity',
      'exercise',
      'getting outside',
      'hiking',
      'movement',
      'outdoor',
      'outside',
      'running',
      'walk',
      'walking',
    ],
    locationRequired: true,
    priorityHealthTheme: 'physical-activity',
    resourceTypes: ['park', 'trail', 'fitness', 'recreation', 'walking_group'],
    searchTerms: [
      'walk',
      'walking',
      'park',
      'trail',
      'greenway',
      'recreation',
      'ymca',
      'walking group',
    ],
    target: 'nearby-resources',
    trustedSourceGroups: [],
  },
  {
    actionLabel: 'Find Nutrition Programs',
    intent: 'nutrition',
    keywords: [
      'fiber',
      'vegetable',
      'fruit',
      'nutrition',
      'meal',
      'sodium',
      'saturated fats',
      'sugary drink',
      'water today',
    ],
    locationRequired: false,
    priorityHealthTheme: 'nutrition',
    resourceTypes: ['farmers_market', 'nutrition_class', 'food_program', 'trusted_goal_resource'],
    searchTerms: [
      'farmers market',
      'nutrition',
      'healthy cooking',
      'healthy eating',
      'food program',
      'fiber',
      'produce',
    ],
    target: 'nearby-resources',
    trustedSourceGroups: ['nutrition'],
  },
  {
    actionLabel: 'Find Wellness Resources',
    intent: 'mental-wellness',
    keywords: ['relaxing', 'stress', 'mindful', 'mindfulness', 'mental reset', 'emotional'],
    locationRequired: false,
    priorityHealthTheme: 'mental-wellness',
    resourceTypes: ['wellness', 'support_group', 'park', 'trusted_goal_resource'],
    searchTerms: ['mindfulness', 'meditation', 'wellness', 'stress', 'support group', 'mental health'],
    target: 'nearby-resources',
    trustedSourceGroups: ['mentalWellness'],
  },
  {
    actionLabel: 'View Respiratory Resources',
    intent: 'respiratory',
    keywords: ['breathing', 'respiratory', 'lung', 'asthma'],
    locationRequired: false,
    priorityHealthTheme: 'respiratory',
    resourceTypes: ['clinic', 'education', 'trusted_goal_resource'],
    searchTerms: ['respiratory', 'lung', 'breathing', 'asthma', 'clinic'],
    target: 'nearby-resources',
    trustedSourceGroups: ['respiratory'],
  },
  {
    actionLabel: 'Find Quit-Support Resources',
    intent: 'smoking-cessation',
    keywords: ['quit-support', 'quit support', 'quit', 'smoking', 'vaping', 'smoke or vape', 'tobacco'],
    locationRequired: false,
    priorityHealthTheme: 'smoking-vaping',
    resourceTypes: ['cessation', 'support_group', 'clinic', 'trusted_goal_resource'],
    searchTerms: ['smoking cessation', 'tobacco', 'quit', 'vaping', 'nicotine', 'support'],
    target: 'nearby-resources',
    trustedSourceGroups: ['smokingCessation'],
  },
  {
    actionLabel: 'View Sleep Guidance',
    intent: 'sleep',
    keywords: ['bedtime', 'sleep'],
    locationRequired: false,
    priorityHealthTheme: 'sleep',
    resourceTypes: ['sleep_program', 'wellness', 'trusted_goal_resource'],
    searchTerms: ['sleep', 'sleep hygiene', 'bedtime', 'recovery'],
    target: 'nearby-resources',
    trustedSourceGroups: ['sleep'],
  },
  {
    actionLabel: 'View Alcohol Guidance',
    intent: 'alcohol',
    keywords: ['alcohol-free', 'alcohol free', 'alcohol', 'drink less'],
    locationRequired: false,
    priorityHealthTheme: 'alcohol',
    resourceTypes: ['education', 'support_group', 'trusted_goal_resource'],
    searchTerms: ['alcohol', 'drink less', 'substance use', 'behavior change'],
    target: 'nearby-resources',
    trustedSourceGroups: ['alcohol'],
  },
  {
    actionLabel: 'View Trusted Guidance',
    intent: 'education',
    keywords: ['learn', 'read', 'recommendation', 'question', 'tip'],
    locationRequired: false,
    priorityHealthTheme: 'education',
    resourceTypes: ['education', 'online_education', 'trusted_goal_resource'],
    searchTerms: ['education', 'awareness', 'prevention', 'screening', 'trusted'],
    target: 'nearby-resources',
    trustedSourceGroups: ['cardiovascular', 'nutrition'],
  },
]

const externalResourceNeedByIntent = {
  'air-quality': true,
  'breast-screening': true,
  'cardiovascular-screening': true,
  'colorectal-screening': true,
  education: false,
  'family-history': true,
  'mammography-facility': true,
  'mental-wellness': false,
  nutrition: false,
  alcohol: false,
  'physical-activity': true,
  respiratory: false,
  sleep: false,
  'smoking-cessation': false,
}

const resourceSeekingKeywords = [
  'check',
  'class',
  'clinic',
  'find',
  'learn',
  'look for',
  'look up',
  'program',
  'read',
  'recommendation',
  'recommendations',
  'resource',
  'screening',
  'service',
  'support',
  'where',
]

const selfContainedGoalKeywords = [
  'add vegetables',
  'add one serving',
  'alcohol free',
  'alcohol-free',
  'avoid smoking',
  'avoid vaping',
  'bedtime',
  'drink water',
  'go to bed',
  'limit alcohol',
  'mindful break',
  'one question',
  'relaxing',
  'set a consistent',
  'sleep',
  'spend 10 minutes',
  'vegetables to one meal',
  'water with your next meal',
  'write down',
]

export function normalizeGoalText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textIncludesAny(text, keywords = []) {
  const normalizedText = normalizeGoalText(text)

  return keywords.some((keyword) => normalizedText.includes(normalizeGoalText(keyword)))
}

function getProfilePriorityText(userProfile = {}) {
  const priorityText = [
    userProfile.priorityHealthTheme,
    userProfile.healthArea,
    userProfile.category,
    userProfile.reason,
    userProfile.detail,
    ...(userProfile.topPriorities || []).flatMap((priority) => [
      priority.id,
      priority.title,
      priority.label,
      priority.detail,
    ]),
    ...(userProfile.preventionInsights || []).flatMap((insight) => [
      insight.id,
      insight.healthArea,
      insight.preventionInsight,
    ]),
    ...(userProfile.familyMembers || []).flatMap((member) => member.illnesses || []),
    ...(userProfile.illnesses || []),
  ]

  return normalizeGoalText(priorityText.join(' '))
}

function inferGoalSpecificity(goalText, profileText) {
  if (goalText.includes('breast') || profileText.includes('breast cancer')) {
    return 'breast-screening'
  }

  if (
    goalText.includes('colon') ||
    goalText.includes('colorectal') ||
    profileText.includes('colon cancer') ||
    profileText.includes('colorectal')
  ) {
    return 'colorectal-screening'
  }

  if (
    goalText.includes('blood pressure') ||
    goalText.includes('cholesterol') ||
    profileText.includes('heart') ||
    profileText.includes('cardiovascular') ||
    profileText.includes('blood pressure') ||
    profileText.includes('cholesterol')
  ) {
    return 'cardiovascular-screening'
  }

  return ''
}

function specializeEducationIntent(goal, userProfile, baseIntent) {
  const goalText = normalizeGoalText(`${goal?.label || ''} ${goal?.reason || ''}`)
  const profileText = getProfilePriorityText(userProfile)
  const specificity = inferGoalSpecificity(goalText, profileText)

  if (!specificity) {
    return baseIntent
  }

  return goalIntentDefinitions.find((definition) => definition.intent === specificity) || baseIntent
}

function goalNeedsExternalResource(goal, intent) {
  if (!intent) {
    return false
  }

  const goalText = normalizeGoalText(`${goal?.label || ''} ${goal?.reason || ''}`)
  const resourceIntent = intent.resourceIntent || intent.intent

  if (typeof goal?.resourceNeeded === 'boolean') {
    if (
      !goal.resourceNeeded &&
      resourceIntent === 'physical-activity' &&
      textIncludesAny(goalText, [
        'getting outside',
        'hiking',
        'outdoor',
        'outside',
        'running',
        'walk',
        'walking',
      ])
    ) {
      return true
    }

    return goal.resourceNeeded
  }

  if (resourceIntent === 'family-history') {
    return true
  }

  if (selfContainedGoalKeywords.some((keyword) => goalText.includes(normalizeGoalText(keyword)))) {
    return false
  }

  if (
    [
      'air-quality',
      'breast-screening',
      'colorectal-screening',
      'cardiovascular-screening',
      'mammography-facility',
    ].includes(resourceIntent)
  ) {
    return true
  }

  if (resourceIntent === 'physical-activity') {
    return true
  }

  if (resourceIntent === 'nutrition') {
    return ['class', 'program', 'market', 'resource', 'look for', 'find'].some((keyword) =>
      goalText.includes(normalizeGoalText(keyword)),
    )
  }

  if (resourceIntent === 'mental-wellness') {
    return ['class', 'program', 'resource', 'support group', 'find', 'look for'].some((keyword) =>
      goalText.includes(normalizeGoalText(keyword)),
    )
  }

  if (resourceIntent === 'smoking-cessation') {
    return ['quit-support', 'quit support', 'program', 'resource', 'look up', 'find'].some((keyword) =>
      goalText.includes(normalizeGoalText(keyword)),
    )
  }

  if (resourceIntent === 'respiratory') {
    return ['air quality', 'clinic', 'education', 'guidance', 'resource', 'read', 'learn'].some((keyword) =>
      goalText.includes(normalizeGoalText(keyword)),
    )
  }

  if (['sleep', 'alcohol', 'education'].includes(resourceIntent)) {
    return resourceSeekingKeywords.some((keyword) => goalText.includes(normalizeGoalText(keyword)))
  }

  return Boolean(externalResourceNeedByIntent[resourceIntent])
}

export function getResourceIntentForGoal(goal = {}, userProfile = {}) {
  const labelText = normalizeGoalText(goal.label || '')
  const goalText = normalizeGoalText(`${goal.label || ''} ${goal.reason || ''}`)
  const profileText = getProfilePriorityText(userProfile)
  const explicitIntent = goal.resourceIntent
    ? goalIntentDefinitions.find(
        (definition) => definition.intent === goal.resourceIntent,
      )
    : null
  const matchedIntent =
    explicitIntent ||
    goalIntentDefinitions.find((definition) =>
      definition.intent === 'family-history'
        ? textIncludesAny(labelText, definition.keywords)
        : textIncludesAny(goalText, definition.keywords),
    ) || goalIntentDefinitions.find((definition) => definition.intent === 'education')

  const specializedIntent =
    matchedIntent.intent === 'education' || matchedIntent.intent === 'cardiovascular-screening'
      ? specializeEducationIntent(goal, userProfile, matchedIntent)
      : matchedIntent

  return {
    ...specializedIntent,
    goalLabel: goal.label || '',
    profileSignals: profileText,
    resourceNeeded: goalNeedsExternalResource(goal, specializedIntent),
    resourceIntent: specializedIntent.intent,
  }
}

export function getGoalAction(goal, userProfile = {}) {
  const intent = getResourceIntentForGoal(goal, userProfile)

  return {
    actionLabel: intent.actionLabel,
    actionType: intent.resourceIntent,
    category: goal.category || intent.priorityHealthTheme,
    destination: intent.target,
    evidenceId: goal.evidenceId || '',
    resourceCategory: intent.priorityHealthTheme,
    resourceIntent: intent.resourceIntent,
    resourceKeywords: intent.searchTerms,
    resourceNeeded: intent.resourceNeeded,
    resourceType: goal.resourceType || intent.resourceIntent,
    target: intent.target,
  }
}

function getResourceMatchText(resource) {
  return normalizeGoalText(
    [
      resource.title,
      resource.name,
      resource.eventMatchReason,
      resource.recommendationAction,
      resource.recommendationLabel,
      resource.resourceSearchStageLabel,
      resource.resourceType,
      resource.source,
      resource.description,
      resource.summary,
      resource.shortDescription,
    ].join(' '),
  )
}

function getNormalizedResourceType(resource) {
  return normalizeGoalText(resource?.resourceType || resource?.type || '')
}

function getResourceTypeScore(resource, intent) {
  const resourceType = getNormalizedResourceType(resource)
  const resourceText = getResourceMatchText(resource)

  if (
    intent.resourceTypes.some(
      (type) => resourceType.includes(normalizeGoalText(type)) ||
        resourceText.includes(normalizeGoalText(type)),
    )
  ) {
    return 18
  }

  return 0
}

function getPriorityHealthThemeScore(resource, intent, goal) {
  const resourceText = getResourceMatchText(resource)
  const themeTerms = [
    intent.priorityHealthTheme,
    ...(goal?.category ? [goal.category] : []),
  ].filter(Boolean)

  return themeTerms.some((term) => resourceText.includes(normalizeGoalText(term))) ? 10 : 0
}

function getTrustedSourceScore(resource, intent) {
  const sourceText = normalizeGoalText(`${resource?.source || ''} ${resource?.title || ''}`)
  const trustedSources = getTrustedSourcesForIntent(intent, {})

  if (trustedSources.some((source) => sourceText.includes(normalizeGoalText(source.title)))) {
    return 16
  }

  if (getNormalizedResourceType(resource) === 'trusted_goal_resource') {
    return 8
  }

  return 0
}

function getLocationScore(resource) {
  const sameCityScore = resource?.isLocalCity ? 8 : 0
  const distanceScore =
    typeof resource?.distanceMiles === 'number'
      ? Math.max(0, 8 - Math.min(8, Math.floor(resource.distanceMiles / 3)))
      : 0

  return sameCityScore + distanceScore
}

function getUpcomingScore(resource) {
  if (!resource?.startDate) {
    return 0
  }

  const timestamp = Date.parse(resource.startDate)

  if (!Number.isFinite(timestamp)) {
    return 0
  }

  const daysAway = Math.max(0, (timestamp - Date.now()) / 86400000)

  return Math.max(0, 6 - Math.floor(daysAway / 7))
}

function isWeakResourceForIntent(resource, intent) {
  const resourceType = getNormalizedResourceType(resource)
  const resourceText = getResourceMatchText(resource)

  if (intent.resourceIntent.includes('screening') || intent.resourceIntent === 'mammography-facility') {
    if (resourceType.includes('park')) return true
    if (
      resourceType.includes('vaccine') &&
      !['screening', 'mammogram', 'mammography', 'colorectal', 'blood pressure', 'cholesterol']
        .some((term) => resourceText.includes(term))
    ) {
      return true
    }
  }

  if (
    ['air-quality', 'respiratory', 'nutrition', 'sleep', 'alcohol', 'smoking-cessation'].includes(intent.resourceIntent) &&
    resourceType.includes('park')
  ) {
    return true
  }

  if (intent.resourceIntent === 'physical-activity') {
    const walkingMatchTerms = [
      'fitness',
      'greenway',
      'park',
      'recreation',
      'trail',
      'walk',
      'walking',
      'ymca',
    ]

    return !walkingMatchTerms.some((term) => resourceText.includes(term))
  }

  if (
    (resourceType.includes('trusted organization') || resourceType.includes('trusted_organization')) &&
    getTrustedSourceScore(resource, intent) === 0
  ) {
    return true
  }

  return false
}

export function scoreResourceForGoalIntent(resource, intent, goal = {}, userProfile = {}) {
  if (!intent || intent.resourceIntent === 'family-history') {
    return 0
  }

  if (isWeakResourceForIntent(resource, intent)) {
    return -Infinity
  }

  const resourceText = getResourceMatchText(resource)
  const resourceType = getNormalizedResourceType(resource)
  const exactGoalScore = intent.searchTerms.reduce(
    (score, term) => score + (resourceText.includes(normalizeGoalText(term)) ? 18 : 0),
    0,
  )
  const typeScore = getResourceTypeScore(resource, intent)
  const exactLocalScore =
    !resource?.isOnlineEvent &&
    resource?.attendanceMode !== 'online' &&
    exactGoalScore > 0 &&
    typeScore > 0
      ? 35
      : 0
  const priorityScore = getPriorityHealthThemeScore(resource, intent, goal)
  const profileText = getProfilePriorityText(userProfile)
  const profileScore = intent.searchTerms.some((term) => profileText.includes(normalizeGoalText(term)))
    ? 6
    : 0
  const directOnlineToolScore =
    intent.resourceIntent === 'air-quality' &&
    normalizeGoalText(resource?.source || resource?.title).includes('airnow')
      ? 80
      : 0
  const mammographyFacilityScore =
    intent.resourceIntent === 'mammography-facility' &&
    resourceType.includes('mammography facility')
      ? 120
      : 0
  const walkingUsabilityScore =
    intent.resourceIntent === 'physical-activity'
      ? ['trail', 'park', 'greenway', 'walk', 'walking', 'recreation'].reduce(
          (score, term) => score + (resourceText.includes(term) ? 12 : 0),
          0,
        )
      : 0
  const walkingDistanceScore =
    intent.resourceIntent === 'physical-activity' &&
    typeof resource?.distanceMiles === 'number'
      ? Math.max(0, 24 - Math.min(24, Math.floor(resource.distanceMiles * 4)))
      : 0
  const trustedFallbackPenalty =
    intent.resourceIntent !== 'air-quality' &&
    getNormalizedResourceType(resource) === 'trusted goal resource'
      ? 25
      : 0

  return (
    directOnlineToolScore +
    mammographyFacilityScore +
    exactGoalScore +
    typeScore +
    exactLocalScore +
    walkingUsabilityScore +
    walkingDistanceScore +
    priorityScore +
    profileScore +
    getLocationScore(resource) +
    getUpcomingScore(resource) +
    getTrustedSourceScore(resource, intent) -
    trustedFallbackPenalty
  )
}

export function rankResourcesForGoalIntent(resources = [], intent, goal = {}, userProfile = {}) {
  if (!intent || intent.resourceIntent === 'family-history') {
    return []
  }

  return resources
    .map((resource, index) => ({
      index,
      resource,
      score: scoreResourceForGoalIntent(resource, intent, goal, userProfile),
    }))
    .filter((item) => item.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score
      return first.index - second.index
    })
    .map((item) => item.resource)
}

export function rankResourcesForCurrentGoals(resources = [], goals = [], userProfile = {}) {
  if (goals.length === 0) {
    return resources
  }

  const goalsNeedingResources = goals.filter((goal) =>
    getResourceIntentForGoal(goal, userProfile).resourceNeeded,
  )

  if (goalsNeedingResources.length === 0) return []

  const rankedResources = resources
    .map((resource, index) => {
      const score = goalsNeedingResources.reduce((bestScore, goal) => {
        const intent = getResourceIntentForGoal(goal, userProfile)

        return Math.max(bestScore, scoreResourceForGoalIntent(resource, intent, goal, userProfile))
      }, 0)

      return {
        index,
        resource,
        score,
      }
    })
    .filter((item) => item.score > 0)
    .sort((first, second) => {
      if (second.score !== first.score) return second.score - first.score
      return first.index - second.index
    })
    .map((item) => item.resource)

  return rankedResources
}

function getTrustedSourcesForIntent(intent, activeLocation = {}) {
  const city = normalizeGoalText(activeLocation.city || '')

  return intent.trustedSourceGroups.flatMap((sourceGroup) =>
    (trustedGoalSources[sourceGroup] || []).filter(
      (source) =>
        !source.cityKeywords ||
        source.cityKeywords.some((cityKeyword) => city.includes(normalizeGoalText(cityKeyword))),
    ),
  )
}

export function getTrustedResourcesForGoalIntent(intent, activeLocation = {}) {
  if (!intent || !intent.resourceNeeded || intent.resourceIntent === 'family-history') {
    return []
  }

  return getTrustedSourcesForIntent(intent, activeLocation).map((source) => ({
    attendanceMode: 'online',
    description: source.description,
    eventLink: source.url,
    eventMatchReason:
      intent.resourceIntent === 'air-quality'
        ? 'Directly supports today’s goal to check local air quality before outdoor activity.'
        : `Directly supports today’s goal: ${intent.goalLabel || intent.actionLabel}.`,
    id: `goal-resource-${intent.resourceIntent}-${source.id}`,
    isOnline: true,
    isOnlineEvent: true,
    platform: 'Trusted website',
    recommendationAction: intent.actionLabel,
    recommendationLabel:
      intent.resourceIntent === 'air-quality'
        ? 'Best match for today’s goal'
        : 'Trusted online resource',
    resourceIntent: intent.resourceIntent,
    resourceSearchStage: 'goal-trusted',
    resourceSearchStageLabel:
      intent.resourceIntent === 'air-quality'
        ? 'Best match for today’s goal'
        : 'Trusted online resource',
    resourceSearchStageRank: intent.resourceIntent === 'air-quality' ? 0 : 4,
    resourceType: 'trusted_goal_resource',
    shortDescription: source.description,
    source: source.title,
    sourceUrl: source.url,
    title:
      source.id === 'airnow' && activeLocation.zipCode
        ? `${source.title} for ${activeLocation.zipCode}`
        : source.title,
  }))
}

export function getGoalResourceMatches(goal, resources = [], userProfile = {}, activeLocation = {}) {
  const intent = getResourceIntentForGoal(goal, userProfile)

  if (!intent.resourceNeeded || intent.resourceIntent === 'family-history') {
    return []
  }

  const trustedResources = getTrustedResourcesForGoalIntent(intent, activeLocation)
  const rankedResources = rankResourcesForGoalIntent(
    [...trustedResources, ...resources],
    intent,
    goal,
    userProfile,
  )

  return rankedResources.slice(0, 2)
}

export function getGoalPrimaryActionLabel(goal, userProfile = {}) {
  const intent = getResourceIntentForGoal(goal, userProfile)
  const goalText = normalizeGoalText(goal?.label || '')

  if (intent.resourceIntent === 'cardiovascular-screening') {
    if (goalText.includes('cholesterol')) return 'Find Cholesterol Options'
    if (goalText.includes('blood pressure')) return 'Find Blood Pressure Options'
  }

  return intent.actionLabel
}

export function buildPrivacySafeResourceQuery(intent, activeLocation = {}) {
  if (!intent || intent.resourceIntent === 'family-history') {
    return ''
  }

  const locationText =
    activeLocation.zipCode ||
    activeLocation.city ||
    ''
  const searchTerm =
    intent.resourceIntent === 'physical-activity'
      ? 'parks and walking trails'
      : intent.resourceIntent === 'cardiovascular-screening'
        ? 'blood pressure services'
        : intent.resourceIntent === 'mammography-facility'
          ? 'mammography facilities'
          : intent.resourceIntent === 'air-quality'
            ? 'air quality'
            : intent.searchTerms?.[0] || intent.actionLabel

  return [searchTerm, locationText ? `near ${locationText}` : '']
    .filter(Boolean)
    .join(' ')
}

export function getResourcePrimaryActionLabel(resource, intent) {
  if (intent?.resourceIntent === 'air-quality') return 'Check Air Quality'
  if (intent?.resourceIntent === 'mammography-facility') {
    return resource?.isFdaMammographyFacility
      ? 'FDA Facility Information'
      : 'Find Screening Locations'
  }
  if (intent?.resourceIntent === 'breast-screening') return 'View Screening Guidance'
  if (intent?.resourceIntent === 'cardiovascular-screening') return 'Find Blood Pressure Options'
  if (intent?.resourceIntent?.includes('screening')) return 'Find Screening Options'
  if (intent?.resourceIntent === 'physical-activity') {
    return resource?.directionsUrl ? 'View on Map' : 'Find Parks & Trails'
  }
  if (intent?.resourceIntent === 'nutrition') return 'Find Nutrition Programs'
  if (intent?.resourceIntent === 'smoking-cessation') return 'Find Quit Support'
  if (intent?.resourceIntent === 'sleep') return 'View Sleep Guidance'
  if (intent?.resourceIntent === 'alcohol') return 'View Alcohol Guidance'
  if (resource?.directionsUrl && !resource?.eventLink) return 'View on Map'
  if (resource?.eventLink || resource?.sourceUrl) return 'View Trusted Guidance'
  return 'More Information'
}

export function groupResourcesByGoalRelevance(resources = [], intent) {
  const sections = [
    {
      id: 'best-match',
      label:
        intent?.resourceIntent === 'mammography-facility'
          ? 'Mammography Facilities Near You'
          : intent?.resourceIntent === 'physical-activity'
          ? 'Parks & Trails Near You'
          : "Best Match for Today's Goal",
      resources: [],
    },
    {
      id: 'nearby-options',
      label: 'Nearby Options',
      resources: [],
    },
    {
      id: 'trusted-online',
      label: 'Trusted Online Resources',
      resources: [],
    },
  ]

  resources.forEach((resource, index) => {
    if (
      index === 0 ||
      resource.resourceSearchStageLabel === "Best match for today's goal" ||
      resource.recommendationLabel === "Best match for today's goal"
    ) {
      sections[0].resources.push(resource)
      return
    }

    if (resource.isOnlineEvent || resource.attendanceMode === 'online') {
      sections[2].resources.push(resource)
      return
    }

    sections[1].resources.push(resource)
  })

  if (intent?.resourceIntent === 'air-quality') {
    return sections.filter((section) => section.resources.length > 0)
  }

  return sections.filter((section) => section.resources.length > 0)
}
