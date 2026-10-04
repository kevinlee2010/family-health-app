import assert from 'node:assert/strict'
import test from 'node:test'

import { buildHealthDataExport } from '../src/data/profileExport.js'
import {
  createProfileSaveCoordinator,
  serializeProfileState,
} from '../src/data/profilePersistence.js'

test('profile serialization round-trips family history, diagnosis ages, and progress', () => {
  const profile = {
    familyMembers: [
      {
        id: 'sister-1',
        relationshipType: 'sister',
        slotIndex: 1,
        conditions: [{ name: 'Asthma', diagnosisAge: '12' }],
      },
    ],
    familyStructure: { sisters: '1' },
    completedDailyActionIds: ['walk'],
    activeLocation: { city: 'San Francisco', source: 'manual', zipCode: '94127' },
  }

  const restored = JSON.parse(serializeProfileState(profile))

  assert.equal(restored.version, 1)
  assert.equal(restored.familyMembers[0].id, 'sister-1')
  assert.equal(restored.familyMembers[0].conditions[0].diagnosisAge, '12')
  assert.deepEqual(restored.completedDailyActionIds, ['walk'])
  assert.equal(restored.activeLocation.zipCode, '94127')
})

test('queued saves prevent an older autosave from overtaking a newer explicit save', async () => {
  const calls = []
  let releaseFirstSave
  const firstSaveGate = new Promise((resolve) => {
    releaseFirstSave = resolve
  })
  const coordinator = createProfileSaveCoordinator({
    deleteProfile: async () => {},
    saveProfile: async (userId, profile) => {
      calls.push([userId, profile.version])
      if (profile.version === 'old') await firstSaveGate
    },
  })

  const oldSave = coordinator.save('user-a', { version: 'old' })
  await Promise.resolve()
  const newSave = coordinator.save('user-a', { version: 'new' })

  releaseFirstSave()
  const [oldResult, newResult] = await Promise.all([oldSave, newSave])

  assert.deepEqual(calls, [
    ['user-a', 'old'],
    ['user-a', 'new'],
  ])
  assert.equal(oldResult.isLatest, false)
  assert.equal(newResult.isLatest, true)
})

test('profile reset waits for pending saves before deleting cloud data', async () => {
  const operations = []
  let releaseSave
  const saveGate = new Promise((resolve) => {
    releaseSave = resolve
  })
  const coordinator = createProfileSaveCoordinator({
    deleteProfile: async (userId) => operations.push(`delete:${userId}`),
    saveProfile: async (userId) => {
      operations.push(`save:${userId}`)
      await saveGate
    },
  })

  const save = coordinator.save('user-a', {})
  await Promise.resolve()
  const deletion = coordinator.delete('user-a')
  releaseSave()
  await Promise.all([save, deletion])

  assert.deepEqual(operations, ['save:user-a', 'delete:user-a'])
})

test('queued persistence keeps user identities attached to their own writes', async () => {
  const calls = []
  const coordinator = createProfileSaveCoordinator({
    deleteProfile: async () => {},
    saveProfile: async (userId, profile) => calls.push({ profile, userId }),
  })

  await Promise.all([
    coordinator.save('user-a', { familyStructure: { sisters: '2' } }),
    coordinator.save('user-b', { familyStructure: { brothers: '1' } }),
  ])

  assert.deepEqual(calls, [
    { profile: { familyStructure: { sisters: '2' } }, userId: 'user-a' },
    { profile: { familyStructure: { brothers: '1' } }, userId: 'user-b' },
  ])
})

test('health data export includes user-owned health data and omits secrets and internal IDs', () => {
  const exported = buildHealthDataExport({
    account: { displayName: 'Alex', email: 'alex@example.com', accessToken: 'secret' },
    profileState: {
      activeLocation: { city: 'Berkeley', source: 'manual', zipCode: '94704' },
      completedDailyActionIds: ['walk-id'],
      dailyActions: [{ id: 'walk-id', label: 'Take a walk.', timeframe: 'today' }],
      familyMembers: [
        {
          id: 'mother',
          name: 'Mom',
          relationship: 'Mother',
          relationshipType: 'mother',
          conditions: [{ name: 'High blood pressure', diagnosisAge: '48' }],
        },
      ],
      familyStructure: { sisters: '1' },
      profileForm: { exercise: '3-5 days/week', smokingStatus: 'Never' },
      profileIllnesses: ['Asthma'],
    },
  })
  const serialized = JSON.stringify(exported)

  assert.equal(exported.familyMembers[0].nickname, 'Mom')
  assert.equal(exported.familyMembers[0].conditions[0].diagnosisAge, '48')
  assert.equal(exported.preventionProgress.dailyActions[0].completed, true)
  assert.equal(serialized.includes('secret'), false)
  assert.equal(serialized.includes('walk-id'), false)
  assert.equal(serialized.includes('"id":"mother"'), false)
})
