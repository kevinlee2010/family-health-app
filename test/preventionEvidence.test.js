import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRecommendationEvidence,
  getEvidenceIdForAction,
  getPreventionEvidenceById,
  preventionEvidenceRecords,
} from '../src/data/preventionEvidence.js'
import { getConditionDetails } from '../src/conditionDetails.js'
import {
  getPublicDataContext,
  getPublicDataResources,
  getPublicHealthDatasetById,
  publicHealthDatasetRecords,
} from '../src/data/publicHealthDatasets.js'

test('evidence ID resolves to a vetted evidence record', () => {
  const evidence = getPreventionEvidenceById('cdc-physical-activity')

  assert.equal(evidence.sourceOrganization, 'CDC')
  assert.equal(evidence.sourceTitle, 'Adult Activity: An Overview')
  assert.equal(evidence.sourceUrl.startsWith('https://www.cdc.gov/'), true)
})

test('recommendation evidence separates general evidence from personalization', () => {
  const details = buildRecommendationEvidence({
    evidenceId: 'cdc-physical-activity',
    label: 'Take a 20-minute walk.',
    personalizationReasons: [
      'Physical activity is relevant to one of your current prevention priorities.',
    ],
  })

  assert.equal(
    details.whyThisMatters,
    'Regular physical activity supports physical and mental health, and adults can spread activity across the week in manageable amounts.',
  )
  assert.equal(
    details.whyInPlan,
    'Physical activity is relevant to one of your current prevention priorities.',
  )
  assert.notEqual(details.whyThisMatters, details.whyInPlan)
})

test('common prevention actions resolve to source-backed evidence IDs', () => {
  assert.equal(
    getEvidenceIdForAction({ label: 'Know your blood pressure.' }),
    'cdc-blood-pressure',
  )
  assert.equal(
    getEvidenceIdForAction({
      label: 'Understand when breast screening may become relevant to you.',
    }),
    'uspstf-breast-screening',
  )
  assert.equal(
    getEvidenceIdForAction({
      label: "Check today's local air quality before outdoor exercise.",
    }),
    'airnow-aqi',
  )
})

test('evidence records do not use placeholder or fabricated URLs', () => {
  preventionEvidenceRecords.forEach((record) => {
    assert.match(record.sourceUrl, /^https:\/\/(www\.)?/)
    assert.equal(record.sourceUrl.includes('example.'), false)
    assert.equal(record.sourceTitle.trim().length > 0, true)
    assert.equal(record.summary.trim().length > 0, true)
  })
})

test('public health dataset records point to official or known calculator sources', () => {
  const datasetIds = publicHealthDatasetRecords.map((record) => record.id)

  assert.ok(datasetIds.includes('cdc-family-health-history'))
  assert.ok(datasetIds.includes('medlineplus-genetics'))
  assert.ok(datasetIds.includes('clinvar'))
  assert.ok(datasetIds.includes('nci-bcrat'))
  assert.ok(datasetIds.includes('canrisk'))
  assert.ok(datasetIds.includes('qcancer-colorectal'))

  publicHealthDatasetRecords.forEach((record) => {
    assert.match(record.url, /^https:\/\//)
    assert.equal(record.description.includes('exact percent'), false)
  })
})

test('condition details include public data context and source links', () => {
  const details = getConditionDetails('Breast cancer')

  assert.ok(details.publicDataContext.inheritanceSummary.includes('family history'))
  assert.ok(
    details.resources.some((resource) =>
      resource.url.startsWith('https://bcrisktool.cancer.gov/'),
    ),
  )
  assert.ok(
    details.resources.some((resource) =>
      resource.url.startsWith('https://www.canrisk.org/'),
    ),
  )
})

test('public data context avoids unsupported likelihood percentages', () => {
  const context = getPublicDataContext('Diabetes')

  assert.ok(context.likelihoodGuidance.includes('one universal percent likelihood'))
  assert.equal(/\b\d+(\.\d+)?%/.test(context.likelihoodGuidance), false)
})

test('ClinVar is available as education metadata for genetic context', () => {
  const clinvar = getPublicHealthDatasetById('clinvar')
  const colonResources = getPublicDataResources('Colon cancer')

  assert.equal(clinvar.organization, 'NCBI / NIH')
  assert.ok(colonResources.some((resource) => resource.label === 'ClinVar'))
})
