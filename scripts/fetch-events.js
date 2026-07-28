import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const serpApiEndpoint = 'https://serpapi.com/search.json'
const outputFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public/data/events.json',
)
const searchQueries = [
  'free health events in San Francisco this week',
  'free wellness events in San Francisco this week',
  'free vaccination clinics in San Francisco this week',
  'free mental health events in San Francisco this week',
  'free fitness events in San Francisco this week',
  'free community health screenings in San Francisco this week',
]
const allowedCities = new Set([
  'berkeley',
  'daly city',
  'oakland',
  'san francisco',
  'south san francisco',
])
const requestDelayMs = 750
const maxSavedEvents = 12

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function getFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) || ''
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase()
}

function normalizeAddress(address) {
  if (Array.isArray(address)) {
    return address.filter(Boolean).join(', ')
  }

  if (typeof address === 'string') {
    return address
  }

  return ''
}

function getCityFromAddress(address) {
  const normalizedAddress = normalizeText(address)
  const lowerAddress = normalizedAddress.toLowerCase()

  for (const city of allowedCities) {
    if (lowerAddress.includes(city)) {
      return city
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  }

  const parts = normalizedAddress
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return parts.at(-2)
  }

  return ''
}

function getZipFromAddress(address) {
  return normalizeText(address).match(/\b\d{5}(?:-\d{4})?\b/)?.[0]?.slice(0, 5) || ''
}

function getHostname(value) {
  if (!value) {
    return ''
  }

  try {
    return new URL(value).hostname
  } catch {
    return ''
  }
}

function getCategory(event) {
  const eventText = `${event.title} ${event.description}`.toLowerCase()

  if (/\b(vaccine|vaccination|immunization|flu shot|covid)\b/.test(eventText)) {
    return 'Vaccination'
  }

  if (/\b(screening|screenings|blood pressure|cholesterol|glucose|a1c|test)\b/.test(eventText)) {
    return 'Screening'
  }

  if (/\b(fitness|walk|walking|run|yoga|exercise|workout|movement)\b/.test(eventText)) {
    return 'Fitness'
  }

  if (/\b(nutrition|food|diet|cooking|healthy eating|farmers market)\b/.test(eventText)) {
    return 'Nutrition'
  }

  if (/\b(mental health|mindfulness|stress|therapy|support group|wellbeing|wellness)\b/.test(eventText)) {
    return 'Mental Wellness'
  }

  if (/\b(community|health fair|clinic|public health|resources)\b/.test(eventText)) {
    return 'Community Health'
  }

  return 'Other'
}

function buildDirectionsLink(address, directionsLink) {
  if (directionsLink) {
    return directionsLink
  }

  if (!address) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function parseStartDate(event) {
  const dateText = normalizeText(`${event.startDate || ''} ${event.when || ''}`)
  const parsedDate = Date.parse(dateText)

  return Number.isNaN(parsedDate) ? null : parsedDate
}

function normalizeEvent(event, index) {
  const venue = event.venue || {}
  const address = normalizeAddress(event.address || venue.address)
  const eventLink = getFirstString(event.link, event.event_link, event.ticket_info?.[0]?.link)
  const rawDirectionsLink = getFirstString(
    event.directions_link,
    event.google_maps_link,
    venue.link,
  )
  const normalizedEvent = {
    id: getFirstString(event.event_id, event.id) || `serpapi-event-${index + 1}`,
    title: getFirstString(event.title, event.name),
    startDate: getFirstString(event.date?.start_date, event.start_date, event.startDate),
    when: getFirstString(event.date?.when, event.when, event.date),
    address,
    city: getFirstString(venue.city, event.city, getCityFromAddress(address)),
    description: getFirstString(event.description, event.snippet),
    eventLink,
    directionsLink: buildDirectionsLink(address, rawDirectionsLink),
    image: getFirstString(event.thumbnail, event.image),
    source: getFirstString(event.source, getHostname(eventLink)) || 'SerpApi',
    zipCode: getFirstString(event.zipCode, event.postal_code, getZipFromAddress(address)),
  }

  return {
    ...normalizedEvent,
    category: getCategory(normalizedEvent),
  }
}

async function fetchSearchResults(query, apiKey) {
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    engine: 'google_events',
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

  let data

  try {
    data = await response.json()
  } catch {
    throw new Error(`Invalid API response for "${query}": SerpApi did not return valid JSON.`)
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(
      `Invalid API response for "${query}": expected a JSON object from SerpApi.`,
    )
  }

  if (data.error) {
    if (
      typeof data.error === 'string' &&
      data.error.includes("Google hasn't returned any results for this query")
    ) {
      return []
    }

    throw new Error(`SerpApi error for "${query}": ${data.error}`)
  }

  if (!Object.hasOwn(data, 'events_results')) {
    return []
  }

  if (!Array.isArray(data.events_results)) {
    throw new Error(
      `Invalid API response for "${query}": events_results was present but was not an array.`,
    )
  }

  return data.events_results
}

function dedupeEvents(events) {
  const seenEvents = new Set()
  const uniqueEvents = []
  let duplicateCount = 0

  events.forEach((event) => {
    const duplicateKey = `${normalizeKey(event.title)}|${normalizeKey(event.address)}`

    if (seenEvents.has(duplicateKey)) {
      duplicateCount += 1
      return
    }

    seenEvents.add(duplicateKey)
    uniqueEvents.push(event)
  })

  return { duplicateCount, uniqueEvents }
}

function isAllowedLocation(event) {
  const locationText = normalizeKey(`${event.city} ${event.address}`)

  return [...allowedCities].some((city) => locationText.includes(city))
}

function sortEventsByDate(events) {
  return [...events].sort((firstEvent, secondEvent) => {
    const firstDate = parseStartDate(firstEvent)
    const secondDate = parseStartDate(secondEvent)

    if (firstDate && secondDate) {
      return firstDate - secondDate
    }

    if (firstDate) {
      return -1
    }

    if (secondDate) {
      return 1
    }

    return firstEvent.title.localeCompare(secondEvent.title)
  })
}

async function fetchEvents() {
  const apiKey = process.env.SERPAPI_API_KEY

  if (!apiKey) {
    throw new Error(
      'Missing API key: set SERPAPI_API_KEY in your environment before running npm run fetch-events.',
    )
  }

  const allEvents = []

  for (const [queryIndex, query] of searchQueries.entries()) {
    const results = await fetchSearchResults(query, apiKey)
    allEvents.push(...results)
    console.log(`Search ${queryIndex + 1}/${searchQueries.length}: "${query}" returned ${results.length} events.`)

    if (queryIndex < searchQueries.length - 1) {
      await delay(requestDelayMs)
    }
  }

  if (allEvents.length === 0) {
    throw new Error('No events returned: all SerpApi events_results arrays were empty.')
  }

  const normalizedEvents = allEvents.map(normalizeEvent)
  const { duplicateCount, uniqueEvents } = dedupeEvents(normalizedEvents)
  const locationFilteredEvents = uniqueEvents.filter(isAllowedLocation)
  const removedForLocation = uniqueEvents.length - locationFilteredEvents.length
  const finalEvents = sortEventsByDate(locationFilteredEvents).slice(0, maxSavedEvents)

  await mkdir(path.dirname(outputFile), { recursive: true })
  await writeFile(outputFile, `${JSON.stringify(finalEvents, null, 2)}\n`)

  return {
    duplicateCount,
    finalEvents,
    removedForLocation,
    searchesCompleted: searchQueries.length,
    totalEventsFound: allEvents.length,
  }
}

try {
  const summary = await fetchEvents()

  console.log('')
  console.log('Fetch summary')
  console.log(`- searches completed: ${summary.searchesCompleted}`)
  console.log(`- total events found: ${summary.totalEventsFound}`)
  console.log(`- duplicates removed: ${summary.duplicateCount}`)
  console.log(`- events removed for location: ${summary.removedForLocation}`)
  console.log(`- final events saved: ${summary.finalEvents.length}`)
  console.log(`Saved events to public/data/events.json.`)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
