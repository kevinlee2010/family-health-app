function addUniqueLabel(labels, label) {
  if (label && !labels.includes(label)) {
    labels.push(label)
  }
}

function getStrongHabitLabels(profile = {}) {
  const habits = []

  if (['3-5 days/week', 'Nearly every day'].includes(profile.exercise)) {
    addUniqueLabel(habits, 'Regular physical activity')
  }

  if (['Never', 'Former'].includes(profile.smokingStatus)) {
    addUniqueLabel(habits, 'No current smoking')
  }

  if (['Never', 'Occasionally'].includes(profile.alcoholUse)) {
    addUniqueLabel(habits, 'Limited alcohol use')
  }

  if (profile.sleep === '7-9 hours') {
    addUniqueLabel(habits, 'Consistent sleep')
  }

  if (
    ['Good', 'Excellent'].includes(profile.dietQuality) ||
    ['3-4 servings', '5 or more servings'].includes(profile.fruitVegIntake)
  ) {
    addUniqueLabel(habits, 'Balanced nutrition')
  }

  if (['6-8 cups', 'More than 8 cups'].includes(profile.waterIntake)) {
    addUniqueLabel(habits, 'Supportive hydration')
  }

  return habits.slice(0, 2)
}

export function buildDashboardProfileSummary({ profile = {}, topPriorities = [] } = {}) {
  const focusAreas = topPriorities
    .map((priority) => priority?.title)
    .filter(Boolean)
    .filter((title, index, titles) => titles.indexOf(title) === index)
    .slice(0, 2)

  return {
    focusAreas,
    strongHabits: getStrongHabitLabels(profile),
  }
}
