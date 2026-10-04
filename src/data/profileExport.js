const everydayHabitFields = [
  'alcoholUse',
  'dietQuality',
  'exercise',
  'fruitVegIntake',
  'preventiveScreenings',
  'screenTime',
  'sleep',
  'smokingStatus',
  'stressLevel',
  'sugaryDrinks',
  'waterIntake',
]

function pick(source, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => source?.[field] !== undefined)
      .map((field) => [field, source[field]]),
  )
}

function exportFamilyMember(member = {}) {
  return {
    relationship: member.relationship || '',
    relationshipType: member.relationshipType || '',
    slotIndex: member.slotIndex || null,
    nickname: member.name || '',
    conditions: Array.isArray(member.conditions)
      ? member.conditions.map((condition) => ({
          condition: condition.name || '',
          diagnosisAge: condition.diagnosisAge || '',
        }))
      : [],
  }
}

function exportActions(actions = [], completedIds = []) {
  const completed = new Set(completedIds)

  return actions.map((action) => ({
    action: action.label || action.title || '',
    category: action.category || '',
    completed: completed.has(action.id),
    timeframe: action.timeframe || '',
  }))
}

export function buildHealthDataExport({ account = {}, profileState = {} }) {
  const profile = profileState.profileForm || profileState.userProfile || {}

  return {
    exportedAt: new Date().toISOString(),
    account: {
      displayName: account.displayName || '',
      email: account.email || '',
    },
    currentHealth: {
      conditions: Array.isArray(profileState.profileIllnesses)
        ? [...profileState.profileIllnesses]
        : [],
      hasUnlistedCondition: Boolean(profileState.profileHasUnlistedCondition),
      knownHighBloodPressure: profile.knownHighBloodPressure || '',
      knownHighCholesterol: profile.knownHighCholesterol || '',
      noListedConditions: Boolean(profileState.profileNoListedConditions),
      diabetesStatus: profile.diabetesStatus || '',
    },
    familyStructure: { ...(profileState.familyStructure || {}) },
    familyMembers: Array.isArray(profileState.familyMembers)
      ? profileState.familyMembers.map(exportFamilyMember)
      : [],
    everydayHabits: pick(profile, everydayHabitFields),
    preventionProgress: {
      dailyActions: exportActions(
        profileState.dailyActions,
        profileState.completedDailyActionIds,
      ),
      weeklyActions: exportActions(
        profileState.weeklyActions,
        profileState.completedWeeklyActionIds,
      ),
      monthlyActions: exportActions(
        profileState.monthlyActions,
        profileState.completedMonthlyActionIds,
      ),
    },
    savedLocation: {
      city: profileState.activeLocation?.city || '',
      source: profileState.activeLocation?.source || '',
      zipCode: profileState.activeLocation?.zipCode || '',
    },
  }
}
