export const relativeTypeDefinitions = {
  self: { displayName: 'You', relationship: 'Self' },
  mother: { displayName: 'Mother', relationship: 'Mother' },
  father: { displayName: 'Father', relationship: 'Father' },
  'maternal-grandmother': {
    displayName: 'Maternal Grandmother',
    relationship: 'Grandparent',
  },
  'maternal-grandfather': {
    displayName: 'Maternal Grandfather',
    relationship: 'Grandparent',
  },
  'paternal-grandmother': {
    displayName: 'Paternal Grandmother',
    relationship: 'Grandparent',
  },
  'paternal-grandfather': {
    displayName: 'Paternal Grandfather',
    relationship: 'Grandparent',
  },
  brother: { displayName: 'Brother', relationship: 'Sibling' },
  sister: { displayName: 'Sister', relationship: 'Sibling' },
  son: { displayName: 'Son', relationship: 'Child' },
  daughter: { displayName: 'Daughter', relationship: 'Child' },
  'maternal-aunt': { displayName: 'Maternal Aunt', relationship: 'Aunt/Uncle' },
  'maternal-uncle': { displayName: 'Maternal Uncle', relationship: 'Aunt/Uncle' },
  'paternal-aunt': { displayName: 'Paternal Aunt', relationship: 'Aunt/Uncle' },
  'paternal-uncle': { displayName: 'Paternal Uncle', relationship: 'Aunt/Uncle' },
  legacy: { displayName: 'Relative', relationship: 'Relative' },
}

export function getRelationshipLimitGroup(relationship) {
  if (relationship === 'Mother' || relationship === 'Father') {
    return 'parent'
  }

  if (relationship === 'Grandparent') {
    return 'grandparent'
  }

  if (relationship === 'Child') {
    return 'child'
  }

  return null
}

export function getRelationshipLimit(group) {
  if (group === 'parent') {
    return 2
  }

  if (group === 'grandparent') {
    return 4
  }

  if (group === 'child') {
    return Infinity
  }

  return Infinity
}

export function isRelationshipLimitReachedForSave({
  editingFamilyMemberId = '',
  familyMembers = [],
  relationship = '',
}) {
  if (editingFamilyMemberId) {
    return false
  }

  const group = getRelationshipLimitGroup(relationship)

  if (!group) {
    return false
  }

  const relationshipCount = familyMembers.filter(
    (member) => getRelationshipLimitGroup(member.relationship) === group,
  ).length

  return relationshipCount >= getRelationshipLimit(group)
}

function asCleanString(value) {
  return String(value || '').trim()
}

export function sanitizeFamilyStructureCounts({
  defaultFamilyStructure = {},
  familyStructureFields = [],
  value = {},
}) {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {}

  return familyStructureFields.reduce((structure, field) => {
    const rawValue =
      typeof source[field.id] === 'string' || typeof source[field.id] === 'number'
        ? String(source[field.id]).trim()
        : ''
    const numericValue = Number(rawValue)

    if (rawValue === '') {
      return {
        ...structure,
        [field.id]: '',
      }
    }

    return {
      ...structure,
      [field.id]:
        Number.isInteger(numericValue) && numericValue >= 0 && numericValue <= 20
          ? String(numericValue)
          : '',
    }
  }, { ...defaultFamilyStructure })
}

export function isFamilyStructureComplete({
  familyStructureFields = [],
  value = {},
} = {}) {
  return familyStructureFields.every((field) => {
    const rawValue = String(value?.[field.id] ?? '').trim()

    if (rawValue === '') {
      return true
    }

    const numericValue = Number(rawValue)

    return (
      Number.isInteger(numericValue) &&
      numericValue >= 0 &&
      numericValue <= 20
    )
  })
}

export function getNextFamilyStructureForInput({
  currentStructure = {},
  familyStructureFields = [],
  fieldId = '',
  rawValue = '',
}) {
  if (rawValue !== '' && !/^\d+$/.test(rawValue)) {
    return currentStructure
  }

  const field = familyStructureFields.find(
    (structureField) => structureField.id === fieldId,
  )

  if (!field) {
    return currentStructure
  }

  const count = rawValue === '' ? null : Number(rawValue)

  if (count !== null && (!Number.isInteger(count) || count < 0 || count > 20)) {
    return currentStructure
  }

  return {
    ...currentStructure,
    [fieldId]: rawValue === '' ? '' : String(count),
  }
}

export function formatRelationshipLabel(relative = {}) {
  const relationshipType = asCleanString(relative.relationshipType)
  const relationship = asCleanString(relative.relationship)
  const slotIndex = Number(relative.slotIndex)

  if (relationshipType && relationshipType !== 'legacy') {
    const baseLabel =
      relativeTypeDefinitions[relationshipType]?.displayName || 'Relative'

    return Number.isInteger(slotIndex) && slotIndex > 0
      ? `${baseLabel} ${slotIndex}`
      : baseLabel
  }

  if (relative.isSelf || relationship === 'Self') {
    return 'You'
  }

  return relationship || 'Relative'
}

export function getRelativePrimaryName(relative = {}) {
  const name = asCleanString(relative.name)

  return name || formatRelationshipLabel(relative)
}

export function getStableStructuredRelativeId({
  existingId = '',
  relationshipType = '',
  slotIndex = null,
}) {
  const normalizedExistingId = String(existingId || '').trim()

  if (normalizedExistingId) {
    return normalizedExistingId
  }

  if (!relationshipType || relationshipType === 'legacy') {
    return ''
  }

  const normalizedSlotIndex = Number(slotIndex)

  if (Number.isInteger(normalizedSlotIndex) && normalizedSlotIndex > 0) {
    return `${relationshipType}-${normalizedSlotIndex}`
  }

  return relationshipType
}

export function isPlaceholderRelativeId(relativeId = '') {
  return asCleanString(relativeId).endsWith('-placeholder')
}

export function getSlotIndexFromRelativeId(relativeId = '', relationshipType = '') {
  const normalizedRelativeId = String(relativeId || '').trim()
  const normalizedRelationshipType = String(relationshipType || '').trim()

  if (!normalizedRelativeId || !normalizedRelationshipType) {
    return null
  }

  const prefix = `${normalizedRelationshipType}-`

  if (!normalizedRelativeId.startsWith(prefix)) {
    return null
  }

  const slotIndex = Number(normalizedRelativeId.slice(prefix.length))

  return Number.isInteger(slotIndex) && slotIndex > 0 ? slotIndex : null
}

function getConditionKey(condition) {
  return String(condition?.name || condition || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function mergeSelfConditionsFromCurrentHealth({
  currentHealthConditions = [],
  storedSelfConditions = [],
}) {
  const storedConditionsByKey = new Map(
    storedSelfConditions.map((condition) => [getConditionKey(condition), condition]),
  )

  return currentHealthConditions
    .filter((condition) => getConditionKey(condition))
    .map((condition) => {
      const storedCondition = storedConditionsByKey.get(getConditionKey(condition))

      return {
        ...condition,
        category: storedCondition?.category || condition.category,
        diagnosisAge: storedCondition?.diagnosisAge || condition.diagnosisAge || '',
      }
    })
}

export function getStableRelativeSaveIdentity({
  editingFamilyMemberId = '',
  existingMember = null,
  relationshipType = '',
  createFallbackId = null,
}) {
  const existingSlotIndex = Number(existingMember?.slotIndex)
  const slotIndex =
    Number.isInteger(existingSlotIndex) && existingSlotIndex > 0
      ? existingSlotIndex
      : getSlotIndexFromRelativeId(editingFamilyMemberId, relationshipType)
  const existingId = isPlaceholderRelativeId(existingMember?.id)
    ? ''
    : existingMember?.id
  const editingId = isPlaceholderRelativeId(editingFamilyMemberId)
    ? ''
    : editingFamilyMemberId
  const id =
    editingId ||
    getStableStructuredRelativeId({
      existingId,
      relationshipType,
      slotIndex,
    }) ||
    (typeof createFallbackId === 'function' ? createFallbackId() : '')

  return {
    id,
    slotIndex,
  }
}

function relativeMatchesSaveTarget(member, savedMember, editingFamilyMemberId, stableMemberId) {
  if (!member || !savedMember) {
    return false
  }

  if (member.id && member.id === editingFamilyMemberId) {
    return true
  }

  if (member.id && member.id === stableMemberId) {
    return true
  }

  if (member.relationshipType !== savedMember.relationshipType) {
    return false
  }

  const savedSlotIndex = Number(savedMember.slotIndex || 0)
  const memberSlotIndex = Number(member.slotIndex || 0)

  if (savedSlotIndex > 0 || memberSlotIndex > 0) {
    return savedSlotIndex === memberSlotIndex
  }

  return true
}

export function updateFamilyMembersWithSavedRelative({
  editingFamilyMemberId = '',
  familyMembers = [],
  savedMember,
  stableMemberId = '',
}) {
  const committedMember = {
    ...savedMember,
    id: stableMemberId,
    isPlaceholder: false,
  }
  let didUpdate = false

  const nextMembers = familyMembers.map((member) => {
    if (
      !relativeMatchesSaveTarget(
        member,
        committedMember,
        editingFamilyMemberId,
        stableMemberId,
      )
    ) {
      return member
    }

    didUpdate = true

    return {
      ...member,
      ...committedMember,
      id: stableMemberId,
      isPlaceholder: false,
    }
  })

  return didUpdate ? nextMembers : [...nextMembers, committedMember]
}

export function buildVisibleSiblingBranchMembers({
  brotherMembers = [],
  selfMember,
  sisterMembers = [],
}) {
  const siblings = []
  const maxSiblingCount = Math.max(brotherMembers.length, sisterMembers.length)

  for (let index = 0; index < maxSiblingCount; index += 1) {
    if (brotherMembers[index]) {
      siblings.push(brotherMembers[index])
    }

    if (sisterMembers[index]) {
      siblings.push(sisterMembers[index])
    }
  }

  const leftSiblingCount = Math.ceil(siblings.length / 2)

  return [
    ...siblings.slice(0, leftSiblingCount),
    ...(selfMember ? [selfMember] : []),
    ...siblings.slice(leftSiblingCount),
  ]
}

export function getFamilyMembersToRemoveForStructureChange({
  familyMembers = [],
  familyStructureFields = [],
  normalizedStructure = {},
}) {
  return familyStructureFields.flatMap((field) => {
    const nextCountValue = normalizedStructure[field.id]

    if (nextCountValue === '') {
      return []
    }

    const nextCount = Number(nextCountValue)

    if (!Number.isInteger(nextCount) || nextCount < 0) {
      return []
    }

    return familyMembers.filter(
      (member) =>
        member.relationshipType === field.relationshipType &&
        Number(member.slotIndex || 0) > nextCount,
    )
  })
}
