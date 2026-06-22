import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'family-health-tracker.members.v1'

const blankMember = {
  name: '',
  relationship: '',
}

const blankMedication = {
  name: '',
  dosage: '',
  schedule: '',
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getInitial(name) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

function loadMembers() {
  try {
    const storedMembers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')

    if (!Array.isArray(storedMembers)) {
      return []
    }

    return storedMembers
      .filter((member) => member && typeof member.name === 'string')
      .map((member) => ({
        id: member.id || createId(),
        name: member.name,
        relationship: member.relationship || '',
        medications: Array.isArray(member.medications)
          ? member.medications
              .filter(
                (medication) =>
                  medication && typeof medication.name === 'string',
              )
              .map((medication) => ({
                id: medication.id || createId(),
                name: medication.name,
                dosage: medication.dosage || '',
                schedule: medication.schedule || '',
              }))
          : [],
      }))
  } catch {
    return []
  }
}

function App() {
  const [members, setMembers] = useState(loadMembers)
  const [memberForm, setMemberForm] = useState(blankMember)
  const [medicationForms, setMedicationForms] = useState({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members))
  }, [members])

  const medicationCount = useMemo(
    () => members.reduce((total, member) => total + member.medications.length, 0),
    [members],
  )

  function addMember(event) {
    event.preventDefault()

    const name = memberForm.name.trim()
    const relationship = memberForm.relationship.trim()

    if (!name) {
      return
    }

    setMembers((currentMembers) => [
      ...currentMembers,
      {
        id: createId(),
        name,
        relationship,
        medications: [],
      },
    ])
    setMemberForm(blankMember)
  }

  function removeMember(memberId) {
    setMembers((currentMembers) =>
      currentMembers.filter((member) => member.id !== memberId),
    )
    setMedicationForms((currentForms) => {
      const nextForms = { ...currentForms }
      delete nextForms[memberId]
      return nextForms
    })
  }

  function updateMedicationForm(memberId, field, value) {
    setMedicationForms((currentForms) => ({
      ...currentForms,
      [memberId]: {
        ...blankMedication,
        ...currentForms[memberId],
        [field]: value,
      },
    }))
  }

  function addMedication(event, memberId) {
    event.preventDefault()

    const medicationForm = medicationForms[memberId] || blankMedication
    const name = medicationForm.name.trim()
    const dosage = medicationForm.dosage.trim()
    const schedule = medicationForm.schedule.trim()

    if (!name || !schedule) {
      return
    }

    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              medications: [
                ...member.medications,
                {
                  id: createId(),
                  name,
                  dosage,
                  schedule,
                },
              ],
            }
          : member,
      ),
    )
    setMedicationForms((currentForms) => ({
      ...currentForms,
      [memberId]: blankMedication,
    }))
  }

  function removeMedication(memberId, medicationId) {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              medications: member.medications.filter(
                (medication) => medication.id !== medicationId,
              ),
            }
          : member,
      ),
    )
  }

  return (
    <main className="app-shell">
      <section className="app-header" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">Family health</p>
          <h1 id="app-title">Medication Tracker</h1>
        </div>
        <div className="summary-grid" aria-label="Tracker summary">
          <div>
            <strong>{members.length}</strong>
            <span>Members</span>
          </div>
          <div>
            <strong>{medicationCount}</strong>
            <span>Medications</span>
          </div>
        </div>
      </section>

      <section className="add-member-panel" aria-labelledby="add-member-title">
        <div>
          <h2 id="add-member-title">Add Family Member</h2>
        </div>
        <form className="member-form" onSubmit={addMember}>
          <label>
            Name
            <input
              value={memberForm.name}
              onChange={(event) =>
                setMemberForm((currentForm) => ({
                  ...currentForm,
                  name: event.target.value,
                }))
              }
              placeholder="Avery"
              required
            />
          </label>
          <label>
            Relationship
            <input
              value={memberForm.relationship}
              onChange={(event) =>
                setMemberForm((currentForm) => ({
                  ...currentForm,
                  relationship: event.target.value,
                }))
              }
              placeholder="Parent"
            />
          </label>
          <button type="submit">Add member</button>
        </form>
      </section>

      <section className="member-list" aria-label="Family medication list">
        {members.length === 0 ? (
          <div className="empty-state">
            <h2>No Family Members Yet</h2>
            <p>Add a family member to begin tracking medications.</p>
          </div>
        ) : (
          members.map((member) => {
            const medicationForm = medicationForms[member.id] || blankMedication

            return (
              <article className="member-card" key={member.id}>
                <header className="member-card-header">
                  <div className="member-identity">
                    <span aria-hidden="true" className="avatar">
                      {getInitial(member.name)}
                    </span>
                    <div>
                      <h2>{member.name}</h2>
                      <p>{member.relationship || 'Family member'}</p>
                    </div>
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => removeMember(member.id)}
                  >
                    Remove
                  </button>
                </header>

                <div className="medication-section">
                  <div className="section-title-row">
                    <h3>Medications</h3>
                    <span>{member.medications.length}</span>
                  </div>

                  {member.medications.length === 0 ? (
                    <p className="empty-line">No medications added.</p>
                  ) : (
                    <ul className="medication-list">
                      {member.medications.map((medication) => (
                        <li key={medication.id}>
                          <div>
                            <strong>{medication.name}</strong>
                            <span>{medication.schedule}</span>
                            {medication.dosage ? <em>{medication.dosage}</em> : null}
                          </div>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() =>
                              removeMedication(member.id, medication.id)
                            }
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <form
                  className="medication-form"
                  onSubmit={(event) => addMedication(event, member.id)}
                >
                  <label>
                    Medication
                    <input
                      value={medicationForm.name}
                      onChange={(event) =>
                        updateMedicationForm(
                          member.id,
                          'name',
                          event.target.value,
                        )
                      }
                      placeholder="Vitamin D"
                      required
                    />
                  </label>
                  <label>
                    Dosage
                    <input
                      value={medicationForm.dosage}
                      onChange={(event) =>
                        updateMedicationForm(
                          member.id,
                          'dosage',
                          event.target.value,
                        )
                      }
                      placeholder="1000 IU"
                    />
                  </label>
                  <label>
                    Schedule
                    <input
                      value={medicationForm.schedule}
                      onChange={(event) =>
                        updateMedicationForm(
                          member.id,
                          'schedule',
                          event.target.value,
                        )
                      }
                      placeholder="Morning"
                      required
                    />
                  </label>
                  <button type="submit">Add medication</button>
                </form>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

export default App
