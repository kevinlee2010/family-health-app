import { useEffect, useState } from 'react'
import './App.css'
import { getConditionDetails } from './conditionDetails'
import { buildFamilyHealthSummary } from './healthCategories'
import {
  buildPersonalizedPreventionSummary,
  buildPreventionInsights,
} from './preventionInsights'
import {
  calculatePreventionScore,
  getPreventionScoreStatus,
} from './preventionScore'
import { getMockWeeklyEvents } from './mockWeeklyEvents'

const relationships = ['Mother', 'Father', 'Sibling', 'Grandparent']
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
const noKnownConditionsLabel = 'No known conditions.'
const familyHistoryConditionOptions = [
  'Heart disease',
  'High blood pressure',
  'High cholesterol',
  'Type 2 diabetes',
  'Stroke',
  'Breast cancer',
  'Colon cancer',
  'Asthma',
  'Depression',
  "Alzheimer's disease",
]

function getRelationshipLimitGroup(relationship) {
  if (relationship === 'Mother' || relationship === 'Father') {
    return 'parent'
  }

  if (relationship === 'Grandparent') {
    return 'grandparent'
  }

  return null
}

function getRelationshipLimit(group) {
  if (group === 'parent') {
    return 2
  }

  if (group === 'grandparent') {
    return 4
  }

  return Infinity
}

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
    illnesses: ['Type 1 Diabetes', 'Type 2 Diabetes', 'Obesity'],
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
]

const starterIllnesses = illnessCategories.flatMap((category) => category.illnesses)

const guidedSteps = [
  {
    id: 'dashboard',
    label: 'Dashboard',
  },
  {
    id: 'family',
    label: 'Family Health History',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle Assessment',
  },
  {
    id: 'coach',
    label: 'AI Prevention Coach',
  },
]

const legacyViewMap = {
  actions: 'coach',
  about: 'family',
  coach: 'coach',
  dashboard: 'dashboard',
  history: 'family',
  localized: 'coach',
  prevention: 'coach',
  profile: 'family',
  risk: 'coach',
  score: 'coach',
  results: 'coach',
  tree: 'family',
  lifestyle: 'lifestyle',
}

const viewTabs = [
  { id: 'dashboard', icon: '⌂', label: 'Dashboard' },
  { id: 'family', icon: '👥', label: 'Family Health History' },
  { id: 'lifestyle', icon: '◒', label: 'Lifestyle Assessment' },
  { id: 'coach', icon: '✦', label: 'AI Prevention Coach' },
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
  'Not sure',
  'Need to schedule',
  'Not age appropriate yet',
]

const yesNoUnknownOptions = ['No', 'Yes', 'Not sure', 'Prefer not to answer']

const diabetesStatusOptions = [
  'No',
  'Prediabetes',
  'Type 2 diabetes',
  'Diabetes, not sure what type',
  'Not sure',
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
      member.illnesses.length > 0,
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

function hasAssessmentData({ familyMembers, profileForm, profileIllnesses }) {
  return (
    hasMeaningfulFamilyHistory(familyMembers) ||
    hasEnoughLifestyleAnswers(profileForm, profileIllnesses)
  )
}

const storageKey = 'family-health-app-state-v1'

const defaultSavedState = {
  activeView: 'dashboard',
  userProfile: null,
  profileForm: initialProfileForm,
  profileIllnesses: [],
  profileIllnessInput: '',
  profileNoListedConditions: false,
  profileHasUnlistedCondition: false,
  familyMembers: [],
  familyMemberName: '',
  relationship: '',
  selectedIllnesses: [],
  familyEarlyDiagnosis: false,
  familyDiagnosisAge: '',
  editingFamilyMemberId: null,
  habitProgress: {},
  manualLocation: '',
  userCoordinates: null,
  locationStatus: 'idle',
  locationMessage: '',
}

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
      [key]: asString(value[key]),
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
    diabetesStatus: asString(value.diabetesStatus),
    illnesses: sanitizeDatabaseIllnesses(value.illnesses || value.conditions),
    noListedConditions: Boolean(value.noListedConditions),
    hasUnlistedCondition: Boolean(value.hasUnlistedCondition),
    isSelf: true,
  }
}

function sanitizeFamilyMembers(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(isPlainObject)
    .map((member) => ({
      id: asString(member.id, createId()),
      name: asString(member.name),
      relationship: asString(member.relationship),
      illnesses: asStringArray(member.illnesses || member.conditions),
      earlyDiagnosis: Boolean(member.earlyDiagnosis),
      diagnosisAge: asString(member.diagnosisAge),
    }))
    .filter((member) => relationships.includes(member.relationship))
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

function sanitizeActiveView(value) {
  if (viewTabs.some((tab) => tab.id === value)) {
    return value
  }

  return legacyViewMap[value] || 'dashboard'
}

function sanitizeLocationStatus(value) {
  return ['idle', 'success', 'error', 'manual'].includes(value)
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
  const locationStatus = sanitizeLocationStatus(value.locationStatus)

  return {
    activeView: sanitizeActiveView(value.activeView),
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
    familyMembers: sanitizeFamilyMembers(value.familyMembers),
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
    habitProgress: sanitizeHabitProgress(value.habitProgress),
    manualLocation: asString(value.manualLocation),
    userCoordinates: sanitizeCoordinates(value.userCoordinates),
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

function saveAppState(nextState) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...nextState,
        version: 1,
      }),
    )
  } catch {
    // Local storage can be unavailable in private browsing or restricted modes.
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

const workflowSteps = guidedSteps

const closeFamilyRelationships = ['Mother', 'Father', 'Sibling']

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeIllness(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getIllnessKey(value) {
  return normalizeIllness(value).replace(/\s*\([^)]*\)/g, '').replace(/\.+$/g, '')
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
  const totalInches = feet * 12 + inches

  if (!pounds || !totalInches || pounds <= 0 || totalInches <= 0) {
    return null
  }

  return Number(((pounds / (totalInches * totalInches)) * 703).toFixed(1))
}

function getBmiCategory(bmi) {
  if (!bmi) {
    return 'Add height and weight to calculate BMI.'
  }

  if (bmi < 18.5) {
    return 'Below the typical adult range'
  }

  if (bmi < 25) {
    return 'Typical adult range'
  }

  if (bmi < 30) {
    return 'Above the typical adult range'
  }

  return 'Well above the typical adult range'
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

function hasValidEventLocation(event) {
  return Boolean(
    event?.address ||
      (Number.isFinite(event?.coordinates?.latitude) &&
        Number.isFinite(event?.coordinates?.longitude)),
  )
}

function getEventDestination(event) {
  if (
    Number.isFinite(event?.coordinates?.latitude) &&
    Number.isFinite(event?.coordinates?.longitude)
  ) {
    return `${event.coordinates.latitude},${event.coordinates.longitude}`
  }

  return event?.address || ''
}

function buildGoogleMapsDirectionsUrl(event, originTarget = '') {
  const destination = getEventDestination(event)

  if (!destination) {
    return ''
  }

  const originQuery = originTarget
    ? `&origin=${encodeURIComponent(originTarget)}`
    : ''

  return `https://www.google.com/maps/dir/?api=1${originQuery}&destination=${encodeURIComponent(
    destination,
  )}`
}

function buildEventMapEmbedUrl(event) {
  const destination = getEventDestination(event)

  if (!destination) {
    return ''
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(
    destination,
  )}&output=embed`
}

function getLocationOriginTarget({ manualLocation, userCoordinates }) {
  if (userCoordinates) {
    return `${userCoordinates.latitude},${userCoordinates.longitude}`
  }

  const cleanManualLocation = manualLocation.trim()

  if (cleanManualLocation) {
    return cleanManualLocation
  }

  return ''
}

function conditionMatches(condition, keywords) {
  const conditionKey = getIllnessKey(condition)

  return keywords.some((keyword) => conditionKey.includes(getIllnessKey(keyword)))
}

function getFamilyConditionReports(familyMembers, keywords) {
  return familyMembers.flatMap((member) =>
    member.illnesses
      .filter((illness) => !isNoIllness(illness))
      .filter((illness) => conditionMatches(illness, keywords))
      .map((illness) => ({
        condition: illness,
        isCloseRelative: closeFamilyRelationships.includes(member.relationship),
        relationship: member.relationship,
      })),
  )
}

function getCloseReportCount(reports) {
  return reports.filter((report) => report.isCloseRelative).length
}

function joinReadableList(items) {
  if (items.length <= 1) {
    return items[0] || ''
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }

  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

function getRelativeLabel(relationship) {
  if (relationship === 'Mother') return 'your mother'
  if (relationship === 'Father') return 'your father'
  if (relationship === 'Sibling') return 'a sibling'
  if (relationship === 'Grandparent') return 'a grandparent'

  return `a ${relationship.toLowerCase()}`
}

function buildFamilyReportReason(reports) {
  const entries = reports
    .slice(0, 3)
    .map(
      (report) =>
        `${getRelativeLabel(report.relationship)} reported ${report.condition}`,
    )

  if (reports.length > 3) {
    entries.push('other relatives reported related conditions')
  }

  return `${joinReadableList(entries)}.`
}

function hasLifestyleAnswer(profile, field, values) {
  return values.includes(profile[field])
}

function buildWeeklyEventRecommendations({
  events,
  familyMembers,
  locationTarget,
  profile,
  profileIllnesses,
}) {
  const hasCurrentProfileCondition = (keywords) =>
    profileIllnesses
      .filter((illness) => !isNoIllness(illness))
      .some((illness) => conditionMatches(illness, keywords))

  const cardiovascularReports = getFamilyConditionReports(familyMembers, [
    'heart disease',
    'heart attack',
    'high blood pressure',
    'hypertension',
    'high cholesterol',
    'stroke',
  ])
  const cholesterolReports = getFamilyConditionReports(familyMembers, [
    'heart disease',
    'heart attack',
    'high cholesterol',
    'stroke',
  ])
  const bloodPressureReports = getFamilyConditionReports(familyMembers, [
    'high blood pressure',
    'hypertension',
    'stroke',
  ])
  const diabetesReports = getFamilyConditionReports(familyMembers, [
    'type 2 diabetes',
  ])
  const cancerReports = getFamilyConditionReports(familyMembers, [
    'breast cancer',
    'colon cancer',
  ])
  const mentalWellnessReports = getFamilyConditionReports(familyMembers, [
    'depression',
    'anxiety',
  ])

  const currentSmoking = profile.smokingStatus === 'Current'
  const lowActivity = hasLifestyleAnswer(profile, 'exercise', [
    'Rarely',
    '1-2 days/week',
  ])
  const nutritionOpportunity =
    hasLifestyleAnswer(profile, 'dietQuality', ['Poor', 'Fair']) ||
    hasLifestyleAnswer(profile, 'fruitVegIntake', [
      '0-1 servings',
      '2 servings',
    ])
  const highStress = hasLifestyleAnswer(profile, 'stressLevel', [
    'High',
    'Very high',
  ])
  const knownBloodPressure =
    profile.knownHighBloodPressure === 'Yes' ||
    hasCurrentProfileCondition(['high blood pressure', 'hypertension'])
  const knownCholesterol =
    profile.knownHighCholesterol === 'Yes' ||
    hasCurrentProfileCondition(['high cholesterol'])
  const diabetesSignal =
    profile.diabetesStatus === 'Prediabetes' ||
    profile.diabetesStatus === 'Diabetes' ||
    profile.diabetesStatus === 'Type 2 diabetes' ||
    profile.diabetesStatus === 'Diabetes, not sure what type' ||
    hasCurrentProfileCondition(['type 2 diabetes'])
  const signals = [
    {
      reason: bloodPressureReports.length
        ? `Recommended because ${buildFamilyReportReason(
            bloodPressureReports,
          ).replace(/\.$/, '').toLowerCase()}.`
        : 'Recommended because your profile includes known high blood pressure.',
      score: 36 + bloodPressureReports.length + getCloseReportCount(bloodPressureReports),
      tag: 'blood-pressure',
      visible: bloodPressureReports.length || knownBloodPressure,
    },
    {
      reason: cholesterolReports.length
        ? `Recommended because ${buildFamilyReportReason(
            cholesterolReports,
          ).replace(/\.$/, '').toLowerCase()}.`
        : 'Recommended because your profile includes known high cholesterol.',
      score: 34 + cholesterolReports.length + getCloseReportCount(cholesterolReports),
      tag: 'cholesterol',
      visible: cholesterolReports.length || knownCholesterol,
    },
    {
      reason:
        'Recommended because cardiovascular conditions appear in your reported family history.',
      score: 30 + cardiovascularReports.length + getCloseReportCount(cardiovascularReports),
      tag: 'cardiovascular',
      visible: cardiovascularReports.length,
    },
    {
      reason: diabetesReports.length
        ? 'Recommended because type 2 diabetes appears in your reported family history.'
        : 'Recommended because your profile includes diabetes or prediabetes awareness.',
      score: 35 + diabetesReports.length + getCloseReportCount(diabetesReports),
      tag: 'diabetes',
      visible: diabetesReports.length || diabetesSignal,
    },
    {
      reason:
        'Recommended because breast or colon cancer appears in your reported family history.',
      score: 33 + cancerReports.length + getCloseReportCount(cancerReports),
      tag: 'cancer',
      visible: cancerReports.length,
    },
    {
      reason: 'Recommended because your lifestyle profile indicates current smoking or vaping.',
      score: 38,
      tag: 'smoking',
      visible: currentSmoking,
    },
    {
      reason:
        'Recommended because your activity response suggests an opportunity to build more regular movement.',
      score: 26,
      tag: 'movement',
      visible: lowActivity,
    },
    {
      reason:
        'Recommended because your nutrition answers suggest an opportunity to strengthen everyday food habits.',
      score: 24,
      tag: 'nutrition',
      visible: nutritionOpportunity,
    },
    {
      reason: mentalWellnessReports.length
        ? 'Recommended because mental wellness conditions appear in your reported family history.'
        : 'Recommended because your stress response suggests support could be useful this week.',
      score: 27 + mentalWellnessReports.length,
      tag: 'mental',
      visible: highStress || mentalWellnessReports.length,
    },
    {
      reason: 'Recommended because your stress response suggests support could be useful this week.',
      score: 28,
      tag: 'stress',
      visible: highStress,
    },
    {
      reason:
        'Recommended as a general community wellness opportunity while you continue building your profile.',
      score: 8,
      tag: 'general',
      visible: true,
    },
  ].filter((signal) => signal.visible)
  const now = new Date()
  const eventRecommendations = events
    .filter((event) => new Date(event.startsAt) >= now)
    .map((event) => {
      const matchingSignals = signals.filter((signal) =>
        event.tags.includes(signal.tag),
      )
      const bestSignal = matchingSignals.sort(
        (firstSignal, secondSignal) => secondSignal.score - firstSignal.score,
      )[0]
      const relevanceScore = matchingSignals.reduce(
        (total, signal) => total + signal.score,
        0,
      )

      return {
        ...event,
        directionsUrl: buildGoogleMapsDirectionsUrl(event, locationTarget),
        hasLocation: hasValidEventLocation(event),
        relevanceScore,
        recommendationReason: bestSignal?.reason || '',
      }
    })
    .filter((event) => event.relevanceScore > 0)

  const personalizedEvents = eventRecommendations.filter(
    (event) => !event.tags.includes('general') || event.relevanceScore > 8,
  )
  const eventsToShow =
    personalizedEvents.length > 0
      ? personalizedEvents
      : eventRecommendations.filter((event) => event.tags.includes('general'))

  return eventsToShow
    .sort((firstEvent, secondEvent) => {
      const relevanceDifference =
        secondEvent.relevanceScore - firstEvent.relevanceScore

      if (relevanceDifference !== 0) {
        return relevanceDifference
      }

      return new Date(firstEvent.startsAt) - new Date(secondEvent.startsAt)
    })
    .slice(0, 6)
}

function buildCoachGoals(preventionScore) {
  const goals = [
    {
      id: 'walk',
      label: 'Take a 20-minute walk',
      detail: 'A small movement goal supports several prevention priorities.',
    },
    {
      id: 'water',
      label: 'Drink one extra glass of water',
      detail: 'Hydration is a simple daily win.',
    },
    {
      id: 'produce',
      label: 'Add fruit or vegetables to one meal',
      detail: 'A small nutrition upgrade is easier to repeat.',
    },
  ]

  preventionScore.topPriorities.forEach((priority) => {
    if (priority.id === 'tobacco') {
      goals.push({
        id: 'quit-support',
        label: 'Look up one quit-support resource',
        detail: 'Support tools can make tobacco or vaping goals less lonely.',
      })
    }

    if (priority.id === 'screening') {
      goals.push({
        id: 'screening-question',
        label: 'Write one screening question for your next visit',
        detail: 'Clear questions make healthcare conversations easier.',
      })
    }

    if (priority.id === 'stress') {
      goals.push({
        id: 'breathing',
        label: 'Try a 5-minute breathing break',
        detail: 'Short resets can support stress and sleep.',
      })
    }
  })

  return goals.slice(0, 5)
}

function getCoachMessage({ completedCount, totalGoals }) {
  if (totalGoals === 0) {
    return 'Your coach is ready when you are. Add a few habits to start tracking progress.'
  }

  if (completedCount === totalGoals) {
    return 'Strong work today. You completed every coach goal, which is exactly how small habits become momentum.'
  }

  if (completedCount > 0) {
    return `Nice progress. You completed ${completedCount} of ${totalGoals} coach goals today, so keep the next step small and repeatable.`
  }

  return 'Build healthy habits one step at a time.'
}


function getDisplayName(member) {
  if (member.isPlaceholder) {
    return 'You (Self)'
  }

  return member.name || member.relationship
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
  if (member.isPlaceholder) {
    return 'Y'
  }

  return getInitialsFromName(member.name || member.relationship)
}

function ConditionButton({
  conditionName,
  onOpenConditionDetails,
  className = 'illness-pill',
}) {
  return (
    <button
      className={`condition-button ${className}`}
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpenConditionDetails(conditionName)
      }}
    >
      {conditionName}
    </button>
  )
}

function ConditionTag({ conditionName, className = 'illness-pill' }) {
  return <span className={`condition-tag ${className}`}>{conditionName}</span>
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
  helper,
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
        {helper ? <p>{helper}</p> : null}
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
  const displayName = details?.name || conditionName

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
            <p className="eyebrow">Condition details</p>
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
          This information is educational only and is not medical advice. Talk to
          a healthcare professional for medical advice.
        </p>

        {details ? (
          <>
            <section className="condition-overview">
              <h3>What it is</h3>
              <p>{details.overview}</p>
            </section>

            <div className="condition-detail-grid">
              <ConditionDetailList
                title="Common symptoms"
                items={details.symptoms}
              />
              <ConditionDetailList
                title="Major health factors"
                items={details.riskFactors}
              />
              <ConditionDetailList
                title="Prevention tips"
                items={details.preventionTips}
              />

              <section className="condition-detail-section">
                <h3>Typical screening recommendations</h3>
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
              Educational information for this condition is not available yet.
            </strong>
          </div>
        )}
      </section>
    </div>
  )
}

function formatEventDateTime(startsAt) {
  const eventDate = new Date(startsAt)

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    weekday: 'long',
  }).format(eventDate)
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
  const matchingSuggestionGroups = illnessCategories
    .map((category) => {
      const categoryMatches =
        normalizedInput !== '' &&
        normalizeIllness(category.name).includes(normalizedInput)
      const matchingIllnesses = category.illnesses.filter((illness) => {
        const illnessKey = getIllnessKey(illness)
        const illnessMatches = normalizeIllness(illness).includes(normalizedInput)

        return (
          !selectedIllnessKeys.includes(illnessKey) &&
          normalizedInput !== '' &&
          (categoryMatches || illnessMatches)
        )
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
      setValidationMessage('Select a condition from the suggestions.')
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
        setValidationMessage('Select a condition from the suggestions.')
      }
    }
  }

  return (
    <>
      <div className="autocomplete">
        <label className="field-group" htmlFor={inputId}>
          <span className="visually-hidden">Search illness or condition</span>
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
                setValidationMessage('Select a condition from the suggestions.')
              }
            }}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleIllnessKeyDown}
            placeholder="Type an illness or condition"
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
                        {illness}
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

      <div className="condition-option-list">
        <button
          className="none-illness-button"
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
          {noListedConditions ? '✓ ' : ''}
          {noListedConditionsLabel}
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
          You can still use the app, but recommendations may not account for
          conditions outside the available database.
        </p>
      ) : null}

      <div className="illness-picker-section">
        <p className="picker-label">Selected:</p>
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
                    aria-label={`Remove ${illness}`}
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

function PatternBadge({ explanation, label, tone }) {
  return (
    <span
      className={`pattern-badge pattern-badge-${tone}`}
      title={explanation}
    >
      {label}
    </span>
  )
}

function DoctorQuestions({ questions }) {
  return (
    <section className="insight-detail-block">
      <h4>Questions you may want to ask</h4>
      <ul>
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ul>
    </section>
  )
}

function EducationalSource({ sourceName, sourceUrl }) {
  return (
    <section className="insight-detail-block">
      <h4>Educational source</h4>
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
        {sourceName}
      </a>
    </section>
  )
}

function PreventionInsightCard({ insight }) {
  return (
    <details className="prevention-insight-card">
      <summary>
        <span className="insight-summary-copy">
          <strong>{insight.healthArea}</strong>
        </span>
        <PatternBadge
          explanation={insight.evidenceExplanation}
          label={insight.patternLabel}
          tone={insight.tone}
        />
        <span className="view-details-text">View Details</span>
      </summary>

      <div className="insight-expanded-content">
        <section className="insight-detail-block">
          <h4>Why this appears</h4>
          <ul>
            {insight.whyItAppears.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        <section className="insight-detail-block">
          <h4>What you can consider</h4>
          <ul>
            {insight.educationalActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </section>

        <DoctorQuestions questions={insight.doctorQuestions} />
        <EducationalSource
          sourceName={insight.sourceName}
          sourceUrl={insight.sourceUrl}
        />
      </div>
    </details>
  )
}

function App() {
  const [savedAppState] = useState(loadSavedAppState)
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
  const [familyMembers, setFamilyMembers] = useState(
    savedAppState.familyMembers,
  )
  const [familyMemberName, setFamilyMemberName] = useState(
    savedAppState.familyMemberName,
  )
  const [relationship, setRelationship] = useState(savedAppState.relationship)
  const [selectedIllnesses, setSelectedIllnesses] = useState(
    savedAppState.selectedIllnesses,
  )
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
  const [activeConditionName, setActiveConditionName] = useState(null)
  const [manualLocation, setManualLocation] = useState(
    savedAppState.manualLocation,
  )
  const [userCoordinates, setUserCoordinates] = useState(
    savedAppState.userCoordinates,
  )
  const [locationStatus, setLocationStatus] = useState(
    savedAppState.locationStatus,
  )
  const [locationMessage, setLocationMessage] = useState(
    savedAppState.locationMessage,
  )
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isFamilyFormOpen, setIsFamilyFormOpen] = useState(false)
  const [activeFamilyMenuId, setActiveFamilyMenuId] = useState(null)
  const [selectedWeeklyEventId, setSelectedWeeklyEventId] = useState('')

  const selfTreeNode = userProfile
    ? {
        ...userProfile,
        relationship: 'Self',
      }
    : {
        id: 'self-placeholder',
        relationship: 'Self',
        name: 'You',
        illnesses: [],
        isPlaceholder: true,
        isSelf: true,
      }
  const familyHealthSummary = buildFamilyHealthSummary({ familyMembers })
  const profileBmi = calculateBmi(profileForm)
  const preventionProfile = {
    ...userProfile,
    ...profileForm,
    bmi: profileBmi,
    illnesses: profileIllnesses,
  }
  const preventionScore = calculatePreventionScore({
    familyHealthSummary,
    familyMembers,
    profile: preventionProfile,
  })
  const preventionInsights = buildPreventionInsights({
    familyHealthSummary,
    profile: preventionProfile,
  })
  const personalizedPreventionSummary = buildPersonalizedPreventionSummary({
    familyHealthSummary,
    preventionScore,
  })
  const preventionScoreStatus = getPreventionScoreStatus(preventionScore.score)
  const hasPreventionScore = preventionScore.score !== null
  const coachGoals = buildCoachGoals(preventionScore)
  const completedCoachGoals = coachGoals.filter((goal) => habitProgress[goal.id])
  const dashboardActionGoals = coachGoals.slice(0, 3)
  const completedDashboardActionGoals = dashboardActionGoals.filter(
    (goal) => habitProgress[goal.id],
  )
  const coachMessage = getCoachMessage({
    completedCount: completedCoachGoals.length,
    totalGoals: coachGoals.length,
  })
  const activeConditionDetails = activeConditionName
    ? getConditionDetails(activeConditionName)
    : null
  const disclaimerText =
    'This educational tool organizes family history and lifestyle information. It does not provide a diagnosis or replace professional medical advice.'
  const wellnessLocationTarget = getLocationOriginTarget({
    manualLocation,
    userCoordinates,
  })
  const weeklyEvents = buildWeeklyEventRecommendations({
    events: getMockWeeklyEvents(),
    familyMembers,
    locationTarget: wellnessLocationTarget,
    profile: profileForm,
    profileIllnesses,
  })
  const selectedWeeklyEvent =
    weeklyEvents.find((event) => event.id === selectedWeeklyEventId) ||
    weeklyEvents[0] ||
    null
  const weeklyEventMapUrl = selectedWeeklyEvent
    ? buildEventMapEmbedUrl(selectedWeeklyEvent)
    : ''
  function getRelationshipCount(group, ignoredMemberId = null) {
    return familyMembers.filter(
      (member) =>
        member.id !== ignoredMemberId &&
        getRelationshipLimitGroup(member.relationship) === group,
    ).length
  }

  function isRelationshipLimitReached(
    relationshipOption,
    ignoredMemberId = null,
  ) {
    const group = getRelationshipLimitGroup(relationshipOption)

    if (!group) {
      return false
    }

    return getRelationshipCount(group, ignoredMemberId) >= getRelationshipLimit(group)
  }

  function getRelationshipLimitMessage(ignoredMemberId = null) {
    if (getRelationshipCount('parent', ignoredMemberId) >= getRelationshipLimit('parent')) {
      return relationshipLimitMessages.parent
    }

    if (
      getRelationshipCount('grandparent', ignoredMemberId) >=
      getRelationshipLimit('grandparent')
    ) {
      return relationshipLimitMessages.grandparent
    }

    return ''
  }

  const relationshipLimitMessage = getRelationshipLimitMessage(editingFamilyMemberId)
  const grandparentMembers = familyMembers.filter(
    (member) => member.relationship === 'Grandparent',
  )
  const parentMembers = familyMembers.filter(
    (member) => member.relationship === 'Mother' || member.relationship === 'Father',
  )
  const siblingMembers = familyMembers.filter(
    (member) => member.relationship === 'Sibling',
  )
  const hasFamilyHistoryData = hasMeaningfulFamilyHistory(familyMembers)
  const hasLifestyleData = hasEnoughLifestyleAnswers(profileForm, profileIllnesses)
  const hasPersonalizedAssessmentData = hasAssessmentData({
    familyMembers,
    profileForm,
    profileIllnesses,
  })
  const nextIncompleteAssessmentView = !hasFamilyHistoryData
    ? 'family'
    : !hasLifestyleData
      ? 'lifestyle'
      : 'coach'
  const familyGridSections = [
    {
      accent: 'purple',
      addLabel: 'Add Grandparent',
      countLabel: `${grandparentMembers.length} of 4 added`,
      description: 'Up to 4 grandparents',
      id: 'grandparents',
      members: grandparentMembers,
      placeholderRelationship: 'Grandparent',
      showPlaceholder: grandparentMembers.length < 4,
      title: 'Grandparents',
    },
    {
      accent: 'teal',
      addLabel: 'Add Parent',
      countLabel: `${parentMembers.length} of 2 added`,
      description: 'Up to 2 parents',
      id: 'parents',
      members: parentMembers,
      placeholderRelationship: '',
      showPlaceholder: parentMembers.length < 2,
      title: 'Parents',
    },
    {
      accent: 'orange',
      addLabel: 'Add Sibling',
      countLabel: `${siblingMembers.length + (userProfile ? 1 : 0)} added`,
      description: 'You and your siblings',
      id: 'siblings',
      members: [selfTreeNode, ...siblingMembers],
      placeholderRelationship: 'Sibling',
      showPlaceholder: true,
      title: 'You and Siblings',
    },
  ]
  const dashboardSummaryCards = hasPersonalizedAssessmentData
    ? [
        ...(hasPreventionScore
          ? [
              {
                icon: '◎',
                label: 'Prevention Score',
                value: preventionScore.score,
                detail: 'Habits and awareness, not a diagnosis',
              },
            ]
          : []),
        {
          icon: '🔥',
          label: 'Habit Progress',
          value: `${completedCoachGoals.length}/${coachGoals.length}`,
          detail: 'Goals completed today',
        },
        {
          icon: '📅',
          label: 'Weekly Goals',
          value: coachGoals.length,
          detail: coachMessage,
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

  useEffect(() => {
    saveAppState({
      activeView,
      userProfile,
      profileForm,
      profileIllnesses,
      profileIllnessInput,
      profileNoListedConditions,
      profileHasUnlistedCondition,
      familyMembers,
      familyMemberName,
      relationship,
      selectedIllnesses,
      familyEarlyDiagnosis,
      familyDiagnosisAge,
      editingFamilyMemberId,
      habitProgress,
      manualLocation,
      userCoordinates,
      locationStatus,
      locationMessage,
    })
  }, [
    activeView,
    userProfile,
    profileForm,
    profileIllnesses,
    profileIllnessInput,
    profileNoListedConditions,
    profileHasUnlistedCondition,
    familyMembers,
    familyMemberName,
    relationship,
    selectedIllnesses,
    familyEarlyDiagnosis,
    familyDiagnosisAge,
    editingFamilyMemberId,
    habitProgress,
    manualLocation,
    userCoordinates,
    locationStatus,
    locationMessage,
  ])

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

  function openConditionDetails(conditionName) {
    setActiveConditionName(conditionName)
  }

  function changeView(viewId) {
    setActiveView(viewId)
    setIsNavOpen(false)
    setActiveConditionName(null)
    setError('')

    window.requestAnimationFrame(() => {
      document
        .querySelector('.app-shell')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
    setLocationMessage('Waiting for location permission...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationStatus('success')
        setLocationMessage(
          'Location added. Only nearby search terms use this location; family health data stays on your device.',
        )
      },
      () => {
        setLocationStatus('error')
        setLocationMessage(
          'Location permission was not used. You can still enter a city or ZIP code.',
        )
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 10000,
      },
    )
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

  function setFamilyConditionSelection(condition, selected) {
    setSelectedIllnesses((currentIllnesses) => {
      const withoutNoKnown = currentIllnesses.filter(
        (illness) => !isNoIllness(illness),
      )

      if (selected) {
        return addIllnessToList(withoutNoKnown, condition)
      }

      return withoutNoKnown.filter(
        (item) => getIllnessKey(item) !== getIllnessKey(condition),
      )
    })
  }

  function getFamilyConditionsForSave() {
    const listedConditions = selectedIllnesses.filter((illness) =>
      familyHistoryConditionOptions.some(
        (condition) => getIllnessKey(condition) === getIllnessKey(illness),
      ),
    )

    return listedConditions.length > 0
      ? listedConditions
      : [noKnownConditionsLabel]
  }

  function resetFamilyForm(defaultRelationship = '') {
    setFamilyMemberName('')
    setRelationship(defaultRelationship)
    setSelectedIllnesses([])
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setError('')
  }

  function openAddFamilyMember(defaultRelationship = '') {
    resetFamilyForm(defaultRelationship)
    setSuccessMessage('')
    setActiveFamilyMenuId(null)
    setIsFamilyFormOpen(true)
  }

  function openEditFamilyMember(member) {
    const listedConditions = member.illnesses.filter((illness) =>
      familyHistoryConditionOptions.some(
        (condition) => getIllnessKey(condition) === getIllnessKey(illness),
      ),
    )

    setFamilyMemberName(member.name || '')
    setRelationship(member.relationship)
    setSelectedIllnesses(listedConditions)
    setFamilyEarlyDiagnosis(Boolean(member.earlyDiagnosis))
    setFamilyDiagnosisAge(member.diagnosisAge || '')
    setEditingFamilyMemberId(member.id)
    setError('')
    setSuccessMessage('')
    setActiveFamilyMenuId(null)
    setIsFamilyFormOpen(true)
  }

  function closeFamilyForm() {
    resetFamilyForm()
    setIsFamilyFormOpen(false)
  }

  function saveProfileData(message = 'Profile saved.') {
    setUserProfile({
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
    })
    setSuccessMessage(message)
  }

  function saveProfile(event) {
    event.preventDefault()
    saveProfileData('Profile saved.')
  }

  function addFamilyMember(event) {
    event.preventDefault()

    if (!relationship) {
      setError('Choose a relationship before adding a family member.')
      return
    }

    if (isRelationshipLimitReached(relationship, editingFamilyMemberId)) {
      const group = getRelationshipLimitGroup(relationship)
      setError(relationshipLimitMessages[group])
      return
    }

    const familyConditions = getFamilyConditionsForSave()

    if (editingFamilyMemberId) {
      setFamilyMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === editingFamilyMemberId
            ? {
                ...member,
                name: familyMemberName.trim(),
                relationship,
                illnesses: familyConditions,
                earlyDiagnosis: familyEarlyDiagnosis,
                diagnosisAge: familyDiagnosisAge,
              }
            : member,
        ),
      )
      setSuccessMessage('Family member updated.')
    } else {
      setFamilyMembers((currentMembers) => [
        ...currentMembers,
        {
          id: createId(),
          name: familyMemberName.trim(),
          relationship,
          illnesses: familyConditions,
          earlyDiagnosis: familyEarlyDiagnosis,
          diagnosisAge: familyDiagnosisAge,
        },
      ])
      setSuccessMessage('Family member added.')
    }

    setFamilyMemberName('')
    setRelationship('')
    setSelectedIllnesses([])
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setIsFamilyFormOpen(false)
    setError('')
  }

  function removeFamilyMember(memberId) {
    const confirmed = window.confirm('Remove this family member?')

    if (!confirmed) {
      return
    }

    setFamilyMembers((currentMembers) =>
      currentMembers.filter((member) => member.id !== memberId),
    )

    setActiveFamilyMenuId(null)
  }

  function handleStartOver() {
    const confirmed = window.confirm(
      'Start over and clear your profile, family history, and results?',
    )

    if (!confirmed) {
      return
    }

    clearSavedAppState()
    setActiveView('dashboard')
    setUserProfile(null)
    setProfileForm(initialProfileForm)
    setProfileIllnesses([])
    setProfileIllnessInput('')
    setFamilyMembers([])
    setFamilyMemberName('')
    setRelationship('')
    setSelectedIllnesses([])
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setError('')
    setSuccessMessage('')
    setHabitProgress({})
    setActiveConditionName(null)
    setManualLocation('')
    setUserCoordinates(null)
    setLocationStatus('idle')
    setLocationMessage('')
    setProfileNoListedConditions(false)
    setProfileHasUnlistedCondition(false)
    setIsFamilyFormOpen(false)
    setActiveFamilyMenuId(null)
  }

  function goToNextStep() {
    if (activeView === 'family' || activeView === 'lifestyle') {
      saveProfileData('Progress saved.')
    }

    changeView(continueTarget)
  }

  function goToPreviousStep() {
    if (previousWorkflowStep) {
      changeView(previousWorkflowStep.id)
    }
  }

  function toggleHabitGoal(goalId) {
    setHabitProgress((currentProgress) => ({
      ...currentProgress,
      [goalId]: !currentProgress[goalId],
    }))
  }

  return (
    <div className="app-layout">
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

      <aside
        className={`app-sidebar${isNavOpen ? ' open' : ''}`}
        id="app-sidebar"
        aria-label="Family health dashboard"
      >
        <button
          className="sidebar-brand"
          type="button"
          aria-label="Go to Dashboard"
          onClick={() => changeView('dashboard')}
        >
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <div>
            <strong>Family Health</strong>
            <span>Your data stays on your device.</span>
          </div>
        </button>

        <nav className="view-tabs" aria-label="Family health views">
          {viewTabs.map((tab) => (
            <button
              className={activeView === tab.id ? 'view-tab active' : 'view-tab'}
              key={tab.id}
              type="button"
              onClick={() => changeView(tab.id)}
            >
              <span className="nav-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main
        className={
          activeView === 'dashboard'
            ? 'app-shell dashboard-shell'
            : 'app-shell inner-shell'
        }
      >
        {activeView === 'dashboard' ? (
          <header className="app-hero">
            <div className="app-hero-copy">
              <p className="eyebrow">Family health history</p>
              <h1>
                <span>Know Your Family History.</span>
                <span>Take Control of Your Health.</span>
              </h1>
              <p className="app-subtitle">
                Build your family health profile to discover inherited health
                patterns, understand possible prevention topics, and receive
                personalized educational insights.
              </p>
            </div>

            <div className="hero-actions">
              <button
                className="primary-action hero-primary-action"
                type="button"
                onClick={() => changeView('family')}
              >
                Continue Your Assessment
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="trust-indicators" aria-label="Trust indicators">
              <article className="trust-badge">
                <span className="trust-icon" aria-hidden="true">
                  🧬
                </span>
                <div>
                  <strong>Family History</strong>
                  <p>
                    Understand patterns that may be important to discuss with
                    your healthcare provider.
                  </p>
                </div>
              </article>
              <article className="trust-badge">
                <span className="trust-icon" aria-hidden="true">
                  💡
                </span>
                <div>
                  <strong>Actionable</strong>
                  <p>Small, practical prevention steps you can start today.</p>
                </div>
              </article>
              <article className="trust-badge">
                <span className="trust-icon" aria-hidden="true">
                  🎯
                </span>
                <div>
                  <strong>Personalized</strong>
                  <p>Guidance tailored to your family history and lifestyle.</p>
                </div>
              </article>
            </div>
          </header>
        ) : null}

        {activeView === 'family' ? (
          <header className="page-intro">
            <h1>Family Health History</h1>
            <p>Add your family members and their health conditions.</p>
          </header>
        ) : null}

        {activeView === 'lifestyle' ? (
          <header className="page-intro">
            <h1>Lifestyle Assessment</h1>
            <p>
              Tell us about your daily habits to personalize your prevention
              plan.
            </p>
          </header>
        ) : null}

        {activeView === 'coach' ? (
          <header className="page-intro">
            <h1>AI Prevention Coach</h1>
            <p>
              Review your personalized prevention score, healthy habits, and
              action plan.
            </p>
          </header>
        ) : null}

        <section className="privacy-banner" aria-label="Privacy">
          <div>
            <p className="eyebrow">Privacy</p>
            <p>
              Your data stays on your device. This app does not send your family
              health history to a server.
            </p>
          </div>
          <button className="danger-action" type="button" onClick={handleStartOver}>
            Start Over
          </button>
        </section>

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

      {activeView === 'dashboard' ? (
        <section className="dashboard-panel" aria-labelledby="dashboard-title">
          <div className="dashboard-welcome-card">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1 id="dashboard-title">Good afternoon!</h1>
              <p>
                Continue your prevention journey with family history, lifestyle
                habits, local actions, and your AI Prevention Coach.
              </p>
            </div>
          </div>

          <section className="today-actions-card" aria-labelledby="today-actions-title">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">
                  {hasPersonalizedAssessmentData
                    ? 'Personalized daily plan'
                    : 'General wellness actions'}
                </p>
                <h2 id="today-actions-title">Today's Healthy Actions</h2>
                <p>Build healthy habits one step at a time.</p>
              </div>
              <button
                className="secondary-action"
                type="button"
                onClick={() => changeView('coach')}
              >
                Open Coach <span aria-hidden="true">→</span>
              </button>
            </div>

            <p className="today-actions-progress">
              {completedDashboardActionGoals.length} of {dashboardActionGoals.length}{' '}
              completed
            </p>

            <ul className="today-action-list">
              {dashboardActionGoals.map((goal) => (
                <li key={goal.id}>
                  <label className="today-action-row">
                    <input
                      type="checkbox"
                      checked={Boolean(habitProgress[goal.id])}
                      onChange={() => toggleHabitGoal(goal.id)}
                    />
                    <span className="today-action-check" aria-hidden="true" />
                    <span>
                      <strong>{goal.label}</strong>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="dashboard-assessment-card">
            <div>
              <h2>
                {hasPersonalizedAssessmentData
                  ? 'Continue your assessment'
                  : 'Start your health profile'}
              </h2>
              <p>
                {hasPersonalizedAssessmentData
                  ? 'Complete your family history and lifestyle profile.'
                  : 'Add your family history and lifestyle information to receive personalized prevention insights and daily recommendations.'}
              </p>
            </div>
            <button
              className="primary-action"
              type="button"
              onClick={() => changeView(nextIncompleteAssessmentView)}
            >
              {hasPersonalizedAssessmentData ? 'Continue Your Assessment' : 'Begin Assessment'}
              <span aria-hidden="true">→</span>
            </button>
          </section>

          {hasPersonalizedAssessmentData ? (
            <>
              <div className="dashboard-summary-grid">
                {dashboardSummaryCards.map((card) => (
                  <article className="dashboard-summary-card" key={card.label}>
                    <span className="card-topline">
                      <span className="card-icon" aria-hidden="true">
                        {card.icon}
                      </span>
                      <span>{card.label}</span>
                    </span>
                    <strong>{card.value}</strong>
                    <p>{card.detail}</p>
                  </article>
                ))}
              </div>

              <div className="dashboard-content-grid">
                <section className="insight-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">Family Insights</p>
                      <h2>What your profile shows</h2>
                    </div>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => changeView('coach')}
                    >
                      Learn More <span aria-hidden="true">→</span>
                    </button>
                  </div>
                  <p>{personalizedPreventionSummary}</p>
                </section>

                <section className="insight-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">Priorities</p>
                      <h2>Top Health Priorities</h2>
                    </div>
                  </div>

                  <ul className="dashboard-attention-list">
                    {preventionScore.topPriorities.length > 0 ? (
                      preventionScore.topPriorities.map((priority) => (
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
                            <strong>Open Coach</strong>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="category-empty-note">
                        No top health priorities are highlighted from the current
                        entries.
                      </li>
                    )}
                  </ul>
                </section>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeView === 'family' ? (
        <section className="profile-panel" aria-labelledby="profile-title">
          <div className="current-health-heading">
            <h2 className="panel-title" id="profile-title">Current Health</h2>
            <p>
              Do you currently have any of these conditions? Choose None of the
              conditions listed if no current conditions apply.
            </p>
          </div>

          <form className="profile-form" onSubmit={saveProfile} noValidate>
            <section className="profile-form-section">
              <div>
                <p className="eyebrow">Basic Information</p>
                <h2>About you</h2>
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

              <div className="body-measure-grid">
                <label className="field-group" htmlFor="profile-height-feet">
                  Height feet
                  <input
                    id="profile-height-feet"
                    type="number"
                    min="0"
                    value={profileForm.heightFeet}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        heightFeet: event.target.value,
                      }))
                    }
                    placeholder="5"
                  />
                </label>

                <label className="field-group" htmlFor="profile-height-inches">
                  Height inches
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
                    placeholder="8"
                  />
                </label>

                <label className="field-group" htmlFor="profile-weight">
                  Weight
                  <input
                    id="profile-weight"
                    type="number"
                    min="0"
                    value={profileForm.weight}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        weight: event.target.value,
                      }))
                    }
                    placeholder="Pounds"
                  />
                </label>

                <div className="bmi-card" aria-live="polite">
                  <span>BMI</span>
                  <strong>{profileBmi || '--'}</strong>
                  <p>{getBmiCategory(profileBmi)}</p>
                </div>
              </div>
            </section>

            <section className="profile-form-section">
              <div>
                <h2>Known health factors</h2>
              </div>

              <div className="lifestyle-grid">
                <label className="field-group" htmlFor="profile-known-bp">
                  Known high blood pressure
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
                  Known high cholesterol
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
                  Prediabetes or diabetes status
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
              <legend>Current conditions</legend>
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
              This optional profile is used only to personalize educational
              insights and prevention suggestions. It is not a medical diagnosis.
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

      {activeView === 'family' ? (
        <>
          <section className="family-tree-panel family-grid-panel" aria-labelledby="tree-title">
            <div className="family-grid-heading">
              <div>
                <p className="eyebrow">Family history</p>
                <h1 id="tree-title">Family Health Tree</h1>
                <p className="page-description">
                  Add your family members and their health conditions.
                </p>
              </div>
              <button
                className="primary-action family-grid-add"
                type="button"
                onClick={() => openAddFamilyMember()}
              >
                + Add Family Member
              </button>
            </div>

            <div className="family-grid-stack">
              {familyGridSections.map((section) => (
                <section
                  className={`family-generation-section family-generation-${section.accent}`}
                  key={section.id}
                  aria-labelledby={`${section.id}-title`}
                >
                  <div className="generation-heading">
                    <div>
                      <h2 id={`${section.id}-title`}>{section.title}</h2>
                      <p>{section.description}</p>
                    </div>
                    <span className="member-count">{section.countLabel}</span>
                  </div>

                  <div className={`family-grid family-grid-${section.id}`}>
                    {section.members.map((member) => {
                      const visibleConditions =
                        member.illnesses.length > 0
                          ? member.illnesses.slice(0, 2)
                          : [noKnownConditionsLabel]
                      const hiddenConditionCount = Math.max(
                        0,
                        member.illnesses.length - visibleConditions.length,
                      )
                      const cardAccent = member.isSelf ? 'blue' : section.accent

                      return (
                        <article
                          className={`family-profile-card family-profile-${cardAccent}${
                            member.isSelf ? ' self-card' : ''
                          }`}
                          key={member.id}
                        >
                          <button
                            className="family-profile-main"
                            type="button"
                            onClick={() =>
                              member.isSelf
                                ? changeView('lifestyle')
                                : openEditFamilyMember(member)
                            }
                          >
                            <span className="family-avatar" aria-hidden="true">
                              {getTreeInitials(member)}
                            </span>
                            <span className="family-profile-copy">
                              <span className="family-profile-title-row">
                                <strong>{getDisplayName(member)}</strong>
                                {member.isSelf ? (
                                  <span className="you-badge">You</span>
                                ) : null}
                              </span>
                              <span className="family-profile-role">
                                {member.isSelf ? 'You' : member.relationship}
                              </span>
                              {member.diagnosisAge ? (
                                <span className="family-profile-diagnosis">
                                  Diagnosed around age {member.diagnosisAge}
                                </span>
                              ) : null}
                              <span className="family-condition-row">
                                {visibleConditions.map((illness) => (
                                  <span className="family-condition-chip" key={illness}>
                                    {illness}
                                  </span>
                                ))}
                                {hiddenConditionCount > 0 ? (
                                  <span className="family-condition-chip more-chip">
                                    +{hiddenConditionCount} more
                                  </span>
                                ) : null}
                              </span>
                            </span>
                          </button>

                          <div className="family-card-menu-wrap">
                            <button
                              className="family-card-menu-button"
                              type="button"
                              aria-label={`Open actions for ${getDisplayName(member)}`}
                              aria-expanded={activeFamilyMenuId === member.id}
                              onClick={() =>
                                setActiveFamilyMenuId((currentId) =>
                                  currentId === member.id ? null : member.id,
                                )
                              }
                            >
                              ⋯
                            </button>
                            {activeFamilyMenuId === member.id ? (
                              <div className="family-card-menu">
                                <button
                                  type="button"
                                  onClick={() =>
                                    member.isSelf
                                      ? changeView('lifestyle')
                                      : openEditFamilyMember(member)
                                  }
                                >
                                  {member.isSelf ? 'Edit profile' : 'Edit'}
                                </button>
                                {!member.isSelf && !member.isPlaceholder ? (
                                  <button
                                    className="danger-menu-item"
                                    type="button"
                                    onClick={() => removeFamilyMember(member.id)}
                                  >
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </article>
                      )
                    })}

                    {section.showPlaceholder ? (
                      <button
                        className={`family-add-placeholder family-add-${section.accent}`}
                        type="button"
                        onClick={() =>
                          openAddFamilyMember(section.placeholderRelationship)
                        }
                      >
                        <span aria-hidden="true">+</span>
                        <strong>{section.addLabel}</strong>
                      </button>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>

            <div className="family-grid-privacy">
              <strong>Your information is private and secure</strong>
              <span>
                Your family health history is stored locally on your device.
              </span>
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
                    <p className="eyebrow">Family history</p>
                    <h2 id="form-title">
                      {editingFamilyMemberId
                        ? 'Edit family member'
                        : 'Add a family member'}
                    </h2>
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
                    Name or nickname
                    <input
                      id="family-member-name"
                      type="text"
                      value={familyMemberName}
                      onChange={(event) => setFamilyMemberName(event.target.value)}
                      placeholder="Optional"
                    />
                    <span className="helper-text">
                      Optional. Use relationship only if you prefer.
                    </span>
                  </label>

                  <label className="field-group" htmlFor="relationship">
                    Relationship
                    <select
                      id="relationship"
                      value={relationship}
                      onChange={(event) => {
                        setRelationship(event.target.value)
                        setError('')
                      }}
                      required
                    >
                      <option value="">Choose one</option>
                      {relationships.map((relationshipOption) => (
                        <option
                          disabled={isRelationshipLimitReached(
                            relationshipOption,
                            editingFamilyMemberId,
                          )}
                          key={relationshipOption}
                          value={relationshipOption}
                        >
                          {relationshipOption}
                        </option>
                      ))}
                    </select>
                    {relationshipLimitMessage ? (
                      <span className="limit-message">
                        {relationshipLimitMessage}
                      </span>
                    ) : null}
                  </label>

                  <fieldset className="illness-fieldset">
                    <legend>Family-history conditions</legend>
                    <p className="helper-text">
                      Mark Yes for each condition this relative has had. If none
                      are selected, this entry will save as No known conditions.
                    </p>
                    <div className="condition-toggle-list">
                      {familyHistoryConditionOptions.map((condition) => {
                        const isSelected = selectedIllnesses.some(
                          (illness) =>
                            getIllnessKey(illness) === getIllnessKey(condition),
                        )

                        return (
                          <div className="condition-toggle-row" key={condition}>
                            <span>{condition}</span>
                            <div
                              className="yes-no-toggle"
                              aria-label={`${condition} condition status`}
                            >
                              <button
                                className={isSelected ? 'active' : ''}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() =>
                                  setFamilyConditionSelection(condition, true)
                                }
                              >
                                Yes
                              </button>
                              <button
                                className={!isSelected ? 'active' : ''}
                                type="button"
                                aria-pressed={!isSelected}
                                onClick={() =>
                                  setFamilyConditionSelection(condition, false)
                                }
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </fieldset>

                  <label className="checkbox-card" htmlFor="family-early-diagnosis">
                    <input
                      id="family-early-diagnosis"
                      type="checkbox"
                      checked={familyEarlyDiagnosis}
                      onChange={(event) =>
                        setFamilyEarlyDiagnosis(event.target.checked)
                      }
                    />
                    <span>
                      This relative was diagnosed at an unusually young age.
                    </span>
                  </label>

                  <label className="field-group" htmlFor="family-diagnosis-age">
                    Age at diagnosis, if known
                    <input
                      id="family-diagnosis-age"
                      type="number"
                      min="0"
                      value={familyDiagnosisAge}
                      onChange={(event) =>
                        setFamilyDiagnosisAge(event.target.value)
                      }
                      placeholder="Example: 42"
                    />
                    <span className="helper-text">
                      Optional. This helps explain early family-history signals.
                    </span>
                  </label>

                  <p className="form-error" role="alert" aria-live="polite">
                    {error}
                  </p>

                  <button className="primary-action" type="submit">
                    <span aria-hidden="true" className="button-icon">
                      +
                    </span>
                    {editingFamilyMemberId
                      ? 'Update family member'
                      : 'Add family member'}{' '}
                    <span aria-hidden="true">→</span>
                  </button>
                </form>
              </aside>
            </div>
          ) : null}
        </>
      ) : null}

      {activeView === 'lifestyle' ? (
        <>
        <section className="profile-panel" aria-labelledby="lifestyle-title">
          <h2 className="panel-title" id="lifestyle-title">Daily habits</h2>

          <div className="flow-card-grid">
            <QuestionCard
              helper="Small, realistic changes are easier to maintain."
              title="Weekly exercise frequency"
            >
              <ChoiceButtons
                label="Weekly exercise frequency"
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

            <QuestionCard
              helper="Used only for educational prevention suggestions."
              title="Daily fruit and vegetable intake"
            >
              <ChoiceButtons
                label="Daily fruit and vegetable intake"
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

            <QuestionCard title="Smoking or vaping status">
              <ChoiceButtons
                label="Smoking or vaping status"
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

            <QuestionCard title="Alcohol frequency">
              <ChoiceButtons
                label="Alcohol frequency"
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

            <QuestionCard title="Sleep duration">
              <ChoiceButtons
                label="Sleep duration"
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

            <QuestionCard title="Diet quality">
              <ChoiceButtons
                label="Diet quality"
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

            <QuestionCard title="Water intake">
              <ChoiceButtons
                label="Water intake"
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

            <QuestionCard title="Sugary drink consumption">
              <ChoiceButtons
                label="Sugary drink consumption"
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

            <QuestionCard title="Stress level">
              <ChoiceButtons
                label="Stress level"
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

            <QuestionCard title="Screen time">
              <ChoiceButtons
                label="Screen time"
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

            <QuestionCard
              helper="Choose what fits. The app does not decide what screenings you need."
              title="Preventive screenings"
            >
              <ChoiceButtons
                label="Preventive screenings"
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
          <div className="page-heading dashboard-heading">
            <div>
              <p className="eyebrow">Prevention journey</p>
              <h1 id="score-title">AI Prevention Coach</h1>
              <p className="page-description">
                Build healthier habits through personalized goals,
                encouragement, and prevention insights.
              </p>
            </div>
          </div>

          <section className="coach-daily-panel" aria-labelledby="daily-coach-title">
            <div className="coach-daily-header">
              <div>
                <p className="eyebrow">Weekly encouragement</p>
                <h2 id="daily-coach-title">{coachMessage}</h2>
              </div>
              <button
                className="secondary-action"
                type="button"
                onClick={() =>
                  document
                    .querySelector('#wellness-recommendations-title')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              >
                See This Week <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="coach-daily-grid">
              <section className="coach-card compact-coach-card">
                <p className="eyebrow">Today's goals</p>
                <ul className="habit-list">
                  {coachGoals.map((goal) => (
                    <li key={goal.id}>
                      <label className="habit-check compact">
                        <input
                          type="checkbox"
                          checked={Boolean(habitProgress[goal.id])}
                          onChange={() => toggleHabitGoal(goal.id)}
                        />
                        <span>
                          <strong>{goal.label}</strong>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="coach-card compact-coach-card">
                <p className="eyebrow">Progress</p>
                <h2>Habit progress</h2>
                <ProgressBar
                  label="Daily goal progress"
                  value={
                    coachGoals.length
                      ? Math.round((completedCoachGoals.length / coachGoals.length) * 100)
                      : 0
                  }
                />
                <div className="coach-chart compact" aria-label="Daily goal progress">
                  {coachGoals.map((goal) => (
                    <span
                      className={habitProgress[goal.id] ? 'complete' : ''}
                      key={goal.id}
                      title={goal.label}
                    />
                  ))}
                </div>
                <p>
                  {completedCoachGoals.length} of {coachGoals.length} goals
                  completed today.
                </p>
              </section>
            </div>
          </section>

          {hasPersonalizedAssessmentData ? (
            <>
              <section
                className="score-ring-card compact-score-card"
                aria-labelledby="prevention-score-heading"
              >
                {hasPreventionScore ? (
                  <div className="compact-score-layout">
                    <div
                      className="score-ring"
                      style={{
                        '--score': `${preventionScore.score}%`,
                        '--score-color': preventionScoreStatus.tone,
                      }}
                      aria-label={`Prevention score ${preventionScore.score} out of 100, ${preventionScoreStatus.label}`}
                    >
                      <span>{preventionScore.score}</span>
                      <small>/100</small>
                    </div>
                    <div className="score-title-stack">
                      <h2 id="prevention-score-heading">Prevention Health Score</h2>
                      <span
                        className={`score-status-badge ${preventionScoreStatus.className}`}
                      >
                        {preventionScoreStatus.label}
                      </span>
                      <p>
                        A higher score reflects stronger prevention habits and
                        family-health awareness.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="score-title-stack">
                    <h2 id="prevention-score-heading">Prevention Health Score</h2>
                    <p>Complete your health profile to calculate your score.</p>
                  </div>
                )}
              </section>

              <section className="prevention-insights-section" aria-labelledby="insights-title">
                <div className="section-heading-row">
                  <div>
                    <h2 id="insights-title">Prevention Insights</h2>
                    <p>
                      Your three most relevant family-health patterns are shown
                      below. These insights are educational and are not a diagnosis.
                    </p>
                  </div>
                </div>

                <div className="prevention-insight-list">
                  {preventionInsights.length > 0 ? (
                    preventionInsights.map((insight) => (
                      <PreventionInsightCard insight={insight} key={insight.id} />
                    ))
                  ) : (
                    <p className="helper-text">
                      Add family health history to reveal your most relevant
                      family-health patterns.
                    </p>
                  )}
                </div>
              </section>
            </>
          ) : (
            <section className="dashboard-assessment-card">
              <div>
                <h2>Start your health profile</h2>
                <p>
                  Add your family history and lifestyle information to unlock
                  your Prevention Score, insights, and personalized local actions.
                </p>
              </div>
              <button
                className="primary-action"
                type="button"
                onClick={() => changeView(nextIncompleteAssessmentView)}
              >
                Begin Assessment <span aria-hidden="true">→</span>
              </button>
            </section>
          )}
        </section>
      ) : null}

      {activeView === 'coach' ? (
        <section className="wellness-panel" aria-labelledby="wellness-recommendations-title">
          <section className="location-card" aria-labelledby="location-title">
            <div>
              <p className="eyebrow">Location</p>
              <h2 id="location-title">Find resources near you</h2>
              <p>
                Use your current location, or enter a city or ZIP code. Maps
                searches use only the activity type and location, not your family
                history.
              </p>
            </div>

            <div className="location-controls">
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
                  type="text"
                  value={manualLocation}
                  onChange={(event) => {
                    setManualLocation(event.target.value)
                    if (event.target.value.trim()) {
                      setLocationMessage('Using your manually entered location.')
                      setLocationStatus('manual')
                    }
                  }}
                  placeholder="Example: Oakland, CA or 94612"
                />
              </label>
            </div>

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

          {hasPersonalizedAssessmentData ? (
            <>
              <div className="wellness-layout">
                <section
                  className="wellness-recommendations"
                  aria-labelledby="wellness-recommendations-title"
                >
                  <div className="section-heading-row">
                    <div>
                      <h2 id="wellness-recommendations-title">
                        This Week Near You
                      </h2>
                      <p>
                        Upcoming community health opportunities matched to your
                        family history and lifestyle profile.
                      </p>
                    </div>
                  </div>

                  {weeklyEvents.length === 0 ? (
                    <p className="helper-text">
                      Complete your health profile to receive personalized weekly
                      health opportunities.
                    </p>
                  ) : (
                    <div className="weekly-event-list">
                      {weeklyEvents.map((event) => (
                        <article
                          className={`weekly-event-card${
                            selectedWeeklyEvent?.id === event.id ? ' selected' : ''
                          }`}
                          key={event.id}
                        >
                          <div className="weekly-event-topline">
                            <span
                              className="wellness-recommendation-icon"
                              aria-hidden="true"
                            >
                              {event.icon}
                            </span>
                            <div>
                              <h3>{event.title}</h3>
                              <p>{formatEventDateTime(event.startsAt)}</p>
                            </div>
                          </div>

                          <div className="weekly-event-meta">
                            <span>{event.location}</span>
                            <span>
                              {event.cost} • {event.distance}
                            </span>
                          </div>

                          <p className="weekly-event-reason">
                            {event.recommendationReason}
                          </p>

                          <div className="weekly-event-actions">
                            {event.hasLocation ? (
                              <a
                                className="primary-action"
                                href={event.directionsUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setSelectedWeeklyEventId(event.id)}
                              >
                                Get Directions <span aria-hidden="true">→</span>
                              </a>
                            ) : (
                              <button
                                className="secondary-action"
                                type="button"
                                disabled
                              >
                                Location unavailable
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {selectedWeeklyEvent ? (
                  <section
                    className="wellness-map-card"
                    aria-labelledby="wellness-map-title"
                  >
                    <div>
                      <p className="eyebrow">Map</p>
                      <h2 id="wellness-map-title">
                        {selectedWeeklyEvent.title}
                      </h2>
                      <p>
                        Select Get Directions on an event to update this shared
                        map.
                      </p>
                    </div>

                    <div className="wellness-map-frame">
                      <iframe
                        src={weeklyEventMapUrl}
                        title="Nearby weekly health event map"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    <a
                      className="secondary-action map-action"
                      href={selectedWeeklyEvent.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Google Maps <span aria-hidden="true">→</span>
                    </a>
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

      {activeView !== 'dashboard' ? (
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
            onClick={() => {
              if (finishTarget) {
                changeView(finishTarget)
                return
              }

              goToNextStep()
            }}
          >
            {finishTarget ? 'Finish' : 'Continue'}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : null}

      <p className="app-disclaimer">{disclaimerText}</p>

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
