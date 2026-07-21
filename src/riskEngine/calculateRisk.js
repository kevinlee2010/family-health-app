import {
  assessedConditions,
  conditionRules,
  getConditionDefinition,
  getMatchedFamilyMembers,
  protectiveFactorChecks,
} from './conditionRules.js'
import { getRiskLevel, modifiabilityTypes } from './riskTypes.js'
import { buildRecommendations } from './recommendationRules.js'

const emptyUserProfile = {
  ageRange: '',
  sexAtBirth: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  bmi: '',
  exercise: '',
  fruitVegIntake: '',
  smokingStatus: '',
  alcoholUse: '',
  sleep: '',
  knownHighBloodPressure: '',
  knownHighCholesterol: '',
  diabetesStatus: '',
}

function buildContext({ familyMembers, userProfile, condition }) {
  return {
    condition,
    familyMatches: getMatchedFamilyMembers(familyMembers, condition),
    familyMembers,
    userProfile: {
      ...emptyUserProfile,
      ...(userProfile || {}),
    },
  }
}

function evaluateRules(rules, context) {
  return rules
    .filter((rule) => rule.applies(context))
    .map((rule) => {
      const factor = { ...rule }
      delete factor.applies
      return factor
    })
}

function buildProtectiveFactors(context) {
  return protectiveFactorChecks
    .filter((factor) => factor.applies(context))
    .map((protectiveFactor) => {
      const factor = { ...protectiveFactor }
      delete factor.applies
      return factor
    })
}

function getRelatives(familyMembers) {
  return familyMembers.map((member) => ({
    id: member.id,
    name: member.name || '',
    relationship: member.relationship,
    earlyDiagnosis: Boolean(member.earlyDiagnosis),
  }))
}

function buildPlainEnglishReason({ conditionName, riskLevel, factors }) {
  if (factors.length === 0) {
    return `${conditionName} is marked ${riskLevel} because no scored risk factors were reported for this prototype rule set.`
  }

  const factorText = factors
    .slice(0, 3)
    .map((factor) => factor.explanation.replace(/\.$/, '').toLowerCase())
    .join(', ')

  return `${conditionName} is marked ${riskLevel} because ${factorText}. This is an educational result, not a diagnosis.`
}

function calculateConditionRisk({ condition, familyMembers, userProfile }) {
  const context = buildContext({ familyMembers, userProfile, condition })
  const rules = conditionRules[condition.id] || []
  const factors = evaluateRules(rules, context)
  const score = factors.reduce((total, factor) => total + factor.points, 0)
  const riskLevel = getRiskLevel(score)
  const modifiableFactors = factors.filter(
    (factor) => factor.type === modifiabilityTypes.modifiable,
  )
  const nonmodifiableFactors = factors.filter(
    (factor) => factor.type === modifiabilityTypes.nonmodifiable,
  )
  const result = {
    conditionId: condition.id,
    conditionName: condition.name,
    familyMembers: getRelatives(context.familyMatches),
    factors,
    modifiableFactors,
    nonmodifiableFactors,
    protectiveFactors: buildProtectiveFactors(context),
    riskLevel,
    score,
    prototypeCutoffs:
      'Prototype rules only: 0-3 Average, 4-7 Increased, 8+ Higher Attention Recommended.',
  }

  return {
    ...result,
    reason: buildPlainEnglishReason({
      conditionName: condition.name,
      factors,
      riskLevel,
    }),
    recommendations: buildRecommendations(result, context),
  }
}

export function calculateRisk(familyMembers = [], userProfile = null) {
  return assessedConditions.map((condition) =>
    calculateConditionRisk({
      condition,
      familyMembers,
      userProfile,
    }),
  )
}

export function calculateConditionScore({
  conditionId,
  familyMembers = [],
  userProfile = null,
}) {
  const condition = getConditionDefinition(conditionId)

  if (!condition) {
    throw new Error(`Unknown condition: ${conditionId}`)
  }

  return calculateConditionRisk({ condition, familyMembers, userProfile })
}
