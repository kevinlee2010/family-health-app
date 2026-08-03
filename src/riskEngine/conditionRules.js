import {
  conditionIds,
  firstDegreeRelationships,
  modifiabilityTypes,
} from './riskTypes.js'

const sourceLabels = {
  aha: 'American Heart Association',
  cdc: 'CDC',
  medlinePlus: 'NIH MedlinePlus',
  nci: 'National Cancer Institute',
  acs: 'American Cancer Society',
}

export const assessedConditions = [
  {
    id: conditionIds.heartDisease,
    name: 'Heart Disease',
    familyKeywords: ['heart disease', 'heart attack', 'coronary'],
  },
  {
    id: conditionIds.stroke,
    name: 'Stroke',
    familyKeywords: ['stroke'],
  },
  {
    id: conditionIds.type2Diabetes,
    name: 'Diabetes',
    familyKeywords: ['diabetes'],
  },
  {
    id: conditionIds.highBloodPressure,
    name: 'High Blood Pressure',
    familyKeywords: ['high blood pressure', 'hypertension'],
  },
  {
    id: conditionIds.highCholesterol,
    name: 'High Cholesterol',
    familyKeywords: ['high cholesterol', 'cholesterol'],
  },
  {
    id: conditionIds.breastCancer,
    name: 'Breast Cancer',
    familyKeywords: ['breast cancer'],
  },
  {
    id: conditionIds.colorectalCancer,
    name: 'Colorectal Cancer',
    familyKeywords: ['colorectal cancer', 'colon cancer'],
  },
]

function normalize(value = '') {
  return value
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function getConditionDefinition(conditionId) {
  return assessedConditions.find((condition) => condition.id === conditionId)
}

export function getMatchedFamilyMembers(familyMembers = [], condition) {
  return familyMembers.filter((member) => {
    const illnesses = member.illnesses || member.conditions || []

    return illnesses.some((illness) => {
      const normalizedIllness = normalize(illness)

      return condition.familyKeywords.some((keyword) =>
        normalizedIllness.includes(normalize(keyword)),
      )
    })
  })
}

function hasFirstDegreeFamilyHistory(context) {
  return context.familyMatches.some((member) =>
    firstDegreeRelationships.includes(member.relationship),
  )
}

function hasMultipleAffectedRelatives(context) {
  return context.familyMatches.length >= 2
}

function hasEarlyFamilyDiagnosis(context) {
  return context.familyMatches.some((member) => Boolean(member.earlyDiagnosis))
}

function isCurrentSmoker(context) {
  return context.userProfile.smokingStatus === 'Current'
}

function isFormerSmoker(context) {
  return context.userProfile.smokingStatus === 'Former'
}

function isPhysicallyInactive(context) {
  return ['Rarely', '1-2 days/week'].includes(context.userProfile.exercise)
}

function hasRegularActivity(context) {
  return ['3-5 days/week', 'Nearly every day'].includes(
    context.userProfile.exercise,
  )
}

function hasElevatedBmi(context) {
  return Number(context.userProfile.bmi) >= 25
}

function hasHigherBmi(context) {
  return Number(context.userProfile.bmi) >= 30
}

function hasBalancedProduceIntake(context) {
  return ['3-4 servings', '5 or more servings'].includes(
    context.userProfile.fruitVegIntake,
  )
}

function hasLowProduceIntake(context) {
  return ['0-1 servings', '2 servings'].includes(
    context.userProfile.fruitVegIntake,
  )
}

function hasKnownHighBloodPressure(context) {
  return context.userProfile.knownHighBloodPressure === 'Yes'
}

function bloodPressureUnknown(context) {
  return context.userProfile.knownHighBloodPressure === 'Not sure'
}

function hasKnownHighCholesterol(context) {
  return context.userProfile.knownHighCholesterol === 'Yes'
}

function cholesterolUnknown(context) {
  return context.userProfile.knownHighCholesterol === 'Not sure'
}

function hasPrediabetesOrDiabetes(context) {
  return normalize(context.userProfile.diabetesStatus).includes('diabetes')
}

function hasShortSleep(context) {
  return context.userProfile.sleep === 'Less than 6 hours'
}

function hasHigherAlcoholFrequency(context) {
  return ['Weekly', 'Daily'].includes(context.userProfile.alcoholUse)
}

function sexAtBirthIsFemale(context) {
  return context.userProfile.sexAtBirth === 'Female'
}

function ageRangeAtLeast45(context) {
  return ['45-54', '55-64', '65+'].includes(context.userProfile.ageRange)
}

function ageRangeAtLeast50(context) {
  return ['55-64', '65+'].includes(context.userProfile.ageRange)
}

function createRule({
  id,
  points,
  explanation,
  source,
  type,
  applies,
}) {
  return {
    id,
    points,
    explanation,
    source,
    type,
    applies,
  }
}

const familyHistoryRules = [
  createRule({
    id: 'firstDegreeFamilyHistory',
    points: 4,
    explanation: 'A parent or sibling has a history of this condition.',
    source: sourceLabels.medlinePlus,
    type: modifiabilityTypes.nonmodifiable,
    applies: hasFirstDegreeFamilyHistory,
  }),
  createRule({
    id: 'multipleAffectedRelatives',
    points: 2,
    explanation: 'Multiple relatives have this condition in the family history.',
    source: sourceLabels.medlinePlus,
    type: modifiabilityTypes.nonmodifiable,
    applies: hasMultipleAffectedRelatives,
  }),
  createRule({
    id: 'earlyFamilyDiagnosis',
    points: 2,
    explanation: 'A relative was reported as diagnosed at an unusually young age.',
    source: sourceLabels.medlinePlus,
    type: modifiabilityTypes.nonmodifiable,
    applies: hasEarlyFamilyDiagnosis,
  }),
]

const cardiovascularLifestyleRules = [
  createRule({
    id: 'smoking',
    points: 3,
    explanation:
      'Current tobacco or vaping use is associated with increased cardiovascular risk.',
    source: sourceLabels.aha,
    type: modifiabilityTypes.modifiable,
    applies: isCurrentSmoker,
  }),
  createRule({
    id: 'physicalInactivity',
    points: 2,
    explanation: "The reported activity level is below the app's activity target.",
    source: sourceLabels.aha,
    type: modifiabilityTypes.modifiable,
    applies: isPhysicallyInactive,
  }),
  createRule({
    id: 'elevatedBmi',
    points: 1,
    explanation: "BMI is in the app's elevated range.",
    source: sourceLabels.cdc,
    type: modifiabilityTypes.modifiable,
    applies: hasElevatedBmi,
  }),
  createRule({
    id: 'shortSleep',
    points: 1,
    explanation: 'Short sleep duration was reported.',
    source: sourceLabels.cdc,
    type: modifiabilityTypes.modifiable,
    applies: hasShortSleep,
  }),
]

export const conditionRules = {
  [conditionIds.heartDisease]: [
    ...familyHistoryRules,
    ...cardiovascularLifestyleRules,
    createRule({
      id: 'knownHighBloodPressure',
      points: 3,
      explanation: 'Known high blood pressure was reported.',
      source: sourceLabels.aha,
      type: modifiabilityTypes.modifiable,
      applies: hasKnownHighBloodPressure,
    }),
    createRule({
      id: 'knownHighCholesterol',
      points: 3,
      explanation: 'Known high cholesterol was reported.',
      source: sourceLabels.aha,
      type: modifiabilityTypes.modifiable,
      applies: hasKnownHighCholesterol,
    }),
    createRule({
      id: 'prediabetesOrDiabetes',
      points: 2,
      explanation: 'Prediabetes or diabetes status was reported.',
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: hasPrediabetesOrDiabetes,
    }),
  ],
  [conditionIds.stroke]: [
    ...familyHistoryRules,
    ...cardiovascularLifestyleRules,
    createRule({
      id: 'knownHighBloodPressure',
      points: 3,
      explanation: 'Known high blood pressure was reported.',
      source: sourceLabels.aha,
      type: modifiabilityTypes.modifiable,
      applies: hasKnownHighBloodPressure,
    }),
    createRule({
      id: 'higherAlcoholFrequency',
      points: 1,
      explanation: 'Weekly or daily alcohol use was reported.',
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: hasHigherAlcoholFrequency,
    }),
  ],
  [conditionIds.type2Diabetes]: [
    ...familyHistoryRules,
    createRule({
      id: 'physicalInactivity',
      points: 2,
      explanation: "The reported activity level is below the app's activity target.",
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: isPhysicallyInactive,
    }),
    createRule({
      id: 'higherBmi',
      points: 3,
      explanation: "BMI is in the app's higher range.",
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: hasHigherBmi,
    }),
    createRule({
      id: 'elevatedBmi',
      points: 1,
      explanation: "BMI is in the app's elevated range.",
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: hasElevatedBmi,
    }),
    createRule({
      id: 'lowProduceIntake',
      points: 1,
      explanation: 'Daily fruit and vegetable intake is below the app target.',
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: hasLowProduceIntake,
    }),
  ],
  [conditionIds.highBloodPressure]: [
    ...familyHistoryRules,
    ...cardiovascularLifestyleRules,
    createRule({
      id: 'knownHighCholesterol',
      points: 1,
      explanation: 'Known high cholesterol was reported.',
      source: sourceLabels.aha,
      type: modifiabilityTypes.modifiable,
      applies: hasKnownHighCholesterol,
    }),
  ],
  [conditionIds.highCholesterol]: [
    ...familyHistoryRules,
    createRule({
      id: 'physicalInactivity',
      points: 2,
      explanation: "The reported activity level is below the app's activity target.",
      source: sourceLabels.aha,
      type: modifiabilityTypes.modifiable,
      applies: isPhysicallyInactive,
    }),
    createRule({
      id: 'knownHighBloodPressure',
      points: 1,
      explanation: 'Known high blood pressure was reported.',
      source: sourceLabels.aha,
      type: modifiabilityTypes.modifiable,
      applies: hasKnownHighBloodPressure,
    }),
    createRule({
      id: 'elevatedBmi',
      points: 1,
      explanation: "BMI is in the app's elevated range.",
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: hasElevatedBmi,
    }),
  ],
  [conditionIds.breastCancer]: [
    ...familyHistoryRules,
    createRule({
      id: 'sexAtBirthFemale',
      points: 1,
      explanation: 'Female sex at birth was reported.',
      source: sourceLabels.nci,
      type: modifiabilityTypes.nonmodifiable,
      applies: sexAtBirthIsFemale,
    }),
    createRule({
      id: 'ageRange45Plus',
      points: 1,
      explanation: 'The selected age range is 45 or older.',
      source: sourceLabels.nci,
      type: modifiabilityTypes.nonmodifiable,
      applies: ageRangeAtLeast45,
    }),
    createRule({
      id: 'alcoholFrequency',
      points: 1,
      explanation: 'Weekly or daily alcohol use was reported.',
      source: sourceLabels.acs,
      type: modifiabilityTypes.modifiable,
      applies: hasHigherAlcoholFrequency,
    }),
  ],
  [conditionIds.colorectalCancer]: [
    ...familyHistoryRules,
    createRule({
      id: 'ageRange50Plus',
      points: 1,
      explanation: 'The selected age range is 55 or older.',
      source: sourceLabels.acs,
      type: modifiabilityTypes.nonmodifiable,
      applies: ageRangeAtLeast50,
    }),
    createRule({
      id: 'physicalInactivity',
      points: 2,
      explanation: "The reported activity level is below the app's activity target.",
      source: sourceLabels.acs,
      type: modifiabilityTypes.modifiable,
      applies: isPhysicallyInactive,
    }),
    createRule({
      id: 'elevatedBmi',
      points: 1,
      explanation: "BMI is in the app's elevated range.",
      source: sourceLabels.cdc,
      type: modifiabilityTypes.modifiable,
      applies: hasElevatedBmi,
    }),
    createRule({
      id: 'smoking',
      points: 2,
      explanation: 'Current tobacco or vaping use was reported.',
      source: sourceLabels.acs,
      type: modifiabilityTypes.modifiable,
      applies: isCurrentSmoker,
    }),
  ],
}

export const protectiveFactorChecks = [
  {
    id: 'regularActivity',
    explanation: 'You reported regular weekly physical activity.',
    source: sourceLabels.cdc,
    applies: hasRegularActivity,
  },
  {
    id: 'balancedProduceIntake',
    explanation: 'You reported at least 3 servings of fruits and vegetables daily.',
    source: sourceLabels.cdc,
    applies: hasBalancedProduceIntake,
  },
  {
    id: 'noCurrentSmoking',
    explanation: 'You did not report current smoking or vaping.',
    source: sourceLabels.cdc,
    applies: (context) =>
      context.userProfile.smokingStatus === 'Never' ||
      context.userProfile.smokingStatus === 'Former',
  },
  {
    id: 'formerSmoking',
    explanation: 'You reported former tobacco use rather than current use.',
    source: sourceLabels.cdc,
    applies: isFormerSmoker,
  },
]

export const screeningContextChecks = {
  bloodPressureUnknown,
  cholesterolUnknown,
}
