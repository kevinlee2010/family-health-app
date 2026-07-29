import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { getParksNearZip } from '../src/parkResources.js'
import {
  getEventResourceCategories,
  getStagedResourceSearch,
  getUserResourcePriorities,
  groupAssignedResourcesByPriorityAction,
  groupEventsByPriority,
  groupResourcesByPriorityAction,
  personalizeEventsForResources,
  scoreEventForPriority,
} from '../src/resourcePersonalization.js'

const localEvents = [
  {
    city: 'San Francisco',
    distanceMiles: 2,
    isLocalCity: true,
    startDate: '2026-08-04T10:00:00-07:00',
    title: 'Free Blood Pressure Screening',
  },
  {
    city: 'San Francisco',
    distanceMiles: 3,
    isLocalCity: true,
    startDate: '2026-08-04T10:00:00-07:00',
    title: 'Healthy Cooking for Diabetes Prevention',
  },
  {
    city: 'San Francisco',
    distanceMiles: 4,
    isLocalCity: true,
    startDate: '2026-08-04T10:00:00-07:00',
    title: 'Colorectal Cancer Screening Workshop',
  },
  {
    city: 'San Francisco',
    distanceMiles: 5,
    isLocalCity: true,
    startDate: '2026-08-04T10:00:00-07:00',
    title: 'Mindfulness for Stress',
  },
  {
    city: 'San Francisco',
    distanceMiles: 1,
    isLocalCity: true,
    startDate: '2026-08-04T10:00:00-07:00',
    title: 'Free Vaccine Clinic',
  },
]

const currentEvents = JSON.parse(
  readFileSync(new URL('../public/data/events.json', import.meta.url), 'utf8'),
)

function getPriorities(familyMembers, topPriorities = []) {
  return getUserResourcePriorities({
    familyHealthSummary: { categories: [] },
    familyMembers,
    preventionScore: { topPriorities },
  })
}

test('assigns categories from event title and description text', () => {
  assert.deepEqual(
    getEventResourceCategories({
      description: 'Learn about glucose screening and healthy eating.',
      title: 'Diabetes Prevention Workshop',
    }),
    ['diabetes'],
  )

  assert.ok(
    getEventResourceCategories({
      description: 'Free immunization clinic for routine preventive care.',
      title: 'Community Vaccine Clinic',
    }).includes('general-prevention'),
  )
})

test('cardiovascular risk shows heart-related events and not unrelated cancer events', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
  ])
  const personalizedEvents = personalizeEventsForResources(localEvents, priorities)

  assert.equal(
    personalizedEvents.some((event) => event.title === 'Free Blood Pressure Screening'),
    true,
  )
  assert.equal(
    personalizedEvents.some(
      (event) => event.title === 'Colorectal Cancer Screening Workshop',
    ),
    false,
  )
})

test('eight possible signals are reduced to a maximum of three priorities', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol', 'High blood pressure'], relationship: 'Father' },
    { illnesses: ['Stroke'], relationship: 'Mother' },
    { illnesses: ['Type 2 diabetes'], relationship: 'Sibling' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
    { illnesses: ['Breast cancer'], relationship: 'Grandparent' },
    { illnesses: ['Depression'], relationship: 'Grandparent' },
  ])

  assert.equal(priorities.length, 3)
})

test('related cardiovascular categories are consolidated into one priority', () => {
  const priorities = getPriorities([
    { illnesses: ['Heart disease'], relationship: 'Father' },
    { illnesses: ['High cholesterol'], relationship: 'Mother' },
    { illnesses: ['High blood pressure'], relationship: 'Sibling' },
    { illnesses: ['Stroke'], relationship: 'Grandparent' },
  ])

  assert.equal(priorities.length, 1)
  assert.equal(priorities[0].id, 'cardiovascular')
  assert.deepEqual(priorities[0].conditions, [
    'Heart disease',
    'High cholesterol',
    'High blood pressure',
    'Stroke',
  ])
})

test('recommendations and events only use the top three priorities', () => {
  const priorities = getPriorities([
    { illnesses: ['Heart disease'], relationship: 'Father' },
    { illnesses: ['High cholesterol'], relationship: 'Mother' },
    { illnesses: ['Type 2 diabetes'], relationship: 'Sibling' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
    { illnesses: ['Breast cancer'], relationship: 'Grandparent' },
    { illnesses: ['Depression'], relationship: 'Grandparent' },
  ])
  const personalizedEvents = personalizeEventsForResources(localEvents, priorities)
  const priorityIds = new Set(priorities.map((priority) => priority.id))

  assert.equal(priorities.length, 3)
  assert.equal(
    personalizedEvents.every((event) =>
      event.recommendationCategories.some((category) => priorityIds.has(category)),
    ),
    true,
  )
})

test('event scoring uses top-three priority keywords from title, description, tags, and organizer', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
  ])
  const score = scoreEventForPriority(
    {
      description: 'A community class about cholesterol and exercise.',
      organizer: 'Heart Health Coalition',
      tags: ['blood pressure'],
      title: 'Free Blood Pressure Screening',
    },
    priorities[0],
  )

  assert.ok(score.score >= 10)
  assert.ok(score.keywords.includes('blood pressure'))
  assert.ok(score.keywords.includes('cholesterol'))
  assert.ok(score.keywords.includes('exercise'))
  assert.ok(score.keywords.includes('heart health'))
})

test('recommended events are grouped under each top health priority', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Type 2 diabetes'], relationship: 'Mother' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
  ])
  const groups = groupEventsByPriority(localEvents, priorities)

  assert.deepEqual(
    groups.map((group) => group.priority.id),
    ['cardiovascular', 'diabetes', 'colon-cancer'],
  )
  assert.deepEqual(
    groups.map((group) => group.events.map((event) => event.title)),
    [
      ['Free Blood Pressure Screening'],
      ['Healthy Cooking for Diabetes Prevention'],
      ['Colorectal Cancer Screening Workshop'],
    ],
  )
})

test('unrelated events are not shown under a priority group', () => {
  const priorities = getPriorities([
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
  ])
  const groups = groupEventsByPriority(localEvents, priorities)

  assert.equal(groups[0].events.some((event) => /diabetes/i.test(event.title)), false)
  assert.equal(groups[0].events.some((event) => /blood pressure/i.test(event.title)), false)
})

test('events matching multiple top priorities are assigned to the highest-scoring section once', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Type 2 diabetes'], relationship: 'Mother' },
  ])
  const groups = groupEventsByPriority(
    [
      {
        title: 'Fitness and Exercise for Diabetes and Cholesterol',
      },
    ],
    priorities,
  )

  assert.equal(groups[0].events.length, 1)
  assert.equal(groups[1].events.length, 0)
  assert.equal(
    groups.flatMap((group) => group.events).filter(
      (event) => event.title === 'Fitness and Exercise for Diabetes and Cholesterol',
    ).length,
    1,
  )
})

test('diabetes risk shows diabetes and nutrition events without unrelated general events', () => {
  const priorities = getPriorities([
    { illnesses: ['Type 2 diabetes'], relationship: 'Mother' },
  ])
  const personalizedEvents = personalizeEventsForResources(localEvents, priorities)

  assert.equal(
    personalizedEvents.some(
      (event) => event.title === 'Healthy Cooking for Diabetes Prevention',
    ),
    true,
  )
  assert.equal(
    personalizedEvents.some((event) => event.title === 'Free Vaccine Clinic'),
    false,
  )
})

test('fewer than three meaningful categories are allowed', () => {
  const priorities = getPriorities([
    { illnesses: ['Type 2 diabetes'], relationship: 'Mother' },
  ])

  assert.equal(priorities.length, 1)
  assert.equal(priorities[0].id, 'diabetes')
})

test('ties are resolved by affected count, close relationship, and earlier diagnosis age', () => {
  const priorities = getPriorities([
    {
      diagnosisAge: '72',
      illnesses: ['Breast cancer'],
      relationship: 'Grandparent',
    },
    {
      diagnosisAge: '58',
      illnesses: ['Colon cancer'],
      relationship: 'Mother',
    },
    {
      diagnosisAge: '45',
      illnesses: ['Depression'],
      relationship: 'Grandparent',
    },
  ])

  assert.equal(priorities[0].id, 'colon-cancer')
  assert.equal(priorities[1].id, 'mental-wellness')
  assert.equal(priorities[2].id, 'breast-cancer')
})

test('colon-cancer risk shows colorectal resources', () => {
  const priorities = getPriorities([
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
  ])
  const personalizedEvents = personalizeEventsForResources(localEvents, priorities)

  assert.equal(
    personalizedEvents.some(
      (event) => event.title === 'Colorectal Cancer Screening Workshop',
    ),
    true,
  )
  assert.equal(
    personalizedEvents[0].recommendationLabel.includes('colon-cancer'),
    true,
  )
})

test('no elevated family risk still allows general preventive events', () => {
  const priorities = getPriorities([
    { illnesses: ['No known conditions.'], relationship: 'Mother' },
  ])
  const personalizedEvents = personalizeEventsForResources(localEvents, priorities)

  assert.deepEqual(
    personalizedEvents.map((event) => event.title),
    ['Free Vaccine Clinic'],
  )
})

test('online events appear only when they match a detected category or prevention resource', () => {
  const priorities = getPriorities([
    { illnesses: ['Depression'], relationship: 'Sibling' },
  ])
  const personalizedEvents = personalizeEventsForResources(
    [
      {
        attendanceMode: 'online',
        isOnlineEvent: true,
        title: 'Online Mindfulness Support Group',
      },
      {
        attendanceMode: 'online',
        isOnlineEvent: true,
        title: 'Online Colorectal Cancer Seminar',
      },
    ],
    priorities,
  )

  assert.deepEqual(
    personalizedEvents.map((event) => event.title),
    ['Online Mindfulness Support Group'],
  )
})

test('parks are limited to the selected ZIP city and ranked by distance', () => {
  const parks = getParksNearZip('94702')

  assert.ok(parks.length > 0)
  assert.equal(parks.every((park) => park.city === 'Berkeley'), true)
  assert.equal(parks.every((park) => park.distanceMiles !== null), true)
  assert.ok(parks[0].distanceMiles <= parks.at(-1).distanceMiles)
})

test('action-level recommendations match parks to physical activity actions', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
  ])
  const parks = getParksNearZip('94132')
  const groups = groupResourcesByPriorityAction(localEvents, priorities, {
    parks,
  })
  const cardiovascularGroup = groups[0]
  const activityAction = cardiovascularGroup.actions.find(
    (actionGroup) => actionGroup.action === 'Stay physically active',
  )

  assert.ok(activityAction)
  assert.equal(activityAction.resources.length <= 2, true)
  assert.equal(
    activityAction.resources.some((resource) => resource.resourceType === 'park'),
    true,
  )
})

test('action-level recommendations do not duplicate one resource under multiple actions', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
  ])
  const groups = groupResourcesByPriorityAction(
    [
      {
        city: 'San Francisco',
        description: 'A community health fair with blood pressure screening and nutrition education.',
        id: 'wellness-fair',
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Community Health Fair',
      },
    ],
    priorities,
  )
  const resources = groups.flatMap((group) =>
    group.actions.flatMap((actionGroup) => actionGroup.resources),
  )

  assert.equal(resources.length, 1)
  assert.equal(resources[0].title, 'Community Health Fair')
})

test('current databases produce action-level resources from events and parks', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
  ])
  const groups = groupResourcesByPriorityAction(currentEvents, priorities, {
    now: new Date('2026-07-29T00:00:00-07:00'),
    parks: getParksNearZip('94702'),
  })
  const resources = groups.flatMap((group) =>
    group.actions.flatMap((actionGroup) => actionGroup.resources),
  )

  assert.ok(resources.length > 0)
  assert.equal(
    groups.every((group) =>
      group.actions.every((actionGroup) => actionGroup.resources.length <= 2),
    ),
    true,
  )
  assert.equal(
    resources.some((resource) => resource.resourceType === 'park'),
    true,
  )
})

test('current events database can be matched without duplicating events across priorities', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
    { illnesses: ['Breast cancer'], relationship: 'Mother' },
  ])
  const groups = groupEventsByPriority(currentEvents, priorities, {
    now: new Date('2026-07-29T00:00:00-07:00'),
  })
  const matchedEvents = groups.flatMap((group) => group.events)
  const uniqueEventIds = new Set(
    matchedEvents.map((event) => event.id || event.eventLink || event.title),
  )

  assert.ok(currentEvents.length > 0)
  assert.equal(matchedEvents.length, uniqueEventIds.size)
  assert.equal(groups.every((group) => group.events.length <= 3), true)
})

test('current events database matches broad prevention terms and rejects unrelated specialties', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
    { illnesses: ['Breast cancer'], relationship: 'Mother' },
  ])
  const cardiovascularPriority = priorities.find(
    (priority) => priority.id === 'cardiovascular',
  )
  const cookingEvent = currentEvents.find((event) =>
    /free cooking class series/i.test(event.title),
  )
  const babyStorytime = currentEvents.find((event) =>
    /baby storytime/i.test(event.title),
  )

  assert.ok(cardiovascularPriority)

  if (cookingEvent) {
    const score = scoreEventForPriority(cookingEvent, cardiovascularPriority)

    assert.ok(score)
    assert.ok(score.score >= 2)
  }

  if (babyStorytime) {
    assert.equal(scoreEventForPriority(babyStorytime, cardiovascularPriority), null)
  }
})

test('staged resource search chooses exact ZIP matches before broader fallbacks', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
  ])
  const search = getStagedResourceSearch({
    events: [
      {
        address: 'Lake Merced Blvd, San Francisco, CA 94132',
        city: 'San Francisco',
        id: 'walk-94132',
        latitude: 37.7281,
        longitude: -122.4934,
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Walking Group for Heart Health',
      },
      {
        address: '501 Stanyan St, San Francisco, CA 94117',
        city: 'San Francisco',
        id: 'walk-94117',
        latitude: 37.7694,
        longitude: -122.4862,
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Community Exercise Class',
      },
    ],
    priorities,
    zipCode: '94132',
    now: new Date('2026-07-29T00:00:00-07:00'),
  })

  assert.equal(search.zipCode, '94132')
  assert.equal(search.city, 'San Francisco')
  assert.equal(search.selectedStage, 'exact')
  assert.deepEqual(
    search.resources.map((resource) => resource.id),
    ['walk-94132'],
  )
})

test('staged resource search falls back to same-city resources before nearby cities', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
  ])
  const search = getStagedResourceSearch({
    events: [
      {
        address: '501 Stanyan St, San Francisco, CA 94117',
        city: 'San Francisco',
        id: 'sf-screening',
        latitude: 37.7694,
        longitude: -122.4862,
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Free Blood Pressure Screening',
      },
      {
        address: '1900 Sixth St, Berkeley, CA 94710',
        city: 'Berkeley',
        id: 'berkeley-screening',
        latitude: 37.8697,
        longitude: -122.2988,
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Heart Health Screening',
      },
    ],
    priorities,
    zipCode: '94132',
    now: new Date('2026-07-29T00:00:00-07:00'),
  })

  assert.equal(search.selectedStage, 'same-city')
  assert.deepEqual(
    search.resources.map((resource) => resource.id),
    ['sf-screening'],
  )
})

test('staged resource search uses online priority resources only as fallback', () => {
  const priorities = getPriorities([
    { illnesses: ['Depression'], relationship: 'Sibling' },
  ])
  const search = getStagedResourceSearch({
    events: [
      {
        attendanceMode: 'online',
        id: 'online-mindfulness',
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Online Mindfulness Support Group',
      },
      {
        attendanceMode: 'online',
        id: 'online-cancer',
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Online Breast Cancer Seminar',
      },
    ],
    priorities,
    zipCode: '94132',
    now: new Date('2026-07-29T00:00:00-07:00'),
  })

  assert.equal(search.selectedStage, 'fallback')
  assert.deepEqual(
    search.resources.map((resource) => resource.id),
    ['online-mindfulness'],
  )
  assert.equal(search.resources[0].distanceMiles, null)
})

test('assigned staged resources group under prevention actions without duplicates', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
  ])
  const search = getStagedResourceSearch({
    events: [
      {
        address: '501 Stanyan St, San Francisco, CA 94117',
        city: 'San Francisco',
        description: 'Community health fair with blood pressure screening and nutrition education.',
        id: 'health-fair',
        latitude: 37.7694,
        longitude: -122.4862,
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Community Health Fair',
      },
    ],
    priorities,
    zipCode: '94132',
    now: new Date('2026-07-29T00:00:00-07:00'),
  })
  const groups = groupAssignedResourcesByPriorityAction(search.resources, priorities)
  const resources = groups.flatMap((group) =>
    group.actions.flatMap((actionGroup) => actionGroup.resources),
  )

  assert.equal(resources.length, 1)
  assert.equal(resources[0].id, 'health-fair')
})

test('fallback sections appear when exact ZIP resources are missing', () => {
  const priorities = getPriorities([
    { illnesses: ['High cholesterol'], relationship: 'Father' },
    { illnesses: ['Type 2 diabetes'], relationship: 'Mother' },
  ])
  const search = getStagedResourceSearch({
    events: [
      {
        address: '501 Stanyan St, San Francisco, CA 94117',
        city: 'San Francisco',
        id: 'sf-health-fair',
        latitude: 37.7694,
        longitude: -122.4862,
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Community Health Fair with Blood Pressure Screening',
      },
      {
        attendanceMode: 'online',
        id: 'online-diabetes',
        startDate: '2026-08-04T10:00:00-07:00',
        title: 'Online Diabetes Prevention Workshop',
      },
    ],
    parks: getParksNearZip('94102'),
    priorities,
    zipCode: '94102',
    now: new Date('2026-07-29T00:00:00-07:00'),
  })

  assert.equal(search.counts.exact, 0)
  assert.deepEqual(
    search.fallbackSections.map((section) => section.id),
    [
      'nearby-community-events',
      'online-resources',
      'trusted-health-organizations',
      'general-preventive-resources',
    ],
  )
  assert.equal(
    search.fallbackSections.some((section) =>
      section.resources.some((resource) => resource.title === 'American Heart Association'),
    ),
    true,
  )
  assert.equal(
    search.fallbackSections.some((section) =>
      section.resources.some((resource) => resource.title === 'American Diabetes Association'),
    ),
    true,
  )
  assert.equal(
    search.fallbackSections.some((section) =>
      section.resources.some((resource) => resource.title === 'National Cancer Institute'),
    ),
    false,
  )
})

test('trusted fallback organizations follow cancer priorities only when relevant', () => {
  const priorities = getPriorities([
    { illnesses: ['Colon cancer'], relationship: 'Grandparent' },
  ])
  const search = getStagedResourceSearch({
    events: [],
    priorities,
    zipCode: '94132',
    now: new Date('2026-07-29T00:00:00-07:00'),
  })
  const organizations = search.fallbackSections
    .find((section) => section.id === 'trusted-health-organizations')
    .resources.map((resource) => resource.title)

  assert.ok(organizations.includes('American Cancer Society'))
  assert.ok(organizations.includes('National Cancer Institute'))
  assert.equal(organizations.includes('American Diabetes Association'), false)
})
