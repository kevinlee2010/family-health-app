import { useEffect, useState } from 'react'
import './App.css'
import { buildRiskAssessments } from './riskRules'
import { getConditionDetails } from './conditionDetails'
import { buildFamilyHealthSummary } from './healthCategories'

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

const viewTabs = [
  { id: 'profile', label: 'My Profile' },
  { id: 'history', label: 'Family History Form' },
  { id: 'tree', label: 'Family Tree' },
  { id: 'risk', label: 'Risk Assessment' },
]

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

function getRiskClass(riskLevel) {
  if (riskLevel === 'Current condition') {
    return 'risk-current'
  }

  return `risk-${riskLevel.toLowerCase()}`
}

function getHealthCategoryRiskClass(riskLevel) {
  return `category-${riskLevel.toLowerCase()}`
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
            <strong>Information for this condition is not yet available.</strong>
            <span>
              You can still track it in your profile, family history, tree, and
              risk awareness cards.
            </span>
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
                <span>{category.name}</span>
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
              <span>{category.name}</span>
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

function IllnessPicker({
  inputId,
  inputValue,
  onInputChange,
  onInputClear,
  onAddIllness,
  onClearIllnesses,
  onRemoveIllness,
  onOpenConditionDetails,
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
                  <ConditionButton
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
  const [activeView, setActiveView] = useState('profile')
  const [userProfile, setUserProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: '',
    sex: '',
  })
  const [profileIllnesses, setProfileIllnesses] = useState([])
  const [profileIllnessInput, setProfileIllnessInput] = useState('')
  const [familyMembers, setFamilyMembers] = useState([])
  const [relationship, setRelationship] = useState('')
  const [selectedIllnesses, setSelectedIllnesses] = useState([])
  const [illnessInput, setIllnessInput] = useState('')
  const [error, setError] = useState('')
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState(null)
  const [activeConditionName, setActiveConditionName] = useState(null)
  const [activeHealthCategoryId, setActiveHealthCategoryId] = useState(null)

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
  const riskAssessments = buildRiskAssessments({ familyMembers, userProfile })
  const activeConditionDetails = activeConditionName
    ? getConditionDetails(activeConditionName)
    : null
  const disclaimerText =
    'This tool is for educational purposes only and is not a medical diagnosis. Talk to a healthcare professional for medical advice.'

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
  }

  return (
    <main className="app-shell">
      <header className="app-hero">
        <div className="app-hero-copy">
          <p className="eyebrow">Family health history</p>
          <h1>Family Health Risk Tracker</h1>
          <p className="app-subtitle">
            Capture your profile, record family conditions, visualize patterns,
            and review educational prevention prompts in one simple workspace.
          </p>
        </div>

        <div className="hero-stats" aria-label="Family health summary">
          <div className="hero-stat">
            <strong>{treeEntryCount}</strong>
            <span>People tracked</span>
          </div>
          <div className="hero-stat">
            <strong>{riskAssessments.length}</strong>
            <span>Awareness cards</span>
          </div>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Family health views">
        {viewTabs.map((tab) => (
          <button
            className={activeView === tab.id ? 'view-tab active' : 'view-tab'}
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeView === 'profile' ? (
        <section className="profile-panel" aria-labelledby="profile-title">
          <div className="page-heading">
            <p className="eyebrow">My Profile</p>
            <h1 id="profile-title">My Profile</h1>
          </div>

          <form className="profile-form" onSubmit={saveProfile} noValidate>
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
                Sex
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

            <fieldset className="illness-fieldset">
              <legend>Illnesses or conditions</legend>
              <IllnessPicker
                inputId="profile-illness-search"
                inputValue={profileIllnessInput}
                onInputChange={setProfileIllnessInput}
                onInputClear={() => setProfileIllnessInput('')}
                onAddIllness={addProfileIllness}
                onClearIllnesses={clearProfileIllnesses}
                onRemoveIllness={removeProfileIllness}
                onOpenConditionDetails={openConditionDetails}
                selectedIllnesses={profileIllnesses}
              />
            </fieldset>

            <button className="primary-action" type="submit">
              Save my profile
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
                  onRemoveIllness={removeFamilyIllness}
                  onOpenConditionDetails={openConditionDetails}
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
                Add family member
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
                            <ConditionButton
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

          <div className="family-tree">
            {groupedFamilyMembers.map((tier) => (
              <section className="tree-tier" key={tier.id}>
                <div className="tier-label">
                  <h2>{tier.label}</h2>
                </div>

                {tier.members.length === 0 ? (
                  <p className="empty-tier">No {tier.label.toLowerCase()} added.</p>
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
                          <div className="tree-node-action">
                            <button
                              className="tree-node-select-button"
                              type="button"
                              onClick={() => setSelectedTreeNodeId(member.id)}
                            >
                              <span className="tree-node-header">
                                <span className="tree-node-title-block">
                                  <strong>{getDisplayName(member)}</strong>
                                  {getTreeMeta(member) ? (
                                    <span className="tree-profile-meta">
                                      {getTreeMeta(member)}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="tree-condition-count">
                                  {getConditionSummary(conditionCount)}
                                </span>
                              </span>

                              {member.illnesses.length === 0 ? (
                                <span className="tree-no-illnesses">
                                  No illnesses selected.
                                </span>
                              ) : null}
                            </button>

                            {member.illnesses.length > 0 ? (
                              <ul className="tree-illness-list">
                                {member.illnesses.map((illness) => (
                                  <li key={illness}>
                                    <ConditionButton
                                      className="tree-condition-pill"
                                      conditionName={illness}
                                      onOpenConditionDetails={
                                        openConditionDetails
                                      }
                                    />
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <aside className="tree-detail-panel" aria-live="polite">
            <p className="eyebrow">Selected person</p>
            <h2>{getDisplayName(selectedTreeNode)}</h2>
            <p className="tree-detail-meta">{selectedTreeNode.relationship}</p>
            {selectedTreeNode.isPlaceholder ? (
              <p className="helper-text">
                Add your profile in the My Profile tab to replace this placeholder.
              </p>
            ) : null}
            {selectedTreeNode.illnesses.length > 0 ? (
              <ul className="illness-list">
                {selectedTreeNode.illnesses.map((illness) => (
                  <li key={illness}>
                    <ConditionButton
                      conditionName={illness}
                      onOpenConditionDetails={openConditionDetails}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-illnesses">No illnesses selected.</p>
            )}
          </aside>
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

          <div className="risk-section-heading">
            <p className="eyebrow">Detailed cards</p>
            <h2>Detailed Risk Assessment</h2>
          </div>

          {riskAssessments.length === 0 ? (
            <div className="empty-state">
              <strong>No risk cards yet.</strong>
              <span>Add profile or family history conditions to see educational awareness cards.</span>
            </div>
          ) : (
            <div className="risk-card-list">
              {riskAssessments.map((risk) => (
                <article
                  className={`risk-card ${getRiskClass(risk.riskLevel)}`}
                  key={risk.conditionName}
                >
                  <div className="risk-card-header">
                    <div>
                      <h2>
                        <ConditionButton
                          className="condition-heading-button"
                          conditionName={risk.conditionName}
                          onOpenConditionDetails={openConditionDetails}
                        />
                      </h2>
                      <p>{risk.explanation}</p>
                    </div>
                    <span className="risk-level">{risk.riskLevel}</span>
                  </div>

                  <div className="risk-detail-grid">
                    <div>
                      <h3>Contributors</h3>
                      <ul className="risk-pill-list">
                        {risk.contributors.length > 0 ? (
                          risk.contributors.map((contributor) => (
                            <li key={contributor}>{contributor}</li>
                          ))
                        ) : (
                          <li>No family contributors listed</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3>Personalized prevention</h3>
                      <ul className="prevention-list">
                        {risk.suggestions.map((suggestion) => (
                          <li key={suggestion}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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
  )
}

export default App
