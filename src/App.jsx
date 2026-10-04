import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  assessmentSteps,
  getAssessmentNavigationAccess,
  getAssessmentCompletionPercent,
  getAssessmentReminderMessage,
  getNextIncompleteAssessmentView,
} from './assessmentFlow'
import { AuthFlow } from './auth/AuthFlow'
import { useAuth } from './auth/useAuth'
import { getConditionDetails } from './conditionDetails'
import {
  deleteUserProfile,
  loadUserProfile,
  saveUserProfile,
} from './data/userProfileService'
import { buildHealthDataExport } from './data/profileExport'
import { buildDashboardProfileSummary } from './dashboardProfileSummary'
import {
  createProfileSaveCoordinator,
  serializeProfileState,
} from './data/profilePersistence'
import { buildRecommendationEvidence } from './data/preventionEvidence'
import { buildFamilyHealthSummary } from './healthCategories'
import {
  buildVisibleSiblingBranchMembers,
  formatRelationshipLabel,
  getFamilyMembersToRemoveForStructureChange,
  getNextFamilyStructureForInput,
  getRelativePrimaryName,
  getRelationshipLimitGroup,
  getSlotIndexFromRelativeId,
  getStableStructuredRelativeId,
  getStableRelativeSaveIdentity,
  isFamilyStructureComplete,
  isRelationshipLimitReachedForSave,
  mergeSelfConditionsFromCurrentHealth,
  relativeTypeDefinitions,
  sanitizeFamilyStructureCounts,
  updateFamilyMembersWithSavedRelative,
} from './familyStructurePersistence'
import { isPreventionActionApplicable } from './healthEligibility'
import {
  moreInheritedConditionGroup,
  resolveFamilyConditionSelection,
  searchFamilyConditions,
} from './familyConditionCatalog'
import { supabase } from './lib/supabase'
import { getMammographyFacilityResources } from './mammographyFacilities'
import { PedigreeTree } from './PedigreeTree'
import { buildPreventionInsights } from './preventionInsights'
import {
  buildPreventionActionPlan,
  buildPreventionProgressSummary,
} from './preventionPlanActions'
import {
  buildPreventionPlanSignals,
} from './preventionScore'
import { getParkMapUrl, getParksNearZip } from './parkResources'
import {
  getStagedResourceSearch,
  getUserResourcePriorities,
} from './resourcePersonalization'
import {
  getGoalAction,
  getGoalPrimaryActionLabel,
  getGoalResourceMatches,
  getResourceIntentForGoal,
  getResourcePrimaryActionLabel,
  getTrustedResourcesForGoalIntent,
  groupResourcesByGoalRelevance,
  normalizeGoalText,
  rankResourcesForGoalIntent,
} from './goalResourceIntents'
import {
  getClosestSupportedZipForCoordinates,
  getCityForZip,
  isSupportedZip,
} from './zipCodeMap'

const relationships = [
  'Mother',
  'Father',
  'Parent',
  'Sibling',
  'Grandparent',
  'Child',
  'Aunt/Uncle',
  'Relative',
  'Self',
]
const relationshipLimitMessages = {
  parent: 'You can add up to 2 parents.',
  grandparent: 'You can add up to 4 grandparents.',
}

const ageRangeOptions = [
  'Under 18',
  '18-29',
  '30-44',
  '45-54',
  '55-64',
  '65+',
  'Prefer not to answer',
]

const sexAtBirthOptions = ['Female', 'Male', 'Prefer not to answer']

const legacyNoIllnessOption = 'None'
const noListedConditionsLabel = 'None of the conditions listed'
const noKnownConditionsLabel = 'No health conditions added.'
const unknownConditionLabel = 'Unknown'
const unknownDiagnosisAgeLabel = 'Unknown'
const legacyDiabetesLabel = ['type', '2', 'diabetes'].join(' ')
const familyStructureFields = [
  {
    id: 'brothers',
    label: 'How many brothers do you have?',
    relationshipType: 'brother',
  },
  {
    id: 'sisters',
    label: 'How many sisters do you have?',
    relationshipType: 'sister',
  },
  {
    id: 'sons',
    label: 'How many sons do you have?',
    relationshipType: 'son',
  },
  {
    id: 'daughters',
    label: 'How many daughters do you have?',
    relationshipType: 'daughter',
  },
  {
    id: 'maternalUncles',
    label: 'How many brothers does your mother have?',
    relationshipType: 'maternal-uncle',
    supportingLabel: 'Your maternal uncles',
  },
  {
    id: 'maternalAunts',
    label: 'How many sisters does your mother have?',
    relationshipType: 'maternal-aunt',
    supportingLabel: 'Your maternal aunts',
  },
  {
    id: 'paternalUncles',
    label: 'How many brothers does your father have?',
    relationshipType: 'paternal-uncle',
    supportingLabel: 'Your paternal uncles',
  },
  {
    id: 'paternalAunts',
    label: 'How many sisters does your father have?',
    relationshipType: 'paternal-aunt',
    supportingLabel: 'Your paternal aunts',
  },
]

const familyStructureGroups = [
  {
    id: 'siblings',
    title: 'Siblings',
    fieldIds: ['brothers', 'sisters'],
  },
  {
    id: 'children',
    title: 'Children',
    fieldIds: ['sons', 'daughters'],
  },
  {
    id: 'maternal-side',
    title: "Mother's Side",
    fieldIds: ['maternalUncles', 'maternalAunts'],
  },
  {
    id: 'paternal-side',
    title: "Father's Side",
    fieldIds: ['paternalUncles', 'paternalAunts'],
  },
]

const defaultFamilyStructure = familyStructureFields.reduce(
  (structure, field) => ({
    ...structure,
    [field.id]: '',
  }),
  {},
)

const familyConditionCategories = [
  {
    id: 'cancer',
    label: 'Cancer',
    conditions: [
      'Breast cancer',
      'Colon cancer',
      'Lung cancer',
      'Prostate cancer',
      'Ovarian cancer',
      'Pancreatic cancer',
      'Endometrial cancer',
      'Kidney cancer',
      'Liver cancer',
      'Thyroid cancer',
      'Leukemia',
      'Lymphoma',
      'Multiple myeloma',
      'Melanoma',
      'Other skin cancer',
      'Other cancer',
    ],
  },
  {
    id: 'cardiovascular',
    label: 'Heart & Circulation',
    conditions: [
      'High blood pressure',
      'High cholesterol',
      'Heart disease',
      'Heart attack',
      'Stroke',
      'Atrial fibrillation',
      'Heart failure',
      'Other cardiovascular condition',
    ],
  },
  {
    id: 'metabolic',
    label: 'Diabetes & Metabolic Health',
    conditions: [
      'Diabetes',
      'Prediabetes',
      'Obesity',
      'Metabolic syndrome',
      'Other metabolic condition',
    ],
  },
  {
    id: 'neurological',
    label: 'Brain & Neurological Health',
    conditions: [
      "Alzheimer's disease",
      'Dementia',
      "Parkinson's disease",
      'Epilepsy',
      'Migraine',
      'Multiple sclerosis',
      'Other neurological condition',
    ],
  },
  {
    id: 'mental',
    label: 'Mental Health',
    conditions: [
      'Depression',
      'Anxiety',
      'Bipolar disorder',
      'Schizophrenia',
      'Other mental-health condition',
    ],
  },
  {
    id: 'respiratory',
    label: 'Respiratory Health',
    conditions: [
      'Asthma',
      'COPD',
      'Chronic bronchitis',
      'Emphysema',
      'Other respiratory condition',
    ],
  },
  {
    id: 'autoimmune',
    label: 'Autoimmune Conditions',
    conditions: [
      'Rheumatoid arthritis',
      'Lupus',
      'Celiac disease',
      'Psoriasis',
      'Other autoimmune condition',
    ],
  },
  {
    id: 'kidney-liver',
    label: 'Kidney & Liver Health',
    conditions: [
      'Kidney disease',
      'Kidney failure',
      'Fatty liver disease',
      'Cirrhosis',
      'Other kidney or liver condition',
    ],
  },
  {
    id: 'bone-joint',
    label: 'Bone & Joint Health',
    conditions: [
      'Osteoporosis',
      'Osteoarthritis',
      'Other bone or joint condition',
    ],
  },
  {
    id: 'other',
    label: 'Other',
    conditions: ['Other condition', unknownConditionLabel],
  },
]

const guidedFamilyConditionGroups = [
  {
    id: 'heart-metabolic',
    label: 'Heart & Metabolic',
    description:
      'Heart, circulation, blood pressure, cholesterol, and diabetes-related conditions.',
    conditions: [
      'High blood pressure',
      'High cholesterol',
      'Heart disease',
      'Heart attack',
      'Stroke',
      'Atrial fibrillation',
      'Heart failure',
      'Diabetes',
      'Prediabetes',
      'Obesity',
      'Metabolic syndrome',
      'Other cardiovascular condition',
      'Other metabolic condition',
    ],
  },
  {
    id: 'cancer',
    label: 'Cancer',
    description: 'Common cancers, blood cancers, and skin cancers.',
    conditions: [
      'Breast cancer',
      'Colon cancer',
      'Lung cancer',
      'Prostate cancer',
      'Ovarian cancer',
      'Pancreatic cancer',
      'Endometrial cancer',
      'Kidney cancer',
      'Liver cancer',
      'Thyroid cancer',
      'Leukemia',
      'Lymphoma',
      'Multiple myeloma',
      'Melanoma',
      'Other skin cancer',
      'Other cancer',
    ],
  },
  {
    id: 'brain-behavioral',
    label: 'Brain & Behavioral Health',
    description: 'Neurological and mental-health conditions.',
    conditions: [
      "Alzheimer's disease",
      'Dementia',
      "Parkinson's disease",
      'Epilepsy',
      'Migraine',
      'Multiple sclerosis',
      'Depression',
      'Anxiety',
      'Bipolar disorder',
      'Schizophrenia',
      'Other neurological condition',
      'Other mental-health condition',
    ],
  },
  {
    id: 'lungs-immune-organ',
    label: 'Lungs, Immune & Organ Health',
    description: 'Respiratory, autoimmune, kidney, and liver conditions.',
    conditions: [
      'Asthma',
      'COPD',
      'Chronic bronchitis',
      'Emphysema',
      'Rheumatoid arthritis',
      'Lupus',
      'Celiac disease',
      'Psoriasis',
      'Kidney disease',
      'Kidney failure',
      'Fatty liver disease',
      'Cirrhosis',
      'Other respiratory condition',
      'Other autoimmune condition',
      'Other kidney or liver condition',
    ],
  },
  {
    id: 'bone-joint-other',
    label: 'Bone, Joint & Other',
    description: 'Musculoskeletal and other health conditions.',
    conditions: [
      'Osteoporosis',
      'Osteoarthritis',
      'Other bone or joint condition',
      unknownConditionLabel,
    ],
  },
]

const searchableFamilyConditionGroups = guidedFamilyConditionGroups

const illnessCategories = [
  {
    name: 'Cardiovascular',
    illnesses: [
      'Heart Disease',
      'Heart Attack',
      'Stroke',
      'High Blood Pressure (Hypertension)',
      'High Cholesterol',
    ],
  },
  {
    name: 'Diabetes & Metabolic',
    illnesses: ['Type 1 Diabetes', 'Diabetes', 'Obesity'],
  },
  {
    name: 'Cancer',
    illnesses: [
      'Breast Cancer',
      'Colon Cancer',
      'Ovarian Cancer',
      'Prostate Cancer',
      'Pancreatic Cancer',
      'Lung Cancer',
      'Melanoma',
    ],
  },
  {
    name: 'Neurological',
    illnesses: ["Alzheimer's Disease", "Parkinson's Disease"],
  },
  {
    name: 'Respiratory',
    illnesses: ['Asthma', 'COPD'],
  },
  {
    name: 'Bone & Joint',
    illnesses: ['Osteoporosis', 'Rheumatoid Arthritis'],
  },
  {
    name: 'Autoimmune',
    illnesses: [
      'Lupus',
      "Crohn's Disease",
      'Ulcerative Colitis',
      'Celiac Disease',
    ],
  },
  {
    name: 'Kidney & Endocrine',
    illnesses: [
      'Thyroid Disease',
      'Polycystic Kidney Disease',
      'Chronic Kidney Disease',
    ],
  },
  {
    name: 'Vision',
    illnesses: ['Glaucoma', 'Macular Degeneration'],
  },
  {
    name: 'Mental Health',
    illnesses: [
      'Depression',
      'Anxiety',
      'Bipolar Disorder',
      'Schizophrenia',
      'ADHD',
      'Autism Spectrum Disorder',
    ],
  },
  {
    name: 'Inherited Blood Disorders',
    illnesses: [
      'Sickle Cell Disease',
      'Thalassemia',
      'Hemophilia',
      'Cystic Fibrosis',
    ],
  },
  {
    name: moreInheritedConditionGroup.label,
    illnesses: moreInheritedConditionGroup.conditions,
  },
]

const starterIllnesses = illnessCategories.flatMap((category) => category.illnesses)

const assessmentTransitionDuration = 850
const legacyViewMap = {
  actions: 'coach',
  about: 'structure',
  coach: 'coach',
  dashboard: 'dashboard',
  history: 'family',
  localized: 'coach',
  prevention: 'insights',
  profile: 'health',
  risk: 'insights',
  score: 'insights',
  results: 'insights',
  tree: 'family',
  health: 'health',
  insights: 'insights',
  resources: 'coach',
  structure: 'structure',
  lifestyle: 'lifestyle',
}

const viewTabs = [
  { id: 'dashboard', icon: '⌂', label: 'Home' },
  { id: 'health', icon: '♡', label: 'Your Current Health' },
  { id: 'lifestyle', icon: '◌', label: 'Your Everyday Habits' },
  { id: 'structure', icon: '☷', label: 'Your Family Structure' },
  { id: 'family', icon: '⌁', label: 'Your Family Health Tree' },
  { id: 'insights', icon: '◇', label: 'Your Health Profile' },
  { id: 'coach', icon: '✧', label: 'Your Prevention Plan' },
]

const initialProfileForm = {
  name: '',
  age: '',
  ageRange: '',
  sex: '',
  sexAtBirth: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  smokingStatus: '',
  alcoholUse: '',
  exercise: '',
  fruitVegIntake: '',
  dietQuality: '',
  sleep: '',
  waterIntake: '',
  sugaryDrinks: '',
  stressLevel: '',
  screenTime: '',
  preventiveScreenings: '',
  knownHighBloodPressure: '',
  knownHighCholesterol: '',
  diabetesStatus: '',
}

const smokingOptions = ['Never', 'Former', 'Current']

const alcoholOptions = ['Never', 'Occasionally', 'Weekly', 'Daily']

const exerciseOptions = [
  'Rarely',
  '1-2 days/week',
  '3-5 days/week',
  'Nearly every day',
]

const dietQualityOptions = ['Poor', 'Fair', 'Good', 'Excellent']

const fruitVegOptions = [
  '0-1 servings',
  '2 servings',
  '3-4 servings',
  '5 or more servings',
]

const sleepOptions = [
  'Less than 6 hours',
  '6-7 hours',
  '7-9 hours',
  'More than 9 hours',
]

const waterIntakeOptions = [
  'Less than 3 cups',
  '3-5 cups',
  '6-8 cups',
  'More than 8 cups',
]

const sugaryDrinkOptions = ['Rarely', '1-3 per week', 'Most days', 'Daily']

const stressLevelOptions = ['Low', 'Moderate', 'High', 'Very high']

const screenTimeOptions = [
  'Less than 2 hours',
  '2-4 hours',
  '5-7 hours',
  '8+ hours',
]

const preventiveScreeningOptions = [
  'Up to date',
  'Unknown',
  'Need to schedule',
  'Not age appropriate yet',
]

const yesNoUnknownOptions = ['No', 'Yes', 'Unknown', 'Prefer not to answer']

const diabetesStatusOptions = [
  'No',
  'Prediabetes',
  'Diabetes',
  'Diabetes, type unknown',
  'Unknown',
  'Prefer not to answer',
]

const meaningfulLifestyleFields = [
  'ageRange',
  'sexAtBirth',
  'heightFeet',
  'heightInches',
  'weight',
  'smokingStatus',
  'alcoholUse',
  'exercise',
  'fruitVegIntake',
  'dietQuality',
  'sleep',
  'waterIntake',
  'sugaryDrinks',
  'stressLevel',
  'screenTime',
  'preventiveScreenings',
  'knownHighBloodPressure',
  'knownHighCholesterol',
  'diabetesStatus',
]

function hasMeaningfulFamilyHistory(familyMembers = []) {
  return familyMembers.some(
    (member) =>
      relationships.includes(member.relationship) &&
      Array.isArray(member.illnesses) &&
      member.illnesses.length > 0 &&
      member.illnesses.some((illness) => !isNoIllness(illness)),
  )
}

function hasEnoughLifestyleAnswers(profileForm, profileIllnesses = []) {
  const answeredCount = meaningfulLifestyleFields.filter((field) =>
    Boolean(profileForm[field]),
  ).length

  return (
    answeredCount >= 3 ||
    profileIllnesses.length > 0 ||
    Boolean(profileForm.name && answeredCount >= 2)
  )
}

function hasCurrentHealthData({
  profileForm,
  profileHasUnlistedCondition,
  profileIllnesses,
  profileNoListedConditions,
}) {
  return (
    Boolean(profileForm.ageRange) &&
    Boolean(profileForm.sexAtBirth) &&
    (Boolean(profileForm.knownHighBloodPressure) ||
      Boolean(profileForm.knownHighCholesterol) ||
      Boolean(profileForm.diabetesStatus) ||
      profileIllnesses.length > 0 ||
      profileNoListedConditions ||
      profileHasUnlistedCondition)
  )
}

function hasFamilyStructureData(familyStructure) {
  return isFamilyStructureComplete({
    familyStructureFields,
    value: familyStructure,
  })
}

function hasEverydayHabitsData(profileForm) {
  return [
    'exercise',
    'fruitVegIntake',
    'smokingStatus',
    'alcoholUse',
    'sleep',
    'dietQuality',
    'waterIntake',
    'sugaryDrinks',
    'stressLevel',
    'screenTime',
    'preventiveScreenings',
  ].every((field) => Boolean(profileForm[field]))
}

function hasAssessmentData({ familyMembers, profileForm, profileIllnesses }) {
  return (
    hasMeaningfulFamilyHistory(familyMembers) ||
    hasEnoughLifestyleAnswers(profileForm, profileIllnesses)
  )
}

function hasAnyAssessmentProgress({
  familyMembers,
  profileForm,
  profileHasUnlistedCondition,
  profileIllnesses,
  profileNoListedConditions,
}) {
  return (
    familyMembers.length > 0 ||
    profileIllnesses.length > 0 ||
    profileNoListedConditions ||
    profileHasUnlistedCondition ||
    Boolean(profileForm.name) ||
    meaningfulLifestyleFields.some((field) => Boolean(profileForm[field]))
  )
}

const storageKey = 'family-health-app-state-v1'

const defaultSavedState = {
  activeView: 'dashboard',
  accountSettingsOpen: false,
  accountProfile: {
    avatarPath: '',
    avatarUrl: '',
    displayName: '',
  },
  userProfile: null,
  profileForm: initialProfileForm,
  profileIllnesses: [],
  profileIllnessInput: '',
  profileNoListedConditions: false,
  profileHasUnlistedCondition: false,
  familyStructure: defaultFamilyStructure,
  familyStructureCompleted: false,
  familyMembers: [],
  familyMemberName: '',
  relationship: '',
  selectedIllnesses: [],
  familyEarlyDiagnosis: false,
  familyDiagnosisAge: '',
  editingFamilyMemberId: null,
  habitProgress: {},
  completedGoals: {},
  completedGoalIds: [],
  dailyActions: [],
  dailyActionsDate: '',
  completedDailyActionIds: [],
  dailyGoals: [],
  dailyGoalsDate: '',
  lastGoalResetDate: '',
  weeklyActions: [],
  weeklyActionsWeek: '',
  completedWeeklyActionIds: [],
  monthlyActions: [],
  monthlyActionsMonth: '',
  completedMonthlyActionIds: [],
  preventionActionHistory: [],
  goalCompletionHistory: {},
  activeLocation: {
    city: '',
    latitude: null,
    longitude: null,
    source: '',
    zipCode: '',
  },
  locationStatus: 'idle',
  locationMessage: '',
}

const diagnosisAgeGoalLabel =
  'Ask a family member about diagnosis ages if you have the opportunity.'
const legacyDiagnosisAgeGoalLabels = new Set([
  ['Update', 'diagnosis ages in your Family Health Tree.'].join(' '),
  'If you know them, add diagnosis ages for relatives in your Family Health Tree.',
])

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item) => typeof item === 'string')
}

function sanitizeProfileForm(value) {
  if (!isPlainObject(value)) {
    return initialProfileForm
  }

  return Object.keys(initialProfileForm).reduce(
    (profileForm, key) => ({
      ...profileForm,
      [key]:
        key === 'diabetesStatus' &&
        getIllnessKey(asString(value[key])) === 'diabetes'
          ? 'Diabetes'
          : asString(value[key]),
    }),
    { ...initialProfileForm },
  )
}

function getDatabaseIllness(value) {
  const illnessKey = getIllnessKey(value)

  if (!illnessKey) {
    return ''
  }

  return (
    starterIllnesses.find(
      (starterIllness) => getIllnessKey(starterIllness) === illnessKey,
    ) || ''
  )
}

function sanitizeDatabaseIllnesses(value) {
  return asStringArray(value).reduce((illnesses, illness) => {
    const databaseIllness = getDatabaseIllness(illness)

    return databaseIllness
      ? addIllnessToList(illnesses, databaseIllness)
      : illnesses
  }, [])
}

function sanitizeUserProfile(value) {
  if (!isPlainObject(value)) {
    return null
  }

  return {
    id: asString(value.id, 'self'),
    relationship: 'Self',
    name: asString(value.name),
    age: asString(value.age),
    ageRange: asString(value.ageRange),
    sex: asString(value.sex),
    sexAtBirth: asString(value.sexAtBirth),
    heightFeet: asString(value.heightFeet),
    heightInches: asString(value.heightInches),
    weight: asString(value.weight),
    bmi: typeof value.bmi === 'number' ? value.bmi : '',
    smokingStatus: asString(value.smokingStatus),
    alcoholUse: asString(value.alcoholUse),
    exercise: asString(value.exercise),
    fruitVegIntake: asString(value.fruitVegIntake),
    dietQuality: asString(value.dietQuality),
    sleep: asString(value.sleep),
    waterIntake: asString(value.waterIntake),
    sugaryDrinks: asString(value.sugaryDrinks),
    stressLevel: asString(value.stressLevel),
    screenTime: asString(value.screenTime),
    preventiveScreenings: asString(value.preventiveScreenings),
    knownHighBloodPressure: asString(value.knownHighBloodPressure),
    knownHighCholesterol: asString(value.knownHighCholesterol),
    diabetesStatus:
      getIllnessKey(asString(value.diabetesStatus)) === 'diabetes'
        ? 'Diabetes'
        : asString(value.diabetesStatus),
    illnesses: sanitizeDatabaseIllnesses(value.illnesses || value.conditions),
    noListedConditions: Boolean(value.noListedConditions),
    hasUnlistedCondition: Boolean(value.hasUnlistedCondition),
    isSelf: true,
  }
}

function sanitizeFamilyStructure(value) {
  return sanitizeFamilyStructureCounts({
    defaultFamilyStructure,
    familyStructureFields,
    value,
  })
}

function getFamilyConditionCategory(conditionName) {
  const conditionKey = getIllnessKey(conditionName)
  const category = familyConditionCategories.find((conditionCategory) =>
    conditionCategory.conditions.some(
      (condition) => getIllnessKey(condition) === conditionKey,
    ),
  )

  return category?.id || 'other'
}

function sanitizeFamilyConditionEntry(condition, fallbackDiagnosisAge = '') {
  const rawName = isPlainObject(condition)
    ? asString(condition.name || condition.condition)
    : asString(condition)
  const name = rawName.trim()

  if (!name) {
    return null
  }

  const rawDiagnosisAge = isPlainObject(condition)
    ? asString(condition.diagnosisAge)
    : asString(fallbackDiagnosisAge)
  const diagnosisAge = rawDiagnosisAge.trim()

  return {
    category: isPlainObject(condition)
      ? asString(condition.category, getFamilyConditionCategory(name))
      : getFamilyConditionCategory(name),
    diagnosisAge,
    name,
  }
}

function sanitizeFamilyConditions(value, fallbackDiagnosisAge = '') {
  const conditionSource = Array.isArray(value) ? value : []
  const seenConditions = new Set()

  return conditionSource.reduce((conditions, condition) => {
    const sanitizedCondition = sanitizeFamilyConditionEntry(
      condition,
      fallbackDiagnosisAge,
    )

    if (!sanitizedCondition) {
      return conditions
    }

    const conditionKey = getIllnessKey(sanitizedCondition.name)

    if (seenConditions.has(conditionKey)) {
      return conditions
    }

    seenConditions.add(conditionKey)

    return [...conditions, sanitizedCondition]
  }, [])
}

function getIllnessesFromConditions(conditions = []) {
  return conditions.map((condition) => condition.name).filter(Boolean)
}

function getEarliestDiagnosisAgeFromConditions(conditions = []) {
  const ages = conditions
    .map((condition) => Number(condition.diagnosisAge))
    .filter((age) => Number.isInteger(age) && age >= 0 && age <= 120)

  return ages.length > 0 ? String(Math.min(...ages)) : ''
}

function hasRelativeHealthHistory(member) {
  return (
    Array.isArray(member?.conditions) &&
    member.conditions.some((condition) => Boolean(condition.name))
  )
}

function getConditionIdentityKey(conditions = []) {
  return sanitizeFamilyConditions(conditions)
    .map((condition) =>
      [
        getIllnessKey(condition.name),
        asString(condition.category),
        asString(condition.diagnosisAge),
      ].join(':'),
    )
    .sort()
    .join('|')
}

function getFamilyMemberIdentityKey(member) {
  return [
    asString(member.relationshipType || 'legacy'),
    asString(member.relationship),
    asString(member.slotIndex || ''),
    asString(member.name).trim().toLowerCase(),
    getConditionIdentityKey(member.conditions),
  ].join('::')
}

function getFamilyEditorSignature({
  activeFamilyConditionGroup = '',
  familyConditionDetails = {},
  familyConditionSearchInput = '',
  familyMemberName = '',
  pendingFamilyCondition = '',
  pendingFamilyDiagnosisAge = '',
  selectedIllnesses = [],
}) {
  const normalizedConditions = selectedIllnesses
    .map((condition) => {
      const conditionKey = getIllnessKey(condition)
      const details = familyConditionDetails[conditionKey] || {}

      return {
        category: asString(details.category),
        diagnosisAge: asString(details.diagnosisAge),
        key: conditionKey,
        name: asString(details.name || condition),
      }
    })
    .sort((firstCondition, secondCondition) =>
      firstCondition.key.localeCompare(secondCondition.key),
    )

  return JSON.stringify({
    activeFamilyConditionGroup: asString(activeFamilyConditionGroup),
    familyConditionSearchInput: asString(familyConditionSearchInput).trim(),
    familyMemberName: asString(familyMemberName).trim(),
    pendingFamilyCondition: asString(pendingFamilyCondition),
    pendingFamilyDiagnosisAge: asString(pendingFamilyDiagnosisAge).trim(),
    selectedIllnesses: normalizedConditions,
  })
}

function getRelativeTypeLabel(relationshipType) {
  return relativeTypeDefinitions[relationshipType]?.displayName || 'Relative'
}

function getRelativeAvatarLabel(member) {
  if (member.relationshipType && member.relationshipType !== 'legacy') {
    const relationshipLabel = getRelativeTypeLabel(member.relationshipType)
    const initials = relationshipLabel
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()

    return member.slotIndex ? `${initials}${member.slotIndex}` : initials
  }

  return getInitialsFromName(getRelativePrimaryName(member))
}

function getRelationshipTypeFromLegacyRelationship(member) {
  const relationship = asString(member.relationship)
  const relationshipType = asString(member.relationshipType)

  if (relativeTypeDefinitions[relationshipType]) {
    return relationshipType
  }

  if (relationship === 'Mother') return 'mother'
  if (relationship === 'Father') return 'father'

  return 'legacy'
}

function getRelationshipForType(relationshipType, fallbackRelationship = 'Relative') {
  if (relationshipType === 'legacy') {
    return fallbackRelationship || 'Relative'
  }

  return (
    relativeTypeDefinitions[relationshipType]?.relationship ||
    fallbackRelationship ||
    'Relative'
  )
}

function sanitizeFamilyMembers(value) {
  if (!Array.isArray(value)) {
    return []
  }

  const seenParentTypes = new Set()
  const seenMemberKeys = new Set()

  return value
    .filter(isPlainObject)
    .map((member) => {
      const relationshipType = getRelationshipTypeFromLegacyRelationship(member)
      const inferredSlotIndex = getSlotIndexFromRelativeId(
        member.id,
        relationshipType,
      )
      const relationship = getRelationshipForType(
        relationshipType,
        asString(member.relationship),
      )
      const conditions = sanitizeFamilyConditions(
        member.conditions || member.illnesses,
        member.diagnosisAge,
      )
      const illnesses = getIllnessesFromConditions(conditions)

      return {
        id:
          getStableStructuredRelativeId({
            existingId: member.id,
            relationshipType,
            slotIndex: member.slotIndex,
          }) || createId(),
        name: asString(member.name),
        relationship,
        relationshipType,
        slotIndex: Number.isInteger(Number(member.slotIndex))
          ? Number(member.slotIndex)
          : inferredSlotIndex,
        illnesses,
        conditions,
        earlyDiagnosis: Boolean(member.earlyDiagnosis),
        diagnosisAge: asString(member.diagnosisAge),
        needsReview:
          Boolean(member.needsReview) ||
          (relationshipType === 'legacy' &&
            ['Grandparent', 'Parent', 'Sibling', 'Child'].includes(
              asString(member.relationship),
            )),
        originalRelationship: asString(member.originalRelationship || member.relationship),
      }
    })
    .filter((member) => relationships.includes(member.relationship))
    .map((member) => {
      if (member.relationship !== 'Mother' && member.relationship !== 'Father') {
        return member
      }

      if (!seenParentTypes.has(member.relationship)) {
        seenParentTypes.add(member.relationship)
        return member
      }

      return {
        ...member,
        originalRelationship: member.relationship,
        relationship: 'Relative',
        relationshipType: 'legacy',
        needsReview: true,
      }
    })
    .filter((member) => {
      const memberKey = getFamilyMemberIdentityKey(member)

      if (seenMemberKeys.has(memberKey)) {
        return false
      }

      seenMemberKeys.add(memberKey)
      return true
    })
}

function sanitizeCoordinates(value) {
  if (
    !isPlainObject(value) ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number'
  ) {
    return null
  }

  return {
    latitude: value.latitude,
    longitude: value.longitude,
  }
}

function sanitizeActiveLocation(value) {
  if (!isPlainObject(value)) {
    return { ...defaultSavedState.activeLocation }
  }

  const source = ['manual', 'gps', 'current-location'].includes(value.source)
    ? value.source
    : ''
  const latitude = Number(value.latitude)
  const longitude = Number(value.longitude)

  return {
    city: asString(value.city),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    source,
    zipCode: asString(value.zipCode),
  }
}

function sanitizeHabitProgress(value) {
  if (!isPlainObject(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => typeof key === 'string')
      .map(([key, completed]) => [key, Boolean(completed)]),
  )
}

function sanitizeGoalCompletionHistory(value) {
  if (!isPlainObject(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([dateKey, goalIds]) =>
          typeof dateKey === 'string' && Array.isArray(goalIds),
      )
      .map(([dateKey, goalIds]) => [dateKey, asStringArray(goalIds)]),
  )
}

function sanitizePreventionActionHistory(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isPlainObject)
    .map((entry) => ({
      adaptationLevel: Number.isInteger(Number(entry.adaptationLevel))
        ? Number(entry.adaptationLevel)
        : 0,
      completionAmount: Number.isFinite(Number(entry.completionAmount))
        ? Number(entry.completionAmount)
        : entry.completionStatus === 'complete'
          ? 1
          : 0,
      completionStatus:
        entry.completionStatus === 'complete' ? 'complete' : 'incomplete',
      consecutivePeriodsAttempted: Number.isInteger(Number(entry.consecutivePeriodsAttempted))
        ? Number(entry.consecutivePeriodsAttempted)
        : 1,
      dateAssigned: asString(entry.dateAssigned || entry.periodKey),
      goalCategory: asString(entry.goalCategory || entry.category),
      goalId: asString(entry.goalId || entry.id),
      goalType: asString(entry.goalType || entry.id),
      period: ['today', 'week', 'month'].includes(entry.period)
        ? entry.period
        : asString(entry.timeframe || entry.period),
      recentCompletionRate: Number.isFinite(Number(entry.recentCompletionRate))
        ? Number(entry.recentCompletionRate)
        : entry.completionStatus === 'complete'
          ? 1
          : 0,
      target: isPlainObject(entry.target) ? entry.target : null,
    }))
    .filter((entry) => entry.goalId && entry.goalType && entry.period && entry.dateAssigned)
}

function getActionCompletionAmount(action, isComplete) {
  if (!isComplete) {
    return 0
  }

  if (Number.isFinite(Number(action.completionAmount))) {
    return Number(action.completionAmount)
  }

  const target = action.target || {}

  return (
    Number(target.targetSessions) ||
    Number(target.sessions) ||
    Number(target.days) ||
    Number(target.count) ||
    1
  )
}

function getActionCompletionRate(action, completionAmount) {
  const target = action.target || {}
  const targetValue =
    Number(target.targetSessions) ||
    Number(target.sessions) ||
    Number(target.days) ||
    Number(target.count) ||
    1

  return Math.min(1, Math.max(0, completionAmount / targetValue))
}

function buildActionHistoryEntries({
  actions = [],
  completedActionIds = [],
  period,
  periodKey,
}) {
  const completedSet = new Set(completedActionIds)

  return actions
    .filter((action) => action?.id)
    .map((action) => {
      const isComplete = completedSet.has(action.id)
      const completionAmount = getActionCompletionAmount(action, isComplete)

      return {
        adaptationLevel: Number.isInteger(Number(action.adaptationLevel))
          ? Number(action.adaptationLevel)
          : 0,
        completionAmount,
        completionStatus: isComplete ? 'complete' : 'incomplete',
        consecutivePeriodsAttempted: 1,
        dateAssigned: periodKey,
        goalCategory: asString(action.goalCategory || action.category),
        goalId: action.id,
        goalType: asString(action.goalType || action.id),
        period,
        recentCompletionRate: getActionCompletionRate(action, completionAmount),
        target: isPlainObject(action.target) ? action.target : null,
      }
    })
}

function mergeActionHistoryEntries(currentHistory, nextEntries) {
  const historyByKey = new Map(
    sanitizePreventionActionHistory(currentHistory).map((entry) => [
      `${entry.period}:${entry.dateAssigned}:${entry.goalId}`,
      entry,
    ]),
  )

  sanitizePreventionActionHistory(nextEntries).forEach((entry) => {
    historyByKey.set(`${entry.period}:${entry.dateAssigned}:${entry.goalId}`, entry)
  })

  return Array.from(historyByKey.values()).slice(-120)
}

function sanitizeAccountProfile(value) {
  if (!isPlainObject(value)) {
    return { ...defaultSavedState.accountProfile }
  }

  return {
    avatarPath: asString(value.avatarPath),
    avatarUrl: asString(value.avatarUrl),
    displayName: asString(value.displayName),
  }
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLocalMonthKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function getLocalWeekKey(date = new Date()) {
  return getLocalWeekDateKeys(date)[0]
}

function isLocalDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

function isLocalMonthKey(value) {
  return /^\d{4}-\d{2}$/.test(String(value || ''))
}

function getLocalWeekDateKeys(date = new Date()) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  return Array.from({ length: 7 }, (_, index) => {
    const weekDate = new Date(weekStart)
    weekDate.setDate(weekStart.getDate() + index)
    return getLocalDateKey(weekDate)
  })
}

function formatDisplayList(items) {
  const uniqueItems = [...new Set(items.filter(Boolean))]

  if (uniqueItems.length === 0) {
    return ''
  }

  if (uniqueItems.length === 1) {
    return uniqueItems[0]
  }

  if (uniqueItems.length === 2) {
    return `${uniqueItems[0]} and ${uniqueItems[1]}`
  }

  return `${uniqueItems.slice(0, -1).join(', ')}, and ${uniqueItems.at(-1)}`
}

function sanitizeActiveView(value) {
  if (viewTabs.some((tab) => tab.id === value)) {
    return value
  }

  return legacyViewMap[value] || 'dashboard'
}

function sanitizeDailyGoals(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((goal) => {
      if (!isPlainObject(goal)) {
        return null
      }

      const savedLabel = asString(goal.label || goal.title).trim()
      const label = legacyDiagnosisAgeGoalLabels.has(savedLabel)
        ? diagnosisAgeGoalLabel
        : savedLabel
      const id = asString(goal.id).trim() || `daily-${getGoalSlug(label)}`
      const isLegacyBreastGuidance = id === 'month-breast-screening-guidance'

      if (!label || !id) {
        return null
      }

      return {
        category: asString(goal.category),
        completionAmount: Number.isFinite(Number(goal.completionAmount))
          ? Number(goal.completionAmount)
          : undefined,
        evidenceId: asString(goal.evidenceId),
        goalCategory: asString(goal.goalCategory || goal.category),
        goalType: asString(goal.goalType || id),
        id,
        label,
        personalizationReasons: asStringArray(goal.personalizationReasons),
        reason: asString(goal.reason),
        resourceIntent: isLegacyBreastGuidance
          ? 'breast-screening'
          : asString(goal.resourceIntent),
        resourceNeeded: Boolean(goal.resourceNeeded),
        resourceType: isLegacyBreastGuidance
          ? 'screening_guidance'
          : asString(goal.resourceType),
        target: isPlainObject(goal.target) ? goal.target : null,
        adaptationLevel: Number.isInteger(Number(goal.adaptationLevel))
          ? Number(goal.adaptationLevel)
          : 0,
        timeframe: asString(goal.timeframe),
      }
    })
    .filter(Boolean)
}

function completedGoalIdsToProgress(value) {
  if (!Array.isArray(value)) {
    return {}
  }

  return value.reduce((progress, goalId) => {
    if (typeof goalId === 'string' && goalId.trim()) {
      progress[goalId] = true
    }

    return progress
  }, {})
}

function sanitizeLocationStatus(value) {
  return ['idle', 'success', 'error', 'manual', 'loading'].includes(value)
    ? value
    : 'idle'
}

function normalizeSavedState(value) {
  if (!isPlainObject(value)) {
    return defaultSavedState
  }

  const userProfile = sanitizeUserProfile(value.userProfile)
  const profileForm = isPlainObject(value.profileForm)
    ? sanitizeProfileForm(value.profileForm)
    : sanitizeProfileForm(userProfile)
  const profileIllnesses = Array.isArray(value.profileIllnesses)
    ? sanitizeDatabaseIllnesses(value.profileIllnesses)
    : sanitizeDatabaseIllnesses(userProfile?.illnesses)
  const profileNoListedConditions = Boolean(
    value.profileNoListedConditions || userProfile?.noListedConditions,
  )
  const profileHasUnlistedCondition = Boolean(
    value.profileHasUnlistedCondition || userProfile?.hasUnlistedCondition,
  )
  const savedDailyActions =
    Array.isArray(value.dailyActions) && value.dailyActions.length > 0
      ? value.dailyActions
      : value.dailyGoals
  const savedCompletedDailyActionIds =
    Array.isArray(value.completedDailyActionIds) &&
    value.completedDailyActionIds.length > 0
      ? value.completedDailyActionIds
      : value.completedGoalIds
  const locationStatus = sanitizeLocationStatus(value.locationStatus)
  const legacyCoordinates = sanitizeCoordinates(value.userCoordinates)
  const activeLocation = isPlainObject(value.activeLocation)
    ? sanitizeActiveLocation(value.activeLocation)
    : legacyCoordinates
      ? {
          city: '',
          latitude: legacyCoordinates.latitude,
          longitude: legacyCoordinates.longitude,
          source: 'gps',
          zipCode: '',
        }
      : {
          city: asString(value.manualLocation),
          latitude: null,
          longitude: null,
          source: asString(value.manualLocation) ? 'manual' : '',
          zipCode: /^\d{5}$/.test(asString(value.manualLocation).trim())
            ? asString(value.manualLocation).trim()
            : '',
        }
  const normalizedFamilyStructure = sanitizeFamilyStructure(value.familyStructure)
  const normalizedFamilyMembers = sanitizeFamilyMembers(value.familyMembers)
  const savedWorkflowIndex = assessmentSteps.findIndex(
    (step) => step.id === sanitizeActiveView(value.activeView),
  )
  const familyStepIndex = assessmentSteps.findIndex((step) => step.id === 'family')
  const hasLegacyFamilyStructureProgress =
    Object.values(normalizedFamilyStructure).some(
      (count) => String(count).trim() !== '',
    ) ||
    normalizedFamilyMembers.length > 0 ||
    savedWorkflowIndex >= familyStepIndex

  return {
    activeView: sanitizeActiveView(value.activeView),
    accountSettingsOpen: Boolean(value.accountSettingsOpen),
    accountProfile: sanitizeAccountProfile(value.accountProfile),
    userProfile,
    profileForm,
    profileIllnesses,
    profileIllnessInput: asString(value.profileIllnessInput),
    profileNoListedConditions:
      profileIllnesses.length > 0 ? false : profileNoListedConditions,
    profileHasUnlistedCondition:
      profileIllnesses.length > 0 || profileNoListedConditions
        ? false
        : profileHasUnlistedCondition,
    familyStructure: normalizedFamilyStructure,
    familyStructureCompleted:
      typeof value.familyStructureCompleted === 'boolean'
        ? value.familyStructureCompleted
        : hasLegacyFamilyStructureProgress,
    familyMembers: normalizedFamilyMembers,
    familyMemberName: asString(value.familyMemberName),
    relationship: relationships.includes(value.relationship)
      ? value.relationship
      : '',
    selectedIllnesses: asStringArray(value.selectedIllnesses),
    familyEarlyDiagnosis: Boolean(value.familyEarlyDiagnosis),
    familyDiagnosisAge: asString(value.familyDiagnosisAge),
    editingFamilyMemberId:
      typeof value.editingFamilyMemberId === 'string'
        ? value.editingFamilyMemberId
        : null,
    habitProgress: sanitizeHabitProgress(
      value.completedGoals ||
        value.habitProgress ||
        completedGoalIdsToProgress(value.completedGoalIds),
    ),
    completedGoals: sanitizeHabitProgress(
      value.completedGoals ||
        value.habitProgress ||
        completedGoalIdsToProgress(value.completedGoalIds),
    ),
    completedGoalIds: asStringArray(value.completedGoalIds),
    dailyActions: sanitizeDailyGoals(savedDailyActions),
    dailyActionsDate: isLocalDateKey(value.dailyActionsDate || value.dailyGoalsDate)
      ? value.dailyActionsDate || value.dailyGoalsDate
      : '',
    completedDailyActionIds: asStringArray(savedCompletedDailyActionIds),
    dailyGoals: sanitizeDailyGoals(value.dailyGoals),
    dailyGoalsDate: isLocalDateKey(value.dailyGoalsDate)
      ? value.dailyGoalsDate
      : '',
    lastGoalResetDate: isLocalDateKey(value.lastGoalResetDate)
      ? value.lastGoalResetDate
      : '',
    weeklyActions: sanitizeDailyGoals(value.weeklyActions),
    weeklyActionsWeek: isLocalDateKey(value.weeklyActionsWeek)
      ? value.weeklyActionsWeek
      : '',
    completedWeeklyActionIds: asStringArray(value.completedWeeklyActionIds),
    monthlyActions: sanitizeDailyGoals(value.monthlyActions),
    monthlyActionsMonth: isLocalMonthKey(value.monthlyActionsMonth)
      ? value.monthlyActionsMonth
      : '',
    completedMonthlyActionIds: asStringArray(value.completedMonthlyActionIds),
    preventionActionHistory: sanitizePreventionActionHistory(
      value.preventionActionHistory,
    ),
    goalCompletionHistory: sanitizeGoalCompletionHistory(value.goalCompletionHistory),
    activeLocation,
    locationStatus,
    locationMessage:
      locationStatus === 'idle' ? '' : asString(value.locationMessage),
  }
}

function loadSavedAppState() {
  if (typeof window === 'undefined') {
    return defaultSavedState
  }

  try {
    const savedState = window.localStorage.getItem(storageKey)

    if (!savedState) {
      return defaultSavedState
    }

    return normalizeSavedState(JSON.parse(savedState))
  } catch {
    return defaultSavedState
  }
}

function clearSavedAppState() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Ignore storage cleanup failures so Start Over still clears in-memory state.
  }
}

function getProfileStateSnapshot({
  activeLocation,
  activeView,
  accountProfile,
  accountSettingsOpen,
  editingFamilyMemberId,
  familyDiagnosisAge,
  familyEarlyDiagnosis,
  familyMemberName,
  familyMembers,
  familyStructure,
  familyStructureCompleted,
  completedDailyActionIds,
  completedMonthlyActionIds,
  completedWeeklyActionIds,
  dailyActions,
  dailyActionsDate,
  dailyGoals,
  dailyGoalsDate,
  goalCompletionHistory,
  habitProgress,
  lastGoalResetDate,
  locationMessage,
  locationStatus,
  monthlyActions,
  monthlyActionsMonth,
  preventionActionHistory,
  weeklyActions,
  weeklyActionsWeek,
  profileForm,
  profileHasUnlistedCondition,
  profileIllnessInput,
  profileIllnesses,
  profileNoListedConditions,
  relationship,
  selectedIllnesses,
  userProfile,
}) {
  return {
    activeView,
    accountSettingsOpen: Boolean(accountSettingsOpen),
    accountProfile,
    userProfile,
    profileForm,
    profileIllnesses,
    profileIllnessInput,
    profileNoListedConditions,
    profileHasUnlistedCondition,
    familyStructure,
    familyStructureCompleted: Boolean(familyStructureCompleted),
    familyMembers,
    familyMemberName,
    relationship,
    selectedIllnesses,
    familyEarlyDiagnosis,
    familyDiagnosisAge,
    editingFamilyMemberId,
    habitProgress,
    completedGoals: habitProgress,
    completedGoalIds: Object.entries(habitProgress)
      .filter(([, isComplete]) => Boolean(isComplete))
      .map(([goalId]) => goalId),
    dailyActions,
    dailyActionsDate,
    completedDailyActionIds,
    completedWeeklyActionIds,
    dailyGoals,
    dailyGoalsDate,
    lastGoalResetDate,
    monthlyActions,
    monthlyActionsMonth,
    completedMonthlyActionIds,
    preventionActionHistory,
    weeklyActions,
    weeklyActionsWeek,
    goalCompletionHistory,
    activeLocation,
    locationStatus,
    locationMessage,
  }
}

const workflowSteps = assessmentSteps

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeIllness(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getDisplayConditionName(value) {
  return getIllnessKey(value) === 'diabetes' ? 'Diabetes' : value
}

function getIllnessKey(value) {
  const normalizedIllness = normalizeIllness(value)
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\.+$/g, '')

  return normalizedIllness === legacyDiabetesLabel
    ? 'diabetes'
    : normalizedIllness
}

function isNoIllness(value) {
  const illnessKey = getIllnessKey(value)

  return (
    illnessKey === getIllnessKey(legacyNoIllnessOption) ||
    illnessKey === getIllnessKey(noListedConditionsLabel) ||
    illnessKey === getIllnessKey(noKnownConditionsLabel)
  )
}

function calculateBmi({ heightFeet, heightInches, weight }) {
  const feet = Number(heightFeet)
  const inches = Number(heightInches)
  const pounds = Number(weight)
  const hasFeet = String(heightFeet).trim() !== ''
  const hasInches = String(heightInches).trim() !== ''
  const hasWeight = String(weight).trim() !== ''
  const totalInches = feet * 12 + inches

  if (
    !hasFeet ||
    !hasInches ||
    !hasWeight ||
    !Number.isFinite(feet) ||
    !Number.isFinite(inches) ||
    !Number.isFinite(pounds) ||
    feet < 3 ||
    feet > 8 ||
    inches < 0 ||
    inches > 11 ||
    pounds <= 0 ||
    totalInches <= 0
  ) {
    return null
  }

  const heightMeters = totalInches * 0.0254
  const weightKilograms = pounds * 0.45359237
  const bmi = weightKilograms / (heightMeters ** 2)

  return Number(bmi.toFixed(1))
}

function getBmiCategory(bmi) {
  if (!bmi) {
    return 'Add height and weight to calculate BMI.'
  }

  if (bmi < 18.5) {
    return 'Underweight'
  }

  if (bmi < 25) {
    return 'Healthy'
  }

  if (bmi < 30) {
    return 'Overweight'
  }

  return 'Obesity'
}

function addIllnessToList(currentIllnesses, illness) {
  const illnessKey = getIllnessKey(illness)

  if (!illnessKey) {
    return currentIllnesses
  }

  if (isNoIllness(illness)) {
    return []
  }

  if (
    currentIllnesses.some(
      (currentIllness) => getIllnessKey(currentIllness) === illnessKey,
    )
  ) {
    return currentIllnesses
  }

  return [...currentIllnesses, illness]
}

function getMapQuery(event) {
  if (isOnlineEvent(event)) return ''
  if (event?.address) return event.address

  if (
    event?.locationName &&
    event?.city &&
    normalizeCity(event.locationName) !== normalizeCity(event.city)
  ) {
    return `${event.locationName}, ${event.city}, CA`
  }

  if (Number.isFinite(event?.latitude) && Number.isFinite(event?.longitude)) {
    return `${event.latitude},${event.longitude}`
  }

  if (
    Number.isFinite(event?.coordinates?.latitude) &&
    Number.isFinite(event?.coordinates?.longitude)
  ) {
    return `${event.coordinates.latitude},${event.coordinates.longitude}`
  }

  return ''
}

function getEventLocationLabel(event) {
  return getLocationLabel(event)
}

function isOnlineEvent(event) {
  return event?.attendanceMode === 'online'
}

function hasSpecificLocation(event) {
  const hasVenue =
    event?.locationName &&
    event?.city &&
    normalizeCity(event.locationName) !== normalizeCity(event.city) &&
    normalizeCity(event.locationName) !== 'online'

  return Boolean(
    event?.address ||
      event?.streetAddress ||
      hasVenue ||
      (Number.isFinite(event?.latitude) && Number.isFinite(event?.longitude)),
  )
}

function getLocationLabel(event) {
  if (event?.attendanceMode === 'online') {
    return event.platform ? `Online · ${event.platform}` : 'Online'
  }

  if (event?.attendanceMode === 'hybrid') {
    return 'Hybrid · Online and in person'
  }

  if (
    event?.locationName &&
    event?.city &&
    normalizeCity(event.locationName) !== normalizeCity(event.city)
  ) {
    return `${event.locationName} · ${event.city}`
  }

  return event?.city || event?.locationName
    ? `${event.city || event.locationName}`
    : 'Location available'
}

function getResourceKindLabel(event) {
  const resourceType = normalizeGoalText(event?.resourceType || event?.type || '')

  if (event?.isFdaMammographyFacility || resourceType.includes('mammography')) {
    return 'Screening facility'
  }

  if (resourceType.includes('trusted') || event?.attendanceMode === 'online') {
    return event?.platform === 'Trusted website' ? 'Trusted guidance' : 'Online tool'
  }

  if (
    resourceType.includes('clinic') ||
    resourceType.includes('pharmacy') ||
    resourceType.includes('health service')
  ) {
    return 'Clinic / health service'
  }

  if (resourceType.includes('screening')) {
    return 'Screening facility'
  }

  if (resourceType.includes('trail')) {
    return 'Walking Trail'
  }

  if (resourceType.includes('park')) {
    return 'Park'
  }

  if (resourceType.includes('recreation')) {
    return 'Recreation area'
  }

  if (
    resourceType.includes('farmers market')
  ) {
    return 'Place'
  }

  return event?.startsAt || event?.when ? 'Event' : 'Resource'
}

function getResourceTimingLabel(event) {
  const resourceKind = getResourceKindLabel(event)

  if (
    [
      'Park',
      'Place',
      'Recreation area',
      'Screening facility',
      'Trusted guidance',
      'Online tool',
      'Walking Trail',
    ].includes(resourceKind)
  ) {
    return resourceKind
  }

  return formatEventDateTime(event)
}

function getEventLocationActionLabel(event) {
  if (isOnlineEvent(event)) {
    return ''
  }

  const resourceType = normalizeGoalText(event?.resourceType || event?.type || '')

  if (
    resourceType.includes('park') ||
    resourceType.includes('trail') ||
    resourceType.includes('recreation')
  ) {
    return hasSpecificLocation(event) ? 'View on Map' : ''
  }

  return hasSpecificLocation(event) ? 'View location' : ''
}

function buildEventMapEmbedUrl(event) {
  const destination = getMapQuery(event)

  if (!destination) {
    return ''
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(
    destination,
  )}&output=embed`
}

function buildEventMapsUrl(event) {
  const destination = getMapQuery(event)

  if (!destination) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    destination,
  )}`
}

function cleanEventDescription(value) {
  return String(value || '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\S+@\S+\.\S+/gi, '')
    .replace(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g, '')
    .replace(/\b(register here|sponsored by|for more information|classes are tailored)[\s\S]*$/i, '')
    .replace(/\bheld\s+(mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?)[^.]*\./gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateText(value, maxLength = 220) {
  if (value.length <= maxLength) return value
  const shortened = value.slice(0, maxLength)
  const lastSpace = shortened.lastIndexOf(' ')

  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}…`
}

function getEventPreview(event, expandedEventDescriptions) {
  const cleanedDescription =
    event.summary ||
    cleanEventDescription(event.description)
  const isExpanded = Boolean(expandedEventDescriptions[event.id])

  return {
    fullText: cleanedDescription,
    isExpanded,
    shouldTruncate: cleanedDescription.length > 220,
    visibleText: isExpanded ? cleanedDescription : truncateText(cleanedDescription),
  }
}

function formatEventDateTime(event) {
  const rawDate = event.startsAt || event.when

  if (!rawDate) {
    return event.when || 'Date to be announced'
  }

  const parsedDate = new Date(rawDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return event.when || rawDate
  }

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    weekday: 'short',
    day: 'numeric',
  })
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${dateFormatter.format(parsedDate)} · ${timeFormatter.format(parsedDate)}`
}

function getActiveLocationLabel(activeLocation) {
  if (
    activeLocation.source === 'current-location' &&
    activeLocation.city &&
    activeLocation.zipCode
  ) {
    return `Current location · ${activeLocation.city}, ${activeLocation.zipCode}`
  }

  return activeLocation.zipCode || activeLocation.city || ''
}

function getLocationOriginTarget(activeLocation) {
  if (!activeLocation?.source) {
    return ''
  }

  if (
    Number.isFinite(activeLocation?.latitude) &&
    Number.isFinite(activeLocation?.longitude)
  ) {
    return `${activeLocation.latitude},${activeLocation.longitude}`
  }

  return getActiveLocationLabel(activeLocation)
}

function formatDistanceAway(distanceMiles) {
  if (!Number.isFinite(distanceMiles)) {
    return ''
  }

  const roundedDistance =
    distanceMiles < 10 ? distanceMiles.toFixed(1) : Math.round(distanceMiles)

  return `${roundedDistance} miles away`
}

function getWalkingPlaceType(park) {
  const amenityText = Array.isArray(park?.amenities)
    ? park.amenities.join(' ')
    : ''

  if (/trail|hiking/i.test(`${park?.name || ''} ${amenityText}`)) {
    return 'trail'
  }

  if (/recreation center/i.test(amenityText)) {
    return 'recreation'
  }

  return 'park'
}

function createWalkingPlaceResource(park) {
  const resourceType = getWalkingPlaceType(park)
  const typeLabel =
    resourceType === 'trail'
      ? 'Walking Trail'
      : resourceType === 'recreation'
        ? 'Recreation area'
        : 'Park'
  const distanceLabel = formatDistanceAway(park.distanceMiles)

  return {
    ...park,
    attendanceMode: 'in-person',
    directionsUrl: getParkMapUrl(park),
    eventMatchKeywords: ['walking', 'park', 'trail', 'outdoor activity'],
    eventMatchReason: park.activitySuggestion,
    eventLink: '',
    hasLocation: Boolean(park.address),
    isLocalCity: true,
    locationName: park.name,
    recommendationLabel: distanceLabel
      ? `${typeLabel} · ${distanceLabel}`
      : typeLabel,
    resourceSearchStageLabel: "Best Match for Today's Goal",
    resourceSearchStageRank: 0,
    resourceType,
    source: 'Local parks and trails',
    summary: Array.isArray(park.amenities) ? park.amenities.join(' · ') : '',
    title: park.name,
  }
}

function createBloodPressureSearchResource(activeLocation) {
  const location = activeLocation.zipCode || activeLocation.city

  if (!location) {
    return null
  }

  const searchQuery = `community health centers near ${location}`

  return {
    attendanceMode: 'unknown',
    city: activeLocation.city,
    eventLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`,
    eventMatchKeywords: ['blood pressure', 'community health center', 'primary care'],
    eventMatchReason: 'Search nearby community health centers and confirm services before visiting.',
    id: `blood-pressure-options-${activeLocation.zipCode || normalizeCity(activeLocation.city)}`,
    recommendationLabel: 'Nearby service search',
    resourceSearchStageLabel: 'Nearby Options',
    resourceSearchStageRank: 2,
    resourceType: 'clinic_search',
    source: 'Google Maps search',
    summary:
      "Check the location's website or call ahead to confirm blood-pressure services.",
    title: `Community health centers near ${activeLocation.city || activeLocation.zipCode}`,
  }
}

function getZipFromAddress(address) {
  return address.match(/\b\d{5}(?:-\d{4})?\b/)?.[0]?.slice(0, 5) || ''
}

function normalizeCity(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function getEventCity(event) {
  return (
    event?.city ||
    event?.location?.city ||
    event?.location?.address?.addressLocality ||
    event?.addressLocality ||
    ''
  )
}

function normalizeRemoteEvent(event, index) {
  const address = typeof event?.address === 'string' ? event.address : ''
  const locationName =
    typeof event?.locationName === 'string' && event.locationName.trim()
      ? event.locationName
      : typeof event?.location === 'string' && event.location.trim()
        ? event.location
        : ''
  const zipCode =
    typeof event?.zipCode === 'string' && /^\d{5}$/.test(event.zipCode)
      ? event.zipCode
      : getZipFromAddress(`${address} ${locationName}`)
  const healthTopics = Array.isArray(event?.healthTopics)
    ? event.healthTopics.filter((topic) => typeof topic === 'string' && topic.trim())
    : []
  const eventLink =
    typeof event?.registrationUrl === 'string' && event.registrationUrl.trim()
      ? event.registrationUrl
      : typeof event?.sourceUrl === 'string' && event.sourceUrl.trim()
        ? event.sourceUrl
      : typeof event?.eventLink === 'string' && event.eventLink.trim()
        ? event.eventLink
        : ''
  const sourceName =
    typeof event?.sourceName === 'string' && event.sourceName.trim()
      ? event.sourceName
      : typeof event?.source === 'string'
        ? event.source
      : ''
  const attendanceMode = ['online', 'in-person', 'hybrid', 'unknown'].includes(
    event?.attendanceMode,
  )
    ? event.attendanceMode
    : event?.isOnline
      ? 'online'
      : address
        ? 'in-person'
        : 'unknown'

  const normalizedEvent = {
    address,
    addressLocality:
      typeof event?.addressLocality === 'string' ? event.addressLocality : '',
    attendanceMode,
    city: typeof event?.city === 'string' ? event.city : '',
    description: typeof event?.description === 'string' ? event.description : '',
    directionsUrl: '',
    eventLink,
    hasLocation: Boolean(address),
    id:
      typeof event?.id === 'string' && event.id.trim()
        ? event.id
        : `event-${index + 1}`,
    image: typeof event?.image === 'string' ? event.image : '',
    healthTopics,
    latitude: Number.isFinite(event?.latitude) ? event.latitude : null,
    location: address || locationName,
    locationName,
    longitude: Number.isFinite(event?.longitude) ? event.longitude : null,
    onlineUrl:
      typeof event?.onlineUrl === 'string' && event.onlineUrl.trim()
        ? event.onlineUrl
        : '',
    platform: typeof event?.platform === 'string' ? event.platform : '',
    registrationRequired: Boolean(event?.registrationRequired),
    registrationUrl:
      typeof event?.registrationUrl === 'string' ? event.registrationUrl : '',
    source: sourceName,
    startsAt: typeof event?.startDate === 'string' ? event.startDate : '',
    summary: typeof event?.summary === 'string' ? event.summary : '',
    streetAddress:
      typeof event?.streetAddress === 'string' ? event.streetAddress : '',
    title:
      typeof event?.title === 'string' && event.title.trim()
        ? event.title
        : 'Untitled event',
    when:
      typeof event?.eventDateText === 'string' && event.eventDateText.trim()
        ? event.eventDateText
        : typeof event?.dateText === 'string' && event.dateText.trim()
          ? event.dateText
        : typeof event?.when === 'string'
          ? event.when
          : '',
    zipCode,
  }

  normalizedEvent.directionsUrl =
    typeof event?.directionsUrl === 'string' && event.directionsUrl.trim()
      ? event.directionsUrl
      : typeof event?.directionsLink === 'string' && event.directionsLink.trim()
        ? event.directionsLink
        : hasSpecificLocation(normalizedEvent) && !isOnlineEvent(normalizedEvent)
          ? buildEventMapsUrl(normalizedEvent)
          : ''

  normalizedEvent.hasLocation = hasSpecificLocation(normalizedEvent)

  return normalizedEvent
}

function getEventFilterResult({
  cityEvents,
  onlineEvents,
  activeLocation,
  resourcePriorities,
}) {
  const searchedZipCode = String(activeLocation.zipCode || '').trim()
  const hasPriorities = resourcePriorities.length > 0

  if (!searchedZipCode) {
    return {
      events: [],
      onlineEvents: [],
      status: hasPriorities ? 'location-needed' : 'no-priorities',
      targetCity: '',
      zipCode: '',
    }
  }

  if (!/^\d{5}$/.test(searchedZipCode)) {
    return {
      events: [],
      onlineEvents: [],
      status: 'invalid-zip',
      targetCity: '',
      zipCode: searchedZipCode,
    }
  }

  const targetCity = getCityForZip(searchedZipCode)

  if (!targetCity) {
    return {
      events: [],
      onlineEvents: [],
      status: 'unsupported-zip',
      targetCity: '',
      zipCode: searchedZipCode,
    }
  }

  const searchResult = getStagedResourceSearch({
    events: [...cityEvents, ...onlineEvents],
    includeFallbackSections: false,
    includeTrustedOrganizations: true,
    originLocation: activeLocation.source === 'current-location'
      ? activeLocation
      : null,
    parks: getParksNearZip(searchedZipCode),
    priorities: resourcePriorities,
    zipCode: searchedZipCode,
  })
  const inPersonResources = searchResult.resources.filter(
    (resource) => !isOnlineEvent(resource),
  )
  const onlineResources = searchResult.resources.filter((resource) =>
    isOnlineEvent(resource),
  )

  return {
    events: inPersonResources,
    hasExactMatches: searchResult.counts.exact > 0 || searchResult.counts.sameCity > 0,
    onlineEvents: onlineResources,
    status: searchResult.resources.length > 0 ? 'mapped-city' : 'supported-empty',
    targetCity,
    zipCode: searchedZipCode,
  }
}

const goalCategoryRank = {
  'Preventive Screening': 1,
  'Chronic Condition Management': 2,
  'Physical Activity': 3,
  Nutrition: 4,
  'Mental Well-Being': 5,
  Sleep: 6,
  'Smoking/Vaping': 7,
  Alcohol: 8,
  'Family History': 9,
  'Learning/Education': 10,
}

const defaultGoalCandidates = [
  {
    category: 'Physical Activity',
    label: 'Walk for 20-30 minutes today.',
    reason: 'Regular movement is a practical daily step that supports many prevention goals.',
    score: 45,
    source: 'fallback',
  },
  {
    category: 'Nutrition',
    label: 'Add one serving of vegetables to dinner.',
    reason: 'Small nutrition choices can support long-term heart, diabetes, and cancer-prevention habits.',
    score: 44,
    source: 'fallback',
  },
  {
    category: 'Family History',
    label: 'Review your family history for any updates.',
    reason: 'Keeping your Family Health Tree current helps personalize your educational insights.',
    score: 38,
    source: 'fallback',
  },
  {
    category: 'Mental Well-Being',
    label: 'Practice 10 minutes of stress reduction today.',
    reason: 'A short reset can support emotional well-being and make daily prevention habits easier to sustain.',
    score: 36,
    source: 'fallback',
  },
]

function getStableGoalSeed(value) {
  const text = JSON.stringify(value || '')

  return Array.from(text).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) % 1000003,
    0,
  )
}

function rotateGoals(goals, seed = 0) {
  if (goals.length <= 1) {
    return goals
  }

  const offset = seed % goals.length

  return [...goals.slice(offset), ...goals.slice(0, offset)]
}

function getGoalSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function hasProfileValue(value, matches) {
  const normalizedValue = normalizeGoalText(value)

  return matches.some((match) => normalizedValue.includes(normalizeGoalText(match)))
}

function createGoalCandidate({ category, label, reason, score = 0, source = 'profile' }) {
  return {
    category,
    id: `daily-${getGoalSlug(label)}`,
    label,
    reason,
    score,
    source,
  }
}

function addGoalCandidate(candidates, candidate) {
  if (!candidate?.label || !candidate?.category) {
    return
  }

  candidates.push(createGoalCandidate(candidate))
}

function hasKnownFamilyCondition(member) {
  return (member?.illnesses || []).some(
    (illness) => illness && illness !== unknownConditionLabel,
  )
}

function hasMissingFamilyDiagnosisAges(familyMembers = []) {
  return familyMembers.some(
    (member) =>
      hasKnownFamilyCondition(member) &&
      !String(member.diagnosisAge || '').trim(),
  )
}

function getRecentCompletedGoalIds(goalCompletionHistory = {}, dayLimit = 5) {
  if (!isPlainObject(goalCompletionHistory)) {
    return new Set()
  }

  return new Set(
    Object.entries(goalCompletionHistory)
      .filter(([dateKey]) => isLocalDateKey(dateKey))
      .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
      .slice(0, dayLimit)
      .flatMap(([, goalIds]) => (Array.isArray(goalIds) ? goalIds : [])),
  )
}

function getGoalPriorityText(priority) {
  return normalizeGoalText(
    [
      priority?.id,
      priority?.healthArea,
      priority?.label,
      priority?.title,
      priority?.detail,
      priority?.summary,
    ].join(' '),
  )
}

function addHeartGoalCandidates(candidates, reasonBase, score) {
  addGoalCandidate(candidates, {
    category: 'Physical Activity',
    label: 'Walk for 20-30 minutes today.',
    reason: `${reasonBase} A moderate walk is a practical way to support heart health today.`,
    score: score + 8,
  })
  addGoalCandidate(candidates, {
    category: 'Preventive Screening',
    label: 'Learn your blood pressure or cholesterol numbers.',
    reason: `${reasonBase} Knowing these numbers can make routine prevention conversations more useful.`,
    score: score + 10,
  })
  addGoalCandidate(candidates, {
    category: 'Nutrition',
    label: 'Choose one lower-sodium meal today.',
    reason: `${reasonBase} Lower-sodium choices can support blood pressure awareness.`,
    score: score + 6,
  })
}

function addCancerGoalCandidates(
  candidates,
  reasonBase,
  score,
  cancerType = '',
  familyMembers = [],
) {
  const screeningLabel = cancerType.includes('breast')
    ? 'Read about breast cancer screening recommendations.'
    : cancerType.includes('colon') || cancerType.includes('colorectal')
      ? 'Read about colon cancer screening recommendations.'
      : 'Read about recommended cancer screening questions.'

  addGoalCandidate(candidates, {
    category: 'Preventive Screening',
    label: screeningLabel,
    reason: `${reasonBase} Screening education can help you prepare better questions for routine care.`,
    score: score + 10,
  })
  addGoalCandidate(candidates, {
    category: 'Physical Activity',
    label: 'Walk for 20-30 minutes today.',
    reason: `${reasonBase} Regular movement is one daily habit connected with long-term prevention.`,
    score: score + 5,
  })
  if (hasMissingFamilyDiagnosisAges(familyMembers)) {
    addGoalCandidate(candidates, {
      category: 'Family History',
      label: diagnosisAgeGoalLabel,
      reason: `${reasonBase} Diagnosis ages are helpful when available, but unknown details can be marked Unknown.`,
      score: score + 6,
    })
  }
}

function addDiabetesGoalCandidates(candidates, reasonBase, score) {
  addGoalCandidate(candidates, {
    category: 'Nutrition',
    label: 'Replace one sugary drink with water today.',
    reason: `${reasonBase} This is a small, concrete nutrition step that supports diabetes prevention.`,
    score: score + 10,
  })
  addGoalCandidate(candidates, {
    category: 'Physical Activity',
    label: 'Take a 20-minute walk after a meal.',
    reason: `${reasonBase} Light movement after meals can support everyday metabolic health habits.`,
    score: score + 7,
  })
  addGoalCandidate(candidates, {
    category: 'Learning/Education',
    label: 'Read one diabetes-prevention nutrition tip.',
    reason: `${reasonBase} Focused learning can help you choose realistic food changes.`,
    score: score + 4,
  })
}

function addMentalWellbeingGoalCandidates(candidates, reasonBase, score) {
  addGoalCandidate(candidates, {
    category: 'Mental Well-Being',
    label: 'Practice 10 minutes of stress reduction today.',
    reason: `${reasonBase} A brief reset is a realistic way to support emotional well-being today.`,
    score: score + 10,
  })
  addGoalCandidate(candidates, {
    category: 'Sleep',
    label: 'Set a consistent bedtime for tonight.',
    reason: `${reasonBase} Consistent sleep routines can support emotional wellness and daily energy.`,
    score: score + 7,
  })
  addGoalCandidate(candidates, {
    category: 'Physical Activity',
    label: 'Take a short walk for a mental reset.',
    reason: `${reasonBase} Gentle movement can support mood and stress management.`,
    score: score + 4,
  })
}

function addRespiratoryGoalCandidates(candidates, reasonBase, score) {
  addGoalCandidate(candidates, {
    category: 'Chronic Condition Management',
    label: "Check today's air quality before outdoor exercise.",
    reason: `${reasonBase} Air-quality awareness can help you choose a comfortable activity setting.`,
    score: score + 9,
  })
  addGoalCandidate(candidates, {
    category: 'Smoking/Vaping',
    label: 'Avoid smoke or vape exposure today.',
    reason: `${reasonBase} Limiting smoke exposure supports respiratory wellness.`,
    score: score + 8,
  })
  addGoalCandidate(candidates, {
    category: 'Learning/Education',
    label: 'Read one respiratory-health prevention tip.',
    reason: `${reasonBase} A focused resource can help you connect symptoms, triggers, and prevention habits.`,
    score: score + 4,
  })
}

function addInsightGoalCandidates(
  candidates,
  insight,
  profile,
  insightIndex,
  familyMembers = [],
) {
  const priorityText = getGoalPriorityText(insight)
  const label = insight?.healthArea || insight?.title || insight?.label || 'your profile'
  const reasonBase = `Selected because ${label.toLowerCase()} is one of the strongest themes in your profile.`
  const score = 100 - insightIndex * 8

  if (
    priorityText.includes('cardio') ||
    priorityText.includes('heart') ||
    priorityText.includes('blood pressure') ||
    priorityText.includes('cholesterol') ||
    priorityText.includes('stroke')
  ) {
    addHeartGoalCandidates(candidates, reasonBase, score)
  }

  if (
    priorityText.includes('breast') ||
    priorityText.includes('colon') ||
    priorityText.includes('colorectal') ||
    priorityText.includes('cancer')
  ) {
    addCancerGoalCandidates(candidates, reasonBase, score, priorityText, familyMembers)
  }

  if (priorityText.includes('diabetes') || priorityText.includes('blood sugar')) {
    addDiabetesGoalCandidates(candidates, reasonBase, score)
  }

  if (
    priorityText.includes('mental') ||
    priorityText.includes('stress') ||
    priorityText.includes('emotional')
  ) {
    addMentalWellbeingGoalCandidates(candidates, reasonBase, score)
  }

  if (
    priorityText.includes('respiratory') ||
    priorityText.includes('lung') ||
    priorityText.includes('breathing') ||
    priorityText.includes('asthma')
  ) {
    addRespiratoryGoalCandidates(candidates, reasonBase, score)
  }

  if (hasProfileValue(profile?.exercise, ['none', 'rarely', '0', '1-2'])) {
    addGoalCandidate(candidates, {
      category: 'Physical Activity',
      label: 'Walk for 10-15 minutes today.',
      reason: 'Selected because your activity response suggests a small, realistic movement goal may be useful.',
      score: score + 3,
    })
  }
}

function addPriorityGoalCandidates(candidates, priority, profile, priorityIndex) {
  const priorityText = getGoalPriorityText(priority)
  const detail = priority?.detail
    ? priority.detail.replace(/[.!?]+$/g, '').toLowerCase()
    : `${priority?.title || priority?.label || 'this profile area'} is part of your prevention plan`
  const reasonBase = `Selected because ${detail}.`
  const score = 82 - priorityIndex * 6

  if (priorityText.includes('movement') || priorityText.includes('exercise')) {
    addGoalCandidate(candidates, {
      category: 'Physical Activity',
      label: hasProfileValue(profile?.exercise, ['none', 'rarely', '0'])
        ? 'Walk for 10-15 minutes today.'
        : 'Walk for 20-30 minutes today.',
      reason: `${reasonBase} A specific walking target turns that priority into an action for today.`,
      score: score + 7,
    })
  }

  if (
    priorityText.includes('nutrition') ||
    priorityText.includes('diet') ||
    priorityText.includes('fruit') ||
    priorityText.includes('vegetable') ||
    priorityText.includes('sugary')
  ) {
    addGoalCandidate(candidates, {
      category: 'Nutrition',
      label: hasProfileValue(profile?.sugaryDrinks, ['daily', 'often', 'regular'])
        ? 'Replace one sugary drink with water today.'
        : 'Add one serving of vegetables to dinner.',
      reason: `${reasonBase} This keeps the nutrition step specific and achievable today.`,
      score: score + 7,
    })
  }

  if (priorityText.includes('screening') || priorityText.includes('checkup')) {
    addGoalCandidate(candidates, {
      category: 'Preventive Screening',
      label: 'Write down one screening question for your next routine visit.',
      reason: `${reasonBase} Preparing one question can make preventive-care conversations easier.`,
      score: score + 8,
    })
  }

  if (priorityText.includes('sleep')) {
    addGoalCandidate(candidates, {
      category: 'Sleep',
      label: 'Set a consistent bedtime for tonight.',
      reason: `${reasonBase} A predictable bedtime is a concrete sleep habit to practice today.`,
      score: score + 8,
    })
  }

  if (priorityText.includes('stress') || priorityText.includes('mental')) {
    addGoalCandidate(candidates, {
      category: 'Mental Well-Being',
      label: 'Practice 10 minutes of stress reduction today.',
      reason: `${reasonBase} A short practice can support emotional well-being without adding a big task.`,
      score: score + 8,
    })
  }

  if (priorityText.includes('tobacco') || priorityText.includes('smoking') || priorityText.includes('vaping')) {
    addGoalCandidate(candidates, {
      category: 'Smoking/Vaping',
      label: 'Look up one quit-support resource today.',
      reason: `${reasonBase} Finding support is a practical first step that does not require changing everything at once.`,
      score: score + 8,
    })
  }
}

function addLifestyleGoalCandidates(candidates, profile = {}) {
  if (hasProfileValue(profile.exercise, ['none', 'rarely', '0'])) {
    addGoalCandidate(candidates, {
      category: 'Physical Activity',
      label: 'Walk for 10-15 minutes today.',
      reason: 'Selected because your activity response suggests starting with a short, realistic movement goal.',
      score: 78,
    })
  } else if (hasProfileValue(profile.exercise, ['1-2', '1 to 2'])) {
    addGoalCandidate(candidates, {
      category: 'Physical Activity',
      label: 'Walk for 20-30 minutes today.',
      reason: 'Selected to help build consistency from your current weekly activity routine.',
      score: 70,
    })
  }

  if (hasProfileValue(profile.fruitVegIntake, ['0', '1', 'low', 'few']) || hasProfileValue(profile.dietQuality, ['poor', 'fair'])) {
    addGoalCandidate(candidates, {
      category: 'Nutrition',
      label: 'Add one serving of vegetables to dinner.',
      reason: 'Selected because your nutrition response leaves room for one small produce-focused step today.',
      score: 76,
    })
  }

  if (hasProfileValue(profile.smokingStatus, ['current', 'yes', 'smoke', 'vape'])) {
    addGoalCandidate(candidates, {
      category: 'Smoking/Vaping',
      label: 'Look up one quit-support resource today.',
      reason: 'Selected because your profile includes current smoking or vaping.',
      score: 80,
    })
  }

  if (hasProfileValue(profile.alcoholUse, ['daily', 'often', '4', '5', 'heavy'])) {
    addGoalCandidate(candidates, {
      category: 'Alcohol',
      label: 'Choose an alcohol-free day today.',
      reason: 'Selected because your alcohol response makes a clear, one-day reduction goal relevant.',
      score: 74,
    })
  }

  if (hasProfileValue(profile.sleep, ['poor', 'less', '<', 'short', 'inconsistent'])) {
    addGoalCandidate(candidates, {
      category: 'Sleep',
      label: 'Set a consistent bedtime for tonight.',
      reason: 'Selected because your sleep response suggests a simple routine goal may be helpful.',
      score: 72,
    })
  }

  if (hasProfileValue(profile.stressLevel, ['high', 'often', 'frequent'])) {
    addGoalCandidate(candidates, {
      category: 'Mental Well-Being',
      label: 'Practice 10 minutes of stress reduction today.',
      reason: 'Selected because your stress response makes a short reset a relevant goal for today.',
      score: 75,
    })
  }
}

function selectUniqueDailyGoals(candidates, seed, recentGoalIds) {
  const uniqueCandidates = []
  const seenLabels = new Set()

  rotateGoals(candidates, seed).forEach((candidate) => {
    const labelSlug = getGoalSlug(candidate.label)

    if (seenLabels.has(labelSlug)) {
      return
    }

    seenLabels.add(labelSlug)
    uniqueCandidates.push(candidate)
  })

  const rankedCandidates = uniqueCandidates.sort((first, second) => {
    const firstRecent = recentGoalIds.has(first.id) ? 1 : 0
    const secondRecent = recentGoalIds.has(second.id) ? 1 : 0

    if (firstRecent !== secondRecent) return firstRecent - secondRecent
    if (second.score !== first.score) return second.score - first.score

    return (
      (goalCategoryRank[first.category] || 99) -
      (goalCategoryRank[second.category] || 99)
    )
  })
  const selectedGoals = []
  const usedCategories = new Set()

  rankedCandidates.forEach((candidate) => {
    if (selectedGoals.length >= 4 || usedCategories.has(candidate.category)) {
      return
    }

    selectedGoals.push(candidate)
    usedCategories.add(candidate.category)
  })

  return selectedGoals.slice(0, 4)
}

function buildCoachGoals({
  familyMembers = [],
  preventionInsights = [],
  preventionPlan = {},
  profile = {},
  goalCompletionHistory = {},
}) {
  const seed = getStableGoalSeed({
    date: getLocalDateKey(),
    insightIds: preventionInsights.map((insight) => insight.id || insight.healthArea),
    priorities: preventionPlan.topPriorities?.map((priority) => priority.id) || [],
    lifestyle: {
      alcoholUse: profile.alcoholUse,
      dietQuality: profile.dietQuality,
      exercise: profile.exercise,
      fruitVegIntake: profile.fruitVegIntake,
      sleep: profile.sleep,
      smokingStatus: profile.smokingStatus,
      stressLevel: profile.stressLevel,
      sugaryDrinks: profile.sugaryDrinks,
    },
  })

  const candidates = []

  preventionInsights
    .slice(0, 4)
    .forEach((insight, insightIndex) =>
      addInsightGoalCandidates(candidates, insight, profile, insightIndex, familyMembers),
    )

  preventionPlan.topPriorities?.forEach((priority, priorityIndex) =>
    addPriorityGoalCandidates(candidates, priority, profile, priorityIndex),
  )

  addLifestyleGoalCandidates(candidates, profile)

  defaultGoalCandidates.forEach((candidate, fallbackIndex) =>
    addGoalCandidate(candidates, {
      ...candidate,
      score: candidate.score - fallbackIndex,
    }),
  )

  const recentGoalIds = getRecentCompletedGoalIds(goalCompletionHistory)

  return selectUniqueDailyGoals(candidates, seed, recentGoalIds).map((goal) => ({
    category: goal.category,
    id: goal.id,
    label: goal.label,
    reason: goal.reason,
  }))
}

function getInitialsFromName(value) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function getTreeInitials(member) {
  if (member.isSelf) {
    return 'Y'
  }

  return getRelativeAvatarLabel(member)
}

function ConditionButton({
  conditionName,
  onOpenConditionDetails,
  className = 'illness-pill',
}) {
  const displayName = getDisplayConditionName(conditionName)

  return (
    <button
      className={`condition-button ${className}`}
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpenConditionDetails(conditionName)
      }}
    >
      {displayName}
    </button>
  )
}

function ConditionTag({ conditionName, className = 'illness-pill' }) {
  return (
    <span className={`condition-tag ${className}`}>
      {getDisplayConditionName(conditionName)}
    </span>
  )
}

function ClickableConditionTag({
  conditionName,
  onOpenConditionDetails,
  className = 'illness-pill',
}) {
  if (!onOpenConditionDetails) {
    return <ConditionTag className={className} conditionName={conditionName} />
  }

  return (
    <ConditionButton
      className={className}
      conditionName={conditionName}
      onOpenConditionDetails={onOpenConditionDetails}
    />
  )
}

function QuestionCard({
  children,
  required = false,
  title,
}) {
  return (
    <section className="question-card">
      <div className="question-card-heading">
        <h2>
          {title}
          {required ? <span aria-label="required"> *</span> : null}
        </h2>
      </div>
      {children}
    </section>
  )
}

function ChoiceButtons({ label, name, onChange, options, value }) {
  return (
    <fieldset className="choice-fieldset">
      <legend>{label}</legend>
      <div className="choice-button-group">
        {options.map((option) => (
          <button
            className={value === option ? 'choice-button selected' : 'choice-button'}
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </fieldset>
  )
}

function ProgressBar({ label = 'Progress', value }) {
  return (
    <div className="progress-bar" aria-label={label}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

function ConditionDetailList({ items, title }) {
  return (
    <section className="condition-detail-section">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

function ConditionDetailsModal({ conditionName, details, onClose }) {
  const displayName = getDisplayConditionName(details?.name || conditionName)

  return (
    <div className="condition-modal-backdrop" onClick={onClose}>
      <section
        className="condition-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="condition-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="condition-modal-header">
          <div>
            <p className="eyebrow">Learn more</p>
            <h2 id="condition-details-title">{displayName}</h2>
          </div>
          <button
            className="remove-button"
            type="button"
            onClick={onClose}
            aria-label="Close condition details"
          >
            &times;
          </button>
        </div>

        <p className="condition-modal-disclaimer">
          This is educational information to support your prevention planning.
          A healthcare professional can help with personal medical questions.
        </p>

        {details ? (
          <>
            <section className="condition-overview">
              <h3>What it is</h3>
              <p>{details.overview}</p>
            </section>

            {details.publicDataContext ? (
              <section className="condition-overview public-data-context">
                <h3>Public data context</h3>
                <p>{details.publicDataContext.inheritanceSummary}</p>
                <p>{details.publicDataContext.likelihoodGuidance}</p>
              </section>
            ) : null}

            <div className="condition-detail-grid">
              <ConditionDetailList
                title="What people may notice"
                items={details.symptoms}
              />
              <ConditionDetailList
                title="Helpful context"
                items={details.riskFactors}
              />
              <ConditionDetailList
                title="Supportive steps"
                items={details.preventionTips}
              />

              <section className="condition-detail-section">
                <h3>Screening conversations</h3>
                <p>{details.screening}</p>
              </section>
            </div>

            <section className="condition-resources">
              <h3>Trusted resources</h3>
              <ul className="condition-resource-list">
                {details.resources.map((resource) => (
                  <li key={resource.url}>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      {resource.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <div className="condition-unavailable">
            <strong>
              Educational information for this topic is not available yet.
            </strong>
          </div>
        )}
      </section>
    </div>
  )
}

function IllnessPicker({
  disabled = false,
  hasUnlistedCondition = false,
  inputId,
  inputValue,
  noListedConditions = false,
  onInputChange,
  onInputClear,
  onAddIllness,
  onOpenConditionDetails,
  onRemoveIllness,
  onToggleNoListedConditions,
  onToggleUnlistedCondition,
  selectedIllnesses,
}) {
  const [selectedSuggestion, setSelectedSuggestion] = useState('')
  const [highlightedIllnessKey, setHighlightedIllnessKey] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const normalizedInput = normalizeIllness(inputValue)
  const selectedIllnessKeys = selectedIllnesses.map(getIllnessKey)
  const seenMatchingIllnessKeys = new Set()
  const matchingSuggestionGroups = illnessCategories
    .map((category) => {
      const categoryMatches =
        normalizedInput !== '' &&
        normalizeIllness(category.name).includes(normalizedInput)
      const matchingIllnesses = category.illnesses.filter((illness) => {
        const illnessKey = getIllnessKey(illness)
        const illnessMatches = normalizeIllness(illness).includes(normalizedInput)

        const isMatch = (
          !selectedIllnessKeys.includes(illnessKey) &&
          normalizedInput !== '' &&
          (categoryMatches || illnessMatches)
        )

        if (!isMatch || seenMatchingIllnessKeys.has(illnessKey)) {
          return false
        }

        seenMatchingIllnessKeys.add(illnessKey)
        return true
      })

      return {
        ...category,
        illnesses: matchingIllnesses,
      }
    })
    .filter((category) => category.illnesses.length > 0)
  const flatSuggestions = matchingSuggestionGroups.flatMap(
    (category) => category.illnesses,
  )
  const selectedSuggestionKey = getIllnessKey(selectedSuggestion)
  const canAddSelectedSuggestion =
    !disabled &&
    selectedSuggestionKey !== '' &&
    getIllnessKey(inputValue) === selectedSuggestionKey &&
    !selectedIllnessKeys.includes(selectedSuggestionKey) &&
    Boolean(getDatabaseIllness(selectedSuggestion))
  const showSuggestions = !disabled && matchingSuggestionGroups.length > 0

  function addIllness(illness) {
    const databaseIllness = getDatabaseIllness(illness)
    const illnessKey = getIllnessKey(databaseIllness)

    if (!databaseIllness || selectedIllnessKeys.includes(illnessKey)) {
      return
    }

    onAddIllness(databaseIllness)
    setSelectedSuggestion('')
    setHighlightedIllnessKey('')
    setValidationMessage('')
    onInputClear()
  }

  function selectSuggestion(illness) {
    setSelectedSuggestion(illness)
    setHighlightedIllnessKey(getIllnessKey(illness))
    setValidationMessage('')
    onInputChange(illness)
  }

  function addSelectedSuggestion() {
    if (canAddSelectedSuggestion) {
      addIllness(selectedSuggestion)
      return
    }

    if (inputValue.trim()) {
      setValidationMessage('Choose one of the suggested conditions to add it.')
    }
  }

  function handleInputChange(value) {
    setSelectedSuggestion('')
    setHighlightedIllnessKey('')
    setValidationMessage('')
    onInputChange(value)
  }

  function moveHighlight(direction) {
    if (flatSuggestions.length === 0) {
      return
    }

    const currentIndex = flatSuggestions.findIndex(
      (illness) => getIllnessKey(illness) === highlightedIllnessKey,
    )
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + flatSuggestions.length) %
          flatSuggestions.length

    setHighlightedIllnessKey(getIllnessKey(flatSuggestions[nextIndex]))
  }

  function handleIllnessKeyDown(event) {
    if (disabled) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveHighlight(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveHighlight(-1)
      return
    }

    if (event.key === 'Escape') {
      setHighlightedIllnessKey('')
      setSelectedSuggestion('')
      setValidationMessage('')
      onInputClear()
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      const highlightedIllness = flatSuggestions.find(
        (illness) => getIllnessKey(illness) === highlightedIllnessKey,
      )

      if (highlightedIllness) {
        addIllness(highlightedIllness)
        return
      }

      if (inputValue.trim()) {
        setValidationMessage('Choose one of the suggested conditions to add it.')
      }
    }
  }

  return (
    <>
      <div className="autocomplete">
        <label className="field-group" htmlFor={inputId}>
          <span className="visually-hidden">Search health condition</span>
          <input
            id={inputId}
            className="autocomplete-input"
            aria-autocomplete="list"
            aria-controls={`${inputId}-suggestions`}
            aria-activedescendant={
              highlightedIllnessKey
                ? `${inputId}-${highlightedIllnessKey}`
                : undefined
            }
            aria-expanded={showSuggestions}
            disabled={disabled}
            role="combobox"
            type="text"
            value={inputValue}
            onBlur={() => {
              if (inputValue.trim() && !canAddSelectedSuggestion) {
                setValidationMessage('Choose one of the suggested conditions to add it.')
              }
            }}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleIllnessKeyDown}
            placeholder="Search for a health condition"
            autoComplete="off"
          />
        </label>
        <button
          className="add-illness-button"
          type="button"
          disabled={!canAddSelectedSuggestion}
          onClick={addSelectedSuggestion}
        >
          Add
        </button>

        {showSuggestions ? (
          <ul
            className="suggestion-list"
            id={`${inputId}-suggestions`}
            role="listbox"
          >
            {matchingSuggestionGroups.map((category) => (
              <li className="suggestion-category" key={category.name}>
                <span className="suggestion-category-label">{category.name}</span>
                <ul>
                  {category.illnesses.map((illness) => (
                    <li
                      id={`${inputId}-${getIllnessKey(illness)}`}
                      key={illness}
                      role="option"
                      aria-selected={
                        highlightedIllnessKey === getIllnessKey(illness)
                      }
                    >
                      <button
                        className={`suggestion-button${
                          highlightedIllnessKey === getIllnessKey(illness)
                            ? ' highlighted'
                            : ''
                        }`}
                        type="button"
                        onMouseEnter={() =>
                          setHighlightedIllnessKey(getIllnessKey(illness))
                        }
                        onClick={() => selectSuggestion(illness)}
                      >
                        {getDisplayConditionName(illness)}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {validationMessage ? (
        <p className="form-error condition-picker-error" role="alert">
          {validationMessage}
        </p>
      ) : null}

      <details className="inherited-conditions-disclosure current-health-inherited-conditions">
        <summary>
          <span>{moreInheritedConditionGroup.label}</span>
          <small>{moreInheritedConditionGroup.description}</small>
        </summary>
        <div className="condition-row-list">
          {moreInheritedConditionGroup.conditions.map((condition) => {
            const isAlreadyAdded = selectedIllnessKeys.includes(
              getIllnessKey(condition),
            )

            return (
              <button
                className="condition-row-option"
                disabled={disabled || isAlreadyAdded}
                key={condition}
                type="button"
                onClick={() => addIllness(condition)}
              >
                <span>{getDisplayConditionName(condition)}</span>
                {isAlreadyAdded ? <small>✓ Already added</small> : null}
              </button>
            )
          })}
        </div>
      </details>

      <div className="condition-option-list">
        <button
          className="none-illness-button current-health-state-option"
          type="button"
          aria-pressed={noListedConditions}
          onClick={() => {
            const nextValue = !noListedConditions

            onToggleNoListedConditions(nextValue)
            setSelectedSuggestion('')
            setHighlightedIllnessKey('')
            setValidationMessage('')
            onInputClear()
          }}
        >
          <span>{noListedConditions ? '✓ ' : ''}No known conditions</span>
          <small>Clear other selections from your current health.</small>
        </button>

        <button
          className="none-illness-button"
          type="button"
          aria-pressed={hasUnlistedCondition}
          onClick={() => {
            onToggleUnlistedCondition(!hasUnlistedCondition)
            setSelectedSuggestion('')
            setHighlightedIllnessKey('')
            setValidationMessage('')
            onInputClear()
          }}
        >
          {hasUnlistedCondition ? '✓ ' : ''}
          My condition is not listed
        </button>
      </div>

      {hasUnlistedCondition ? (
        <p className="condition-note">
          You can keep going. Some insights may be more general when a condition
          is not in the list yet.
        </p>
      ) : null}

      <div className="illness-picker-section">
        <p className="picker-label">Added:</p>
        {selectedIllnesses.length > 0 ? (
          <ul className="selected-illness-list">
            {selectedIllnesses.map((illness) => (
              <li key={illness}>
                <div className="selected-illness-pill">
                  <ClickableConditionTag
                    className="selected-illness-name"
                    conditionName={illness}
                    onOpenConditionDetails={onOpenConditionDetails}
                  />
                  <button
                    className="selected-illness-remove"
                    type="button"
                    onClick={() => onRemoveIllness(illness)}
                    aria-label={`Remove ${getDisplayConditionName(illness)}`}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="helper-text">No illnesses selected.</p>
        )}
      </div>
    </>
  )
}

function EducationalSource({ sourceName, sourceUrl }) {
  return (
    <section className="insight-detail-block">
      <h4>Educational Source</h4>
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
        {sourceName}
      </a>
    </section>
  )
}

function getInsightIcon(healthArea) {
  const normalizedHealthArea = normalizeGoalText(healthArea)

  if (normalizedHealthArea.includes('breast')) return '♡'
  if (normalizedHealthArea.includes('respiratory')) return '◌'
  if (normalizedHealthArea.includes('mental')) return '◐'
  if (normalizedHealthArea.includes('heart') || normalizedHealthArea.includes('cardio')) return '♥'
  if (normalizedHealthArea.includes('colon') || normalizedHealthArea.includes('cancer')) return '◇'
  if (normalizedHealthArea.includes('diabetes') || normalizedHealthArea.includes('metabolic')) return '◆'
  if (normalizedHealthArea.includes('kidney')) return '◧'
  if (normalizedHealthArea.includes('brain') || normalizedHealthArea.includes('stroke')) return '◉'

  return '◇'
}

function PreventionInsightCard({ insight }) {
  const personalizedFactors = insight.personalizedFactors || []
  const positiveFactors = insight.positiveFactors || []
  const insightSummary = insight.profileSuggestion || insight.preventionInsight

  return (
    <article className="prevention-insight-card health-profile-report-card">
      <header className="health-profile-theme-header">
        <span className="health-profile-theme-icon" aria-hidden="true">
          {getInsightIcon(insight.healthArea)}
        </span>
        <h2>{insight.healthArea}</h2>
      </header>

      {insightSummary ? (
        <section className="insight-detail-block profile-suggestion-block">
          <h3>What your profile suggests</h3>
          <p className="health-profile-theme-summary">{insightSummary}</p>
        </section>
      ) : null}

      {positiveFactors.length > 0 ? (
        <section className="insight-detail-block">
          <h3>✓ What's already working well</h3>
          <ul className="positive-factor-list">
            {positiveFactors.map((factor) => (
              <li key={factor}>
                {factor}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="insight-detail-block">
        <h3>Personalized focus</h3>
        <ul className="personal-factor-list">
          {personalizedFactors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>
      </section>

      <EducationalSource
        sourceName={insight.sourceName}
        sourceUrl={insight.sourceUrl}
      />
    </article>
  )
}

function AssessmentLoadingScreen() {
  return (
    <main className="assessment-loading-screen" aria-live="polite">
      <section className="assessment-loading-content">
        <div className="assessment-loading-copy">
          <p className="eyebrow">Family health</p>
          <h1>
            <span>Understand your story.</span>
            <span>Take small preventive steps.</span>
          </h1>
          <p>
            Build your family health profile to learn about meaningful patterns
            and receive educational insights personalized for you.
          </p>
        </div>

        <div className="assessment-loading-highlights">
          <article>
            <span aria-hidden="true">◇</span>
            <strong>Family Health Tree</strong>
            <p>
              Notice family patterns you may want to keep in mind.
            </p>
          </article>
          <article>
            <span aria-hidden="true">↗</span>
            <strong>Practical</strong>
            <p>Small, practical prevention steps you can start today.</p>
          </article>
          <article>
            <span aria-hidden="true">◎</span>
            <strong>Personalized</strong>
            <p>Guidance tailored to your family history and lifestyle.</p>
          </article>
        </div>

        <div className="loading-progress-track" aria-hidden="true">
          <span></span>
        </div>
      </section>
    </main>
  )
}

function getGreeting(date = new Date()) {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return 'Good morning!'
  }

  if (hour >= 12 && hour < 17) {
    return 'Good afternoon!'
  }

  return 'Good evening!'
}

function App() {
  const { isAuthLoading, isPasswordRecovery, user } = useAuth()
  const [savedAppState] = useState(defaultSavedState)
  const [deviceSavedAppState] = useState(loadSavedAppState)
  const lastSavedProfileStateRef = useRef('')
  const latestProfileStateRef = useRef('')
  const saveDebounceRef = useRef(null)
  const profileSaveCoordinatorRef = useRef(null)
  if (!profileSaveCoordinatorRef.current) {
    profileSaveCoordinatorRef.current = createProfileSaveCoordinator({
      deleteProfile: deleteUserProfile,
      saveProfile: saveUserProfile,
    })
  }
  const [hasLoadedCloudProfile, setHasLoadedCloudProfile] = useState(false)
  const [profileHydrated, setProfileHydrated] = useState(false)
  const [cloudProfileStatus, setCloudProfileStatus] = useState('loading')
  const [cloudProfileError, setCloudProfileError] = useState('')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [showDeviceImportPrompt, setShowDeviceImportPrompt] = useState(false)
  const [activeView, setActiveView] = useState(savedAppState.activeView)
  const [userProfile, setUserProfile] = useState(savedAppState.userProfile)
  const [profileForm, setProfileForm] = useState(savedAppState.profileForm)
  const [profileIllnesses, setProfileIllnesses] = useState(
    savedAppState.profileIllnesses,
  )
  const [profileIllnessInput, setProfileIllnessInput] = useState(
    savedAppState.profileIllnessInput,
  )
  const [profileNoListedConditions, setProfileNoListedConditions] = useState(
    savedAppState.profileNoListedConditions,
  )
  const [profileHasUnlistedCondition, setProfileHasUnlistedCondition] = useState(
    savedAppState.profileHasUnlistedCondition,
  )
  const [familyStructure, setFamilyStructure] = useState(
    savedAppState.familyStructure,
  )
  const [familyStructureDraft, setFamilyStructureDraft] = useState(
    savedAppState.familyStructure,
  )
  const [familyStructureCompleted, setFamilyStructureCompleted] = useState(
    savedAppState.familyStructureCompleted,
  )
  const [familyMembers, setFamilyMembers] = useState(
    savedAppState.familyMembers,
  )
  const [familyMemberName, setFamilyMemberName] = useState(
    savedAppState.familyMemberName,
  )
  const [relationship, setRelationship] = useState(savedAppState.relationship)
  const [familyRelationshipMode, setFamilyRelationshipMode] = useState('')
  const [familyRelationshipType, setFamilyRelationshipType] = useState('')
  const [selectedIllnesses, setSelectedIllnesses] = useState(
    savedAppState.selectedIllnesses,
  )
  const [familyConditionDetails, setFamilyConditionDetails] = useState({})
  const [activeFamilyConditionGroup, setActiveFamilyConditionGroup] = useState('')
  const [pendingFamilyCondition, setPendingFamilyCondition] = useState('')
  const [pendingFamilyDiagnosisAge, setPendingFamilyDiagnosisAge] = useState('')
  const [familyConditionSearchInput, setFamilyConditionSearchInput] = useState('')
  const [familyEarlyDiagnosis, setFamilyEarlyDiagnosis] = useState(
    savedAppState.familyEarlyDiagnosis,
  )
  const [familyDiagnosisAge, setFamilyDiagnosisAge] = useState(
    savedAppState.familyDiagnosisAge,
  )
  const [editingFamilyMemberId, setEditingFamilyMemberId] = useState(
    savedAppState.editingFamilyMemberId,
  )
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [habitProgress, setHabitProgress] = useState(savedAppState.habitProgress)
  const [dailyActions, setDailyActions] = useState(savedAppState.dailyActions)
  const [dailyActionsDate, setDailyActionsDate] = useState(savedAppState.dailyActionsDate)
  const dailyActionsDateRef = useRef(savedAppState.dailyActionsDate)
  const [completedDailyActionIds, setCompletedDailyActionIds] = useState(
    savedAppState.completedDailyActionIds,
  )
  const [dailyGoals, setDailyGoals] = useState(savedAppState.dailyGoals)
  const [dailyGoalsDate, setDailyGoalsDate] = useState(savedAppState.dailyGoalsDate)
  const dailyGoalsDateRef = useRef(savedAppState.dailyGoalsDate)
  const [lastGoalResetDate, setLastGoalResetDate] = useState(
    savedAppState.lastGoalResetDate,
  )
  const lastGoalResetDateRef = useRef(savedAppState.lastGoalResetDate)
  const [goalCompletionHistory, setGoalCompletionHistory] = useState(
    savedAppState.goalCompletionHistory,
  )
  const [weeklyActions, setWeeklyActions] = useState(savedAppState.weeklyActions)
  const [weeklyActionsWeek, setWeeklyActionsWeek] = useState(
    savedAppState.weeklyActionsWeek,
  )
  const weeklyActionsWeekRef = useRef(savedAppState.weeklyActionsWeek)
  const [completedWeeklyActionIds, setCompletedWeeklyActionIds] = useState(
    savedAppState.completedWeeklyActionIds,
  )
  const [monthlyActions, setMonthlyActions] = useState(savedAppState.monthlyActions)
  const [monthlyActionsMonth, setMonthlyActionsMonth] = useState(
    savedAppState.monthlyActionsMonth,
  )
  const monthlyActionsMonthRef = useRef(savedAppState.monthlyActionsMonth)
  const [completedMonthlyActionIds, setCompletedMonthlyActionIds] = useState(
    savedAppState.completedMonthlyActionIds,
  )
  const [preventionActionHistory, setPreventionActionHistory] = useState(
    savedAppState.preventionActionHistory,
  )
  const [activeConditionName, setActiveConditionName] = useState(null)
  const [activeLocation, setActiveLocation] = useState(
    savedAppState.activeLocation,
  )
  const [locationStatus, setLocationStatus] = useState(
    savedAppState.locationStatus,
  )
  const [locationMessage, setLocationMessage] = useState(
    savedAppState.locationMessage,
  )
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isFamilyFormOpen, setIsFamilyFormOpen] = useState(false)
  const [familyEditorInitialSignature, setFamilyEditorInitialSignature] = useState('')
  const [showFamilyEditorDiscardPrompt, setShowFamilyEditorDiscardPrompt] =
    useState(false)
  const [showParentRequirementPrompt, setShowParentRequirementPrompt] = useState(false)
  const [selectedWeeklyEvent, setSelectedWeeklyEvent] = useState(null)
  const [activeGoalResourceFilter, setActiveGoalResourceFilter] = useState(null)
  const [expandedActionEvidence, setExpandedActionEvidence] = useState({})
  const [expandedEventDescriptions, setExpandedEventDescriptions] = useState({})
  const [weeklyEvents, setWeeklyEvents] = useState([])
  const [weeklyEventsError, setWeeklyEventsError] = useState('')
  const [weeklyEventsStatus, setWeeklyEventsStatus] = useState('loading')
  const [isAssessmentLoading, setIsAssessmentLoading] = useState(false)
  const [assessmentLoadingTarget, setAssessmentLoadingTarget] = useState('health')
  const [assessmentGuidance, setAssessmentGuidance] = useState(null)
  const [navigationNotice, setNavigationNotice] = useState(null)
  const [dashboardGreeting, setDashboardGreeting] = useState(getGreeting)
  const [accountProfile, setAccountProfile] = useState(savedAppState.accountProfile)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false)
  const [isPrivacyDataOpen, setIsPrivacyDataOpen] = useState(false)
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false)
  const [accountDisplayNameInput, setAccountDisplayNameInput] = useState(
    savedAppState.accountProfile.displayName,
  )
  const [failedAccountAvatarUrl, setFailedAccountAvatarUrl] = useState('')
  const accountEmail = user?.email || ''
  const accountMetadataDisplayName =
    asString(user?.user_metadata?.full_name) ||
    asString(user?.user_metadata?.name) ||
    asString(user?.user_metadata?.display_name)
  const accountDisplayName =
    accountMetadataDisplayName ||
    accountProfile.displayName ||
    profileForm.name ||
    accountEmail.split('@')[0] ||
    ''
  const accountMetadataAvatarUrl =
    asString(user?.user_metadata?.avatar_url) ||
    asString(user?.user_metadata?.picture)
  const accountAvatarUrl =
    accountMetadataAvatarUrl || accountProfile.avatarUrl
  const shouldShowAccountAvatarImage =
    Boolean(accountAvatarUrl) && failedAccountAvatarUrl !== accountAvatarUrl
  const accountInitials = getInitialsFromName(
    accountDisplayName || accountEmail.split('@')[0] || 'Account',
  )

  const storedSelfMember = familyMembers.find(
    (member) => member.relationshipType === 'self',
  )
  const currentHealthSelfConditions = sanitizeFamilyConditions(profileIllnesses)
  const syncedSelfConditions = mergeSelfConditionsFromCurrentHealth({
    currentHealthConditions: currentHealthSelfConditions,
    storedSelfConditions: storedSelfMember?.conditions || [],
  })
  const syncedSelfIllnesses = getIllnessesFromConditions(syncedSelfConditions)
  const selfTreeNode = {
    ...(storedSelfMember || {}),
    ...(userProfile || {}),
    id: storedSelfMember?.id || 'self',
    relationship: 'Self',
    relationshipType: 'self',
    name:
      profileForm.name.trim() ||
      userProfile?.name ||
      storedSelfMember?.name ||
      'You',
    illnesses: syncedSelfIllnesses,
    conditions: syncedSelfConditions,
    isPlaceholder: syncedSelfConditions.length === 0 && !storedSelfMember,
    isSelf: true,
  }
  const getMembersByRelationshipType = useCallback(
    (relationshipType) =>
      familyMembers
        .filter((member) => member.relationshipType === relationshipType)
        .sort((firstMember, secondMember) =>
          (firstMember.slotIndex || 0) - (secondMember.slotIndex || 0),
        ),
    [familyMembers],
  )
  const createRelativePlaceholder = useCallback(
    (relationshipType, slotIndex = null) => ({
      id:
        slotIndex === null
          ? `${relationshipType}-placeholder`
          : `${relationshipType}-${slotIndex}`,
      name: '',
      relationship: getRelationshipForType(relationshipType),
      relationshipType,
      slotIndex,
      illnesses: [],
      conditions: [],
      isPlaceholder: true,
    }),
    [],
  )
  const getCoreRelative = useCallback(
    (relationshipType) =>
      getMembersByRelationshipType(relationshipType)[0] ||
      createRelativePlaceholder(relationshipType),
    [createRelativePlaceholder, getMembersByRelationshipType],
  )
  const getCountedRelatives = useCallback(
    (relationshipType, countValue) => {
      const count = Number(countValue)

      if (!Number.isInteger(count) || count <= 0) {
        return []
      }

      const existingMembers = getMembersByRelationshipType(relationshipType)

      return Array.from({ length: count }, (_, index) => {
        const slotIndex = index + 1

        return (
          existingMembers.find((member) => member.slotIndex === slotIndex) ||
          createRelativePlaceholder(relationshipType, slotIndex)
        )
      })
    },
    [createRelativePlaceholder, getMembersByRelationshipType],
  )
  const parentMembers = familyMembers.filter(
    (member) => member.relationship === 'Mother' || member.relationship === 'Father',
  )
  const hasMother = parentMembers.some((member) => member.relationship === 'Mother')
  const hasFather = parentMembers.some((member) => member.relationship === 'Father')
  const hasRequiredParentInformation = hasMother && hasFather
  const brotherMembers = getCountedRelatives('brother', familyStructure.brothers)
  const sisterMembers = getCountedRelatives('sister', familyStructure.sisters)
  const userSiblingBranchMembers = buildVisibleSiblingBranchMembers({
    brotherMembers,
    selfMember: selfTreeNode,
    sisterMembers,
  })
  const childMembers = [
    ...getCountedRelatives('son', familyStructure.sons),
    ...getCountedRelatives('daughter', familyStructure.daughters),
    ...familyMembers.filter(
      (member) =>
        member.relationship === 'Child' &&
        !['son', 'daughter'].includes(member.relationshipType),
    ),
  ]
  const familyHistoryMembers = useMemo(
    () => familyMembers.filter((member) => member.relationshipType !== 'self'),
    [familyMembers],
  )
  const hasAnyFamilyRelativeHealthHistory = familyHistoryMembers.some(
    hasRelativeHealthHistory,
  )
  const familyHealthSummary = useMemo(
    () => buildFamilyHealthSummary({ familyMembers: familyHistoryMembers }),
    [familyHistoryMembers],
  )
  const profileBmi = calculateBmi(profileForm)
  const preventionProfile = useMemo(
    () => ({
      ...userProfile,
      ...profileForm,
      bmi: profileBmi,
      illnesses: profileIllnesses,
    }),
    [profileBmi, profileForm, profileIllnesses, userProfile],
  )
  const hasCurrentHealthSectionData = hasCurrentHealthData({
    profileForm,
    profileHasUnlistedCondition,
    profileIllnesses,
    profileNoListedConditions,
  })
  const hasFamilyStructureSectionData =
    familyStructureCompleted && hasFamilyStructureData(familyStructure)
  const hasFamilyHistoryData = hasRequiredParentInformation
  const hasLifestyleData = hasEverydayHabitsData(profileForm)
  const hasStartedAssessment = hasAnyAssessmentProgress({
    familyMembers: familyHistoryMembers,
    profileForm,
    profileHasUnlistedCondition,
    profileIllnesses,
    profileNoListedConditions,
  })
  const isAssessmentComplete =
    hasCurrentHealthSectionData &&
    hasFamilyStructureSectionData &&
    hasFamilyHistoryData &&
    hasLifestyleData
  const assessmentCompletionPercent = getAssessmentCompletionPercent({
    hasCurrentHealthData: hasCurrentHealthSectionData,
    hasFamilyHistoryData,
    hasFamilyStructureData: hasFamilyStructureSectionData,
    hasLifestyleData,
  })
  const preventionPlan = useMemo(
    () =>
      isAssessmentComplete
        ? buildPreventionPlanSignals({
            familyHealthSummary,
            profile: preventionProfile,
          })
        : {
            topPriorities: [],
          },
    [
      familyHealthSummary,
      isAssessmentComplete,
      preventionProfile,
    ],
  )
  const preventionInsights = useMemo(
    () =>
      isAssessmentComplete
        ? buildPreventionInsights({
            familyMembers: familyHistoryMembers,
            familyHealthSummary,
            profile: preventionProfile,
          })
        : [],
    [
      familyHealthSummary,
      familyHistoryMembers,
      isAssessmentComplete,
      preventionProfile,
    ],
  )
  const displayedHealthProfileInsights = preventionInsights.slice(0, 3)
  const dashboardProfileSummary = useMemo(
    () =>
      buildDashboardProfileSummary({
        profile: preventionProfile,
        topPriorities: preventionPlan.topPriorities,
      }),
    [preventionPlan.topPriorities, preventionProfile],
  )
  const generatedCoachGoals = useMemo(
    () =>
      isAssessmentComplete
        ? buildCoachGoals({
            familyMembers: familyHistoryMembers,
            goalCompletionHistory,
            preventionInsights,
            preventionPlan,
            profile: preventionProfile,
          })
        : [],
    [
      goalCompletionHistory,
      familyHistoryMembers,
      isAssessmentComplete,
      preventionInsights,
      preventionPlan,
      preventionProfile,
    ],
  )
  const generatedPreventionActionPlan = useMemo(
    () =>
      isAssessmentComplete
        ? buildPreventionActionPlan({
            actionHistory: preventionActionHistory,
            familyMembers: familyHistoryMembers,
            preventionInsights,
            profile: preventionProfile,
          })
        : {
            keepTrack: [],
            thisMonth: [],
            today: [],
          },
    [
      familyHistoryMembers,
      isAssessmentComplete,
      preventionInsights,
      preventionActionHistory,
      preventionProfile,
    ],
  )
  const todayActionDate = getLocalDateKey()
  const currentWeekKey = getLocalWeekKey()
  const currentMonthKey = getLocalMonthKey()
  const hasCurrentDailyActions =
    dailyActionsDate === todayActionDate && dailyActions.length > 0
  const hasCurrentWeeklyActions =
    weeklyActionsWeek === currentWeekKey && weeklyActions.length > 0
  const hasCurrentMonthlyActions =
    monthlyActionsMonth === currentMonthKey && monthlyActions.length > 0
  const preventionActionPlan = {
    keepTrack: generatedPreventionActionPlan.keepTrack,
    thisMonth: hasCurrentMonthlyActions
      ? monthlyActions.filter((action) =>
          isPreventionActionApplicable(action, preventionProfile),
        )
      : generatedPreventionActionPlan.thisMonth,
    thisWeek: hasCurrentWeeklyActions
      ? weeklyActions.filter((action) =>
          isPreventionActionApplicable(action, preventionProfile),
        )
      : generatedPreventionActionPlan.thisWeek,
    today: hasCurrentDailyActions
      ? dailyActions.filter((action) =>
          isPreventionActionApplicable(action, preventionProfile),
        )
      : generatedPreventionActionPlan.today,
  }
  const todayPreventionActions = preventionActionPlan.today
  const weekPreventionActions = preventionActionPlan.thisWeek || []
  const monthPreventionActions = preventionActionPlan.thisMonth
  const preventionProgressSummary = buildPreventionProgressSummary(
    preventionActionHistory,
  )
  const trackablePreventionActions = [
    ...todayPreventionActions,
    ...weekPreventionActions,
    ...monthPreventionActions,
  ]
  const completedDailyActionSet = new Set(completedDailyActionIds)
  const completedWeeklyActionSet = new Set(completedWeeklyActionIds)
  const completedMonthlyActionSet = new Set(completedMonthlyActionIds)
  const completedTodayPreventionActions = todayPreventionActions.filter(
    (goal) => completedDailyActionSet.has(goal.id),
  )
  const completedWeekPreventionActions = weekPreventionActions.filter(
    (goal) => completedWeeklyActionSet.has(goal.id),
  )
  const completedMonthPreventionActions = monthPreventionActions.filter(
    (goal) => completedMonthlyActionSet.has(goal.id),
  )
  const areAllTodayPreventionActionsComplete =
    todayPreventionActions.length > 0 &&
    completedTodayPreventionActions.length === todayPreventionActions.length
  const areAllMonthPreventionActionsComplete =
    monthPreventionActions.length > 0 &&
    completedMonthPreventionActions.length === monthPreventionActions.length
  const areAllWeekPreventionActionsComplete =
    weekPreventionActions.length > 0 &&
    completedWeekPreventionActions.length === weekPreventionActions.length
  const todayPreventionCompletionPercent = todayPreventionActions.length
    ? Math.round(
        (completedTodayPreventionActions.length / todayPreventionActions.length) * 100,
      )
    : 0
  const dashboardFocusSummary = formatDisplayList(
    preventionPlan.topPriorities.map((priority) => priority.title).slice(0, 2),
  )
  const healthProfileDetail = dashboardFocusSummary
    ? `Personalized from your profile. Current focus: ${dashboardFocusSummary}.`
    : 'Personalized from your family health and everyday habits.'
  const activeConditionDetails = activeConditionName
    ? getConditionDetails(activeConditionName)
    : null
  const disclaimerText =
    'Family Health helps organize your information for personalized educational insights. It is not a diagnosis or a substitute for professional medical advice.'
  const resourcePriorities = isAssessmentComplete
    ? getUserResourcePriorities({
        familyHealthSummary,
        familyMembers: familyHistoryMembers,
        preventionPlan,
      })
    : []
  const selectedEventCity =
    activeLocation.zipCode
      ? getCityForZip(String(activeLocation.zipCode || '').trim())
      : activeLocation.city || ''
  const cityEvents = useMemo(() => {
    if (!selectedEventCity) return []

    return weeklyEvents.filter(
      (event) =>
        event.attendanceMode !== 'online' &&
        normalizeCity(getEventCity(event)) === normalizeCity(selectedEventCity),
    )
  }, [weeklyEvents, selectedEventCity])
  const onlineWeeklyEvents = useMemo(
    () => weeklyEvents.filter((event) => event.attendanceMode === 'online'),
    [weeklyEvents],
  )
  const weeklyEventFilter = getEventFilterResult({
    activeLocation,
    cityEvents,
    onlineEvents: onlineWeeklyEvents,
    resourcePriorities,
  })
  const unfilteredWeeklyEvents = weeklyEventFilter.events
  const unfilteredOnlineEvents = weeklyEventFilter.onlineEvents
  const unfilteredOnlinePrograms = unfilteredOnlineEvents.filter(
    (event) => event.resourceType !== 'trusted_organization',
  )
  const unfilteredTrustedResources = unfilteredOnlineEvents.filter(
    (event) => event.resourceType === 'trusted_organization',
  )
  const activeGoalAction = activeGoalResourceFilter?.goal
    ? activeGoalResourceFilter
    : null
  const activeGoalIntent = activeGoalAction
    ? getResourceIntentForGoal(activeGoalAction.goal, preventionProfile)
    : null
  const shouldShowMammographyFacilities =
    activeGoalIntent?.resourceIntent === 'mammography-facility'
  const shouldShowWalkingPlaces =
    activeGoalIntent?.resourceIntent === 'physical-activity'
  const mammographyFacilityResources = shouldShowMammographyFacilities
    ? getMammographyFacilityResources(activeLocation.zipCode, { limit: 10 })
    : []
  const walkingPlaceResources =
    shouldShowWalkingPlaces && weeklyEventFilter.zipCode
      ? getParksNearZip(weeklyEventFilter.zipCode)
          .slice(0, 5)
          .map(createWalkingPlaceResource)
      : []
  const trustedGoalResources = activeGoalAction
    ? getTrustedResourcesForGoalIntent(activeGoalIntent, activeLocation)
    : []
  const bloodPressureSearchResource =
    activeGoalIntent?.resourceIntent === 'cardiovascular-screening'
      ? createBloodPressureSearchResource(activeLocation)
      : null
  const unfilteredOnlineEventsWithGoalResources = [
    ...trustedGoalResources,
    ...unfilteredOnlineEvents.filter(
      (event) => !trustedGoalResources.some((resource) => resource.id === event.id),
    ),
  ]
  const unfilteredWeeklyEventsWithGoalPlaces = [
    ...walkingPlaceResources,
    ...mammographyFacilityResources,
    ...(bloodPressureSearchResource ? [bloodPressureSearchResource] : []),
    ...unfilteredWeeklyEvents.filter(
      (event) =>
        !mammographyFacilityResources.some((resource) => resource.id === event.id) &&
        !walkingPlaceResources.some((resource) => resource.id === event.id),
    ),
  ]
  const displayedWeeklyEvents = activeGoalAction
    ? rankResourcesForGoalIntent(
        unfilteredWeeklyEventsWithGoalPlaces,
        activeGoalIntent,
        activeGoalAction.goal,
        preventionProfile,
      )
    : []
  const displayedOnlineEvents = activeGoalAction
    ? rankResourcesForGoalIntent(
        unfilteredOnlineEventsWithGoalResources,
        activeGoalIntent,
        activeGoalAction.goal,
        preventionProfile,
      )
    : []
  const displayedOnlinePrograms = displayedOnlineEvents.filter(
    (event) => event.resourceType !== 'trusted_organization',
  )
  const displayedTrustedResources = displayedOnlineEvents.filter(
    (event) => event.resourceType === 'trusted_organization',
  )
  const goalActionResources = [
    ...unfilteredWeeklyEventsWithGoalPlaces,
    ...trustedGoalResources,
    ...unfilteredOnlinePrograms,
    ...unfilteredTrustedResources,
  ]
  const preventionActionsWithResources = trackablePreventionActions.map((goal) => {
    const resources = getGoalResourceMatches(
      goal,
      goalActionResources,
      preventionProfile,
      activeLocation,
    )

    return {
      ...goal,
      resourceNeeded: getResourceIntentForGoal(goal, preventionProfile).resourceNeeded,
      primaryActionLabel: getGoalPrimaryActionLabel(goal, preventionProfile),
      resources,
    }
  })
  const preventionActionsById = new Map(
    preventionActionsWithResources.map((goal) => [goal.id, goal]),
  )
  const todayPreventionActionsWithResources = todayPreventionActions.map(
    (goal) => preventionActionsById.get(goal.id) || goal,
  )
  const weekPreventionActionsWithResources = weekPreventionActions.map(
    (goal) => preventionActionsById.get(goal.id) || goal,
  )
  const monthPreventionActionsWithResources = monthPreventionActions.map(
    (goal) => preventionActionsById.get(goal.id) || goal,
  )
  const activeGoalResourceSections = activeGoalIntent
    ? groupResourcesByGoalRelevance(
        [...displayedWeeklyEvents, ...displayedOnlineEvents],
        activeGoalIntent,
      )
    : []
  const selectedEvent =
    [...displayedWeeklyEvents, ...displayedOnlineEvents].find(
      (event) => event.id === selectedWeeklyEvent?.id,
    ) ||
    displayedWeeklyEvents[0] ||
    null
  const isPhysicalActivityResourceAction =
    activeGoalIntent?.resourceIntent === 'physical-activity'
  const weeklyEventHeading = activeGoalAction
    ? isPhysicalActivityResourceAction
      ? 'Parks & Trails Near You'
      : 'Resources for this action'
    : ''
  let weeklyEventDescription = ''

  if (activeGoalAction) {
    if (isPhysicalActivityResourceAction && weeklyEventFilter.zipCode) {
      weeklyEventDescription = weeklyEventFilter.targetCity
        ? `Showing parks, trails, and recreation areas near ${weeklyEventFilter.targetCity}.`
        : 'Showing parks, trails, and recreation areas near your ZIP code.'
    } else if (
      activeGoalIntent?.resourceIntent === 'mammography-facility' &&
      !weeklyEventFilter.zipCode
    ) {
      weeklyEventDescription = 'Add your ZIP code to find nearby mammography facilities.'
    } else if (weeklyEventFilter.zipCode) {
      weeklyEventDescription = weeklyEventFilter.targetCity
        ? `Showing resources related to this action in ${weeklyEventFilter.targetCity}.`
        : ''
    } else {
      weeklyEventDescription = 'Enter a ZIP code to find local resources for this action.'
    }
  }
  const weeklyEventMapUrl = selectedEvent
    ? buildEventMapEmbedUrl(selectedEvent)
    : ''

  if (import.meta.env.DEV) {
    console.log('Entered ZIP:', activeLocation.zipCode)
    console.log('Selected city:', selectedEventCity)
    console.log(
      'All event cities:',
      weeklyEvents.map((event) => getEventCity(event)),
    )
    console.log(
      'City-filtered event cities:',
      cityEvents.map((event) => getEventCity(event)),
    )
    console.log(
      'Final displayed event cities:',
      displayedWeeklyEvents.map((event) => getEventCity(event)),
    )
    console.log({
      coordinates:
        Number.isFinite(activeLocation.latitude) &&
        Number.isFinite(activeLocation.longitude)
          ? {
              latitude: activeLocation.latitude,
              longitude: activeLocation.longitude,
            }
          : null,
      detectedCity: activeLocation.city,
      detectedZip: activeLocation.zipCode,
      cityResourceCount: cityEvents.length,
      personalizedResourceCount: displayedWeeklyEvents.length,
    })
  }
  const familyFormContextMember = editingFamilyMemberId
    ? familyMembers.find((member) => member.id === editingFamilyMemberId) || {
        relationship,
        relationshipType: familyRelationshipType,
        slotIndex: getSlotIndexFromRelativeId(
          editingFamilyMemberId,
          familyRelationshipType,
        ),
      }
    : {
        relationship,
        relationshipType: familyRelationshipType,
      }
  const nextIncompleteAssessmentView = getNextIncompleteAssessmentView({
    hasCurrentHealthData: hasCurrentHealthSectionData,
    hasFamilyHistoryData,
    hasFamilyStructureData: hasFamilyStructureSectionData,
    hasLifestyleData,
  })
  const assessmentCompletionState = {
    hasCurrentHealthData: hasCurrentHealthSectionData,
    hasFamilyHistoryData,
    hasFamilyStructureData: hasFamilyStructureSectionData,
    hasLifestyleData,
  }
  const assessmentUnlockTitle = hasStartedAssessment
    ? 'Build Your Health Profile'
    : 'Welcome!'
  const assessmentUnlockDescription = hasStartedAssessment
    ? 'Finish your family health tree and everyday habits to unlock your health profile and prevention plan.'
    : 'Your personalized prevention dashboard will appear after you build your health profile.'
  const familyFormContextLabel = formatRelationshipLabel(familyFormContextMember)
  const selectedFamilyConditionSummary = selectedIllnesses
    .filter(Boolean)
    .map((condition) => {
      const conditionDetails = familyConditionDetails[getIllnessKey(condition)] || {}
      const diagnosisAge = asString(conditionDetails.diagnosisAge).trim()
      const hasNoKnownConditions = isNoIllness(condition)

      return {
        conditionName: condition,
        diagnosisLabel:
          hasNoKnownConditions
            ? ''
            : diagnosisAge && diagnosisAge !== unknownDiagnosisAgeLabel
            ? `Diagnosed at ${diagnosisAge}`
            : 'Age not added',
        name:
          hasNoKnownConditions
            ? 'No known conditions'
            : getIllnessKey(condition) === getIllnessKey(unknownConditionLabel)
            ? 'Information unavailable'
            : getDisplayConditionName(condition),
      }
    })
  const activeConditionGroup = searchableFamilyConditionGroups.find(
    (group) => group.id === activeFamilyConditionGroup,
  )
  const familyConditionSearchResults = useMemo(
    () =>
      searchFamilyConditions(
        searchableFamilyConditionGroups,
        familyConditionSearchInput,
      ),
    [familyConditionSearchInput],
  )
  const pendingConditionAlreadyAdded = pendingFamilyCondition
    ? selectedIllnesses.some(
        (illness) => getIllnessKey(illness) === getIllnessKey(pendingFamilyCondition),
      )
    : false
  const currentFamilyEditorSignature = useMemo(
    () =>
      getFamilyEditorSignature({
        activeFamilyConditionGroup,
        familyConditionDetails,
        familyConditionSearchInput,
        familyMemberName,
        pendingFamilyCondition,
        pendingFamilyDiagnosisAge,
        selectedIllnesses,
      }),
    [
      activeFamilyConditionGroup,
      familyConditionDetails,
      familyConditionSearchInput,
      familyMemberName,
      pendingFamilyCondition,
      pendingFamilyDiagnosisAge,
      selectedIllnesses,
    ],
  )
  const hasUnsavedFamilyEditorChanges =
    isFamilyFormOpen &&
    familyEditorInitialSignature &&
    currentFamilyEditorSignature !== familyEditorInitialSignature
  const activeAssessmentGuidance =
    assessmentGuidance?.viewId === activeView ? assessmentGuidance : null

  function getAssessmentSectionClass(baseClassName, viewId) {
    return activeAssessmentGuidance?.viewId === viewId
      ? `${baseClassName} assessment-section-highlight`
      : baseClassName
  }

  function renderFamilyRelativeCard(member, section) {
    const memberConditions = member.conditions || []
    const knownConditions = memberConditions.filter(
      (condition) => !isNoIllness(condition.name),
    )
    const hasHealthHistory = memberConditions.length > 0 && !member.isPlaceholder
    const actionLabel = hasHealthHistory
      ? 'Update Health History'
      : 'Add Health History'
    const cardAccent = member.isSelf ? 'blue' : section.accent
    const isPedigreeNode = section.variant === 'pedigree'
    const visibleActionLabel = isPedigreeNode
      ? hasHealthHistory
        ? 'Update'
        : 'Add History'
      : actionLabel
    const primaryName = getRelativePrimaryName(member)
    const relationshipLabel = formatRelationshipLabel(member)
    const showRelationshipLabel = primaryName !== relationshipLabel
    const conditionSummary =
      knownConditions.length > 0
        ? `${knownConditions.length} ${
            knownConditions.length === 1 ? 'condition' : 'conditions'
          }`
        : memberConditions.some(
              (condition) =>
                getIllnessKey(condition.name) ===
                getIllnessKey(unknownConditionLabel),
            )
          ? 'Information unavailable'
          : 'No health history'

    return (
      <article
        className={`family-profile-card family-profile-${cardAccent}${
          member.isSelf ? ' self-card' : ''
        }${isPedigreeNode ? ' pedigree-node-card' : ''
        }`}
        key={member.id}
      >
        <button
          className="family-profile-main"
          type="button"
          onClick={() => openEditFamilyMember(member)}
        >
          <span className="family-avatar" aria-hidden="true">
            {getTreeInitials(member)}
          </span>
          <span className="family-profile-copy">
            <span className="family-profile-title-row">
              <strong title={primaryName}>{primaryName}</strong>
            </span>
            {showRelationshipLabel ? (
              <span className="family-profile-role">{relationshipLabel}</span>
            ) : null}
            <span className="family-condition-summary-list">
              <span>
                {knownConditions.length > 0 ? (
                  <span aria-hidden="true">✓ </span>
                ) : null}
                {conditionSummary}
              </span>
            </span>
            {!member.isSelf ? (
              <span className="family-history-action-text">
                {visibleActionLabel} →
              </span>
            ) : null}
          </span>
        </button>
      </article>
    )
  }

  function renderPedigreeNode(member, section) {
    return (
      <div
        className="pedigree-node-wrap"
        data-pedigree-node-id={member.id}
        key={member.id}
      >
        {renderFamilyRelativeCard(member, {
          ...section,
          variant: 'pedigree',
        })}
      </div>
    )
  }

  const maternalGrandparentMembers = [
    getCoreRelative('maternal-grandfather'),
    getCoreRelative('maternal-grandmother'),
  ]
  const paternalGrandparentMembers = [
    getCoreRelative('paternal-grandfather'),
    getCoreRelative('paternal-grandmother'),
  ]
  const maternalAuntMembers = getCountedRelatives(
    'maternal-aunt',
    familyStructure.maternalAunts,
  )
  const maternalUncleMembers = getCountedRelatives(
    'maternal-uncle',
    familyStructure.maternalUncles,
  )
  const paternalAuntMembers = getCountedRelatives(
    'paternal-aunt',
    familyStructure.paternalAunts,
  )
  const paternalUncleMembers = getCountedRelatives(
    'paternal-uncle',
    familyStructure.paternalUncles,
  )
  const motherBranchMembers = [
    ...maternalAuntMembers,
    ...maternalUncleMembers,
  ]
  const fatherBranchMembers = [
    ...paternalAuntMembers,
    ...paternalUncleMembers,
  ]
  const dashboardSummaryCards = isAssessmentComplete
    ? [
        {
          icon: '✓',
          label: 'Health Profile',
          value: 'Complete',
          detail: healthProfileDetail,
        },
        {
          icon: '◌',
          label: 'Prevention Progress',
          value: `${completedTodayPreventionActions.length} / ${todayPreventionActions.length} actions completed`,
          detail: "Today's personalized actions.",
          progressValue: todayPreventionCompletionPercent,
        },
      ]
    : []
  const workflowStepIds = workflowSteps.map((step) => step.id)
  const activeWorkflowStepIndex = workflowStepIds.indexOf(activeView)
  const isWorkflowView = activeWorkflowStepIndex >= 0
  const currentWorkflowIndex = isWorkflowView ? activeWorkflowStepIndex : -1
  const previousWorkflowStep =
    currentWorkflowIndex > 0
      ? workflowSteps[currentWorkflowIndex - 1]
      : null
  const nextWorkflowStep =
    currentWorkflowIndex < workflowSteps.length - 1
      ? workflowSteps[currentWorkflowIndex + 1]
      : null
  const continueTarget = nextWorkflowStep?.id || 'dashboard'
  const finishTarget = activeView === 'coach' ? 'dashboard' : null
  const workflowContinueLabel = activeView === 'insights' ? 'Continue' : 'Save and Continue'
  const currentProfileState = useMemo(
    () =>
      getProfileStateSnapshot({
        activeLocation,
        activeView,
        accountProfile,
        accountSettingsOpen: isAccountSettingsOpen,
        completedDailyActionIds,
        completedMonthlyActionIds,
        completedWeeklyActionIds,
        dailyActions,
        dailyActionsDate,
        dailyGoals,
        dailyGoalsDate,
        editingFamilyMemberId,
        familyDiagnosisAge,
        familyEarlyDiagnosis,
        familyMemberName,
        familyMembers,
        familyStructure,
        familyStructureCompleted,
        goalCompletionHistory,
        habitProgress,
        lastGoalResetDate,
        locationMessage,
        locationStatus,
        monthlyActions,
        monthlyActionsMonth,
        preventionActionHistory,
        weeklyActions,
        weeklyActionsWeek,
        profileForm,
        profileHasUnlistedCondition,
        profileIllnessInput,
        profileIllnesses,
        profileNoListedConditions,
        relationship,
        selectedIllnesses,
        userProfile,
      }),
    [
      activeLocation,
      activeView,
      accountProfile,
      isAccountSettingsOpen,
      completedDailyActionIds,
      completedMonthlyActionIds,
      completedWeeklyActionIds,
      dailyActions,
      dailyActionsDate,
      dailyGoals,
      dailyGoalsDate,
      editingFamilyMemberId,
      familyDiagnosisAge,
      familyEarlyDiagnosis,
      familyMemberName,
      familyMembers,
      familyStructure,
      familyStructureCompleted,
      goalCompletionHistory,
      habitProgress,
      lastGoalResetDate,
      locationMessage,
      locationStatus,
      monthlyActions,
      monthlyActionsMonth,
      preventionActionHistory,
      weeklyActions,
      weeklyActionsWeek,
      profileForm,
      profileHasUnlistedCondition,
      profileIllnessInput,
      profileIllnesses,
      profileNoListedConditions,
      relationship,
      selectedIllnesses,
      userProfile,
    ],
  )

  const applySavedState = useCallback((nextSavedState, options = {}) => {
    const normalizedState = normalizeSavedState(nextSavedState)
    const targetView = options.openProfile ? 'dashboard' : normalizedState.activeView

    setActiveView(targetView)
    setAccountProfile(normalizedState.accountProfile)
    setAccountDisplayNameInput(normalizedState.accountProfile.displayName)
    setUserProfile(normalizedState.userProfile)
    setProfileForm(normalizedState.profileForm)
    setProfileIllnesses(normalizedState.profileIllnesses)
    setProfileIllnessInput(normalizedState.profileIllnessInput)
    setProfileNoListedConditions(normalizedState.profileNoListedConditions)
    setProfileHasUnlistedCondition(normalizedState.profileHasUnlistedCondition)
    setFamilyStructure(normalizedState.familyStructure)
    setFamilyStructureDraft(normalizedState.familyStructure)
    setFamilyStructureCompleted(normalizedState.familyStructureCompleted)
    setFamilyMembers(normalizedState.familyMembers)
    setFamilyMemberName(normalizedState.familyMemberName)
    setRelationship(normalizedState.relationship)
    setFamilyRelationshipMode('')
    setFamilyRelationshipType('')
    setSelectedIllnesses(normalizedState.selectedIllnesses)
    setFamilyConditionDetails({})
    resetFamilyConditionPickerPath()
    setFamilyEarlyDiagnosis(normalizedState.familyEarlyDiagnosis)
    setFamilyDiagnosisAge(normalizedState.familyDiagnosisAge)
    setEditingFamilyMemberId(normalizedState.editingFamilyMemberId)
    setHabitProgress(normalizedState.habitProgress)
    setDailyActions(normalizedState.dailyActions)
    dailyActionsDateRef.current = normalizedState.dailyActionsDate
    setDailyActionsDate(normalizedState.dailyActionsDate)
    setCompletedDailyActionIds(normalizedState.completedDailyActionIds)
    setDailyGoals(normalizedState.dailyGoals)
    dailyGoalsDateRef.current = normalizedState.dailyGoalsDate
    setDailyGoalsDate(normalizedState.dailyGoalsDate)
    lastGoalResetDateRef.current = normalizedState.lastGoalResetDate
    setLastGoalResetDate(normalizedState.lastGoalResetDate)
    setGoalCompletionHistory(normalizedState.goalCompletionHistory)
    setWeeklyActions(normalizedState.weeklyActions)
    weeklyActionsWeekRef.current = normalizedState.weeklyActionsWeek
    setWeeklyActionsWeek(normalizedState.weeklyActionsWeek)
    setCompletedWeeklyActionIds(normalizedState.completedWeeklyActionIds)
    setMonthlyActions(normalizedState.monthlyActions)
    monthlyActionsMonthRef.current = normalizedState.monthlyActionsMonth
    setMonthlyActionsMonth(normalizedState.monthlyActionsMonth)
    setCompletedMonthlyActionIds(normalizedState.completedMonthlyActionIds)
    setPreventionActionHistory(normalizedState.preventionActionHistory)
    setActiveLocation(normalizedState.activeLocation)
    setLocationStatus(normalizedState.locationStatus)
    setLocationMessage(normalizedState.locationMessage)
    setError('')
    setSuccessMessage('')
    setActiveConditionName(null)
    setIsFamilyFormOpen(false)
    setShowParentRequirementPrompt(false)
    setSelectedWeeklyEvent(null)
    setExpandedEventDescriptions({})
    setIsAccountMenuOpen(false)
    setIsAccountSettingsOpen(Boolean(normalizedState.accountSettingsOpen))
    setFamilyEditorInitialSignature('')
    setShowFamilyEditorDiscardPrompt(false)

    const savedProfileState = getProfileStateSnapshot({
      ...normalizedState,
      activeView: targetView,
    })
    lastSavedProfileStateRef.current = serializeProfileState(savedProfileState)
    latestProfileStateRef.current = lastSavedProfileStateRef.current
  }, [])

  useEffect(() => {
    const updateGreeting = () => {
      setDashboardGreeting(getGreeting())
    }

    updateGreeting()
    const greetingInterval = window.setInterval(updateGreeting, 60 * 1000)

    return () => window.clearInterval(greetingInterval)
  }, [])

  useEffect(() => {
    if (!user) {
      return undefined
    }

    let isCurrentLoad = true

    async function loadCloudProfile() {
      setHasLoadedCloudProfile(false)
      setProfileHydrated(false)
      setCloudProfileStatus('loading')
      setCloudProfileError('')
      setSaveStatus('idle')
      setShowDeviceImportPrompt(false)

      try {
        const cloudProfile = await loadUserProfile(user.id)

        if (!isCurrentLoad) {
          return
        }

        if (cloudProfile) {
          applySavedState(cloudProfile)
        } else {
          applySavedState(defaultSavedState, { openProfile: true })
          setShowDeviceImportPrompt(
            hasAssessmentData({
              familyMembers: deviceSavedAppState.familyMembers,
              profileForm: deviceSavedAppState.profileForm,
              profileIllnesses: deviceSavedAppState.profileIllnesses,
            }),
          )
        }

        setProfileHydrated(true)
        setHasLoadedCloudProfile(true)
        setCloudProfileStatus('success')
      } catch (loadError) {
        if (!isCurrentLoad) {
          return
        }

        setCloudProfileError(
          loadError.message || 'Unable to load your cloud profile.',
        )
        setCloudProfileStatus('error')
      }
    }

    loadCloudProfile()

    return () => {
      isCurrentLoad = false
    }
  }, [applySavedState, deviceSavedAppState, user])

  useEffect(() => {
    if (!user || !hasLoadedCloudProfile || !profileHydrated) {
      return undefined
    }

    const serializedProfileState = serializeProfileState(currentProfileState)
    latestProfileStateRef.current = serializedProfileState

    if (serializedProfileState === lastSavedProfileStateRef.current) {
      return undefined
    }

    setSaveStatus('saving')

    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current)
    }

    saveDebounceRef.current = window.setTimeout(async () => {
      try {
        const saveResult = await profileSaveCoordinatorRef.current.save(
          user.id,
          currentProfileState,
        )

        if (
          saveResult.isLatest &&
          latestProfileStateRef.current === serializedProfileState
        ) {
          lastSavedProfileStateRef.current = serializedProfileState
          setSaveStatus('saved')
        }
      } catch {
        setSaveStatus('error')
      }
    }, 1000)

    return () => {
      if (saveDebounceRef.current) {
        window.clearTimeout(saveDebounceRef.current)
      }
    }
  }, [currentProfileState, hasLoadedCloudProfile, profileHydrated, user])

  useEffect(() => {
    if (!user || !hasLoadedCloudProfile || !profileHydrated || !isAssessmentComplete) {
      return undefined
    }

    function prepareGoalsForTodayIfNeeded() {
      const today = getLocalDateKey()
      const week = getLocalWeekKey()
      const month = getLocalMonthKey()
      const hasSavedGoalsForToday =
        dailyGoalsDateRef.current === today && dailyGoals.length > 0
      const hasSavedActionsForToday =
        dailyActionsDateRef.current === today && dailyActions.length > 0
      const hasSavedActionsForWeek =
        weeklyActionsWeekRef.current === week && weeklyActions.length > 0
      const hasSavedActionsForMonth =
        monthlyActionsMonthRef.current === month && monthlyActions.length > 0

      if (hasSavedGoalsForToday && lastGoalResetDateRef.current === today) {
        if (hasSavedActionsForToday && hasSavedActionsForWeek && hasSavedActionsForMonth) {
          return
        }
      }

      let nextPreventionActionHistory = preventionActionHistory

      if (dailyActionsDateRef.current && dailyActionsDateRef.current !== today && dailyActions.length > 0) {
        nextPreventionActionHistory = mergeActionHistoryEntries(
          nextPreventionActionHistory,
          buildActionHistoryEntries({
            actions: dailyActions,
            completedActionIds: completedDailyActionIds,
            period: 'today',
            periodKey: dailyActionsDateRef.current,
          }),
        )
      }

      if (weeklyActionsWeekRef.current && weeklyActionsWeekRef.current !== week && weeklyActions.length > 0) {
        nextPreventionActionHistory = mergeActionHistoryEntries(
          nextPreventionActionHistory,
          buildActionHistoryEntries({
            actions: weeklyActions,
            completedActionIds: completedWeeklyActionIds,
            period: 'week',
            periodKey: weeklyActionsWeekRef.current,
          }),
        )
      }

      if (monthlyActionsMonthRef.current && monthlyActionsMonthRef.current !== month && monthlyActions.length > 0) {
        nextPreventionActionHistory = mergeActionHistoryEntries(
          nextPreventionActionHistory,
          buildActionHistoryEntries({
            actions: monthlyActions,
            completedActionIds: completedMonthlyActionIds,
            period: 'month',
            periodKey: monthlyActionsMonthRef.current,
          }),
        )
      }

      if (nextPreventionActionHistory !== preventionActionHistory) {
        setPreventionActionHistory(nextPreventionActionHistory)
      }

      const nextGeneratedPreventionActionPlan =
        nextPreventionActionHistory === preventionActionHistory
          ? generatedPreventionActionPlan
          : buildPreventionActionPlan({
              actionHistory: nextPreventionActionHistory,
              familyMembers: familyHistoryMembers,
              preventionInsights,
              profile: preventionProfile,
            })

      if (lastGoalResetDateRef.current !== today) {
        lastGoalResetDateRef.current = today
        setHabitProgress({})
        setCompletedDailyActionIds([])
        setLastGoalResetDate(today)
      }

      if (!hasSavedGoalsForToday && generatedCoachGoals.length > 0) {
        dailyGoalsDateRef.current = today
        setDailyGoals(generatedCoachGoals)
        setDailyGoalsDate(today)
      }

      if (!hasSavedActionsForToday && nextGeneratedPreventionActionPlan.today.length > 0) {
        dailyActionsDateRef.current = today
        setDailyActions(nextGeneratedPreventionActionPlan.today)
        setDailyActionsDate(today)
        setCompletedDailyActionIds([])
      }

      if (!hasSavedActionsForWeek && nextGeneratedPreventionActionPlan.thisWeek.length > 0) {
        weeklyActionsWeekRef.current = week
        setWeeklyActions(nextGeneratedPreventionActionPlan.thisWeek)
        setWeeklyActionsWeek(week)
        setCompletedWeeklyActionIds([])

        if (
          nextGeneratedPreventionActionPlan.thisWeek.some(
            (action) => Number(action.adaptationLevel) > 0,
          )
        ) {
          setSuccessMessage(
            "Your plan has been adjusted to make this week's actions more manageable based on recent progress.",
          )
          window.setTimeout(() => {
            setSuccessMessage((currentMessage) =>
              currentMessage.includes('plan has been adjusted') ? '' : currentMessage,
            )
          }, 5000)
        }
      }

      if (!hasSavedActionsForMonth && nextGeneratedPreventionActionPlan.thisMonth.length > 0) {
        monthlyActionsMonthRef.current = month
        setMonthlyActions(nextGeneratedPreventionActionPlan.thisMonth)
        setMonthlyActionsMonth(month)
        setCompletedMonthlyActionIds([])
      }
    }

    prepareGoalsForTodayIfNeeded()

    function scheduleNextLocalMidnightReset() {
      const now = new Date()
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        1,
      )
      const delay = Math.max(1000, nextMidnight.getTime() - now.getTime())

      return window.setTimeout(() => {
        prepareGoalsForTodayIfNeeded()
        midnightResetTimer = scheduleNextLocalMidnightReset()
      }, delay)
    }

    let midnightResetTimer = scheduleNextLocalMidnightReset()

    return () => window.clearTimeout(midnightResetTimer)
  }, [
    dailyGoals.length,
    dailyActions.length,
    dailyActions,
    completedDailyActionIds,
    completedMonthlyActionIds,
    completedWeeklyActionIds,
    familyHistoryMembers,
    generatedCoachGoals,
    generatedPreventionActionPlan,
    hasLoadedCloudProfile,
    isAssessmentComplete,
    monthlyActions.length,
    monthlyActions,
    preventionActionHistory,
    preventionInsights,
    preventionProfile,
    profileHydrated,
    user,
    weeklyActions.length,
    weeklyActions,
  ])

  useEffect(() => {
    const controller = new AbortController()

    async function loadWeeklyEvents() {
      setWeeklyEventsStatus('loading')
      setWeeklyEventsError('')

      try {
        const response = await fetch('/data/events.json', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Unable to load events.json (${response.status}).`)
        }

        const events = await response.json()

        if (!Array.isArray(events)) {
          throw new Error('The events data file is not a valid event list.')
        }

        setWeeklyEvents(events.map(normalizeRemoteEvent))
        setWeeklyEventsStatus('success')
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return
        }

        setWeeklyEvents([])
        setWeeklyEventsError(
          fetchError.message ||
            'This week’s events could not be loaded. Please try again later.',
        )
        setWeeklyEventsStatus('error')
      }
    }

    loadWeeklyEvents()

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!activeConditionName) {
      return undefined
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setActiveConditionName(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeConditionName])

  useEffect(() => {
    if (!assessmentGuidance || assessmentGuidance.viewId !== activeView) {
      return undefined
    }

    const dismissTimer = window.setTimeout(() => {
      setAssessmentGuidance((currentGuidance) =>
        currentGuidance?.id === assessmentGuidance.id ? null : currentGuidance,
      )
    }, 4500)

    window.requestAnimationFrame(() => {
      document
        .getElementById(`assessment-section-${assessmentGuidance.viewId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.clearTimeout(dismissTimer)
  }, [activeView, assessmentGuidance])

  useEffect(() => {
    if (!navigationNotice) {
      return undefined
    }

    const dismissTimer = window.setTimeout(() => {
      setNavigationNotice((currentNotice) =>
        currentNotice?.id === navigationNotice.id ? null : currentNotice,
      )
    }, 4500)

    return () => window.clearTimeout(dismissTimer)
  }, [navigationNotice])

  useEffect(() => {
    if (!isAssessmentLoading) {
      return undefined
    }

    const finishTimer = window.setTimeout(() => {
      setIsAssessmentLoading(false)
      setActiveView(assessmentLoadingTarget)
      setIsNavOpen(false)
      setActiveConditionName(null)
      setError('')

      window.requestAnimationFrame(() => {
        document
          .querySelector('.app-shell')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }, assessmentTransitionDuration)

    return () => {
      window.clearTimeout(finishTimer)
    }
  }, [assessmentLoadingTarget, isAssessmentLoading])

  function openConditionDetails(conditionName) {
    setActiveConditionName(conditionName)
  }

  function changeView(viewId) {
    const access = getAssessmentNavigationAccess({
      targetView: viewId,
      ...assessmentCompletionState,
    })

    if (!access.allowed) {
      setNavigationNotice({
        id: `profile-lock-${Date.now()}`,
        message: access.message,
      })
      setIsNavOpen(false)
      return false
    }

    setActiveView(viewId)
    setIsNavOpen(false)
    setActiveConditionName(null)
    setError('')

    window.requestAnimationFrame(() => {
      document
        .querySelector('.app-shell')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return true
  }

  function scrollToNearbyResources() {
    window.requestAnimationFrame(() => {
      document
        .getElementById('location-title')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleGoalPrimaryAction(goal) {
    const action = getGoalAction(goal, preventionProfile)

    if (action.actionType === 'family-history') {
      changeView('family')
      return
    }

    setActiveGoalResourceFilter({ action, goal })
    setSelectedWeeklyEvent(goal.resources?.find((resource) => !isOnlineEvent(resource)) || null)
    scrollToNearbyResources()
  }

  function startAssessmentTransition(target) {
    if (isAssessmentLoading || !target || target === activeView) {
      return
    }

    setAssessmentLoadingTarget(target)
    setIsAssessmentLoading(true)
    setIsNavOpen(false)
    setSuccessMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function beginAssessmentWithLoading() {
    const guidanceMessage = getAssessmentReminderMessage(nextIncompleteAssessmentView)

    if (guidanceMessage) {
      setAssessmentGuidance({
        id: `${nextIncompleteAssessmentView}-${Date.now()}`,
        message: guidanceMessage,
        viewId: nextIncompleteAssessmentView,
      })
    }

    startAssessmentTransition(nextIncompleteAssessmentView)
  }

  function requestUserLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationMessage(
        'Location is not available in this browser. Enter a city or ZIP code instead.',
      )
      return
    }

    setLocationStatus('loading')
    setLocationMessage('Finding your location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        const locationMatch = getClosestSupportedZipForCoordinates(coordinates)

        if (!locationMatch) {
          setActiveLocation({
            city: '',
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            source: 'current-location',
            zipCode: '',
          })
          setSelectedWeeklyEvent(null)
          setLocationStatus('error')
          setLocationMessage(
            'We could not determine your location. Enter a city or ZIP code instead.',
          )
          return
        }

        setActiveLocation({
          city: locationMatch.city,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          source: 'current-location',
          zipCode: locationMatch.zipCode,
        })
        setSelectedWeeklyEvent(null)
        setLocationStatus('success')
        setLocationMessage(
          `Current location · ${locationMatch.city}, ${locationMatch.zipCode}`,
        )
      },
      (positionError) => {
        setLocationStatus('error')
        setLocationMessage(
          positionError.code === positionError.PERMISSION_DENIED
            ? 'Location access was denied. Enter a city or ZIP code instead.'
            : 'We could not determine your location. Enter a city or ZIP code instead.',
        )
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 10000,
      },
    )
  }

  function handleManualLocationSubmit(event) {
    event.preventDefault()

    const locationInput = String(activeLocation.zipCode || '').trim()

    if (!locationInput.trim()) {
      setLocationStatus('error')
      setLocationMessage('Enter a valid five-digit ZIP code.')
      return
    }

    if (!/^\d{5}$/.test(locationInput)) {
      setActiveLocation({
        city: '',
        latitude: null,
        longitude: null,
        source: 'manual',
        zipCode: locationInput,
      })
      setSelectedWeeklyEvent(null)
      setLocationStatus('error')
      setLocationMessage('Enter a valid five-digit ZIP code.')
      return
    }

    const city = getCityForZip(locationInput)

    setActiveLocation({
      city,
      latitude: null,
      longitude: null,
      source: 'manual',
      zipCode: locationInput,
    })
    setSelectedWeeklyEvent(null)

    if (!city || !isSupportedZip(locationInput)) {
      setLocationStatus('error')
      setLocationMessage('That ZIP code is outside the areas currently supported.')
      return
    }

    setLocationStatus('manual')
    setLocationMessage(`Showing health events near ${locationInput} (${city}).`)
  }

  function addProfileIllness(illness) {
    const databaseIllness = getDatabaseIllness(illness)

    if (!databaseIllness) {
      return
    }

    setProfileNoListedConditions(false)
    setProfileIllnesses((currentIllnesses) =>
      addIllnessToList(currentIllnesses, databaseIllness),
    )
  }

  function removeProfileIllness(illness) {
    setProfileIllnesses((currentIllnesses) =>
      currentIllnesses.filter(
        (item) => getIllnessKey(item) !== getIllnessKey(illness),
      ),
    )
  }

  function toggleProfileNoListedConditions(selected) {
    setProfileNoListedConditions(selected)

    if (selected) {
      setProfileIllnesses([])
      setProfileHasUnlistedCondition(false)
    }
  }

  function toggleProfileHasUnlistedCondition(selected) {
    setProfileHasUnlistedCondition(selected)

    if (selected) {
      setProfileNoListedConditions(false)
    }
  }

  function resetFamilyConditionPickerPath() {
    setActiveFamilyConditionGroup('')
    setPendingFamilyCondition('')
    setPendingFamilyDiagnosisAge('')
    setFamilyConditionSearchInput('')
  }

  function addFamilyConditionToSummary(condition, diagnosisAge = '') {
    const conditionCategory = getFamilyConditionCategory(condition)

    setSelectedIllnesses((currentIllnesses) => {
      const withoutNoKnown = currentIllnesses.filter(
        (illness) =>
          !isNoIllness(illness) &&
          getIllnessKey(illness) !== getIllnessKey(unknownConditionLabel),
      )

      return addIllnessToList(withoutNoKnown, condition)
    })

    setFamilyConditionDetails((currentDetails) => {
      const conditionKey = getIllnessKey(condition)

      return {
        ...currentDetails,
        [conditionKey]: {
          category: conditionCategory,
          diagnosisAge,
          name: condition,
        },
      }
    })
  }

  function removeFamilyCondition(condition) {
    const conditionKey = getIllnessKey(condition)

    setSelectedIllnesses((currentIllnesses) =>
      currentIllnesses.filter((illness) => getIllnessKey(illness) !== conditionKey),
    )
    setFamilyConditionDetails((currentDetails) => {
      const nextDetails = { ...currentDetails }
      delete nextDetails[conditionKey]

      return nextDetails
    })
  }

  function selectFamilyConditionGroup(groupId) {
    setActiveFamilyConditionGroup(groupId)
    setPendingFamilyCondition('')
    setPendingFamilyDiagnosisAge('')
    setFamilyConditionSearchInput('')
  }

  function selectPendingFamilyCondition(condition) {
    setPendingFamilyCondition(condition)
    setPendingFamilyDiagnosisAge(
      familyConditionDetails[getIllnessKey(condition)]?.diagnosisAge || '',
    )
  }

  function selectFamilyConditionSearchResult(result) {
    setActiveFamilyConditionGroup(result.groupId)
    selectPendingFamilyCondition(result.condition)
    setFamilyConditionSearchInput('')
  }

  function goBackFamilyConditionPicker() {
    if (pendingFamilyCondition) {
      setPendingFamilyCondition('')
      setPendingFamilyDiagnosisAge('')
      return
    }

    if (activeFamilyConditionGroup) {
      setActiveFamilyConditionGroup('')
    }
  }

  function addPendingFamilyCondition() {
    if (!pendingFamilyCondition || pendingConditionAlreadyAdded) {
      return
    }

    const diagnosisAge = asString(pendingFamilyDiagnosisAge).trim()

    if (
      diagnosisAge &&
      (!/^\d+$/.test(diagnosisAge) ||
        Number(diagnosisAge) < 0 ||
        Number(diagnosisAge) > 120)
    ) {
      setError('Enter a whole-number diagnosis age between 0 and 120, or leave it blank.')
      return
    }

    addFamilyConditionToSummary(
      pendingFamilyCondition,
      getIllnessKey(pendingFamilyCondition) === getIllnessKey(unknownConditionLabel)
        ? unknownDiagnosisAgeLabel
        : diagnosisAge,
    )
    resetFamilyConditionPickerPath()
    setError('')
  }

  function updateFamilyConditionDiagnosisAge(condition, diagnosisAge) {
    setFamilyConditionDetails((currentDetails) => {
      const conditionKey = getIllnessKey(condition)

      return {
        ...currentDetails,
        [conditionKey]: {
          category:
            currentDetails[conditionKey]?.category ||
            getFamilyConditionCategory(condition),
          diagnosisAge,
          name: currentDetails[conditionKey]?.name || condition,
        },
      }
    })
  }

  function getFamilyConditionsForSave() {
    return resolveFamilyConditionSelection({
      noConditionLabels: [
        legacyNoIllnessOption,
        noListedConditionsLabel,
        noKnownConditionsLabel,
      ],
      noKnownConditionsLabel,
      selectedConditions: selectedIllnesses,
      unknownConditionLabel,
    })
  }

  function getFamilyConditionObjectsForSave() {
    const familyConditions = getFamilyConditionsForSave()

    if (
      familyConditions.some(
        (condition) =>
          getIllnessKey(condition) === getIllnessKey(unknownConditionLabel),
      )
    ) {
      return [
        {
          category: 'other',
          diagnosisAge: unknownDiagnosisAgeLabel,
          name: unknownConditionLabel,
        },
      ]
    }

    if (
      familyConditions.some((condition) => getIllnessKey(condition) === getIllnessKey(noKnownConditionsLabel))
    ) {
      return [
        {
          category: 'other',
          diagnosisAge: '',
          name: noKnownConditionsLabel,
        },
      ]
    }

    return familyConditions.map((condition) => {
      const conditionKey = getIllnessKey(condition)
      const details = familyConditionDetails[conditionKey] || {}

      return {
        category: details.category || getFamilyConditionCategory(condition),
        diagnosisAge: asString(details.diagnosisAge).trim(),
        name: condition,
      }
    })
  }

  function resetFamilyForm(defaultRelationship = '') {
    const isParentPrompt = defaultRelationship === 'Parent'
    const availableParentRelationship =
      isParentPrompt && hasMother && !hasFather
        ? 'Father'
        : isParentPrompt && hasFather && !hasMother
          ? 'Mother'
          : ''

    setFamilyMemberName('')
    setRelationship(isParentPrompt ? availableParentRelationship : defaultRelationship)
    setFamilyRelationshipMode(isParentPrompt ? 'parent' : '')
    setFamilyRelationshipType('')
    setSelectedIllnesses([])
    setFamilyConditionDetails({})
    resetFamilyConditionPickerPath()
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setError('')
  }

  function openEditFamilyMember(member) {
    const hasUnknownConditions = member.illnesses.some(
      (illness) => getIllnessKey(illness) === getIllnessKey(unknownConditionLabel),
    )
    const hasNoKnownConditions = member.illnesses.some(isNoIllness)
    const memberConditions =
      member.conditions?.length > 0
        ? member.conditions
        : sanitizeFamilyConditions(member.illnesses, member.diagnosisAge)
    const listedConditions = hasUnknownConditions
      ? [unknownConditionLabel]
      : hasNoKnownConditions
        ? [noKnownConditionsLabel]
      : memberConditions
          .map((condition) => condition.name)
          .filter((illness) => !isNoIllness(illness))
    const conditionDetails = memberConditions.reduce((details, condition) => ({
      ...details,
      [getIllnessKey(condition.name)]: {
        category: condition.category || getFamilyConditionCategory(condition.name),
        diagnosisAge: condition.diagnosisAge || '',
        name: condition.name,
      },
    }), {})
    const initialEditorSignature = getFamilyEditorSignature({
      familyConditionDetails: conditionDetails,
      familyMemberName: member.name || '',
      selectedIllnesses: listedConditions,
    })

    setFamilyMemberName(member.name || '')
    setRelationship(member.relationship)
    setFamilyRelationshipType(member.relationshipType || '')
    setFamilyRelationshipMode(
      member.relationship === 'Mother' || member.relationship === 'Father'
        ? 'parent'
        : '',
    )
    setSelectedIllnesses(listedConditions)
    setFamilyConditionDetails(conditionDetails)
    resetFamilyConditionPickerPath()
    setFamilyEarlyDiagnosis(Boolean(member.earlyDiagnosis))
    setFamilyDiagnosisAge(member.diagnosisAge || '')
    setEditingFamilyMemberId(member.id)
    setError('')
    setSuccessMessage('')
    setFamilyEditorInitialSignature(initialEditorSignature)
    setShowFamilyEditorDiscardPrompt(false)
    setIsFamilyFormOpen(true)
  }

  function discardFamilyFormChanges() {
    resetFamilyForm()
    setFamilyEditorInitialSignature('')
    setShowFamilyEditorDiscardPrompt(false)
    setIsFamilyFormOpen(false)
  }

  function closeFamilyForm() {
    if (hasUnsavedFamilyEditorChanges) {
      setShowFamilyEditorDiscardPrompt(true)
      return
    }

    discardFamilyFormChanges()
  }

  async function saveProfileData(message = 'Profile saved.') {
    const nextUserProfile = {
      id: 'self',
      relationship: 'Self',
      name: profileForm.name.trim(),
      age: profileForm.age,
      ageRange: profileForm.ageRange,
      sex: profileForm.sex,
      sexAtBirth: profileForm.sexAtBirth,
      heightFeet: profileForm.heightFeet,
      heightInches: profileForm.heightInches,
      weight: profileForm.weight,
      bmi: profileBmi,
      smokingStatus: profileForm.smokingStatus,
      alcoholUse: profileForm.alcoholUse,
      exercise: profileForm.exercise,
      fruitVegIntake: profileForm.fruitVegIntake,
      dietQuality: profileForm.dietQuality,
      sleep: profileForm.sleep,
      waterIntake: profileForm.waterIntake,
      sugaryDrinks: profileForm.sugaryDrinks,
      stressLevel: profileForm.stressLevel,
      screenTime: profileForm.screenTime,
      preventiveScreenings: profileForm.preventiveScreenings,
      knownHighBloodPressure: profileForm.knownHighBloodPressure,
      knownHighCholesterol: profileForm.knownHighCholesterol,
      diabetesStatus: profileForm.diabetesStatus,
      illnesses: profileIllnesses,
      noListedConditions: profileNoListedConditions,
      hasUnlistedCondition: profileHasUnlistedCondition,
      isSelf: true,
    }

    setUserProfile(nextUserProfile)

    if (user && hasLoadedCloudProfile && profileHydrated) {
      if (saveDebounceRef.current) {
        window.clearTimeout(saveDebounceRef.current)
        saveDebounceRef.current = null
      }

      const nextProfileState = {
        ...currentProfileState,
        userProfile: nextUserProfile,
      }
      const serializedNextProfileState = serializeProfileState(nextProfileState)

      latestProfileStateRef.current = serializedNextProfileState

      setSaveStatus('saving')

      try {
        const saveResult = await profileSaveCoordinatorRef.current.save(
          user.id,
          nextProfileState,
        )

        if (saveResult.isLatest) {
          lastSavedProfileStateRef.current = serializedNextProfileState
          setSaveStatus('saved')
        }
      } catch {
        setSaveStatus('error')
        setError("Your profile couldn't be saved. Please try again.")
        return false
      }
    }

    setSuccessMessage(message)
    setError('')
    return true
  }

  async function saveProfile(event) {
    event.preventDefault()
    await saveProfileData('Profile saved.')
  }

  async function addFamilyMember(event) {
    event.preventDefault()

    if (!relationship) {
      setError(
        familyRelationshipMode === 'parent'
          ? 'Choose Mother or Father before saving.'
          : 'Choose a relative type before saving.',
      )
      return
    }

    if (
      isRelationshipLimitReachedForSave({
        editingFamilyMemberId,
        familyMembers,
        relationship,
      })
    ) {
      const group = getRelationshipLimitGroup(relationship)
      setError(relationshipLimitMessages[group])
      return
    }

    if (
      relationship === 'Mother' &&
      familyMembers.some(
        (member) =>
          member.relationship === 'Mother' && member.id !== editingFamilyMemberId,
      )
    ) {
      setError('A mother profile has already been added.')
      return
    }

    if (
      relationship === 'Father' &&
      familyMembers.some(
        (member) =>
          member.relationship === 'Father' && member.id !== editingFamilyMemberId,
      )
    ) {
      setError('A father profile has already been added.')
      return
    }

    const familyConditionObjects = getFamilyConditionObjectsForSave()
    const invalidDiagnosisAge = familyConditionObjects.find((condition) => {
      const diagnosisAge = asString(condition.diagnosisAge).trim()

      return (
        diagnosisAge &&
        diagnosisAge !== unknownDiagnosisAgeLabel &&
        (!/^\d+$/.test(diagnosisAge) ||
          Number(diagnosisAge) < 0 ||
          Number(diagnosisAge) > 120)
      )
    })

    if (invalidDiagnosisAge) {
      setError('Enter whole-number diagnosis ages between 0 and 120, or choose Unknown.')
      return
    }

    const familyConditions = getIllnessesFromConditions(familyConditionObjects)
    const familyDiagnosisAgeForSave = getEarliestDiagnosisAgeFromConditions(
      familyConditionObjects,
    )
    const existingMember = editingFamilyMemberId
      ? familyMembers.find((member) => member.id === editingFamilyMemberId)
      : null
    const relationshipType =
      familyRelationshipType ||
      existingMember?.relationshipType ||
      getRelationshipTypeFromLegacyRelationship({ relationship })
    const { id: stableMemberId, slotIndex } = getStableRelativeSaveIdentity({
      createFallbackId: createId,
      editingFamilyMemberId,
      existingMember,
      relationshipType,
    })
    const savedMember = {
      name: familyMemberName.trim(),
      relationship,
      relationshipType,
      slotIndex,
      illnesses: familyConditions,
      conditions: familyConditionObjects,
      earlyDiagnosis: familyConditionObjects.some(
        (condition) => Number(condition.diagnosisAge) < 50,
      ),
      diagnosisAge: familyDiagnosisAgeForSave,
      isPlaceholder: false,
    }
    const nextFamilyMembers = updateFamilyMembersWithSavedRelative({
      editingFamilyMemberId,
      familyMembers,
      savedMember,
      stableMemberId,
    })
    const nextProfileIllnesses =
      relationshipType === 'self'
        ? familyConditions.filter(
            (condition) =>
              !isNoIllness(condition) &&
              getIllnessKey(condition) !== getIllnessKey(unknownConditionLabel),
          )
        : profileIllnesses

    if (relationshipType === 'self') {
      setProfileIllnesses(nextProfileIllnesses)
    }

    setFamilyMembers(nextFamilyMembers)
    if (user) {
      setSaveStatus('saving')
    }

    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current)
    }

    const nextProfileState = getProfileStateSnapshot({
      activeLocation,
      activeView,
      accountProfile,
      accountSettingsOpen: isAccountSettingsOpen,
      completedDailyActionIds,
      completedMonthlyActionIds,
      completedWeeklyActionIds,
      dailyActions,
      dailyActionsDate,
      dailyGoals,
      dailyGoalsDate,
      editingFamilyMemberId: null,
      familyDiagnosisAge: '',
      familyEarlyDiagnosis: false,
      familyMemberName: '',
      familyMembers: nextFamilyMembers,
      familyStructure,
      familyStructureCompleted,
      goalCompletionHistory,
      habitProgress,
      lastGoalResetDate,
      locationMessage,
      locationStatus,
      monthlyActions,
      monthlyActionsMonth,
      preventionActionHistory,
      weeklyActions,
      weeklyActionsWeek,
      profileForm,
      profileHasUnlistedCondition,
      profileIllnessInput,
      profileIllnesses: nextProfileIllnesses,
      profileNoListedConditions,
      relationship: '',
      selectedIllnesses: [],
      userProfile,
    })

    if (user && hasLoadedCloudProfile && profileHydrated) {
      try {
        const saveResult = await profileSaveCoordinatorRef.current.save(
          user.id,
          nextProfileState,
        )

        if (saveResult.isLatest) {
          lastSavedProfileStateRef.current = serializeProfileState(nextProfileState)
          setSaveStatus('saved')
        }
      } catch {
        setSaveStatus('error')
        setError("Health history couldn't be saved. Please try again.")
        return
      }
    }

    setSuccessMessage('Health history saved.')
    setFamilyMemberName('')
    setRelationship('')
    setFamilyRelationshipMode('')
    setFamilyRelationshipType('')
    setSelectedIllnesses([])
    setFamilyConditionDetails({})
    resetFamilyConditionPickerPath()
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setFamilyEditorInitialSignature('')
    setShowFamilyEditorDiscardPrompt(false)
    setIsFamilyFormOpen(false)
    setError('')
  }

  function handleFamilyStructureChange(fieldId, rawValue) {
    setFamilyStructureDraft((currentStructure) => ({
      ...getNextFamilyStructureForInput({
        currentStructure,
        familyStructureFields,
        fieldId,
        rawValue,
      }),
    }))
    setFamilyStructure((currentStructure) => ({
      ...getNextFamilyStructureForInput({
        currentStructure,
        familyStructureFields,
        fieldId,
        rawValue,
      }),
    }))
  }

  async function saveFamilyStructureAndContinue(event) {
    event?.preventDefault()

    const normalizedStructure = sanitizeFamilyStructure(familyStructureDraft)
    const membersToRemove = getFamilyMembersToRemoveForStructureChange({
      familyMembers,
      familyStructureFields,
      normalizedStructure,
    })

    const membersWithHealthHistory = membersToRemove.filter(hasRelativeHealthHistory)

    if (membersWithHealthHistory.length > 0) {
      const names = membersWithHealthHistory
        .map((member) => formatRelationshipLabel(member))
        .join(', ')
      const confirmed = window.confirm(
        `Reducing your family structure will remove saved health history for ${names}. Continue?`,
      )

      if (!confirmed) {
        return
      }
    }

    let nextFamilyMembers = familyMembers

    if (membersToRemove.length > 0) {
      const removalIds = new Set(membersToRemove.map((member) => member.id))

      nextFamilyMembers = familyMembers.filter(
        (member) => !removalIds.has(member.id),
      )
      setFamilyMembers(nextFamilyMembers)
    }

    setFamilyStructure(normalizedStructure)
    setFamilyStructureDraft(normalizedStructure)
    setFamilyStructureCompleted(true)

    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current)
    }

    const nextProfileState = getProfileStateSnapshot({
      activeLocation,
      activeView,
      accountProfile,
      accountSettingsOpen: isAccountSettingsOpen,
      completedDailyActionIds,
      completedMonthlyActionIds,
      completedWeeklyActionIds,
      dailyActions,
      dailyActionsDate,
      dailyGoals,
      dailyGoalsDate,
      editingFamilyMemberId,
      familyDiagnosisAge,
      familyEarlyDiagnosis,
      familyMemberName,
      familyMembers: nextFamilyMembers,
      familyStructure: normalizedStructure,
      familyStructureCompleted: true,
      goalCompletionHistory,
      habitProgress,
      lastGoalResetDate,
      locationMessage,
      locationStatus,
      monthlyActions,
      monthlyActionsMonth,
      preventionActionHistory,
      weeklyActions,
      weeklyActionsWeek,
      profileForm,
      profileHasUnlistedCondition,
      profileIllnessInput,
      profileIllnesses,
      profileNoListedConditions,
      relationship,
      selectedIllnesses,
      userProfile,
    })

    if (user && hasLoadedCloudProfile && profileHydrated) {
      setSaveStatus('saving')

      try {
        const saveResult = await profileSaveCoordinatorRef.current.save(
          user.id,
          nextProfileState,
        )

        if (saveResult.isLatest) {
          lastSavedProfileStateRef.current = serializeProfileState(nextProfileState)
          setSaveStatus('saved')
        }
      } catch {
        lastSavedProfileStateRef.current = ''
        setSaveStatus('error')
        setError("Family structure couldn't be saved. Please try again.")
        return
      }
    }

    setSuccessMessage('Family structure saved.')
    setError('')
    startAssessmentTransition('family')
  }

  async function handleLogout() {
    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current)
    }

    if (user) {
      try {
        const clearedNavigationState = {
          ...currentProfileState,
          activeView: 'dashboard',
          accountSettingsOpen: false,
        }
        await profileSaveCoordinatorRef.current.save(user.id, clearedNavigationState)
        lastSavedProfileStateRef.current = serializeProfileState(clearedNavigationState)
      } catch {
        // Navigation memory cleanup should not block sign-out.
      }
    }

    setIsAccountMenuOpen(false)
    setIsAccountSettingsOpen(false)
    setIsPrivacyDataOpen(false)
    applySavedState(defaultSavedState, { openProfile: true })
    setHasLoadedCloudProfile(false)
    setProfileHydrated(false)
    setSaveStatus('idle')
    setShowDeviceImportPrompt(false)
    await supabase.auth.signOut()
  }

  function openAccountSettings() {
    setAccountDisplayNameInput(accountProfile.displayName)
    setIsAccountMenuOpen(false)
    setIsPrivacyDataOpen(false)
    setIsAccountSettingsOpen(true)
  }

  function openPrivacyData() {
    setIsAccountMenuOpen(false)
    setIsAccountSettingsOpen(false)
    setIsPrivacyDataOpen(true)
  }

  function exportHealthData() {
    const exportData = buildHealthDataExport({
      account: {
        displayName: accountDisplayName,
        email: accountEmail,
      },
      profileState: currentProfileState,
    })
    const exportBlob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const downloadUrl = URL.createObjectURL(exportBlob)
    const downloadLink = document.createElement('a')

    downloadLink.href = downloadUrl
    downloadLink.download = `family-health-data-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    URL.revokeObjectURL(downloadUrl)
    setSuccessMessage('Your health data export is ready.')
  }

  async function saveAccountSettings(event) {
    event.preventDefault()
    const nextAccountProfile = {
      ...accountProfile,
      displayName: accountDisplayNameInput.trim(),
    }

    setAccountProfile(nextAccountProfile)

    if (user && hasLoadedCloudProfile && profileHydrated) {
      if (saveDebounceRef.current) {
        window.clearTimeout(saveDebounceRef.current)
        saveDebounceRef.current = null
      }

      const nextProfileState = {
        ...currentProfileState,
        accountProfile: nextAccountProfile,
      }
      const serializedNextProfileState = serializeProfileState(nextProfileState)

      latestProfileStateRef.current = serializedNextProfileState
      setSaveStatus('saving')

      try {
        const saveResult = await profileSaveCoordinatorRef.current.save(
          user.id,
          nextProfileState,
        )

        if (saveResult.isLatest) {
          lastSavedProfileStateRef.current = serializedNextProfileState
          setSaveStatus('saved')
        }
      } catch {
        setSaveStatus('error')
        setError("Your account settings couldn't be saved. Please try again.")
        return
      }
    }

    setSuccessMessage('Account settings saved.')
    setIsAccountSettingsOpen(false)
  }

  async function importDeviceProfile() {
    const normalizedDeviceState = normalizeSavedState(deviceSavedAppState)
    const importedProfileState = getProfileStateSnapshot({
      ...normalizedDeviceState,
      activeView: 'dashboard',
    })

    applySavedState(importedProfileState, { openProfile: true })
    setShowDeviceImportPrompt(false)
    setSaveStatus('saving')

    try {
      const saveResult = await profileSaveCoordinatorRef.current.save(
        user.id,
        importedProfileState,
      )

      if (saveResult.isLatest) {
        lastSavedProfileStateRef.current = serializeProfileState(importedProfileState)
        setSaveStatus('saved')
      }
      setSuccessMessage('Device profile imported to your account.')
    } catch {
      lastSavedProfileStateRef.current = ''
      setSaveStatus('error')
      setError('Device profile imported here, but cloud save failed.')
    }
  }

  function startFreshCloudProfile() {
    applySavedState(defaultSavedState, { openProfile: true })
    setShowDeviceImportPrompt(false)
    setSuccessMessage('Starting with a fresh account profile.')
  }

  function handleResetHealthProfile() {
    setIsResetConfirmationOpen(true)
  }

  async function confirmResetHealthProfile() {

    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current)
      saveDebounceRef.current = null
    }

    if (user) {
      setSaveStatus('saving')

      try {
        await profileSaveCoordinatorRef.current.delete(user.id)
      } catch {
        setError('Could not clear the cloud profile. Please try again.')
        setSaveStatus('error')
        return
      }
    }

    clearSavedAppState()
    applySavedState(defaultSavedState, { openProfile: true })
    setIsResetConfirmationOpen(false)
    setIsPrivacyDataOpen(false)
    setSaveStatus('idle')
    setSuccessMessage('Your saved health profile was reset. Your account is still active.')
  }

  async function goToNextStep() {
    if (activeView === 'structure') {
      saveFamilyStructureAndContinue()
      return
    }

    if (activeView === 'family' && !hasRequiredParentInformation) {
      setNavigationNotice({
        id: `profile-lock-${Date.now()}`,
        message: getAssessmentReminderMessage('family'),
      })
      return
    }

    if (activeView === 'health' || activeView === 'lifestyle') {
      const didSave = await saveProfileData('Progress saved.')

      if (!didSave) {
        return
      }
    }

    const access = getAssessmentNavigationAccess({
      targetView: continueTarget,
      ...assessmentCompletionState,
    })

    if (!access.allowed) {
      setNavigationNotice({
        id: `profile-lock-${Date.now()}`,
        message: access.message,
      })

      if (
        access.firstIncompleteView &&
        access.firstIncompleteView !== activeView
      ) {
        startAssessmentTransition(access.firstIncompleteView)
      }
      return
    }

    startAssessmentTransition(continueTarget)
  }

  function goToPreviousStep() {
    if (previousWorkflowStep) {
      changeView(previousWorkflowStep.id)
    }
  }

  function togglePreventionAction(goalId, timeframe) {
    if (timeframe === 'week') {
      setCompletedWeeklyActionIds((currentIds) => {
        const nextIds = currentIds.includes(goalId)
          ? currentIds.filter((id) => id !== goalId)
          : [...currentIds, goalId]

        setHabitProgress((currentProgress) => ({
          ...currentProgress,
          [goalId]: nextIds.includes(goalId),
        }))

        const action = weeklyActions.find((item) => item.id === goalId)

        if (action && weeklyActionsWeek) {
          setPreventionActionHistory((currentHistory) =>
            mergeActionHistoryEntries(
              currentHistory,
              buildActionHistoryEntries({
                actions: [action],
                completedActionIds: nextIds,
                period: 'week',
                periodKey: weeklyActionsWeek,
              }),
            ),
          )
        }

        return nextIds
      })
      return
    }

    if (timeframe === 'month') {
      setCompletedMonthlyActionIds((currentIds) => {
        const nextIds = currentIds.includes(goalId)
          ? currentIds.filter((id) => id !== goalId)
          : [...currentIds, goalId]

        setHabitProgress((currentProgress) => ({
          ...currentProgress,
          [goalId]: nextIds.includes(goalId),
        }))

        const action = monthlyActions.find((item) => item.id === goalId)

        if (action && monthlyActionsMonth) {
          setPreventionActionHistory((currentHistory) =>
            mergeActionHistoryEntries(
              currentHistory,
              buildActionHistoryEntries({
                actions: [action],
                completedActionIds: nextIds,
                period: 'month',
                periodKey: monthlyActionsMonth,
              }),
            ),
          )
        }

        return nextIds
      })
      return
    }

    setCompletedDailyActionIds((currentIds) => {
      const nextIds = currentIds.includes(goalId)
        ? currentIds.filter((id) => id !== goalId)
        : [...currentIds, goalId]

      setHabitProgress((currentProgress) => ({
        ...currentProgress,
        [goalId]: nextIds.includes(goalId),
      }))

      const today = getLocalDateKey()

      const action = dailyActions.find((item) => item.id === goalId)

      if (action && dailyActionsDate) {
        setPreventionActionHistory((currentHistory) =>
          mergeActionHistoryEntries(
            currentHistory,
            buildActionHistoryEntries({
              actions: [action],
              completedActionIds: nextIds,
              period: 'today',
              periodKey: dailyActionsDate,
            }),
          ),
        )
      }

      setGoalCompletionHistory((currentHistory) => {
        if (nextIds.length > 0) {
          return {
            ...currentHistory,
            [today]: nextIds,
          }
        }

        const remainingHistory = { ...currentHistory }
        delete remainingHistory[today]
        return remainingHistory
      })

      return nextIds
    })
  }

  function toggleActionEvidence(goalId) {
    setExpandedActionEvidence((currentState) => ({
      ...currentState,
      [goalId]: !currentState[goalId],
    }))
  }

  function renderPreventionActionCard(goal, timeframe, completedActionSet) {
    const evidenceDetails = buildRecommendationEvidence(goal)
    const isEvidenceExpanded = Boolean(expandedActionEvidence[goal.id])

    return (
      <li className="prevention-action-card" key={goal.id}>
        <label className="habit-check compact">
          <input
            type="checkbox"
            checked={completedActionSet.has(goal.id)}
            onChange={() => togglePreventionAction(goal.id, timeframe)}
          />
          <span>
            <strong>{goal.label}</strong>
          </span>
        </label>

        <div className="prevention-action-card-controls">
          {goal.resourceNeeded ? (
            <button
              className="secondary-action goal-resource-action"
              type="button"
              onClick={() => handleGoalPrimaryAction(goal)}
            >
              {goal.primaryActionLabel}
              <span aria-hidden="true">→</span>
            </button>
          ) : null}

          {evidenceDetails ? (
            <button
              className="text-action evidence-toggle"
              type="button"
              onClick={() => toggleActionEvidence(goal.id)}
              aria-expanded={isEvidenceExpanded}
            >
              Why this?
              <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </div>

        {evidenceDetails && isEvidenceExpanded ? (
          <div className="recommendation-evidence-panel">
            <div>
              <h3>Why this matters</h3>
              <p>{evidenceDetails.whyThisMatters}</p>
            </div>
            <div>
              <h3>Why it's in your plan</h3>
              <p>{evidenceDetails.whyInPlan}</p>
            </div>
            <div>
              <h3>Source</h3>
              <p>
                {evidenceDetails.evidence.sourceOrganization} ·{' '}
                {evidenceDetails.evidence.sourceTitle}
              </p>
              <a
                className="text-action"
                href={evidenceDetails.evidence.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Source <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        ) : null}
      </li>
    )
  }

  if (isAuthLoading) {
    return <AssessmentLoadingScreen />
  }

  if (!user || isPasswordRecovery) {
    return <AuthFlow />
  }

  if (cloudProfileStatus === 'loading') {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-live="polite">
          <div className="auth-heading">
            <span className="brand-mark" aria-hidden="true">
              +
            </span>
            <div>
              <h1>Loading your profile</h1>
              <p>Preparing your signed-in family health workspace.</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (cloudProfileStatus === 'error') {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <div className="auth-heading">
            <span className="brand-mark" aria-hidden="true">
              +
            </span>
            <div>
              <h1>Profile unavailable</h1>
              <p>{cloudProfileError}</p>
            </div>
          </div>
          <button className="secondary-action" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </section>
      </main>
    )
  }

  if (isAssessmentLoading) {
    return <AssessmentLoadingScreen />
  }

  return (
    <div className="app-layout">
      <aside
        className={`app-sidebar${isNavOpen ? ' open' : ''}`}
        id="app-sidebar"
        aria-label="Family health navigation"
      >
        <button
          className="sidebar-brand"
          type="button"
          aria-label="Go to Home"
          onClick={() => changeView('dashboard')}
        >
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <div>
            <strong>Family Health</strong>
            <span>Signed-in profile</span>
          </div>
        </button>

        <nav className="view-tabs" aria-label="Family health views">
          {viewTabs.map((tab) => {
            const access = getAssessmentNavigationAccess({
              targetView: tab.id,
              ...assessmentCompletionState,
            })

            return (
              <button
                aria-disabled={!access.allowed}
                className={`${activeView === tab.id ? 'view-tab active' : 'view-tab'}${
                  access.allowed ? '' : ' prerequisite-locked'
                }`}
                key={tab.id}
                type="button"
                onClick={() => changeView(tab.id)}
              >
                <span className="nav-icon" aria-hidden="true">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        <section className="privacy-banner" aria-label="Privacy">
          <div>
            <p className="eyebrow">Privacy</p>
            <p>
              Your information stays private and is never sold for advertising.
              The information in this app is educational and not a medical
              diagnosis.
            </p>
          </div>
          <button className="danger-action" type="button" onClick={handleResetHealthProfile}>
            Reset Health Profile
          </button>
        </section>
      </aside>

      <main
        className={
          activeView === 'dashboard'
            ? 'app-shell dashboard-shell'
            : 'app-shell inner-shell'
        }
      >
        <header className="app-top-header">
          <button
            className="mobile-menu-button"
            type="button"
            aria-controls="app-sidebar"
            aria-expanded={isNavOpen}
            onClick={() => setIsNavOpen((current) => !current)}
          >
            <span aria-hidden="true">☰</span>
            Menu
          </button>

          <div className="account-menu-shell">
            {saveStatus !== 'idle' ? (
              <span
                className={`save-status save-status-${saveStatus}`}
                role="status"
                aria-live="polite"
              >
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : saveStatus === 'saved'
                    ? 'Saved'
                    : "Couldn't save"}
              </span>
            ) : null}
            <button
              className="account-control"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              onClick={() => setIsAccountMenuOpen((current) => !current)}
            >
              <span className="account-avatar" aria-hidden="true">
                {shouldShowAccountAvatarImage ? (
                  <img
                    src={accountAvatarUrl}
                    alt=""
                    onError={() => setFailedAccountAvatarUrl(accountAvatarUrl)}
                  />
                ) : (
                  <span className="account-avatar-initials">{accountInitials}</span>
                )}
              </span>
              <span className="account-control-copy">
                <strong>{accountDisplayName || 'Account'}</strong>
              </span>
              <span className="account-chevron" aria-hidden="true">⌄</span>
            </button>

            {isAccountMenuOpen ? (
              <div className="account-menu" role="menu">
                <div className="account-menu-identity">
                  <span className="account-avatar" aria-hidden="true">
                    {shouldShowAccountAvatarImage ? (
                      <img
                        src={accountAvatarUrl}
                        alt=""
                        onError={() => setFailedAccountAvatarUrl(accountAvatarUrl)}
                      />
                    ) : (
                      <span className="account-avatar-initials">{accountInitials}</span>
                    )}
                  </span>
                  <span>
                    <strong>{accountDisplayName || 'Account'}</strong>
                    {accountEmail ? (
                      <span className="account-menu-email">{accountEmail}</span>
                    ) : null}
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActiveView('dashboard')
                    setIsAccountMenuOpen(false)
                  }}
                >
                  Home
                </button>
                <button type="button" role="menuitem" onClick={openAccountSettings}>
                  My Account
                </button>
                <button type="button" role="menuitem" onClick={openPrivacyData}>
                  Privacy &amp; Data
                </button>
                <button type="button" role="menuitem" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {activeView === 'structure' ? (
          <header className="page-intro">
            <h1>Your Family Structure</h1>
            <p>
              Enter the number of relatives that apply to you. Leave a field blank
              if you have none.
            </p>
          </header>
        ) : null}

        {activeView === 'family' && !isFamilyFormOpen ? (
          <header className="page-intro">
            <h1>Your Family Health Tree</h1>
            <p>
              Select a family member to add or update their health history.
            </p>
          </header>
        ) : null}

        {activeView === 'health' ? (
          <header className="page-intro">
            <h1>Your Current Health</h1>
            <p>
              Share current health information to help personalize educational
              health themes.
            </p>
          </header>
        ) : null}

        {activeView === 'lifestyle' ? (
          <header className="page-intro">
            <h1>Your Everyday Habits</h1>
            <p>
              Share a few routines so your prevention plan feels more personal.
            </p>
          </header>
        ) : null}

        {activeView === 'coach' ? (
          <header className="page-intro post-assessment-page-intro">
            <h1>Your Prevention Plan</h1>
            <p>
              What you can do next
            </p>
          </header>
        ) : null}

        {activeView === 'insights' ? (
          <header className="page-intro post-assessment-page-intro">
            <h1>Your Health Profile</h1>
            <p>
              What we learned about you
            </p>
          </header>
        ) : null}

        {activeAssessmentGuidance ? (
          <div
            className="assessment-guidance-banner"
            id={`assessment-section-${activeAssessmentGuidance.viewId}`}
            role="status"
          >
            <span>{activeAssessmentGuidance.message}</span>
            <button
              type="button"
              onClick={() => setAssessmentGuidance(null)}
              aria-label="Dismiss reminder"
            >
              ×
            </button>
          </div>
        ) : null}

        {navigationNotice ? (
          <div className="navigation-lock-toast" role="status" aria-live="polite">
            <span>
              <strong>Complete your profile first.</strong>
              {navigationNotice.message}
            </span>
            <button
              type="button"
              onClick={() => setNavigationNotice(null)}
              aria-label="Dismiss profile reminder"
            >
              ×
            </button>
          </div>
        ) : null}

        {successMessage ? (
          <p className="flow-message success" role="status">
            {successMessage}
          </p>
        ) : null}

        {error ? (
          <p className="flow-message error" role="alert">
            {error}
          </p>
        ) : null}

        {showDeviceImportPrompt ? (
          <section className="import-profile-card" aria-labelledby="import-profile-title">
            <div>
              <h2 id="import-profile-title">Import saved device profile?</h2>
              <p>
                We found health-profile information saved on this device. Would
                you like to add it to your account?
              </p>
            </div>
            <div className="import-profile-actions">
              <button
                className="primary-action"
                type="button"
                onClick={importDeviceProfile}
              >
                Import profile
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={startFreshCloudProfile}
              >
                Start fresh
              </button>
            </div>
          </section>
        ) : null}

      {activeView === 'dashboard' ? (
        <section className="dashboard-panel" aria-labelledby="dashboard-title">
          {isAssessmentComplete ? (
            <div className="dashboard-welcome-card">
              <div>
                <p className="eyebrow">Home</p>
                <h1 className="dashboard-greeting" id="dashboard-title">
                  {dashboardGreeting}
                </h1>
                <p className="dashboard-welcome-description">
                  Keep building a prevention plan shaped by your family health, everyday habits, and daily focus steps.
                </p>
              </div>
            </div>
          ) : null}

          {!isAssessmentComplete ? (
            <section className="dashboard-assessment-card">
              <div>
                <p className="eyebrow">Profile Progress</p>
                <h2 id="dashboard-title">{assessmentUnlockTitle}</h2>
                <p>{assessmentUnlockDescription}</p>
                <div className="profile-progress-summary" aria-label="Profile progress">
                  <span>Profile progress</span>
                  <strong>{assessmentCompletionPercent}% ready</strong>
                  <ProgressBar
                    label="Profile completion progress"
                    value={assessmentCompletionPercent}
                  />
                </div>
              </div>
              <button
                className="primary-action"
                type="button"
                onClick={beginAssessmentWithLoading}
                disabled={isAssessmentLoading}
              >
                Continue <span aria-hidden="true">→</span>
              </button>
            </section>
          ) : null}

          {isAssessmentComplete ? (
            <>
              <section className="profile-overview-section" aria-labelledby="profile-overview-title">
                <h2 id="profile-overview-title">Health Profile</h2>
                <div className="dashboard-summary-grid">
                  {dashboardSummaryCards.map((card) => (
                    <article
                      className={`dashboard-summary-card${
                        Number.isFinite(card.progressValue) ? ' has-progress' : ''
                      }`}
                      key={card.label}
                    >
                      <span className="card-topline">
                        <span className="card-icon" aria-hidden="true">
                          {card.icon}
                        </span>
                        <span>{card.label}</span>
                      </span>
                      <strong>{card.value}</strong>
                      <p>{card.detail}</p>
                      {Number.isFinite(card.progressValue) ? (
                        <div className="dashboard-summary-progress">
                          <ProgressBar
                            label={`${card.label}: ${card.value}`}
                            value={card.progressValue}
                          />
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>

              <div className="dashboard-content-grid">
                <section className="insight-panel profile-summary-panel">
                  <h2>Profile Summary</h2>
                  <div className="profile-summary-content">
                    {dashboardProfileSummary.focusAreas.length > 0 ? (
                      <div className="profile-summary-group">
                        <p className="profile-summary-label">Areas to focus on</p>
                        <div className="profile-summary-pills">
                          {dashboardProfileSummary.focusAreas.map((area) => (
                            <span className="profile-summary-pill" key={area}>
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {dashboardProfileSummary.strongHabits.length > 0 ? (
                      <div className="profile-summary-group">
                        <p className="profile-summary-label">Strong habits</p>
                        <ul className="profile-summary-habits">
                          {dashboardProfileSummary.strongHabits.map((habit) => (
                            <li key={habit}>
                              <span aria-hidden="true">✓</span>
                              <span>{habit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <button
                    className="text-action profile-summary-link"
                    type="button"
                    onClick={() => changeView('insights')}
                  >
                    View Your Health Profile <span aria-hidden="true">→</span>
                  </button>
                </section>

                <section className="insight-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">Priorities</p>
                      <h2>Focus Areas</h2>
                    </div>
                  </div>

                  <ul className="dashboard-attention-list">
                    {preventionPlan.topPriorities.length > 0 ? (
                      preventionPlan.topPriorities.map((priority) => (
                        <li key={priority.id}>
                          <button
                            className="attention-area-button"
                            type="button"
                            onClick={() => changeView('coach')}
                          >
                            <span className="category-name-with-icon">
                              <span aria-hidden="true">{priority.icon}</span>
                              <span>{priority.title}</span>
                            </span>
                            <span className="priority-recommendation">
                              {priority.detail}
                            </span>
                            <strong>View suggestions →</strong>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="category-empty-note">
                        Add a little more information to reveal personalized focus
                        areas.
                      </li>
                    )}
                  </ul>
                </section>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeView === 'health' ? (
        <section
          className={getAssessmentSectionClass('profile-panel', 'health')}
          aria-labelledby="profile-title"
        >
          <div className="current-health-heading">
            <h2 className="panel-title" id="profile-title">About You</h2>
          </div>

          <form className="profile-form" onSubmit={saveProfile} noValidate>
            <section className="profile-form-section">
              <div>
                <p className="helper-text">
                  These details help personalize your educational prevention
                  insights.
                </p>
              </div>

              <div className="profile-grid">
                <label className="field-group" htmlFor="profile-name">
                  Name
                  <input
                    id="profile-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Your name"
                  />
                </label>

                <label className="field-group" htmlFor="profile-age-range">
                  Age range
                  <select
                    id="profile-age-range"
                    value={profileForm.ageRange}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        ageRange: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {ageRangeOptions.map((ageRangeOption) => (
                      <option key={ageRangeOption} value={ageRangeOption}>
                        {ageRangeOption}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group" htmlFor="profile-sex">
                  Sex at birth
                  <select
                    id="profile-sex"
                    value={profileForm.sexAtBirth}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        sexAtBirth: event.target.value,
                        sex: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {sexAtBirthOptions.map((sexOption) => (
                      <option key={sexOption} value={sexOption}>
                        {sexOption}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <section className="body-measure-card" aria-labelledby="body-measure-title">
                <div className="body-measure-heading">
                  <h3 id="body-measure-title">Body Details</h3>
                  <p className="body-measure-note">
                    This information is optional and can be updated at any time.
                  </p>
                </div>

                <div className="body-measure-grid">
                  <fieldset className="height-fieldset">
                    <legend>Height</legend>
                    <div className="height-input-row">
                      <label className="field-group" htmlFor="profile-height-feet">
                        Feet
                        <div className="unit-input">
                          <input
                            id="profile-height-feet"
                            type="number"
                            min="3"
                            max="8"
                            value={profileForm.heightFeet}
                            onChange={(event) =>
                              setProfileForm((currentProfile) => ({
                                ...currentProfile,
                                heightFeet: event.target.value,
                              }))
                            }
                          />
                          <span>ft</span>
                        </div>
                      </label>

                      <label className="field-group" htmlFor="profile-height-inches">
                        Inches
                        <div className="unit-input">
                          <input
                            id="profile-height-inches"
                            type="number"
                            min="0"
                            max="11"
                            value={profileForm.heightInches}
                            onChange={(event) =>
                              setProfileForm((currentProfile) => ({
                                ...currentProfile,
                                heightInches: event.target.value,
                              }))
                            }
                          />
                          <span>in</span>
                        </div>
                      </label>
                    </div>
                  </fieldset>

                  <label className="field-group weight-field" htmlFor="profile-weight">
                    Weight
                    <div className="unit-input">
                      <input
                        id="profile-weight"
                        type="number"
                        min="1"
                        value={profileForm.weight}
                        onChange={(event) =>
                          setProfileForm((currentProfile) => ({
                            ...currentProfile,
                            weight: event.target.value,
                          }))
                        }
                      />
                      <span>lb</span>
                    </div>
                  </label>

                  <div className="bmi-card" aria-live="polite">
                    <span>Estimated BMI</span>
                    <strong>{profileBmi || '--'}</strong>
                    <p>{getBmiCategory(profileBmi)}</p>
                  </div>
                </div>

                <p className="bmi-note">
                  This estimate is optional and is only used to personalize
                  educational insights.
                </p>
              </section>
            </section>

            <section className="profile-form-section">
              <div>
                <h2>Health Information</h2>
                <p className="helper-text">
                  Select any current health information that applies.
                </p>
              </div>

              <div className="lifestyle-grid">
                <label className="field-group" htmlFor="profile-known-bp">
                  Have you been told you have high blood pressure?
                  <select
                    id="profile-known-bp"
                    value={profileForm.knownHighBloodPressure}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        knownHighBloodPressure: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {yesNoUnknownOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group" htmlFor="profile-known-cholesterol">
                  Have you been told you have high cholesterol?
                  <select
                    id="profile-known-cholesterol"
                    value={profileForm.knownHighCholesterol}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        knownHighCholesterol: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {yesNoUnknownOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group" htmlFor="profile-diabetes-status">
                  Prediabetes or diabetes
                  <select
                    id="profile-diabetes-status"
                    value={profileForm.diabetesStatus}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        diabetesStatus: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {diabetesStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <fieldset className="illness-fieldset profile-form-section">
              <legend>Health conditions</legend>
              <IllnessPicker
                disabled={profileNoListedConditions}
                hasUnlistedCondition={profileHasUnlistedCondition}
                inputId="profile-illness-search"
                inputValue={profileIllnessInput}
                noListedConditions={profileNoListedConditions}
                onInputChange={setProfileIllnessInput}
                onInputClear={() => setProfileIllnessInput('')}
                onAddIllness={addProfileIllness}
                onOpenConditionDetails={openConditionDetails}
                onRemoveIllness={removeProfileIllness}
                onToggleNoListedConditions={toggleProfileNoListedConditions}
                onToggleUnlistedCondition={toggleProfileHasUnlistedCondition}
                selectedIllnesses={profileIllnesses}
              />
            </fieldset>

            <p className="profile-disclaimer">
              Your answers help personalize educational insights. You can update
              them anytime.
            </p>

            <button className="primary-action" type="submit">
              Save my profile <span aria-hidden="true">→</span>
            </button>
          </form>

          {userProfile ? (
            <div className="profile-summary" aria-live="polite">
              <strong>{userProfile.name || 'Self'}</strong>
              <span>
                {[userProfile.ageRange, userProfile.sexAtBirth || userProfile.sex]
                  .filter(Boolean)
                  .join(' · ') || 'Profile saved'}
              </span>
              {userProfile.bmi ? (
                <span>BMI {userProfile.bmi} · {getBmiCategory(userProfile.bmi)}</span>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeView === 'structure' ? (
        <section
          className={getAssessmentSectionClass(
            'family-structure-panel',
            'structure',
          )}
          aria-labelledby="family-structure-title"
        >
          <div className="blood-relative-notice" role="note">
            <span className="info-icon" aria-hidden="true">i</span>
            <strong>
              We collect information only for blood relatives, not household members, step-relatives, or spouses unless they are related by blood.
            </strong>
          </div>

          <form className="family-structure-card" onSubmit={saveFamilyStructureAndContinue}>
            <div className="generation-heading">
              <div>
                <h2 id="family-structure-title">Your Family Structure</h2>
                <p>
                  Enter the number of relatives that apply to you. Leave a field
                  blank if you have none.
                </p>
              </div>
            </div>

            <div className="family-structure-group-grid">
              {familyStructureGroups.map((group) => (
                <section
                  className="family-structure-group"
                  key={group.id}
                  aria-labelledby={`family-structure-${group.id}`}
                >
                  <h3 id={`family-structure-${group.id}`}>{group.title}</h3>
                  <div className="family-structure-grid">
                    {familyStructureFields
                      .filter((field) => group.fieldIds.includes(field.id))
                      .map((field) => (
                        <label
                          className="field-group"
                          htmlFor={`family-count-${field.id}`}
                          key={field.id}
                        >
                          {field.label}
                          {field.supportingLabel ? (
                            <span className="field-supporting-label">
                              {field.supportingLabel}
                            </span>
                          ) : null}
                          <input
                            id={`family-count-${field.id}`}
                            type="number"
                            min="0"
                            max="20"
                            step="1"
                            inputMode="numeric"
                            value={familyStructureDraft[field.id]}
                            onChange={(event) =>
                              handleFamilyStructureChange(field.id, event.target.value)
                            }
                            placeholder="Optional"
                          />
                        </label>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </form>
        </section>
      ) : null}

      {activeView === 'family' ? (
        <>
          <section
            className={getAssessmentSectionClass(
              'family-tree-panel family-pedigree-panel',
              'family',
            )}
          >
            <div className="family-pedigree-layout">
              <section
                className="family-pedigree-card"
                aria-labelledby="family-pedigree-title"
              >
                <div className="pedigree-canvas">
                  <h2 className="visually-hidden" id="family-pedigree-title">
                    Pedigree View
                  </h2>

                  {!hasAnyFamilyRelativeHealthHistory ? (
                    <div className="pedigree-onboarding-cue" role="note">
                      <span aria-hidden="true">↙</span>
                      Start by selecting a parent, grandparent, sibling, or other relative.
                    </div>
                  ) : null}

                  <PedigreeTree
                    children={childMembers}
                    father={getCoreRelative('father')}
                    maternalGrandparents={maternalGrandparentMembers}
                    maternalRelatives={motherBranchMembers}
                    mother={getCoreRelative('mother')}
                    paternalGrandparents={paternalGrandparentMembers}
                    paternalRelatives={fatherBranchMembers}
                    renderNode={renderPedigreeNode}
                    selfMember={selfTreeNode}
                    siblings={userSiblingBranchMembers}
                  />
                </div>
              </section>
            </div>

            <div className="blood-relative-notice family-tree-note" role="note">
              <span className="info-icon" aria-hidden="true">i</span>
              <strong>
                We collect information only for blood relatives, not household members, step-relatives, or spouses unless they are related by blood.
              </strong>
            </div>

            <div className="family-grid-privacy">
              <strong>
                Your information stays private and is securely linked to your
                account.
              </strong>
            </div>
          </section>

          {isFamilyFormOpen ? (
            <div className="family-form-backdrop" role="presentation">
              <aside
                className="family-form-drawer"
                aria-labelledby="form-title"
                aria-modal="true"
                role="dialog"
              >
                <div className="family-form-drawer-header">
                  <div>
                    <button
                      className="family-editor-back"
                      type="button"
                      onClick={closeFamilyForm}
                    >
                      ← Back to Family Health Tree
                    </button>
                    <h2 id="form-title">Update Health History</h2>
                    <p>{familyFormContextLabel}</p>
                  </div>
                  <button
                    className="remove-button"
                    type="button"
                    onClick={closeFamilyForm}
                    aria-label="Close family member form"
                  >
                    &times;
                  </button>
                </div>

                <form className="family-form" onSubmit={addFamilyMember} noValidate>
                  <label className="field-group" htmlFor="family-member-name">
                    <span className="field-label-row">
                      Name or nickname
                      <span>Optional</span>
                    </span>
                    <input
                      id="family-member-name"
                      type="text"
                      value={familyMemberName}
                      onChange={(event) => setFamilyMemberName(event.target.value)}
                      placeholder="Optional"
                    />
                  </label>

                  <fieldset className="illness-fieldset family-health-picker">
                    <legend>Health History</legend>
                    <div className="guided-condition-picker">
                      <div
                        className="condition-picker-progress"
                        aria-label="Condition picker progress"
                      >
                        <span
                          className={activeFamilyConditionGroup ? 'complete' : 'active'}
                        >
                          Category
                        </span>
                        <span
                          className={
                            pendingFamilyCondition
                              ? 'complete'
                              : activeFamilyConditionGroup
                                ? 'active'
                                : ''
                          }
                        >
                          Condition
                        </span>
                      </div>

                      {activeFamilyConditionGroup ? (
                        <button
                          className="condition-picker-back"
                          type="button"
                          onClick={goBackFamilyConditionPicker}
                        >
                          ← Back
                        </button>
                      ) : null}

                      {!activeConditionGroup ? (
                        <section
                          className="condition-picker-step"
                          aria-labelledby="condition-category-title"
                        >
                          <h3 id="condition-category-title">Choose a health category</h3>
                          <label
                            className="field-group condition-search-field"
                            htmlFor="family-condition-search"
                          >
                            Search conditions
                            <input
                              id="family-condition-search"
                              type="search"
                              value={familyConditionSearchInput}
                              onChange={(event) => {
                                setFamilyConditionSearchInput(event.target.value)
                                setError('')
                              }}
                              placeholder="Try hypertension or high blood pressure"
                              autoComplete="off"
                            />
                          </label>

                          {familyConditionSearchInput.trim() ? (
                            <div
                              className="condition-search-results"
                              aria-live="polite"
                            >
                              {familyConditionSearchResults.length > 0 ? (
                                familyConditionSearchResults.map((result) => {
                                  const isAlreadyAdded = selectedIllnesses.some(
                                    (illness) =>
                                      getIllnessKey(illness) ===
                                      getIllnessKey(result.condition),
                                  )

                                  return (
                                    <button
                                      className="condition-row-option"
                                      disabled={isAlreadyAdded}
                                      key={`${result.groupId}-${result.condition}`}
                                      type="button"
                                      onClick={() =>
                                        selectFamilyConditionSearchResult(result)
                                      }
                                    >
                                      <span>{result.condition}</span>
                                      <small>
                                        {isAlreadyAdded
                                          ? '✓ Already added'
                                          : result.groupLabel}
                                      </small>
                                    </button>
                                  )
                                })
                              ) : (
                                <p className="condition-search-empty">
                                  No matching condition is available. Try another
                                  search term or select Unknown.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="condition-broad-grid">
                              {guidedFamilyConditionGroups.map((group) => (
                                <button
                                  className="condition-broad-card"
                                  key={group.id}
                                  type="button"
                                  onClick={() => selectFamilyConditionGroup(group.id)}
                                >
                                  <span>{group.label}</span>
                                  <small>{group.description}</small>
                                </button>
                              ))}
                            </div>
                          )}
                        </section>
                      ) : null}

                      {activeConditionGroup && !pendingFamilyCondition ? (
                        <section
                          className="condition-picker-step"
                          aria-labelledby="specific-condition-title"
                        >
                          <p className="condition-path-label">
                            {activeConditionGroup.label}
                          </p>
                          <h3 id="specific-condition-title">Choose a condition</h3>
                          <div className="condition-row-list">
                            {activeConditionGroup.conditions.map((condition) => {
                              const isAlreadyAdded = selectedIllnesses.some(
                                (illness) =>
                                  getIllnessKey(illness) === getIllnessKey(condition),
                              )
                              const conditionLabel =
                                getIllnessKey(condition) ===
                                getIllnessKey(unknownConditionLabel)
                                  ? 'Information unavailable'
                                  : getDisplayConditionName(condition)
                              const isPendingCondition =
                                pendingFamilyCondition &&
                                getIllnessKey(pendingFamilyCondition) ===
                                  getIllnessKey(condition)

                              return (
                                <button
                                  className={
                                    [
                                      'condition-row-option',
                                      isAlreadyAdded ? 'already-added' : '',
                                      isPendingCondition ? 'selected' : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' ')
                                  }
                                  disabled={isAlreadyAdded}
                                  key={condition}
                                  type="button"
                                  onClick={() => selectPendingFamilyCondition(condition)}
                                >
                                  <span>
                                    {isPendingCondition ? '✓ ' : ''}
                                    {conditionLabel}
                                  </span>
                                  {isAlreadyAdded ? (
                                    <small>✓ Already added</small>
                                  ) : null}
                                </button>
                              )
                            })}
                          </div>
                        </section>
                      ) : null}

                      {pendingFamilyCondition ? (
                        <section
                          className="condition-picker-step condition-add-step"
                          aria-labelledby="condition-add-title"
                        >
                          <p className="condition-path-label">
                            {activeConditionGroup.label}
                          </p>
                          <h3 id="condition-add-title">
                            {getIllnessKey(pendingFamilyCondition) ===
                            getIllnessKey(unknownConditionLabel)
                              ? 'Information unavailable'
                              : getDisplayConditionName(pendingFamilyCondition)}
                          </h3>
                          {getIllnessKey(pendingFamilyCondition) !==
                          getIllnessKey(unknownConditionLabel) ? (
                            <label
                              className="field-group condition-age-field"
                              htmlFor="pending-diagnosis-age"
                            >
                              Age at Diagnosis (Optional)
                              <input
                                id="pending-diagnosis-age"
                                type="number"
                                min="0"
                                max="120"
                                step="1"
                                inputMode="numeric"
                                value={pendingFamilyDiagnosisAge}
                                onChange={(event) =>
                                  setPendingFamilyDiagnosisAge(event.target.value)
                                }
                                placeholder="Enter approximate age"
                              />
                              <span className="helper-text">
                                Leave blank if unknown.
                              </span>
                            </label>
                          ) : null}
                          <button
                            className="primary-action condition-add-button"
                            type="button"
                            disabled={pendingConditionAlreadyAdded}
                            onClick={addPendingFamilyCondition}
                          >
                            {pendingConditionAlreadyAdded
                              ? 'Already Added'
                              : 'Add Condition'}{' '}
                            <span aria-hidden="true">→</span>
                          </button>
                        </section>
                      ) : null}
                    </div>
                  </fieldset>

                  {selectedFamilyConditionSummary.length > 0 ? (
                    <section
                      className="selected-conditions-summary"
                      aria-labelledby="selected-conditions-title"
                    >
                      <h3 id="selected-conditions-title">Your Added Conditions</h3>
                      <ul>
                        {selectedFamilyConditionSummary.map((condition) => (
                          <li key={condition.conditionName}>
                            <div>
                              <span>{condition.name}</span>
                              <span>{condition.diagnosisLabel}</span>
                            </div>
                            {!isNoIllness(condition.conditionName) &&
                            getIllnessKey(condition.conditionName) !==
                              getIllnessKey(unknownConditionLabel) ? (
                              <label className="condition-summary-age-field">
                                <span className="visually-hidden">
                                  Age at diagnosis for {condition.name}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="120"
                                  step="1"
                                  inputMode="numeric"
                                  value={
                                    familyConditionDetails[
                                      getIllnessKey(condition.conditionName)
                                    ]?.diagnosisAge === unknownDiagnosisAgeLabel
                                      ? ''
                                      : familyConditionDetails[
                                          getIllnessKey(condition.conditionName)
                                        ]?.diagnosisAge || ''
                                  }
                                  onChange={(event) =>
                                    updateFamilyConditionDiagnosisAge(
                                      condition.conditionName,
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Age"
                                />
                              </label>
                            ) : null}
                            <button
                              className="text-action"
                              type="button"
                              onClick={() =>
                                removeFamilyCondition(condition.conditionName)
                              }
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <p className="form-error" role="alert" aria-live="polite">
                    {error}
                  </p>

                  <button className="primary-action" type="submit">
                    Save Health History{' '}
                    <span aria-hidden="true">→</span>
                  </button>
                </form>
              </aside>
              {showFamilyEditorDiscardPrompt ? (
                <div
                  className="family-editor-discard-dialog"
                  aria-labelledby="discard-family-editor-title"
                  aria-modal="true"
                  role="dialog"
                >
                  <h3 id="discard-family-editor-title">Discard unsaved changes?</h3>
                  <div className="family-editor-discard-actions">
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => setShowFamilyEditorDiscardPrompt(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="danger-action"
                      type="button"
                      onClick={discardFamilyFormChanges}
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      {activeView === 'lifestyle' ? (
        <>
        <section
          className={getAssessmentSectionClass('profile-panel', 'lifestyle')}
          aria-labelledby="lifestyle-title"
        >
          <h2 className="panel-title" id="lifestyle-title">Your Everyday Habits</h2>

          <div className="flow-card-grid">
            <QuestionCard title="Weekly Exercise">
              <ChoiceButtons
                label="How often are you active during a typical week?"
                name="exercise"
                value={profileForm.exercise}
                options={exerciseOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    exercise: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Daily Fruits & Vegetables">
              <ChoiceButtons
                label="How many servings of fruits and vegetables do you usually eat each day?"
                name="fruitVegIntake"
                value={profileForm.fruitVegIntake}
                options={fruitVegOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    fruitVegIntake: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Smoking or Vaping">
              <ChoiceButtons
                label="Do you currently smoke or vape?"
                name="smokingStatus"
                value={profileForm.smokingStatus}
                options={smokingOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    smokingStatus: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Alcohol Use">
              <ChoiceButtons
                label="How often do you drink alcohol?"
                name="alcoholUse"
                value={profileForm.alcoholUse}
                options={alcoholOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    alcoholUse: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Sleep">
              <ChoiceButtons
                label="How much sleep do you usually get?"
                name="sleep"
                value={profileForm.sleep}
                options={sleepOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    sleep: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Eating Pattern">
              <ChoiceButtons
                label="How would you describe your usual eating pattern?"
                name="dietQuality"
                value={profileForm.dietQuality}
                options={dietQualityOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    dietQuality: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Water">
              <ChoiceButtons
                label="How much water do you usually drink?"
                name="waterIntake"
                value={profileForm.waterIntake}
                options={waterIntakeOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    waterIntake: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Sugary Drinks">
              <ChoiceButtons
                label="How often do you have sugary drinks?"
                name="sugaryDrinks"
                value={profileForm.sugaryDrinks}
                options={sugaryDrinkOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    sugaryDrinks: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Stress">
              <ChoiceButtons
                label="How has stress felt lately?"
                name="stressLevel"
                value={profileForm.stressLevel}
                options={stressLevelOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    stressLevel: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Screen Time">
              <ChoiceButtons
                label="How much recreational screen time do you usually have?"
                name="screenTime"
                value={profileForm.screenTime}
                options={screenTimeOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    screenTime: value,
                  }))
                }
              />
            </QuestionCard>

            <QuestionCard title="Preventive Checkups">
              <ChoiceButtons
                label="How current are your preventive checkups?"
                name="preventiveScreenings"
                value={profileForm.preventiveScreenings}
                options={preventiveScreeningOptions}
                onChange={(value) =>
                  setProfileForm((currentProfile) => ({
                    ...currentProfile,
                    preventiveScreenings: value,
                  }))
                }
              />
            </QuestionCard>
          </div>
        </section>
        </>
      ) : null}

      {activeView === 'coach' ? (
        <section className="prevention-score-panel" aria-labelledby="score-title">
          {!isAssessmentComplete ? (
            <section className="dashboard-assessment-card">
              <div>
                <p className="eyebrow">Profile Progress</p>
                <h2>{assessmentUnlockTitle}</h2>
                <p>{assessmentUnlockDescription}</p>
                <div className="profile-progress-summary" aria-label="Profile progress">
                  <span>Profile progress</span>
                  <strong>{assessmentCompletionPercent}% Complete</strong>
                  <ProgressBar
                    label="Profile completion progress"
                    value={assessmentCompletionPercent}
                  />
                </div>
              </div>
              <button
                className="primary-action"
                type="button"
                onClick={beginAssessmentWithLoading}
                disabled={isAssessmentLoading}
              >
                Continue <span aria-hidden="true">→</span>
              </button>
            </section>
          ) : (
            <>
              {preventionProgressSummary.length > 0 ? (
                <section className="coach-daily-panel prevention-plan-panel" aria-labelledby="prevention-progress-title">
                  <div className="coach-daily-header">
                    <div>
                      <h2 id="prevention-progress-title">Your Progress</h2>
                      <p>Recent patterns from your prevention actions.</p>
                    </div>
                  </div>

                  <ul className="prevention-progress-list">
                    {preventionProgressSummary.map((item) => (
                      <li key={item.goalType}>
                        <strong>{item.label}</strong>
                        <span>{item.status}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="coach-daily-panel prevention-plan-panel" aria-labelledby="daily-coach-title">
                <div className="coach-daily-header">
                  <div>
                    <h2 id="daily-coach-title">Today</h2>
                    <p>Small actions you can complete now.</p>
                  </div>
                  <span className="today-goal-count">
                    <span>Today's Progress</span>
                    <strong>
                      {completedTodayPreventionActions.length} of {todayPreventionActions.length} completed
                    </strong>
                  </span>
                </div>

                {areAllTodayPreventionActionsComplete ? (
                  <p className="flow-message success" role="status">
                    Great work. You've completed today's prevention actions.
                  </p>
                ) : null}

                <ul className="prevention-action-list">
                  {todayPreventionActionsWithResources.map((goal) =>
                    renderPreventionActionCard(goal, 'today', completedDailyActionSet),
                  )}
                </ul>
              </section>

              <section className="coach-daily-panel prevention-plan-panel" aria-labelledby="weekly-plan-title">
                <div className="coach-daily-header">
                  <div>
                    <h2 id="weekly-plan-title">This Week</h2>
                    <p>Actions that require planning or build across several days.</p>
                  </div>
                  <span className="today-goal-count">
                    <span>Weekly Progress</span>
                    <strong>
                      {completedWeekPreventionActions.length} of {weekPreventionActions.length} completed
                    </strong>
                  </span>
                </div>

                {weekPreventionActionsWithResources.length > 0 ? (
                  <ul className="prevention-action-list">
                    {weekPreventionActionsWithResources.map((goal) =>
                      renderPreventionActionCard(goal, 'week', completedWeeklyActionSet),
                    )}
                  </ul>
                ) : (
                  <p className="helper-text">
                    Complete more profile details to reveal weekly prevention actions.
                  </p>
                )}
                {areAllWeekPreventionActionsComplete ? (
                  <p className="flow-message success" role="status">
                    This week's actions are complete.
                  </p>
                ) : null}
              </section>

              <section className="coach-daily-panel prevention-plan-panel" aria-labelledby="monthly-plan-title">
                <div className="coach-daily-header">
                  <div>
                    <h2 id="monthly-plan-title">This Month</h2>
                    <p>Higher-value actions that do not need to happen every day.</p>
                  </div>
                  <span className="today-goal-count">
                    <span>Monthly Progress</span>
                    <strong>
                      {completedMonthPreventionActions.length} of {monthPreventionActions.length} completed
                    </strong>
                  </span>
                </div>

                {monthPreventionActionsWithResources.length > 0 ? (
                  <ul className="prevention-action-list">
                    {monthPreventionActionsWithResources.map((goal) =>
                      renderPreventionActionCard(goal, 'month', completedMonthlyActionSet),
                    )}
                  </ul>
                ) : (
                  <p className="helper-text">
                    Complete more profile details to reveal monthly prevention actions.
                  </p>
                )}
                {areAllMonthPreventionActionsComplete ? (
                  <p className="flow-message success" role="status">
                    This month's actions are complete.
                  </p>
                ) : null}
              </section>

            </>
          )}
        </section>
      ) : null}

      {activeView === 'insights' ? (
        <section className="prevention-score-panel" aria-labelledby="insights-title">
          {!isAssessmentComplete ? (
            <section className="dashboard-assessment-card">
              <div>
                <p className="eyebrow">Profile Progress</p>
                <h2>{assessmentUnlockTitle}</h2>
                <p>{assessmentUnlockDescription}</p>
                <div className="profile-progress-summary" aria-label="Profile progress">
                  <span>Profile progress</span>
                  <strong>{assessmentCompletionPercent}% Complete</strong>
                  <ProgressBar
                    label="Profile completion progress"
                    value={assessmentCompletionPercent}
                  />
                </div>
              </div>
              <button
                className="primary-action"
                type="button"
                onClick={beginAssessmentWithLoading}
                disabled={isAssessmentLoading}
              >
                Continue <span aria-hidden="true">→</span>
              </button>
            </section>
          ) : (
            <section className="prevention-insights-section" aria-label="Your health profile themes">
              <p className="health-profile-section-summary">
                Your assessment highlights the three health areas that may
                benefit most from your attention.
              </p>

              <div className="prevention-insight-list">
                {displayedHealthProfileInsights.length > 0 ? (
                  displayedHealthProfileInsights.map((insight) => (
                    <PreventionInsightCard insight={insight} key={insight.id} />
                  ))
                ) : (
                  <p className="helper-text">
                    Add family health details to reveal your most relevant
                    family-health patterns.
                  </p>
                )}
              </div>
            </section>
          )}
        </section>
      ) : null}

      {activeView === 'coach' && activeGoalAction ? (
        <section className="wellness-panel" aria-labelledby="wellness-recommendations-title">
          <section className="location-card" aria-labelledby="location-title">
            <div>
              <p className="eyebrow">Resources</p>
              <h2 id="location-title">Find resources for this action</h2>
              <p>
                Use your current location or enter a city or ZIP code to find
                resources connected to the prevention action you choose.
              </p>
            </div>

            <form className="location-controls" onSubmit={handleManualLocationSubmit}>
              <button
                className="primary-action"
                type="button"
                onClick={requestUserLocation}
                disabled={locationStatus === 'loading'}
              >
                {locationStatus === 'loading'
                  ? 'Requesting location...'
                  : 'Use My Location'}
                <span aria-hidden="true">→</span>
              </button>

              <label
                className="field-group location-field"
                htmlFor="manual-location"
              >
                City or ZIP code
                <input
                  id="manual-location"
                  inputMode="numeric"
                  maxLength={5}
                  pattern="\d{5}"
                  type="text"
                  value={activeLocation.zipCode}
                  onChange={(event) => {
                    const zipCode = event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 5)

                    setActiveLocation((currentLocation) => ({
                      ...currentLocation,
                      city: '',
                      latitude: null,
                      longitude: null,
                      source: '',
                      zipCode,
                    }))
                    setSelectedWeeklyEvent(null)
                  }}
                  placeholder="Example: 94132"
                />
              </label>

              <button className="secondary-action" type="submit">
                Search ZIP <span aria-hidden="true">→</span>
              </button>
            </form>

            {locationMessage ? (
              <p className={`location-message ${locationStatus}`}>
                {locationMessage}
              </p>
            ) : (
              <p className="helper-text">
                Add a location to make Maps searches more useful.
              </p>
            )}
          </section>

          {isAssessmentComplete ? (
            <>
              <div className="wellness-layout">
                <section
                  className="wellness-recommendations"
                  aria-labelledby="wellness-recommendations-title"
                >
                  <div className="section-heading-row">
                    <div>
                      <h2 id="wellness-recommendations-title">
                        {weeklyEventHeading}
                      </h2>
                      {weeklyEventDescription ? <p>{weeklyEventDescription}</p> : null}
                      {activeGoalIntent?.resourceIntent === 'cardiovascular-screening' ? (
                        <p className="helper-text">
                          Check the location's website or call ahead to confirm blood-pressure services.
                        </p>
                      ) : null}
                      {activeGoalAction ? (
                        <p className="goal-resource-filter-note">
                          Resources for: {activeGoalAction.goal.label}
                          <button
                            className="text-action"
                            type="button"
                            onClick={() => setActiveGoalResourceFilter(null)}
                          >
                            Clear action
                          </button>
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {weeklyEventsStatus === 'loading' ? (
                    <p className="helper-text">Loading this week’s events...</p>
                  ) : null}

                  {weeklyEventsStatus === 'error' ? (
                    <p className="flow-message error" role="alert">
                      {weeklyEventsError}
                    </p>
                  ) : null}

                  {weeklyEventsStatus === 'success' &&
                  displayedWeeklyEvents.length === 0 &&
                  displayedOnlineEvents.length === 0 ? (
                    <p className="helper-text">
                      {activeGoalIntent?.resourceIntent === 'mammography-facility' &&
                      weeklyEventFilter.status === 'location-needed'
                        ? 'Add your ZIP code to find nearby mammography facilities.'
                        : activeGoalIntent?.resourceIntent === 'physical-activity' &&
                      weeklyEventFilter.status === 'location-needed'
                        ? 'Enter a ZIP code to find nearby parks and trails.'
                        : weeklyEventFilter.status === 'invalid-zip'
                        ? 'Enter a valid five-digit ZIP code.'
                        : weeklyEventFilter.status === 'unsupported-zip'
                          ? 'That ZIP code is outside the areas currently supported.'
                          : weeklyEventFilter.status === 'no-priorities'
                            ? 'Build your family health tree and everyday habits profile to receive personalized recommendations.'
                              : weeklyEventFilter.status === 'location-needed'
                                ? 'Enter a ZIP code to see personalized local recommendations.'
                                : weeklyEventFilter.status === 'supported-empty'
                                  ? activeGoalIntent?.resourceIntent === 'physical-activity'
                                    ? 'No nearby options were found for this location.'
                                    : 'No exact nearby options were found. Here are the closest available resources.'
                                  : 'No verified preventive-health recommendations were found. New resources are checked daily.'}
                    </p>
                  ) : null}

                  {weeklyEventsStatus === 'success' &&
                  !weeklyEventFilter.hasExactMatches &&
                  activeGoalIntent?.resourceIntent !== 'physical-activity' &&
                  (displayedWeeklyEvents.length > 0 || displayedOnlineEvents.length > 0) ? (
                    <p className="helper-text">
                      No exact nearby options were found. Here are the closest available resources.
                    </p>
                  ) : null}

                  {displayedWeeklyEvents.length > 0 ? (
                    <section
                      className="online-resource-section"
                      aria-labelledby="nearby-community-resources-title"
                    >
                      <h3 id="nearby-community-resources-title">
                        {activeGoalAction
                          ? activeGoalResourceSections[0]?.label || "Best Match for Today's Goal"
                          : 'Nearby community resources'}
                      </h3>
                      <div className="weekly-event-list">
                        {displayedWeeklyEvents.map((event) => {
                          const eventPreview = getEventPreview(
                            event,
                            expandedEventDescriptions,
                          )
                          const mapActionLabel = getEventLocationActionLabel(event)

                          return (
                            <article
                              className={`weekly-event-card${
                                selectedEvent?.id === event.id ? ' selected' : ''
                              }`}
                              key={event.id}
                              role="button"
                              tabIndex={0}
                              aria-pressed={selectedEvent?.id === event.id}
                              onClick={() => setSelectedWeeklyEvent(event)}
                              onKeyDown={(keyEvent) => {
                                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                                  keyEvent.preventDefault()
                                  setSelectedWeeklyEvent(event)
                                }
                              }}
                            >
                              {event.image ? (
                                <img
                                  className="weekly-event-image"
                                  src={event.image}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : null}

                              <div className="weekly-event-topline">
                                <div>
                                  <h3>{event.title}</h3>
                                  <p>{getResourceTimingLabel(event)}</p>
                                </div>
                              </div>

                              <div className="weekly-event-meta">
                                <span>{event.recommendationLabel}</span>
                                <span>{getLocationLabel(event)}</span>
                                <span>
                                  {event.source}
                                </span>
                              </div>

                              {event.eventMatchReason ? (
                                <p className="weekly-event-reason">
                                  {event.eventMatchReason}
                                </p>
                              ) : null}

                              {eventPreview.visibleText ? (
                                <p className="weekly-event-description">
                                  {eventPreview.visibleText}
                                </p>
                              ) : null}

                              {eventPreview.shouldTruncate ? (
                                <button
                                  className="text-action"
                                  type="button"
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation()
                                    setExpandedEventDescriptions((currentState) => ({
                                      ...currentState,
                                      [event.id]: !currentState[event.id],
                                    }))
                                  }}
                                >
                                  {eventPreview.isExpanded ? 'Show less' : 'Show more'}
                                </button>
                              ) : null}

                              <div className="weekly-event-actions">
                                {event.directionsUrl && mapActionLabel ? (
                                  <a
                                    className={
                                      isOnlineEvent(event) ||
                                      event.attendanceMode === 'hybrid'
                                        ? 'secondary-action'
                                        : 'primary-action'
                                    }
                                    href={event.directionsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(clickEvent) => {
                                      clickEvent.stopPropagation()
                                      setSelectedWeeklyEvent(event)
                                    }}
                                  >
                                    {mapActionLabel}
                                    <span aria-hidden="true">→</span>
                                  </a>
                                ) : null}

                                {event.eventLink ? (
                                  <a
                                    className="secondary-action"
                                    href={event.eventLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  onClick={(clickEvent) => clickEvent.stopPropagation()}
                                >
                                  {getResourcePrimaryActionLabel(event, activeGoalIntent)}
                                  {' '}
                                  <span aria-hidden="true">→</span>
                                </a>
                                ) : null}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  ) : (
                    null
                  )}

                  {displayedOnlinePrograms.length > 0 ? (
                    <section
                      className="online-resource-section"
                      aria-labelledby="online-resources-title"
                    >
                      <h3 id="online-resources-title">
                        {activeGoalAction ? 'Trusted Online Resources' : 'Online programs'}
                      </h3>
                      <div className="weekly-event-list">
                        {displayedOnlinePrograms.map((event) => {
                          const eventPreview = getEventPreview(
                            event,
                            expandedEventDescriptions,
                          )

                          return (
                            <article
                              className={`weekly-event-card${
                                selectedEvent?.id === event.id ? ' selected' : ''
                              }`}
                              key={event.id}
                              role="button"
                              tabIndex={0}
                              aria-pressed={selectedEvent?.id === event.id}
                              onClick={() => setSelectedWeeklyEvent(event)}
                              onKeyDown={(keyEvent) => {
                                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                                  keyEvent.preventDefault()
                                  setSelectedWeeklyEvent(event)
                                }
                              }}
                            >
                              <div className="weekly-event-topline">
                                <div>
                                  <h3>{event.title}</h3>
                                  <p>{getResourceTimingLabel(event)}</p>
                                </div>
                              </div>

                              <div className="weekly-event-meta">
                                <span>{event.recommendationLabel}</span>
                                <span>{getLocationLabel(event)}</span>
                                <span>{event.source}</span>
                              </div>

                              {event.eventMatchReason ? (
                                <p className="weekly-event-reason">
                                  {event.eventMatchReason}
                                </p>
                              ) : null}

                              {eventPreview.visibleText ? (
                                <p className="weekly-event-description">
                                  {eventPreview.visibleText}
                                </p>
                              ) : null}

                              {eventPreview.shouldTruncate ? (
                                <button
                                  className="text-action"
                                  type="button"
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation()
                                    setExpandedEventDescriptions((currentState) => ({
                                      ...currentState,
                                      [event.id]: !currentState[event.id],
                                    }))
                                  }}
                                >
                                  {eventPreview.isExpanded ? 'Show less' : 'Show more'}
                                </button>
                              ) : null}

                              <div className="weekly-event-actions">
                                {event.eventLink ? (
                                  <a
                                    className="secondary-action"
                                    href={event.eventLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  onClick={(clickEvent) => clickEvent.stopPropagation()}
                                >
                                  {getResourcePrimaryActionLabel(event, activeGoalIntent)}
                                  {' '}
                                  <span aria-hidden="true">→</span>
                                </a>
                                ) : null}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  ) : null}

                  {displayedTrustedResources.length > 0 ? (
                    <section
                      className="online-resource-section"
                      aria-labelledby="trusted-resources-title"
                    >
                      <h3 id="trusted-resources-title">
                        Trusted health organizations
                      </h3>
                      <div className="weekly-event-list">
                        {displayedTrustedResources.map((event) => {
                          const eventPreview = getEventPreview(
                            event,
                            expandedEventDescriptions,
                          )

                          return (
                            <article
                              className={`weekly-event-card${
                                selectedEvent?.id === event.id ? ' selected' : ''
                              }`}
                              key={event.id}
                              role="button"
                              tabIndex={0}
                              aria-pressed={selectedEvent?.id === event.id}
                              onClick={() => setSelectedWeeklyEvent(event)}
                              onKeyDown={(keyEvent) => {
                                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                                  keyEvent.preventDefault()
                                  setSelectedWeeklyEvent(event)
                                }
                              }}
                            >
                              <div className="weekly-event-topline">
                                <div>
                                  <h3>{event.title}</h3>
                                  <p>{getResourceTimingLabel(event)}</p>
                                </div>
                              </div>

                              <div className="weekly-event-meta">
                                <span>{event.recommendationLabel}</span>
                                <span>{getLocationLabel(event)}</span>
                                <span>{event.source}</span>
                              </div>

                              {event.eventMatchReason ? (
                                <p className="weekly-event-reason">
                                  {event.eventMatchReason}
                                </p>
                              ) : null}

                              {eventPreview.visibleText ? (
                                <p className="weekly-event-description">
                                  {eventPreview.visibleText}
                                </p>
                              ) : null}

                              {eventPreview.shouldTruncate ? (
                                <button
                                  className="text-action"
                                  type="button"
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation()
                                    setExpandedEventDescriptions((currentState) => ({
                                      ...currentState,
                                      [event.id]: !currentState[event.id],
                                    }))
                                  }}
                                >
                                  {eventPreview.isExpanded ? 'Show less' : 'Show more'}
                                </button>
                              ) : null}

                              <div className="weekly-event-actions">
                                {event.eventLink ? (
                                  <a
                                    className="secondary-action"
                                    href={event.eventLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  onClick={(clickEvent) => clickEvent.stopPropagation()}
                                >
                                  {getResourcePrimaryActionLabel(event, activeGoalIntent)}
                                  {' '}
                                  <span aria-hidden="true">→</span>
                                </a>
                                ) : null}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  ) : null}
                </section>

                {weeklyEventMapUrl ? (
                  <section
                    className="wellness-map-card"
                    aria-labelledby="wellness-map-title"
                  >
                    <div>
                      <p className="eyebrow">Map</p>
                      <h2 id="wellness-map-title">
                        {selectedEvent
                          ? selectedEvent.title
                          : getActiveLocationLabel(activeLocation)}
                      </h2>
                      <p>
                        {selectedEvent
                          ? getEventLocationLabel(selectedEvent)
                          : 'Showing your selected location.'}
                      </p>
                    </div>

                    <div className="wellness-map-frame">
                      <iframe
                        key={selectedEvent?.id || getLocationOriginTarget(activeLocation)}
                        src={weeklyEventMapUrl}
                        title="Nearby weekly health event map"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    {selectedEvent ? (
                      <div className="weekly-event-actions">
                        {selectedEvent.eventLink ? (
                          <a
                            className="secondary-action map-action"
                            href={selectedEvent.eventLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {getResourcePrimaryActionLabel(selectedEvent, activeGoalIntent)}
                            {' '}
                            <span aria-hidden="true">→</span>
                          </a>
                        ) : null}

                        {selectedEvent.directionsUrl ? (
                          <a
                            className="secondary-action map-action"
                            href={selectedEvent.directionsUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {getEventLocationActionLabel(selectedEvent)}
                            <span aria-hidden="true">→</span>
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            </>
          ) : (
            <section
              className="wellness-recommendations"
              aria-labelledby="wellness-recommendations-title"
            >
              <h2 id="wellness-recommendations-title">
                This Week Near You
              </h2>
              <p className="helper-text">
                Complete your health profile to receive personalized weekly
                health opportunities.
              </p>
            </section>
          )}
        </section>
      ) : null}

      {isWorkflowView && activeView !== 'dashboard' ? (
        <div className="flow-footer-actions">
          <button
            className="secondary-action"
            type="button"
            onClick={goToPreviousStep}
            disabled={!previousWorkflowStep}
          >
            <span aria-hidden="true">←</span> Back
          </button>
          <button
            className="primary-action"
            type="button"
            disabled={isAssessmentLoading}
            onClick={() => {
              if (finishTarget) {
                changeView(finishTarget)
                return
              }

              goToNextStep()
            }}
          >
            {finishTarget ? 'Finish' : workflowContinueLabel}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      <p className="app-disclaimer">{disclaimerText}</p>

      {isAccountSettingsOpen ? (
        <div className="account-settings-backdrop" role="presentation">
          <section
            className="account-settings-modal"
            aria-labelledby="account-settings-title"
            aria-modal="true"
            role="dialog"
          >
            <div className="account-settings-header">
              <div>
                <p className="eyebrow">Account</p>
                <h2 id="account-settings-title">My Account</h2>
              </div>
              <button
                className="remove-button"
                type="button"
                aria-label="Close account settings"
                onClick={() => setIsAccountSettingsOpen(false)}
              >
                &times;
              </button>
            </div>

            <form className="account-settings-form" onSubmit={saveAccountSettings}>
              <label className="field-group" htmlFor="account-display-name">
                Display name
                <input
                  id="account-display-name"
                  type="text"
                  autoComplete="name"
                  value={accountDisplayNameInput}
                  onChange={(event) => setAccountDisplayNameInput(event.target.value)}
                  placeholder="Add your name"
                />
              </label>

              <label className="field-group" htmlFor="account-email">
                Email
                <input id="account-email" type="email" value={accountEmail} readOnly />
              </label>

              <div className="account-settings-actions">
                <button className="primary-action" type="submit">
                  Save Settings
                </button>
                <button className="secondary-action" type="button" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isPrivacyDataOpen ? (
        <div className="account-settings-backdrop" role="presentation">
          <section
            className="account-settings-modal privacy-data-modal"
            aria-labelledby="privacy-data-title"
            aria-modal="true"
            role="dialog"
          >
            <div className="account-settings-header">
              <div>
                <p className="eyebrow">Account</p>
                <h2 id="privacy-data-title">Privacy &amp; Data</h2>
              </div>
              <button
                className="remove-button"
                type="button"
                aria-label="Close privacy and data"
                onClick={() => setIsPrivacyDataOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="privacy-data-content">
              <section>
                <h3>What your account may store</h3>
                <ul>
                  <li>Current Health responses</li>
                  <li>Family Structure and Family Health Tree conditions</li>
                  <li>Optional names and diagnosis ages</li>
                  <li>Everyday Habits and prevention-plan progress</li>
                  <li>Your saved city or ZIP code, when provided</li>
                </ul>
              </section>

              <section>
                <h3>Your privacy</h3>
                <p>
                  Your information stays private and is never sold for advertising.
                  The information in this app is educational and not a medical diagnosis.
                </p>
                <p>
                  Family Health provides educational prevention information and does
                  not replace professional medical care.
                </p>
              </section>

              <section>
                <h3>Your controls</h3>
                <p>
                  Export a JSON copy of the health information saved for this account.
                  Authentication tokens and service credentials are never included.
                </p>
                <div className="privacy-data-actions">
                  <button className="secondary-action" type="button" onClick={exportHealthData}>
                    Export My Health Data <span aria-hidden="true">→</span>
                  </button>
                  <button
                    className="danger-action"
                    type="button"
                    onClick={handleResetHealthProfile}
                  >
                    Reset Health Profile
                  </button>
                </div>
                <p className="helper-text">
                  Reset Health Profile clears saved health information while keeping
                  your signed-in account. Account deletion is not available in this
                  version.
                </p>
              </section>
            </div>
          </section>
        </div>
      ) : null}

      {isResetConfirmationOpen ? (
        <div
          className="account-settings-backdrop reset-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsResetConfirmationOpen(false)
            }
          }}
        >
          <section
            className="reset-confirm-modal"
            aria-describedby="reset-confirm-description"
            aria-labelledby="reset-confirm-title"
            aria-modal="true"
            role="dialog"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsResetConfirmationOpen(false)
              }
            }}
          >
            <div className="reset-confirm-copy">
              <h2 id="reset-confirm-title">Delete saved health data?</h2>
              <p id="reset-confirm-description">
                This permanently deletes your current health answers, everyday
                habits, family health history, and prevention progress. Your
                account will stay active.
              </p>
              <p className="reset-confirm-note">This action cannot be undone.</p>
            </div>
            <div className="reset-confirm-actions">
              <button
                className="secondary-action"
                type="button"
                autoFocus
                onClick={() => setIsResetConfirmationOpen(false)}
              >
                Keep my data
              </button>
              <button
                className="danger-action reset-confirm-action"
                type="button"
                disabled={saveStatus === 'saving'}
                onClick={confirmResetHealthProfile}
              >
                {saveStatus === 'saving' ? 'Deleting...' : 'Delete health data'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showParentRequirementPrompt ? (
        <div className="account-settings-backdrop" role="presentation">
          <section
            className="parent-requirement-modal"
            aria-labelledby="parent-requirement-title"
            aria-modal="true"
            role="dialog"
          >
            <div>
              <h2 id="parent-requirement-title">Complete Parent Information</h2>
              <p>
                Information about your parents provides the strongest foundation
                for identifying inherited health patterns. Please add your
                mother and father before continuing. If information is
                unavailable, you can indicate that it is unknown.
              </p>
            </div>
            <div className="parent-requirement-actions">
              <button
                className="primary-action"
                type="button"
                onClick={() => setShowParentRequirementPrompt(false)}
              >
                Return
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {activeConditionName ? (
        <ConditionDetailsModal
          conditionName={activeConditionName}
          details={activeConditionDetails}
          onClose={() => setActiveConditionName(null)}
        />
      ) : null}

      </main>
    </div>
  )
}

export default App
