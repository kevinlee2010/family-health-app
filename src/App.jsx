import { useEffect, useState } from 'react'
import './App.css'
import { getConditionDetails } from './conditionDetails'
import { buildFamilyHealthSummary } from './healthCategories'

const relationships = ['Mother', 'Father', 'Sibling', 'Grandparent']

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

const noIllnessOption = 'None'

const familyTreeTiers = [
  {
    id: 'grandparents',
    label: 'Grandparents',
    relationships: ['Grandparent'],
  },
  {
    id: 'parents',
    label: 'Parents',
    relationships: ['Mother', 'Father'],
  },
  {
    id: 'siblings',
    label: 'Siblings / Self',
    relationships: ['Sibling', 'Self'],
  },
]

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

const storageKey = 'family-health-app-state-v1'

const defaultSavedState = {
  activeView: 'dashboard',
  userProfile: null,
  profileForm: initialProfileForm,
  profileIllnesses: [],
  profileIllnessInput: '',
  familyMembers: [],
  familyMemberName: '',
  relationship: '',
  selectedIllnesses: [],
  illnessInput: '',
  familyEarlyDiagnosis: false,
  familyDiagnosisAge: '',
  editingFamilyMemberId: null,
  selectedTreeNodeId: null,
  collapsedTreeSections: {},
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
    illnesses: asStringArray(value.illnesses || value.conditions),
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

function sanitizeCollapsedSections(value) {
  if (!isPlainObject(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => familyTreeTiers.some((tier) => tier.id === key))
      .map(([key, collapsed]) => [key, Boolean(collapsed)]),
  )
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
    ? asStringArray(value.profileIllnesses)
    : asStringArray(userProfile?.illnesses)
  const locationStatus = sanitizeLocationStatus(value.locationStatus)

  return {
    activeView: sanitizeActiveView(value.activeView),
    userProfile,
    profileForm,
    profileIllnesses,
    profileIllnessInput: asString(value.profileIllnessInput),
    familyMembers: sanitizeFamilyMembers(value.familyMembers),
    familyMemberName: asString(value.familyMemberName),
    relationship: relationships.includes(value.relationship)
      ? value.relationship
      : '',
    selectedIllnesses: asStringArray(value.selectedIllnesses),
    illnessInput: asString(value.illnessInput),
    familyEarlyDiagnosis: Boolean(value.familyEarlyDiagnosis),
    familyDiagnosisAge: asString(value.familyDiagnosisAge),
    editingFamilyMemberId:
      typeof value.editingFamilyMemberId === 'string'
        ? value.editingFamilyMemberId
        : null,
    selectedTreeNodeId:
      typeof value.selectedTreeNodeId === 'string'
        ? value.selectedTreeNodeId
        : null,
    collapsedTreeSections: sanitizeCollapsedSections(value.collapsedTreeSections),
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

const healthCategoryIcons = {
  cardiovascular: '❤️',
  metabolic: '🩸',
  cancer: '🧬',
  neurological: '🧠',
  respiratory: '🫁',
  kidney: '🩺',
  mental: '🧠',
}

const categoryActionGroups = {
  cardiovascular: [
    {
      type: 'Walking trails',
      searchQuery: 'walking trails',
      explanation:
        'Walking is a practical way to support heart health, blood pressure, cholesterol, and endurance.',
    },
    {
      type: 'Parks',
      searchQuery: 'parks',
      explanation:
        'Parks can make regular, low-cost movement easier to build into a weekly routine.',
    },
    {
      type: 'Recreation centers or gyms',
      searchQuery: 'recreation centers gyms',
      explanation:
        'A recreation center or gym can support consistent cardio and strength activity.',
    },
    {
      type: 'Pharmacies for blood pressure checks',
      searchQuery: 'pharmacy blood pressure check',
      explanation:
        'Blood pressure checks can be a helpful starting point for heart-health conversations.',
    },
    {
      type: 'Farmers markets or heart-healthy grocery stores',
      searchQuery: 'farmers markets healthy grocery stores',
      explanation:
        'Fresh foods and balanced meals can support cholesterol, blood pressure, and overall heart health.',
    },
  ],
  metabolic: [
    {
      type: 'Walking paths',
      searchQuery: 'walking paths',
      explanation:
        'Walking can support blood sugar, weight management, and everyday energy.',
    },
    {
      type: 'Fitness centers',
      searchQuery: 'fitness centers',
      explanation:
        'Fitness centers can help make strength training and regular exercise more consistent.',
    },
    {
      type: 'Farmers markets',
      searchQuery: 'farmers markets',
      explanation:
        'Fresh produce can make balanced meals easier when focusing on metabolic health.',
    },
    {
      type: 'Healthy grocery stores',
      searchQuery: 'healthy grocery stores',
      explanation:
        'Nearby grocery options can help with simple, sustainable nutrition habits.',
    },
    {
      type: 'Nutrition education or diabetes prevention programs',
      searchQuery: 'nutrition education diabetes prevention program',
      explanation:
        'Education programs can offer structure for movement, nutrition, and prevention goals.',
    },
  ],
  cancer: [
    {
      type: 'Primary care clinics',
      searchQuery: 'primary care clinics',
      explanation:
        'Primary care visits are a good place to discuss family history and screening questions.',
    },
    {
      type: 'Hospitals or screening centers',
      searchQuery: 'screening centers hospitals',
      explanation:
        'Screening centers can help users learn what preventive screenings may be appropriate to ask about.',
    },
    {
      type: 'Cancer education resources',
      searchQuery: 'cancer education resources',
      explanation:
        'Education resources can make family-history and screening conversations easier to understand.',
    },
    {
      type: 'Smoking cessation programs',
      searchQuery: 'smoking cessation programs',
      explanation:
        'Avoiding tobacco is a major prevention step for many cancers and overall health.',
    },
    {
      type: 'Parks or outdoor recreation areas',
      searchQuery: 'parks outdoor recreation areas',
      explanation:
        'Outdoor movement supports general wellness and can be part of a prevention-focused routine.',
    },
  ],
  neurological: [
    {
      type: 'Walking trails',
      searchQuery: 'walking trails',
      explanation:
        'Regular walking can support circulation, mobility, mood, and brain-health routines.',
    },
    {
      type: 'Parks',
      searchQuery: 'parks',
      explanation:
        'Green spaces can support low-pressure movement and stress reduction.',
    },
    {
      type: 'Yoga or mindfulness studios',
      searchQuery: 'yoga mindfulness studios',
      explanation:
        'Mindfulness and gentle movement may support stress management and balance routines.',
    },
    {
      type: 'Community fitness centers',
      searchQuery: 'community fitness centers',
      explanation:
        'Community fitness options can support strength, balance, and consistent movement.',
    },
    {
      type: 'Brain health education resources',
      searchQuery: 'brain health education resources',
      explanation:
        'Education resources can help families prepare better questions about memory and neurological health.',
    },
  ],
  respiratory: [
    {
      type: 'Indoor recreation centers',
      searchQuery: 'indoor recreation centers',
      explanation:
        'Indoor activity spaces can be useful when pollen, smoke, heat, or air quality makes outdoor movement harder.',
    },
    {
      type: 'Indoor swimming pools',
      searchQuery: 'indoor swimming pools',
      explanation:
        'Swimming and water exercise can be low impact and easier to pace for some people.',
    },
    {
      type: 'Air quality resources',
      searchQuery: 'air quality index',
      explanation:
        'Checking air quality can help plan safer times for outdoor activity.',
    },
    {
      type: 'Smoking cessation programs',
      searchQuery: 'smoking cessation programs',
      explanation:
        'Avoiding tobacco smoke is an important prevention topic for respiratory health.',
    },
    {
      type: 'Parks when air quality is good',
      searchQuery: 'parks',
      explanation:
        'Outdoor movement can be helpful when air quality and symptoms make it a good fit.',
    },
  ],
  kidney: [
    {
      type: 'Pharmacies for blood pressure monitoring',
      searchQuery: 'pharmacy blood pressure check',
      explanation:
        'Blood pressure monitoring can support kidney and cardiovascular prevention conversations.',
    },
    {
      type: 'Primary care clinics',
      searchQuery: 'primary care clinics',
      explanation:
        'Primary care visits are a good place to ask about kidney health, blood pressure, and routine labs.',
    },
    {
      type: 'Healthy grocery stores',
      searchQuery: 'healthy grocery stores',
      explanation:
        'Balanced food choices can support blood pressure, metabolic health, and kidney wellness.',
    },
    {
      type: 'Walking paths',
      searchQuery: 'walking paths',
      explanation:
        'Regular movement supports blood pressure, weight, and general prevention goals.',
    },
    {
      type: 'Kidney health education resources',
      searchQuery: 'kidney health education resources',
      explanation:
        'Education resources can help users understand kidney health questions to discuss with a clinician.',
    },
  ],
  mental: [
    {
      type: 'Parks',
      searchQuery: 'parks',
      explanation:
        'Green spaces and gentle movement can support stress relief and mood routines.',
    },
    {
      type: 'Nature walking trails',
      searchQuery: 'nature walking trails',
      explanation:
        'Walking outdoors can combine movement, fresh air, and time away from screens.',
    },
    {
      type: 'Yoga or meditation studios',
      searchQuery: 'yoga meditation studios',
      explanation:
        'Yoga or meditation can support stress management, breathing, and emotional regulation.',
    },
    {
      type: 'Community wellness centers',
      searchQuery: 'community wellness centers',
      explanation:
        'Community wellness programs can provide structure, social connection, and approachable activities.',
    },
    {
      type: 'Mental health clinics',
      searchQuery: 'mental health clinics',
      explanation:
        'Mental health clinics can help users find professional support options when needed.',
    },
  ],
}

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
  return normalizeIllness(value).replace(/\s*\([^)]*\)/g, '')
}

function isNoIllness(value) {
  return getIllnessKey(value) === getIllnessKey(noIllnessOption)
}

function getConditionCount(illnesses) {
  return illnesses.filter((illness) => !isNoIllness(illness)).length
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

function formatCustomIllness(value) {
  const cleanValue = value.trim().replace(/\s+/g, ' ')

  if (!cleanValue) {
    return ''
  }

  if (/[A-Z]/.test(cleanValue)) {
    return cleanValue
  }

  return cleanValue.replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
}

function getTreeNodeTone(illnessCount) {
  if (illnessCount === 0) {
    return 'none'
  }

  if (illnessCount === 1) {
    return 'one'
  }

  if (illnessCount === 2) {
    return 'two'
  }

  return 'three-plus'
}

function getConditionSummary(illnessCount) {
  if (illnessCount === 0) {
    return 'No conditions'
  }

  if (illnessCount === 1) {
    return '1 condition'
  }

  return `${illnessCount} conditions`
}

function getHealthCategoryRiskClass(riskLevel) {
  return `category-${riskLevel.toLowerCase()}`
}

function getHealthCategoryIcon(categoryId) {
  return healthCategoryIcons[categoryId] || '🩺'
}

function getLocationSearchTarget({ manualLocation, userCoordinates }) {
  const cleanManualLocation = manualLocation.trim()

  if (cleanManualLocation) {
    return cleanManualLocation
  }

  if (userCoordinates) {
    return `${userCoordinates.latitude},${userCoordinates.longitude}`
  }

  return ''
}

function buildGoogleMapsSearchUrl(searchQuery, locationTarget) {
  const query = locationTarget
    ? `${searchQuery} near ${locationTarget}`
    : searchQuery

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function buildGoogleMapsEmbedUrl(searchQuery, locationTarget) {
  const query = locationTarget
    ? `${searchQuery} near ${locationTarget}`
    : searchQuery

  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

function getHealthyActionCategoryReason(category) {
  if (category.riskLevel === 'High') {
    return `${category.name} is one of the top areas because multiple family history entries map to this category.`
  }

  if (category.riskLevel === 'Increased') {
    return `${category.name} is included because at least one family history entry maps to this category.`
  }

  return `${category.name} is included as a general prevention area because it is one of the highest-ranked categories from the current entries.`
}

function buildHealthyActionCategories({ locationTarget, topAreas }) {
  return topAreas.map((category) => {
    const actions = categoryActionGroups[category.id] || []

    return {
      ...category,
      reason: getHealthyActionCategoryReason(category),
      actions: actions.slice(0, 5).map((action) => ({
        ...action,
        id: `${category.id}-${action.searchQuery}`,
        mapsUrl: buildGoogleMapsSearchUrl(action.searchQuery, locationTarget),
      })),
    }
  })
}

function getLifestylePriority(profile) {
  const priorities = []
  const addPriority = (id, icon, title, detail, scoreImpact) => {
    if (!priorities.some((priority) => priority.id === id)) {
      priorities.push({ detail, icon, id, scoreImpact, title })
    }
  }

  if (profile.exercise === 'Rarely' || profile.exercise === '1-2 days/week') {
    addPriority(
      'movement',
      '🚶',
      'Build consistent movement',
      'Your activity response suggests that short, repeatable walks could make prevention feel more doable.',
      14,
    )
  }

  if (
    profile.dietQuality === 'Poor' ||
    profile.dietQuality === 'Fair' ||
    profile.fruitVegIntake === '0-1 servings' ||
    profile.fruitVegIntake === '2 servings'
  ) {
    addPriority(
      'nutrition',
      '🥗',
      'Improve everyday nutrition',
      'Your food responses show an opportunity to add more produce, fiber-rich foods, and balanced meals.',
      12,
    )
  }

  if (profile.sleep === 'Less than 6 hours' || profile.sleep === 'More than 9 hours') {
    addPriority(
      'sleep',
      '🌙',
      'Protect sleep rhythm',
      'Your sleep response may affect energy, stress, and follow-through on healthy habits.',
      10,
    )
  }

  if (profile.smokingStatus === 'Current') {
    addPriority(
      'tobacco',
      '🚭',
      'Reduce tobacco or vaping exposure',
      'Current smoking or vaping is one of the strongest modifiable prevention signals in the intake.',
      18,
    )
  }

  if (profile.waterIntake === 'Less than 3 cups' || profile.waterIntake === '3-5 cups') {
    addPriority(
      'hydration',
      '💧',
      'Improve hydration',
      'Your water intake response suggests a simple daily habit target could help.',
      6,
    )
  }

  if (profile.sugaryDrinks === 'Most days' || profile.sugaryDrinks === 'Daily') {
    addPriority(
      'sugary-drinks',
      '🥤',
      'Cut back sugary drinks',
      'Frequent sugary drinks can make nutrition, weight, and metabolic prevention goals harder.',
      9,
    )
  }

  if (profile.stressLevel === 'High' || profile.stressLevel === 'Very high') {
    addPriority(
      'stress',
      '🧘',
      'Lower stress load',
      'Your stress response suggests breathing, walking, or mindfulness routines could support prevention.',
      9,
    )
  }

  if (profile.screenTime === '8+ hours') {
    addPriority(
      'screen-time',
      '☀️',
      'Add screen breaks',
      'Long screen time can crowd out movement, sleep, and outdoor time.',
      6,
    )
  }

  if (
    profile.preventiveScreenings === 'Not sure' ||
    profile.preventiveScreenings === 'Need to schedule'
  ) {
    addPriority(
      'screening',
      '📅',
      'Check preventive screening timing',
      'Your screening response suggests it may be worth asking a healthcare professional what is appropriate for your age and family history.',
      10,
    )
  }

  return priorities
}

function getPositivePreventionSignals(profile, familyHealthSummary) {
  const positives = []

  if (profile.smokingStatus === 'Never') {
    positives.push('No smoking or vaping reported.')
  }

  if (profile.exercise === '3-5 days/week' || profile.exercise === 'Nearly every day') {
    positives.push('Your exercise routine is already a strong prevention habit.')
  }

  if (
    profile.dietQuality === 'Good' ||
    profile.dietQuality === 'Excellent' ||
    profile.fruitVegIntake === '3-4 servings' ||
    profile.fruitVegIntake === '5 or more servings'
  ) {
    positives.push('Your nutrition answers show helpful daily choices.')
  }

  if (profile.sleep === '7-9 hours') {
    positives.push('Your sleep duration is in a generally supportive range.')
  }

  if (profile.waterIntake === '6-8 cups' || profile.waterIntake === 'More than 8 cups') {
    positives.push('Your hydration response is a useful foundation.')
  }

  if (profile.preventiveScreenings === 'Up to date') {
    positives.push('You reported being up to date with preventive screenings.')
  }

  if (familyHealthSummary.categories.filter((category) => category.riskLevel === 'High').length === 0) {
    positives.push('No high family-history category is visible from the entries so far.')
  }

  return positives.slice(0, 5)
}

function calculatePreventionScore({ familyHealthSummary, profile }) {
  const lifestylePriorities = getLifestylePriority(profile)
  const familyPriorityPenalty = familyHealthSummary.topAreas.reduce((total, category) => {
    if (category.riskLevel === 'High') {
      return total + 8
    }

    if (category.riskLevel === 'Increased') {
      return total + 4
    }

    return total
  }, 0)
  const lifestylePenalty = lifestylePriorities.reduce(
    (total, priority) => total + priority.scoreImpact,
    0,
  )
  const positives = getPositivePreventionSignals(profile, familyHealthSummary)
  const score = Math.max(
    0,
    Math.min(100, 100 - familyPriorityPenalty - lifestylePenalty + positives.length * 2),
  )
  const familyPriorities = familyHealthSummary.topAreas
    .filter((category) => category.riskLevel !== 'Average')
    .map((category) => ({
      detail: getHealthyActionCategoryReason(category),
      icon: getHealthCategoryIcon(category.id),
      id: category.id,
      scoreImpact: category.riskLevel === 'High' ? 16 : 10,
      title: category.name,
    }))
  const topPriorities = [...familyPriorities, ...lifestylePriorities]
    .sort((first, second) => second.scoreImpact - first.scoreImpact)
    .slice(0, 3)
  const improvements = lifestylePriorities
    .map((priority) => priority.title)
    .slice(0, 5)
  const explanation =
    topPriorities.length > 0
      ? `Your prevention score reflects both family-history awareness and the habits you reported. The biggest opportunities right now are ${toReadableList(
          topPriorities.map((priority) => priority.title.toLowerCase()),
        )}. This is not a diagnosis or prediction; it is a friendly way to spot practical prevention steps you can start improving.`
      : 'Your prevention score is starting from a strong place because the current entries do not show major habit gaps or high family-history signals. Keep updating your family history and lifestyle answers so the coach can stay useful over time.'

  return {
    areasForImprovement:
      improvements.length > 0
        ? improvements
        : ['Keep family history updated', 'Review routine checkups', 'Maintain healthy habits'],
    explanation,
    positives,
    score,
    topPriorities:
      topPriorities.length > 0
        ? topPriorities
        : [
            {
              detail: 'Routine preventive care helps catch changes early and keeps your health plan current.',
              icon: '📅',
              id: 'routine-care',
              title: 'Routine preventive care',
            },
          ],
  }
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

  return 'Start with one small action today. A 20-minute walk, one extra glass of water, or one screening question is enough to create momentum.'
}


function getDisplayName(member) {
  if (member.isPlaceholder) {
    return 'You (Self)'
  }

  return member.name || member.relationship
}

function getTreeMeta(member) {
  if (member.isPlaceholder) {
    return 'Self'
  }

  if (member.isSelf) {
    return [
      member.relationship,
      member.age ? `Age ${member.age}` : '',
      member.sex,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  return member.name ? member.relationship : ''
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

function getTreeStatusLabel(illnessCount) {
  if (illnessCount === 0) {
    return 'Clear'
  }

  if (illnessCount === 1) {
    return 'Watch'
  }

  if (illnessCount === 2) {
    return 'Review'
  }

  return 'Priority'
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

function ProgressBar({ value }) {
  return (
    <div className="progress-bar" aria-label={`Assessment ${value}% complete`}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

function FamilyMemberCard({
  member,
  onEdit,
  onOpenConditionDetails,
  onRemove,
}) {
  return (
    <article className="flow-family-card">
      <div>
        <p className="eyebrow">Relative</p>
        <h3>{member.name || member.relationship}</h3>
        <p className="family-card-meta">
          {member.relationship}
          {member.diagnosisAge ? ` · Diagnosed around age ${member.diagnosisAge}` : ''}
          {member.earlyDiagnosis ? ' · Diagnosed young' : ''}
        </p>
      </div>

      {member.illnesses.length > 0 ? (
        <ul className="illness-list compact">
          {member.illnesses.map((illness) => (
            <li key={illness}>
              <ClickableConditionTag
                conditionName={illness}
                onOpenConditionDetails={onOpenConditionDetails}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="helper-text">No known conditions selected.</p>
      )}

      <div className="card-actions">
        <button className="secondary-action" type="button" onClick={onEdit}>
          Edit
        </button>
        <button className="danger-action" type="button" onClick={onRemove}>
          Remove
        </button>
      </div>
    </article>
  )
}

function toReadableList(items) {
  if (items.length <= 1) {
    return items[0] || ''
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
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
                title="Major risk factors"
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
  inputId,
  inputValue,
  onInputChange,
  onInputClear,
  onAddIllness,
  onClearIllnesses,
  onOpenConditionDetails,
  onRemoveIllness,
  selectedIllnesses,
}) {
  const normalizedInput = normalizeIllness(inputValue)
  const typedIllnessKey = getIllnessKey(inputValue)
  const selectedIllnessKeys = selectedIllnesses.map(getIllnessKey)
  const canAddTypedIllness =
    typedIllnessKey !== '' && !selectedIllnessKeys.includes(typedIllnessKey)
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
  const showSuggestions = matchingSuggestionGroups.length > 0

  function addIllness(illness) {
    const illnessKey = getIllnessKey(illness)

    if (!illnessKey) {
      return
    }

    const matchingStarterIllness = starterIllnesses.find(
      (starterIllness) => getIllnessKey(starterIllness) === illnessKey,
    )

    onAddIllness(matchingStarterIllness || formatCustomIllness(illness))
    onInputClear()
  }

  function addTypedIllness() {
    addIllness(inputValue)
  }

  function handleIllnessKeyDown(event) {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()

    if (canAddTypedIllness) {
      addTypedIllness()
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
            aria-expanded={showSuggestions}
            role="combobox"
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={handleIllnessKeyDown}
            placeholder="Type an illness or condition"
            autoComplete="off"
          />
        </label>
        <button
          className="add-illness-button"
          type="button"
          disabled={!canAddTypedIllness}
          onClick={addTypedIllness}
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
                    <li key={illness} role="option">
                      <button
                        className="suggestion-button"
                        type="button"
                        onClick={() => addIllness(illness)}
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

      <button
        className="none-illness-button"
        type="button"
        aria-pressed={selectedIllnesses.length === 0}
        onClick={() => {
          onClearIllnesses()
          onInputClear()
        }}
      >
        None
      </button>

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
  const [illnessInput, setIllnessInput] = useState(savedAppState.illnessInput)
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
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState(
    savedAppState.selectedTreeNodeId,
  )
  const [collapsedTreeSections, setCollapsedTreeSections] = useState(
    savedAppState.collapsedTreeSections,
  )
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
  const groupedFamilyMembers = familyTreeTiers.map((tier) => {
    const tierMembers = familyMembers.filter((member) =>
      tier.relationships.includes(member.relationship),
    )

    return {
      ...tier,
      members:
        tier.id === 'siblings' && selfTreeNode
          ? [selfTreeNode, ...tierMembers]
          : tierMembers,
    }
  })
  const treeEntryCount = familyMembers.length + (userProfile ? 1 : 0)
  const treeMembers = groupedFamilyMembers.flatMap((tier) => tier.members)
  const selectedTreeNode =
    treeMembers.find((member) => member.id === selectedTreeNodeId) || selfTreeNode
  const familyHealthSummary = buildFamilyHealthSummary({ familyMembers })
  const profileBmi = calculateBmi(profileForm)
  const preventionProfile = userProfile || {
    ...profileForm,
    bmi: profileBmi,
    illnesses: profileIllnesses,
  }
  const preventionScore = calculatePreventionScore({
    familyHealthSummary,
    profile: preventionProfile,
  })
  const coachGoals = buildCoachGoals(preventionScore)
  const completedCoachGoals = coachGoals.filter((goal) => habitProgress[goal.id])
  const coachStreak = completedCoachGoals.length
  const coachMessage = getCoachMessage({
    completedCount: completedCoachGoals.length,
    totalGoals: coachGoals.length,
  })
  const activeConditionDetails = activeConditionName
    ? getConditionDetails(activeConditionName)
    : null
  const disclaimerText =
    'This educational tool organizes family history and lifestyle information. It does not provide a diagnosis or replace professional medical advice.'
  const wellnessLocationTarget = getLocationSearchTarget({
    manualLocation,
    userCoordinates,
  })
  const healthyActionCategories = buildHealthyActionCategories({
    locationTarget: wellnessLocationTarget,
    topAreas: familyHealthSummary.topAreas,
  })
  const healthyActionMapQuery =
    healthyActionCategories[0]?.actions[0]?.searchQuery || 'parks'
  const healthyActionMapUrl = buildGoogleMapsEmbedUrl(
    healthyActionMapQuery,
    wellnessLocationTarget,
  )
  const dashboardSummaryCards = [
    {
      icon: '◎',
      label: 'Prevention Score',
      value: preventionScore.score,
      detail: 'Habits and awareness, not a diagnosis',
    },
    {
      icon: '❤️',
      label: 'Top Health Priorities',
      value: preventionScore.topPriorities.length,
      detail: preventionScore.topPriorities
        .slice(0, 2)
        .map((priority) => priority.title)
        .join(', '),
    },
    {
      icon: '✓',
      label: "Today's Healthy Actions",
      value: completedCoachGoals.length,
      detail: `${coachGoals.length} coach goals ready today`,
    },
    {
      icon: '🔥',
      label: 'Habit Progress',
      value: `${coachStreak}/${coachGoals.length}`,
      detail: coachStreak > 0 ? 'Momentum started' : 'Start with one small win',
    },
    {
      icon: '📅',
      label: 'Weekly Goals',
      value: coachGoals.length,
      detail: coachMessage,
    },
  ]
  const workflowProgress = workflowSteps.map((step, index) => {
    const isComplete =
      step.id === 'dashboard' ||
      (step.id === 'family' && familyMembers.length > 0) ||
      (step.id === 'lifestyle' && Boolean(userProfile || Object.values(profileForm).some(Boolean))) ||
      (step.id === 'coach' && coachGoals.length > 0)

    return {
      ...step,
      isComplete,
      number: index + 1,
    }
  })
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
  const completionPercent = Math.round(
    (workflowProgress.filter((step) => step.isComplete).length /
      workflowProgress.length) *
      100,
  )

  useEffect(() => {
    saveAppState({
      activeView,
      userProfile,
      profileForm,
      profileIllnesses,
      profileIllnessInput,
      familyMembers,
      familyMemberName,
      relationship,
      selectedIllnesses,
      illnessInput,
      familyEarlyDiagnosis,
      familyDiagnosisAge,
      editingFamilyMemberId,
      selectedTreeNodeId,
      collapsedTreeSections,
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
    familyMembers,
    familyMemberName,
    relationship,
    selectedIllnesses,
    illnessInput,
    familyEarlyDiagnosis,
    familyDiagnosisAge,
    editingFamilyMemberId,
    selectedTreeNodeId,
    collapsedTreeSections,
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
    setProfileIllnesses((currentIllnesses) =>
      addIllnessToList(currentIllnesses, illness),
    )
  }

  function removeProfileIllness(illness) {
    setProfileIllnesses((currentIllnesses) =>
      currentIllnesses.filter(
        (item) => getIllnessKey(item) !== getIllnessKey(illness),
      ),
    )
  }

  function clearProfileIllnesses() {
    setProfileIllnesses([])
  }

  function addFamilyIllness(illness) {
    setSelectedIllnesses((currentIllnesses) =>
      addIllnessToList(currentIllnesses, illness),
    )
  }

  function removeFamilyIllness(illness) {
    setSelectedIllnesses((currentIllnesses) =>
      currentIllnesses.filter(
        (item) => getIllnessKey(item) !== getIllnessKey(illness),
      ),
    )
  }

  function clearFamilyIllnesses() {
    setSelectedIllnesses([])
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

    if (editingFamilyMemberId) {
      setFamilyMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === editingFamilyMemberId
            ? {
                ...member,
                name: familyMemberName.trim(),
                relationship,
                illnesses: selectedIllnesses,
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
        illnesses: selectedIllnesses,
        earlyDiagnosis: familyEarlyDiagnosis,
          diagnosisAge: familyDiagnosisAge,
        },
      ])
      setSuccessMessage('Family member added.')
    }

    setFamilyMemberName('')
    setRelationship('')
    setSelectedIllnesses([])
    setIllnessInput('')
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setError('')
  }

  function editFamilyMember(member) {
    setFamilyMemberName(member.name || '')
    setRelationship(member.relationship)
    setSelectedIllnesses(member.illnesses)
    setFamilyEarlyDiagnosis(Boolean(member.earlyDiagnosis))
    setFamilyDiagnosisAge(member.diagnosisAge || '')
    setEditingFamilyMemberId(member.id)
    setError('')
    setSuccessMessage('')
  }

  function removeFamilyMember(memberId) {
    setFamilyMembers((currentMembers) =>
      currentMembers.filter((member) => member.id !== memberId),
    )

    if (selectedTreeNodeId === memberId) {
      setSelectedTreeNodeId(null)
    }
  }

  function updateFamilyMemberRelationship(memberId, nextRelationship) {
    setFamilyMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              relationship: nextRelationship,
            }
          : member,
      ),
    )
  }

  function updateFamilyMemberEarlyDiagnosis(memberId, earlyDiagnosis) {
    setFamilyMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              earlyDiagnosis,
            }
          : member,
      ),
    )
  }

  function toggleTreeSection(tierId) {
    setCollapsedTreeSections((currentSections) => ({
      ...currentSections,
      [tierId]: !currentSections[tierId],
    }))
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
    setIllnessInput('')
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setError('')
    setSuccessMessage('')
    setSelectedTreeNodeId(null)
    setCollapsedTreeSections({})
    setHabitProgress({})
    setActiveConditionName(null)
    setManualLocation('')
    setUserCoordinates(null)
    setLocationStatus('idle')
    setLocationMessage('')
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
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            +
          </span>
          <div>
            <strong>Family Health</strong>
            <span>Your data stays on your device.</span>
          </div>
        </div>

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

      <main className="app-shell">
        <header className="app-hero">
          <div className="app-hero-copy">
            <p className="eyebrow">Family health history</p>
            <h1>
              <span>Know Your Family History.</span>
              <span>Take Control of Your Health.</span>
            </h1>
            <p className="app-subtitle">
              Build your family health profile to discover inherited health
              patterns, understand potential risks, and receive personalized
              educational insights.
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
            <div className="hero-secondary-actions">
              {isWorkflowView ? (
                <button
                  className="secondary-action"
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={!previousWorkflowStep}
                >
                  <span aria-hidden="true">←</span>
                  Back
                </button>
              ) : null}

              <button
                className="secondary-action"
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
          </div>

          <div className="trust-indicators" aria-label="Trust indicators">
            <article className="trust-badge">
              <span className="trust-icon" aria-hidden="true">
                🔒
              </span>
              <div>
                <strong>Private</strong>
                <p>Your data stays on your device.</p>
              </div>
            </article>
            <article className="trust-badge">
              <span className="trust-icon" aria-hidden="true">
                📚
              </span>
              <div>
                <strong>Educational</strong>
                <p>Based on family history and educational health information.</p>
              </div>
            </article>
            <article className="trust-badge">
              <span className="trust-icon" aria-hidden="true">
                🧬
              </span>
              <div>
                <strong>Personalized</strong>
                <p>Insights tailored to your family's health history.</p>
              </div>
            </article>
          </div>
        </header>

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
            <div className="dashboard-progress-summary">
              <span>{completionPercent}% complete</span>
              <ProgressBar value={completionPercent} />
              <button
                className="primary-action"
                type="button"
                onClick={() => changeView('family')}
              >
                Continue Your Assessment <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

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
                  <p className="eyebrow">Family insights</p>
                  <h2>Top 3 health priorities</h2>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => changeView('coach')}
                >
                  Learn More <span aria-hidden="true">→</span>
                </button>
              </div>

              <ul className="dashboard-attention-list">
                {preventionScore.topPriorities.map((priority) => (
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
                      <strong>Priority</strong>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="insight-panel">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">Coach</p>
                  <h2>Today's healthy actions</h2>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => changeView('coach')}
                >
                  Open Coach <span aria-hidden="true">→</span>
                </button>
              </div>

              <ul className="coach-mini-list">
                {coachGoals.slice(0, 3).map((goal) => (
                  <li key={goal.id}>
                    <span>{habitProgress[goal.id] ? '✓' : '○'}</span>
                    <span>{goal.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      ) : null}

      {activeView === 'family' ? (
        <section className="profile-panel" aria-labelledby="profile-title">
          <div className="page-heading">
            <p className="eyebrow">Step 1</p>
            <h1 id="profile-title">Family Health History</h1>
            <p className="page-description">
              Start with yourself, then add parents, grandparents, and siblings.
              This creates the foundation for prevention-focused insights.
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
                <p className="eyebrow">Current Health</p>
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
              <legend>Current Health</legend>
              <p className="helper-text">
                Do you currently have any of these conditions? Choose None if no
                current conditions apply.
              </p>
              <IllnessPicker
                inputId="profile-illness-search"
                inputValue={profileIllnessInput}
                onInputChange={setProfileIllnessInput}
                onInputClear={() => setProfileIllnessInput('')}
                onAddIllness={addProfileIllness}
                onClearIllnesses={clearProfileIllnesses}
                onOpenConditionDetails={openConditionDetails}
                onRemoveIllness={removeProfileIllness}
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
          <section className="family-form-panel" aria-labelledby="form-title">
            <div className="page-heading">
              <p className="eyebrow">Family history</p>
              <h1 id="form-title">Add a family member</h1>
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
                    <option key={relationshipOption} value={relationshipOption}>
                      {relationshipOption}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="illness-fieldset">
                <legend>Illness or condition</legend>
                <IllnessPicker
                  inputId="family-illness-search"
                  inputValue={illnessInput}
                  onInputChange={setIllnessInput}
                  onInputClear={() => setIllnessInput('')}
                  onAddIllness={addFamilyIllness}
                  onClearIllnesses={clearFamilyIllnesses}
                  onOpenConditionDetails={openConditionDetails}
                  onRemoveIllness={removeFamilyIllness}
                  selectedIllnesses={selectedIllnesses}
                />
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
                  onChange={(event) => setFamilyDiagnosisAge(event.target.value)}
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
                {editingFamilyMemberId ? 'Update family member' : 'Add family member'}{' '}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>

          <section className="family-list-panel" aria-labelledby="list-title">
            <div className="list-heading">
              <div>
                <p className="eyebrow">Current entries</p>
                <h2 id="list-title">Family members</h2>
              </div>
              <span className="member-count">{familyMembers.length} added</span>
            </div>

            {familyMembers.length === 0 ? (
              <div className="empty-state">
                <strong>No family members added yet.</strong>
                <span>Submitted entries will appear here.</span>
              </div>
            ) : (
              <ul className="family-list" aria-live="polite">
                {familyMembers.map((member) => (
                  <li key={member.id}>
                    <FamilyMemberCard
                      member={member}
                      onEdit={() => editFamilyMember(member)}
                      onOpenConditionDetails={openConditionDetails}
                      onRemove={() => removeFamilyMember(member.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

        <section className="family-tree-panel" aria-labelledby="tree-title">
          <div className="tree-heading">
            <div>
              <p className="eyebrow">Family Tree</p>
              <h1 id="tree-title">Family Tree</h1>
            </div>
            <span className="member-count">{treeEntryCount} added</span>
          </div>

          <div className="tree-legend" aria-label="Condition color legend">
            <span className="legend-item legend-none">0 conditions</span>
            <span className="legend-item legend-one">1 condition</span>
            <span className="legend-item legend-two">2 conditions</span>
            <span className="legend-item legend-three-plus">3+ conditions</span>
          </div>

          <div className="family-tree-workspace">
            <div className="family-tree" aria-label="Visual family tree">
              {groupedFamilyMembers.map((tier) => {
                const isCollapsed = Boolean(collapsedTreeSections[tier.id])

                return (
                  <section
                    className={`tree-tier tree-tier-${tier.id}${
                      isCollapsed ? ' collapsed' : ''
                    }`}
                    key={tier.id}
                  >
                    <div className="tier-label">
                      <button
                        className="tier-toggle"
                        type="button"
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleTreeSection(tier.id)}
                      >
                        <span>{tier.label}</span>
                        <strong>{tier.members.length}</strong>
                      </button>
                    </div>

                    {isCollapsed ? null : tier.members.length === 0 ? (
                      <p className="empty-tier">
                        No {tier.label.toLowerCase()} added.
                      </p>
                    ) : (
                      <ul className="tree-node-list">
                        {tier.members.map((member) => {
                          const conditionCount = getConditionCount(member.illnesses)
                          const tone = getTreeNodeTone(conditionCount)
                          const isSelected = selectedTreeNode.id === member.id

                          return (
                            <li
                              className={`tree-node tree-node-${tone}${
                                member.isSelf ? ' tree-node-self' : ''
                              }${isSelected ? ' selected' : ''}`}
                              key={member.id}
                            >
                              <button
                                className="tree-node-card"
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedTreeNodeId(member.id)}
                              >
                                <span className="tree-node-topline">
                                  <span className="tree-avatar" aria-hidden="true">
                                    {getTreeInitials(member)}
                                  </span>
                                  <span className="tree-status-label">
                                    {getTreeStatusLabel(conditionCount)}
                                  </span>
                                </span>

                                <span className="tree-node-body">
                                  <span className="tree-person-name">
                                    {getDisplayName(member)}
                                  </span>
                                  <span className="tree-profile-meta">
                                    {getTreeMeta(member) || member.relationship}
                                  </span>
                                </span>

                                <span className="tree-node-footer">
                                  <span className="tree-condition-count">
                                    {getConditionSummary(conditionCount)}
                                  </span>
                                  {member.illnesses.length > 0 ? (
                                    <span className="tree-condition-preview">
                                      {member.illnesses.slice(0, 2).join(', ')}
                                      {member.illnesses.length > 2 ? ' +' : ''}
                                    </span>
                                  ) : (
                                    <span className="tree-no-illnesses">
                                      No illnesses selected
                                    </span>
                                  )}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </section>
                )
              })}
            </div>

            <aside className="tree-detail-panel" aria-live="polite">
              <div className="tree-detail-header">
                <span className="tree-avatar large" aria-hidden="true">
                  {getTreeInitials(selectedTreeNode)}
                </span>
                <div>
                  <p className="eyebrow">Person details</p>
                  <h2>{getDisplayName(selectedTreeNode)}</h2>
                  <p className="tree-detail-meta">
                    {selectedTreeNode.relationship} ·{' '}
                    {getConditionSummary(
                      getConditionCount(selectedTreeNode.illnesses),
                    )}
                  </p>
                </div>
              </div>

              {selectedTreeNode.isPlaceholder ? (
                <div className="tree-edit-block">
                  <p className="helper-text">
                    Add yourself in the Family Health History step to replace this
                    placeholder.
                  </p>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => changeView('family')}
                  >
                    Edit Profile <span aria-hidden="true">→</span>
                  </button>
                </div>
              ) : selectedTreeNode.isSelf ? (
                <div className="tree-edit-block">
                  <p className="helper-text">
                    This node uses your saved profile information.
                  </p>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => changeView('family')}
                  >
                    Edit Profile <span aria-hidden="true">→</span>
                  </button>
                </div>
              ) : (
                <div className="tree-edit-block">
                  <label className="field-group" htmlFor="tree-relationship-edit">
                    Relationship
                    <select
                      id="tree-relationship-edit"
                      value={selectedTreeNode.relationship}
                      onChange={(event) =>
                        updateFamilyMemberRelationship(
                          selectedTreeNode.id,
                          event.target.value,
                        )
                      }
                    >
                      {relationships.map((relationshipOption) => (
                        <option
                          key={relationshipOption}
                          value={relationshipOption}
                        >
                          {relationshipOption}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label
                    className="checkbox-card compact"
                    htmlFor="tree-early-diagnosis-edit"
                  >
                    <input
                      id="tree-early-diagnosis-edit"
                      type="checkbox"
                      checked={Boolean(selectedTreeNode.earlyDiagnosis)}
                      onChange={(event) =>
                        updateFamilyMemberEarlyDiagnosis(
                          selectedTreeNode.id,
                          event.target.checked,
                        )
                      }
                    />
                    <span>
                      Diagnosed at an unusually young age
                    </span>
                  </label>
                </div>
              )}

              {selectedTreeNode.illnesses.length > 0 ? (
                <ul className="illness-list">
                  {selectedTreeNode.illnesses.map((illness) => (
                    <li key={illness}>
                      <ClickableConditionTag
                        conditionName={illness}
                        onOpenConditionDetails={openConditionDetails}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-illnesses">No illnesses selected.</p>
              )}

              {!selectedTreeNode.isSelf && !selectedTreeNode.isPlaceholder ? (
                <button
                  className="danger-action"
                  type="button"
                  onClick={() => removeFamilyMember(selectedTreeNode.id)}
                >
                  Remove from tree
                </button>
              ) : null}
            </aside>
          </div>
        </section>
        </>
      ) : null}

      {activeView === 'lifestyle' ? (
        <>
        <section className="profile-panel" aria-labelledby="lifestyle-title">
          <div className="page-heading">
            <p className="eyebrow">Step 2</p>
            <h1 id="lifestyle-title">Lifestyle Assessment</h1>
            <p className="page-description">
              These optional answers help the prevention coach personalize
              encouragement, local actions, and habit goals. Responses save
              automatically on your device.
            </p>
          </div>

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
              <p className="eyebrow">Coach insight</p>
              <h1 id="score-title">Prevention Score</h1>
              <p className="page-description">
                This score measures prevention habits and family-history
                awareness. It is not a diagnosis, clinical risk percentage, or
                prediction that you will develop a condition.
              </p>
            </div>
            <span className="privacy-pill">Educational screening tool</span>
          </div>

          <div className="score-hero-grid">
            <article className="score-ring-card">
              <div
                className="score-ring"
                style={{ '--score': `${preventionScore.score}%` }}
                aria-label={`Prevention score ${preventionScore.score} out of 100`}
              >
                <span>{preventionScore.score}</span>
                <small>/100</small>
              </div>
              <h2>Overall Prevention Score</h2>
              <p>{preventionScore.explanation}</p>
            </article>

            <article className="score-summary-card">
              <p className="eyebrow">Top 3 health priorities</p>
              <div className="priority-list">
                {preventionScore.topPriorities.map((priority) => (
                  <article className="priority-card" key={priority.id}>
                    <span aria-hidden="true">{priority.icon}</span>
                    <div>
                      <h3>{priority.title}</h3>
                      <p>{priority.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <div className="score-detail-grid">
            <section className="score-detail-card">
              <p className="eyebrow">Already working well</p>
              <h2>What's in your favor</h2>
              <ul className="check-list">
                {preventionScore.positives.length > 0 ? (
                  preventionScore.positives.map((positive) => (
                    <li key={positive}>{positive}</li>
                  ))
                ) : (
                  <li>Add more lifestyle answers to reveal positive signals.</li>
                )}
              </ul>
            </section>

            <section className="score-detail-card">
              <p className="eyebrow">Room to improve</p>
              <h2>Areas for improvement</h2>
              <ul className="check-list improvement">
                {preventionScore.areasForImprovement.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      ) : null}

      {activeView === 'coach' ? (
        <section className="wellness-panel" aria-labelledby="wellness-title">
          <div className="page-heading dashboard-heading">
            <div>
              <p className="eyebrow">Localized prevention plan</p>
              <h1 id="wellness-title">Localized Prevention Plan</h1>
              <p className="page-description">
                Local suggestions are based on your top prevention priorities.
                The app uses Maps search links when exact live place data is not
                available, so it does not invent addresses.
              </p>
            </div>
            <span className="privacy-pill">Location optional</span>
          </div>

          <section className="wellness-privacy-card" aria-label="Privacy">
            <div>
              <h2>Your next healthy step can be local.</h2>
              <p>
                Location is optional. Your family health history stays on your
                device.
              </p>
            </div>
          </section>

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

              <label className="field-group location-field" htmlFor="manual-location">
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

          <div className="wellness-layout">
            <section
              className="wellness-recommendations"
              aria-labelledby="wellness-recommendations-title"
            >
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">Personalized recommendations</p>
                  <h2 id="wellness-recommendations-title">
                    Top 3 priorities to act on
                  </h2>
                </div>
                <span className="member-count">
                  {healthyActionCategories.length} focus areas
                </span>
              </div>

              {familyMembers.length === 0 ? (
                <p className="helper-text">
                  Add family history to personalize these suggestions. For now,
                  the app shows the highest-ranked general prevention areas.
                </p>
              ) : null}

              <div className="wellness-focus-list">
                {healthyActionCategories.map((category) => (
                  <article
                    className={`wellness-focus-card ${getHealthCategoryRiskClass(
                      category.riskLevel,
                    )}`}
                    key={category.id}
                  >
                    <div className="wellness-focus-header">
                      <div>
                        <div className="category-name-with-icon">
                          <span aria-hidden="true">
                            {getHealthCategoryIcon(category.id)}
                          </span>
                          <h3>{category.name}</h3>
                        </div>
                        <p>{category.reason}</p>
                      </div>
                      <span className="wellness-risk-badge">
                        {category.riskLevel}
                      </span>
                    </div>

                    <div className="wellness-action-grid">
                      {category.actions.map((action) => (
                        <article className="wellness-action-card" key={action.id}>
                          <div className="wellness-image-placeholder" aria-hidden="true">
                            <span>{getHealthCategoryIcon(category.id)}</span>
                          </div>
                          <div>
                            <span className="wellness-category">
                              {action.type}
                            </span>
                            <h3>{action.type}</h3>
                            <span className="wellness-distance">
                              Nearby search
                            </span>
                            <p>{action.explanation}</p>
                          </div>

                          <a
                            className="secondary-action map-action"
                            href={action.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in Google Maps{' '}
                            <span aria-hidden="true">→</span>
                          </a>
                        </article>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="wellness-map-card" aria-labelledby="wellness-map-title">
              <div>
                <p className="eyebrow">Map</p>
                <h2 id="wellness-map-title">Explore nearby options</h2>
                <p>
                  The map opens a local search for the first recommended activity.
                  Use each card for more specific searches.
                </p>
              </div>

              <div className="wellness-map-frame">
                <iframe
                  src={healthyActionMapUrl}
                  title="Nearby healthy actions map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeView === 'coach' ? (
        <section className="coach-panel" aria-labelledby="coach-title">
          <div className="page-heading dashboard-heading">
            <div>
              <p className="eyebrow">AI Prevention Coach</p>
              <h1 id="coach-title">AI Prevention Coach</h1>
              <p className="page-description">
                Your coach focuses on education, prevention, motivation, and
                small habit wins over time. It does not diagnose or treat
                medical conditions.
              </p>
            </div>
            <span className="privacy-pill">{coachStreak} day-goal streak</span>
          </div>

          <section className="coach-encouragement-card">
            <div>
              <p className="eyebrow">Weekly encouragement</p>
              <h2>{coachMessage}</h2>
            </div>
            <button
              className="secondary-action"
              type="button"
              onClick={() =>
                document
                  .querySelector('#wellness-title')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              Find Local Support <span aria-hidden="true">→</span>
            </button>
          </section>

          <div className="coach-grid">
            <section className="coach-card">
              <p className="eyebrow">Today</p>
              <h2>Daily goals</h2>
              <ul className="habit-list">
                {coachGoals.map((goal) => (
                  <li key={goal.id}>
                    <label className="habit-check">
                      <input
                        type="checkbox"
                        checked={Boolean(habitProgress[goal.id])}
                        onChange={() => toggleHabitGoal(goal.id)}
                      />
                      <span>
                        <strong>{goal.label}</strong>
                        <small>{goal.detail}</small>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <section className="coach-card">
              <p className="eyebrow">Progress</p>
              <h2>Habit progress</h2>
              <ProgressBar
                value={
                  coachGoals.length
                    ? Math.round((completedCoachGoals.length / coachGoals.length) * 100)
                    : 0
                }
              />
              <div className="coach-chart" aria-label="Weekly goal progress">
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

            <section className="coach-card">
              <p className="eyebrow">Badges</p>
              <h2>Achievements</h2>
              <div className="badge-grid">
                <span className={coachStreak >= 1 ? 'earned' : ''}>
                  First healthy action
                </span>
                <span className={coachStreak >= 3 ? 'earned' : ''}>
                  Three-goal momentum
                </span>
                <span className={preventionScore.score >= 80 ? 'earned' : ''}>
                  Prevention foundation
                </span>
              </div>
            </section>

            <section className="coach-card">
              <p className="eyebrow">Reminder ideas</p>
              <h2>Personalized reminders</h2>
              <ul className="check-list">
                <li>Pick one daily goal and attach it to a routine you already have.</li>
                <li>Review family-history changes once a month.</li>
                <li>Bring your top priorities to your next routine checkup.</li>
              </ul>
            </section>
          </div>
        </section>
      ) : null}

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
