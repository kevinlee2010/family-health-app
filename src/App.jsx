import { useEffect, useState } from 'react'
import './App.css'
import { calculateRisk as calculateAdvancedRisk } from './riskEngine/calculateRisk'
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
    helper: 'Overview and next step',
  },
  {
    id: 'about',
    label: 'My Profile',
    helper: 'Basic profile and current health',
  },
  {
    id: 'family',
    label: 'Family History',
    helper: 'Relatives and conditions',
  },
  {
    id: 'tree',
    label: 'Family Tree',
    helper: 'Visual family structure',
  },
  {
    id: 'risk',
    label: 'Risk Assessment',
    helper: 'Category awareness',
  },
  {
    id: 'results',
    label: 'Results & Tips',
    helper: 'Personalized briefing',
  },
  {
    id: 'actions',
    label: 'Healthy Actions',
    helper: 'Local wellness ideas',
  },
]

const legacyViewMap = {
  actions: 'actions',
  dashboard: 'dashboard',
  history: 'family',
  prevention: 'results',
  profile: 'about',
  risk: 'risk',
  tree: 'tree',
  lifestyle: 'about',
}

const viewTabs = [
  { id: 'dashboard', icon: '⌂', label: 'Dashboard' },
  { id: 'about', icon: '♡', label: 'My Profile' },
  { id: 'family', icon: '👥', label: 'Family History' },
  { id: 'tree', icon: '⌬', label: 'Family Tree' },
  { id: 'risk', icon: '◌', label: 'Risk Assessment' },
  { id: 'results', icon: '✦', label: 'Results & Tips' },
  { id: 'actions', icon: '⌖', label: 'Healthy Actions Near You' },
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
  relationship: '',
  selectedIllnesses: [],
  illnessInput: '',
  familyEarlyDiagnosis: false,
  familyDiagnosisAge: '',
  editingFamilyMemberId: null,
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

function sanitizeActiveView(value) {
  if (guidedSteps.some((step) => step.id === value)) {
    return value
  }

  return legacyViewMap[value] || 'about'
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

function StepProgress({ activeStepId, onStepClick, steps, completedStepIds }) {
  return (
    <nav className="step-progress" aria-label="Progress">
      <ol>
        {steps.map((step, index) => {
          const isActive = step.id === activeStepId
          const isComplete = completedStepIds.includes(step.id)

          return (
            <li key={step.id}>
              <button
                className={`step-progress-item${isActive ? ' active' : ''}${
                  isComplete ? ' complete' : ''
                }`}
                type="button"
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onStepClick(step.id)}
              >
                <span className="step-progress-number" aria-hidden="true">
                  {isComplete ? '✓' : index + 1}
                </span>
                <span>
                  <strong>{step.label}</strong>
                  <small>{step.helper}</small>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
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

function RiskBadge({ riskLevel }) {
  return (
    <span className={`risk-badge risk-badge-${riskLevel.toLowerCase()}`}>
      {riskLevel}
    </span>
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

function getProminentCategories(familyHealthSummary) {
  return familyHealthSummary.topAreas.filter(
    (category) => category.observationCount > 0,
  )
}

function getElevatedResults(advancedRiskAssessments) {
  return advancedRiskAssessments.filter(
    (result) => result.riskLevel !== 'Average' || result.factors.length > 0,
  )
}

function hasAnyFactor(advancedRiskAssessments, factorIds) {
  return advancedRiskAssessments.some((result) =>
    result.factors.some((factor) => factorIds.includes(factor.id)),
  )
}

function getBriefingLifestyleObservations(userProfile) {
  if (!userProfile) {
    return ['No lifestyle profile has been saved yet, so this briefing leans mostly on family history.']
  }

  const observations = []

  if (userProfile.smokingStatus === 'Current') {
    observations.push('current smoking or vaping is one lifestyle area that could matter across several long-term health goals')
  } else if (userProfile.smokingStatus === 'Never') {
    observations.push('not smoking or vaping is a meaningful protective signal')
  } else if (userProfile.smokingStatus === 'Former') {
    observations.push('staying away from tobacco after former use supports long-term prevention')
  }

  if (
    userProfile.exercise === 'Rarely' ||
    userProfile.exercise === '1-2 days/week'
  ) {
    observations.push('your activity level leaves room for a realistic movement routine')
  } else if (
    userProfile.exercise === '3-5 days/week' ||
    userProfile.exercise === 'Nearly every day'
  ) {
    observations.push('your reported exercise routine is working in your favor')
  }

  if (
    userProfile.fruitVegIntake === '0-1 servings' ||
    userProfile.dietQuality === 'Poor' ||
    userProfile.dietQuality === 'Fair'
  ) {
    observations.push('nutrition is an area where small, consistent upgrades may help')
  } else if (
    userProfile.fruitVegIntake === '3-4 servings' ||
    userProfile.fruitVegIntake === '5+ servings' ||
    userProfile.dietQuality === 'Good' ||
    userProfile.dietQuality === 'Excellent'
  ) {
    observations.push('your nutrition responses suggest some supportive habits are already present')
  }

  if (
    userProfile.sleep === 'Less than 6 hours' ||
    userProfile.sleep === 'More than 9 hours'
  ) {
    observations.push('sleep may be worth reviewing because it can affect energy, stress, and prevention habits')
  } else if (userProfile.sleep === '7-9 hours') {
    observations.push('your sleep duration appears to be in a generally supportive range')
  }

  if (userProfile.bmi && userProfile.bmi >= 25) {
    observations.push('weight-support habits may be relevant to heart and metabolic health conversations')
  }

  return observations.length > 0
    ? observations
    : ['your lifestyle responses do not show a single dominant concern yet']
}

function buildHealthBriefing({
  advancedRiskAssessments,
  familyHealthSummary,
  familyMembers,
  trackedConditions,
  userProfile,
}) {
  const prominentCategories = getProminentCategories(familyHealthSummary)
  const elevatedResults = getElevatedResults(advancedRiskAssessments)
  const categoryNames = prominentCategories
    .slice(0, 3)
    .map((category) => category.name.toLowerCase())
  const lifestyleObservations = getBriefingLifestyleObservations(userProfile)

  if (familyMembers.length === 0 && trackedConditions.length === 0) {
    return 'Your briefing is just getting started. Once you add family members, health conditions, and optional lifestyle details, this page will look for recurring patterns and turn them into a simpler prevention-focused summary. Family history can point to predisposition, but it does not mean a condition is certain.'
  }

  const familyPart =
    categoryNames.length > 0
      ? `Your family history currently points most strongly toward ${toReadableList(categoryNames)}.`
      : 'Your current family history does not show one dominant inherited pattern yet.'
  const trendPart =
    elevatedResults.length > 0
      ? `The app also noticed ${elevatedResults.length} area${
          elevatedResults.length === 1 ? '' : 's'
        } where family history, personal health details, or lifestyle answers add extra context.`
      : 'Most scored areas look relatively quiet based on what has been entered so far.'
  const lifestylePart = `On the lifestyle side, ${toReadableList(
    lifestyleObservations.slice(0, 2),
  )}.`

  return `${familyPart} ${trendPart} ${lifestylePart} The important thing to remember is that family history shows predisposition, not certainty; it is a useful prompt for awareness, prevention, and better conversations with a healthcare professional.`
}

function buildStandoutInsights({
  advancedRiskAssessments,
  familyHealthSummary,
  familyMembers,
  userProfile,
}) {
  const insights = []
  const prominentCategories = getProminentCategories(familyHealthSummary)
  const strongestCategory = prominentCategories[0]
  const elevatedResults = getElevatedResults(advancedRiskAssessments)
  const earlyDiagnosisCount = familyMembers.filter(
    (member) => member.earlyDiagnosis,
  ).length
  const conditionCounts = new Map()

  familyMembers.forEach((member) => {
    member.illnesses.forEach((illness) => {
      if (isNoIllness(illness)) {
        return
      }

      const key = getIllnessKey(illness)
      conditionCounts.set(key, {
        name: illness,
        count: (conditionCounts.get(key)?.count || 0) + 1,
      })
    })
  })

  const recurringCondition = Array.from(conditionCounts.values()).find(
    (condition) => condition.count >= 2,
  )

  if (strongestCategory) {
    insights.push({
      icon: getHealthCategoryIcon(strongestCategory.id),
      title: `${strongestCategory.name} stands out most`,
      text: `${strongestCategory.name.toLowerCase()} has the strongest family-history signal in the information entered so far.`,
    })
  }

  if (recurringCondition) {
    insights.push({
      icon: '↻',
      title: `${recurringCondition.name} appears more than once`,
      text: 'A repeated condition is worth keeping organized because it can be useful context during routine care visits.',
    })
  }

  if (earlyDiagnosisCount > 0) {
    insights.push({
      icon: '⏱',
      title: 'Earlier diagnosis details may matter',
      text: `${earlyDiagnosisCount} relative${
        earlyDiagnosisCount === 1 ? ' was' : 's were'
      } marked as diagnosed unusually young, which is useful information to share with a healthcare professional.`,
    })
  }

  if (elevatedResults.length > 0) {
    insights.push({
      icon: '📌',
      title: 'Several inputs point toward prevention conversations',
      text: 'Family history, personal health details, and lifestyle answers combine into a few areas that may deserve extra attention over time.',
    })
  }

  if (
    userProfile &&
    (userProfile.exercise === 'Rarely' ||
      userProfile.exercise === '1-2 days/week' ||
      userProfile.smokingStatus === 'Current' ||
      userProfile.dietQuality === 'Poor' ||
      userProfile.dietQuality === 'Fair')
  ) {
    insights.push({
      icon: '🌿',
      title: 'Lifestyle answers show practical openings',
      text: 'The most useful next steps are likely small habit changes rather than a disease-by-disease checklist.',
    })
  }

  if (prominentCategories.length === 0) {
    insights.push({
      icon: '🧭',
      title: 'No strong family pattern is visible yet',
      text: 'The family history entered so far is limited, so the app is keeping the briefing broad and prevention-focused.',
    })
  }

  return insights.slice(0, 5)
}

function buildPositiveObservations({
  advancedRiskAssessments,
  familyHealthSummary,
  userProfile,
}) {
  const positives = []
  const cancerCategory = familyHealthSummary.categories.find(
    (category) => category.id === 'cancer',
  )

  if (userProfile?.smokingStatus === 'Never') {
    positives.push('No smoking or vaping was reported.')
  }

  if (
    userProfile?.exercise === '3-5 days/week' ||
    userProfile?.exercise === 'Nearly every day'
  ) {
    positives.push('Your reported exercise routine is a strong foundation.')
  }

  if (
    userProfile?.fruitVegIntake === '3-4 servings' ||
    userProfile?.fruitVegIntake === '5+ servings' ||
    userProfile?.dietQuality === 'Good' ||
    userProfile?.dietQuality === 'Excellent'
  ) {
    positives.push('Your nutrition responses suggest helpful eating habits.')
  }

  if (userProfile?.sleep === '7-9 hours') {
    positives.push('Your sleep duration is in a generally supportive range.')
  }

  if (cancerCategory?.observationCount === 0) {
    positives.push('No hereditary cancer pattern is visible in the entered family history.')
  }

  const averageCount = advancedRiskAssessments.filter(
    (result) => result.riskLevel === 'Average' && result.factors.length === 0,
  ).length

  if (averageCount >= 3) {
    positives.push('Several assessed areas have no scored risk factors entered yet.')
  }

  return positives.slice(0, 5)
}

function buildImpactRecommendations({ advancedRiskAssessments, userProfile }) {
  const recommendations = []
  const addRecommendation = (id, priority, icon, title, text) => {
    if (recommendations.some((recommendation) => recommendation.id === id)) {
      return
    }

    recommendations.push({ id, icon, priority, text, title })
  }

  if (hasAnyFactor(advancedRiskAssessments, ['smoking'])) {
    addRecommendation(
      'smoking',
      100,
      '🚭',
      'Make tobacco or vaping support the first priority',
      'If current smoking or vaping was reported, consider asking a healthcare professional about quit-support options. This may support heart, lung, cancer, and overall prevention goals.',
    )
  }

  if (hasAnyFactor(advancedRiskAssessments, ['knownHighBloodPressure'])) {
    addRecommendation(
      'blood-pressure',
      95,
      '🩺',
      'Keep blood pressure monitoring visible',
      'Because high blood pressure was reported, regular monitoring and a clear follow-up plan may help guide prevention conversations.',
    )
  }

  if (hasAnyFactor(advancedRiskAssessments, ['knownHighCholesterol'])) {
    addRecommendation(
      'cholesterol',
      90,
      '🩸',
      'Discuss cholesterol monitoring',
      'Cholesterol can be elevated without obvious symptoms, so it may be useful to ask when screening or follow-up is appropriate.',
    )
  }

  if (hasAnyFactor(advancedRiskAssessments, ['physicalInactivity'])) {
    addRecommendation(
      'movement',
      85,
      '🏃',
      'Start with a repeatable movement goal',
      'Try a 20-minute walk three times this week, then build gradually if it feels safe and sustainable.',
    )
  }

  if (
    hasAnyFactor(advancedRiskAssessments, [
      'elevatedBmi',
      'higherBmi',
      'lowProduceIntake',
    ]) ||
    userProfile?.dietQuality === 'Poor' ||
    userProfile?.dietQuality === 'Fair'
  ) {
    addRecommendation(
      'nutrition',
      80,
      '🥗',
      'Choose one simple nutrition upgrade',
      'For the next week, add one fiber-rich food each day, such as vegetables, fruit, beans, whole grains, or lean protein, and consider reducing highly processed or high-sodium foods.',
    )
  }

  if (hasAnyFactor(advancedRiskAssessments, ['shortSleep'])) {
    addRecommendation(
      'sleep',
      72,
      '🌙',
      'Protect sleep consistency',
      'A steady bedtime window and a short wind-down routine may make other prevention habits easier to maintain.',
    )
  }

  if (advancedRiskAssessments.some((result) => result.familyMembers.length >= 2)) {
    addRecommendation(
      'family-history',
      70,
      '📋',
      'Bring family patterns to your next visit',
      'Write down which relatives were affected and whether anyone was diagnosed unusually young so a healthcare professional can interpret the pattern in context.',
    )
  }

  addRecommendation(
    'routine-care',
    50,
    '📅',
    'Keep routine preventive care on the calendar',
    'Use regular checkups to review blood pressure, cholesterol, blood sugar, screening timing, and any new family-history details.',
  )

  return recommendations
    .sort((first, second) => second.priority - first.priority)
    .slice(0, 3)
}

function ResultsBriefingPage({
  advancedRiskAssessments,
  familyHealthSummary,
  familyMembers,
  trackedConditions,
  userProfile,
}) {
  const briefing = buildHealthBriefing({
    advancedRiskAssessments,
    familyHealthSummary,
    familyMembers,
    trackedConditions,
    userProfile,
  })
  const insights = buildStandoutInsights({
    advancedRiskAssessments,
    familyHealthSummary,
    familyMembers,
    userProfile,
  })
  const positives = buildPositiveObservations({
    advancedRiskAssessments,
    familyHealthSummary,
    userProfile,
  })
  const recommendations = buildImpactRecommendations({
    advancedRiskAssessments,
    userProfile,
  })

  return (
    <section className="results-briefing-page" aria-labelledby="results-title">
      <section className="briefing-hero-card">
        <p className="eyebrow">Personalized summary</p>
        <h1 id="results-title">Your Health Story</h1>
        <p>{briefing}</p>
      </section>

      <section className="briefing-section" aria-labelledby="stood-out-title">
        <div className="briefing-section-heading">
          <p className="eyebrow">Key takeaways</p>
          <h2 id="stood-out-title">What Stood Out</h2>
        </div>
        <div className="briefing-card-grid">
          {insights.map((insight) => (
            <article className="briefing-insight-card" key={insight.title}>
              <span aria-hidden="true">{insight.icon}</span>
              <div>
                <h3>{insight.title}</h3>
                <p>{insight.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {positives.length > 0 ? (
        <section className="briefing-section" aria-labelledby="favor-title">
          <div className="briefing-section-heading">
            <p className="eyebrow">Protective signals</p>
            <h2 id="favor-title">What's Working in Your Favor</h2>
          </div>
          <ul className="briefing-positive-list">
            {positives.map((positive) => (
              <li key={positive}>{positive}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="briefing-section" aria-labelledby="impact-title">
        <div className="briefing-section-heading">
          <p className="eyebrow">Highest-impact next steps</p>
          <h2 id="impact-title">Top 3 Health Priorities</h2>
        </div>
        <div className="impact-action-list">
          {recommendations.map((recommendation, index) => (
            <article className="impact-action-card" key={recommendation.id}>
              <span className="impact-action-rank">{index + 1}</span>
              <span className="impact-action-icon" aria-hidden="true">
                {recommendation.icon}
              </span>
              <div>
                <h3>{recommendation.title}</h3>
                <p>{recommendation.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="briefing-looking-ahead" aria-labelledby="looking-ahead-title">
        <p className="eyebrow">Education, not diagnosis</p>
        <h2 id="looking-ahead-title">Looking Ahead</h2>
        <p>
          Family history is one part of health, alongside environment,
          lifestyle, access to care, age, and chance. Use this briefing as a
          starting point for prevention habits and routine conversations with a
          qualified healthcare professional.
        </p>
      </section>
    </section>
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
  const activeHealthCategory =
    familyHealthSummary.categories.find(
      (category) => category.id === activeHealthCategoryId,
    ) || null
  const profileBmi = calculateBmi(profileForm)
  const advancedRiskAssessments = calculateAdvancedRisk(
    familyMembers,
    userProfile || {
      ...profileForm,
      bmi: profileBmi,
      illnesses: profileIllnesses,
    },
  )
  const activeConditionDetails = activeConditionName
    ? getConditionDetails(activeConditionName)
    : null
  const disclaimerText =
    'This educational tool organizes family history and lifestyle information. It does not provide a diagnosis or replace professional medical advice.'
  const trackedConditions = getUniqueIllnesses([
    ...familyMembers,
    ...(userProfile ? [userProfile] : []),
  ])
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
      icon: '❤️',
      label: 'Top Health Priorities',
      value: familyHealthSummary.topAreas.filter(
        (category) => category.riskLevel !== 'Average',
      ).length,
      detail:
        familyHealthSummary.topAreas[0]?.riskLevel !== 'Average'
          ? familyHealthSummary.topAreas
              .filter((category) => category.riskLevel !== 'Average')
              .slice(0, 2)
              .map((category) => category.name)
              .join(', ')
          : 'No elevated category yet',
    },
    {
      icon: '📍',
      label: 'Healthy Actions Near You',
      value: healthyActionCategories.length,
      detail: wellnessLocationTarget
        ? `Using ${wellnessLocationTarget}`
        : 'Add location when ready',
    },
  ]
  const workflowProgress = workflowSteps.map((step, index) => {
    const isComplete =
      step.id === 'dashboard' ||
      (step.id === 'about' && Boolean(userProfile)) ||
      (step.id === 'family' && familyMembers.length > 0) ||
      (step.id === 'tree' && familyMembers.length > 0) ||
      (step.id === 'risk' && advancedRiskAssessments.length > 0) ||
      (step.id === 'results' && advancedRiskAssessments.length > 0) ||
      (step.id === 'actions' && (Boolean(wellnessLocationTarget) || healthyActionCategories.length > 0))

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
  const finishTarget = activeView === 'actions' ? 'dashboard' : null
  const dashboardWorkflowProgress = workflowProgress.map((step, index) => ({
    ...step,
    isActive: step.id === activeView || (activeView === 'dashboard' && index === 0),
  }))
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
      relationship,
      selectedIllnesses,
      illnessInput,
      familyEarlyDiagnosis,
      familyDiagnosisAge,
      editingFamilyMemberId,
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
    familyEarlyDiagnosis,
    familyDiagnosisAge,
    editingFamilyMemberId,
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
    setIsNavOpen(false)
    setActiveConditionName(null)
    setActiveHealthCategoryId(null)
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
        relationship,
        illnesses: selectedIllnesses,
        earlyDiagnosis: familyEarlyDiagnosis,
          diagnosisAge: familyDiagnosisAge,
        },
      ])
      setSuccessMessage('Family member added.')
    }

    setRelationship('')
    setSelectedIllnesses([])
    setIllnessInput('')
    setFamilyEarlyDiagnosis(false)
    setFamilyDiagnosisAge('')
    setEditingFamilyMemberId(null)
    setError('')
  }

  function editFamilyMember(member) {
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
    setActiveConditionName(null)
    setActiveHealthCategoryId(null)
    setManualLocation('')
    setUserCoordinates(null)
    setLocationStatus('idle')
    setLocationMessage('')
  }

  function goToNextStep() {
    if (activeView === 'about') {
      saveProfileData('Progress saved.')
    }

    changeView(continueTarget)
  }

  function goToPreviousStep() {
    if (previousWorkflowStep) {
      changeView(previousWorkflowStep.id)
    }
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
              onClick={() => changeView('about')}
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

        <StepProgress
          activeStepId={activeView}
          completedStepIds={workflowProgress
            .filter((step) => step.isComplete)
            .map((step) => step.id)}
          onStepClick={changeView}
          steps={workflowSteps}
        />

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
                Continue your assessment and turn your family history into a
                clearer, prevention-focused health picture.
              </p>
            </div>
            <div className="dashboard-progress-summary">
              <span>{completionPercent}% complete</span>
              <ProgressBar value={completionPercent} />
              <button
                className="primary-action"
                type="button"
                onClick={() => changeView('about')}
              >
                Continue Your Assessment <span aria-hidden="true">→</span>
              </button>
            </div>
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
                  <h2>Results</h2>
                </div>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => changeView('results')}
                >
                  View Results <span aria-hidden="true">→</span>
                </button>
              </div>

              <p className="dashboard-next-step-copy">
                Review your educational risk results and a personalized action
                plan based on the information you entered.
              </p>
            </section>
          </div>
        </section>
      ) : null}

      {activeView === 'about' ? (
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
                    onClick={() => changeView('about')}
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
                    onClick={() => changeView('about')}
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
      ) : null}

      {activeView === 'risk' ? (
        <section className="risk-panel" aria-labelledby="risk-title">
          <div className="page-heading dashboard-heading">
            <div>
              <p className="eyebrow">Risk Assessment</p>
              <h1 id="risk-title">Family health categories</h1>
              <p className="page-description">
                These cards summarize family-history patterns for educational
                awareness. They are not diagnoses or clinical predictions.
              </p>
            </div>
            <span className="privacy-pill">Educational only</span>
          </div>

          <div className="risk-category-grid">
            {familyHealthSummary.categories.map((category) => (
              <article
                className={`risk-category-card ${getHealthCategoryRiskClass(
                  category.riskLevel,
                )}`}
                key={category.id}
              >
                <div className="risk-category-card-top">
                  <span className="risk-category-icon" aria-hidden="true">
                    {getHealthCategoryIcon(category.id)}
                  </span>
                  <RiskBadge riskLevel={category.riskLevel} />
                </div>
                <h2>{category.name}</h2>
                <p>{category.explanation}</p>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => openHealthCategoryDetails(category.id)}
                >
                  View Details <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === 'results' ? (
        <ResultsBriefingPage
          advancedRiskAssessments={advancedRiskAssessments}
          familyHealthSummary={familyHealthSummary}
          familyMembers={familyMembers}
          trackedConditions={trackedConditions}
          userProfile={userProfile}
        />
      ) : null}

      {activeView === 'about' ? (
        <>
        <section className="profile-panel" aria-labelledby="lifestyle-title">
          <div className="page-heading">
            <p className="eyebrow">Lifestyle</p>
            <h1 id="lifestyle-title">Lifestyle & Prevention Habits</h1>
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
          </div>
        </section>
        </>
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
