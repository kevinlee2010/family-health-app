import {
  getCityForZip,
  getCoordinatesForZip,
  normalizeZip,
} from './zipCodeMap.js'

export const fdaMammographyFacilitySource = {
  databaseUrl: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfMQSA/mqsa.cfm',
  downloadUrl: 'https://www.accessdata.fda.gov/premarket/ftparea/public.zip',
  name: 'FDA Mammography Facility Database',
  note:
    'The FDA database lists MQSA-certified mammography facilities. Listing does not mean FDA recommends one facility over another.',
}

const earthRadiusMiles = 3958.8

const fdaMammographyFacilities = [
  {
    address: '845 Jackson St',
    city: 'San Francisco',
    fax: '4152174196',
    name: 'Chinese Hospital',
    phone: '4156772328',
    state: 'CA',
    zipCode: '94133',
  },
  {
    address: '1180 Post Street',
    city: 'San Francisco',
    fax: '6502576233',
    name: 'Health Diagnostics of California, A Professional Corporation',
    phone: '4152483700',
    state: 'CA',
    zipCode: '94109',
  },
  {
    address: '2238 Geary Blvd, Radiology Department, 3rd Floor',
    city: 'San Francisco',
    fax: '4158330132',
    name: 'NK The Permanente Medical Group San Francisco',
    phone: '4158333700',
    state: 'CA',
    zipCode: '94115',
  },
  {
    address: '1600 Owens Street',
    city: 'San Francisco',
    fax: '4158330132',
    name: 'NK TPMG San Francisco Mission Bay',
    phone: '4158333700',
    state: 'CA',
    zipCode: '94158',
  },
  {
    address: '1422 Noriega Street',
    city: 'San Francisco',
    fax: '4156445588',
    name: 'North East Medical Services',
    phone: '4153525073',
    state: 'CA',
    zipCode: '94122',
  },
  {
    address: '1520 Stockton St',
    city: 'San Francisco',
    fax: '4156445588',
    name: 'North East Medical Services',
    phone: '8885001886',
    state: 'CA',
    zipCode: '94133',
  },
  {
    address: "1580 Valencia Street, Suite 237 / M28",
    city: 'San Francisco',
    fax: '4156477514',
    name: "SPMF Breast Health Center St. Luke's Campus",
    phone: '4156413365',
    state: 'CA',
    zipCode: '94110',
  },
  {
    address: '2645 Ocean Ave, Suite 103',
    city: 'San Francisco',
    fax: '4156477514',
    name: 'SPMF-2645 Ocean Ave Imaging',
    phone: '4156413365',
    state: 'CA',
    zipCode: '94132',
  },
  {
    address: '2333 Buchanan St 2/F',
    city: 'San Francisco',
    fax: '4153754883',
    name: 'Sutter Bay Hospitals dba CPMC - PHOC',
    phone: '4156002700',
    state: 'CA',
    zipCode: '94115',
  },
  {
    address: '2621 10th St., Berkeley Medical Office Building',
    city: 'Berkeley',
    fax: '5107522783',
    name: 'The Permanente Medical Group - Berkeley',
    phone: '5107522783',
    state: 'CA',
    zipCode: '94710',
  },
  {
    address: '1 Shrader St., Suite 490',
    city: 'San Francisco',
    fax: '4157504078',
    name: "UCSF Health Saint Mary's Women's Health Center",
    phone: '4157504377',
    state: 'CA',
    zipCode: '94117',
  },
  {
    address: '1725 Montgomery Street, Ste 250',
    city: 'San Francisco',
    fax: '4155028024',
    name: 'UCSF Medical Center - Montgomery Street',
    phone: '4153532573',
    state: 'CA',
    zipCode: '94111',
  },
  {
    address: '1825 4th St.-3rd Floor Mammography',
    city: 'San Francisco',
    fax: '4153537299',
    name: 'UCSF Medical Center Mission Bay',
    phone: '4153532573',
    state: 'CA',
    zipCode: '94158',
  },
  {
    address: '2356 Sutter Street, Box 1667',
    city: 'San Francisco',
    fax: '4153537299',
    name: 'UCSF Medical Center Mt Zion',
    phone: '4153532573',
    state: 'CA',
    zipCode: '94115',
  },
  {
    address: '3100 San Pablo',
    city: 'Berkeley',
    fax: '5109855062',
    name: 'UCSF-John Muir Health Imaging Center Berkeley',
    phone: '4153533900',
    state: 'CA',
    zipCode: '94702',
  },
  {
    address: '1001 Potrero Ave, AVON Breast Ctr- Bldg 4',
    city: 'San Francisco',
    fax: '6282065845',
    name: 'Zuckerberg San Francisco General Hospital',
    phone: '6282064965',
    state: 'CA',
    zipCode: '94110',
  },
]

function isValidCoordinate(value) {
  const latitude = Number(value?.latitude)
  const longitude = Number(value?.longitude)

  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

function toRadians(value) {
  return (value * Math.PI) / 180
}

function calculateDistanceMiles(firstLocation, secondLocation) {
  if (!isValidCoordinate(firstLocation) || !isValidCoordinate(secondLocation)) {
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

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(Math.min(1, haversine)))
}

function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (digits.length !== 10) {
    return value || ''
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function getFdaSearchUrl(zipPrefix) {
  const query = zipPrefix
    ? `?zipcode=${encodeURIComponent(zipPrefix)}&sortcolumn=field7asc&records=100`
    : ''

  return `${fdaMammographyFacilitySource.databaseUrl}${query}`
}

export function getFdaZipPrefix(zipCode) {
  const rawDigits = String(zipCode ?? '').replace(/\D/g, '')
  const normalizedZip = rawDigits.length === 5 ? normalizeZip(rawDigits) : ''

  return /^\d{5}$/.test(normalizedZip) ? normalizedZip.slice(0, 3) : ''
}

export function getMammographyFacilityResources(zipCode, { limit = 8 } = {}) {
  const rawDigits = String(zipCode ?? '').replace(/\D/g, '')
  const normalizedZip = rawDigits.length === 5 ? normalizeZip(rawDigits) : ''
  const zipPrefix = getFdaZipPrefix(normalizedZip)

  if (!zipPrefix) {
    return []
  }

  const targetCity = getCityForZip(normalizedZip)
  const originCoordinates = getCoordinatesForZip(normalizedZip)

  return fdaMammographyFacilities
    .filter((facility) => facility.zipCode.startsWith(zipPrefix))
    .map((facility) => {
      const facilityCoordinates = getCoordinatesForZip(facility.zipCode)
      const distanceMiles = calculateDistanceMiles(originCoordinates, facilityCoordinates)
      const address = `${facility.address}, ${facility.city}, ${facility.state} ${facility.zipCode}`
      const phone = formatPhone(facility.phone)

      return {
        address,
        attendanceMode: 'in-person',
        city: facility.city,
        description: [
          phone ? `Phone: ${phone}` : '',
          `Returned for FDA ZIP-prefix search ${zipPrefix}.`,
          fdaMammographyFacilitySource.note,
        ].filter(Boolean).join(' '),
        directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        distanceMiles,
        eventLink: getFdaSearchUrl(zipPrefix),
        eventMatchReason:
          'Provides an FDA MQSA-certified mammography facility result for this breast-screening goal.',
        hasLocation: true,
        id: `fda-mqsa-${facility.zipCode}-${facility.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        isFdaMammographyFacility: true,
        isLocalCity: Boolean(targetCity && facility.city === targetCity),
        location: address,
        locationName: facility.name,
        recommendationLabel: 'FDA MQSA facility',
        resourceIntent: 'mammography-facility',
        resourceSearchStage: 'fda-mqsa',
        resourceSearchStageLabel: 'Mammography facility',
        resourceSearchStageRank: 0,
        resourceType: 'mammography_facility',
        shortDescription: phone
          ? `Phone: ${phone}`
          : fdaMammographyFacilitySource.note,
        source: fdaMammographyFacilitySource.name,
        sourceUrl: fdaMammographyFacilitySource.databaseUrl,
        title: facility.name,
        when: 'FDA MQSA-certified facility',
        zipCode: facility.zipCode,
      }
    })
    .sort((first, second) => {
      if (first.isLocalCity !== second.isLocalCity) return first.isLocalCity ? -1 : 1

      const firstDistance = Number.isFinite(first.distanceMiles)
        ? first.distanceMiles
        : Number.POSITIVE_INFINITY
      const secondDistance = Number.isFinite(second.distanceMiles)
        ? second.distanceMiles
        : Number.POSITIVE_INFINITY

      if (firstDistance !== secondDistance) return firstDistance - secondDistance
      return first.title.localeCompare(second.title)
    })
    .slice(0, limit)
}
