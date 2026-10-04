import assert from 'node:assert/strict'
import test from 'node:test'

import { buildDashboardProfileSummary } from '../src/dashboardProfileSummary.js'

test('profile summary uses the first two ranked areas without inventing extras', () => {
  const summary = buildDashboardProfileSummary({
    topPriorities: [
      { title: 'Breast Cancer Prevention' },
      { title: 'Heart Health' },
      { title: 'Mental Well-Being' },
    ],
  })

  assert.deepEqual(summary.focusAreas, ['Breast Cancer Prevention', 'Heart Health'])
})

test('profile summary derives concise strengths from actual lifestyle answers', () => {
  const summary = buildDashboardProfileSummary({
    profile: {
      alcoholUse: 'Occasionally',
      exercise: '3-5 days/week',
      smokingStatus: 'Current',
    },
  })

  assert.deepEqual(summary.strongHabits, [
    'Regular physical activity',
    'Limited alcohol use',
  ])
})

test('profile summary leaves unsupported sections empty', () => {
  assert.deepEqual(buildDashboardProfileSummary(), {
    focusAreas: [],
    strongHabits: [],
  })
})
