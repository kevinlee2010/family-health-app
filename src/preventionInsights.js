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
    actions: [
      'Consider sharing this cancer history during a preventive care visit.',
      'Ask whether family history may affect when screening conversations should begin.',
      'Continue updating cancer history details as you learn more.',
    ],
    questions: [
      'Does my family history affect when I should discuss screening options?',
      'What additional family-history details would be useful to know?',
      'Are there general prevention habits that are especially relevant for me?',
    ],
    sourceName: 'American Cancer Society',
    sourceUrl: 'https://www.cancer.org/cancer/risk-prevention.html',
    title: 'Cancer Prevention',
  },
  cardiovascular: {
    actions: [
      'Learn about routine blood pressure and cholesterol checks.',
      'Review general heart-healthy lifestyle recommendations.',
      'Consider sharing this family history with a healthcare professional.',
    ],
    questions: [
      'Does my family history affect when I should discuss cholesterol screening?',
      'How often should my blood pressure generally be checked?',
      'Which preventive habits are most relevant for heart health?',
    ],
    sourceName: 'American Heart Association',
    sourceUrl: 'https://www.heart.org/en/healthy-living',
    title: 'Heart Health',
  },
  kidney: {
    actions: [
      'Learn how blood pressure, diabetes, and kidney health can be connected.',
      'Consider asking what routine health checks are useful for kidney health.',
      'Keep inherited kidney-condition details updated in your family profile.',
    ],
    questions: [
      'Are there routine checks that help monitor kidney health?',
      'Does my family history make any kidney-health details important to track?',
      'What blood pressure or blood sugar information should I know?',
    ],
    sourceName: 'Centers for Disease Control and Prevention',
    sourceUrl: 'https://www.cdc.gov/kidney-disease/prevention/index.html',
    title: 'Kidney Health',
  },
  mental: {
    actions: [
      'Learn about supportive routines for stress, sleep, and mental well-being.',
      'Consider sharing relevant family mental-health history with a qualified professional.',
      'Keep track of patterns that may be useful during future care conversations.',
    ],
    questions: [
      'What family-history details are useful to share about mental health?',
      'Which daily habits can support mental well-being?',
      'When should someone consider talking with a mental-health professional?',
    ],
    sourceName: 'National Institute of Mental Health',
    sourceUrl: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
    title: 'Mental Well-Being',
  },
  metabolic: {
    actions: [
      'Learn about routine blood sugar, cholesterol, and weight-related health checks.',
      'Review general nutrition and movement habits that support metabolic health.',
      'Consider discussing family history during a routine preventive visit.',
    ],
    questions: [
      'Should I discuss blood glucose screening based on my family history?',
      'Which lifestyle habits are most important for prevention?',
      'How often are routine metabolic health factors usually reviewed?',
    ],
    sourceName: 'American Diabetes Association',
    sourceUrl: 'https://diabetes.org/healthy-living',
    title: 'Type 2 Diabetes and Metabolic Health',
  },
  neurological: {
    actions: [
      'Learn about general brain-health habits such as movement, sleep, and blood pressure awareness.',
      'Consider sharing neurological family-history patterns during preventive visits.',
      'Keep updating family details if new information becomes available.',
    ],
    questions: [
      'Which neurological family-history details are useful to share?',
      'Are there preventive habits that support long-term brain health?',
      'Should any related heart or blood pressure history be discussed too?',
    ],
    sourceName: 'Centers for Disease Control and Prevention',
    sourceUrl: 'https://www.cdc.gov/aging/index.html',
    title: 'Brain and Stroke Prevention',
  },
  respiratory: {
    actions: [
      'Learn about air quality, activity choices, and respiratory-health basics.',
      'Consider noting asthma or COPD history for future healthcare conversations.',
      'Track family-history details and any personal symptoms separately.',
    ],
    questions: [
      'Does my family history make any respiratory details important to track?',
      'Are there general prevention steps for lung health I should understand?',
      'When is it useful to discuss breathing symptoms with a professional?',
    ],
    sourceName: 'Centers for Disease Control and Prevention',
    sourceUrl: 'https://www.cdc.gov/asthma/index.html',
    title: 'Respiratory Health',
  },
}

function toReadableList(items) {
  if (items.length <= 1) {
    return items.join('')
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }

  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

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

function getInsightExplanation(category, patternLabel) {
  const conditionNames = category.conditions.map((condition) => condition.conditionName)
  const listedConditions = conditionNames.length
    ? toReadableList(conditionNames.slice(0, 3))
    : ''

  if (patternLabel === 'Strong Family Pattern') {
    return `Multiple family entries reported ${listedConditions}. This may be useful information to share during preventive healthcare visits.`
  }

  if (patternLabel === 'Notable Family Pattern') {
    return `One family entry currently maps to ${category.name.toLowerCase()}. This does not mean you will develop a condition, but it may be relevant when discussing preventive care.`
  }

  if (patternLabel === 'No Strong Pattern Identified') {
    return `No strong family-health pattern is visible for ${category.name.toLowerCase()} from the information entered so far. This is not proof that future concerns cannot occur.`
  }

  return `Limited family information is available for ${category.name.toLowerCase()}. Adding more relatives or health details may improve the educational insights.`
}

function getWhyItAppears(category, profile) {
  const familyReasons = category.conditions.flatMap((condition) =>
    condition.relatives.map(
      (relative) => `${relative} reported ${condition.conditionName}`,
    ),
  )
  const lifestyleReasons = []

  if (
    category.id === 'cardiovascular' &&
    profile.knownHighBloodPressure === 'Yes'
  ) {
    lifestyleReasons.push('Profile indicates known high blood pressure')
  }

  if (
    (category.id === 'cardiovascular' || category.id === 'metabolic') &&
    profile.knownHighCholesterol === 'Yes'
  ) {
    lifestyleReasons.push('Profile indicates known high cholesterol')
  }

  if (category.id === 'metabolic' && profile.diabetesStatus && profile.diabetesStatus !== 'No') {
    lifestyleReasons.push(`Profile diabetes status: ${profile.diabetesStatus}`)
  }

  if (
    (category.id === 'cardiovascular' || category.id === 'metabolic') &&
    (profile.exercise === 'Rarely' || profile.exercise === '1-2 days/week')
  ) {
    lifestyleReasons.push('Lifestyle profile indicates limited weekly physical activity')
  }

  if (profile.smokingStatus === 'Current') {
    if (
      category.id === 'cardiovascular' ||
      category.id === 'cancer' ||
      category.id === 'respiratory'
    ) {
      lifestyleReasons.push('Lifestyle profile indicates current smoking or vaping')
    }
  }

  return [...familyReasons, ...lifestyleReasons]
}

export function buildPreventionInsights({ familyHealthSummary, profile }) {
  return familyHealthSummary.categories.map((category) => {
    const patternLabel =
      category.observationCount === 0
        ? 'Limited Family Information'
        : getPatternLabel(category.riskLevel, category.observationCount)
    const content = healthAreaContent[category.id] || {
      actions: [
        'Continue updating your family health profile as you learn more.',
        'Consider sharing relevant family history during preventive care visits.',
      ],
      questions: [
        'What family-history details would be useful to know?',
        'Are there general preventive habits I should focus on?',
      ],
      sourceName: 'Centers for Disease Control and Prevention',
      sourceUrl: 'https://www.cdc.gov/',
      title: category.name,
    }
    const whyItAppears = getWhyItAppears(category, profile)

    return {
      doctorQuestions: content.questions,
      educationalActions: content.actions,
      evidenceExplanation: getPatternExplanation(patternLabel),
      explanation: getInsightExplanation(category, patternLabel),
      healthArea: content.title,
      id: category.id,
      patternLabel,
      sourceName: content.sourceName,
      sourceUrl: content.sourceUrl,
      summary:
        patternLabel === 'Limited Family Information'
          ? `More family-health details can make this ${content.title.toLowerCase()} insight more useful.`
          : getInsightExplanation(category, patternLabel),
      tone: getPatternTone(patternLabel),
      whyItAppears:
        whyItAppears.length > 0
          ? whyItAppears
          : [
              'No family entries currently map to this health area',
              'Additional family details may improve this educational insight',
            ],
    }
  })
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
