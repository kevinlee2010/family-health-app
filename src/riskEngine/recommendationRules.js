import { conditionIds } from './riskTypes.js'
import { screeningContextChecks } from './conditionRules.js'

function hasFactor(result, factorId) {
  return result.factors.some((factor) => factor.id === factorId)
}

function hasFamilyHistorySignal(result) {
  return result.familyMembers.length >= 2 || hasFactor(result, 'earlyFamilyDiagnosis')
}

export function buildRecommendations(result, context) {
  const recommendations = []

  if (hasFactor(result, 'physicalInactivity')) {
    recommendations.push(
      'Try a 20-minute walk three times this week, or look for a nearby walking path that feels easy to revisit.',
    )
  }

  if (hasFactor(result, 'smoking')) {
    recommendations.push(
      'Review tobacco or vaping quit-support resources and ask a healthcare professional what support options fit you.',
    )
  }

  if (
    [conditionIds.heartDisease, conditionIds.stroke, conditionIds.highBloodPressure].includes(
      result.conditionId,
    ) &&
    screeningContextChecks.bloodPressureUnknown(context)
  ) {
    recommendations.push(
      'Ask a healthcare professional whether blood-pressure screening would be appropriate.',
    )
  }

  if (
    [conditionIds.heartDisease, conditionIds.highCholesterol].includes(
      result.conditionId,
    ) &&
    screeningContextChecks.cholesterolUnknown(context)
  ) {
    recommendations.push(
      'Ask about cholesterol screening during a routine preventive care visit.',
    )
  }

  if (hasFactor(result, 'elevatedBmi') || hasFactor(result, 'higherBmi')) {
    recommendations.push(
      'Choose one simple nutrition goal this week, such as adding a vegetable to lunch or planning two balanced dinners.',
    )
  }

  if (result.conditionId === conditionIds.type2Diabetes) {
    recommendations.push(
      'Ask whether blood sugar screening or a diabetes prevention program makes sense based on your history.',
    )
  }

  if (
    [conditionIds.breastCancer, conditionIds.colorectalCancer].includes(
      result.conditionId,
    )
  ) {
    recommendations.push(
      'Discuss whether family history changes when screening should begin or how often it should happen.',
    )
  }

  if (hasFamilyHistorySignal(result)) {
    recommendations.push(
      'Share this family-history pattern with a healthcare professional, especially because multiple relatives or early diagnosis were reported.',
    )
  }

    recommendations.push(
      'Update your family history when something changes and bring the main patterns to your next routine checkup.',
    )

  return Array.from(new Set(recommendations)).slice(0, 3)
}
