import assert from 'node:assert/strict'
import test from 'node:test'

import { buildFamilyHealthSummary } from '../src/healthCategories.js'
import { buildPreventionInsights } from '../src/preventionInsights.js'

const diagnosticPhrases = [
  'you have',
  'you will develop',
  'confirmed high risk',
  'you should definitely',
]

function getInsightsForCondition(conditionName) {
  const familyHealthSummary = buildFamilyHealthSummary({
    familyMembers: [
      {
        illnesses: [conditionName],
        relationship: 'Father',
      },
    ],
  })

  return buildPreventionInsights({ familyHealthSummary })
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
    assert.equal(typeof insight.sourceName, 'string')
    assert.equal(typeof insight.sourceUrl, 'string')
    assert.equal('whyItAppears' in insight, false)
    assert.equal('doctorQuestions' in insight, false)
    assert.equal('educationalActions' in insight, false)
  })
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
  assert.equal(getInsightsForCondition('High cholesterol')[0].healthArea, 'Cholesterol Awareness')
  assert.equal(getInsightsForCondition('High blood pressure')[0].healthArea, 'Blood Pressure Awareness')
})

test('broad insight categories use prevention insight, strategies, and source', () => {
  const expected = [
    ['Stroke', 'Brain and Stroke Prevention'],
    ['Heart disease', 'Cardiovascular Health'],
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
