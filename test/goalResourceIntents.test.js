import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildPrivacySafeResourceQuery,
  getGoalAction,
  getGoalPrimaryActionLabel,
  getResourceIntentForGoal,
  groupResourcesByGoalRelevance,
  getTrustedResourcesForGoalIntent,
  rankResourcesForGoalIntent,
} from '../src/goalResourceIntents.js'

const bayAreaLocation = {
  city: 'Berkeley',
  zipCode: '94704',
}

function goal(label, reason = '') {
  return {
    label,
    reason,
  }
}

function resource({
  city = 'San Francisco',
  distanceMiles = 4,
  id,
  isLocalCity = true,
  resourceType = 'education',
  source = 'Community Health',
  title,
}) {
  return {
    city,
    distanceMiles,
    eventLink: `https://example.test/${id}`,
    id,
    isLocalCity,
    resourceType,
    source,
    title,
  }
}

test('air-quality goals map to AirNow and exclude unrelated local resources', () => {
  const airQualityGoal = goal("Check today's air quality before outdoor exercise.")
  const intent = getResourceIntentForGoal(airQualityGoal, {
    topPriorities: [{ id: 'respiratory', title: 'Respiratory Health' }],
  })
  const trustedResources = getTrustedResourcesForGoalIntent(intent, bayAreaLocation)
  const ranked = rankResourcesForGoalIntent(
    [
      ...trustedResources,
      resource({ id: 'park', resourceType: 'park', title: 'Neighborhood Park' }),
      resource({
        id: 'cancer',
        resourceType: 'trusted_organization',
        source: 'American Cancer Society',
        title: 'American Cancer Society',
      }),
    ],
    intent,
    airQualityGoal,
  )

  assert.equal(intent.resourceIntent, 'air-quality')
  assert.equal(intent.resourceNeeded, true)
  assert.equal(getGoalPrimaryActionLabel(airQualityGoal), 'Check Air Quality')
  assert.equal(ranked[0].source, 'AirNow Local Air Quality')
  assert.equal(ranked.some((item) => item.id === 'park'), false)
  assert.equal(ranked.some((item) => item.id === 'cancer'), false)
})

test('breast screening goals prioritize breast-specific screening resources', () => {
  const screeningGoal = goal(
    'Read about breast cancer screening recommendations.',
    'Included because breast cancer appears in your family history.',
  )
  const intent = getResourceIntentForGoal(screeningGoal, {
    familyMembers: [{ illnesses: ['Breast cancer'], relationship: 'Mother' }],
  })
  const ranked = rankResourcesForGoalIntent(
    [
      resource({ id: 'vaccine', resourceType: 'vaccine_clinic', title: 'Free Vaccine Clinic' }),
      resource({
        id: 'mammogram',
        resourceType: 'screening',
        title: 'Mammogram and Breast Screening Program',
      }),
      ...getTrustedResourcesForGoalIntent(intent),
    ],
    intent,
    screeningGoal,
  )

  assert.equal(intent.resourceIntent, 'breast-screening')
  assert.equal(intent.resourceNeeded, true)
  assert.equal(ranked[0].id, 'mammogram')
  assert.equal(ranked.some((item) => item.id === 'vaccine'), false)
})

test('breast screening location goals use mammography-facility intent', () => {
  const locationGoal = goal(
    'Find a place for breast cancer screening.',
    'Selected because breast cancer is one of the strongest family-health themes in your profile.',
  )
  const mammogramGoal = goal('Learn where to get a mammogram.')
  const intent = getResourceIntentForGoal(locationGoal, {
    familyMembers: [{ illnesses: ['Breast cancer'], relationship: 'Mother' }],
  })

  assert.equal(intent.resourceIntent, 'mammography-facility')
  assert.equal(intent.resourceNeeded, true)
  assert.equal(intent.locationRequired, true)
  assert.equal(getGoalPrimaryActionLabel(locationGoal), 'Find Screening Locations')
  assert.equal(getResourceIntentForGoal(mammogramGoal).resourceIntent, 'mammography-facility')
})

test('mammography-facility goals rank FDA facilities above generic education', () => {
  const screeningGoal = goal('Find a mammogram location.')
  const intent = getResourceIntentForGoal(screeningGoal)
  const ranked = rankResourcesForGoalIntent(
    [
      resource({
        id: 'acs',
        resourceType: 'trusted_goal_resource',
        source: 'American Cancer Society Breast Cancer Screening',
        title: 'American Cancer Society Breast Cancer Screening',
      }),
      resource({
        id: 'fda-facility',
        resourceType: 'mammography_facility',
        source: 'FDA Mammography Facility Database',
        title: 'UCSF Medical Center Mt Zion',
      }),
      resource({ id: 'park', resourceType: 'park', title: 'City Park' }),
    ],
    intent,
    screeningGoal,
  )

  assert.equal(ranked[0].id, 'fda-facility')
  assert.equal(ranked.some((item) => item.id === 'park'), false)
})

test('colorectal screening goals prioritize colorectal resources', () => {
  const screeningGoal = goal(
    'Read about colon cancer screening recommendations.',
    'Included because colon cancer appears in your family history.',
  )
  const intent = getResourceIntentForGoal(screeningGoal, {
    familyMembers: [{ illnesses: ['Colon cancer'], relationship: 'Grandparent' }],
  })
  const ranked = rankResourcesForGoalIntent(
    [
      resource({
        id: 'colorectal',
        resourceType: 'screening',
        title: 'Colorectal Cancer Screening Workshop',
      }),
      resource({ id: 'park', resourceType: 'park', title: 'City Park' }),
      ...getTrustedResourcesForGoalIntent(intent),
    ],
    intent,
    screeningGoal,
  )

  assert.equal(intent.resourceIntent, 'colorectal-screening')
  assert.equal(ranked[0].id, 'colorectal')
  assert.equal(ranked.some((item) => item.id === 'park'), false)
})

test('walking goals map to physical activity resources', () => {
  const walkGoal = goal('Take a 20-minute walk.')
  const intent = getResourceIntentForGoal(walkGoal)
  const ranked = rankResourcesForGoalIntent(
    [
      resource({ id: 'trail', resourceType: 'trail', title: 'Lakeside Walking Trail' }),
      resource({ id: 'nutrition', resourceType: 'nutrition_class', title: 'Healthy Cooking Class' }),
    ],
    intent,
    walkGoal,
  )

  assert.equal(intent.resourceIntent, 'physical-activity')
  assert.equal(getGoalAction(walkGoal).resourceType, 'physical-activity')
  assert.equal(getGoalPrimaryActionLabel(walkGoal), 'Find Parks & Trails')
  assert.equal(ranked[0].id, 'trail')
})

test('blood-pressure recommendations map to blood pressure options', () => {
  const bloodPressureGoal = {
    evidenceId: 'cdc-blood-pressure',
    label: 'Know your blood pressure.',
    resourceIntent: 'cardiovascular-screening',
    resourceType: 'blood_pressure_options',
  }
  const action = getGoalAction(bloodPressureGoal)
  const intent = getResourceIntentForGoal(bloodPressureGoal)

  assert.equal(action.evidenceId, 'cdc-blood-pressure')
  assert.equal(action.resourceType, 'blood_pressure_options')
  assert.equal(action.resourceIntent, 'cardiovascular-screening')
  assert.equal(getGoalPrimaryActionLabel(bloodPressureGoal), 'Find Blood Pressure Options')
  assert.equal(intent.resourceNeeded, true)
})

test('walking goals that would require a place search show nearby walking actions', () => {
  const walkGoal = goal(
    'Take a short walk for a mental reset.',
    'Selected because mental well-being is one of the strongest themes in your profile.',
  )
  const intent = getResourceIntentForGoal(walkGoal, {
    topPriorities: [{ id: 'mental-wellness', title: 'Mental Well-Being' }],
  })
  const ranked = rankResourcesForGoalIntent(
    [
      resource({
        distanceMiles: 4,
        id: 'clinic',
        resourceType: 'clinic',
        title: 'Community Health Clinic',
      }),
      resource({
        distanceMiles: 2.4,
        id: 'trail',
        resourceType: 'trail',
        title: 'Lake Merced Walking Trail',
      }),
      resource({
        distanceMiles: 1.2,
        id: 'park',
        resourceType: 'park',
        title: 'Golden Gate Park Walking Paths',
      }),
    ],
    intent,
    walkGoal,
  )
  const sections = groupResourcesByGoalRelevance(ranked, intent)

  assert.equal(intent.resourceIntent, 'physical-activity')
  assert.equal(intent.resourceNeeded, true)
  assert.equal(getGoalPrimaryActionLabel(walkGoal), 'Find Parks & Trails')
  assert.equal(sections[0].label, 'Parks & Trails Near You')
  assert.deepEqual(
    ranked.map((item) => item.id),
    ['park', 'trail'],
  )
})

test('saved walking goals with an old false resource flag still open parks and trails', () => {
  const savedWalkGoal = {
    label: 'Take a 15-minute walk.',
    resourceIntent: 'physical-activity',
    resourceNeeded: false,
  }
  const plannedActivityGoal = {
    label: 'Complete your planned physical activity today.',
    resourceIntent: 'physical-activity',
    resourceNeeded: false,
  }

  assert.equal(getResourceIntentForGoal(savedWalkGoal).resourceNeeded, true)
  assert.equal(getGoalPrimaryActionLabel(savedWalkGoal), 'Find Parks & Trails')
  assert.equal(getResourceIntentForGoal(plannedActivityGoal).resourceNeeded, false)
})

test('nutrition goals map to food and nutrition resources without parks', () => {
  const nutritionGoal = goal('Add one fiber-rich food to a meal today.')
  const intent = getResourceIntentForGoal(nutritionGoal)
  const ranked = rankResourcesForGoalIntent(
    [
      resource({ id: 'park', resourceType: 'park', title: 'Neighborhood Park' }),
      resource({ id: 'market', resourceType: 'farmers_market', title: 'Farmers Market Produce Stand' }),
      ...getTrustedResourcesForGoalIntent(intent),
    ],
    intent,
    nutritionGoal,
  )

  assert.equal(intent.resourceIntent, 'nutrition')
  assert.equal(ranked[0].id, 'market')
  assert.equal(ranked.some((item) => item.id === 'park'), false)
})

test('mental-wellness goals map to mindfulness and wellness resources', () => {
  const wellnessGoal = goal('Practice 10 minutes of stress reduction today.')
  const intent = getResourceIntentForGoal(wellnessGoal)
  const ranked = rankResourcesForGoalIntent(
    [
      resource({ id: 'meditation', resourceType: 'wellness', title: 'Community Mindfulness Class' }),
      resource({ id: 'screening', resourceType: 'screening', title: 'Blood Pressure Screening' }),
    ],
    intent,
    wellnessGoal,
  )

  assert.equal(intent.resourceIntent, 'mental-wellness')
  assert.equal(ranked[0].id, 'meditation')
})

test('respiratory and smoking goals map to different resource intents', () => {
  const respiratoryGoal = goal('Read one respiratory-health prevention tip.')
  const quitGoal = goal('Look up one quit-support resource today.')

  assert.equal(getResourceIntentForGoal(respiratoryGoal).resourceIntent, 'respiratory')
  assert.equal(getResourceIntentForGoal(quitGoal).resourceIntent, 'smoking-cessation')
  assert.equal(getGoalPrimaryActionLabel(quitGoal), 'Find Quit-Support Resources')
})

test('family-history goals are the only tested goals that open the Family Health Tree', () => {
  const familyGoal = goal('Review your family history for any updates.')
  const intent = getResourceIntentForGoal(familyGoal)
  const action = getGoalAction(familyGoal)

  assert.equal(intent.resourceIntent, 'family-history')
  assert.equal(intent.target, 'family')
  assert.equal(action.resourceType, 'family-history')
  assert.equal(getGoalPrimaryActionLabel(familyGoal), 'Open Family Health Tree')
})

test('sleep and alcohol goals prefer trusted guidance instead of forced local places', () => {
  const sleepIntent = getResourceIntentForGoal(goal('Set a consistent bedtime for tonight.'))
  const alcoholIntent = getResourceIntentForGoal(goal('Choose an alcohol-free day today.'))

  assert.equal(sleepIntent.resourceIntent, 'sleep')
  assert.equal(alcoholIntent.resourceIntent, 'alcohol')
  assert.equal(sleepIntent.resourceNeeded, false)
  assert.equal(alcoholIntent.resourceNeeded, false)
  assert.deepEqual(getTrustedResourcesForGoalIntent(sleepIntent), [])
  assert.deepEqual(getTrustedResourcesForGoalIntent(alcoholIntent), [])
})

test('self-contained daily goals do not request resource actions', () => {
  const bedtimeGoal = goal('Set a consistent bedtime for tonight.')
  const mindfulGoal = goal('Take a short mindful break.')
  const alcoholGoal = goal('Limit alcohol today.')
  const vegetableGoal = goal('Add vegetables to one meal.')
  const familyGoal = goal('Review your family history for any updates.')

  assert.equal(getGoalAction(bedtimeGoal).resourceNeeded, false)
  assert.equal(getGoalAction(mindfulGoal).resourceNeeded, false)
  assert.equal(getGoalAction(alcoholGoal).resourceNeeded, false)
  assert.equal(getGoalAction(vegetableGoal).resourceNeeded, false)
  assert.equal(getGoalAction(familyGoal).resourceNeeded, true)
})

test('privacy-safe resource queries include only resource intent and location', () => {
  const intent = getResourceIntentForGoal({
    label: 'Take a 20-minute walk.',
    reason: 'Heart Health is highlighted because your father has heart disease.',
  })
  const query = buildPrivacySafeResourceQuery(intent, {
    city: 'San Francisco',
    zipCode: '94127',
  })

  assert.equal(query, 'parks and walking trails near 94127')
  assert.equal(query.includes('father'), false)
  assert.equal(query.includes('heart disease'), false)
})

test('screening and air-quality intents produce distinct safe queries', () => {
  const screeningIntent = getResourceIntentForGoal({
    label: 'Find a place for breast cancer screening.',
    resourceIntent: 'mammography-facility',
  })
  const airQualityIntent = getResourceIntentForGoal({
    label: "Check today's local air quality before outdoor exercise.",
  })

  assert.equal(
    buildPrivacySafeResourceQuery(screeningIntent, { zipCode: '94127' }),
    'mammography facilities near 94127',
  )
  assert.equal(
    buildPrivacySafeResourceQuery(airQualityIntent, { city: 'Berkeley' }),
    'air quality near Berkeley',
  )
})

test('external-tool goals expose the appropriate action labels', () => {
  const airQualityGoal = goal('Check air quality before a walk.')
  const screeningGoal = goal(
    'Learn about breast cancer screening recommendations.',
    'Included because breast cancer appears in your family history.',
  )
  const walkingGoal = goal('Find a place for a 20-minute walk.')
  const bloodPressureGoal = goal('Know your blood pressure.')
  const cholesterolGoal = goal('Learn your cholesterol status.')

  assert.equal(getGoalAction(airQualityGoal).resourceNeeded, true)
  assert.equal(getGoalPrimaryActionLabel(airQualityGoal), 'Check Air Quality')
  assert.equal(getGoalAction(screeningGoal).resourceNeeded, true)
  assert.equal(getGoalPrimaryActionLabel(screeningGoal), 'View Screening Guidance')
  assert.equal(getGoalAction(walkingGoal).resourceNeeded, true)
  assert.equal(getGoalPrimaryActionLabel(walkingGoal), 'Find Parks & Trails')
  assert.equal(getGoalPrimaryActionLabel(bloodPressureGoal), 'Find Blood Pressure Options')
  assert.equal(getGoalPrimaryActionLabel(cholesterolGoal), 'Find Cholesterol Options')
})

test('different profiles produce meaningfully different resource recommendations', () => {
  const genericScreeningGoal = goal('Learn about screening recommendations.')
  const respiratoryGoal = goal("Check today's air quality before outdoor exercise.")
  const nutritionGoal = goal('Look for a local nutrition class.')
  const breastIntent = getResourceIntentForGoal(genericScreeningGoal, {
    familyMembers: [{ illnesses: ['Breast cancer'], relationship: 'Mother' }],
  })
  const respiratoryIntent = getResourceIntentForGoal(respiratoryGoal, {
    familyMembers: [{ illnesses: ['Asthma'], relationship: 'Father' }],
  })
  const nutritionIntent = getResourceIntentForGoal(nutritionGoal, {
    fruitVegIntake: '0-1 servings',
  })

  assert.equal(breastIntent.resourceIntent, 'breast-screening')
  assert.equal(respiratoryIntent.resourceIntent, 'air-quality')
  assert.equal(nutritionIntent.resourceIntent, 'nutrition')
  assert.notEqual(
    getTrustedResourcesForGoalIntent(breastIntent)[0].source,
    getTrustedResourcesForGoalIntent(respiratoryIntent, bayAreaLocation)[0].source,
  )
  assert.notEqual(
    getTrustedResourcesForGoalIntent(respiratoryIntent, bayAreaLocation)[0].source,
    getTrustedResourcesForGoalIntent(nutritionIntent)[0].source,
  )
})
