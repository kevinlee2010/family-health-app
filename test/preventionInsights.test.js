import assert from 'node:assert/strict'
import test from 'node:test'

import { buildFamilyHealthSummary } from '../src/healthCategories.js'
import {
  buildPersonalizedPreventionSummary,
  buildPreventionInsights,
} from '../src/preventionInsights.js'

const diagnosticPhrases = [
  'you have',
  'you will develop',
  'confirmed high risk',
  'you should definitely',
]

function getInsightsForCondition(conditionName) {
  const familyMembers = [
    {
      illnesses: [conditionName],
      relationship: 'Father',
      relationshipType: 'father',
    },
  ]
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers,
  })

  return buildPreventionInsights({ familyHealthSummary, familyMembers })
}

function getInsightsForConditionAndProfile(conditionName, profile) {
  const familyMembers = [
    {
      illnesses: [conditionName],
      relationship: 'Father',
      relationshipType: 'father',
    },
  ]
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers,
  })

  return buildPreventionInsights({ familyHealthSummary, familyMembers, profile })
}

function buildInsightsForMembers({ familyMembers, profile = {} }) {
  const familyHealthSummary = buildFamilyHealthSummary({ familyMembers })

  return buildPreventionInsights({
    familyHealthSummary,
    familyMembers,
    profile,
  })
}

test('prevention insight cards use the new concise data shape', () => {
  const insights = getInsightsForCondition('High cholesterol')

  assert.ok(insights.length > 0)

  insights.forEach((insight) => {
    assert.equal(typeof insight.healthArea, 'string')
    assert.equal(typeof insight.patternLabel, 'string')
    assert.equal(typeof insight.preventionInsight, 'string')
    assert.ok(insight.preventionInsight.length > 80)
    assert.ok(insight.preventionInsight.length < 420)
    assert.ok(Array.isArray(insight.strategies))
    assert.ok(insight.strategies.length >= 3)
    assert.ok(insight.strategies.length <= 4)
    assert.ok(Array.isArray(insight.keyPreventionHabits))
    assert.equal(insight.keyPreventionHabits.length, 3)
    assert.equal(typeof insight.profileSuggestion, 'string')
    assert.equal(typeof insight.nextBestStep, 'string')
    assert.ok(Array.isArray(insight.personalizedFactors))
    assert.equal(typeof insight.sourceName, 'string')
    assert.equal(typeof insight.sourceUrl, 'string')
    assert.equal('whyItAppears' in insight, false)
    assert.equal('doctorQuestions' in insight, false)
    assert.equal('educationalActions' in insight, false)
  })
})

test('health profile interpretation uses relationship side, diagnosis age, and lifestyle context', () => {
  const insights = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [
          {
            category: 'cardiovascular',
            diagnosisAge: '48',
            name: 'High blood pressure',
          },
        ],
        illnesses: ['High blood pressure'],
        relationship: 'Father',
        relationshipType: 'father',
      },
      {
        conditions: [
          {
            category: 'cardiovascular',
            diagnosisAge: '62',
            name: 'High blood pressure',
          },
        ],
        illnesses: ['High blood pressure'],
        relationship: 'Grandparent',
        relationshipType: 'paternal-grandfather',
      },
    ],
    profile: {
      exercise: '3-5 days/week',
      knownHighBloodPressure: 'Yes',
      smokingStatus: 'Never',
    },
  })
  const heartInsight = insights.find((insight) => insight.id === 'cardiovascular')

  assert.equal(heartInsight.profileSuggestion.includes('blood relatives'), false)
  assert.ok(heartInsight.profileSuggestion.includes('paternal side'))
  assert.ok(
    heartInsight.personalizedFactors.some((factor) => factor.includes('Father')),
  )
  assert.equal(heartInsight.profileSuggestion.includes('diagnosis age of 48'), false)
  assert.equal(heartInsight.familyPattern, null)
  assert.ok(
    heartInsight.personalizedFactors.some((factor) =>
      factor.includes('Blood-pressure awareness'),
    ),
  )
})

test('same health category produces different interpretations for different profiles', () => {
  const userAHeart = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cardiovascular', diagnosisAge: '48', name: 'Heart disease' }],
        illnesses: ['Heart disease'],
        relationship: 'Father',
        relationshipType: 'father',
      },
      {
        conditions: [{ category: 'cardiovascular', diagnosisAge: '64', name: 'Heart disease' }],
        illnesses: ['Heart disease'],
        relationship: 'Grandparent',
        relationshipType: 'paternal-grandfather',
      },
    ],
    profile: {
      exercise: '3-5 days/week',
      knownHighBloodPressure: 'Yes',
    },
  }).find((insight) => insight.id === 'cardiovascular')
  const userBHeart = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cardiovascular', diagnosisAge: '', name: 'Heart disease' }],
        illnesses: ['Heart disease'],
        relationship: 'Grandparent',
        relationshipType: 'maternal-grandmother',
      },
    ],
    profile: {
      exercise: 'Rarely',
      smokingStatus: 'Never',
    },
  }).find((insight) => insight.id === 'cardiovascular')
  const userCHeart = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cardiovascular', diagnosisAge: '70', name: 'High cholesterol' }],
        illnesses: ['High cholesterol'],
        relationship: 'Grandparent',
        relationshipType: 'paternal-grandmother',
      },
    ],
    profile: {
      knownHighCholesterol: 'Yes',
      smokingStatus: 'Current',
    },
  }).find((insight) => insight.id === 'cardiovascular')

  assert.notEqual(userAHeart.profileSuggestion, userBHeart.profileSuggestion)
  assert.notEqual(userBHeart.profileSuggestion, userCHeart.profileSuggestion)
  assert.ok(userAHeart.profileSuggestion.includes('paternal side'))
  assert.ok(userAHeart.personalizedFactors.some((factor) => factor.includes('Blood-pressure awareness')))
  assert.equal(userBHeart.profileSuggestion.includes('blood relative'), false)
  assert.ok(userBHeart.profileSuggestion.includes('maternal side'))
  assert.ok(userBHeart.personalizedFactors.some((factor) => factor.includes('Physical activity')))
  assert.ok(userCHeart.personalizedFactors.some((factor) => factor.includes('Cholesterol awareness')))
})

test('hypertension across paternal generations is interpreted as a multi-generation pattern', () => {
  const heartInsight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cardiovascular', diagnosisAge: '58', name: 'High blood pressure' }],
        illnesses: ['High blood pressure'],
        relationship: 'Father',
        relationshipType: 'father',
      },
      {
        conditions: [{ category: 'cardiovascular', diagnosisAge: '67', name: 'High blood pressure' }],
        illnesses: ['High blood pressure'],
        relationship: 'Grandparent',
        relationshipType: 'paternal-grandfather',
      },
    ],
    profile: {
      exercise: '3-5 days/week',
      knownHighBloodPressure: 'Unknown',
    },
  }).find((insight) => insight.id === 'cardiovascular')

  assert.ok(heartInsight.profileSuggestion.includes('High blood pressure'))
  assert.ok(heartInsight.profileSuggestion.includes('more than one generation'))
  assert.ok(heartInsight.profileSuggestion.includes('paternal side'))
  assert.ok(
    heartInsight.personalizedFactors.some((factor) =>
      factor.includes('High blood pressure across generations'),
    ),
  )
})

test('breast cancer on both sides is interpreted without unrelated cancer entries', () => {
  const breastInsight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cancer', diagnosisAge: '52', name: 'Breast cancer' }],
        illnesses: ['Breast cancer'],
        relationship: 'Grandparent',
        relationshipType: 'maternal-grandmother',
      },
      {
        conditions: [{ category: 'cancer', diagnosisAge: '61', name: 'Breast cancer' }],
        illnesses: ['Breast cancer'],
        relationship: 'Grandparent',
        relationshipType: 'paternal-grandmother',
      },
      {
        conditions: [{ category: 'cancer', diagnosisAge: '48', name: 'Kidney cancer' }],
        illnesses: ['Kidney cancer'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {
      alcoholUse: 'Occasionally',
      smokingStatus: 'Never',
    },
  }).find((insight) => insight.healthArea === 'Breast Cancer Prevention')

  assert.ok(breastInsight.profileSuggestion.includes('Breast cancer'))
  assert.ok(breastInsight.profileSuggestion.includes('both sides of your family'))
  assert.equal(breastInsight.profileSuggestion.includes('Kidney cancer'), false)
})

test('kidney cancer and breast cancer are not treated as the same breast-cancer pattern', () => {
  const breastInsight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cancer', diagnosisAge: '', name: 'Breast cancer' }],
        illnesses: ['Breast cancer'],
        relationship: 'Grandparent',
        relationshipType: 'maternal-grandmother',
      },
      {
        conditions: [{ category: 'cancer', diagnosisAge: '', name: 'Kidney cancer' }],
        illnesses: ['Kidney cancer'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {},
  }).find((insight) => insight.healthArea === 'Breast Cancer Prevention')

  assert.ok(breastInsight.profileSuggestion.includes('Breast cancer'))
  assert.equal(breastInsight.profileSuggestion.includes('both sides'), false)
  assert.equal(breastInsight.profileSuggestion.includes('Kidney cancer'), false)
})

test('close relatives and distant relatives produce different interpretation language', () => {
  const closeInsight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'respiratory', diagnosisAge: '', name: 'Asthma' }],
        illnesses: ['Asthma'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {},
  }).find((insight) => insight.id === 'respiratory')
  const distantInsight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'respiratory', diagnosisAge: '', name: 'Asthma' }],
        illnesses: ['Asthma'],
        relationship: 'Grandparent',
        relationshipType: 'maternal-grandmother',
      },
    ],
    profile: {},
  }).find((insight) => insight.id === 'respiratory')

  assert.ok(closeInsight.profileSuggestion.includes('close family-history signal'))
  assert.equal(distantInsight.profileSuggestion.includes('close family-history signal'), false)
})

test('current health can drive interpretation when family history is absent', () => {
  const familyHealthSummary = buildFamilyHealthSummary({ familyMembers: [] })
  const heartInsight = buildPreventionInsights({
    familyHealthSummary,
    profile: {
      knownHighBloodPressure: 'Yes',
    },
  }).find((insight) => insight.id === 'cardiovascular')

  assert.ok(heartInsight.profileSuggestion.includes('own health information'))
  assert.ok(heartInsight.profileSuggestion.includes('reported high blood pressure'))
})

test('diagnosis age 0 is treated as unknown and never displayed', () => {
  const insight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cancer', diagnosisAge: '0', name: 'Breast cancer' }],
        illnesses: ['Breast cancer'],
        relationship: 'Grandparent',
        relationshipType: 'maternal-grandmother',
      },
    ],
    profile: {},
  })[0]
  const combinedCopy = [
    insight.profileSuggestion,
    ...insight.personalizedFactors,
  ].join(' ')

  assert.equal(combinedCopy.includes('diagnosis age of 0'), false)
  assert.equal(combinedCopy.includes('diagnosed at 0'), false)
})

test('valid diagnosis age is preserved when it adds useful context', () => {
  const insight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cancer', diagnosisAge: '52', name: 'Breast cancer' }],
        illnesses: ['Breast cancer'],
        relationship: 'Grandparent',
        relationshipType: 'maternal-grandmother',
      },
    ],
    profile: {},
  })[0]
  const combinedCopy = [
    insight.profileSuggestion,
    ...insight.personalizedFactors,
  ].join(' ')

  assert.ok(combinedCopy.includes('Maternal Grandmother'))
  assert.ok(combinedCopy.includes('diagnosis age'))
})

test('health profile does not invent family-history claims when no relatives have conditions', () => {
  const insights = buildInsightsForMembers({
    familyMembers: [],
    profile: {
      exercise: 'Rarely',
      smokingStatus: 'Never',
      stressLevel: 'High',
    },
  })
  const combinedCopy = insights
    .map((insight) => [
      insight.profileSuggestion,
      ...insight.personalizedFactors,
    ].join(' '))
    .join(' ')

  assert.equal(combinedCopy.includes('close family-history signal'), false)
  assert.equal(combinedCopy.includes('blood relative'), false)
  assert.equal(combinedCopy.includes('multiple generation'), false)
  assert.equal(combinedCopy.includes('Sister'), false)
  assert.equal(combinedCopy.includes('Brother'), false)
})

test('current-health depression is not attributed to a family member', () => {
  const mentalInsight = buildInsightsForMembers({
    familyMembers: [],
    profile: {
      illnesses: ['Depression'],
      sleep: '7-9 hours',
    },
  }).find((insight) => insight.id === 'mental')
  const combinedCopy = [
    mentalInsight.profileSuggestion,
    ...mentalInsight.personalizedFactors,
  ].join(' ')

  assert.ok(combinedCopy.includes('own health information'))
  assert.ok(combinedCopy.includes('Depression'))
  assert.equal(combinedCopy.includes('family-history signal'), false)
  assert.equal(combinedCopy.includes('Sister'), false)
  assert.equal(combinedCopy.includes('Sibling'), false)
})

test('lifestyle-only mental insight names the habit without inventing family history', () => {
  const mentalInsight = buildInsightsForMembers({
    familyMembers: [],
    profile: {
      sleep: 'Less than 6 hours',
      stressLevel: 'Very high',
    },
  }).find((insight) => insight.id === 'mental')
  const combinedCopy = [
    mentalInsight.profileSuggestion,
    ...mentalInsight.personalizedFactors,
  ].join(' ')

  assert.ok(combinedCopy.includes('sleep'))
  assert.ok(combinedCopy.includes('stress'))
  assert.equal(combinedCopy.includes('close family-history signal'), false)
  assert.equal(combinedCopy.includes('blood relative'), false)
})

test('exact family evidence keeps kidney cancer tied to Sister 1 only for kidney health', () => {
  const insights = buildInsightsForMembers({
    familyMembers: [
      {
        id: 'sister-1',
        conditions: [{ category: 'cancer', diagnosisAge: '8', name: 'Kidney cancer' }],
        illnesses: ['Kidney cancer'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {},
  })
  const kidneyInsight = insights.find((insight) => insight.id === 'kidney')
  const mentalInsight = insights.find((insight) => insight.id === 'mental')
  const breastInsight = insights.find((insight) => insight.healthArea === 'Breast Cancer Prevention')
  const kidneyCopy = [
    kidneyInsight.profileSuggestion,
    ...kidneyInsight.personalizedFactors,
  ].join(' ')

  assert.ok(kidneyCopy.includes('Kidney cancer'))
  assert.ok(kidneyCopy.includes('Sister 1'))
  assert.ok(kidneyCopy.includes('diagnosis age'))
  assert.equal(kidneyCopy.includes('Sibling'), false)
  assert.equal(Boolean(mentalInsight?.profileSuggestion?.includes('Sister 1')), false)
  assert.equal(Boolean(mentalInsight?.personalizedFactors?.join(' ').includes('Depression')), false)
  assert.equal(Boolean(breastInsight?.profileSuggestion?.includes('Sister 1')), false)
})

test('diagnosis age belongs only to the matching condition on the same relative', () => {
  const insights = buildInsightsForMembers({
    familyMembers: [
      {
        id: 'sister-1',
        conditions: [
          { category: 'cancer', diagnosisAge: '8', name: 'Kidney cancer' },
          { category: 'mental', diagnosisAge: '', name: 'Depression' },
        ],
        illnesses: ['Kidney cancer', 'Depression'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {},
  })
  const kidneyInsight = insights.find((insight) => insight.id === 'kidney')
  const mentalInsight = insights.find((insight) => insight.id === 'mental')
  const kidneyCopy = [kidneyInsight.profileSuggestion, ...kidneyInsight.personalizedFactors].join(' ')
  const mentalCopy = [mentalInsight.profileSuggestion, ...mentalInsight.personalizedFactors].join(' ')

  assert.ok(kidneyCopy.includes('Sister 1'))
  assert.ok(kidneyCopy.includes('diagnosis age'))
  assert.ok(mentalCopy.includes('Sister 1'))
  assert.equal(mentalCopy.includes('diagnosis age'), false)
  assert.equal(mentalCopy.includes('age 8'), false)
})

test('removed family condition disappears from health profile interpretation', () => {
  const withDepression = buildInsightsForMembers({
    familyMembers: [
      {
        id: 'sister-1',
        conditions: [{ category: 'mental', diagnosisAge: '', name: 'Depression' }],
        illnesses: ['Depression'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {},
  }).find((insight) => insight.id === 'mental')
  const withoutDepression = buildInsightsForMembers({
    familyMembers: [
      {
        id: 'sister-1',
        conditions: [{ category: 'cancer', diagnosisAge: '', name: 'Kidney cancer' }],
        illnesses: ['Kidney cancer'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {},
  }).find((insight) => insight.id === 'mental')

  assert.ok(withDepression.profileSuggestion.includes('Sister 1'))
  assert.equal(Boolean(withoutDepression?.profileSuggestion?.includes('Sister 1')), false)
  assert.equal(Boolean(withoutDepression?.profileSuggestion?.includes('Depression')), false)
})

test('old health-profile summary template can no longer be produced', () => {
  const familyMembers = [
    {
      conditions: [{ category: 'cardiovascular', diagnosisAge: '', name: 'High cholesterol' }],
      illnesses: ['High cholesterol'],
      relationship: 'Father',
      relationshipType: 'father',
    },
  ]
  const familyHealthSummary = buildFamilyHealthSummary({ familyMembers })
  const summary = buildPersonalizedPreventionSummary({
    familyHealthSummary,
    familyMembers,
    preventionScore: {
      topPriorities: [{ id: 'movement', title: 'Build consistent movement' }],
    },
    profile: {
      smokingStatus: 'Never',
    },
  })

  assert.equal(summary.includes('Your family profile shows the clearest pattern'), false)
  assert.equal(summary.includes('positive preventive signal'), false)
  assert.equal(summary.includes('may benefit from learning more'), false)
  assert.equal(summary.includes('sharing relevant family history during a future healthcare visit'), false)
  assert.equal(summary.includes('..'), false)
})

test('unsupported positive habits are not forced into unrelated health areas', () => {
  const kidneyInsight = buildInsightsForMembers({
    familyMembers: [
      {
        conditions: [{ category: 'cancer', diagnosisAge: '', name: 'Kidney cancer' }],
        illnesses: ['Kidney cancer'],
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
      },
    ],
    profile: {
      sugaryDrinks: 'Rarely',
    },
  }).find((insight) => insight.id === 'kidney')

  assert.equal(kidneyInsight.positiveSignalId, 'fallback')
  assert.equal(kidneyInsight.positiveFactors[0].includes('sugary drinks'), false)
})

test('health profile insights show exactly three prevention habits without administrative items', () => {
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers: [
      { illnesses: ['Breast cancer'], relationship: 'Mother' },
      { illnesses: ['Asthma'], relationship: 'Father' },
      { illnesses: ['Type 2 diabetes'], relationship: 'Grandparent' },
      { illnesses: ['High blood pressure'], relationship: 'Sibling' },
    ],
  })
  const insights = buildPreventionInsights({
    familyHealthSummary,
    profile: {
      alcoholUse: 'Weekly',
      dietQuality: 'Fair',
      exercise: '3-5 days/week',
      fruitVegIntake: '2 servings',
      knownHighBloodPressure: 'Unknown',
      smokingStatus: 'Never',
      stressLevel: 'High',
    },
  })
  const administrativeTerms = ['family-history accuracy', 'update your profile', 'add more relatives', 'review your family tree']

  insights.forEach((insight) => {
    assert.equal(
      insight.keyPreventionHabits.length,
      3,
      `${insight.healthArea} should show exactly 3 habits`,
    )

    insight.keyPreventionHabits.forEach((habit) => {
      assert.equal(
        administrativeTerms.includes(habit.toLowerCase()),
        false,
        `${habit} should be a health-related prevention habit`,
      )
    })
  })
})

test('prevention habits adapt by health category and profile details', () => {
  const breastCancerInsight = getInsightsForConditionAndProfile('Breast cancer', {
    ageRange: '45-54',
    alcoholUse: 'Weekly',
    exercise: '3-5 days/week',
    sexAtBirth: 'Female',
    smokingStatus: 'Never',
  })[0]
  const heartInsight = getInsightsForConditionAndProfile('High blood pressure', {
    knownHighBloodPressure: 'Yes',
    smokingStatus: 'Current',
  })[0]
  const mentalInsight = getInsightsForConditionAndProfile('Depression', {
    sleep: 'Less than 6 hours',
    stressLevel: 'Very high',
  })[0]

  assert.deepEqual(breastCancerInsight.keyPreventionHabits, [
    'Stay physically active',
    'Limit alcohol when possible',
    'Keep up with age-appropriate screening conversations',
  ])
  assert.deepEqual(heartInsight.keyPreventionHabits, [
    'Pay attention to blood pressure',
    'Limit smoke and vaping exposure',
    'Stay physically active',
  ])
  assert.deepEqual(mentalInsight.keyPreventionHabits, [
    'Keep a consistent sleep routine',
    'Make time for stress management',
    'Stay socially connected',
  ])
})

test('positive factors avoid repeating exercise across multiple health profile categories', () => {
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers: [
      { illnesses: ['Breast cancer'], relationship: 'Mother' },
      { illnesses: ['Depression'], relationship: 'Father' },
      { illnesses: ['Asthma'], relationship: 'Grandparent' },
    ],
  })
  const insights = buildPreventionInsights({
    familyHealthSummary,
    profile: {
      alcoholUse: 'Occasionally',
      exercise: '3-5 days/week',
      sleep: '7-9 hours',
      smokingStatus: 'Never',
    },
  }).slice(0, 3)
  const positiveFactors = insights.map((insight) => insight.positiveFactors[0])
  const positiveSignalIds = insights.map((insight) => insight.positiveSignalId)

  assert.equal(insights.length, 3)
  assert.equal(new Set(positiveSignalIds).size, 3)
  assert.equal(
    positiveFactors.filter((factor) => factor.includes('regular physical activity')).length,
    0,
  )
  assert.ok(positiveFactors.some((factor) => factor.includes('limiting alcohol')))
  assert.ok(positiveFactors.some((factor) => factor.includes('sleep')))
  assert.ok(positiveFactors.some((factor) => factor.includes('smoking or vaping')))
})

test('positive factors are supported by actual user answers', () => {
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers: [
      { illnesses: ['Breast cancer'], relationship: 'Mother' },
      { illnesses: ['Asthma'], relationship: 'Father' },
      { illnesses: ['Depression'], relationship: 'Grandparent' },
    ],
  })
  const insights = buildPreventionInsights({
    familyHealthSummary,
    profile: {
      exercise: 'Rarely',
      smokingStatus: 'Current',
      sleep: 'Less than 6 hours',
    },
  })
  const positiveText = insights
    .flatMap((insight) => insight.positiveFactors)
    .join(' ')

  assert.equal(positiveText.includes('regular physical activity'), false)
  assert.equal(positiveText.includes('not currently smoking'), false)
  assert.equal(positiveText.includes('consistent sleep range'), false)
  assert.ok(
    insights.every((insight) =>
      insight.positiveFactors.includes(
        'Your answers give you a starting point for building habits that support this area.',
      ),
    ),
  )
})

test('different users can receive different positive factors for the same category', () => {
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers: [{ illnesses: ['High blood pressure'], relationship: 'Father' }],
  })
  const activeUserInsight = buildPreventionInsights({
    familyHealthSummary,
    profile: {
      exercise: '3-5 days/week',
      smokingStatus: 'Current',
    },
  })[0]
  const nonSmokingUserInsight = buildPreventionInsights({
    familyHealthSummary,
    profile: {
      exercise: 'Rarely',
      smokingStatus: 'Never',
    },
  })[0]

  assert.equal(activeUserInsight.healthArea, 'Heart Health')
  assert.equal(nonSmokingUserInsight.healthArea, 'Heart Health')
  assert.ok(activeUserInsight.positiveFactors[0].includes('regular physical activity'))
  assert.ok(nonSmokingUserInsight.positiveFactors[0].includes('not currently smoking'))
})

test('positive factor fallback appears when no relevant positive behavior exists', () => {
  const insight = getInsightsForConditionAndProfile('Asthma', {
    exercise: 'Rarely',
    smokingStatus: 'Current',
  })[0]

  assert.equal(
    insight.positiveFactors[0],
    'Your answers give you a starting point for building habits that support this area.',
  )
})

test('prevention insights avoid diagnostic language', () => {
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers: [
      { illnesses: ['Stroke'], relationship: 'Mother' },
      { illnesses: ['Asthma'], relationship: 'Sibling' },
      { illnesses: ['Depression'], relationship: 'Grandparent' },
      { illnesses: ['Type 2 diabetes'], relationship: 'Father' },
    ],
  })
  const insights = buildPreventionInsights({ familyHealthSummary })
  const combinedCopy = insights
    .map((insight) => insight.preventionInsight.toLowerCase())
    .join(' ')

  diagnosticPhrases.forEach((phrase) => {
    assert.equal(combinedCopy.includes(phrase), false)
  })
})

test('condition-specific variants cover breast, colon, cholesterol, and blood pressure', () => {
  assert.equal(getInsightsForCondition('Breast cancer')[0].healthArea, 'Breast Cancer Prevention')
  assert.equal(getInsightsForCondition('Colon cancer')[0].healthArea, 'Colon Cancer Prevention')
  assert.equal(getInsightsForCondition('High cholesterol')[0].healthArea, 'Heart Health')
  assert.equal(getInsightsForCondition('High blood pressure')[0].healthArea, 'Heart Health')
})

test('broad insight categories use prevention insight, strategies, and source', () => {
  const expected = [
    ['Stroke', 'Brain and Stroke Prevention'],
    ['Heart disease', 'Heart Health'],
    ['Asthma', 'Respiratory Health'],
    ['Depression', 'Mental Well-Being'],
    ['Type 2 diabetes', 'Diabetes Prevention'],
    ['Chronic Kidney Disease', 'Kidney Health'],
  ]

  expected.forEach(([conditionName, expectedTitle]) => {
    const insight = getInsightsForCondition(conditionName).find(
      (candidate) => candidate.healthArea === expectedTitle,
    )

    assert.ok(insight, `${expectedTitle} insight should be present`)
    assert.ok(insight.preventionInsight)
    assert.ok(insight.strategies.length >= 3)
    assert.ok(insight.sourceName)
  })
})

test('inapplicable organ-specific family conditions do not create health-profile cards', () => {
  const cases = [
    ['Prostate cancer', 'Female'],
    ['Testicular cancer', 'Female'],
    ['Ovarian cancer', 'Male'],
    ['Cervical cancer', 'Male'],
  ]

  cases.forEach(([conditionName, sexAtBirth]) => {
    const insights = getInsightsForConditionAndProfile(conditionName, {
      sexAtBirth,
    })

    assert.equal(
      insights.some((insight) => insight.id === 'cancer'),
      false,
      `${conditionName} should be filtered for sex at birth ${sexAtBirth}`,
    )
  })
})

test('unknown eligibility does not create organ-specific cards', () => {
  for (const conditionName of [
    'Prostate cancer',
    'Testicular cancer',
    'Ovarian cancer',
    'Cervical cancer',
  ]) {
    assert.equal(
      getInsightsForConditionAndProfile(conditionName, {
        sexAtBirth: 'Prefer not to answer',
      }).some((insight) => insight.id === 'cancer'),
      false,
    )
  }
})

test('breast-cancer family history remains visible without unsupported screening guidance', () => {
  const insight = getInsightsForConditionAndProfile('Breast cancer', {
    ageRange: '30-44',
    sexAtBirth: 'Male',
  }).find((candidate) => candidate.healthArea === 'Breast Cancer Prevention')

  assert.ok(insight)
  assert.equal(
    [...insight.keyPreventionHabits, ...insight.strategies].some((item) =>
      /screen/i.test(item),
    ),
    false,
  )
})
