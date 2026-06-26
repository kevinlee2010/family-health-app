import { useState } from 'react'
import './App.css'

const relationships = ['Mother', 'Father', 'Sibling', 'Grandparent']

const starterIllnesses = [
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

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeIllness(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
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

function App() {
  const [familyMembers, setFamilyMembers] = useState([])
  const [relationship, setRelationship] = useState('')
  const [selectedIllnesses, setSelectedIllnesses] = useState([])
  const [illnessInput, setIllnessInput] = useState('')
  const [error, setError] = useState('')

  const normalizedIllnessInput = normalizeIllness(illnessInput)
  const selectedIllnessKeys = selectedIllnesses.map(normalizeIllness)
  const canAddTypedIllness =
    normalizedIllnessInput !== '' &&
    !selectedIllnessKeys.includes(normalizedIllnessInput)
  const matchingIllnessSuggestions = starterIllnesses.filter((illness) => {
    const normalizedIllness = normalizeIllness(illness)

    return (
      !selectedIllnessKeys.includes(normalizedIllness) &&
      (!normalizedIllnessInput ||
        normalizedIllness.includes(normalizedIllnessInput))
    )
  })
  const showIllnessSuggestions =
    normalizedIllnessInput !== '' && matchingIllnessSuggestions.length > 0

  function addIllness(illness) {
    const normalizedIllness = normalizeIllness(illness)

    if (!normalizedIllness) {
      return
    }

    setSelectedIllnesses((currentIllnesses) =>
      currentIllnesses.some(
        (currentIllness) => normalizeIllness(currentIllness) === normalizedIllness,
      )
        ? currentIllnesses
        : [...currentIllnesses, illness],
    )
    setIllnessInput('')
  }

  function addTypedIllness() {
    const matchingStarterIllness = starterIllnesses.find(
      (illness) => normalizeIllness(illness) === normalizedIllnessInput,
    )

    addIllness(matchingStarterIllness || formatCustomIllness(illnessInput))
  }

  function removeIllness(illness) {
    setSelectedIllnesses((currentIllnesses) =>
      currentIllnesses.filter(
        (item) => normalizeIllness(item) !== normalizeIllness(illness),
      ),
    )
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
            <div className="autocomplete">
              <label className="field-group" htmlFor="illness-search">
                <span className="visually-hidden">Search illness or condition</span>
                <input
                  id="illness-search"
                  className="autocomplete-input"
                  aria-autocomplete="list"
                  aria-controls="illness-suggestions"
                  aria-expanded={showIllnessSuggestions}
                  role="combobox"
                  type="text"
                  value={illnessInput}
                  onChange={(event) => setIllnessInput(event.target.value)}
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

              {showIllnessSuggestions ? (
                <ul
                  className="suggestion-list"
                  id="illness-suggestions"
                  role="listbox"
                >
                  {matchingIllnessSuggestions.map((illness) => (
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
                        onClick={() => removeIllness(illness)}
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
    </main>
  )
}

export default App
