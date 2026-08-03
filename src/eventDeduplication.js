const datePattern =
  /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s.]+\d{1,2}(?:,?\s*\d{4})?\b|\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b/gi

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-f\d]+);/gi, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .replace(/&amp;/gi, '&')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&ndash;|&mdash;/gi, '-')
}

export function normalizeEventTitle(title) {
  return decodeHtmlEntities(title)
    .toLowerCase()
    .replace(datePattern, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getEventDateValue(event) {
  return event?.startsAt || event?.startDate || event?.date || event?.eventDateText || ''
}

function getEventTimestamp(event) {
  const date = new Date(getEventDateValue(event))

  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function getEventEndTimestamp(event) {
  const timestamp = getEventTimestamp(event)

  if (timestamp === null) {
    return null
  }

  const rawDate = String(getEventDateValue(event))
  const parsedDate = new Date(timestamp)
  const appearsDateOnly =
    !rawDate.includes('T') ||
    (parsedDate.getHours() === 0 && parsedDate.getMinutes() === 0)

  if (!appearsDateOnly) {
    return timestamp
  }

  const endOfDay = new Date(parsedDate)
  endOfDay.setHours(23, 59, 59, 999)

  return endOfDay.getTime()
}

function getEventIdentity(event) {
  const titleKey = normalizeEventTitle(event?.title)
  const attendanceMode = String(event?.attendanceMode || '').toLowerCase().trim()

  return attendanceMode ? `${titleKey}::${attendanceMode}` : titleKey
}

export function getNextOccurrencePerEvent(events, now = new Date()) {
  const nowTimestamp = now.getTime()
  const grouped = new Map()

  for (const event of events) {
    const key = getEventIdentity(event)

    if (!key) {
      continue
    }

    const eventTimestamp = getEventTimestamp(event)
    const eventEndTimestamp = getEventEndTimestamp(event)

    if (eventEndTimestamp !== null && eventEndTimestamp < nowTimestamp) {
      continue
    }

    const existing = grouped.get(key)
    const existingTimestamp = existing ? getEventTimestamp(existing) : null

    if (
      !existing ||
      (eventTimestamp !== null &&
        (existingTimestamp === null || eventTimestamp < existingTimestamp))
    ) {
      grouped.set(key, event)
    }
  }

  return [...grouped.values()].sort((firstEvent, secondEvent) => {
    const firstTimestamp = getEventTimestamp(firstEvent) ?? Number.MAX_SAFE_INTEGER
    const secondTimestamp = getEventTimestamp(secondEvent) ?? Number.MAX_SAFE_INTEGER

    return firstTimestamp - secondTimestamp
  })
}
