import { useEffect, useMemo, useState } from 'react'
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
import { getParksNearZip } from './parkResources'
import {
  getStagedResourceSearch,
  getUserResourcePriorities,
} from './resourcePersonalization'
import {
  getClosestSupportedZipForCoordinates,
  getCityForZip,
  isSupportedZip,
} from './zipCodeMap'

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
const legacyDiabetesLabel = ['type', '2', 'diabetes'].join(' ')
const familyHistoryConditionOptions = [
  'Heart disease',
  'High blood pressure',
  'High cholesterol',
  'Diabetes',
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
]

const starterIllnesses = illnessCategories.flatMap((category) => category.illnesses)

const guidedSteps = [
  {
    id: 'dashboard',
    label: 'My Profile',
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
const assessmentTransitionDuration = 850
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
  { id: 'dashboard', icon: '⌂', label: 'My Profile' },
  { id: 'family', icon: '☷', label: 'Family Health History' },
  { id: 'lifestyle', icon: '◌', label: 'Lifestyle Assessment' },
  { id: 'coach', icon: '✧', label: 'AI Prevention Coach' },
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
  'Diabetes',
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

function sanitizeActiveView(value) {
  if (viewTabs.some((tab) => tab.id === value)) {
    return value
  }

  return legacyViewMap[value] || 'dashboard'
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
    return event.platform ? `Virtual event · ${event.platform}` : 'Virtual event'
  }

  if (event?.attendanceMode === 'hybrid') {
    return 'Hybrid event · Online and in person'
  }

  if (
    event?.locationName &&
    event?.city &&
    normalizeCity(event.locationName) !== normalizeCity(event.city)
  ) {
    return `In-person event · ${event.locationName} · ${event.city}`
  }

  return event?.city || event?.locationName
    ? `In-person event · ${event.city || event.locationName}`
    : 'In-person event'
}

function getEventLocationActionLabel(event) {
  if (isOnlineEvent(event)) {
    return ''
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
    event.eventMatchReason ||
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

function buildLocationMapEmbedUrl(activeLocation) {
  const locationTarget = getLocationOriginTarget(activeLocation)

  if (!locationTarget) {
    return ''
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(
    locationTarget,
  )}&output=embed`
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
    events: cityEvents,
    includeFallbackSections: false,
    includeTrustedOrganizations: false,
    originLocation: activeLocation.source === 'current-location'
      ? activeLocation
      : null,
    parks: getParksNearZip(searchedZipCode),
    priorities: resourcePriorities,
    zipCode: searchedZipCode,
  })
  const onlineSearchResult = getStagedResourceSearch({
    events: onlineEvents,
    includeFallbackSections: false,
    includeGeneralPreventiveResources: false,
    includeTrustedOrganizations: true,
    originLocation: activeLocation.source === 'current-location'
      ? activeLocation
      : null,
    parks: [],
    priorities: resourcePriorities,
    zipCode: searchedZipCode,
  })

  return {
    events: searchResult.resources,
    onlineEvents: onlineSearchResult.resources,
    status: searchResult.resources.length > 0 ? 'mapped-city' : 'supported-empty',
    targetCity,
    zipCode: searchedZipCode,
  }
}

const dailyGoalBank = {
  'blood pressure awareness': [
    'Check your blood pressure if available.',
    'Take a 20-minute walk.',
    'Choose a lower-sodium meal today.',
    'Write down one blood-pressure question for your next visit.',
  ],
  'brain and stroke prevention': [
    'Get regular movement today.',
    'Prioritize 7-9 hours of sleep tonight.',
    'Practice a stress-reduction activity.',
    'Monitor blood pressure if available.',
  ],
  'breast cancer prevention': [
    'Review your family history.',
    'Learn about screening recommendations.',
    'Stay physically active.',
    'Limit alcohol today.',
  ],
  'cardiovascular health': [
    'Take a 20-minute walk.',
    'Check your blood pressure if available.',
    'Choose a heart-healthy meal today.',
    'Read one heart-health prevention tip.',
  ],
  'cholesterol awareness': [
    'Choose a heart-healthy meal today.',
    'Take a 20-minute walk.',
    'Limit saturated fats at one meal.',
    'Read one cholesterol-prevention tip.',
  ],
  'colon cancer prevention': [
    'Eat a fiber-rich meal.',
    'Stay active for 20 minutes.',
    'Learn about colorectal screening.',
    'Update your family history if needed.',
  ],
  'diabetes prevention': [
    'Skip sugary drinks today.',
    'Walk for 20 minutes.',
    'Eat a high-fiber meal.',
    'Check your daily activity goal.',
  ],
  'mental well-being': [
    'Spend 10 minutes relaxing.',
    'Connect with a friend or family member.',
    'Take a short walk.',
    'Maintain a consistent bedtime.',
  ],
  'respiratory health': [
    'Avoid smoke exposure.',
    'Take a walk outdoors if air quality is good.',
    'Stay hydrated.',
    'Monitor recurring breathing symptoms.',
  ],
}

const lifestyleGoalBank = {
  movement: ['Take a 20-minute walk.', 'Check your daily activity goal.'],
  nutrition: ['Add fruit or vegetables to one meal.', 'Eat a high-fiber meal.'],
  screening: [
    'Write one screening question for your next visit.',
    'Review one preventive-care recommendation.',
  ],
  sleep: ['Maintain a consistent bedtime.', 'Prioritize 7-9 hours of sleep tonight.'],
  stress: ['Spend 10 minutes relaxing.', 'Practice a stress-reduction activity.'],
  'sugary-drinks': ['Skip sugary drinks today.', 'Drink one extra glass of water.'],
  tobacco: ['Look up one quit-support resource.', 'Avoid smoke or vape exposure today.'],
}

const fallbackDailyGoals = [
  'Take a 20-minute walk.',
  'Drink one extra glass of water.',
  'Add fruit or vegetables to one meal.',
  'Review your family history.',
]

function getDailyGoalSeed(date = new Date()) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return Math.floor(today.getTime() / 86400000)
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

function getGoalBankForPriority(priority) {
  const labelKey = String(priority?.healthArea || priority?.label || '')
    .trim()
    .toLowerCase()

  return dailyGoalBank[labelKey] || []
}

function addUniqueGoal(goalLabels, label) {
  const normalizedGoal = getGoalSlug(label)

  if (!label || goalLabels.some((goal) => getGoalSlug(goal) === normalizedGoal)) {
    return
  }

  goalLabels.push(label)
}

function buildCoachGoals({ preventionInsights = [], preventionScore = {} }) {
  const seed = getDailyGoalSeed()
  const rankedPriorities = preventionInsights.slice(0, 3)
  const goalLabels = []

  rankedPriorities.forEach((priority, priorityIndex) => {
    const targetCount = priorityIndex === 0 ? 2 : 1
    let selectedForPriority = 0
    const rotatedGoals = rotateGoals(
      getGoalBankForPriority(priority),
      seed + priorityIndex,
    )

    rotatedGoals.slice(0, targetCount + 2).forEach((goal) => {
      const previousGoalCount = goalLabels.length

      if (selectedForPriority < targetCount) {
        addUniqueGoal(goalLabels, goal)
      }

      if (goalLabels.length > previousGoalCount) {
        selectedForPriority += 1
      }
    })
  })

  if (goalLabels.length < 4) {
    preventionScore.topPriorities?.forEach((priority, priorityIndex) => {
      rotateGoals(
        lifestyleGoalBank[priority.id] || [],
        seed + priorityIndex,
      ).forEach((goal) => addUniqueGoal(goalLabels, goal))
    })
  }

  rotateGoals(fallbackDailyGoals, seed).forEach((goal) =>
    addUniqueGoal(goalLabels, goal),
  )

  return goalLabels.slice(0, 4).map((label) => ({
    id: `daily-${getDailyGoalSeed()}-${getGoalSlug(label)}`,
    label,
  }))
}

function getCoachMessage({ completedCount, totalGoals }) {
  if (totalGoals === 0) {
    return 'Your coach is ready when you are. Add a few habits to start tracking progress.'
  }

  if (completedCount === totalGoals) {
    return 'Strong work today. You completed every coach goal, which is exactly how small habits become momentum.'
  }

  if (completedCount > 0) {
    return `Great progress! You've completed ${completedCount} of ${totalGoals} goals today.`
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
        <span className="insight-more-link">
          <span className="more-label">More Info</span>
          <span className="less-label">Less Info</span>
          <span aria-hidden="true">→</span>
        </span>
      </summary>

      <div className="insight-expanded-content">
        <section className="insight-detail-block">
          <h4>Prevention Insight</h4>
          <p>{insight.preventionInsight}</p>
        </section>

        <section className="insight-detail-block">
          <h4>Key Prevention Strategies</h4>
          <ul>
            {insight.strategies.map((strategy) => (
              <li key={strategy}>{strategy}</li>
            ))}
          </ul>
        </section>

        <EducationalSource
          sourceName={insight.sourceName}
          sourceUrl={insight.sourceUrl}
        />
      </div>
    </details>
  )
}

function AssessmentLoadingScreen() {
  return (
    <main className="assessment-loading-screen" aria-live="polite">
      <section className="assessment-loading-content">
        <div className="assessment-loading-copy">
          <p className="eyebrow">Family health history</p>
          <h1>
            <span>Know Your Family History.</span>
            <span>Take Control of Your Health.</span>
          </h1>
          <p>
            Build your family health profile to discover inherited health
            patterns, understand possible prevention topics, and receive
            personalized educational insights.
          </p>
        </div>

        <div className="assessment-loading-highlights">
          <article>
            <span aria-hidden="true">◇</span>
            <strong>Family History</strong>
            <p>
              Understand patterns that may be important to discuss with your
              healthcare provider.
            </p>
          </article>
          <article>
            <span aria-hidden="true">↗</span>
            <strong>Actionable</strong>
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
  const [activeFamilyMenuId, setActiveFamilyMenuId] = useState(null)
  const [selectedWeeklyEvent, setSelectedWeeklyEvent] = useState(null)
  const [expandedEventDescriptions, setExpandedEventDescriptions] = useState({})
  const [weeklyEvents, setWeeklyEvents] = useState([])
  const [weeklyEventsError, setWeeklyEventsError] = useState('')
  const [weeklyEventsStatus, setWeeklyEventsStatus] = useState('loading')
  const [isAssessmentLoading, setIsAssessmentLoading] = useState(false)
  const [assessmentLoadingTarget, setAssessmentLoadingTarget] = useState('family')
  const [dashboardGreeting, setDashboardGreeting] = useState(getGreeting)

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
    profile: preventionProfile,
  })
  const preventionScoreStatus = getPreventionScoreStatus(preventionScore.score)
  const hasPreventionScore = preventionScore.score !== null
  const coachGoals = buildCoachGoals({
    preventionInsights,
    preventionScore,
  })
  const completedCoachGoals = coachGoals.filter((goal) => habitProgress[goal.id])
  const coachMessage = getCoachMessage({
    completedCount: completedCoachGoals.length,
    totalGoals: coachGoals.length,
  })
  const activeConditionDetails = activeConditionName
    ? getConditionDetails(activeConditionName)
    : null
  const disclaimerText =
    'This educational tool organizes family history and lifestyle information. It does not provide a diagnosis or replace professional medical advice.'
  const resourcePriorities = getUserResourcePriorities({
    familyHealthSummary,
    familyMembers,
    preventionScore,
  })
  const selectedEventCity =
    activeLocation.zipCode
      ? getCityForZip(String(activeLocation.zipCode || '').trim())
      : activeLocation.city || ''
  const cityEvents = useMemo(() => {
    if (!selectedEventCity) return []

    return weeklyEvents.filter((event) => {
      if (event.attendanceMode === 'online') return false

      return (
        normalizeCity(getEventCity(event)) ===
        normalizeCity(selectedEventCity)
      )
    })
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
  const displayedWeeklyEvents = weeklyEventFilter.events
  const displayedOnlineEvents = weeklyEventFilter.onlineEvents
  const selectedEvent =
    [...displayedWeeklyEvents, ...displayedOnlineEvents].find(
      (event) => event.id === selectedWeeklyEvent?.id,
    ) ||
    displayedWeeklyEvents[0] ||
    null
  const weeklyEventHeading = weeklyEventFilter.targetCity
    ? `Health events in ${weeklyEventFilter.targetCity}`
    : 'This Week Near You'
  const weeklyEventDescription = weeklyEventFilter.zipCode
    ? weeklyEventFilter.targetCity
      ? `Showing the strongest recommendations for ${weeklyEventFilter.targetCity}.`
      : ''
    : 'Enter a ZIP code to see the top recommendations for your prevention plan.'
  const weeklyEventMapUrl = selectedEvent
    ? buildEventMapEmbedUrl(selectedEvent)
    : buildLocationMapEmbedUrl(activeLocation)

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
                icon: '○',
                label: 'Prevention Score',
                value: preventionScore.score,
                detail: 'Habits and awareness, not a diagnosis',
              },
            ]
          : []),
        {
          icon: '◌',
          label: 'Habit Progress',
          value: `${completedCoachGoals.length}/${coachGoals.length}`,
          detail: 'Goals completed today',
        },
        {
          icon: '□',
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
    const updateGreeting = () => {
      setDashboardGreeting(getGreeting())
    }

    updateGreeting()
    const greetingInterval = window.setInterval(updateGreeting, 60 * 1000)

    return () => window.clearInterval(greetingInterval)
  }, [])

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
      activeLocation,
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
    activeLocation,
    locationStatus,
    locationMessage,
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
    if (!isAssessmentLoading) {
      return undefined
    }

    const finishTimer = window.setTimeout(() => {
      setIsAssessmentLoading(false)
      changeView(assessmentLoadingTarget)
    }, assessmentTransitionDuration)

    return () => {
      window.clearTimeout(finishTimer)
    }
  }, [assessmentLoadingTarget, isAssessmentLoading])

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
    const target =
      nextIncompleteAssessmentView === 'coach'
        ? 'family'
        : nextIncompleteAssessmentView

    startAssessmentTransition(target)
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
    setActiveLocation(defaultSavedState.activeLocation)
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

    startAssessmentTransition(continueTarget)
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

  if (isAssessmentLoading) {
    return <AssessmentLoadingScreen />
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
        aria-label="Family health navigation"
      >
        <button
          className="sidebar-brand"
          type="button"
          aria-label="Go to My Profile"
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
      </aside>

      <main
        className={
          activeView === 'dashboard'
            ? 'app-shell dashboard-shell'
            : 'app-shell inner-shell'
        }
      >
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
              <p className="eyebrow">My Profile</p>
              <h1 className="dashboard-greeting" id="dashboard-title">
                {dashboardGreeting}
              </h1>
              <p>
                Continue your prevention journey with family history, lifestyle
                habits, local actions, and your AI Prevention Coach.
              </p>
            </div>
          </div>

          <section className="dashboard-assessment-card">
            <div>
              <h2>Start your health profile</h2>
              <p>
                Add your family history and lifestyle information to receive
                personalized prevention insights and local health
                recommendations.
              </p>
            </div>
            <button
              className="primary-action"
              type="button"
              onClick={beginAssessmentWithLoading}
              disabled={isAssessmentLoading}
            >
              Begin Assessment
              <span aria-hidden="true">→</span>
            </button>
          </section>

          {hasPersonalizedAssessmentData ? (
            <>
              <section className="profile-overview-section" aria-labelledby="profile-overview-title">
                <h2 id="profile-overview-title">Profile Overview</h2>
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
              </section>

              <div className="dashboard-content-grid">
                <section className="insight-panel">
                  <div className="section-heading-row">
                    <div>
                      <p className="eyebrow">Family Insights</p>
                      <h2>Family Insights</h2>
                    </div>
                    <button
                      className="text-action"
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
                            <span className="priority-recommendation">
                              Recommended based on your profile.
                            </span>
                            <strong>View suggestions →</strong>
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

              <section className="body-measure-card" aria-labelledby="body-measure-title">
                <div className="body-measure-heading">
                  <h3 id="body-measure-title">Body Measurements</h3>
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
                            placeholder="5"
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
                            placeholder="8"
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
                        placeholder="150"
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
                  Body Mass Index (BMI) is an educational estimate and does not
                  measure body composition.
                </p>
              </section>
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
                                    {getDisplayConditionName(illness)}
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
                            <span>{getDisplayConditionName(condition)}</span>
                            <div
                              className="yes-no-toggle"
                              aria-label={`${getDisplayConditionName(condition)} condition status`}
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
            <QuestionCard title="Weekly exercise frequency">
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

            <QuestionCard title="Daily fruit and vegetable intake">
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

            <QuestionCard title="Preventive screenings">
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
                <h2 id="daily-coach-title">Today's Goals</h2>
                <p>
                  Complete personalized actions based on your health priorities.
                </p>
              </div>
              <span className="today-goal-count">
                {completedCoachGoals.length} of {coachGoals.length} completed
              </span>
            </div>

            <div className="coach-daily-grid">
              <section className="coach-card compact-coach-card">
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
                onClick={beginAssessmentWithLoading}
                disabled={isAssessmentLoading}
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
                ZIP code
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
                        {weeklyEventHeading}
                      </h2>
                      {weeklyEventDescription ? <p>{weeklyEventDescription}</p> : null}
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

                  {weeklyEventsStatus === 'success' && displayedWeeklyEvents.length === 0 ? (
                    <p className="helper-text">
                      {weeklyEventFilter.status === 'invalid-zip'
                        ? 'Enter a valid five-digit ZIP code.'
                        : weeklyEventFilter.status === 'unsupported-zip'
                          ? 'That ZIP code is outside the areas currently supported.'
                          : weeklyEventFilter.status === 'no-priorities'
                            ? 'Complete your family history and lifestyle profile to receive personalized recommendations.'
                              : weeklyEventFilter.status === 'location-needed'
                                ? 'Enter a ZIP code to see personalized local recommendations.'
                                : weeklyEventFilter.status === 'supported-empty'
                                  ? `No matching in-person resources are currently available in ${weeklyEventFilter.targetCity}.`
                                  : 'No verified preventive-health recommendations were found. New resources are checked daily.'}
                    </p>
                  ) : null}

                  {displayedWeeklyEvents.length > 0 ? (
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
                                <p>{formatEventDateTime(event)}</p>
                              </div>
                            </div>

                            <div className="weekly-event-meta">
                              <span>{event.recommendationLabel}</span>
                              <span>{getLocationLabel(event)}</span>
                              <span>
                                {event.source}
                              </span>
                            </div>

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
                                  More info <span aria-hidden="true">→</span>
                                </a>
                              ) : null}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  ) : (
                    null
                  )}

                  {displayedOnlineEvents.length > 0 ? (
                    <section
                      className="online-resource-section"
                      aria-labelledby="online-resources-title"
                    >
                      <h3 id="online-resources-title">
                        Relevant online resources
                      </h3>
                      <div className="weekly-event-list">
                        {displayedOnlineEvents.map((event) => {
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
                                  <p>{formatEventDateTime(event)}</p>
                                </div>
                              </div>

                              <div className="weekly-event-meta">
                                <span>{event.recommendationLabel}</span>
                                <span>{getLocationLabel(event)}</span>
                                <span>{event.source}</span>
                              </div>

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
                                    More info <span aria-hidden="true">→</span>
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
                            More Info <span aria-hidden="true">→</span>
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
            disabled={isAssessmentLoading}
            onClick={() => {
              if (finishTarget) {
                changeView(finishTarget)
                return
              }

              goToNextStep()
            }}
          >
            {finishTarget ? 'Finish' : 'Save and Continue'}
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
