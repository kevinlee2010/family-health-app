import assert from 'node:assert/strict'
import test from 'node:test'

import {
  fdaMammographyFacilitySource,
  getFdaZipPrefix,
  getMammographyFacilityResources,
} from '../src/mammographyFacilities.js'

test('FDA mammography lookup uses the first three ZIP digits', () => {
  assert.equal(getFdaZipPrefix('94127'), '941')
  assert.equal(getFdaZipPrefix('94704'), '947')
})

test('94127 returns San Francisco FDA mammography facilities', () => {
  const resources = getMammographyFacilityResources('94127')

  assert.equal(resources.length > 0, true)
  assert.equal(resources[0].source, fdaMammographyFacilitySource.name)
  assert.equal(resources.every((resource) => resource.resourceType === 'mammography_facility'), true)
  assert.equal(resources.every((resource) => resource.zipCode.startsWith('941')), true)
  assert.equal(resources.some((resource) => resource.city === 'San Francisco'), true)
  assert.equal(resources[0].isLocalCity, true)
})

test('94704 returns East Bay FDA mammography facilities', () => {
  const resources = getMammographyFacilityResources('94704')

  assert.equal(resources.length > 0, true)
  assert.equal(resources.every((resource) => resource.zipCode.startsWith('947')), true)
  assert.equal(resources.some((resource) => resource.city === 'Berkeley'), true)
  assert.equal(resources[0].isLocalCity, true)
})

test('FDA mammography resources include source attribution and facility actions', () => {
  const [resource] = getMammographyFacilityResources('94127')

  assert.equal(resource.isFdaMammographyFacility, true)
  assert.equal(resource.eventLink.includes('mqsa.cfm'), true)
  assert.equal(resource.description.includes('FDA ZIP-prefix search 941'), true)
  assert.equal(resource.description.includes('Listing does not mean FDA recommends'), true)
  assert.equal(resource.directionsUrl.includes('google.com/maps/search'), true)
})

