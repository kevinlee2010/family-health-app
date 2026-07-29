import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { trustedHealthEventSources } from './health-event-sources.js'

const serpApiEndpoint = 'https://serpapi.com/search.json'
const outputFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public/data/events.json',
)
const sampleOutputFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public/data/events.sample.json',
)
const requestDelayMs = 750
const maxSavedEvents = 24
const supportedCityNames = [
  'South San Francisco',
  'San Francisco',
  'Daly City',
  'Oakland',
  'Berkeley',
]
const wrongLocationPattern =
  /\b(atlanta|orlando|san jose|sonora|united states|nationwide|usa)\b/i
const genericTitlePattern =
  /^(events?|public health|health and wellness|classes and resources|directory of programs|health education home page|discover events?|best health events?|find events?|health education|directory of health classes & programs|nutrition events|let(?:'|&#039;|&amp;#039;)?s talk schedule)$/i
const genericListingPattern =
  /\b(directory|home page|events and activities|discover events|best events|health events in|classes and programs|resources|calendar|category|search|tag|public health|health and wellness|find events|things to do|best health screening)\b/i
const sourcePagePattern =
  /\b(events?|calendar|schedule|classes|clinic schedule|vaccination clinic|support group|screening schedule|appointments available)\b/i
const exclusionPattern =
  /\b(concert|music festival|festival lineup|tickets?|ticketmaster|spotify|band|singer|artist|tour|album|song|dj|nightclub|comedy show|theater|outside lands|jade|sports game|fundraiser gala|mock interviews?|career exploration|residency first look|\bgme core\b|staff assembly|town hall)\b/i
const entertainmentDomains = [
  'spotify.com',
  'ticketmaster.com',
  'stubhub.com',
  'seatgeek.com',
  'bandsintown.com',
]
const recurringPattern =
  /\b(today|tomorrow|this week|every monday|every tuesday|every wednesday|every thursday|every friday|every saturday|every sunday|weekly|ongoing|recurring|appointments available|drop-?in|walk-?in)\b/i
const onlineEventPattern =
  /\b(zoom|virtual|online|webinar|video conference|join online|remote)\b/i
const healthTopicRules = [
  ['blood-pressure', /\b(blood pressure|hypertension|bp check|bp screening)\b/i],
  ['heart-health', /\b(heart|heart health|cardiology|stroke prevention|cardiovascular|blood pressure|hypertension|cholesterol)\b/i],
  ['cholesterol', /\b(cholesterol|lipid)\b/i],
  ['diabetes', /\b(diabetes|prediabetes|glucose|a1c|blood sugar)\b/i],
  ['cancer-prevention', /\b(cancer|oncology|tumou?r|cancer screening|cancer prevention|mammogram|colorectal screening|colonoscopy)\b/i],
  ['vaccination', /\b(vaccination|vaccine|immunization|flu shot|covid vaccine)\b/i],
  ['mental-health', /\b(mental health|behavioral health|psychology|psychiatry|stress management|support group|meditation|mindfulness|sleep)\b/i],
  ['neurology', /\b(neurology|neuroscience|dementia|cognitive|alzheimer|parkinson|brain health)\b/i],
  ['nutrition', /\b(nutrition|healthy cooking|healthy eating|dietitian|dietician)\b/i],
  ['physical-activity', /\b(rehabilitation|physical therapy|occupational therapy|speech therapy|walking|walking group|exercise|exercise class|fitness|fitness class|yoga)\b/i],
  ['respiratory-health', /\b(pulmonary|respiratory)\b/i],
  ['smoking-cessation', /\b(smoking cessation|quit smoking|tobacco cessation|vaping cessation)\b/i],
  ['general-prevention', /\b(wellness|hospital|medical|medicine|physician|doctor|nursing|public health|preventive|prevention|screening|health screening|health fair|preventive care|health education|health assessment|health training|health alliance|for health|clinic|wellness workshop|community health|caregiver|patient|dermatology|genetics|genomics|women'?s health|men'?s health|maternal health|pediatric|senior health)\b/i],
]
const healthTermPattern =
  /\b(cancer|oncology|tumou?r|neurology|neuroscience|dementia|cognitive|alzheimer|parkinson|brain health|mental health|behavioral health|psychology|psychiatry|wellness|mindfulness|meditation|support group|caregiver|patient|rehabilitation|physical therapy|occupational therapy|speech therapy|nutrition|dietitian|dietician|exercise|fitness|walking|yoga|sleep|hospital|medical|medicine|physician|doctor|nursing|public health|preventive|prevention|screening|vaccination|vaccine|immunization|diabetes|blood pressure|hypertension|cholesterol|stroke|heart|cardiology|pulmonary|respiratory|dermatology|genetics|genomics|women'?s health|men'?s health|maternal health|pediatric|senior health|community health|health education|health assessment|health training|health alliance|for health|prediabetes|glucose|a1c|blood sugar|bp check|bp screening|flu shot|covid vaccine|health fair|preventive care|mammogram|colorectal screening|colonoscopy|stress management|healthy cooking|healthy eating|smoking cessation|quit smoking|tobacco cessation|vaping cessation|stroke prevention|walking group|exercise class|fitness class|clinic|wellness workshop)\b/i
const monthNames =
  'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'
const monthDatePattern = new RegExp(
  `\\b(?:${monthNames})\\.?\\s+\\d{1,2}(?:,?\\s*\\d{4})?\\b`,
  'i',
)
const numericDatePattern = /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/
const isoDatePattern = /\b\d{4}-\d{2}-\d{2}\b/
const zipCityRules = [
  [/^94080$/, 'South San Francisco'],
  [/^941\d{2}$/, 'San Francisco'],
  [/^946\d{2}$/, 'Oakland'],
  [/^947\d{2}$/, 'Berkeley'],
  [/^9401[45]$/, 'Daly City'],
]

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function normalizeText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .replace(/\s+/g, ' ')
}

function cleanScrapedDescription(value) {
  return normalizeText(value)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\S+@\S+\.\S+/gi, '')
    .replace(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/g, '')
    .replace(/\b(register here|sponsored by|for more information|classes are tailored|a signed waiver)[\s\S]*$/i, '')
    .replace(/\bheld\s+(mondays?|tuesdays?|wednesdays?|thursdays?|fridays?|saturdays?|sundays?)[^.]*\./gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getEventAudience({ attendanceMode, healthTopics, title }) {
  const text = normalizeKey(`${title} ${healthTopics.join(' ')}`)

  if (text.includes('neuro-oncology') || text.includes('cancer')) {
    return 'patients, caregivers, and families navigating cancer care'
  }

  if (text.includes('fatherhood') || text.includes('parent')) {
    return 'parents and caregivers looking for practical support'
  }

  if (text.includes('vaccine') || text.includes('vaccination')) {
    return 'families who want help staying current on recommended immunizations'
  }

  if (text.includes('nutrition') || text.includes('cooking')) {
    return 'people who want realistic ways to build healthier eating habits'
  }

  if (text.includes('mental') || text.includes('meditation')) {
    return 'people looking for stress relief and emotional support'
  }

  if (attendanceMode === 'online') {
    return 'people who prefer to participate from home'
  }

  return 'community members interested in preventive health'
}

function getPrimaryEventBenefit({ healthTopics, title }) {
  const text = normalizeKey(`${title} ${healthTopics.join(' ')}`)

  if (text.includes('meditation')) {
    return 'The main benefit is a calmer routine that can support relaxation, focus, and emotional well-being.'
  }

  if (text.includes('workout') || text.includes('exercise') || text.includes('physical-activity')) {
    return 'The main benefit is guided movement that can support strength, balance, flexibility, and overall well-being.'
  }

  if (text.includes('vaccine') || text.includes('vaccination')) {
    return 'The main benefit is easier access to preventive protection against vaccine-preventable illness.'
  }

  if (text.includes('cooking') || text.includes('nutrition')) {
    return 'The main benefit is learning practical food skills that can support everyday nutrition and long-term prevention.'
  }

  if (text.includes('support group') || text.includes('fatherhood')) {
    return 'The main benefit is connection, shared problem-solving, and encouragement in a supportive setting.'
  }

  return 'The main benefit is a practical next step for prevention, awareness, or healthier daily habits.'
}

function getEventSummaryOpening({ title, attendanceMode, healthTopics }) {
  const text = normalizeKey(`${title} ${healthTopics.join(' ')}`)

  if (text.includes('meditation')) {
    return 'Practice guided meditation in a calm, supportive session focused on stress reduction and relaxation.'
  }

  if (text.includes('neuro-oncology') || text.includes('workout')) {
    return 'Stay active with a guided exercise class designed around strength, balance, flexibility, and gentle conditioning.'
  }

  if (text.includes('vaccine') || text.includes('vaccination')) {
    return 'Get help completing recommended vaccines through a community clinic focused on preventive care.'
  }

  if (text.includes('cooking') || text.includes('nutrition')) {
    return 'Build practical cooking and meal-planning skills through a hands-on nutrition class.'
  }

  if (text.includes('fatherhood') || text.includes('support group')) {
    return 'Connect with others in a structured support group focused on parenting, family wellness, and shared encouragement.'
  }

  if (attendanceMode === 'online') {
    return 'Join a virtual preventive-health session that can be accessed from home.'
  }

  return 'Attend a community health event focused on prevention, education, and practical wellness support.'
}

function createEventSummary(event, healthTopics, attendanceMode) {
  const title = normalizeText(event.title)
  const cleanedDescription = cleanScrapedDescription(event.description)
  const context = { attendanceMode, healthTopics, title }
  const opening = getEventSummaryOpening(context)
  const audience = getEventAudience(context)
  const benefit = getPrimaryEventBenefit(context)
  const sourceHint = cleanedDescription && healthTopics.length === 0
    ? 'It may be useful for learning about local health resources in a low-pressure setting.'
    : benefit

  return `${opening} This event is for ${audience}. ${sourceHint}`
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase()
}

function getHostname(value) {
  if (!value) return ''

  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function getFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) || null
}

function getAbsoluteUrl(value, baseUrl) {
  if (!value) return null

  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return null
  }
}

function getZipFromText(value) {
  return normalizeText(value).match(/\b\d{5}(?:-\d{4})?\b/)?.[0]?.slice(0, 5) || null
}

function getCityForZip(zipCode) {
  const rule = zipCityRules.find(([pattern]) => pattern.test(zipCode || ''))

  return rule?.[1] || null
}

function detectCity(value, fallbackCity = null) {
  const normalizedValue = normalizeKey(value)
  const zipCity = getCityForZip(getZipFromText(value))

  if (zipCity) return zipCity

  const explicitCity = supportedCityNames.find((city) =>
    normalizedValue.includes(city.toLowerCase()),
  )

  return explicitCity || fallbackCity
}

function createId(value) {
  return `event-${normalizeKey(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96)}`
}

function getHealthTopics(value) {
  return [
    ...new Set(
      healthTopicRules
        .filter(([, pattern]) => pattern.test(value))
        .map(([topic]) => topic),
    ),
  ]
}

function getDetectedHealthTerms(value) {
  return [
    ...new Set(
      normalizeText(value).match(new RegExp(healthTermPattern.source, 'gi')) || [],
    ),
  ]
}

function isHealthRelated(value) {
  return getDetectedHealthTerms(value).length > 0
}

function isGenericListingPage(candidate) {
  const title = normalizeText(candidate.title)
  const sourceUrl = normalizeText(candidate.sourceUrl || candidate.registrationUrl)
  let pathname

  try {
    pathname = sourceUrl ? new URL(sourceUrl).pathname.toLowerCase() : ''
  } catch {
    pathname = sourceUrl.toLowerCase()
  }
  const text = `${title} ${pathname}`

  if (genericTitlePattern.test(title)) return true

  return (
    genericListingPattern.test(text) &&
    !/\b[\w'-]+\s+[\w'-]+/.test(title.replace(/&[#\w]+;/g, ' '))
  )
}

function isEventbriteSpecificEventUrl(url) {
  const normalizedUrl = normalizeText(url).toLowerCase()

  if (!normalizedUrl.includes('eventbrite.com')) return true
  if (/\/d\/|\/directory|\/discover|\/health--events|\/things-to-do|\/b\//.test(normalizedUrl)) {
    return false
  }

  return /\/e\/.+-\d{6,}/.test(normalizedUrl)
}

function hasWrongLocation(value) {
  return wrongLocationPattern.test(value)
}

function extractDateText(value) {
  const text = normalizeText(value)

  return (
    text.match(isoDatePattern)?.[0] ||
    text.match(monthDatePattern)?.[0] ||
    text.match(numericDatePattern)?.[0] ||
    text.match(recurringPattern)?.[0] ||
    null
  )
}

function parseDateWithInference(dateText, currentDate) {
  if (!dateText) {
    return { dateConfidence: 'none', isRecurring: false, parsedStartDate: null }
  }

  if (recurringPattern.test(dateText)) {
    return { dateConfidence: 'recurring', isRecurring: true, parsedStartDate: null }
  }

  const hasYear = /\b\d{4}\b/.test(dateText)
  let parsed = Date.parse(dateText)

  if (!Number.isNaN(parsed) && !hasYear) {
    const inferredDate = new Date(parsed)
    inferredDate.setFullYear(currentDate.getFullYear())

    if (inferredDate < startOfDay(currentDate)) {
      inferredDate.setFullYear(currentDate.getFullYear() + 1)
    }

    parsed = inferredDate.getTime()
  }

  if (Number.isNaN(parsed)) {
    return { dateConfidence: 'low', isRecurring: false, parsedStartDate: null }
  }

  return {
    dateConfidence: hasYear ? 'high' : 'inferred',
    isRecurring: false,
    parsedStartDate: new Date(parsed).toISOString(),
  }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isUpcomingOrActiveEvent(candidate, currentDate) {
  const dateText =
    candidate.eventDateText ||
    candidate.startDate ||
    extractDateText(`${candidate.title} ${candidate.description}`)
  const parsedDate = parseDateWithInference(dateText, currentDate)

  if (parsedDate.isRecurring) {
    return { ...parsedDate, eventDateText: dateText, isUpcoming: true }
  }

  if (!parsedDate.parsedStartDate) {
    return { ...parsedDate, eventDateText: dateText, isUpcoming: false }
  }

  return {
    ...parsedDate,
    eventDateText: dateText,
    isUpcoming: new Date(parsedDate.parsedStartDate) >= startOfDay(currentDate),
  }
}

function normalizeSourceUrl(url, source) {
  if (!url) return null

  const hostname = getHostname(url)

  if (!hostname.endsWith(source.domain)) {
    return null
  }

  return url
}

function createSearchPlan() {
  const querySpecs = [
    ['sf.gov', 'site:sf.gov health screening event San Francisco'],
    ['sf.gov', 'site:sf.gov vaccination clinic San Francisco'],
    ['ucsfhealth.org', 'site:ucsfhealth.org events classes San Francisco'],
    ['kaiserpermanente.org', 'site:kaiserpermanente.org health classes San Francisco'],
    ['acgov.org', 'site:acgov.org health event Oakland'],
    ['berkeleyca.gov', 'site:berkeleyca.gov health event Berkeley'],
    ['smchealth.org', 'site:smchealth.org health event Daly City'],
    ['smchealth.org', 'site:smchealth.org vaccination clinic South San Francisco'],
  ]

  return querySpecs
    .map(([domain, query]) => {
      const city = detectCity(query)
      const source =
        trustedHealthEventSources.find(
          (candidate) => candidate.domain === domain && candidate.city === city,
        ) ||
        trustedHealthEventSources.find((candidate) => candidate.domain === domain)

      return source ? { query, source } : null
    })
    .filter(Boolean)
}

async function fetchSearchResults({ query }) {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing API key: set SERPAPI_API_KEY in your environment before running npm run fetch-events.',
    )
  }

  const searchParams = new URLSearchParams({
    api_key: apiKey,
    engine: 'google',
    gl: 'us',
    hl: 'en',
    q: query,
  })
  const response = await fetch(`${serpApiEndpoint}?${searchParams.toString()}`)

  if (!response.ok) {
    throw new Error(
      `Failed HTTP request for "${query}": SerpApi returned ${response.status} ${response.statusText}.`,
    )
  }

  const data = await response.json()

  if (data.error) {
    if (
      typeof data.error === 'string' &&
      data.error.includes("Google hasn't returned any results for this query")
    ) {
      return []
    }

    throw new Error(`SerpApi error for "${query}": ${data.error}`)
  }

  if (!Object.hasOwn(data, 'organic_results')) {
    return []
  }

  if (!Array.isArray(data.organic_results)) {
    throw new Error(
      `Invalid API response for "${query}": organic_results was present but was not an array.`,
    )
  }

  return data.organic_results
}

async function fetchSourcePage(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (compatible; FamilyHealthAppBot/1.0; +https://example.com)',
    },
  })
  const html = await response.text()

  return {
    contentType: response.headers.get('content-type') || '',
    finalUrl: response.url,
    html,
    ok: response.ok,
    responseLength: html.length,
    status: response.status,
  }
}

function getJsonLdObjects(value) {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap(getJsonLdObjects)
  if (typeof value !== 'object') return []

  const objects = [value]

  if (Array.isArray(value['@graph'])) {
    objects.push(...value['@graph'].flatMap(getJsonLdObjects))
  }

  return objects
}

function isEventType(value) {
  const type = value?.['@type']
  const types = Array.isArray(type) ? type : [type]

  return types.some((item) =>
    ['event', 'medicalevent', 'educationevent', 'screeningevent'].includes(
      normalizeKey(item),
    ),
  )
}

function getAddressText(location) {
  if (!location) return null
  if (typeof location === 'string') return location

  const address = location.address || location

  if (typeof address === 'string') return address

  return buildFullAddress(address)
}

function buildFullAddress({
  streetAddress,
  addressLocality,
  addressRegion,
  postalCode,
} = {}) {
  return [
    streetAddress,
    [addressLocality, addressRegion].filter(Boolean).join(', '),
    postalCode,
  ]
    .filter(Boolean)
    .join(' ') || null
}

function getLocationDetails(location) {
  const locationType = Array.isArray(location?.['@type'])
    ? location['@type'].map(normalizeKey)
    : [normalizeKey(location?.['@type'])]
  const isVirtualLocation = locationType.includes('virtuallocation')

  if (!location || typeof location === 'string') {
    return {
      address: typeof location === 'string' ? location : null,
      addressLocality: null,
      addressRegion: null,
      latitude: null,
      locationName: null,
      longitude: null,
      onlineUrl: null,
      postalCode: null,
      streetAddress: null,
      virtual: false,
    }
  }

  const address = location.address || {}
  const addressObject = typeof address === 'string' ? {} : address

  return {
    address:
      typeof address === 'string'
        ? address
        : buildFullAddress(addressObject),
    addressLocality: addressObject.addressLocality || null,
    addressRegion: addressObject.addressRegion || null,
    latitude:
      Number.isFinite(Number(location.geo?.latitude))
        ? Number(location.geo.latitude)
        : null,
    locationName: getFirstString(location.name),
    longitude:
      Number.isFinite(Number(location.geo?.longitude))
        ? Number(location.geo.longitude)
        : null,
    onlineUrl: isVirtualLocation ? getFirstString(location.url) : null,
    postalCode: addressObject.postalCode || null,
    streetAddress: addressObject.streetAddress || null,
    virtual: isVirtualLocation,
  }
}

function getAttendanceModeFromSchema(value) {
  const mode = normalizeKey(value)

  if (mode.includes('onlineeventattendancemode')) return 'online'
  if (mode.includes('offlineeventattendancemode')) return 'in-person'
  if (mode.includes('mixedeventattendancemode')) return 'hybrid'

  return ''
}

function inferAttendanceMode({ address, locationDetails, text }) {
  const normalizedText = normalizeText(text)
  const hasOnlineSignals =
    Boolean(locationDetails?.virtual) ||
    onlineEventPattern.test(normalizedText)
  const hasInPersonSignals = Boolean(address || locationDetails?.address)

  if (hasOnlineSignals && hasInPersonSignals) return 'hybrid'
  if (hasOnlineSignals) return 'online'
  if (hasInPersonSignals) return 'in-person'

  return 'unknown'
}

function getPlatform(value) {
  const text = normalizeText(value)

  if (/\bzoom\b/i.test(text)) return 'Zoom'
  if (/\bteams\b/i.test(text)) return 'Microsoft Teams'
  if (/\bgoogle meet\b/i.test(text)) return 'Google Meet'

  return ''
}

function extractJsonLdEvents(html, sourceUrl) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const events = []

  matches.forEach((match) => {
    try {
      const parsed = JSON.parse(match[1].trim())
      const jsonObjects = getJsonLdObjects(parsed).filter(isEventType)

      jsonObjects.forEach((event) => {
        const eventUrl = getAbsoluteUrl(getFirstString(event.url), sourceUrl) || sourceUrl
        const locationDetails = getLocationDetails(event.location)
        const offerUrl =
          typeof event.offers === 'object'
            ? getFirstString(event.offers.url)
            : null
        const onlineUrl =
          getAbsoluteUrl(locationDetails.onlineUrl, sourceUrl) ||
          getAbsoluteUrl(offerUrl, sourceUrl) ||
          (locationDetails.virtual ? eventUrl : null)
        const text = normalizeText(
          `${event.name} ${event.description} ${locationDetails.locationName} ${onlineUrl} ${eventUrl}`,
        )
        const schemaAttendanceMode = getAttendanceModeFromSchema(event.eventAttendanceMode)

        events.push({
          address: locationDetails.address,
          addressLocality: locationDetails.addressLocality,
          addressRegion: locationDetails.addressRegion,
          attendanceMode:
            schemaAttendanceMode ||
            inferAttendanceMode({
              address: locationDetails.address,
              locationDetails,
              text,
            }),
          description: normalizeText(event.description),
          endDate: getFirstString(event.endDate),
          eventDateText: getFirstString(event.startDate, event.doorTime),
          isOnline:
            schemaAttendanceMode === 'online' ||
            Boolean(locationDetails.virtual) ||
            onlineEventPattern.test(text),
          latitude: locationDetails.latitude,
          locationName: locationDetails.locationName,
          longitude: locationDetails.longitude,
          onlineUrl,
          organizer:
            typeof event.organizer === 'object' ? getFirstString(event.organizer.name) : null,
          postalCode: locationDetails.postalCode,
          platform: getPlatform(text),
          registrationUrl: eventUrl,
          registrationRequired: Boolean(offerUrl),
          sourceUrl: eventUrl,
          startDate: getFirstString(event.startDate),
          streetAddress: locationDetails.streetAddress,
          title: normalizeText(event.name),
          cost: event.isAccessibleForFree === true ? 'free' : 'unknown',
        })
      })
    } catch {
      // Ignore malformed JSON-LD blocks from source pages.
    }
  })

  return events
}

function extractMicrodataEvents(html, sourceUrl) {
  const blocks = [
    ...html.matchAll(/<[^>]+itemscope[^>]+itemtype=["'][^"']*schema\.org\/Event[^"']*["'][^>]*>([\s\S]{80,5000}?)<\/(?:div|article|li|section)>/gi),
  ]

  return blocks.map((match) => {
    const blockHtml = match[1]
    const blockText = stripHtml(blockHtml)
    const eventUrl =
      getAbsoluteUrl(blockHtml.match(/href=["']([^"']+)["']/i)?.[1], sourceUrl) || sourceUrl
    const street = normalizeText(
      blockHtml.match(/itemprop=["']streetAddress["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const city = normalizeText(
      blockHtml.match(/itemprop=["']addressLocality["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const region = normalizeText(
      blockHtml.match(/itemprop=["']addressRegion["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const zipCode = normalizeText(
      blockHtml.match(/itemprop=["']postalCode["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const address = [street, city, region, zipCode].filter(Boolean).join(', ')

    return {
      address: address || null,
      description:
        normalizeText(blockHtml.match(/itemprop=["']description["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]) ||
        blockText,
      endDate: null,
      eventDateText:
        normalizeText(blockHtml.match(/itemprop=["']startDate["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) ||
        extractDateText(blockText),
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(blockText),
      locationName: normalizeText(
        blockHtml.match(/itemprop=["']location["'][\s\S]*?itemprop=["']name["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
      ),
      organizer: null,
      registrationUrl: eventUrl,
      sourceUrl: eventUrl,
      startDate:
        normalizeText(blockHtml.match(/itemprop=["']startDate["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) ||
        null,
      title:
        normalizeText(blockHtml.match(/itemprop=["']name["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) ||
        normalizeText(blockHtml.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1]),
      cost: /\bfree\b/i.test(blockText) ? 'free' : 'unknown',
    }
  })
}

function extractRssOrAtomEvents(xml, sourceUrl) {
  const itemMatches = [
    ...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]{80,6000}?)<\/\1>/gi),
  ]

  return itemMatches.map((match) => {
    const item = match[2]
    const title = normalizeText(
      item.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1] ||
        item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
    )
    const description = normalizeText(
      item.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1] ||
        item.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i)?.[1] ||
        item.match(/<content[^>]*>([\s\S]*?)<\/content>/i)?.[1],
    )
    const link =
      getAbsoluteUrl(item.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1], sourceUrl) ||
      getAbsoluteUrl(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1], sourceUrl) ||
      sourceUrl
    const dateText = normalizeText(
      item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ||
        item.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] ||
        item.match(/<startDate[^>]*>([\s\S]*?)<\/startDate>/i)?.[1],
    )

    return {
      address: null,
      description,
      endDate: null,
      eventDateText: dateText || extractDateText(`${title} ${description}`),
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(`${title} ${description}`),
      locationName: null,
      organizer: null,
      registrationUrl: link,
      sourceUrl: link,
      startDate: dateText || null,
      title,
      cost: /\bfree\b/i.test(`${title} ${description}`) ? 'free' : 'unknown',
    }
  })
}

function unfoldIcs(value) {
  return value.replace(/\r?\n[ \t]/g, '')
}

function extractIcsEvents(icsText, sourceUrl) {
  const eventMatches = [...unfoldIcs(icsText).matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/gi)]

  return eventMatches.map((match) => {
    const block = match[1]
    const getField = (field) =>
      normalizeText(block.match(new RegExp(`${field}(?:;[^:]*)?:(.*)`, 'i'))?.[1])
    const link = getAbsoluteUrl(getField('URL'), sourceUrl) || sourceUrl

    return {
      address: getField('LOCATION') || null,
      description: getField('DESCRIPTION'),
      endDate: getField('DTEND') || null,
      eventDateText: getField('DTSTART') || extractDateText(block),
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(block),
      locationName: getField('LOCATION') || null,
      organizer: getField('ORGANIZER') || null,
      registrationUrl: link,
      sourceUrl: link,
      startDate: getField('DTSTART') || null,
      title: getField('SUMMARY'),
      cost: /\bfree\b/i.test(block) ? 'free' : 'unknown',
    }
  })
}

function extractEmbeddedJsonEvents(html, sourceUrl) {
  const events = []
  const stateMatches = [
    ...html.matchAll(/<script[^>]+id=["'](?:__NEXT_DATA__|drupal-settings-json)["'][^>]*>([\s\S]*?)<\/script>/gi),
  ]

  stateMatches.forEach((match) => {
    try {
      const parsed = JSON.parse(match[1].trim())
      JSON.stringify(parsed, (key, value) => {
        if (
          value &&
          typeof value === 'object' &&
          (value.title || value.name) &&
          (value.startDate || value.date || value.datetime || value.eventDate)
        ) {
          const text = normalizeText(
            `${value.title || value.name} ${value.description || value.summary || ''}`,
          )

          if (isHealthRelated(text)) {
            const link = getAbsoluteUrl(value.url || value.path || value.link, sourceUrl) || sourceUrl
            events.push({
              address: getAddressText(value.location || value.address),
              description: normalizeText(value.description || value.summary),
              endDate: getFirstString(value.endDate),
              eventDateText: getFirstString(value.startDate, value.date, value.datetime, value.eventDate),
              isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(text),
              locationName:
                typeof value.location === 'object'
                  ? getFirstString(value.location.name)
                  : getFirstString(value.location),
              organizer:
                typeof value.organizer === 'object'
                  ? getFirstString(value.organizer.name)
                  : getFirstString(value.organizer),
              registrationUrl: link,
              sourceUrl: link,
              startDate: getFirstString(value.startDate, value.date, value.datetime, value.eventDate),
              title: normalizeText(value.title || value.name),
              cost: /\bfree\b/i.test(text) ? 'free' : 'unknown',
            })
          }
        }

        return value
      })
    } catch {
      // Ignore malformed embedded state.
    }
  })

  return events
}

function stripHtml(value) {
  return normalizeText(value.replace(/<script[\s\S]*?<\/script>/gi, ' '))
}

function extractEventCards(html, sourceUrl) {
  const cardMatches = [
    ...html.matchAll(
      /<(article|li|div)[^>]+class=["'][^"']*(event|card|class|workshop|clinic)[^"']*["'][^>]*>([\s\S]{80,2500}?)<\/\1>/gi,
    ),
  ]
  const records = []

  cardMatches.slice(0, 40).forEach((match, index) => {
    const cardHtml = match[3]
    const cardText = stripHtml(cardHtml)
    const dateText = extractDateText(cardText)
    const title =
      normalizeText(cardHtml.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1]) ||
      cardText.split(/[.!?]/)[0]

    if (!title || !isHealthRelated(cardText)) {
      return
    }

    records.push({
      address: getFirstString(cardText.match(/\b\d{1,6}\s+[^,.]+,\s*(?:South San Francisco|San Francisco|Daly City|Oakland|Berkeley)[^,.]*(?:\d{5})?/i)?.[0]),
      description: cardText,
      endDate: null,
      eventDateText: dateText,
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(cardText),
      locationName: null,
      organizer: null,
      registrationUrl:
        getAbsoluteUrl(cardHtml.match(/href=["']([^"']+)["']/i)?.[1], sourceUrl) ||
        sourceUrl,
      sourceUrl:
        getAbsoluteUrl(cardHtml.match(/href=["']([^"']+)["']/i)?.[1], sourceUrl) ||
        sourceUrl,
      startDate: dateText,
      title: normalizeText(title) || `Event card ${index + 1}`,
      cost: /\bfree\b/i.test(cardText) ? 'free' : 'unknown',
    })
  })

  return records
}

function extractSourceSpecificEvents({ html, sourceUrl }) {
  return [
    ...extractJsonLdEvents(html, sourceUrl),
    ...extractMicrodataEvents(html, sourceUrl),
    ...extractEmbeddedJsonEvents(html, sourceUrl),
    ...extractRssOrAtomEvents(html, sourceUrl),
    ...extractIcsEvents(html, sourceUrl),
    ...extractEventCards(html, sourceUrl),
  ]
}

function extractCivicPlusEvents(html, sourceUrl) {
  const listItemEvents = [
    ...html.matchAll(/<article>\s*<a href=["']([^"']+)["'][^>]*>([\s\S]{120,5000}?)<\/a>\s*<\/article>/gi),
  ].map((match) => {
    const blockHtml = match[2]
    const blockText = stripHtml(blockHtml)
    const eventUrl = getAbsoluteUrl(match[1], sourceUrl) || sourceUrl
    const day = normalizeText(blockHtml.match(/class=["']part-date["'][^>]*>([\s\S]*?)<\/span>/i)?.[1])
    const month = normalizeText(blockHtml.match(/class=["']part-month["'][^>]*>([\s\S]*?)<\/span>/i)?.[1])
    const year = normalizeText(blockHtml.match(/class=["']part-year["'][^>]*>([\s\S]*?)<\/span>/i)?.[1])
    const dateText = [month, day, year].filter(Boolean).join(' ') || extractDateText(blockText)
    const address = normalizeText(blockHtml.match(/class=["']list-item-address["'][^>]*>([\s\S]*?)<\/p>/i)?.[1])

    return {
      address: address || null,
      description: blockText,
      endDate: null,
      eventDateText: dateText,
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(blockText),
      locationName: address || null,
      organizer: null,
      registrationUrl: eventUrl,
      sourceUrl: eventUrl,
      startDate: dateText || null,
      title: normalizeText(blockHtml.match(/class=["']list-item-title["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1]),
      cost: /\bfree\b/i.test(blockText) ? 'free' : 'unknown',
    }
  })

  const calendarEvents = [
    ...html.matchAll(/<li>\s*<h3>[\s\S]{0,300}?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]{0,2000}?<\/li>/gi),
  ].map((match) => {
    const blockHtml = match[0]
    const blockText = stripHtml(blockHtml)
    const eventUrl = getAbsoluteUrl(match[1], sourceUrl) || sourceUrl
    const title =
      normalizeText(match[2]) ||
      normalizeText(blockHtml.match(/itemprop=["']name["'][^>]*>([\s\S]*?)<\/span>/i)?.[1])
    const startDate = normalizeText(
      blockHtml.match(/itemprop=["']startDate["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const street = normalizeText(
      blockHtml.match(/itemprop=["']streetAddress["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const city = normalizeText(
      blockHtml.match(/itemprop=["']addressLocality["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const region = normalizeText(
      blockHtml.match(/itemprop=["']addressRegion["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const zipCode = normalizeText(
      blockHtml.match(/itemprop=["']postalCode["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    )
    const address = [street, city, region, zipCode].filter(Boolean).join(', ')

    return {
      address: address || null,
      description: blockText,
      endDate: null,
      eventDateText: startDate || extractDateText(blockText),
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(blockText),
      locationName:
        normalizeText(blockHtml.match(/class=["']name["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]) ||
        address ||
        null,
      organizer: null,
      registrationUrl: eventUrl,
      sourceUrl: eventUrl,
      startDate: startDate || null,
      title,
      cost: /\bfree\b/i.test(blockText) ? 'free' : 'unknown',
    }
  })

  return [
    ...extractSourceSpecificEvents({ html, sourceUrl }),
    ...listItemEvents,
    ...calendarEvents,
  ]
}

function parseSfGovEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseSfdphEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseSanMateoCountyHealthEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseUcsfEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseKaiserEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseBerkeleyEvents({ html, sourceUrl }) {
  const featuredEvents = [
    ...html.matchAll(/<div class=["'][^"']*featured-event-content[^"']*["'][^>]*>([\s\S]{80,2500}?)<\/div>\s*<!-- END OUTPUT from 'core\/modules\/views\/templates\/views-view-field\.html\.twig' -->/gi),
  ].map((match) => {
    const blockHtml = match[1]
    const blockText = stripHtml(blockHtml)
    const eventUrl =
      getAbsoluteUrl(blockHtml.match(/<h3[^>]*class=["']title["'][\s\S]*?<a[^>]+href=["']([^"']+)["']/i)?.[1], sourceUrl) ||
      sourceUrl
    const datetime = blockHtml.match(/<time[^>]+datetime=["']([^"']+)["'][^>]*>([\s\S]*?)<\/time>/i)

    return {
      address: null,
      description: blockText,
      endDate: null,
      eventDateText: normalizeText(datetime?.[2]) || extractDateText(blockText),
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(blockText),
      locationName: null,
      organizer: null,
      registrationUrl: eventUrl,
      sourceUrl: eventUrl,
      startDate: datetime?.[1] || null,
      title:
        normalizeText(blockHtml.match(/<h3[^>]*class=["']title["'][\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1]) ||
        normalizeText(blockHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]),
      cost: /\bfree\b/i.test(blockText) ? 'free' : 'unknown',
    }
  })

  const accordionEvents = [
    ...html.matchAll(/<li class=["'][^"']*event-item[^"']*["'][^>]*>([\s\S]{120,5000}?)<\/li>/gi),
  ].map((match) => {
    const blockHtml = match[1]
    const blockText = stripHtml(blockHtml)
    const detailsUrl =
      getAbsoluteUrl(
        blockHtml.match(/href=["']([^"']+)["'][^>]*>\s*Event Details\s*<\/a>/i)?.[1],
        sourceUrl,
      ) || sourceUrl
    const registerUrl =
      getAbsoluteUrl(
        blockHtml.match(/href=["']([^"']+)["'][^>]*>\s*Register Online\s*<\/a>/i)?.[1],
        sourceUrl,
      ) || detailsUrl
    const dateText =
      normalizeText(blockHtml.match(/<strong>Date:<\/strong>\s*([\s\S]*?)<br>/i)?.[1]) ||
      extractDateText(blockText)
    const address =
      normalizeText(blockHtml.match(/<strong>Location:<\/strong>\s*([\s\S]*?)<br>/i)?.[1]) ||
      null

    return {
      address,
      description: blockText,
      endDate: null,
      eventDateText: dateText,
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(blockText),
      locationName: address,
      organizer: null,
      registrationUrl: registerUrl,
      sourceUrl: detailsUrl,
      startDate: dateText,
      title: normalizeText(
        blockHtml.match(/<a[^>]+class=["'][^"']*accordion-title[^"']*["'][^>]*>([\s\S]*?)<div/i)?.[1],
      ),
      cost: /\bfree\b/i.test(blockText) ? 'free' : 'unknown',
    }
  })

  return [
    ...extractSourceSpecificEvents({ html, sourceUrl }),
    ...featuredEvents,
    ...accordionEvents,
  ]
}

function parseUcBerkeleyEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseAlamedaCountyEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseOaklandEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseYmcaSfEvents({ html, sourceUrl }) {
  return extractSourceSpecificEvents({ html, sourceUrl })
}

function parseSouthSanFranciscoEvents({ html, sourceUrl }) {
  return extractCivicPlusEvents(html, sourceUrl)
}

function parseDalyCityEvents({ html, sourceUrl }) {
  return extractCivicPlusEvents(html, sourceUrl)
}

function parseEventbriteIndividualEvents({ html, sourceUrl }) {
  if (!isEventbriteSpecificEventUrl(sourceUrl)) {
    return []
  }

  return extractSourceSpecificEvents({ html, sourceUrl })
}

const sourceParsers = {
  acgov: parseAlamedaCountyEvents,
  berkeley: parseBerkeleyEvents,
  'daly-city': parseDalyCityEvents,
  eventbrite: parseEventbriteIndividualEvents,
  kaiser: parseKaiserEvents,
  oakland: parseOaklandEvents,
  sfdph: parseSfdphEvents,
  'sf-gov': parseSfGovEvents,
  'smc-health': parseSanMateoCountyHealthEvents,
  ssf: parseSouthSanFranciscoEvents,
  ucsf: parseUcsfEvents,
  'uc-berkeley': parseUcBerkeleyEvents,
  'ymca-sf': parseYmcaSfEvents,
}

function parseKnownSourcePage({ html, source, sourceUrl }) {
  const parser = sourceParsers[source.parserId] || extractSourceSpecificEvents

  return parser({ html, source, sourceUrl })
}

function extractEventDetailLinks(html, baseUrl, source) {
  const links = [
    ...html.matchAll(/<a\b[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi),
  ]
    .map((match) => {
      const url = getAbsoluteUrl(match[1], baseUrl)
      const label = normalizeText(match[2])

      return { label, url }
    })
    .filter(({ url }) => url && getHostname(url).endsWith(source.domain))
    .filter(({ label, url }) => {
      const text = `${label} ${new URL(url).pathname}`

      return /\b(event|calendar|class|clinic|schedule|details|workshop|support-group|vaccin)/i.test(text)
    })
    .filter(({ url }) => !isGenericListingPage({ sourceUrl: url, title: 'Event details' }))
    .map(({ url }) => url)

  return [...new Set(links)].slice(0, 12)
}

function extractDetailPageFallbackEvent(html, sourceUrl) {
  const text = stripHtml(html)
  const title =
    normalizeText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) ||
    normalizeText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])
  const description =
    normalizeText(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]) ||
    text.slice(0, 1000)
  const address =
    normalizeText(
      html.match(/\b\d{1,6}\s+[^<,.]+,\s*(?:South San Francisco|San Francisco|Daly City|Oakland|Berkeley)[^<,.]*(?:\d{5})?/i)?.[0],
    ) || null

  if (!title || !isHealthRelated(`${title} ${description} ${text.slice(0, 2000)}`)) {
    return []
  }

  return [
    {
      address,
      description,
      endDate: null,
      eventDateText: extractDateText(text),
      isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(text),
      locationName: address,
      organizer: null,
      registrationUrl: sourceUrl,
      sourceUrl,
      startDate: extractDateText(text),
      title,
      cost: /\bfree\b/i.test(text) ? 'free' : 'unknown',
    },
  ]
}

function classifySourceHealth({ extractedCount, page, rejectionCounts }) {
  if (!page) return 'blocked'
  if (page.status === 404) return '404/broken'
  if (!page.ok) return page.status === 403 ? 'blocked' : '404/broken'
  if (/application\/json|application\/rss|application\/atom|text\/calendar/i.test(page.contentType)) {
    return extractedCount > 0 ? 'working event page' : 'working calendar/listing page'
  }
  if (/__NEXT_DATA__|data-reactroot|window\.__INITIAL_STATE__|<script type="module"/i.test(page.html) && extractedCount === 0) {
    return 'requires JavaScript rendering'
  }
  if (extractedCount > 0) {
    return 'working event page'
  }
  if (/calendar|event|schedule|class|clinic|rss|ical|ics/i.test(page.html)) {
    return 'working calendar/listing page'
  }
  if (Object.values(rejectionCounts).some((count) => count > 0)) {
    return 'informational page with no events'
  }
  return 'informational page with no events'
}

function createRejectionCounter() {
  return {
    'rejected as entertainment': 0,
    'rejected as expired': 0,
    'rejected as generic listing page': 0,
    'rejected as not health-related': 0,
    'rejected as wrong city': 0,
    'rejected for missing date': 0,
    'rejected for missing location': 0,
    'rejected for missing source URL': 0,
    'rejected because event page cannot be verified': 0,
  }
}

function createDevelopmentSampleEvents() {
  return [
    {
      address: 'Online',
      attendanceMode: 'online',
      city: 'San Francisco',
      cost: 'free',
      dateConfidence: 'recurring',
      description:
        'Sample-only preventive health event for local UI development. This file is never merged into production events.json.',
      endDate: null,
      eventDateText: 'weekly',
      healthTopics: ['blood-pressure', 'heart-health'],
      id: 'sample-blood-pressure-screening',
      isOnline: true,
      isRecurring: true,
      lastVerified: new Date().toISOString(),
      locationName: 'Online',
      onlineUrl: 'https://example.com/sample-blood-pressure',
      organizer: 'Development Sample',
      platform: null,
      registrationUrl: 'https://example.com/sample-blood-pressure',
      registrationRequired: false,
      sourceName: 'Development Sample',
      sourceUrl: 'https://example.com/sample-blood-pressure',
      startDate: null,
      summary:
        'Learn about blood pressure awareness through a simple preventive-health event. This sample is for local UI testing and people exploring how community resources can support heart-health habits. The main benefit is seeing how event summaries appear without using production data.',
      title: 'Sample Blood Pressure Screening',
      verificationStatus: 'sample-only',
      zipCode: null,
    },
  ]
}

function normalizeExtractedEvent(event, source, currentDate) {
  const address =
    event.address ||
    buildFullAddress({
      streetAddress: event.streetAddress,
      addressLocality: event.addressLocality,
      addressRegion: event.addressRegion,
      postalCode: event.postalCode,
    })
  const combinedText = normalizeText(
    `${event.title} ${event.description} ${address} ${event.locationName}`,
  )
  const zipCode =
    event.postalCode || getZipFromText(`${address} ${event.locationName} ${combinedText}`)
  const city = detectCity(
    [address, event.addressLocality, event.title, event.description].filter(Boolean).join(' '),
    getCityForZip(zipCode) || source.city,
  )
  const dateInfo = isUpcomingOrActiveEvent(event, currentDate)
  const healthTopics = getHealthTopics(combinedText)
  const attendanceMode =
    event.attendanceMode ||
    inferAttendanceMode({
      address,
      locationDetails: { virtual: Boolean(event.isOnline) },
      text: `${combinedText} ${event.onlineUrl} ${event.registrationUrl} ${event.sourceUrl}`,
    })
  const eventIsOnline = attendanceMode === 'online'
  const eventIsHybrid = attendanceMode === 'hybrid'
  const locationText = eventIsOnline
    ? 'Online'
    : getFirstString(event.locationName, address, city)
  const summary = createEventSummary(event, healthTopics, attendanceMode)

  return {
    address: address || null,
    addressLocality: event.addressLocality || city || null,
    addressRegion: event.addressRegion || (city ? 'CA' : null),
    attendanceMode,
    city,
    cost: event.cost || 'unknown',
    dateConfidence: dateInfo.dateConfidence,
    description: normalizeText(event.description) || null,
    endDate: event.endDate || null,
    eventDateText: dateInfo.eventDateText || null,
    healthTopics,
    id: createId(`${event.title}-${event.sourceUrl}-${dateInfo.eventDateText}`),
    isOnline: eventIsOnline,
    isRecurring: dateInfo.isRecurring,
    lastVerified: new Date().toISOString(),
    latitude: Number.isFinite(event.latitude) ? event.latitude : null,
    locationName: locationText,
    longitude: Number.isFinite(event.longitude) ? event.longitude : null,
    onlineUrl: event.onlineUrl || (eventIsOnline || eventIsHybrid ? event.registrationUrl || event.sourceUrl || null : null),
    organizer: event.organizer || source.name,
    postalCode: zipCode || null,
    platform: event.platform || getPlatform(`${combinedText} ${event.onlineUrl}`) || null,
    registrationUrl: event.registrationUrl || event.sourceUrl || null,
    registrationRequired: Boolean(event.registrationRequired),
    sourceName: source.name,
    sourceUrl: event.sourceUrl || null,
    startDate: dateInfo.parsedStartDate,
    streetAddress: event.streetAddress || null,
    summary,
    title: normalizeText(event.title),
    verificationStatus: 'individual-event',
    zipCode,
    isUpcoming: dateInfo.isUpcoming,
  }
}

function getValidationRejection(candidate, currentDate) {
  const combinedText = normalizeText(
    `${candidate.title} ${candidate.description} ${candidate.sourceUrl} ${candidate.registrationUrl}`,
  )

  if (!candidate.title || genericTitlePattern.test(candidate.title)) {
    return 'rejected as generic listing page'
  }

  if (isGenericListingPage(candidate)) {
    return 'rejected as generic listing page'
  }

  if (!isEventbriteSpecificEventUrl(candidate.sourceUrl || candidate.registrationUrl)) {
    return 'rejected as generic listing page'
  }

  if (exclusionPattern.test(combinedText) || entertainmentDomains.some((domain) => getHostname(candidate.sourceUrl).endsWith(domain))) {
    return 'rejected as entertainment'
  }

  if (hasWrongLocation(combinedText)) {
    return 'rejected as wrong city'
  }

  if (!candidate.city || !supportedCityNames.includes(candidate.city)) {
    return 'rejected as wrong city'
  }

  if (!candidate.sourceUrl) {
    return 'rejected for missing source URL'
  }

  if (!candidate.healthTopics.length || !isHealthRelated(combinedText)) {
    return 'rejected as not health-related'
  }

  if (!candidate.eventDateText && !candidate.isRecurring) {
    return 'rejected for missing date'
  }

  if (!candidate.isUpcoming && !candidate.isRecurring) {
    return 'rejected as expired'
  }

  if (!candidate.locationName && !candidate.address && !candidate.isOnline) {
    return 'rejected for missing location'
  }

  const dateInfo = isUpcomingOrActiveEvent(candidate, currentDate)
  if (!dateInfo.isUpcoming && !dateInfo.isRecurring) {
    return 'rejected as expired'
  }

  return ''
}

function normalizeSearchResult(result, source, index) {
  const title = normalizeText(result.title)
  const description = normalizeText(result.snippet)
  const sourceUrl = normalizeSourceUrl(getFirstString(result.link, result.redirect_link), source)
  const text = normalizeText(`${title} ${description} ${result.displayed_link || ''}`)
  const detectedDate = getFirstString(result.date) || extractDateText(text)
  const zipCode = getZipFromText(text)

  return {
    description,
    eventDateText: detectedDate,
    isDiscoveryPage: isGenericListingPage({ title, sourceUrl }) || sourcePagePattern.test(text),
    isOnline: /\b(online|virtual|webinar|zoom)\b/i.test(text),
    queryIndex: index,
    source,
    sourceUrl,
    title,
    city: detectCity(text, getCityForZip(zipCode) || source.city),
    zipCode,
  }
}

async function discoverReplacementEventPage(source) {
  if (!process.env.SERPAPI_API_KEY) {
    return { resultsChecked: 0, sourceUrl: null }
  }

  const query = `site:${source.domain} ${source.searchTerms.slice(0, 2).join(' OR ')} ${source.city} events calendar`
  const results = await fetchSearchResults({ query })

  for (const [index, result] of results.entries()) {
    const candidate = normalizeSearchResult(result, source, index)
    const sourceUrl = candidate.sourceUrl

    if (
      sourceUrl &&
      !isGenericListingPage(candidate) &&
      isEventbriteSpecificEventUrl(sourceUrl) &&
      !hasWrongLocation(`${candidate.title} ${candidate.description}`)
    ) {
      return { query, resultsChecked: results.length, sourceUrl }
    }
  }

  return { query, resultsChecked: results.length, sourceUrl: null }
}

function logCandidateDebug({ candidate, query, rejectionReason }) {
  const combinedText = normalizeText(
    `${candidate.title} ${candidate.description} ${candidate.sourceUrl}`,
  )

  console.log('')
  console.log(`Candidate title: ${candidate.title || '(missing title)'}`)
  console.log(`Source domain: ${getHostname(candidate.sourceUrl) || '(missing source domain)'}`)
  console.log(`Query: ${query}`)
  console.log(`Detected health terms: ${getDetectedHealthTerms(combinedText).join(', ') || '(none)'}`)
  console.log(`Detected excluded terms: ${[...new Set(combinedText.match(new RegExp(exclusionPattern.source, 'gi')) || [])].join(', ') || '(none)'}`)
  console.log(`Detected date: ${candidate.eventDateText || '(none)'}`)
  console.log(`Detected city: ${candidate.city || '(none)'}`)
  console.log(`Detected ZIP: ${candidate.zipCode || '(none)'}`)
  console.log(`Accepted or rejected: ${rejectionReason ? 'Rejected' : 'Accepted'}`)
  console.log(`Exact rejection reason: ${rejectionReason || '(accepted)'}`)
}

function dedupeEvents(events) {
  const seen = new Set()
  const uniqueEvents = []
  let duplicateCount = 0

  events.forEach((event) => {
    const key = normalizeKey(`${event.title}|${event.sourceUrl || event.registrationUrl}`)
    const existingIndex = uniqueEvents.findIndex(
      (existingEvent) =>
        normalizeKey(`${existingEvent.title}|${existingEvent.sourceUrl || existingEvent.registrationUrl}`) ===
        key,
    )

    if (seen.has(key) && existingIndex >= 0) {
      duplicateCount += 1
      if (
        normalizeText(event.description).length >
        normalizeText(uniqueEvents[existingIndex].description).length
      ) {
        uniqueEvents[existingIndex] = event
      }
      return
    }

    seen.add(key)
    uniqueEvents.push(event)
  })

  return { duplicateCount, uniqueEvents }
}

function sortEvents(events) {
  return [...events].sort((first, second) => {
    if (first.startDate && second.startDate) {
      return Date.parse(first.startDate) - Date.parse(second.startDate)
    }
    if (first.startDate) return -1
    if (second.startDate) return 1
    return first.title.localeCompare(second.title)
  })
}

function countBy(events, getKey) {
  return events.reduce((summary, event) => {
    const keys = getKey(event)
    const normalizedKeys = Array.isArray(keys) ? keys : [keys]

    normalizedKeys.filter(Boolean).forEach((key) => {
      summary[key] = (summary[key] || 0) + 1
    })

    return summary
  }, {})
}

function addRejectedCount(rejectedCounts, reason) {
  rejectedCounts[reason] = (rejectedCounts[reason] || 0) + 1
}

function runBadExampleChecks(currentDate) {
  const examples = [
    'Discover Health Screening Events & Activities in Atlanta, GA',
    'Best Health Screening in United States',
    'Directory of Health Classes & Programs',
    'Health Education Home Page',
    'Public Health',
    'Events',
    'November 1, 2022 - Message from the Chief',
    'May 31, 2024 The Honorable Board of Supervisors',
  ]

  console.log('Bad-example validation:')
  examples.forEach((title) => {
    const normalized = normalizeExtractedEvent(
      {
        description: title,
        eventDateText: extractDateText(title),
        sourceUrl: 'https://sf.gov/example',
        title,
      },
      trustedHealthEventSources[0],
      currentDate,
    )
    console.log(`- ${title}: ${getValidationRejection(normalized, currentDate) || 'accepted'}`)
  })
}

async function fetchEvents() {
  const currentDate = new Date()
  const searchPlan = createSearchPlan()
  const blockedSources = []
  const rejectedCounts = createRejectionCounter()
  const extractedEvents = []
  const sourceReports = []
  let discoveryPagesFound = 0
  let eventCardRecordsExtracted = 0
  let individualEventPagesFound = 0
  let jsonLdEventsExtracted = 0
  let totalSearchResults = 0

  runBadExampleChecks(currentDate)

  for (const [sourceIndex, source] of trustedHealthEventSources.entries()) {
    const candidateSourceUrls = [source.eventPageUrl]
    console.log(`Source ${sourceIndex + 1}/${trustedHealthEventSources.length}: ${source.name}`)
    const sourceRejectedCounts = createRejectionCounter()
    let sourceExtractedCount = 0
    let sourcePage = null

    try {
      sourcePage = await fetchSourcePage(source.eventPageUrl)
      discoveryPagesFound += 1

      if (!sourcePage.ok) {
        throw new Error(`HTTP ${sourcePage.status}`)
      }

      const sourceEvents = parseKnownSourcePage({
        html: sourcePage.html,
        source,
        sourceUrl: sourcePage.finalUrl,
      })

      if (sourceEvents.length === 0) {
        const discovery = await discoverReplacementEventPage(source)
        totalSearchResults += discovery.resultsChecked

        if (discovery.sourceUrl && !candidateSourceUrls.includes(discovery.sourceUrl)) {
          candidateSourceUrls.push(discovery.sourceUrl)
          console.log(`Discovered replacement event page: ${discovery.sourceUrl}`)
        }
      }

      for (const sourceUrl of candidateSourceUrls) {
        const page = sourceUrl === source.eventPageUrl
          ? sourcePage
          : await fetchSourcePage(sourceUrl)

        if (!page.ok) {
          throw new Error(`HTTP ${page.status}`)
        }

        const pageHtml = page.html
        const pageSourceUrl = page.finalUrl || sourceUrl
        const rawEvents = parseKnownSourcePage({ html: pageHtml, source, sourceUrl: pageSourceUrl })
        const jsonLdEvents = extractJsonLdEvents(pageHtml, sourceUrl)
        const cardEvents = extractEventCards(pageHtml, sourceUrl)
        const detailLinks = [
          ...new Set([
            ...rawEvents
              .map((event) => event.sourceUrl)
              .filter((eventUrl) => eventUrl && eventUrl !== pageSourceUrl),
            ...extractEventDetailLinks(pageHtml, pageSourceUrl, source),
          ]),
        ].slice(0, 12)
        const detailEvents = []

        for (const detailLink of detailLinks) {
          try {
            const detailPage = await fetchSourcePage(detailLink)

            if (!detailPage.ok) continue

            detailEvents.push(
              ...parseKnownSourcePage({
                html: detailPage.html,
                source,
                sourceUrl: detailPage.finalUrl,
              }),
              ...extractDetailPageFallbackEvent(detailPage.html, detailPage.finalUrl),
            )
          } catch {
            addRejectedCount(sourceRejectedCounts, 'rejected because event page cannot be verified')
            addRejectedCount(rejectedCounts, 'rejected because event page cannot be verified')
          }
        }
        const combinedRawEvents = [...rawEvents, ...detailEvents]

        jsonLdEventsExtracted += jsonLdEvents.length
        eventCardRecordsExtracted += cardEvents.length
        individualEventPagesFound += combinedRawEvents.length
        sourceExtractedCount += combinedRawEvents.length

        combinedRawEvents.forEach((event) => {
          const normalizedEvent = normalizeExtractedEvent(
            { ...event, sourceUrl: event.sourceUrl || pageSourceUrl },
            source,
            currentDate,
          )
          const rejectionReason = getValidationRejection(normalizedEvent, currentDate)

          logCandidateDebug({
            candidate: normalizedEvent,
            query: sourceUrl,
            rejectionReason,
          })

          if (rejectionReason) {
            addRejectedCount(rejectedCounts, rejectionReason)
            addRejectedCount(sourceRejectedCounts, rejectionReason)
            return
          }

          extractedEvents.push(normalizedEvent)
        })
      }
    } catch (error) {
      blockedSources.push(`${source.eventPageUrl}: ${error.message}`)
      addRejectedCount(rejectedCounts, 'rejected because event page cannot be verified')
      addRejectedCount(sourceRejectedCounts, 'rejected because event page cannot be verified')
    }

    const sourceClassification = classifySourceHealth({
      extractedCount: sourceExtractedCount,
      page: sourcePage,
      rejectionCounts: sourceRejectedCounts,
    })

    sourceReports.push({
      classification: sourceClassification,
      contentType: sourcePage?.contentType || '(none)',
      finalUrl: sourcePage?.finalUrl || '(not reached)',
      httpStatus: sourcePage?.status || '(fetch failed)',
      parserId: source.parserId,
      recordsExtracted: sourceExtractedCount,
      rejectionReasons: sourceRejectedCounts,
      responseLength: sourcePage?.responseLength || 0,
      sourceName: source.name,
      url: source.eventPageUrl,
    })

    console.log(`Source health: ${source.name}`)
    console.log(`- URL: ${source.eventPageUrl}`)
    console.log(`- HTTP status: ${sourcePage?.status || '(fetch failed)'}`)
    console.log(`- Final redirected URL: ${sourcePage?.finalUrl || '(not reached)'}`)
    console.log(`- Content type: ${sourcePage?.contentType || '(none)'}`)
    console.log(`- Response length: ${sourcePage?.responseLength || 0}`)
    console.log(`- Parser ID: ${source.parserId}`)
    console.log(`- Records extracted: ${sourceExtractedCount}`)
    console.log(`- Exact rejection reasons: ${JSON.stringify(sourceRejectedCounts)}`)
    console.log(`- Classification: ${sourceClassification}`)

    if (sourceIndex < trustedHealthEventSources.length - 1) {
      await delay(requestDelayMs)
    }
  }

  const { duplicateCount, uniqueEvents } = dedupeEvents(extractedEvents)
  const finalEvents = sortEvents(uniqueEvents).slice(0, maxSavedEvents)
  const eventsByCity = countBy(finalEvents, (event) => event.city)
  const eventsByHealthTopic = countBy(finalEvents, (event) => event.healthTopics)

  await mkdir(path.dirname(outputFile), { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(finalEvents, null, 2)}\n`)
  await writeFile(
    sampleOutputFile,
    `${JSON.stringify(createDevelopmentSampleEvents(), null, 2)}\n`,
  )

  return {
    acceptedExamples: finalEvents.map((event) => event.title),
    blockedSources,
    discoveryPagesFound,
    duplicateCount,
    eventsByCity,
    eventsByHealthTopic,
    eventCardRecordsExtracted,
    finalEvents,
    individualEventPagesFound,
    jsonLdEventsExtracted,
    rejectedCounts,
    searchPlan,
    sourceReports,
    totalSearchResults,
  }
}

function printSummary(summary) {
  console.log('')
  console.log('Fetch summary')
  console.log(`- total search results: ${summary.totalSearchResults}`)
  console.log(`- discovery pages found: ${summary.discoveryPagesFound}`)
  console.log(`- individual event pages found: ${summary.individualEventPagesFound}`)
  console.log(`- JSON-LD events extracted: ${summary.jsonLdEventsExtracted}`)
  console.log(`- event-card records extracted: ${summary.eventCardRecordsExtracted}`)
  console.log(`- rejected as generic listing page: ${summary.rejectedCounts['rejected as generic listing page']}`)
  console.log(`- rejected as expired: ${summary.rejectedCounts['rejected as expired']}`)
  console.log(`- rejected as wrong city: ${summary.rejectedCounts['rejected as wrong city']}`)
  console.log(`- rejected as not health-related: ${summary.rejectedCounts['rejected as not health-related']}`)
  console.log(`- rejected for missing date: ${summary.rejectedCounts['rejected for missing date']}`)
  console.log(`- rejected for missing location: ${summary.rejectedCounts['rejected for missing location']}`)
  console.log(`- duplicates removed: ${summary.duplicateCount}`)
  console.log(`- final valid events saved: ${summary.finalEvents.length}`)
  console.log(`- events by city: ${JSON.stringify(summary.eventsByCity)}`)
  console.log(`- events by health topic: ${JSON.stringify(summary.eventsByHealthTopic)}`)
  console.log(`- accepted examples: ${summary.acceptedExamples.join(' | ') || '(none)'}`)
  console.log(`- blocked sources: ${summary.blockedSources.join(' | ') || '(none)'}`)
  console.log('Source health report:')
  summary.sourceReports.forEach((report) => {
    console.log(`- ${report.sourceName}`)
    console.log(`  URL: ${report.url}`)
    console.log(`  HTTP status: ${report.httpStatus}`)
    console.log(`  Final URL: ${report.finalUrl}`)
    console.log(`  Content type: ${report.contentType}`)
    console.log(`  Response length: ${report.responseLength}`)
    console.log(`  Parser ID: ${report.parserId}`)
    console.log(`  Records extracted: ${report.recordsExtracted}`)
    console.log(`  Rejection reasons: ${JSON.stringify(report.rejectionReasons)}`)
    console.log(`  Classification: ${report.classification}`)
  })
  console.log('Google discovery fallback queries:')
  summary.searchPlan.forEach((search) => {
    console.log(`- ${search.query}`)
  })
}

export {
  getDetectedHealthTerms,
  getHealthTopics,
  getValidationRejection,
  isHealthRelated,
}

const isDirectRun = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false

if (isDirectRun) {
  try {
    if (!process.env.SERPAPI_API_KEY) {
      console.log('SERPAPI_API_KEY is not set. Google discovery fallback will be skipped.')
    }

    printSummary(await fetchEvents())
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
