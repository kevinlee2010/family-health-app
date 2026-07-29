import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getDetectedHealthTerms,
  getHealthTopics,
  getValidationRejection,
  isHealthRelated,
} from '../scripts/fetch-events.js'

const currentDate = new Date('2026-07-28T12:00:00-07:00')

function createCandidate(title, description = '') {
  const combinedText = `${title} ${description}`

  return {
    city: 'San Francisco',
    description,
    eventDateText: 'August 15, 2026',
    healthTopics: getHealthTopics(combinedText),
    isRecurring: false,
    isUpcoming: true,
    locationName: 'San Francisco',
    registrationUrl: 'https://calendar.ucsf.edu/event/example',
    sourceUrl: 'https://calendar.ucsf.edu/event/example',
    title,
  }
}

test('accepts legitimate medical, wellness, rehabilitation, caregiver, and patient-support events', () => {
  const acceptedTitles = [
    'Future Global Cancer Leaders Seminar',
    'Dementia Care Aware: Live Cognitive Health Assessment Training',
    'Neurology Wednesday Conference',
    'Native American Health Alliance Book Club',
    'Toastmasters for Health',
    'Core and More: For People with Cancer',
    'The Sleep Equation: Everyday Strategies for Better Sleep',
    'Meditation and Guided Imagery',
    'Workout Wednesdays for Neuro-Oncology Patients',
  ]

  acceptedTitles.forEach((title) => {
    const rejectionReason = getValidationRejection(
      createCandidate(title, 'Public educational event for patients and caregivers.'),
      currentDate,
    )

    assert.equal(rejectionReason, '', `${title} should be accepted`)
    assert.equal(isHealthRelated(title), true, `${title} should detect health terms`)
    assert.notEqual(getDetectedHealthTerms(title).length, 0)
  })
})

test('continues rejecting unrelated administrative or campus events', () => {
  const rejectedTitles = [
    'Staff Assembly General Meeting',
    'UCSF Town Hall',
    'Lunch on the Lawn',
    'CREST Program: Mock Interviews',
    'GME CORE Residency First Look 2026',
  ]

  rejectedTitles.forEach((title) => {
    const rejectionReason = getValidationRejection(createCandidate(title), currentDate)

    assert.notEqual(rejectionReason, '', `${title} should be rejected`)
  })
})

test('rejects career or administrative events even when descriptions contain health terms', () => {
  const candidate = createCandidate(
    'CREST Program: Mock Interviews',
    'Mock interviews for medical school, nurse practitioner, and physician assistant programs at a cancer center.',
  )
  const rejectionReason = getValidationRejection(candidate, currentDate)

  assert.notEqual(rejectionReason, '')
})

test('does not treat performance alone as entertainment in health context', () => {
  const title = 'The Sleep Equation: Cognitive Performance and Better Sleep'
  const rejectionReason = getValidationRejection(createCandidate(title), currentDate)

  assert.equal(rejectionReason, '')
  assert.deepEqual(getDetectedHealthTerms(title), ['Sleep', 'Cognitive'])
})
