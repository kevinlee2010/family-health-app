import assert from 'node:assert/strict'
import test from 'node:test'

import {
  moreInheritedConditionGroup,
  resolveFamilyConditionSelection,
  searchFamilyConditions,
} from '../src/familyConditionCatalog.js'

const commonGroups = [
  {
    id: 'heart',
    label: 'Heart health',
    conditions: ['High blood pressure', 'High cholesterol'],
  },
  moreInheritedConditionGroup,
]

test('family condition search matches medical aliases', () => {
  assert.equal(
    searchFamilyConditions(commonGroups, 'hypertension')[0]?.condition,
    'High blood pressure',
  )
  assert.equal(
    searchFamilyConditions(commonGroups, 'hypothyroidism')[0]?.condition,
    'Thyroid disease',
  )
})

test('more inherited conditions include the expanded condition set', () => {
  assert.ok(moreInheritedConditionGroup.conditions.includes('Sickle cell disease'))
  assert.ok(moreInheritedConditionGroup.conditions.includes("Crohn's disease"))
  assert.ok(moreInheritedConditionGroup.conditions.includes('Cardiomyopathy'))
})

test('legacy custom family conditions remain in saved profiles', () => {
  assert.deepEqual(
    resolveFamilyConditionSelection({
      noConditionLabels: ['None', 'No health conditions added.'],
      noKnownConditionsLabel: 'No health conditions added.',
      selectedConditions: ['High blood pressure', 'Ehlers-Danlos syndrome'],
      unknownConditionLabel: 'Unknown',
    }),
    ['High blood pressure', 'Ehlers-Danlos syndrome'],
  )
})

test('none and unknown states stay exclusive from named conditions', () => {
  assert.deepEqual(
    resolveFamilyConditionSelection({
      noConditionLabels: ['None', 'No health conditions added.'],
      noKnownConditionsLabel: 'No health conditions added.',
      selectedConditions: ['No health conditions added.'],
      unknownConditionLabel: 'Unknown',
    }),
    ['No health conditions added.'],
  )
  assert.deepEqual(
    resolveFamilyConditionSelection({
      noConditionLabels: ['None', 'No health conditions added.'],
      noKnownConditionsLabel: 'No health conditions added.',
      selectedConditions: ['High cholesterol', 'Unknown'],
      unknownConditionLabel: 'Unknown',
    }),
    ['Unknown'],
  )
})
