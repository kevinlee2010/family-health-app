const NO_CONDITION_VALUES = ['none', 'no conditions', 'no illness', 'no illnesses']

const generationByRelationship = {
  Grandparent: 'grandparent',
  Mother: 'parent',
  Father: 'parent',
  Sibling: 'same generation',
}

const firstDegreeRelationships = ['Mother', 'Father', 'Sibling']

const sideByRelationship = {
  Mother: 'maternal',
  Father: 'paternal',
}

function normalizePatternCondition(value) {
  return value
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function isNoCondition(value) {
  return NO_CONDITION_VALUES.includes(normalizePatternCondition(value))
}

function getEntryIllnesses(entry) {
  return entry?.illnesses || entry?.conditions || []
}

function addConditionEntry(conditionMap, conditionName, member) {
  if (!conditionName || isNoCondition(conditionName)) {
    return
  }

  const conditionKey = normalizePatternCondition(conditionName)
  const existingCondition = conditionMap.get(conditionKey)
  const entry = {
    relationship: member.relationship,
    generation: generationByRelationship[member.relationship] || 'other',
    side: sideByRelationship[member.relationship] || null,
  }

  if (existingCondition) {
    existingCondition.entries.push(entry)
    return
  }

  conditionMap.set(conditionKey, {
    conditionName,
    entries: [entry],
  })
}

function summarizeCondition(condition) {
  const relatives = Array.from(
    new Set(condition.entries.map((entry) => entry.relationship)),
  )
  const generations = Array.from(
    new Set(condition.entries.map((entry) => entry.generation)),
  )
  const firstDegreeEntries = condition.entries.filter((entry) =>
    firstDegreeRelationships.includes(entry.relationship),
  )

  return {
    ...condition,
    count: condition.entries.length,
    firstDegreeCount: firstDegreeEntries.length,
    generations,
    relatives,
  }
}

function buildSideSummary(familyMembers, side) {
  const conditionMap = new Map()
  const sideRelationships =
    side === 'maternal' ? ['Mother'] : side === 'paternal' ? ['Father'] : []

  familyMembers
    .filter((member) => sideRelationships.includes(member.relationship))
    .forEach((member) => {
      getEntryIllnesses(member).forEach((conditionName) => {
        if (!conditionName || isNoCondition(conditionName)) {
          return
        }

        const conditionKey = normalizePatternCondition(conditionName)
        const existingCondition = conditionMap.get(conditionKey)

        if (existingCondition) {
          existingCondition.count += 1
          return
        }

        conditionMap.set(conditionKey, {
          conditionName,
          count: 1,
        })
      })
    })

  return Array.from(conditionMap.values()).sort(
    (firstCondition, secondCondition) => secondCondition.count - firstCondition.count,
  )
}

function createInsight(id, text, detail, conditionNames = []) {
  return {
    id,
    text,
    detail,
    conditionNames,
  }
}

export function buildFamilyHealthPatterns(familyMembers = []) {
  const conditionMap = new Map()

  familyMembers.forEach((member) => {
    getEntryIllnesses(member).forEach((conditionName) => {
      addConditionEntry(conditionMap, conditionName, member)
    })
  })

  const conditionSummaries = Array.from(conditionMap.values())
    .map(summarizeCondition)
    .sort((firstCondition, secondCondition) => {
      const countDifference = secondCondition.count - firstCondition.count

      if (countDifference !== 0) {
        return countDifference
      }

      return firstCondition.conditionName.localeCompare(secondCondition.conditionName)
    })

  const insights = []

  conditionSummaries.forEach((condition) => {
    if (condition.generations.length >= 2) {
      insights.push(
        createInsight(
          `${condition.conditionName}-generations`,
          `${condition.conditionName} appears across multiple generations.`,
          `This condition is listed by ${condition.relatives.join(
            ', ',
          )}. This is an awareness signal, not a diagnosis.`,
          [condition.conditionName],
        ),
      )
    }

    if (condition.firstDegreeCount >= 2) {
      insights.push(
        createInsight(
          `${condition.conditionName}-first-degree`,
          `${condition.conditionName} is present in multiple close relatives.`,
          'Close relatives include parents and siblings. Consider sharing this pattern with a healthcare professional.',
          [condition.conditionName],
        ),
      )
    }
  })

  const maternalConditions = buildSideSummary(familyMembers, 'maternal')
  const paternalConditions = buildSideSummary(familyMembers, 'paternal')

  if (maternalConditions.length >= 2) {
    insights.push(
      createInsight(
        'maternal-cluster',
        'Several conditions appear on the maternal side of the family.',
        `Maternal-side entries include ${maternalConditions
          .slice(0, 3)
          .map((condition) => condition.conditionName)
          .join(', ')}.`,
        maternalConditions.map((condition) => condition.conditionName),
      ),
    )
  }

  if (paternalConditions.length >= 2) {
    insights.push(
      createInsight(
        'paternal-cluster',
        'Several conditions appear on the paternal side of the family.',
        `Paternal-side entries include ${paternalConditions
          .slice(0, 3)
          .map((condition) => condition.conditionName)
          .join(', ')}.`,
        paternalConditions.map((condition) => condition.conditionName),
      ),
    )
  }

  const commonConditions = conditionSummaries
    .filter((condition) => condition.count >= 1)
    .slice(0, 3)

  if (commonConditions.length > 0) {
    insights.push(
      createInsight(
        'most-common-conditions',
        'Most common family conditions are ready to review.',
        `The most frequent entries are ${commonConditions
          .map((condition) => condition.conditionName)
          .join(', ')}.`,
        commonConditions.map((condition) => condition.conditionName),
      ),
    )
  }

  return {
    commonConditions,
    insights: insights.slice(0, 6),
  }
}
