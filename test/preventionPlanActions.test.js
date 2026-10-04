import assert from 'node:assert/strict'
import test from 'node:test'

import { getResourceIntentForGoal } from '../src/goalResourceIntents.js'
import {
  arePreventionActionsSemanticallyDuplicate,
  buildPreventionActionPlan,
  buildPreventionProgressSummary,
  isWeeklyPlanningAction,
} from '../src/preventionPlanActions.js'

const heartInsight = {
  healthArea: 'Heart Health',
  id: 'cardiovascular',
  personalizedFactors: ['Blood pressure awareness', 'Cholesterol awareness'],
  profileSuggestion: 'Heart-health patterns include blood pressure and cholesterol.',
}

const cancerInsight = {
  healthArea: 'Cancer Prevention',
  id: 'cancer',
  personalizedFactors: ['Age-appropriate screening conversations'],
  profileSuggestion: 'Cancer prevention is highlighted by family history.',
}

const respiratoryInsight = {
  healthArea: 'Respiratory Health',
  id: 'respiratory',
  personalizedFactors: ['Air quality before outdoor activity'],
  profileSuggestion: 'Respiratory conditions appear in family history.',
}

test('prevention plan separates today, week, and month actions', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '52', name: 'Breast cancer' }],
        relationshipType: 'maternal-grandmother',
      },
    ],
    preventionInsights: [cancerInsight, heartInsight],
    profile: {
      ageRange: '45-54',
      exercise: 'Rarely',
      fruitVegIntake: '0-1 servings',
      knownHighBloodPressure: 'Unknown',
      sexAtBirth: 'Female',
    },
  })

  assert.ok(plan.today.some((action) => action.label.includes('20-minute walk')))
  assert.ok(plan.thisWeek.some((action) => action.label.includes('150 minutes')))
  assert.ok(plan.today.some((action) => action.label.includes('fruit or vegetable')))
  assert.ok(plan.thisMonth.some((action) => action.label.includes('blood pressure')))
  assert.ok(plan.thisMonth.some((action) => action.label.includes('breast screening')))
  assert.equal(plan.today.some((action) => action.label.includes('breast screening')), false)
  assert.equal(plan.thisWeek.some((action) => action.label.includes('20-minute walk')), false)
})

test('plan actions carry explicit resource intent only when external support is useful', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '52', name: 'Asthma' }],
        relationshipType: 'father',
      },
    ],
    preventionInsights: [respiratoryInsight],
    profile: {
      dietQuality: 'Fair',
      exercise: 'Rarely',
      stressLevel: 'High',
    },
  })
  const walkAction = plan.today.find((action) => action.label.includes('20-minute walk'))
  const produceAction = plan.today.find((action) => action.label.includes('fruit or vegetable'))
  const airQualityAction = plan.today.find((action) => action.label.includes('air quality'))
  const stressPlan = buildPreventionActionPlan({
    familyMembers: [],
    preventionInsights: [],
    profile: {
      stressLevel: 'High',
    },
  })
  const stressAction = stressPlan.today.find((action) => action.label.includes('mental reset'))

  assert.equal(walkAction.resourceIntent, 'physical-activity')
  assert.equal(getResourceIntentForGoal(walkAction).resourceIntent, 'physical-activity')
  assert.equal(getResourceIntentForGoal(walkAction).resourceNeeded, true)
  assert.equal(airQualityAction.resourceIntent, 'air-quality')
  assert.equal(getResourceIntentForGoal(airQualityAction).resourceNeeded, true)
  assert.equal(produceAction.resourceNeeded, false)
  assert.equal(getResourceIntentForGoal(produceAction).resourceNeeded, false)
  assert.equal(stressAction.resourceNeeded, false)
  assert.equal(getResourceIntentForGoal(stressAction).resourceNeeded, false)
})

test('family-history missing diagnosis-age action routes to the family tree', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '', name: 'Colon cancer' }],
        relationshipType: 'maternal-grandmother',
      },
    ],
    preventionInsights: [cancerInsight],
    profile: {},
  })
  const familyHistoryAction = plan.thisMonth.find((action) =>
    action.label.includes('diagnosed with Colon cancer'),
  )
  const weeklyFamilyHistoryAction = plan.thisWeek.find((action) =>
    action.label.includes('missing diagnosis age'),
  )
  const intent = getResourceIntentForGoal(familyHistoryAction)

  assert.equal(familyHistoryAction.resourceIntent, 'family-history')
  assert.equal(intent.resourceIntent, 'family-history')
  assert.equal(intent.resourceNeeded, true)
  assert.equal(weeklyFamilyHistoryAction.resourceIntent, 'family-history')
  assert.equal(getResourceIntentForGoal(weeklyFamilyHistoryAction).resourceNeeded, true)
})

test('completed month actions remain visible in the active plan', () => {
  const plan = buildPreventionActionPlan({
    completedActionIds: ['month-know-blood-pressure'],
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      knownHighBloodPressure: 'Yes',
    },
  })

  assert.equal(plan.thisMonth.some((action) => action.id === 'month-know-blood-pressure'), true)
  assert.ok(plan.thisMonth.some((action) => action.id === 'month-learn-cholesterol-status'))
})

test('daily plan returns three to four distinct action categories when profile data supports it', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '52', name: 'Breast cancer' }],
        relationshipType: 'mother',
      },
      {
        conditions: [{ diagnosisAge: '61', name: 'Asthma' }],
        relationshipType: 'father',
      },
    ],
    preventionInsights: [heartInsight, cancerInsight, respiratoryInsight],
    profile: {
      exercise: 'Rarely',
      fruitVegIntake: '0-1 servings',
      knownHighBloodPressure: 'Yes',
      sleep: '7-8 hours',
      stressLevel: 'High',
    },
  })
  const categories = new Set(plan.today.map((action) => action.category))

  assert.equal(plan.today.length, 4)
  assert.equal(categories.size, plan.today.length)
  assert.ok(plan.today.some((action) => action.label.includes('20-minute walk')))
  assert.ok(plan.today.some((action) => action.label.includes('fruit or vegetable')))
  assert.ok(plan.today.some((action) => action.label.includes('air quality')))
})

test('weekly plan returns distinct multi-day actions without duplicating daily wording', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '', name: 'Breast cancer' }],
        relationshipType: 'maternal-grandmother',
      },
    ],
    preventionInsights: [cancerInsight, heartInsight],
    profile: {
      exercise: 'Rarely',
      fruitVegIntake: '0-1 servings',
      sleep: 'Less than 6 hours',
      sugaryDrinks: 'Most days',
    },
  })
  const weeklyCategories = new Set(plan.thisWeek.map((action) => action.category))

  assert.equal(plan.thisWeek.length, 3)
  assert.equal(weeklyCategories.size, plan.thisWeek.length)
  assert.ok(plan.thisWeek.some((action) => action.label.includes('150 minutes')))
  assert.ok(plan.thisWeek.some((action) => action.label.includes('5 days')))
  assert.equal(
    plan.thisWeek.some((action) => action.label === 'Take a 20-minute walk.'),
    false,
  )
  assert.equal(plan.thisWeek.every(isWeeklyPlanningAction), true)
})

test('weekly actions require planning, cumulative effort, or an external resource', () => {
  assert.equal(
    isWeeklyPlanningAction({
      label: 'Take a 20-minute walk.',
      timeframe: 'week',
    }),
    false,
  )
  assert.equal(
    isWeeklyPlanningAction({
      label: 'Complete 150 minutes of activity this week.',
      target: { targetMinutes: 150, targetSessions: 5 },
      timeframe: 'week',
    }),
    true,
  )
  assert.equal(
    isWeeklyPlanningAction({
      label: 'Review a relevant screening guideline.',
      resourceNeeded: true,
      timeframe: 'week',
    }),
    true,
  )
})

test('prevention dashboard actions avoid unsupported plan wording and vague weekly quantities', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      dietQuality: 'Fair',
      exercise: '3-5 days/week',
      sleep: '7-8 hours',
      sugaryDrinks: 'Most days',
    },
  })
  const labels = [...plan.today, ...plan.thisWeek, ...plan.thisMonth].map(
    (action) => action.label,
  )
  const labelText = labels.join(' ')

  assert.equal(/planned physical activity|planned workout|exercise plan|activity target/i.test(labelText), false)
  assert.equal(/stay active on several days|several sugary drinks|most nights/i.test(labelText), false)
  assert.ok(plan.today.some((action) => action.label === 'Take a 20-minute walk.'))
  assert.ok(
    plan.thisWeek.some((action) =>
      action.label.includes('20 minutes of moderate physical activity on 3 days'),
    ),
  )
  assert.ok(
    plan.thisWeek.some((action) =>
      action.label.includes('sugary drink at least 3 times'),
    ),
  )
})

test('weekly sugary-drink action is not generated when the profile does not support it', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      exercise: 'Rarely',
      sleep: '7-8 hours',
      sugaryDrinks: 'Rarely',
    },
  })

  assert.equal(
    plan.thisWeek.some((action) => action.label.includes('sugary drink')),
    false,
  )
})

test('distinct profiles receive meaningfully different prevention plans', () => {
  const cancerPlan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '47', name: 'Breast cancer' }],
        relationshipType: 'mother',
      },
    ],
    preventionInsights: [cancerInsight],
    profile: {
      ageRange: '45-54',
      alcoholUse: 'Rarely',
      exercise: '3-5 days/week',
      sexAtBirth: 'Female',
    },
  })
  const respiratoryPlan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '61', name: 'Asthma' }],
        relationshipType: 'father',
      },
    ],
    preventionInsights: [respiratoryInsight],
    profile: {
      exercise: 'Rarely',
    },
  })
  const heartPlan = buildPreventionActionPlan({
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      knownHighBloodPressure: 'Yes',
      knownHighCholesterol: 'Yes',
    },
  })

  assert.notDeepEqual(
    cancerPlan.thisMonth.map((action) => action.label),
    respiratoryPlan.thisMonth.map((action) => action.label),
  )
  assert.ok(cancerPlan.thisMonth.some((action) => action.resourceIntent === 'mammography-facility'))
  assert.ok(cancerPlan.thisMonth.some((action) => action.resourceIntent === 'breast-screening'))
  assert.ok(respiratoryPlan.today.some((action) => action.resourceIntent === 'air-quality'))
  assert.ok(heartPlan.thisMonth.some((action) => action.label.includes('cholesterol')))
})

test('one low-completion week does not immediately adapt weekly physical activity', () => {
  const plan = buildPreventionActionPlan({
    actionHistory: [
      {
        adaptationLevel: 0,
        completionAmount: 1,
        dateAssigned: '2026-08-16',
        goalId: 'week-physical-activity-target',
        goalType: 'weekly-physical-activity',
        period: 'week',
        recentCompletionRate: 0.33,
        target: { targetSessions: 3 },
      },
    ],
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      exercise: 'Rarely',
    },
  })

  assert.ok(
    plan.thisWeek.some((action) =>
      action.label.includes('150 minutes of moderate physical activity'),
    ),
  )
})

test('two consecutive low-completion weeks make physical activity easier next week', () => {
  const lowHistory = ['2026-08-09', '2026-08-16'].map((dateAssigned) => ({
    adaptationLevel: 0,
    completionAmount: 1,
    dateAssigned,
    goalId: 'week-physical-activity-target',
    goalType: 'weekly-physical-activity',
    period: 'week',
    recentCompletionRate: 0.33,
    target: { targetSessions: 3 },
  }))
  const plan = buildPreventionActionPlan({
    actionHistory: lowHistory,
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      exercise: 'Rarely',
    },
  })
  const movementAction = plan.thisWeek.find(
    (action) => action.goalType === 'weekly-physical-activity',
  )

  assert.equal(
    movementAction.label,
    'Do at least 15 minutes of moderate physical activity on 3 days this week.',
  )
  assert.equal(movementAction.adaptationLevel, 1)
})

test('continued low completion steps physical activity down without changing category', () => {
  const lowHistory = ['2026-08-09', '2026-08-16'].map((dateAssigned) => ({
    adaptationLevel: 1,
    completionAmount: 1,
    dateAssigned,
    goalId: 'week-physical-activity-15x3',
    goalType: 'weekly-physical-activity',
    period: 'week',
    recentCompletionRate: 0.33,
    target: { targetSessions: 3 },
  }))
  const plan = buildPreventionActionPlan({
    actionHistory: lowHistory,
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      exercise: 'Rarely',
    },
  })
  const movementAction = plan.thisWeek.find(
    (action) => action.goalType === 'weekly-physical-activity',
  )

  assert.equal(movementAction.category, 'Weekly Movement')
  assert.equal(movementAction.label, 'Take three 10-minute walks this week.')
  assert.equal(movementAction.resourceIntent, 'physical-activity')
})

test('high completion can progress adapted physical activity without escalating indefinitely', () => {
  const completedHistory = ['2026-08-02', '2026-08-09', '2026-08-16'].map(
    (dateAssigned) => ({
      adaptationLevel: 2,
      completionAmount: 3,
      completionStatus: 'complete',
      dateAssigned,
      goalId: 'week-physical-activity-10x3',
      goalType: 'weekly-physical-activity',
      period: 'week',
      recentCompletionRate: 1,
      target: { targetSessions: 3 },
    }),
  )
  const plan = buildPreventionActionPlan({
    actionHistory: completedHistory,
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      exercise: 'Rarely',
    },
  })
  const movementAction = plan.thisWeek.find(
    (action) => action.goalType === 'weekly-physical-activity',
  )

  assert.equal(
    movementAction.label,
    'Do at least 15 minutes of moderate physical activity on 3 days this week.',
  )
  assert.equal(movementAction.adaptationLevel, 1)
})

test('nutrition and sleep weekly goals adapt after repeated low completion', () => {
  const actionHistory = ['2026-08-09', '2026-08-16'].flatMap((dateAssigned) => [
    {
      adaptationLevel: 0,
      completionAmount: 1,
      dateAssigned,
      goalId: 'week-produce-5-days',
      goalType: 'weekly-nutrition-produce',
      period: 'week',
      recentCompletionRate: 0.2,
      target: { days: 5 },
    },
    {
      adaptationLevel: 0,
      completionAmount: 1,
      dateAssigned,
      goalId: 'week-consistent-sleep-5-nights',
      goalType: 'weekly-sleep-consistency',
      period: 'week',
      recentCompletionRate: 0.2,
      target: { days: 5 },
    },
  ])
  const plan = buildPreventionActionPlan({
    actionHistory,
    familyMembers: [],
    preventionInsights: [heartInsight],
    profile: {
      dietQuality: 'Fair',
      exercise: 'Daily',
      sleep: 'Less than 6 hours',
    },
  })

  assert.ok(
    plan.thisWeek.some((action) =>
      action.label.includes('one meal on 3 days this week'),
    ),
  )
  assert.ok(
    plan.thisWeek.some((action) =>
      action.label.includes('same 1-hour window on 3 nights'),
    ),
  )
})

test('family-history weekly goals adapt to a respectful alternative after low completion', () => {
  const actionHistory = ['2026-08-09', '2026-08-16'].map((dateAssigned) => ({
    adaptationLevel: 0,
    completionAmount: 0,
    dateAssigned,
    goalId: 'week-missing-age-maternal-grandmother-breast-cancer',
    goalType: 'weekly-family-history',
    period: 'week',
    recentCompletionRate: 0,
    target: { count: 1 },
  }))
  const plan = buildPreventionActionPlan({
    actionHistory,
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '', name: 'Breast cancer' }],
        relationshipType: 'maternal-grandmother',
      },
    ],
    preventionInsights: [cancerInsight],
    profile: {},
  })

  assert.ok(
    plan.thisWeek.some((action) =>
      action.label.includes('Review the family-health information you already know'),
    ),
  )
})

test('prevention progress summary uses recent action history without creating a health score', () => {
  const progress = buildPreventionProgressSummary([
    {
      completionStatus: 'complete',
      dateAssigned: '2026-08-02',
      goalId: 'week-physical-activity-10x3',
      goalType: 'weekly-physical-activity',
      period: 'week',
      recentCompletionRate: 1,
    },
    {
      completionStatus: 'complete',
      dateAssigned: '2026-08-09',
      goalId: 'week-physical-activity-10x3',
      goalType: 'weekly-physical-activity',
      period: 'week',
      recentCompletionRate: 1,
    },
  ])

  assert.deepEqual(progress, [
    {
      goalType: 'weekly-physical-activity',
      label: 'Physical activity',
      status: '2 of 2 recent weekly goals completed',
    },
  ])
  assert.equal(progress.some((item) => item.status.includes('/100')), false)
})

test('low recent completion uses supportive personalized wording', () => {
  const progress = buildPreventionProgressSummary([
    {
      completionAmount: 0,
      dateAssigned: '2026-08-16',
      goalId: 'week-physical-activity-target',
      goalType: 'weekly-physical-activity',
      period: 'week',
      target: { targetSessions: 3 },
    },
  ])

  assert.equal(progress[0]?.status, 'Personalized to your profile')
  assert.equal(
    progress.some((item) => item.status === 'Adjusted for manageability'),
    false,
  )
})

test('today and this week never contain semantically duplicated actions', () => {
  const plan = buildPreventionActionPlan({
    familyMembers: [
      {
        conditions: [{ diagnosisAge: '', name: 'High cholesterol' }],
        relationshipType: 'father',
      },
    ],
    preventionInsights: [heartInsight],
    profile: {
      ageRange: '45-54',
      dietQuality: 'Fair',
      exercise: 'Rarely',
      fruitVegIntake: '0-1 servings',
      knownHighCholesterol: 'Unknown',
      sexAtBirth: 'Male',
      sleep: 'Less than 6 hours',
    },
  })

  plan.today.forEach((todayAction) => {
    plan.thisWeek.forEach((weeklyAction) => {
      assert.equal(
        arePreventionActionsSemanticallyDuplicate(todayAction, weeklyAction),
        false,
        `${todayAction.label} should not repeat ${weeklyAction.label}`,
      )
    })
  })
  assert.ok(
    plan.thisWeek.some((action) => action.label.includes('cholesterol testing')),
  )
})

test('family history does not create unsupported screening actions', () => {
  const familyMembers = [
    {
      conditions: [{ diagnosisAge: '52', name: 'Breast cancer' }],
      relationshipType: 'mother',
    },
  ]
  const ineligiblePlan = buildPreventionActionPlan({
    familyMembers,
    preventionInsights: [{ ...cancerInsight, healthArea: 'Breast Cancer Prevention' }],
    profile: { ageRange: '30-44', sexAtBirth: 'Female' },
  })
  const eligiblePlan = buildPreventionActionPlan({
    familyMembers,
    preventionInsights: [{ ...cancerInsight, healthArea: 'Breast Cancer Prevention' }],
    profile: { ageRange: '45-54', sexAtBirth: 'Female' },
  })

  assert.equal(
    [...ineligiblePlan.thisWeek, ...ineligiblePlan.thisMonth].some((action) =>
      /breast screening|mammograph/i.test(action.label),
    ),
    false,
  )
  assert.equal(
    [...eligiblePlan.thisWeek, ...eligiblePlan.thisMonth].some((action) =>
      /breast.screening/i.test(action.label),
    ),
    true,
  )
})
