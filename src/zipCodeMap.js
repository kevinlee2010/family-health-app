const zipGroups = {
  Berkeley: [
    '94702',
    '94703',
    '94704',
    '94705',
    '94706',
    '94707',
    '94708',
    '94709',
    '94710',
  ],
  'Daly City': ['94014', '94015'],
  Fresno: ['93701'],
  Oakland: [
    '94601',
    '94602',
    '94603',
    '94605',
    '94606',
    '94607',
    '94608',
    '94609',
    '94610',
    '94611',
    '94612',
    '94613',
    '94618',
    '94619',
    '94621',
  ],
  'San Francisco': [
    '94102',
    '94103',
    '94104',
    '94105',
    '94107',
    '94108',
    '94109',
    '94110',
    '94111',
    '94112',
    '94114',
    '94115',
    '94116',
    '94117',
    '94118',
    '94121',
    '94122',
    '94123',
    '94124',
    '94127',
    '94129',
    '94130',
    '94131',
    '94132',
    '94133',
    '94134',
    '94158',
  ],
  'South San Francisco': ['94080'],
}

const nearbyCityMap = {
  Berkeley: ['Oakland', 'San Francisco'],
  'Daly City': ['San Francisco', 'South San Francisco'],
  Oakland: ['Berkeley', 'San Francisco'],
  'San Francisco': ['Daly City', 'South San Francisco', 'Oakland', 'Berkeley'],
  'South San Francisco': ['San Francisco', 'Daly City'],
}

const cityCoordinates = {
  Berkeley: { latitude: 37.8715, longitude: -122.273 },
  'Daly City': { latitude: 37.6879, longitude: -122.4702 },
  Fresno: { latitude: 36.7378, longitude: -119.7871 },
  Oakland: { latitude: 37.8044, longitude: -122.2712 },
  'San Francisco': { latitude: 37.7749, longitude: -122.4194 },
  'South San Francisco': { latitude: 37.6547, longitude: -122.4077 },
}

const earthRadiusMiles = 3958.8

const zipCoordinates = {
  '94014': { latitude: 37.6903, longitude: -122.4478 },
  '94015': { latitude: 37.6812, longitude: -122.4816 },
  '94080': { latitude: 37.6547, longitude: -122.4077 },
  '94102': { latitude: 37.7793, longitude: -122.4192 },
  '94103': { latitude: 37.7725, longitude: -122.4147 },
  '94104': { latitude: 37.7915, longitude: -122.4021 },
  '94105': { latitude: 37.7898, longitude: -122.3942 },
  '94107': { latitude: 37.7621, longitude: -122.3971 },
  '94108': { latitude: 37.7929, longitude: -122.4079 },
  '94109': { latitude: 37.793, longitude: -122.4212 },
  '94110': { latitude: 37.7486, longitude: -122.4156 },
  '94111': { latitude: 37.7986, longitude: -122.4009 },
  '94112': { latitude: 37.7204, longitude: -122.443 },
  '94114': { latitude: 37.7587, longitude: -122.435 },
  '94115': { latitude: 37.7855, longitude: -122.4382 },
  '94116': { latitude: 37.7441, longitude: -122.4863 },
  '94117': { latitude: 37.769, longitude: -122.4481 },
  '94118': { latitude: 37.782, longitude: -122.4621 },
  '94121': { latitude: 37.7786, longitude: -122.4892 },
  '94122': { latitude: 37.7584, longitude: -122.4851 },
  '94123': { latitude: 37.8009, longitude: -122.4382 },
  '94124': { latitude: 37.7304, longitude: -122.3844 },
  '94127': { latitude: 37.7349, longitude: -122.4597 },
  '94129': { latitude: 37.7989, longitude: -122.4662 },
  '94130': { latitude: 37.8213, longitude: -122.3697 },
  '94131': { latitude: 37.745, longitude: -122.4383 },
  '94132': { latitude: 37.7211, longitude: -122.4754 },
  '94133': { latitude: 37.8039, longitude: -122.4106 },
  '94134': { latitude: 37.719, longitude: -122.4091 },
  '94158': { latitude: 37.7705, longitude: -122.3869 },
  '94601': { latitude: 37.7757, longitude: -122.2219 },
  '94602': { latitude: 37.8011, longitude: -122.2108 },
  '94603': { latitude: 37.7354, longitude: -122.1746 },
  '94605': { latitude: 37.7585, longitude: -122.1513 },
  '94606': { latitude: 37.7952, longitude: -122.2416 },
  '94607': { latitude: 37.8073, longitude: -122.3004 },
  '94608': { latitude: 37.8349, longitude: -122.2897 },
  '94609': { latitude: 37.8343, longitude: -122.2636 },
  '94610': { latitude: 37.8104, longitude: -122.2417 },
  '94611': { latitude: 37.8289, longitude: -122.1998 },
  '94612': { latitude: 37.8099, longitude: -122.2699 },
  '94613': { latitude: 37.7804, longitude: -122.1826 },
  '94618': { latitude: 37.8447, longitude: -122.2388 },
  '94619': { latitude: 37.7903, longitude: -122.1518 },
  '94621': { latitude: 37.7516, longitude: -122.1865 },
  '94702': { latitude: 37.8658, longitude: -122.2851 },
  '94703': { latitude: 37.8637, longitude: -122.2758 },
  '94704': { latitude: 37.8665, longitude: -122.2564 },
  '94705': { latitude: 37.8613, longitude: -122.2386 },
  '94706': { latitude: 37.8897, longitude: -122.2961 },
  '94707': { latitude: 37.8982, longitude: -122.2789 },
  '94708': { latitude: 37.902, longitude: -122.2617 },
  '94709': { latitude: 37.8798, longitude: -122.2668 },
  '94710': { latitude: 37.8697, longitude: -122.2988 },
  '93701': { latitude: 36.7378, longitude: -119.7871 },
}

export const zipCodeMap = Object.fromEntries(
  Object.entries(zipGroups).flatMap(([city, zipCodes]) =>
    zipCodes.map((zipCode) => [zipCode, city]),
  ),
)

export const zipToCityMap = zipCodeMap

export function getCityForZip(zipCode) {
  const normalizedZip = String(zipCode || '').trim()

  return zipCodeMap[normalizedZip] || ''
}

export function getNearbyCitiesForZip(zipCode) {
  const city = getCityForZip(zipCode)

  return city ? nearbyCityMap[city] || [] : []
}

export function isSupportedZip(zipCode) {
  return Boolean(getCityForZip(zipCode))
}

export function normalizeZip(value) {
  const digits = String(value ?? '').replace(/\D/g, '')

  return digits.padStart(5, '0').slice(-5)
}

export function getCoordinatesForZip(zipCode) {
  const normalizedZip = normalizeZip(zipCode)
  const city = getCityForZip(normalizedZip)

  return zipCoordinates[normalizedZip] || cityCoordinates[city] || null
}

function isValidCoordinate(value) {
  const latitude = Number(value?.latitude)
  const longitude = Number(value?.longitude)

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

function toRadians(value) {
  return (value * Math.PI) / 180
}

function calculateDistanceMiles(firstLocation, secondLocation) {
  if (!isValidCoordinate(firstLocation) || !isValidCoordinate(secondLocation)) {
    return Number.POSITIVE_INFINITY
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

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(Math.min(1, haversine)))
}

export function getClosestSupportedZipForCoordinates(
  coordinates,
  { maxDistanceMiles = 15 } = {},
) {
  if (!isValidCoordinate(coordinates)) {
    return null
  }

  const closestMatch = Object.entries(zipCoordinates)
    .map(([zipCode, zipCoordinatesValue]) => ({
      city: getCityForZip(zipCode),
      distanceMiles: calculateDistanceMiles(coordinates, zipCoordinatesValue),
      zipCode,
    }))
    .filter((match) => match.city)
    .sort((firstMatch, secondMatch) => firstMatch.distanceMiles - secondMatch.distanceMiles)[0]

  if (!closestMatch || closestMatch.distanceMiles > maxDistanceMiles) {
    return null
  }

  return closestMatch
}

export { zipGroups }
