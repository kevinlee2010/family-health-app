import { useEffect, useState } from 'react'
import './App.css'
import { calculateRisk } from './riskRules'
import { getConditionDetails } from './conditionDetails'
import { buildFamilyHealthSummary } from './healthCategories'
import { buildFamilyHealthPatterns } from './familyPatterns'

const relationships = ['Mother', 'Father', 'Sibling', 'Grandparent']

const sexOptions = ['Female', 'Male', 'Intersex', 'Prefer not to say']

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

const appPages = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', showInSidebar: true },
  {
    id: 'profile',
    label: 'My Profile',
    icon: '👤',
    progressLabel: 'My Profile',
    showInSidebar: true,
  },
  {
    id: 'history',
    label: 'Family History',
    icon: '👨‍👩‍👧',
    progressLabel: 'Family History',
    showInSidebar: true,
  },
  {
    id: 'tree',
    label: 'Family Tree',
    icon: '🌳',
    progressLabel: 'Family Tree',
    showInSidebar: true,
  },
  {
    id: 'risk',
    label: 'Risk Assessment',
    icon: '📊',
    progressLabel: 'Risk Assessment',
    showInSidebar: true,
  },
  {
    id: 'prevention',
    label: 'Results & Tips',
    icon: '🩺',
    progressLabel: 'Results & Tips',
    showInSidebar: true,
  },
  {
    id: 'actions',
    label: 'Healthy Actions Near You',
    icon: '📍',
    showInSidebar: true,
  },
  { id: 'reports', label: 'Reports', icon: '📄', showInSidebar: true },
]

const viewTabs = appPages
  .filter((page) => page.showInSidebar)
  .map(({ id, icon, label }) => ({ id, icon, label }))

const defaultPreventionTips = [
  {
    icon: '🩺',
    title: 'Discuss screening',
    text: 'Review your personal and family history with a healthcare professional.',
  },
  {
    icon: '🏃',
    title: 'Stay active',
    text: 'Aim for regular movement that fits your health, schedule, and abilities.',
  },
  {
    icon: '📄',
    title: 'Track changes',
    text: 'Update symptoms, diagnoses, and family history when something changes.',
  },
  {
    icon: '🚭',
    title: 'Avoid tobacco',
    text: 'Avoid tobacco and secondhand smoke to support heart, lung, and cancer prevention.',
  },
]

const resultsRiskLevels = ['Increased', 'High', 'Current Condition']

const initialProfileForm = {
  name: '',
  age: '',
  sex: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  smokingStatus: '',
  alcoholUse: '',
  exercise: '',
  dietQuality: '',
  sleep: '',
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

const sleepOptions = [
  'Less than 6 hours',
  '6-7 hours',
  '7-9 hours',
  'More than 9 hours',
]

const storageKey = 'family-health-app-state-v1'

const defaultSavedState = {
  activeView: 'dashboard',
  userProfile: null,
  profileForm: initialProfileForm,
  profileIllnesses: [],
  profileIllnessInput: '',
  familyMembers: [],
  relationship: '',
  selectedIllnesses: [],
  illnessInput: '',
  selectedTreeNodeId: null,
  collapsedTreeSections: {},
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
    sex: asString(value.sex),
    heightFeet: asString(value.heightFeet),
    heightInches: asString(value.heightInches),
    weight: asString(value.weight),
    bmi: typeof value.bmi === 'number' ? value.bmi : '',
    smokingStatus: asString(value.smokingStatus),
    alcoholUse: asString(value.alcoholUse),
    exercise: asString(value.exercise),
    dietQuality: asString(value.dietQuality),
    sleep: asString(value.sleep),
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

function sanitizeActiveView(value) {
  return appPages.some((page) => page.id === value) ? value : 'dashboard'
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
    relationship: relationships.includes(value.relationship)
      ? value.relationship
      : '',
    selectedIllnesses: asStringArray(value.selectedIllnesses),
    illnessInput: asString(value.illnessInput),
    selectedTreeNodeId:
      typeof value.selectedTreeNodeId === 'string'
        ? value.selectedTreeNodeId
        : null,
    collapsedTreeSections: sanitizeCollapsedSections(value.collapsedTreeSections),
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

const workflowSteps = appPages
  .filter((page) => page.progressLabel)
  .map(({ id, icon, progressLabel }) => ({ id, icon, label: progressLabel }))

const healthCategoryIcons = {
  cardiovascular: '❤️',
  metabolic: '🩸',
  cancer: '🧬',
  neurological: '🧠',
  respiratory: '🫁',
  kidney: '🩺',
  mental: '🧠',
}

const summaryCategoryLabels = {
  cardiovascular: 'cardiovascular health',
  metabolic: 'diabetes and metabolic health',
  cancer: 'cancer history',
  neurological: 'neurological health',
  respiratory: 'respiratory health',
  kidney: 'kidney health',
  mental: 'mental health',
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

function getElevatedCategoryNames(categories) {
  return categories
    .filter((category) => category.riskLevel !== 'Average')
    .map((category) => category.name.toLowerCase())
}

function formatReadableList(items) {
  if (items.length <= 1) {
    return items[0] || ''
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function hasRiskCondition(riskAssessments, keywords) {
  return riskAssessments.some((risk) => {
    const conditionName = normalizeIllness(risk.conditionName)
    const hasSignal =
      risk.riskLevel === 'High' ||
      risk.riskLevel === 'Increased' ||
      risk.riskLevel === 'Current Condition'

    return (
      hasSignal &&
      keywords.some((keyword) => conditionName.includes(normalizeIllness(keyword)))
    )
  })
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

function getCategoryById(categories, categoryId) {
  return categories.find((category) => category.id === categoryId)
}

function buildLifestyleInsightParts(userProfile) {
  if (!userProfile) {
    return []
  }

  const lifestyleParts = []

  if (userProfile.smokingStatus === 'Current') {
    lifestyleParts.push(
      'Because current smoking was listed, avoiding tobacco and asking about quit-support resources may be one of the highest-impact prevention steps.',
    )
  } else if (userProfile.smokingStatus === 'Former') {
    lifestyleParts.push(
      'Because former smoking was listed, continuing to avoid tobacco supports heart, lung, and cancer prevention.',
    )
  }

  if (userProfile.alcoholUse === 'Daily') {
    lifestyleParts.push(
      'Because daily alcohol use was listed, it may be worth discussing safer alcohol limits with a healthcare professional.',
    )
  }

  if (
    userProfile.exercise === 'Rarely' ||
    userProfile.exercise === '1-2 days/week'
  ) {
    lifestyleParts.push(
      'Because activity is currently limited, starting with short walks or other low-pressure movement can be a practical next step.',
    )
  }

  if (
    userProfile.dietQuality === 'Poor' ||
    userProfile.dietQuality === 'Fair'
  ) {
    lifestyleParts.push(
      'Because diet quality was marked lower, simple nutrition goals like more fiber-rich foods, fruits, vegetables, and fewer highly processed foods may be useful.',
    )
  }

  if (
    userProfile.sleep === 'Less than 6 hours' ||
    userProfile.sleep === 'More than 9 hours'
  ) {
    lifestyleParts.push(
      'Because sleep duration is outside the typical 7-9 hour range, sleep habits may be another helpful topic to review during routine care.',
    )
  }

  if (userProfile.bmi && userProfile.bmi >= 25) {
    lifestyleParts.push(
      'Because BMI is above the typical adult range, healthy weight support may be relevant for prevention conversations, especially for heart and metabolic health.',
    )
  }

  return lifestyleParts
}

function getSummaryCategoryLabel(category) {
  return summaryCategoryLabels[category.id] || category.name.toLowerCase()
}

function buildOverallHealthSummaryText({
  familyHealthSummary,
  familyHealthPatterns,
  familyMembers,
  trackedConditions,
  userProfile,
}) {
  const presentCategories = familyHealthSummary.categories.filter(
    (category) => category.observationCount > 0,
  )
  const elevatedCategories = presentCategories.filter(
    (category) => category.riskLevel !== 'Average',
  )
  const categoryNames = presentCategories.map(getSummaryCategoryLabel)

  if (familyMembers.length === 0) {
    if (userProfile && trackedConditions.length > 0) {
      return 'Your personal profile has been started, but no family members have been added yet. Add relatives and their conditions to reveal family health patterns, inherited risk signals, and prevention topics that fit your family history.'
    }

    return 'No family health history has been entered yet. Add relatives and any known conditions to build a clearer picture of your family patterns and prevention priorities.'
  }

  const familyText = `${familyMembers.length} family member${
    familyMembers.length === 1 ? ' has' : 's have'
  } been added`
  const conditionText =
    trackedConditions.length > 0
      ? `with ${trackedConditions.length} unique condition${
          trackedConditions.length === 1 ? '' : 's'
        } tracked across your profile and family history`
      : 'with no conditions selected so far'
  const categoryText =
    categoryNames.length > 0
      ? `The family history includes ${formatReadableList(categoryNames.slice(0, 4))}${
          categoryNames.length > 4 ? ', and other health areas' : ''
        }.`
      : 'No major health category stands out in the family history yet.'
  const riskText =
    elevatedCategories.length > 0
      ? `The strongest family-history signals are in ${formatReadableList(
          elevatedCategories.map(getSummaryCategoryLabel).slice(0, 3),
        )}.`
      : 'The current entries are limited enough that no category stands out strongly yet.'
  const patternText =
    familyHealthPatterns.insights.length > 0
      ? 'The patterns below highlight repeated conditions, close-relative patterns, and side-of-family clusters where they appear.'
      : 'As more family members are added, this page will look for repeated conditions, close-relative patterns, and maternal or paternal clusters.'

  return `${familyText} ${conditionText}. ${categoryText} ${riskText} ${patternText}`
}

function buildPersonalizedPreventionPlan({
  familyHealthSummary,
  riskAssessments,
  trackedConditions,
  userProfile,
}) {
  const elevatedCategoryNames = getElevatedCategoryNames(
    familyHealthSummary.categories,
  )
  const cardiovascularCategory = getCategoryById(
    familyHealthSummary.categories,
    'cardiovascular',
  )
  const metabolicCategory = getCategoryById(
    familyHealthSummary.categories,
    'metabolic',
  )
  const cancerCategory = getCategoryById(familyHealthSummary.categories, 'cancer')
  const hasCardiovascularSignal =
    cardiovascularCategory?.riskLevel !== 'Average' ||
    hasRiskCondition(riskAssessments, [
      'heart',
      'stroke',
      'blood pressure',
      'hypertension',
      'cholesterol',
    ])
  const hasDiabetesSignal =
    hasRiskCondition(riskAssessments, ['diabetes', 'obesity']) ||
    metabolicCategory?.riskLevel === 'High'
  const hasCancerSignal =
    cancerCategory?.riskLevel !== 'Average' ||
    hasRiskCondition(riskAssessments, ['cancer', 'melanoma'])
  const currentConditionCount = riskAssessments.filter(
    (risk) => risk.riskLevel === 'Current Condition',
  ).length

  if (trackedConditions.length === 0) {
    return 'No family health patterns have been entered yet, so this plan starts with the basics: maintain regular physical activity, balanced nutrition, a healthy weight, routine health checkups, and discussing your family history with a healthcare professional as it grows. As you add conditions, this section will focus more on screening conversations and prevention topics that match your family history.'
  }

  const opening =
    elevatedCategoryNames.length > 0
      ? `Based on the family history entered so far, the strongest areas to review are ${formatReadableList(elevatedCategoryNames.slice(0, 3))}.`
      : 'Based on the family history entered so far, no single health category stands out strongly yet.'
  const foundation =
    'A strong prevention foundation includes regular physical activity, balanced nutrition, maintaining a healthy weight, routine healthcare visits, and sharing your family history with a healthcare professional.'
  const focusParts = []

  if (hasCardiovascularSignal) {
    focusParts.push(
      'Because cardiovascular conditions appear in the family history, it may be especially helpful to focus on heart health, regular physical activity, avoiding tobacco, and checking blood pressure and cholesterol during routine visits.',
    )
  }

  if (hasDiabetesSignal) {
    focusParts.push(
      'Because diabetes or metabolic concerns appear in the family history, healthy weight, balanced meals, regular movement, and asking about blood sugar screening are practical prevention topics to discuss.',
    )
  }

  if (hasCancerSignal) {
    focusParts.push(
      'Because cancer appears in the family history, consider asking a healthcare professional whether any screening should start earlier or happen more often based on which relatives were affected.',
    )
  }

  if (focusParts.length === 0) {
    focusParts.push(
      'A steady prevention routine is still valuable: stay active, eat a balanced diet, keep preventive visits on the calendar, and use checkups to review any new symptoms or family history changes.',
    )
  }

  if (currentConditionCount > 0) {
    focusParts.push(
      'For conditions already listed in your own profile, continue using this information as a conversation starter with your care team rather than as a diagnosis or treatment plan.',
    )
  }

  focusParts.push(...buildLifestyleInsightParts(userProfile))

  return `${opening} ${foundation} ${focusParts.join(' ')} Over time, keep monitoring changes in your personal and family health history so your screening conversations and prevention priorities stay up to date.`
}

function getUniqueIllnesses(entries) {
  const illnessMap = new Map()

  entries.forEach((entry) => {
    entry.illnesses.forEach((illness) => {
      if (isNoIllness(illness)) {
        return
      }

      const key = getIllnessKey(illness)

      if (!illnessMap.has(key)) {
        illnessMap.set(key, illness)
      }
    })
  })

  return Array.from(illnessMap.values())
}

function getProfileCompletion(profileForm, profileIllnesses) {
  const completedFields = [
    profileForm.name.trim(),
    profileForm.age,
    profileForm.sex,
    profileIllnesses.length > 0 ? 'conditions' : '',
  ].filter(Boolean).length

  return Math.round((completedFields / 4) * 100)
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

function FamilyHealthSummaryDashboard({ summary, onOpenCategoryDetails }) {
  const hasElevatedAreas = summary.topAreas.some(
    (category) => category.riskLevel !== 'Average',
  )

  return (
    <section
      className="family-health-dashboard"
      aria-labelledby="family-health-summary-title"
    >
      <div className="summary-dashboard-header">
        <div>
          <p className="eyebrow">Family Health Summary</p>
          <h2 id="family-health-summary-title">
            Overall Family Health Summary
          </h2>
          <p>
            Categories group family history entries into broad health areas for
            educational awareness. Some conditions may appear in more than one
            category.
          </p>
        </div>

        <div className="summary-count-grid" aria-label="Risk category counts">
          <div className="summary-count summary-count-high">
            <strong>{summary.riskCounts.High}</strong>
            <span>High</span>
          </div>
          <div className="summary-count summary-count-increased">
            <strong>{summary.riskCounts.Increased}</strong>
            <span>Increased</span>
          </div>
          <div className="summary-count summary-count-average">
            <strong>{summary.riskCounts.Average}</strong>
            <span>Average</span>
          </div>
        </div>
      </div>

      <div className="attention-summary">
        <div>
          <h3>Top three areas to review</h3>
          <p>
            {hasElevatedAreas
              ? 'These categories currently have the strongest family-history signals.'
              : 'No elevated categories yet; these are the first areas shown while more history is added.'}
          </p>
        </div>

        <ul className="attention-area-list">
          {summary.topAreas.map((category) => (
            <li key={category.id}>
              <button
                className={`attention-area-button ${getHealthCategoryRiskClass(
                  category.riskLevel,
                )}`}
                type="button"
                onClick={() => onOpenCategoryDetails(category.id)}
              >
                <span className="category-name-with-icon">
                  <span aria-hidden="true">
                    {getHealthCategoryIcon(category.id)}
                  </span>
                  <span>{category.name}</span>
                </span>
                <strong>{category.riskLevel}</strong>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="health-category-grid">
        {summary.categories.map((category) => (
          <button
            className={`health-category-card ${getHealthCategoryRiskClass(
              category.riskLevel,
            )}`}
            key={category.id}
            type="button"
            onClick={() => onOpenCategoryDetails(category.id)}
          >
            <span className="category-card-topline">
              <span className="category-name-with-icon">
                <span aria-hidden="true">
                  {getHealthCategoryIcon(category.id)}
                </span>
                <span>{category.name}</span>
              </span>
              <strong>{category.riskLevel}</strong>
            </span>
            <span className="category-card-explanation">
              {category.explanation}
            </span>

            {category.conditions.length > 0 ? (
              <span className="category-condition-preview">
                {category.conditions.map((condition) => (
                  <span key={condition.conditionName}>
                    {condition.conditionName}
                  </span>
                ))}
              </span>
            ) : (
              <span className="category-empty-note">
                No mapped family conditions yet.
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}

function HealthCategoryDetailsModal({
  category,
  onClose,
  onOpenConditionDetails,
}) {
  return (
    <div className="condition-modal-backdrop" onClick={onClose}>
      <section
        className="condition-modal health-category-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-category-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="condition-modal-header">
          <div>
            <p className="eyebrow">Family health category</p>
            <h2 id="health-category-detail-title">{category.name}</h2>
          </div>
          <button
            className="remove-button"
            type="button"
            onClick={onClose}
            aria-label="Close family health category details"
          >
            &times;
          </button>
        </div>

        <p className="condition-modal-disclaimer">
          This category summary is educational only and is not medical advice.
          Talk to a healthcare professional for medical advice.
        </p>

        <section
          className={`category-detail-risk ${getHealthCategoryRiskClass(
            category.riskLevel,
          )}`}
        >
          <div>
            <h3>{category.riskLevel} family-history awareness</h3>
            <p>{category.explanation}</p>
          </div>
          <span>{category.observationCount} family entries</span>
        </section>

        <section className="condition-overview">
          <h3>What this category includes</h3>
          <p>{category.description}</p>
        </section>

        <section className="category-detail-conditions">
          <h3>Family conditions contributing to this category</h3>
          {category.conditions.length > 0 ? (
            <ul>
              {category.conditions.map((condition) => (
                <li key={condition.conditionName}>
                  <div>
                    <ConditionButton
                      className="category-detail-condition-button"
                      conditionName={condition.conditionName}
                      onOpenConditionDetails={onOpenConditionDetails}
                    />
                    <span>
                      Listed by {condition.relatives.join(', ')}
                      {condition.count > condition.relatives.length
                        ? ` (${condition.count} total entries)`
                        : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="category-empty-note">
              No family history entries currently map to this category.
            </p>
          )}
        </section>
      </section>
    </div>
  )
}

function FamilyHealthPatterns({ onOpenConditionDetails, patterns }) {
  const hasInsights = patterns.insights.length > 0

  return (
    <section
      className="family-patterns-panel"
      aria-labelledby="family-patterns-title"
    >
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Pattern Detection</p>
          <h2 id="family-patterns-title">Family Health Patterns</h2>
        </div>
        <span className="privacy-pill">Awareness only</span>
      </div>

      <p className="pattern-disclaimer">
        These patterns are for awareness only and are not medical advice or a
        diagnosis. Talk to a healthcare professional about personal risk.
      </p>

      {hasInsights ? (
        <div className="pattern-layout">
          <div className="pattern-insight-list">
            {patterns.insights.map((insight) => (
              <article className="pattern-card" key={insight.id}>
                <h3>{insight.text}</h3>
                <p>{insight.detail}</p>
                {insight.conditionNames.length > 0 ? (
                  <ul className="pattern-condition-list">
                    {insight.conditionNames.slice(0, 4).map((conditionName) => (
                      <li key={conditionName}>
                        <ClickableConditionTag
                          conditionName={conditionName}
                          onOpenConditionDetails={onOpenConditionDetails}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          <aside className="common-condition-panel">
            <h3>Most common conditions</h3>
            {patterns.commonConditions.length > 0 ? (
              <ol>
                {patterns.commonConditions.map((condition) => (
                  <li key={condition.conditionName}>
                    <strong>{condition.conditionName}</strong>
                    <span>
                      {condition.count} entr{condition.count === 1 ? 'y' : 'ies'}
                      {condition.relatives.length > 0
                        ? ` from ${condition.relatives.join(', ')}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="helper-text">
                Add family history entries to see common condition patterns.
              </p>
            )}
          </aside>
        </div>
      ) : (
        <div className="empty-state compact-empty">
          <strong>No family health patterns yet.</strong>
          <span>
            Add family members and conditions to detect repeated conditions,
            generational patterns, and side-of-family clusters.
          </span>
        </div>
      )}
    </section>
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
  const [relationship, setRelationship] = useState(savedAppState.relationship)
  const [selectedIllnesses, setSelectedIllnesses] = useState(
    savedAppState.selectedIllnesses,
  )
  const [illnessInput, setIllnessInput] = useState(savedAppState.illnessInput)
  const [error, setError] = useState('')
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState(
    savedAppState.selectedTreeNodeId,
  )
  const [collapsedTreeSections, setCollapsedTreeSections] = useState(
    savedAppState.collapsedTreeSections,
  )
  const [activeConditionName, setActiveConditionName] = useState(null)
  const [activeHealthCategoryId, setActiveHealthCategoryId] = useState(null)
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
  const familyHealthPatterns = buildFamilyHealthPatterns(familyMembers)
  const activeHealthCategory =
    familyHealthSummary.categories.find(
      (category) => category.id === activeHealthCategoryId,
    ) || null
  const riskAssessments = calculateRisk(familyMembers, userProfile)
  const activeConditionDetails = activeConditionName
    ? getConditionDetails(activeConditionName)
    : null
  const disclaimerText =
    'This tool is for educational purposes only and is not a medical diagnosis. Talk to a healthcare professional for medical advice.'
  const trackedConditions = getUniqueIllnesses([
    ...familyMembers,
    ...(userProfile ? [userProfile] : []),
  ])
  const profileBmi = calculateBmi(profileForm)
  const profileCompletion = getProfileCompletion(profileForm, profileIllnesses)
  const resultRiskAssessments = riskAssessments.filter((risk) =>
    resultsRiskLevels.includes(risk.riskLevel),
  )
  const overallHealthSummaryText = buildOverallHealthSummaryText({
    familyHealthSummary,
    familyHealthPatterns,
    familyMembers,
    trackedConditions,
    userProfile,
  })
  const resultsPatternInsights = familyHealthPatterns.insights.slice(0, 6)
  const highRiskCount = riskAssessments.filter(
    (risk) => risk.riskLevel === 'High',
  ).length
  const increasedRiskCount = riskAssessments.filter(
    (risk) => risk.riskLevel === 'Increased',
  ).length
  const currentConditionCount = riskAssessments.filter(
    (risk) => risk.riskLevel === 'Current Condition',
  ).length
  const personalizedPreventionPlan = buildPersonalizedPreventionPlan({
    familyHealthSummary,
    riskAssessments,
    trackedConditions,
    userProfile,
  })
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
      icon: '👨‍👩‍👧',
      label: 'Family Members',
      value: familyMembers.length,
      detail: userProfile ? 'Profile included in tree' : 'Add your profile next',
    },
    {
      icon: '🧬',
      label: 'Conditions Tracked',
      value: trackedConditions.length,
      detail:
        trackedConditions.length > 0
          ? `${trackedConditions.length} unique condition${
              trackedConditions.length === 1 ? '' : 's'
            }`
          : 'Start with profile or family history',
    },
    {
      icon: '📊',
      label: 'Risk Insights',
      value: riskAssessments.length,
      detail:
        highRiskCount > 0
          ? `${highRiskCount} high awareness`
          : `${increasedRiskCount} increased awareness`,
    },
  ]
  const workflowProgress = workflowSteps.map((step, index) => {
    const isComplete =
      (step.id === 'profile' && Boolean(userProfile)) ||
      (step.id === 'history' && familyMembers.length > 0) ||
      (step.id === 'tree' && treeEntryCount > 0) ||
      (step.id === 'risk' && riskAssessments.length > 0) ||
      (step.id === 'prevention' && resultRiskAssessments.length > 0)

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
  const finishTarget = activeView === 'prevention' ? 'dashboard' : null
  const dashboardWorkflowProgress = workflowProgress.map((step, index) => ({
    ...step,
    isActive: index === 0,
  }))

  useEffect(() => {
    saveAppState({
      activeView,
      userProfile,
      profileForm,
      profileIllnesses,
      profileIllnessInput,
      familyMembers,
      relationship,
      selectedIllnesses,
      illnessInput,
      selectedTreeNodeId,
      collapsedTreeSections,
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
    relationship,
    selectedIllnesses,
    illnessInput,
    selectedTreeNodeId,
    collapsedTreeSections,
    manualLocation,
    userCoordinates,
    locationStatus,
    locationMessage,
  ])

  useEffect(() => {
    if (!activeConditionName && !activeHealthCategoryId) {
      return undefined
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setActiveHealthCategoryId(null)
        setActiveConditionName(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [activeConditionName, activeHealthCategoryId])

  function openConditionDetails(conditionName) {
    setActiveHealthCategoryId(null)
    setActiveConditionName(conditionName)
  }

  function openHealthCategoryDetails(categoryId) {
    setActiveConditionName(null)
    setActiveHealthCategoryId(categoryId)
  }

  function changeView(viewId) {
    setActiveView(viewId)
    setActiveConditionName(null)
    setActiveHealthCategoryId(null)

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

  function saveProfile(event) {
    event.preventDefault()

    setUserProfile({
      id: 'self',
      relationship: 'Self',
      name: profileForm.name.trim(),
      age: profileForm.age,
      sex: profileForm.sex,
      heightFeet: profileForm.heightFeet,
      heightInches: profileForm.heightInches,
      weight: profileForm.weight,
      bmi: profileBmi,
      smokingStatus: profileForm.smokingStatus,
      alcoholUse: profileForm.alcoholUse,
      exercise: profileForm.exercise,
      dietQuality: profileForm.dietQuality,
      sleep: profileForm.sleep,
      illnesses: profileIllnesses,
      isSelf: true,
    })
  }

  function addFamilyMember(event) {
    event.preventDefault()

    if (!relationship) {
      setError('Choose a relationship before adding a family member.')
      return
    }

    setFamilyMembers((currentMembers) => [
      ...currentMembers,
      {
        id: createId(),
        relationship,
        illnesses: selectedIllnesses,
      },
    ])
    setRelationship('')
    setSelectedIllnesses([])
    setIllnessInput('')
    setError('')
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
    setRelationship('')
    setSelectedIllnesses([])
    setIllnessInput('')
    setError('')
    setSelectedTreeNodeId(null)
    setCollapsedTreeSections({})
    setActiveConditionName(null)
    setActiveHealthCategoryId(null)
    setManualLocation('')
    setUserCoordinates(null)
    setLocationStatus('idle')
    setLocationMessage('')
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar" aria-label="Family health dashboard">
        <div className="sidebar-brand">
          <span className="brand-mark" aria-hidden="true">
            🩺
          </span>
          <div>
            <strong>Health History</strong>
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
              onClick={() => changeView('risk')}
            >
              Analyze My Family History
              <span aria-hidden="true">→</span>
            </button>
            <div className="hero-secondary-actions">
              {isWorkflowView ? (
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() =>
                    changeView(previousWorkflowStep?.id || 'dashboard')
                  }
                >
                  <span aria-hidden="true">←</span>
                  {previousWorkflowStep ? 'Back' : 'Back to Dashboard'}
                </button>
              ) : null}

              <button
                className="secondary-action"
                type="button"
                onClick={() => changeView(finishTarget || continueTarget)}
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

      {activeView === 'dashboard' ? (
        <section className="dashboard-panel" aria-labelledby="dashboard-title">
          <div className="page-heading dashboard-heading">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1 id="dashboard-title">Health overview</h1>
            </div>
            <span className="privacy-pill">Your data stays on your device.</span>
          </div>

          <section
            className="progress-panel dashboard-progress-panel"
            aria-label="Setup progress"
          >
            <ol className="progress-steps">
              {dashboardWorkflowProgress.map((step) => (
                <li key={step.id}>
                  <button
                    className={`progress-step${
                      step.isComplete ? ' complete' : ''
                    }${step.isActive ? ' active' : ''}`}
                    type="button"
                    onClick={() => changeView(step.id)}
                  >
                    <span className="progress-number">{step.number}</span>
                    <span className="progress-label">
                      <span aria-hidden="true">{step.icon}</span>
                      <span>{step.label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

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
                  <h2>Top areas to review</h2>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => changeView('risk')}
                >
                  Learn More <span aria-hidden="true">→</span>
                </button>
              </div>

              <ul className="dashboard-attention-list">
                {familyHealthSummary.topAreas.map((category) => (
                  <li key={category.id}>
                    <button
                      className={`attention-area-button ${getHealthCategoryRiskClass(
                        category.riskLevel,
                      )}`}
                      type="button"
                      onClick={() => openHealthCategoryDetails(category.id)}
                    >
                      <span className="category-name-with-icon">
                        <span aria-hidden="true">
                          {getHealthCategoryIcon(category.id)}
                        </span>
                        <span>{category.name}</span>
                      </span>
                      <strong>{category.riskLevel}</strong>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="insight-panel">
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">Next steps</p>
                  <h2>Results & Tips</h2>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => changeView('prevention')}
                >
                  View Results & Tips <span aria-hidden="true">→</span>
                </button>
              </div>

              <ul className="compact-tip-list">
                {defaultPreventionTips.slice(0, 3).map((tip) => (
                  <li key={tip.title}>
                    <strong>{tip.title}</strong>
                    <span>{tip.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>
      ) : null}

      {activeView === 'profile' ? (
        <section className="profile-panel" aria-labelledby="profile-title">
          <div className="page-heading">
            <p className="eyebrow">Optional profile</p>
            <h1 id="profile-title">Lifestyle & Health Profile</h1>
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

                <label className="field-group" htmlFor="profile-age">
                  Age
                  <input
                    id="profile-age"
                    type="number"
                    min="0"
                    value={profileForm.age}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        age: event.target.value,
                      }))
                    }
                    placeholder="Age"
                  />
                </label>

                <label className="field-group" htmlFor="profile-sex">
                  Biological sex
                  <select
                    id="profile-sex"
                    value={profileForm.sex}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        sex: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {sexOptions.map((sexOption) => (
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
                <p className="eyebrow">Lifestyle Questions</p>
                <h2>Daily habits</h2>
              </div>

              <div className="lifestyle-grid">
                <label className="field-group" htmlFor="profile-smoking">
                  Smoking status
                  <select
                    id="profile-smoking"
                    value={profileForm.smokingStatus}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        smokingStatus: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {smokingOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group" htmlFor="profile-alcohol">
                  Alcohol use
                  <select
                    id="profile-alcohol"
                    value={profileForm.alcoholUse}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        alcoholUse: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {alcoholOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group" htmlFor="profile-exercise">
                  Exercise
                  <select
                    id="profile-exercise"
                    value={profileForm.exercise}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        exercise: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {exerciseOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group" htmlFor="profile-diet">
                  Diet quality
                  <select
                    id="profile-diet"
                    value={profileForm.dietQuality}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        dietQuality: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {dietQualityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-group" htmlFor="profile-sleep">
                  Sleep
                  <select
                    id="profile-sleep"
                    value={profileForm.sleep}
                    onChange={(event) =>
                      setProfileForm((currentProfile) => ({
                        ...currentProfile,
                        sleep: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose one</option>
                    {sleepOptions.map((option) => (
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
                {[userProfile.age ? `${userProfile.age} years old` : '', userProfile.sex]
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

      {activeView === 'history' ? (
        <>
          <section className="family-form-panel" aria-labelledby="form-title">
            <div className="page-heading">
              <p className="eyebrow">Family history</p>
              <h1 id="form-title">Add a family member</h1>
            </div>

            <form className="family-form" onSubmit={addFamilyMember} noValidate>
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

              <p className="form-error" role="alert" aria-live="polite">
                {error}
              </p>

              <button className="primary-action" type="submit">
                <span aria-hidden="true" className="button-icon">
                  +
                </span>
                Add family member <span aria-hidden="true">→</span>
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
                  <li className="family-card" key={member.id}>
                    <div className="family-card-header">
                      <p className="relationship-name">{member.relationship}</p>
                      <button
                        className="remove-button"
                        type="button"
                        aria-label={`Remove ${member.relationship}`}
                        onClick={() => removeFamilyMember(member.id)}
                      >
                        &times;
                      </button>
                    </div>

                    {member.illnesses.length > 0 ? (
                      <ul className="illness-list">
                        {member.illnesses.map((illness) => (
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
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {activeView === 'tree' ? (
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
                    Add your profile in the My Profile tab to replace this
                    placeholder.
                  </p>
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => changeView('profile')}
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
                    onClick={() => changeView('profile')}
                  >
                    Edit Profile <span aria-hidden="true">→</span>
                  </button>
                </div>
              ) : (
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
      ) : null}

      {activeView === 'risk' ? (
        <section className="risk-panel" aria-labelledby="risk-title">
          <div className="page-heading">
            <p className="eyebrow">Educational risk awareness</p>
            <h1 id="risk-title">Risk Assessment</h1>
          </div>

          <FamilyHealthSummaryDashboard
            summary={familyHealthSummary}
            onOpenCategoryDetails={openHealthCategoryDetails}
          />

          <FamilyHealthPatterns
            onOpenConditionDetails={openConditionDetails}
            patterns={familyHealthPatterns}
          />
        </section>
      ) : null}

      {activeView === 'prevention' ? (
        <section
          className="prevention-panel results-tips-panel"
          aria-labelledby="prevention-title"
        >
          <div className="page-heading dashboard-heading">
            <div>
              <p className="eyebrow">Results & Tips</p>
              <h1 id="prevention-title">Results & Tips</h1>
            </div>
            <span className="privacy-pill">Your data stays on your device.</span>
          </div>

          <section
            className="overall-summary-card"
            aria-label="Overall Health Summary"
          >
            <div>
              <p className="eyebrow">Overall Health Summary</p>
              <h2>What your family history shows</h2>
              <p className="summary-copy">{overallHealthSummaryText}</p>
            </div>
          </section>

          <section
            className="results-summary-section"
            aria-labelledby="results-patterns-title"
          >
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Pattern Detection</p>
                <h2 id="results-patterns-title">Family Health Patterns</h2>
              </div>
              {resultsPatternInsights.length > 0 ? (
                <span className="member-count">
                  {resultsPatternInsights.length} insight
                  {resultsPatternInsights.length === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>

            {resultsPatternInsights.length > 0 ? (
              <ul className="summary-insight-list">
                {resultsPatternInsights.map((insight) => (
                  <li className="summary-insight-item" key={insight.id}>
                    <span className="summary-insight-icon" aria-hidden="true">
                      {insight.id.includes('maternal') ||
                      insight.id.includes('paternal')
                        ? '👨‍👩‍👧'
                        : '🧬'}
                    </span>
                    <div>
                      <strong>{insight.text}</strong>
                      <p>{insight.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state compact-empty">
                <strong>No family health patterns yet.</strong>
                <span>
                  Add family members and conditions to detect repeated
                  conditions, close-relative patterns, and side-of-family
                  clusters.
                </span>
              </div>
            )}
          </section>

          <section
            className="personalized-prevention-plan"
            aria-labelledby="personalized-prevention-title"
          >
            <div className="personalized-prevention-heading">
              <div>
                <p className="eyebrow">From your entries</p>
                <h2 id="personalized-prevention-title">
                  Personalized Prevention Plan
                </h2>
              </div>
              <span className="member-count">
                {trackedConditions.length} tracked condition
                {trackedConditions.length === 1 ? '' : 's'}
              </span>
            </div>

            <p className="personalized-prevention-copy">
              {personalizedPreventionPlan}
            </p>
          </section>

          <p className="prevention-disclaimer">
            This information is provided for educational purposes only and is not
            a medical diagnosis. Please consult a qualified healthcare
            professional for personalized medical advice.
          </p>
        </section>
      ) : null}

      {activeView === 'actions' ? (
        <section className="wellness-panel" aria-labelledby="wellness-title">
          <div className="page-heading dashboard-heading">
            <div>
              <p className="eyebrow">Local wellness</p>
              <h1 id="wellness-title">Healthy Actions Near You</h1>
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
                    Top health areas to act on
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
                          <div>
                            <span className="wellness-category">
                              {action.type}
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

      {activeView === 'reports' ? (
        <section className="reports-panel" aria-labelledby="reports-title">
          <div className="page-heading">
            <p className="eyebrow">Reports</p>
            <h1 id="reports-title">Reports</h1>
          </div>

          <div className="report-grid">
            <article className="report-card">
              <span className="card-topline">
                <span className="card-icon" aria-hidden="true">
                  👨‍👩‍👧
                </span>
                <span>Family health snapshot</span>
              </span>
              <strong>{familyMembers.length} family members</strong>
              <p>{trackedConditions.length} unique conditions tracked.</p>
            </article>
            <article className="report-card">
              <span className="card-topline">
                <span className="card-icon" aria-hidden="true">
                  📊
                </span>
                <span>Risk overview</span>
              </span>
              <strong>{highRiskCount} high awareness</strong>
              <p>
                {increasedRiskCount} increased and {currentConditionCount} current
                condition cards.
              </p>
            </article>
            <article className="report-card">
              <span className="card-topline">
                <span className="card-icon" aria-hidden="true">
                  👤
                </span>
                <span>Profile status</span>
              </span>
              <strong>{profileCompletion}% complete</strong>
              <p>Profile information helps place you in the family tree.</p>
            </article>
          </div>

          <section className="report-summary-panel">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Tracked conditions</p>
                <h2>Current report summary</h2>
              </div>
              <span className="privacy-pill">Your data stays on your device.</span>
            </div>

            {trackedConditions.length === 0 ? (
              <div className="empty-state compact-empty">
                <strong>No tracked conditions yet.</strong>
                <span>Add profile or family history entries to build the report.</span>
              </div>
            ) : (
              <ul className="illness-list">
                {trackedConditions.map((condition) => (
                  <li key={condition}>
                    <ClickableConditionTag
                      conditionName={condition}
                      onOpenConditionDetails={openConditionDetails}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      ) : null}

      <p className="app-disclaimer">{disclaimerText}</p>

      {activeConditionName ? (
        <ConditionDetailsModal
          conditionName={activeConditionName}
          details={activeConditionDetails}
          onClose={() => setActiveConditionName(null)}
        />
      ) : null}

      {activeHealthCategory ? (
        <HealthCategoryDetailsModal
          category={activeHealthCategory}
          onClose={() => setActiveHealthCategoryId(null)}
          onOpenConditionDetails={openConditionDetails}
        />
      ) : null}
      </main>
    </div>
  )
}

export default App
