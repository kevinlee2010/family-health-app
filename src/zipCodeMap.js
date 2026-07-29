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
  Fresno: [],
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

const zipCoordinates = {
  '93701': { latitude: 36.7486, longitude: -119.7871 },
  '94014': { latitude: 37.6904, longitude: -122.4475 },
  '94015': { latitude: 37.6812, longitude: -122.4801 },
  '94080': { latitude: 37.6538, longitude: -122.4291 },
  '94102': { latitude: 37.7793, longitude: -122.4192 },
  '94103': { latitude: 37.7725, longitude: -122.4147 },
  '94104': { latitude: 37.7915, longitude: -122.4023 },
  '94105': { latitude: 37.7897, longitude: -122.3937 },
  '94107': { latitude: 37.7621, longitude: -122.3971 },
  '94108': { latitude: 37.7916, longitude: -122.4081 },
  '94109': { latitude: 37.7928, longitude: -122.4227 },
  '94110': { latitude: 37.7487, longitude: -122.4152 },
  '94111': { latitude: 37.7974, longitude: -122.4001 },
  '94112': { latitude: 37.7216, longitude: -122.4412 },
  '94114': { latitude: 37.7587, longitude: -122.4351 },
  '94115': { latitude: 37.7857, longitude: -122.4358 },
  '94116': { latitude: 37.7441, longitude: -122.4863 },
  '94117': { latitude: 37.7692, longitude: -122.4425 },
  '94118': { latitude: 37.7812, longitude: -122.4614 },
  '94121': { latitude: 37.7786, longitude: -122.4926 },
  '94122': { latitude: 37.7596, longitude: -122.4847 },
  '94123': { latitude: 37.8009, longitude: -122.4382 },
  '94124': { latitude: 37.7304, longitude: -122.3824 },
  '94127': { latitude: 37.7347, longitude: -122.4633 },
  '94129': { latitude: 37.7989, longitude: -122.4662 },
  '94130': { latitude: 37.8238, longitude: -122.3707 },
  '94131': { latitude: 37.745, longitude: -122.4383 },
  '94132': { latitude: 37.7211, longitude: -122.4754 },
  '94133': { latitude: 37.8038, longitude: -122.4105 },
  '94134': { latitude: 37.719, longitude: -122.4095 },
  '94158': { latitude: 37.7709, longitude: -122.3886 },
  '94601': { latitude: 37.7754, longitude: -122.2181 },
  '94602': { latitude: 37.8015, longitude: -122.2097 },
  '94603': { latitude: 37.7378, longitude: -122.1747 },
  '94605': { latitude: 37.7585, longitude: -122.1526 },
  '94606': { latitude: 37.7938, longitude: -122.245 },
  '94607': { latitude: 37.8074, longitude: -122.2947 },
  '94608': { latitude: 37.8371, longitude: -122.2852 },
  '94609': { latitude: 37.8342, longitude: -122.2646 },
  '94610': { latitude: 37.8103, longitude: -122.2392 },
  '94611': { latitude: 37.8308, longitude: -122.2135 },
  '94612': { latitude: 37.8106, longitude: -122.2697 },
  '94613': { latitude: 37.7811, longitude: -122.1842 },
  '94618': { latitude: 37.8444, longitude: -122.2385 },
  '94619': { latitude: 37.7909, longitude: -122.1662 },
  '94621': { latitude: 37.7411, longitude: -122.2015 },
  '94702': { latitude: 37.8658, longitude: -122.2851 },
  '94703': { latitude: 37.8636, longitude: -122.2746 },
  '94704': { latitude: 37.8663, longitude: -122.2579 },
  '94705': { latitude: 37.8595, longitude: -122.2444 },
  '94706': { latitude: 37.8896, longitude: -122.2955 },
  '94707': { latitude: 37.898, longitude: -122.2787 },
  '94708': { latitude: 37.9003, longitude: -122.2618 },
  '94709': { latitude: 37.8795, longitude: -122.2668 },
  '94710': { latitude: 37.8697, longitude: -122.302 },
}

export const zipToCityMap = Object.fromEntries(
  Object.entries(zipGroups).flatMap(([city, zipCodes]) =>
    zipCodes.map((zipCode) => [zipCode, city]),
  ),
)

export function normalizeZip(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.padStart(5, '0').slice(-5)
}

function hasZipDigits(value) {
  return String(value ?? '').replace(/\D/g, '').length > 0
}

export function getCityForZip(zipCode) {
  if (!hasZipDigits(zipCode)) {
    return ''
  }

  const normalizedZip = normalizeZip(zipCode)

  return zipToCityMap[normalizedZip] || ''
}

export function getCoordinatesForZip(zipCode) {
  if (!hasZipDigits(zipCode)) {
    return null
  }

  const normalizedZip = normalizeZip(zipCode)

  return zipCoordinates[normalizedZip] || null
}

export function getCoordinatesForCity(city) {
  return cityCoordinates[city] || null
}

export function getNearbyCitiesForZip(zipCode) {
  const city = getCityForZip(zipCode)

  return city ? nearbyCityMap[city] || [] : []
}

export function isSupportedZip(zipCode) {
  return Boolean(getCityForZip(zipCode))
}

export { cityCoordinates, zipGroups }
