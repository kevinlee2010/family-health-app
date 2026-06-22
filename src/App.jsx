import { useState } from 'react'
import './App.css'

const relationships = ['Mother', 'Father', 'Sibling', 'Grandparent']

const conditions = [
  'Type 2 diabetes',
  'Heart disease',
  'High blood pressure',
  'High cholesterol',
  'Breast cancer',
  'Colon cancer',
  'Stroke',
]

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function App() {
  const [familyMembers, setFamilyMembers] = useState([])
  const [relationship, setRelationship] = useState('')
  const [selectedConditions, setSelectedConditions] = useState([])
  const [error, setError] = useState('')

  function toggleCondition(condition) {
    setSelectedConditions((currentConditions) =>
      currentConditions.includes(condition)
        ? currentConditions.filter((item) => item !== condition)
        : [...currentConditions, condition],
    )
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
        conditions: selectedConditions,
      },
    ])
    setRelationship('')
    setSelectedConditions([])
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

          <fieldset className="condition-fieldset">
            <legend>Conditions</legend>
            <div className="condition-grid">
              {conditions.map((condition) => (
                <label className="condition-option" key={condition}>
                  <input
                    type="checkbox"
                    checked={selectedConditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                  />
                  <span>{condition}</span>
                </label>
              ))}
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

                {member.conditions.length > 0 ? (
                  <ul className="condition-list">
                    {member.conditions.map((condition) => (
                      <li className="condition-pill" key={condition}>
                        {condition}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-conditions">No listed conditions selected.</p>
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
