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

export { zipGroups }
