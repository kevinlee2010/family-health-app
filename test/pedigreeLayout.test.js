import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildPedigreeConnectorSegments,
  getBalancedParentGenerationCount,
  getPedigreeLayoutMetrics,
} from '../src/pedigreeLayout.js'

test('pedigree node sizing becomes progressively more compact for larger families', () => {
  assert.deepEqual(getPedigreeLayoutMetrics([4, 2, 1, 0]).nodeWidth, 168)
  assert.deepEqual(getPedigreeLayoutMetrics([4, 6, 5, 2]).nodeWidth, 148)
  assert.deepEqual(getPedigreeLayoutMetrics([4, 9, 7, 3]).nodeWidth, 126)
  assert.deepEqual(getPedigreeLayoutMetrics([4, 11, 9, 4]).nodeWidth, 108)
})

test('large family width is derived from its largest horizontal generation', () => {
  const metrics = getPedigreeLayoutMetrics([4, 11, 5, 3])

  assert.equal(metrics.largestGeneration, 11)
  assert.equal(metrics.requiredWidth, 1316)
})

test('parent generation reserves matching space on both sides of the centered parents', () => {
  assert.equal(getBalancedParentGenerationCount(0, 0), 2)
  assert.equal(getBalancedParentGenerationCount(4, 1), 10)
  assert.equal(getBalancedParentGenerationCount(2, 6), 14)
})

test('connectors use measured node bounds for parent, sibling, and child lines', () => {
  const nodes = {
    mother: { bottom: 210, centerX: 340, centerY: 160, left: 290, right: 390, top: 110 },
    father: { bottom: 210, centerX: 460, centerY: 160, left: 410, right: 510, top: 110 },
    sister: { bottom: 390, centerX: 330, centerY: 340, left: 280, right: 380, top: 290 },
    self: { bottom: 390, centerX: 450, centerY: 340, left: 400, right: 500, top: 290 },
  }
  const segments = buildPedigreeConnectorSegments({
    families: [
      {
        childIds: ['sister', 'self'],
        parentIds: ['mother', 'father'],
      },
    ],
    nodes,
  })

  assert.ok(
    segments.some(
      (segment) =>
        segment.x1 === nodes.mother.right && segment.x2 === nodes.father.left,
    ),
  )
  assert.ok(
    segments.some(
      (segment) =>
        segment.x1 === nodes.sister.centerX && segment.x2 === nodes.self.centerX,
    ),
  )
})

test('single-child connector omits an unnecessary horizontal sibling segment', () => {
  const segments = buildPedigreeConnectorSegments({
    families: [
      {
        childIds: ['self'],
        parentIds: ['mother', 'father'],
      },
    ],
    nodes: {
      mother: { bottom: 180, centerX: 300, centerY: 130, left: 250, right: 350, top: 80 },
      father: { bottom: 180, centerX: 420, centerY: 130, left: 370, right: 470, top: 80 },
      self: { bottom: 360, centerX: 360, centerY: 310, left: 310, right: 410, top: 260 },
    },
  })

  assert.equal(segments.length, 3)
})
