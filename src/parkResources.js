import {
  getDistanceInMiles,
  getLocationForZip,
  isValidCoordinatePair,
} from './eventLocationRanking.js'

const parkResources = [
  {
    address: '501 Stanyan St, San Francisco, CA 94117',
    amenities: ['Walking paths', 'Open fields', 'Tennis courts', 'Playgrounds'],
    city: 'San Francisco',
    description: 'Large city park with paved paths, open space, courts, and recreation areas.',
    id: 'golden-gate-park',
    latitude: 37.7694,
    longitude: -122.4862,
    name: 'Golden Gate Park',
  },
  {
    address: 'Lake Merced Blvd, San Francisco, CA 94132',
    amenities: ['Walking paths', 'Running paths', 'Open space'],
    city: 'San Francisco',
    description: 'Lakeside loop paths that work well for steady walks and light cardio.',
    id: 'lake-merced',
    latitude: 37.7281,
    longitude: -122.4934,
    name: 'Lake Merced Park',
  },
  {
    address: 'Dolores St &, 19th St, San Francisco, CA 94114',
    amenities: ['Open fields', 'Walking paths', 'Basketball courts', 'Playgrounds'],
    city: 'San Francisco',
    description: 'Neighborhood park with open lawns and paths for easy movement breaks.',
    id: 'mission-dolores-park',
    latitude: 37.7596,
    longitude: -122.4269,
    name: 'Mission Dolores Park',
  },
  {
    address: '7400 San Pedro Rd, Berkeley, CA 94707',
    amenities: ['Walking paths', 'Open fields', 'Playgrounds'],
    city: 'Berkeley',
    description: 'Large park with open lawns and room for walking, stretching, or low-intensity activity.',
    id: 'codornices-park',
    latitude: 37.8851,
    longitude: -122.2653,
    name: 'Codornices Park',
  },
  {
    address: '201 University Ave, Berkeley, CA 94710',
    amenities: ['Walking paths', 'Waterfront trails', 'Open space'],
    city: 'Berkeley',
    description: 'Waterfront park with scenic paths for walking and stress relief.',
    id: 'cesar-chavez-park',
    latitude: 37.8721,
    longitude: -122.3186,
    name: 'Cesar Chavez Park',
  },
  {
    address: '2501 Grizzly Peak Blvd, Berkeley, CA 94708',
    amenities: ['Walking paths', 'Hiking trails', 'Open space'],
    city: 'Berkeley',
    description: 'Hilltop recreation area with trails and views for outdoor movement.',
    id: 'tilden-regional-park',
    latitude: 37.8916,
    longitude: -122.2423,
    name: 'Tilden Regional Park',
  },
  {
    address: '666 Bellevue Ave, Oakland, CA 94610',
    amenities: ['Walking paths', 'Running paths', 'Open space'],
    city: 'Oakland',
    description: 'Lakeside park with paths that support walking, running, and outdoor breaks.',
    id: 'lake-merritt',
    latitude: 37.8044,
    longitude: -122.2553,
    name: 'Lake Merritt',
  },
  {
    address: '7867 Redwood Rd, Oakland, CA 94619',
    amenities: ['Walking paths', 'Hiking trails', 'Open space'],
    city: 'Oakland',
    description: 'Trail-focused park suited for longer walks and outdoor exercise.',
    id: 'redwood-regional-park',
    latitude: 37.8134,
    longitude: -122.1661,
    name: 'Redwood Regional Park',
  },
  {
    address: '3612 Webster St, Oakland, CA 94609',
    amenities: ['Open fields', 'Basketball courts', 'Playgrounds'],
    city: 'Oakland',
    description: 'Neighborhood park with court space, fields, and room for active breaks.',
    id: 'mosswood-park',
    latitude: 37.8249,
    longitude: -122.2606,
    name: 'Mosswood Park',
  },
  {
    address: 'Gellert Blvd, Daly City, CA 94015',
    amenities: ['Walking paths', 'Open fields', 'Recreation center', 'Playgrounds'],
    city: 'Daly City',
    description: 'Community park with walking areas, recreation facilities, and open space.',
    id: 'gellert-park',
    latitude: 37.6662,
    longitude: -122.4689,
    name: 'Gellert Park',
  },
  {
    address: '1 Orange Ave, South San Francisco, CA 94080',
    amenities: ['Walking paths', 'Tennis courts', 'Basketball courts', 'Open fields'],
    city: 'South San Francisco',
    description: 'Community park with courts, fields, and paths for everyday movement.',
    id: 'orange-memorial-park',
    latitude: 37.6548,
    longitude: -122.4302,
    name: 'Orange Memorial Park',
  },
  {
    address: '1121 S Chance Ave, Fresno, CA 93702',
    amenities: ['Walking paths', 'Open fields', 'Playgrounds'],
    city: 'Fresno',
    description: 'Large park with open outdoor space for walking and light activity.',
    id: 'roeding-park',
    latitude: 36.7477,
    longitude: -119.8281,
    name: 'Roeding Park',
  },
]

function normalizeCity(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function getActivitySuggestion(park) {
  if (park.amenities.some((amenity) => /tennis|basketball/i.test(amenity))) {
    return 'Includes courts for active movement.'
  }

  if (park.amenities.some((amenity) => /recreation center/i.test(amenity))) {
    return 'Recreation center available for indoor or structured activity.'
  }

  if (park.amenities.some((amenity) => /hiking|running|walking/i.test(amenity))) {
    return 'Good for a 30-minute walk or light cardiovascular exercise.'
  }

  return 'Useful for outdoor movement and stress relief.'
}

export function getParksProvider() {
  return {
    source: 'local-json-provider',
    getParks() {
      return parkResources
    },
  }
}

export function getParksNearZip(zipCode, parks = getParksProvider().getParks()) {
  const origin = getLocationForZip(zipCode)

  if (!origin) {
    return []
  }

  return parks
    .filter((park) => normalizeCity(park.city) === normalizeCity(origin.city))
    .map((park) => {
      const distanceMiles = isValidCoordinatePair(park)
        ? getDistanceInMiles(origin, park)
        : null

      return {
        ...park,
        activitySuggestion: getActivitySuggestion(park),
        distanceMiles,
      }
    })
    .sort((firstPark, secondPark) => {
      const firstDistance = firstPark.distanceMiles ?? Number.MAX_SAFE_INTEGER
      const secondDistance = secondPark.distanceMiles ?? Number.MAX_SAFE_INTEGER

      if (firstDistance !== secondDistance) {
        return firstDistance - secondDistance
      }

      return firstPark.name.localeCompare(secondPark.name)
    })
}

export function getParkMapUrl(park) {
  if (!park?.address) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    park.address,
  )}`
}

export { parkResources }
