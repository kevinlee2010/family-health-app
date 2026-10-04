import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildVisibleSiblingBranchMembers,
  formatRelationshipLabel,
  getFamilyMembersToRemoveForStructureChange,
  getNextFamilyStructureForInput,
  getRelativePrimaryName,
  isRelationshipLimitReachedForSave,
  isFamilyStructureComplete,
  getSlotIndexFromRelativeId,
  getStableStructuredRelativeId,
  getStableRelativeSaveIdentity,
  updateFamilyMembersWithSavedRelative,
  mergeSelfConditionsFromCurrentHealth,
  sanitizeFamilyStructureCounts,
} from '../src/familyStructurePersistence.js'

const familyStructureFields = [
  { id: 'brothers', relationshipType: 'brother' },
  { id: 'sisters', relationshipType: 'sister' },
  { id: 'sons', relationshipType: 'son' },
  { id: 'daughters', relationshipType: 'daughter' },
  { id: 'maternalUncles', relationshipType: 'maternal-uncle' },
  { id: 'maternalAunts', relationshipType: 'maternal-aunt' },
  { id: 'paternalUncles', relationshipType: 'paternal-uncle' },
  { id: 'paternalAunts', relationshipType: 'paternal-aunt' },
]

const defaultFamilyStructure = familyStructureFields.reduce(
  (structure, field) => ({
    ...structure,
    [field.id]: '',
  }),
  {},
)

function getCountedRelatives({ familyMembers, relationshipType, countValue }) {
  const count = Number(countValue)

  if (!Number.isInteger(count) || count <= 0) {
    return []
  }

  const existingMembers = familyMembers
    .filter((member) => member.relationshipType === relationshipType)
    .sort((firstMember, secondMember) =>
      (firstMember.slotIndex || 0) - (secondMember.slotIndex || 0),
    )

  return Array.from({ length: count }, (_, index) => {
    const slotIndex = index + 1

    return (
      existingMembers.find((member) => member.slotIndex === slotIndex) || {
        id: `${relationshipType}-${slotIndex}`,
        relationshipType,
        slotIndex,
        conditions: [],
      }
    )
  })
}

test('family-structure counts preserve entered values through serialization', () => {
  const structure = sanitizeFamilyStructureCounts({
    defaultFamilyStructure,
    familyStructureFields,
    value: {
      brothers: '1',
      sisters: '2',
      sons: '0',
      daughters: '0',
      maternalUncles: '2',
      maternalAunts: '1',
      paternalUncles: '1',
      paternalAunts: '3',
    },
  })
  const rehydratedStructure = sanitizeFamilyStructureCounts({
    defaultFamilyStructure,
    familyStructureFields,
    value: JSON.parse(JSON.stringify({ familyStructure: structure })).familyStructure,
  })

  assert.deepEqual(rehydratedStructure, {
    brothers: '1',
    sisters: '2',
    sons: '0',
    daughters: '0',
    maternalUncles: '2',
    maternalAunts: '1',
    paternalUncles: '1',
    paternalAunts: '3',
  })
})

test('family-structure normalization preserves blank and explicit zero separately', () => {
  const structure = sanitizeFamilyStructureCounts({
    defaultFamilyStructure,
    familyStructureFields,
    value: {
      brothers: '',
      sisters: 0,
      maternalUncles: '0',
      paternalAunts: '',
    },
  })

  assert.equal(structure.brothers, '')
  assert.equal(structure.sisters, '0')
  assert.equal(structure.maternalUncles, '0')
  assert.equal(structure.paternalAunts, '')
})

test('blank optional family counts are complete and generate no relatives', () => {
  assert.equal(
    isFamilyStructureComplete({
      familyStructureFields,
      value: defaultFamilyStructure,
    }),
    true,
  )
  assert.deepEqual(
    getCountedRelatives({
      countValue: '',
      familyMembers: [],
      relationshipType: 'brother',
    }),
    [],
  )
})

test('explicit family counts generate only the requested relatives', () => {
  const relatives = getCountedRelatives({
    countValue: '2',
    familyMembers: [],
    relationshipType: 'sister',
  })

  assert.equal(relatives.length, 2)
  assert.deepEqual(
    relatives.map((relative) => relative.id),
    ['sister-1', 'sister-2'],
  )
})

test('family-structure input updates canonical values without changing blanks to zero', () => {
  const withBrother = getNextFamilyStructureForInput({
    currentStructure: defaultFamilyStructure,
    familyStructureFields,
    fieldId: 'brothers',
    rawValue: '1',
  })
  const withBlankSons = getNextFamilyStructureForInput({
    currentStructure: withBrother,
    familyStructureFields,
    fieldId: 'sons',
    rawValue: '',
  })
  const withZeroDaughters = getNextFamilyStructureForInput({
    currentStructure: withBlankSons,
    familyStructureFields,
    fieldId: 'daughters',
    rawValue: '0',
  })

  assert.equal(withZeroDaughters.brothers, '1')
  assert.equal(withZeroDaughters.sons, '')
  assert.equal(withZeroDaughters.daughters, '0')
})

test('family-structure persistence payload survives unrelated section saves', () => {
  const familyStructure = sanitizeFamilyStructureCounts({
    defaultFamilyStructure,
    familyStructureFields,
    value: {
      brothers: '1',
      sisters: '2',
      maternalUncles: '2',
      paternalAunts: '3',
    },
  })
  const profileState = {
    familyStructure,
    familyMembers: [],
    profileForm: { exercise: 'Rarely' },
  }
  const afterLifestyleSave = {
    ...profileState,
    profileForm: {
      ...profileState.profileForm,
      exercise: '3-5 days/week',
    },
  }
  const afterCurrentHealthSave = {
    ...afterLifestyleSave,
    profileIllnesses: ['High blood pressure'],
  }

  assert.deepEqual(afterLifestyleSave.familyStructure, familyStructure)
  assert.deepEqual(afterCurrentHealthSave.familyStructure, familyStructure)
})

test('family-member health-history saves preserve family-structure counts in profile payload', () => {
  const familyStructure = sanitizeFamilyStructureCounts({
    defaultFamilyStructure,
    familyStructureFields,
    value: {
      sisters: '1',
      maternalUncles: '2',
      paternalAunts: '3',
    },
  })
  const familyMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'sister-1',
    familyMembers: [],
    savedMember: {
      relationship: 'Sibling',
      relationshipType: 'sister',
      slotIndex: 1,
      illnesses: ['Asthma'],
      conditions: [{ category: 'respiratory', diagnosisAge: '', name: 'Asthma' }],
    },
    stableMemberId: 'sister-1',
  })
  const payload = JSON.parse(
    JSON.stringify({
      familyMembers,
      familyStructure,
    }),
  )

  assert.deepEqual(payload.familyStructure, familyStructure)
  assert.equal(payload.familyMembers[0].conditions[0].name, 'Asthma')
})

test('increasing family-structure counts preserves existing relative conditions', () => {
  const existingMembers = [
    {
      id: 'sister-1',
      relationshipType: 'sister',
      slotIndex: 1,
      conditions: [{ category: 'cancer', diagnosisAge: '35', name: 'Breast cancer' }],
    },
  ]
  const normalizedStructure = sanitizeFamilyStructureCounts({
    defaultFamilyStructure,
    familyStructureFields,
    value: { sisters: '2' },
  })
  const sisterMembers = getCountedRelatives({
    familyMembers: existingMembers,
    relationshipType: 'sister',
    countValue: normalizedStructure.sisters,
  })

  assert.equal(sisterMembers.length, 2)
  assert.equal(sisterMembers[0].id, 'sister-1')
  assert.equal(sisterMembers[0].conditions[0].name, 'Breast cancer')
  assert.equal(sisterMembers[0].conditions[0].diagnosisAge, '35')
  assert.equal(sisterMembers[1].id, 'sister-2')
  assert.deepEqual(sisterMembers[1].conditions, [])
})

test('blank family-structure counts do not remove existing relatives', () => {
  const members = [
    {
      id: 'sister-1',
      relationshipType: 'sister',
      slotIndex: 1,
      conditions: [{ name: 'High blood pressure' }],
    },
  ]

  const membersToRemove = getFamilyMembersToRemoveForStructureChange({
    familyMembers: members,
    familyStructureFields,
    normalizedStructure: { sisters: '', sons: '' },
  })

  assert.deepEqual(membersToRemove, [])
})

test('lower explicit family count removes only relatives outside that count', () => {
  const members = [
    { id: 'sister-1', relationshipType: 'sister', slotIndex: 1 },
    { id: 'sister-2', relationshipType: 'sister', slotIndex: 2 },
    { id: 'son-1', relationshipType: 'son', slotIndex: 1 },
  ]

  const membersToRemove = getFamilyMembersToRemoveForStructureChange({
    familyMembers: members,
    familyStructureFields,
    normalizedStructure: { sisters: '1', sons: '' },
  })

  assert.deepEqual(
    membersToRemove.map((member) => member.id),
    ['sister-2'],
  )
})

test('structured relatives without saved IDs receive deterministic IDs', () => {
  assert.equal(
    getStableStructuredRelativeId({
      relationshipType: 'maternal-aunt',
      slotIndex: 2,
    }),
    'maternal-aunt-2',
  )
  assert.equal(
    getStableStructuredRelativeId({ relationshipType: 'mother' }),
    'mother',
  )
  assert.equal(
    getStableStructuredRelativeId({
      existingId: 'saved-relative-id',
      relationshipType: 'sister',
      slotIndex: 1,
    }),
    'saved-relative-id',
  )
})

test('structured relatives use exact relationship labels', () => {
  assert.equal(
    formatRelationshipLabel({ relationshipType: 'maternal-grandmother' }),
    'Maternal Grandmother',
  )
  assert.equal(
    formatRelationshipLabel({ relationshipType: 'paternal-grandfather' }),
    'Paternal Grandfather',
  )
  assert.equal(formatRelationshipLabel({ relationshipType: 'mother' }), 'Mother')
  assert.equal(formatRelationshipLabel({ relationshipType: 'father' }), 'Father')
  assert.equal(
    formatRelationshipLabel({ relationshipType: 'sister', slotIndex: 1 }),
    'Sister 1',
  )
  assert.equal(
    formatRelationshipLabel({ relationshipType: 'maternal-uncle', slotIndex: 1 }),
    'Maternal Uncle 1',
  )
  assert.equal(
    formatRelationshipLabel({ relationshipType: 'paternal-aunt', slotIndex: 1 }),
    'Paternal Aunt 1',
  )
})

test('relative primary names preserve the exact relationship separately', () => {
  const namedRelative = {
    name: 'Grandma Rose',
    relationshipType: 'maternal-grandmother',
  }

  assert.equal(getRelativePrimaryName(namedRelative), 'Grandma Rose')
  assert.equal(formatRelationshipLabel(namedRelative), 'Maternal Grandmother')
  assert.equal(getRelativePrimaryName({ relationshipType: 'self' }), 'You')
})

test('legacy generic relatives stay generic when exact relationship is unavailable', () => {
  assert.equal(
    formatRelationshipLabel({
      relationship: 'Grandparent',
      relationshipType: 'legacy',
    }),
    'Grandparent',
  )
  assert.equal(formatRelationshipLabel({ relationship: 'Sibling' }), 'Sibling')
})

test('generated sibling placeholder saves with stable slot identity', () => {
  const identity = getStableRelativeSaveIdentity({
    editingFamilyMemberId: 'sister-1',
    existingMember: null,
    relationshipType: 'sister',
  })

  assert.deepEqual(identity, {
    id: 'sister-1',
    slotIndex: 1,
  })
  assert.equal(getSlotIndexFromRelativeId('brother-2', 'brother'), 2)
})

test('core placeholder relatives save as stable non-placeholder records', () => {
  const identity = getStableRelativeSaveIdentity({
    editingFamilyMemberId: 'maternal-grandmother-placeholder',
    existingMember: null,
    relationshipType: 'maternal-grandmother',
  })

  assert.deepEqual(identity, {
    id: 'maternal-grandmother',
    slotIndex: null,
  })

  const updatedMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'maternal-grandmother-placeholder',
    familyMembers: [],
    savedMember: {
      relationship: 'Grandparent',
      relationshipType: 'maternal-grandmother',
      slotIndex: null,
      illnesses: ['Breast cancer'],
      conditions: [
        {
          category: 'cancer',
          diagnosisAge: '52',
          name: 'Breast cancer',
        },
      ],
      isPlaceholder: true,
    },
    stableMemberId: identity.id,
  })

  assert.deepEqual(updatedMembers, [
    {
      id: 'maternal-grandmother',
      relationship: 'Grandparent',
      relationshipType: 'maternal-grandmother',
      slotIndex: null,
      illnesses: ['Breast cancer'],
      conditions: [
        {
          category: 'cancer',
          diagnosisAge: '52',
          name: 'Breast cancer',
        },
      ],
      isPlaceholder: false,
    },
  ])
})

test('saved health history replaces an existing generated relative by stable id', () => {
  const updatedMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'sister-1',
    familyMembers: [
      {
        id: 'sister-1',
        relationship: 'Sibling',
        relationshipType: 'sister',
        slotIndex: 1,
        conditions: [],
        isPlaceholder: true,
      },
      {
        id: 'brother-1',
        relationship: 'Sibling',
        relationshipType: 'brother',
        slotIndex: 1,
        conditions: [{ name: 'Asthma' }],
      },
    ],
    savedMember: {
      relationship: 'Sibling',
      relationshipType: 'sister',
      slotIndex: 1,
      illnesses: ['Breast cancer'],
      conditions: [{ category: 'cancer', diagnosisAge: '52', name: 'Breast cancer' }],
    },
    stableMemberId: 'sister-1',
  })

  assert.equal(updatedMembers.length, 2)
  assert.equal(updatedMembers[0].id, 'sister-1')
  assert.equal(updatedMembers[0].isPlaceholder, false)
  assert.equal(updatedMembers[0].conditions[0].name, 'Breast cancer')
  assert.equal(updatedMembers[1].conditions[0].name, 'Asthma')
})

test('editing existing grandparents bypasses add-limit validation and updates in place', () => {
  const grandparents = [
    {
      id: 'maternal-grandmother',
      relationship: 'Grandparent',
      relationshipType: 'maternal-grandmother',
      conditions: [{ category: 'cancer', diagnosisAge: '52', name: 'Breast cancer' }],
      illnesses: ['Breast cancer'],
    },
    {
      id: 'maternal-grandfather',
      relationship: 'Grandparent',
      relationshipType: 'maternal-grandfather',
      conditions: [{ category: 'cardiovascular', diagnosisAge: '', name: 'High cholesterol' }],
      illnesses: ['High cholesterol'],
    },
    {
      id: 'paternal-grandmother',
      relationship: 'Grandparent',
      relationshipType: 'paternal-grandmother',
      conditions: [{ category: 'metabolic', diagnosisAge: '', name: 'Diabetes' }],
      illnesses: ['Diabetes'],
    },
    {
      id: 'paternal-grandfather',
      relationship: 'Grandparent',
      relationshipType: 'paternal-grandfather',
      conditions: [{ category: 'cardiovascular', diagnosisAge: '', name: 'Heart disease' }],
      illnesses: ['Heart disease'],
    },
  ]
  const addedConditionsByGrandparent = {
    'maternal-grandmother': [
      { category: 'cancer', diagnosisAge: '52', name: 'Breast cancer' },
      { category: 'cardiovascular', diagnosisAge: '61', name: 'High blood pressure' },
    ],
    'maternal-grandfather': [
      { category: 'cardiovascular', diagnosisAge: '', name: 'High cholesterol' },
      { category: 'cardiovascular', diagnosisAge: '70', name: 'Stroke' },
    ],
    'paternal-grandmother': [
      { category: 'metabolic', diagnosisAge: '', name: 'Diabetes' },
      { category: 'cardiovascular', diagnosisAge: '64', name: 'High blood pressure' },
    ],
    'paternal-grandfather': [
      { category: 'cardiovascular', diagnosisAge: '', name: 'Heart disease' },
      { category: 'cardiovascular', diagnosisAge: '58', name: 'Heart attack' },
    ],
  }

  const updatedGrandparents = grandparents.reduce((members, grandparent) => {
    assert.equal(
      isRelationshipLimitReachedForSave({
        editingFamilyMemberId: grandparent.id,
        familyMembers: members,
        relationship: 'Grandparent',
      }),
      false,
      `${grandparent.id} should edit even when four grandparents exist`,
    )

    return updateFamilyMembersWithSavedRelative({
      editingFamilyMemberId: grandparent.id,
      familyMembers: members,
      savedMember: {
        relationship: 'Grandparent',
        relationshipType: grandparent.relationshipType,
        illnesses: addedConditionsByGrandparent[grandparent.id].map(
          (condition) => condition.name,
        ),
        conditions: addedConditionsByGrandparent[grandparent.id],
      },
      stableMemberId: grandparent.id,
    })
  }, grandparents)

  assert.equal(updatedGrandparents.length, 4)
  grandparents.forEach((grandparent) => {
    const updatedGrandparent = updatedGrandparents.find(
      (member) => member.id === grandparent.id,
    )

    assert.equal(updatedGrandparent.conditions.length, 2)
    assert.deepEqual(
      updatedGrandparent.conditions,
      addedConditionsByGrandparent[grandparent.id],
    )
  })
})

test('creating a fifth grandparent is still blocked by add-limit validation', () => {
  const grandparents = [
    'maternal-grandmother',
    'maternal-grandfather',
    'paternal-grandmother',
    'paternal-grandfather',
  ].map((relationshipType) => ({
    id: relationshipType,
    relationship: 'Grandparent',
    relationshipType,
  }))

  assert.equal(
    isRelationshipLimitReachedForSave({
      editingFamilyMemberId: '',
      familyMembers: grandparents,
      relationship: 'Grandparent',
    }),
    true,
  )
})

test('sibling save upgrades a legacy same-id record to structured sister slot', () => {
  const identity = getStableRelativeSaveIdentity({
    editingFamilyMemberId: 'sister-1',
    existingMember: {
      id: 'sister-1',
      relationship: 'Sibling',
      relationshipType: 'legacy',
      slotIndex: null,
      conditions: [],
    },
    relationshipType: 'sister',
  })
  const updatedMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'sister-1',
    familyMembers: [
      {
        id: 'sister-1',
        relationship: 'Sibling',
        relationshipType: 'legacy',
        slotIndex: null,
        conditions: [],
      },
    ],
    savedMember: {
      relationship: 'Sibling',
      relationshipType: 'sister',
      slotIndex: identity.slotIndex,
      illnesses: ['Asthma'],
      conditions: [{ category: 'respiratory', diagnosisAge: '', name: 'Asthma' }],
    },
    stableMemberId: identity.id,
  })
  const serializedProfile = JSON.parse(
    JSON.stringify({ familyMembers: updatedMembers }),
  )
  const reloadedSister = serializedProfile.familyMembers.find(
    (member) => member.id === 'sister-1',
  )

  assert.deepEqual(identity, {
    id: 'sister-1',
    slotIndex: 1,
  })
  assert.equal(reloadedSister.relationshipType, 'sister')
  assert.equal(reloadedSister.slotIndex, 1)
  assert.equal(reloadedSister.conditions[0].name, 'Asthma')
})

test('brother save upgrades a legacy same-id record and survives serialization', () => {
  const identity = getStableRelativeSaveIdentity({
    editingFamilyMemberId: 'brother-1',
    existingMember: {
      id: 'brother-1',
      relationship: 'Sibling',
      relationshipType: 'legacy',
      slotIndex: null,
      conditions: [],
    },
    relationshipType: 'brother',
  })
  const updatedMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'brother-1',
    familyMembers: [
      {
        id: 'brother-1',
        relationship: 'Sibling',
        relationshipType: 'legacy',
        slotIndex: null,
        conditions: [],
      },
    ],
    savedMember: {
      relationship: 'Sibling',
      relationshipType: 'brother',
      slotIndex: identity.slotIndex,
      illnesses: ['High blood pressure'],
      conditions: [
        {
          category: 'cardiovascular',
          diagnosisAge: '',
          name: 'High blood pressure',
        },
      ],
    },
    stableMemberId: identity.id,
  })
  const serializedProfile = JSON.parse(
    JSON.stringify({ familyMembers: updatedMembers }),
  )
  const reloadedBrother = serializedProfile.familyMembers.find(
    (member) => member.id === 'brother-1',
  )

  assert.deepEqual(identity, {
    id: 'brother-1',
    slotIndex: 1,
  })
  assert.equal(reloadedBrother.relationshipType, 'brother')
  assert.equal(reloadedBrother.slotIndex, 1)
  assert.equal(reloadedBrother.conditions[0].name, 'High blood pressure')
})

test('two saved sisters keep separate records through serialization', () => {
  const sisterOneMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'sister-1',
    familyMembers: [],
    savedMember: {
      relationship: 'Sibling',
      relationshipType: 'sister',
      slotIndex: 1,
      illnesses: ['Asthma'],
      conditions: [{ category: 'respiratory', diagnosisAge: '', name: 'Asthma' }],
    },
    stableMemberId: 'sister-1',
  })
  const updatedMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'sister-2',
    familyMembers: sisterOneMembers,
    savedMember: {
      relationship: 'Sibling',
      relationshipType: 'sister',
      slotIndex: 2,
      illnesses: ['Depression'],
      conditions: [{ category: 'mental', diagnosisAge: '', name: 'Depression' }],
    },
    stableMemberId: 'sister-2',
  })
  const serializedProfile = JSON.parse(
    JSON.stringify({ familyMembers: updatedMembers }),
  )
  const sisterOne = serializedProfile.familyMembers.find(
    (member) => member.id === 'sister-1',
  )
  const sisterTwo = serializedProfile.familyMembers.find(
    (member) => member.id === 'sister-2',
  )

  assert.equal(sisterOne.conditions[0].name, 'Asthma')
  assert.equal(sisterTwo.conditions[0].name, 'Depression')
  assert.equal(sisterOne.slotIndex, 1)
  assert.equal(sisterTwo.slotIndex, 2)
})

test('all structured relationship types use the same saved-relative update path', () => {
  const relationshipTypes = [
    'maternal-grandmother',
    'maternal-grandfather',
    'paternal-grandmother',
    'paternal-grandfather',
    'mother',
    'father',
    'brother',
    'sister',
    'son',
    'daughter',
    'maternal-aunt',
    'maternal-uncle',
    'paternal-aunt',
    'paternal-uncle',
  ]

  relationshipTypes.forEach((relationshipType) => {
    const slotIndex = [
      'brother',
      'sister',
      'son',
      'daughter',
      'maternal-aunt',
      'maternal-uncle',
      'paternal-aunt',
      'paternal-uncle',
    ].includes(relationshipType)
      ? 1
      : null
    const stableMemberId = slotIndex
      ? `${relationshipType}-${slotIndex}`
      : relationshipType
    const updatedMembers = updateFamilyMembersWithSavedRelative({
      editingFamilyMemberId: slotIndex
        ? stableMemberId
        : `${relationshipType}-placeholder`,
      familyMembers: [],
      savedMember: {
        relationship: ['mother', 'father'].includes(relationshipType)
          ? relationshipType === 'mother'
            ? 'Mother'
            : 'Father'
          : 'Relative',
        relationshipType,
        slotIndex,
        illnesses: ['Breast cancer'],
        conditions: [
          { category: 'cancer', diagnosisAge: '52', name: 'Breast cancer' },
        ],
      },
      stableMemberId,
    })

    assert.equal(updatedMembers[0].id, stableMemberId)
    assert.equal(updatedMembers[0].isPlaceholder, false)
    assert.equal(updatedMembers[0].conditions[0].name, 'Breast cancer')
    assert.equal(updatedMembers[0].conditions[0].diagnosisAge, '52')
  })
})

test('saved relative conditions survive profile-data serialization round trip', () => {
  const updatedMembers = updateFamilyMembersWithSavedRelative({
    editingFamilyMemberId: 'paternal-aunt-1',
    familyMembers: [],
    savedMember: {
      relationship: 'Aunt/Uncle',
      relationshipType: 'paternal-aunt',
      slotIndex: 1,
      illnesses: ['Breast cancer'],
      conditions: [
        {
          category: 'cancer',
          diagnosisAge: '52',
          name: 'Breast cancer',
        },
      ],
    },
    stableMemberId: 'paternal-aunt-1',
  })
  const reloadedProfileData = JSON.parse(
    JSON.stringify({ familyMembers: updatedMembers }),
  )

  assert.deepEqual(reloadedProfileData.familyMembers[0], {
    id: 'paternal-aunt-1',
    relationship: 'Aunt/Uncle',
    relationshipType: 'paternal-aunt',
    slotIndex: 1,
    illnesses: ['Breast cancer'],
    conditions: [
      {
        category: 'cancer',
        diagnosisAge: '52',
        name: 'Breast cancer',
      },
    ],
    isPlaceholder: false,
  })
})

test('self current-health sync preserves diagnosis ages for matching conditions', () => {
  const syncedConditions = mergeSelfConditionsFromCurrentHealth({
    currentHealthConditions: [
      { category: 'cardiovascular', diagnosisAge: '', name: 'High blood pressure' },
      { category: 'metabolic', diagnosisAge: '', name: 'Diabetes' },
    ],
    storedSelfConditions: [
      {
        category: 'cardiovascular',
        diagnosisAge: '52',
        name: 'High blood pressure',
      },
      { category: 'respiratory', diagnosisAge: '21', name: 'Asthma' },
    ],
  })

  assert.deepEqual(syncedConditions, [
    {
      category: 'cardiovascular',
      diagnosisAge: '52',
      name: 'High blood pressure',
    },
    { category: 'metabolic', diagnosisAge: '', name: 'Diabetes' },
  ])
})

test('self current-health removal drops removed conditions without affecting others', () => {
  const syncedConditions = mergeSelfConditionsFromCurrentHealth({
    currentHealthConditions: [
      { category: 'metabolic', diagnosisAge: '', name: 'Diabetes' },
    ],
    storedSelfConditions: [
      {
        category: 'cardiovascular',
        diagnosisAge: '52',
        name: 'High blood pressure',
      },
      { category: 'metabolic', diagnosisAge: '44', name: 'Diabetes' },
    ],
  })

  assert.deepEqual(syncedConditions, [
    { category: 'metabolic', diagnosisAge: '44', name: 'Diabetes' },
  ])
})

test('multiple siblings keep separate stable health histories', () => {
  const members = [
    {
      id: 'sister-1',
      relationshipType: 'sister',
      slotIndex: 1,
      conditions: [{ name: 'Asthma' }],
    },
    {
      id: 'sister-2',
      relationshipType: 'sister',
      slotIndex: 2,
      conditions: [{ name: 'Depression' }],
    },
  ]

  const sisterOne = members.find(
    (member) => member.relationshipType === 'sister' && member.slotIndex === 1,
  )
  const sisterTwo = members.find(
    (member) => member.relationshipType === 'sister' && member.slotIndex === 2,
  )

  assert.equal(sisterOne.conditions[0].name, 'Asthma')
  assert.equal(sisterTwo.conditions[0].name, 'Depression')
})

test('visible sibling branch excludes legacy generic sibling records', () => {
  const legacySibling = {
    id: 'legacy-sibling',
    relationship: 'Sibling',
    relationshipType: 'legacy',
    conditions: [{ name: 'Asthma' }],
  }
  const visibleSiblings = buildVisibleSiblingBranchMembers({
    brotherMembers: [],
    selfMember: { id: 'self', relationshipType: 'self' },
    sisterMembers: [{ id: 'sister-1', relationshipType: 'sister', slotIndex: 1 }],
    legacySiblingMembers: [legacySibling],
  })

  assert.deepEqual(
    visibleSiblings.map((member) => member.id),
    ['sister-1', 'self'],
  )
})

test('visible sibling branch keeps you alone when there are no siblings', () => {
  const visibleSiblings = buildVisibleSiblingBranchMembers({
    brotherMembers: [],
    selfMember: { id: 'self', relationshipType: 'self' },
    sisterMembers: [],
  })

  assert.deepEqual(
    visibleSiblings.map((member) => member.id),
    ['self'],
  )
})

test('visible sibling branch keeps one sister on the same row before you', () => {
  const visibleSiblings = buildVisibleSiblingBranchMembers({
    brotherMembers: [],
    selfMember: { id: 'self', relationshipType: 'self' },
    sisterMembers: [{ id: 'sister-1', relationshipType: 'sister', slotIndex: 1 }],
  })

  assert.deepEqual(
    visibleSiblings.map((member) => member.id),
    ['sister-1', 'self'],
  )
})

test('visible sibling branch distributes brothers and sisters around you', () => {
  const visibleSiblings = buildVisibleSiblingBranchMembers({
    brotherMembers: [
      { id: 'brother-1', relationshipType: 'brother', slotIndex: 1 },
      { id: 'brother-2', relationshipType: 'brother', slotIndex: 2 },
    ],
    selfMember: { id: 'self', relationshipType: 'self' },
    sisterMembers: [{ id: 'sister-1', relationshipType: 'sister', slotIndex: 1 }],
  })

  assert.deepEqual(
    visibleSiblings.map((member) => member.id),
    ['brother-1', 'sister-1', 'self', 'brother-2'],
  )
})
