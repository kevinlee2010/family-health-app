import assert from 'node:assert/strict'
import test from 'node:test'

import {
  filterHealthCategoryByEligibility,
  isBreastScreeningEligible,
  isConditionApplicableToProfile,
  isPreventionActionApplicable,
} from '../src/healthEligibility.js'

test('organ-specific conditions require conservative sex-at-birth eligibility', () => {
  assert.equal(
    isConditionApplicableToProfile('Prostate cancer', { sexAtBirth: 'Female' }),
    false,
  )
  assert.equal(
    isConditionApplicableToProfile('Testicular cancer', { sexAtBirth: 'Female' }),
    false,
  )
  assert.equal(
    isConditionApplicableToProfile('Ovarian cancer', { sexAtBirth: 'Male' }),
    false,
  )
  assert.equal(
    isConditionApplicableToProfile('Cervical cancer', { sexAtBirth: 'Male' }),
    false,
  )
})

test('missing or undisclosed sex-at-birth does not establish organ eligibility', () => {
  for (const sexAtBirth of ['', 'Prefer not to answer']) {
    assert.equal(
      isConditionApplicableToProfile('Prostate cancer', { sexAtBirth }),
      false,
    )
    assert.equal(
      isConditionApplicableToProfile('Ovarian cancer', { sexAtBirth }),
      false,
    )
  }
})

test('inapplicable family conditions are removed before category ranking', () => {
  const category = filterHealthCategoryByEligibility(
    {
      conditions: [
        { conditionName: 'Prostate cancer', count: 2, relatives: ['Father'] },
        { conditionName: 'Colon cancer', count: 1, relatives: ['Mother'] },
      ],
      id: 'cancer',
      observationCount: 3,
      riskLevel: 'High',
    },
    { sexAtBirth: 'Female' },
  )

  assert.deepEqual(
    category.conditions.map((condition) => condition.conditionName),
    ['Colon cancer'],
  )
  assert.equal(category.observationCount, 1)
  assert.equal(category.riskLevel, 'Increased')
})

test('family history alone does not establish breast-screening eligibility', () => {
  assert.equal(isBreastScreeningEligible({ sexAtBirth: 'Female' }), false)
  assert.equal(
    isPreventionActionApplicable(
      {
        label: 'Find breast screening locations near you.',
        resourceIntent: 'mammography-facility',
      },
      { ageRange: '30-44', sexAtBirth: 'Female' },
    ),
    false,
  )
  assert.equal(
    isBreastScreeningEligible({ ageRange: '45-54', sexAtBirth: 'Female' }),
    true,
  )
})
