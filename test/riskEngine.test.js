import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateConditionScore, calculateRisk } from '../src/riskEngine/calculateRisk.js'
import { conditionIds, riskLevels } from '../src/riskEngine/riskTypes.js'

test('no reported risk factors returns average', () => {
  const result = calculateConditionScore({
    conditionId: conditionIds.heartDisease,
    familyMembers: [],
    userProfile: {},
  })

  assert.equal(result.riskLevel, riskLevels.average)
  assert.equal(result.score, 0)
  assert.equal(result.factors.length, 0)
})

test('family history only increases risk when a first-degree relative is affected', () => {
  const result = calculateConditionScore({
    conditionId: conditionIds.heartDisease,
    familyMembers: [
      {
        id: 'mother-1',
        relationship: 'Mother',
        illnesses: ['Heart Disease'],
      },
    ],
    userProfile: {},
  })

  assert.equal(result.riskLevel, riskLevels.increased)
  assert.equal(result.score, 4)
  assert.deepEqual(
    result.nonmodifiableFactors.map((factor) => factor.id),
    ['firstDegreeFamilyHistory'],
  )
})

test('lifestyle factors only can increase cardiovascular risk', () => {
  const result = calculateConditionScore({
    conditionId: conditionIds.stroke,
    familyMembers: [],
    userProfile: {
      smokingStatus: 'Current',
      exercise: 'Rarely',
      knownHighBloodPressure: 'No',
    },
  })

  assert.equal(result.riskLevel, riskLevels.increased)
  assert.equal(result.score, 5)
  assert.ok(result.modifiableFactors.some((factor) => factor.id === 'smoking'))
  assert.ok(
    result.modifiableFactors.some((factor) => factor.id === 'physicalInactivity'),
  )
})

test('combined family and lifestyle factors can reach higher attention', () => {
  const result = calculateConditionScore({
    conditionId: conditionIds.type2Diabetes,
    familyMembers: [
      {
        id: 'father-1',
        relationship: 'Father',
        illnesses: ['Type 2 Diabetes'],
        earlyDiagnosis: true,
      },
    ],
    userProfile: {
      exercise: '1-2 days/week',
      bmi: 31,
      fruitVegIntake: '0-1 servings',
    },
  })

  assert.equal(result.riskLevel, riskLevels.higherAttention)
  assert.ok(result.score >= 8)
  assert.ok(result.factors.some((factor) => factor.id === 'earlyFamilyDiagnosis'))
  assert.ok(result.factors.some((factor) => factor.id === 'higherBmi'))
})

test('missing or unanswered fields do not add lifestyle points', () => {
  const allResults = calculateRisk([], {
    smokingStatus: '',
    exercise: '',
    knownHighBloodPressure: 'Prefer not to answer',
    knownHighCholesterol: 'Prefer not to answer',
  })

  assert.ok(allResults.every((result) => result.riskLevel === riskLevels.average))
  assert.ok(allResults.every((result) => result.score === 0))
})

test('multiple affected relatives add multiple-family-history signal', () => {
  const result = calculateConditionScore({
    conditionId: conditionIds.colorectalCancer,
    familyMembers: [
      {
        id: 'mother-1',
        relationship: 'Mother',
        illnesses: ['Colon Cancer'],
      },
      {
        id: 'grandparent-1',
        relationship: 'Grandparent',
        illnesses: ['Colorectal Cancer'],
      },
    ],
    userProfile: {},
  })

  assert.equal(result.riskLevel, riskLevels.increased)
  assert.equal(result.familyMembers.length, 2)
  assert.ok(
    result.factors.some((factor) => factor.id === 'multipleAffectedRelatives'),
  )
})
