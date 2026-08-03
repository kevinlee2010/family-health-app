import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getNextOccurrencePerEvent,
  normalizeEventTitle,
} from '../src/eventDeduplication.js'

const recurringEvents = [
  {
    date: '2026-08-04T10:00:00-07:00',
    title: 'Free Back-to-School Vaccine Clinics',
  },
  {
    date: '2026-08-05T10:00:00-07:00',
    title: 'Free Back-to-School Vaccine Clinics',
  },
  {
    date: '2026-08-06T10:00:00-07:00',
    title: 'Free Back-to-School Vaccine Clinics',
  },
  {
    date: '2026-08-01T10:00:00-07:00',
    title: 'Free Fatherhood Initiative Support Group',
  },
  {
    date: '2026-08-08T10:00:00-07:00',
    title: 'Free Fatherhood Initiative Support Group',
  },
]

test('keeps only the nearest upcoming occurrence for each recurring event', () => {
  const visibleEvents = getNextOccurrencePerEvent(
    recurringEvents,
    new Date('2026-07-31T12:00:00-07:00'),
  )

  assert.deepEqual(
    visibleEvents.map((event) => `${event.title} — ${event.date.slice(0, 10)}`),
    [
      'Free Fatherhood Initiative Support Group — 2026-08-01',
      'Free Back-to-School Vaccine Clinics — 2026-08-04',
    ],
  )
})

test('shows the next vaccine clinic after the earlier occurrence passes', () => {
  const visibleEvents = getNextOccurrencePerEvent(
    recurringEvents,
    new Date('2026-08-05T08:00:00-07:00'),
  )

  assert.deepEqual(
    visibleEvents.map((event) => `${event.title} — ${event.date.slice(0, 10)}`),
    [
      'Free Back-to-School Vaccine Clinics — 2026-08-05',
      'Free Fatherhood Initiative Support Group — 2026-08-08',
    ],
  )
})

test('shows the next fatherhood group after the earlier occurrence passes', () => {
  const visibleEvents = getNextOccurrencePerEvent(
    recurringEvents,
    new Date('2026-08-02T08:00:00-07:00'),
  )

  assert.deepEqual(
    visibleEvents.map((event) => `${event.title} — ${event.date.slice(0, 10)}`),
    [
      'Free Back-to-School Vaccine Clinics — 2026-08-04',
      'Free Fatherhood Initiative Support Group — 2026-08-08',
    ],
  )
})

test('normalizes titles without combining genuinely different events', () => {
  assert.equal(
    normalizeEventTitle('Free Back-to-School Vaccine Clinics — August 4'),
    normalizeEventTitle('Free Back to School Vaccine Clinics August 5'),
  )
  assert.notEqual(
    normalizeEventTitle('Free Back-to-School Vaccine Clinics'),
    normalizeEventTitle('Free Cooking Class Series'),
  )
})

test('normalizes encoded punctuation in recurring event titles', () => {
  assert.equal(
    normalizeEventTitle('14th Annual Richmond District YMCA Jog in the Fog - 5K Family Fun Run'),
    normalizeEventTitle('14th Annual Richmond District YMCA Jog in the Fog &#8211; 5K Family Fun Run'),
  )
})
