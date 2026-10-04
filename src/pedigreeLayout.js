export function getPedigreeLayoutMetrics(generationCounts = []) {
  const largestGeneration = Math.max(1, ...generationCounts.map(Number))
  const nodeWidth =
    largestGeneration <= 4
      ? 168
      : largestGeneration <= 6
        ? 148
        : largestGeneration <= 9
          ? 126
          : 108
  const gap = largestGeneration <= 4 ? 16 : largestGeneration <= 7 ? 12 : 8
  const horizontalPadding = largestGeneration <= 6 ? 72 : 48
  const requiredWidth = Math.max(
    720,
    largestGeneration * nodeWidth + (largestGeneration - 1) * gap + horizontalPadding,
  )

  return {
    gap,
    largestGeneration,
    nodeWidth,
    requiredWidth,
  }
}

export function getBalancedParentGenerationCount(
  maternalRelativeCount = 0,
  paternalRelativeCount = 0,
) {
  return Math.max(
    2,
    Math.max(
      Number(maternalRelativeCount) || 0,
      Number(paternalRelativeCount) || 0,
    ) * 2 + 2,
  )
}

function addSegment(segments, x1, y1, x2, y2) {
  if ([x1, y1, x2, y2].every(Number.isFinite)) {
    segments.push({ x1, x2, y1, y2 })
  }
}

function addFamilyConnectors(segments, nodes, parentIds, childIds) {
  const parents = parentIds.map((id) => nodes[id]).filter(Boolean)
  const children = childIds.map((id) => nodes[id]).filter(Boolean)

  if (parents.length === 0 || children.length === 0) {
    return
  }

  if (parents.length > 1) {
    addSegment(
      segments,
      parents[0].right,
      parents[0].centerY,
      parents[1].left,
      parents[1].centerY,
    )
  }

  const parentCenterX =
    parents.reduce((total, parent) => total + parent.centerX, 0) / parents.length
  const parentBottom = Math.max(...parents.map((parent) => parent.bottom))
  const childTop = Math.min(...children.map((child) => child.top))
  const branchY = childTop - Math.max(14, Math.min(28, (childTop - parentBottom) / 2))
  const firstChildX = children[0].centerX
  const lastChildX = children.at(-1).centerX

  addSegment(segments, parentCenterX, parentBottom, parentCenterX, branchY)

  if (children.length > 1) {
    addSegment(segments, firstChildX, branchY, lastChildX, branchY)
  }

  children.forEach((child) => {
    addSegment(segments, child.centerX, branchY, child.centerX, child.top)
  })
}

export function buildPedigreeConnectorSegments({ families = [], nodes = {} } = {}) {
  const segments = []

  families.forEach((family) => {
    addFamilyConnectors(
      segments,
      nodes,
      family.parentIds || [],
      family.childIds || [],
    )
  })

  return segments
}
