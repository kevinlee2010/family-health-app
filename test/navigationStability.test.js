import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('main navigation remains the seven approved items in order', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const viewTabsMatch = appSource.match(/const viewTabs = \[([\s\S]*?)\]\n/)

  assert.ok(viewTabsMatch)

  const labels = [...viewTabsMatch[1].matchAll(/label: '([^']+)'/g)].map(
    (match) => match[1],
  )
  const icons = [...viewTabsMatch[1].matchAll(/icon: '([^']+)'/g)].map(
    (match) => match[1],
  )

  assert.deepEqual(
    icons.map((icon, index) => `${icon} ${labels[index]}`),
    [
      '⌂ Home',
      '♡ Your Current Health',
      '◌ Your Everyday Habits',
      '☷ Your Family Structure',
      '⌁ Your Family Health Tree',
      '◇ Your Health Profile',
      '✧ Your Prevention Plan',
    ],
  )
  assert.equal(labels.includes('Local Resources'), false)
  assert.equal(labels.includes('Evidence'), false)
})

test('account and privacy controls stay in the profile menu instead of main navigation', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(appSource, />\s*My Account\s*</)
  assert.match(appSource, />\s*Privacy &amp; Data\s*</)
  assert.match(appSource, />\s*Log Out\s*</)
  assert.match(appSource, /Reset Health Profile/)
})

test('home uses the concise profile summary and links to the health profile', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(appSource, />Profile Summary</)
  assert.match(appSource, />\s*View Your Health Profile\s*</)
  assert.match(appSource, /onClick=\{\(\) => changeView\('insights'\)\}/)
  assert.doesNotMatch(appSource, />Family Insights</)
  assert.doesNotMatch(appSource, /personalizedPreventionSummary/)
})

test('home prevention progress follows the current prevention plan actions', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(appSource, /label: 'Prevention Progress'/)
  assert.match(
    appSource,
    /value: `\$\{completedTodayPreventionActions\.length\} \/ \$\{todayPreventionActions\.length\} actions completed`/,
  )
  assert.match(appSource, /detail: "Today's personalized actions\."/)
  assert.match(appSource, /progressValue: todayPreventionCompletionPercent/)
  assert.doesNotMatch(appSource, /label: 'Habit Progress'/)
  assert.doesNotMatch(appSource, /label: 'Weekly Consistency'/)
  assert.doesNotMatch(appSource, /detail: 'Active this week'/)
})

test('health profile introduction is not clipped or truncated on desktop', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const cssSource = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

  assert.match(
    appSource,
    /Your assessment highlights the three health areas that may\s+benefit most from your attention\./,
  )
  assert.match(
    cssSource,
    /\.health-profile-section-summary\s*\{[^}]*max-width:\s*none;[^}]*overflow:\s*visible;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*nowrap;/s,
  )
})

test('navigation keeps the profile lock message temporary and non-blocking', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(appSource, /Complete your profile first\./)
  assert.match(appSource, /}, 4500\)/)
  assert.match(appSource, /className="navigation-lock-toast"/)
})

test('unlisted conditions are available only for the user current health profile', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(appSource, /My condition is not listed/)
  assert.doesNotMatch(appSource, /id="custom-family-condition"/)
  assert.doesNotMatch(appSource, />\s*Add custom condition\s*</)
})

test('supplementary and no-known condition controls belong to current health only', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const inheritedDisclosureCount = (
    appSource.match(
      /className="inherited-conditions-disclosure current-health-inherited-conditions"/g,
    ) || []
  ).length

  assert.equal(inheritedDisclosureCount, 1)
  assert.match(
    appSource,
    /<span>\{noListedConditions \? '✓ ' : ''\}No known conditions<\/span>/,
  )
  assert.doesNotMatch(appSource, /selectNoKnownFamilyConditions/)
  assert.match(
    appSource,
    /const searchableFamilyConditionGroups = guidedFamilyConditionGroups/,
  )
})

test('resource finder stays hidden until an action requests it', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(appSource, /activeView === 'coach' && activeGoalAction/)
  assert.doesNotMatch(appSource, />Local Resources</)
  assert.doesNotMatch(
    appSource,
    /Choose an action with a resource button to see matching resources\./,
  )
  assert.doesNotMatch(
    appSource,
    /Choose an action above to see matching places, services, tools, or guidance\./,
  )
})

test('optional body measurements do not display example numbers', () => {
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(appSource, /placeholder="e\.g\., (5|8|150)"/)
})
