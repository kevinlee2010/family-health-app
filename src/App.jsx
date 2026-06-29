import { useState } from 'react'
import './App.css'
import { buildRiskAssessments } from './riskRules'

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

const starterIllnesses = [
  noIllnessOption,
  'Type 2 Diabetes',
  'Heart Disease',
  'High Blood Pressure',
  'High Cholesterol',
  'Breast Cancer',
  'Colon Cancer',
  'Stroke',
  'Asthma',
  'Cancer',
  'Depression',
  "Alzheimer's Disease",
  'Kidney Disease',
  'Obesity',
  'Autoimmune Disease',
]

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

function isNoIllness(value) {
  return normalizeIllness(value) === normalizeIllness(noIllnessOption)
}

function getConditionCount(illnesses) {
  return illnesses.filter((illness) => !isNoIllness(illness)).length
}

function addIllnessToList(currentIllnesses, illness) {
  const normalizedIllness = normalizeIllness(illness)

  if (!normalizedIllness) {
    return currentIllnesses
  }

  if (isNoIllness(illness)) {
    return [noIllnessOption]
  }

  if (
    currentIllnesses.some(
      (currentIllness) => normalizeIllness(currentIllness) === normalizedIllness,
    )
  ) {
    return currentIllnesses
  }

  return [
    ...currentIllnesses.filter((currentIllness) => !isNoIllness(currentIllness)),
    illness,
  ]
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

function IllnessPicker({
  inputId,
  inputValue,
  onInputChange,
  onInputClear,
  onAddIllness,
  onRemoveIllness,
  selectedIllnesses,
}) {
  const normalizedInput = normalizeIllness(inputValue)
  const selectedIllnessKeys = selectedIllnesses.map(normalizeIllness)
  const canAddTypedIllness =
    normalizedInput !== '' && !selectedIllnessKeys.includes(normalizedInput)
  const matchingSuggestions = starterIllnesses.filter((illness) => {
    const normalizedIllness = normalizeIllness(illness)

    return (
      !selectedIllnessKeys.includes(normalizedIllness) &&
      normalizedInput !== '' &&
      normalizedIllness.includes(normalizedInput)
    )
  })
  const showSuggestions = matchingSuggestions.length > 0

  function addIllness(illness) {
    const normalizedIllness = normalizeIllness(illness)

    if (!normalizedIllness) {
      return
    }

    const matchingStarterIllness = starterIllnesses.find(
      (starterIllness) => normalizeIllness(starterIllness) === normalizedIllness,
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
            {matchingSuggestions.map((illness) => (
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
        ) : null}
      </div>

      <div className="illness-picker-section">
        <p className="picker-label">Selected:</p>
        {selectedIllnesses.length > 0 ? (
          <ul className="selected-illness-list">
            {selectedIllnesses.map((illness) => (
              <li key={illness}>
                <button
                  className="selected-illness-pill"
                  type="button"
                  onClick={() => onRemoveIllness(illness)}
                  aria-label={`Remove ${illness}`}
                >
                  {illness}
                  <span aria-hidden="true">&times;</span>
                </button>
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
  const riskAssessments = buildRiskAssessments({ familyMembers, userProfile })

  function addProfileIllness(illness) {
    setProfileIllnesses((currentIllnesses) =>
      addIllnessToList(currentIllnesses, illness),
    )
  }

  function removeProfileIllness(illness) {
    setProfileIllnesses((currentIllnesses) =>
      currentIllnesses.filter(
        (item) => normalizeIllness(item) !== normalizeIllness(illness),
      ),
    )
  }

  function addFamilyIllness(illness) {
    setSelectedIllnesses((currentIllnesses) =>
      addIllnessToList(currentIllnesses, illness),
    )
  }

  function removeFamilyIllness(illness) {
    setSelectedIllnesses((currentIllnesses) =>
      currentIllnesses.filter(
        (item) => normalizeIllness(item) !== normalizeIllness(illness),
      ),
    )
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
                onRemoveIllness={removeProfileIllness}
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
                          <li className="illness-pill" key={illness}>
                            {illness}
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
                          <button
                            className="tree-node-action"
                            type="button"
                            onClick={() => setSelectedTreeNodeId(member.id)}
                          >
                            <div className="tree-node-header">
                              <div>
                                <strong>{getDisplayName(member)}</strong>
                                {getTreeMeta(member) ? (
                                  <p className="tree-profile-meta">
                                    {getTreeMeta(member)}
                                  </p>
                                ) : null}
                              </div>
                              <span>{getConditionSummary(conditionCount)}</span>
                            </div>

                            {member.illnesses.length > 0 ? (
                              <ul className="tree-illness-list">
                                {member.illnesses.map((illness) => (
                                  <li key={illness}>{illness}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="tree-no-illnesses">
                                No illnesses selected.
                              </p>
                            )}
                          </button>
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
                  <li className="illness-pill" key={illness}>
                    {illness}
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

          <p className="medical-disclaimer">
            This tool is for educational purposes only and is not a medical
            diagnosis. Talk to a healthcare professional for medical advice.
          </p>

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
                      <h2>{risk.conditionName}</h2>
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
    </main>
  )
}

export default App
