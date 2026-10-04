import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assessmentSteps,
  getAssessmentNavigationAccess,
  getAssessmentCompletionPercent,
  getFirstIncompleteRequiredView,
  getAssessmentReminderMessage,
  getNextIncompleteAssessmentView,
} from '../src/assessmentFlow.js'

test('assessment flow starts with current health', () => {
  assert.deepEqual(
    assessmentSteps.map((step) => step.id),
    ['health', 'lifestyle', 'structure', 'family', 'insights', 'coach'],
  )
})

test('onboarding continues to current health before family history', () => {
  assert.equal(
    getNextIncompleteAssessmentView({
      hasCurrentHealthData: false,
      hasFamilyHistoryData: false,
      hasFamilyStructureData: false,
      hasLifestyleData: false,
    }),
    'health',
  )
})

test('assessment continues to everyday habits after current health is complete', () => {
  assert.equal(
    getNextIncompleteAssessmentView({
      hasCurrentHealthData: true,
      hasFamilyHistoryData: false,
      hasFamilyStructureData: false,
      hasLifestyleData: false,
    }),
    'lifestyle',
  )
})

test('assessment continues to family structure after everyday habits are complete', () => {
  assert.equal(
    getNextIncompleteAssessmentView({
      hasCurrentHealthData: true,
      hasFamilyHistoryData: false,
      hasFamilyStructureData: false,
      hasLifestyleData: true,
    }),
    'structure',
  )
})

test('assessment continues to family tree when only family history is incomplete', () => {
  assert.equal(
    getNextIncompleteAssessmentView({
      hasCurrentHealthData: true,
      hasFamilyHistoryData: false,
      hasFamilyStructureData: true,
      hasLifestyleData: true,
    }),
    'family',
  )
})

test('assessment completion percent reflects completed sections', () => {
  assert.equal(
    getAssessmentCompletionPercent({
      hasCurrentHealthData: false,
      hasFamilyHistoryData: false,
      hasFamilyStructureData: false,
      hasLifestyleData: false,
    }),
    0,
  )
  assert.equal(
    getAssessmentCompletionPercent({
      hasCurrentHealthData: true,
      hasFamilyHistoryData: false,
      hasFamilyStructureData: true,
      hasLifestyleData: false,
    }),
    50,
  )
  assert.equal(
    getAssessmentCompletionPercent({
      hasCurrentHealthData: true,
      hasFamilyHistoryData: true,
      hasFamilyStructureData: true,
      hasLifestyleData: true,
    }),
    100,
  )
})

test('assessment reminders match incomplete destinations', () => {
  assert.equal(
    getAssessmentReminderMessage('health'),
    'Complete Your Current Health before continuing.',
  )
  assert.equal(
    getAssessmentReminderMessage('family'),
    'Add health information for Mother and Father before continuing.',
  )
})

test('sidebar access stops at the first incomplete required section', () => {
  const completion = {
    hasCurrentHealthData: true,
    hasFamilyHistoryData: false,
    hasFamilyStructureData: true,
    hasLifestyleData: false,
  }

  assert.equal(getFirstIncompleteRequiredView(completion), 'lifestyle')
  assert.equal(
    getAssessmentNavigationAccess({ targetView: 'health', ...completion }).allowed,
    true,
  )
  assert.equal(
    getAssessmentNavigationAccess({ targetView: 'lifestyle', ...completion }).allowed,
    true,
  )
  assert.equal(
    getAssessmentNavigationAccess({ targetView: 'insights', ...completion }).allowed,
    false,
  )
  assert.equal(
    getAssessmentNavigationAccess({ targetView: 'insights', ...completion }).message,
    'Finish Your Everyday Habits before continuing.',
  )
})

test('all assessment sections are accessible after required profile sections are complete', () => {
  const completion = {
    hasCurrentHealthData: true,
    hasFamilyHistoryData: true,
    hasFamilyStructureData: true,
    hasLifestyleData: true,
  }

  assert.equal(
    getAssessmentNavigationAccess({ targetView: 'coach', ...completion }).allowed,
    true,
  )
  assert.equal(getFirstIncompleteRequiredView(completion), null)
})
