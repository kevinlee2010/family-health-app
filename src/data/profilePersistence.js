export function serializeProfileState(profileState) {
  return JSON.stringify({
    ...profileState,
    version: 1,
  })
}

export function createProfileSaveCoordinator({ deleteProfile, saveProfile }) {
  let mutationQueue = Promise.resolve()
  let latestMutationId = 0

  function enqueue(mutation) {
    const mutationId = ++latestMutationId
    const result = mutationQueue.catch(() => undefined).then(mutation)

    mutationQueue = result.catch(() => undefined)

    return result.then((value) => ({
      isLatest: mutationId === latestMutationId,
      value,
    }))
  }

  return {
    delete(userId) {
      return enqueue(() => deleteProfile(userId))
    },
    save(userId, profileState) {
      return enqueue(() => saveProfile(userId, profileState))
    },
    waitForIdle() {
      return mutationQueue
    },
  }
}
