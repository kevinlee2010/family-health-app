import assert from 'node:assert/strict'
import test from 'node:test'

import { getNextOccurrencePerEvent } from '../src/eventDeduplication.js'
import {
  compareEventsByLocationRank,
  defaultRadiusMiles,
  filterAndRankEventsByZip,
  getDistanceInMiles,
  getEventLocation,
  getLocationForZip,
  isValidCoordinatePair,
  isValidFiveDigitZip,
} from '../src/eventLocationRanking.js'
import {
  getCityForZip,
  getCoordinatesForZip,
  normalizeZip,
} from '../src/zipCodeMap.js'

const now = new Date('2026-07-29T12:00:00-07:00')

const testEvents = [
  {
    address: '1650 Owens St, San Francisco, CA 94158',
    city: 'San Francisco',
    startDate: '2026-08-02T10:00:00-07:00',
    title: 'San Francisco Wellness Workshop',
    zipCode: '94158',
  },
  {
    address: '1900 Sixth St, Berkeley, CA 94710',
    city: 'Berkeley',
    startDate: '2026-08-04T10:00:00-07:00',
    title: 'Berkeley Vaccine Clinic',
    zipCode: '94710',
  },
  {
    address: '744 52nd Street Oakland, CA 94609',
    city: 'Oakland',
    startDate: '2026-08-03T10:00:00-07:00',
    title: 'Oakland Asthma Class',
    zipCode: '94609',
  },
  {
    address: '901 Civic Campus Way, South San Francisco, CA 94080',
    city: 'South San Francisco',
    startDate: '2026-08-01T10:00:00-07:00',
    title: 'South San Francisco Community Health Event',
    zipCode: '94080',
  },
  {
    address: '155 N Fresno St., Fresno, CA 93701',
    city: 'Fresno',
    startDate: '2026-08-01T10:00:00-07:00',
    title: 'Fresno Walking Club',
    zipCode: '93701',
  },
  {
    city: 'San Francisco',
    isOnline: true,
    startDate: '2026-08-01T09:00:00-07:00',
    title: 'Online Cancer Education Workshop',
  },
]

function getVisibleEvents(zipCode) {
  return getNextOccurrencePerEvent(
    filterAndRankEventsByZip(testEvents, zipCode),
    now,
  ).sort(compareEventsByLocationRank)
}

test('uses Haversine distance in miles', () => {
  const distance = getDistanceInMiles(
    { latitude: 37.7749, longitude: -122.4194 },
    { latitude: 37.8715, longitude: -122.273 },
  )

  assert.ok(distance > 10)
  assert.ok(distance < 15)
})

test('validates coordinate pairs before distance calculations', () => {
  assert.equal(isValidCoordinatePair({ latitude: 37.8, longitude: -122.3 }), true)
  assert.equal(isValidCoordinatePair({ latitude: 0, longitude: 0 }), false)
  assert.equal(isValidCoordinatePair({ latitude: 120, longitude: -122.3 }), false)
  assert.equal(isValidCoordinatePair({ latitude: 37.8, longitude: -220 }), false)
  assert.equal(isValidCoordinatePair({ latitude: '', longitude: null }), false)
})

test('normalizes ZIP codes before city and coordinate lookup', () => {
  assert.equal(normalizeZip('94132'), '94132')
  assert.equal(normalizeZip(' 94132 '), '94132')
  assert.equal(normalizeZip(94132), '94132')
  assert.equal(normalizeZip('1234'), '01234')
  assert.equal(normalizeZip('abc'), '00000')
  assert.equal(getCityForZip(' 94132 '), 'San Francisco')
  assert.deepEqual(getCoordinatesForZip(' 94702 '), {
    latitude: 37.8658,
    longitude: -122.2851,
  })
})

test('standardized ZIP codes are used for location filtering', () => {
  assert.equal(isValidFiveDigitZip('94132'), true)
  assert.equal(isValidFiveDigitZip('abc'), false)
  assert.equal(getLocationForZip(' 94702 ')?.zipCode, '94702')
  assert.equal(getLocationForZip('1234'), null)
  assert.equal(filterAndRankEventsByZip(testEvents, ' 94132 ')[0].city, 'San Francisco')
})

test('uses geocoded event venue coordinates instead of city-center fallback', () => {
  const berkeleyEvent = {
    address: '1900 Sixth St, Berkeley',
    city: 'Berkeley',
    title: 'Free Back-to-School Vaccine Clinics',
  }
  const sanFranciscoEvent = {
    address: '1650 Owens St, San Francisco, CA, 94158',
    city: 'San Francisco',
    title: 'San Francisco Wellness Workshop',
  }
  const oaklandEvent = {
    address: '744 52nd Street Oakland, CA 94609',
    city: 'Oakland',
    title: 'Oakland Asthma Class',
  }

  assert.equal(getEventLocation(berkeleyEvent).source, 'geocoded-address')
  assert.equal(getEventLocation(sanFranciscoEvent).source, 'geocoded-address')
  assert.equal(getEventLocation(oaklandEvent).source, 'geocoded-address')
})

test('known manual distance checks are plausible', () => {
  const berkeleyVisible = filterAndRankEventsByZip(
    [
      {
        address: '1900 Sixth St, Berkeley',
        city: 'Berkeley',
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Free Back-to-School Vaccine Clinics',
      },
    ],
    '94702',
  )
  const sanFranciscoVisible = filterAndRankEventsByZip(
    [
      {
        address: '1650 Owens St, San Francisco, CA, 94158',
        city: 'San Francisco',
        startDate: '2026-08-02T10:00:00-07:00',
        title: 'San Francisco Wellness Workshop',
      },
    ],
    '94132',
  )
  const oaklandVisible = filterAndRankEventsByZip(
    [
      {
        address: '744 52nd Street Oakland, CA 94609',
        city: 'Oakland',
        startDate: '2026-08-03T10:00:00-07:00',
        title: 'Oakland Asthma Class',
      },
    ],
    '94609',
  )

  assert.ok(berkeleyVisible[0].distanceMiles < 2)
  assert.ok(sanFranciscoVisible[0].distanceMiles > 3)
  assert.ok(oaklandVisible[0].distanceMiles < 1)
})

test('online events have no calculated distance', () => {
  const visibleEvents = filterAndRankEventsByZip(
    [
      {
        city: 'San Francisco',
        isOnline: true,
        startDate: '2026-08-01T09:00:00-07:00',
        title: 'Online Cancer Education Workshop',
      },
    ],
    '94702',
  )

  assert.equal(visibleEvents[0].distanceMiles, null)
  assert.equal(visibleEvents[0].isOnlineEvent, true)
})

test('94132 shows only San Francisco and online events', () => {
  const visibleEvents = getVisibleEvents('94132')

  assert.equal(visibleEvents[0].city, 'San Francisco')
  assert.equal(visibleEvents.some((event) => event.city === 'Berkeley'), false)
  assert.equal(visibleEvents.some((event) => event.city === 'Oakland'), false)
  assert.equal(visibleEvents.some((event) => event.city === 'Fresno'), false)
  assert.equal(visibleEvents.some((event) => event.isOnline), true)
})

test('94702 shows only Berkeley and online events', () => {
  const visibleEvents = getVisibleEvents('94702')

  assert.equal(visibleEvents[0].city, 'Berkeley')
  assert.equal(visibleEvents.some((event) => event.city === 'Oakland'), false)
  assert.equal(
    visibleEvents.some((event) => event.city === 'San Francisco' && !event.isOnline),
    false,
  )
  assert.equal(visibleEvents.some((event) => event.city === 'Fresno'), false)
  assert.equal(visibleEvents.some((event) => event.isOnline), true)
})

test('94609 shows only Oakland and online events', () => {
  const visibleEvents = getVisibleEvents('94609')

  assert.equal(visibleEvents[0].city, 'Oakland')
  assert.equal(visibleEvents.some((event) => event.city === 'Berkeley'), false)
  assert.equal(
    visibleEvents.some((event) => event.city === 'San Francisco' && !event.isOnline),
    false,
  )
  assert.equal(visibleEvents.some((event) => event.isOnline), true)
})

test('94080 shows only South San Francisco and online events', () => {
  const visibleEvents = getVisibleEvents('94080')

  assert.equal(visibleEvents[0].city, 'South San Francisco')
  assert.equal(
    visibleEvents.some((event) => event.city === 'San Francisco' && !event.isOnline),
    false,
  )
  assert.equal(visibleEvents.some((event) => event.isOnline), true)
})

test('93701 allows Fresno events', () => {
  const visibleEvents = getVisibleEvents('93701')

  assert.equal(visibleEvents[0].city, 'Fresno')
  assert.equal(visibleEvents.some((event) => event.title === 'Fresno Walking Club'), true)
})

test('filters in-person events outside the default radius', () => {
  const visibleEvents = filterAndRankEventsByZip(testEvents, '94132')

  assert.equal(defaultRadiusMiles, 35)
  assert.equal(visibleEvents.some((event) => event.city === 'Fresno'), false)
})

test('sorts selected-city in-person events before online events', () => {
  const visibleEvents = getVisibleEvents('94132')

  assert.equal(visibleEvents[0].title, 'San Francisco Wellness Workshop')
  assert.equal(visibleEvents.at(-1).title, 'Online Cancer Education Workshop')
})
