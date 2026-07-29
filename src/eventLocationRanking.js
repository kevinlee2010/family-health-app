import {
  getCityForZip,
  getCoordinatesForZip,
  normalizeZip,
} from './zipCodeMap.js'

const defaultRadiusMiles = 35
const earthRadiusMiles = 3958.8
const diagnosticLoggingEnabled =
  globalThis?.localStorage?.getItem?.('eventDistanceDebug') === '1' ||
  globalThis?.process?.env?.EVENT_DISTANCE_DEBUG === '1'
const knownVenueCoordinates = [
  {
    match: /1900\s+sixth\s+st.*berkeley/i,
    coordinates: { latitude: 37.8697, longitude: -122.2988 },
    label: '1900 Sixth St, Berkeley',
  },
  {
    match: /1650\s+owens\s+st.*san\s+francisco/i,
    coordinates: { latitude: 37.7677, longitude: -122.3936 },
    label: '1650 Owens St, San Francisco',
  },
  {
    match: /744\s+52nd\s+street.*oakland/i,
    coordinates: { latitude: 37.8375, longitude: -122.2674 },
    label: '744 52nd Street, Oakland',
  },
  {
    match: /901\s+civic\s+campus\s+way.*south\s+san\s+francisco/i,
    coordinates: { latitude: 37.6548, longitude: -122.4141 },
    label: '901 Civic Campus Way, South San Francisco',
  },
  {
    match: /155\s+n\s+fresno\s+st.*fresno/i,
    coordinates: { latitude: 36.7443, longitude: -119.7819 },
    label: '155 N Fresno St, Fresno',
  },
  {
    match: /600\s+16th\s+street.*san\s+francisco/i,
    coordinates: { latitude: 37.767, longitude: -122.3908 },
    label: '600 16th Street, San Francisco',
  },
]

export function isValidFiveDigitZip(zipCode) {
  const digits = String(zipCode ?? '').replace(/\D/g, '')

  return digits.length > 0 && /^\d{5}$/.test(normalizeZip(zipCode))
}

export function getZipFromAddress(address) {
  return String(address || '').match(/\b\d{5}(?:-\d{4})?\b/)?.[0]?.slice(0, 5) || ''
}

export function getLocationForZip(zipCode) {
  const normalizedZip = normalizeZip(zipCode)

  if (!isValidFiveDigitZip(zipCode)) {
    return null
  }

  const city = getCityForZip(normalizedZip)
  const coordinates = getCoordinatesForZip(normalizedZip)

  if (!city || !isValidCoordinatePair(coordinates)) {
    return null
  }

  return {
    city,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    zipCode: normalizedZip,
  }
}

export function getDistanceInMiles(firstLocation, secondLocation) {
  if (!isValidCoordinatePair(firstLocation) || !isValidCoordinatePair(secondLocation)) {
    return null
  }

  const latitudeDelta = toRadians(secondLocation.latitude - firstLocation.latitude)
  const longitudeDelta = toRadians(secondLocation.longitude - firstLocation.longitude)
  const firstLatitude = toRadians(firstLocation.latitude)
  const secondLatitude = toRadians(secondLocation.latitude)

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2

  return (
    2 *
    earthRadiusMiles *
    Math.asin(Math.sqrt(Math.min(1, haversine)))
  )
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

export function getEventDateTimestamp(event) {
  const date = new Date(
    event?.startsAt || event?.startDate || event?.date || event?.eventDateText || '',
  )

  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime()
}

export function getEventLocation(event) {
  const explicitLatitude = Number(event?.latitude ?? event?.coordinates?.latitude)
  const explicitLongitude = Number(event?.longitude ?? event?.coordinates?.longitude)

  if (
    isValidCoordinatePair({
      latitude: explicitLatitude,
      longitude: explicitLongitude,
    })
  ) {
    return {
      city: event?.city || '',
      latitude: explicitLatitude,
      longitude: explicitLongitude,
      source: 'coordinates',
      zipCode: event?.zipCode || '',
    }
  }

  const geocodedLocation = geocodeEventAddress(event?.address)
  if (geocodedLocation) {
    const addressZipCode = getZipFromAddress(event?.address)

    return {
      city: getCityForZip(addressZipCode) || event?.city || '',
      latitude: geocodedLocation.latitude,
      longitude: geocodedLocation.longitude,
      source: 'geocoded-address',
      sourceLabel: geocodedLocation.label,
      zipCode: addressZipCode,
    }
  }

  return null
}

export function isValidCoordinatePair(location) {
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  )
}

export function geocodeEventAddress(address) {
  const normalizedAddress = String(address || '').trim()

  if (!normalizedAddress) {
    return null
  }

  const match = knownVenueCoordinates.find((venue) =>
    venue.match.test(normalizedAddress),
  )

  if (!match || !isValidCoordinatePair(match.coordinates)) {
    return null
  }

  return {
    ...match.coordinates,
    label: match.label,
  }
}

function getEventCity(event) {
  const addressZipCode = getZipFromAddress(event?.address)

  return getCityForZip(addressZipCode) || event?.city || ''
}

function logDistanceDiagnostic({
  event,
  eventLocation,
  origin,
  reason,
  distanceMiles,
}) {
  if (!diagnosticLoggingEnabled) {
    return
  }

  console.debug('Event distance diagnostic', {
    userZip: origin?.zipCode,
    userCoordinates: origin
      ? { latitude: origin.latitude, longitude: origin.longitude }
      : null,
    eventTitle: event?.title,
    eventAddress: event?.address || '',
    eventCoordinates: eventLocation
      ? {
          latitude: eventLocation.latitude,
          longitude: eventLocation.longitude,
        }
      : null,
    distanceMiles,
    coordinateSource: eventLocation?.source || 'unavailable',
    reason,
  })
}

export function filterAndRankEventsByZip(
  events,
  zipCode,
  { radiusMiles = defaultRadiusMiles } = {},
) {
  const origin = getLocationForZip(zipCode)

  if (!origin) {
    return []
  }

  return events
    .map((event) => {
      if (event?.isOnline || event?.attendanceMode === 'online') {
        logDistanceDiagnostic({
          event,
          eventLocation: null,
          origin,
          reason: 'online-event',
          distanceMiles: null,
        })

        return {
          ...event,
          distanceMiles: null,
          eventCity: event.city || '',
          isLocalCity: false,
          isOnlineEvent: true,
        }
      }

      const eventLocation = getEventLocation(event)

      if (!eventLocation) {
        logDistanceDiagnostic({
          event,
          eventLocation: null,
          origin,
          reason: 'missing-or-unreliable-event-coordinates',
          distanceMiles: null,
        })

        if (getEventCity(event) === origin.city) {
          return {
            ...event,
            distanceMiles: null,
            distanceUnavailable: true,
            eventCity: origin.city,
            isLocalCity: true,
            isOnlineEvent: false,
          }
        }

        return null
      }

      const distanceMiles = getDistanceInMiles(origin, eventLocation)

      if (distanceMiles === null || distanceMiles > radiusMiles) {
        logDistanceDiagnostic({
          event,
          eventLocation,
          origin,
          reason: distanceMiles === null ? 'invalid-distance' : 'outside-radius',
          distanceMiles,
        })

        return null
      }

      if (eventLocation.city !== origin.city) {
        logDistanceDiagnostic({
          event,
          eventLocation,
          origin,
          reason: 'wrong-city',
          distanceMiles,
        })

        return null
      }

      logDistanceDiagnostic({
        event,
        eventLocation,
        origin,
        reason: 'accepted',
        distanceMiles,
      })

      return {
        ...event,
        city: eventLocation.city || event.city,
        distanceMiles,
        eventCity: eventLocation.city || event.city,
        isLocalCity: eventLocation.city === origin.city,
        isOnlineEvent: false,
      }
    })
    .filter(Boolean)
    .sort(compareEventsByLocationRank)
}

export function compareEventsByLocationRank(firstEvent, secondEvent) {
  if (Boolean(firstEvent.isOnlineEvent) !== Boolean(secondEvent.isOnlineEvent)) {
    return firstEvent.isOnlineEvent ? 1 : -1
  }

  if (firstEvent.isLocalCity !== secondEvent.isLocalCity) {
    return firstEvent.isLocalCity ? -1 : 1
  }

  const firstDistance = firstEvent.distanceMiles ?? Number.MAX_SAFE_INTEGER
  const secondDistance = secondEvent.distanceMiles ?? Number.MAX_SAFE_INTEGER

  if (firstDistance !== secondDistance) {
    return firstDistance - secondDistance
  }

  return getEventDateTimestamp(firstEvent) - getEventDateTimestamp(secondEvent)
}

export { defaultRadiusMiles }
