import dictionary from './dictionary'
import { evaluate, unlockedIds, ACHIEVEMENTS } from './achievements'

const KEY = 'memorija.progress.v1'

// Correct answers needed for a country to count as "mastered"
export const MASTER_AT = 3

export const CONTINENTS = [
  { key: 'Europe', label: 'Europe' },
  { key: 'Asia', label: 'Asia' },
  { key: 'Africa', label: 'Africa' },
  { key: 'NorthAmerica', label: 'North & Central' },
  { key: 'SouthAmerica', label: 'South America' },
  { key: 'Oceania', label: 'Oceania' },
]

// Region a country belongs to — used to filter quiz questions. The Americas are
// split into South vs North & Central (incl. the Caribbean).
export function regionOf(country) {
  if (country.continent === 'Americas') {
    return country.region === 'South America' ? 'SouthAmerica' : 'NorthAmerica'
  }
  return country.continent
}

const SETTINGS_KEY = 'memorija.settings.v1'
const ALL_REGIONS = CONTINENTS.map((cont) => cont.key)

// Round-length options shown on the slider; 0 means the whole section.
export const ROUND_STOPS = [10, 15, 20, 25, 30, 40, 50, 0]
const DEFAULT_ROUND = 15

function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}
    const valid = Array.isArray(raw.regions) ? raw.regions.filter((key) => ALL_REGIONS.includes(key)) : []
    const round = ROUND_STOPS.includes(raw.round) ? raw.round : DEFAULT_ROUND
    return { regions: valid.length ? valid : ALL_REGIONS, round }
  } catch {
    return { regions: ALL_REGIONS, round: DEFAULT_ROUND }
  }
}

function saveSettings(next) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  } catch {
    /* best-effort */
  }
}

export function getSettings() {
  return loadSettings()
}

// Persist the active regions; never allow an empty selection.
export function setRegions(regions) {
  const current = loadSettings()
  const next = { ...current, regions: regions.length ? regions : ALL_REGIONS }
  saveSettings(next)
  return next.regions
}

export function setRound(round) {
  const current = loadSettings()
  const value = ROUND_STOPS.includes(round) ? round : DEFAULT_ROUND
  saveSettings({ ...current, round: value })
  return value
}

// A capital is real only if it isn't blank or the placeholder 'none'.
export function hasCapital(country) {
  return !!country.capital && country.capital !== 'none'
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function numberOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function defaults() {
  return {
    countries: {},
    capitals: {},
    meta: { totalCorrect: 0, totalAnswered: 0, bestStreak: 0, unlocked: [] },
  }
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    if (!isObject(raw)) {
      return defaults()
    }

    // Legacy flat { iso2: {...} } format had no countries/capitals/meta keys.
    const legacy = !raw.countries && !raw.capitals && !raw.meta
    const meta = isObject(raw.meta) ? raw.meta : {}

    return {
      countries: legacy ? raw : (isObject(raw.countries) ? raw.countries : {}),
      capitals: isObject(raw.capitals) ? raw.capitals : {},
      meta: {
        totalCorrect: numberOr(meta.totalCorrect, 0),
        totalAnswered: numberOr(meta.totalAnswered, 0),
        bestStreak: numberOr(meta.bestStreak, 0),
        unlocked: Array.isArray(meta.unlocked) ? meta.unlocked : [],
      },
    }
  } catch {
    return defaults()
  }
}

function persist(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* storage unavailable — progress is best-effort */
  }
}

export function getProgress() {
  return load().countries
}

export function getCapitalProgress() {
  return load().capitals
}

export function isMastered(entry) {
  return !!entry && entry.correct >= MASTER_AT
}

function summarizeCapitals(data) {
  let mastered = 0
  let total = 0

  for (const country of dictionary) {
    if (!hasCapital(country)) {
      continue
    }
    total += 1
    if (isMastered(data.capitals[country.iso2])) {
      mastered += 1
    }
  }

  return { mastered, total }
}

export function getCapitalSummary() {
  return summarizeCapitals(load())
}

function summarize(data) {
  const groups = {}
  for (const cont of CONTINENTS) {
    groups[cont.key] = { mastered: 0, total: 0 }
  }

  let mastered = 0
  for (const country of dictionary) {
    const group = groups[regionOf(country)]
    group.total += 1

    if (isMastered(data.countries[country.iso2])) {
      group.mastered += 1
      mastered += 1
    }
  }

  return {
    mastered,
    total: dictionary.length,
    continents: CONTINENTS.map((cont) => ({ ...cont, ...groups[cont.key] })),
  }
}

function statsFrom(data) {
  const summary = summarize(data)
  const capitals = summarizeCapitals(data)
  return {
    mastered: summary.mastered,
    total: summary.total,
    continents: summary.continents,
    bestStreak: data.meta.bestStreak,
    totalCorrect: data.meta.totalCorrect,
    capitalsMastered: capitals.mastered,
    capitalsTotal: capitals.total,
  }
}

// Overall and per-continent mastery counts for the menu screen.
export function getSummary() {
  return summarize(load())
}

export function getAchievements() {
  return evaluate(statsFrom(load()))
}

// Countries the player misses most, worst first.
export function getHardest(limit = 8) {
  const progress = load().countries
  const list = []

  for (const country of dictionary) {
    const entry = progress[country.iso2]
    if (entry && entry.wrong > 0) {
      list.push({
        iso2: country.iso2,
        country: country.country,
        wrong: entry.wrong,
        correct: entry.correct || 0,
      })
    }
  }

  list.sort((a, b) => b.wrong - a.wrong || b.correct - a.correct)
  return list.slice(0, limit)
}

// Recompute unlocked achievements and return the freshly unlocked definitions.
function syncAchievements(data) {
  const stats = statsFrom(data)
  const nowUnlocked = unlockedIds(stats)
  const previous = new Set(data.meta.unlocked)
  const fresh = nowUnlocked.filter((id) => !previous.has(id))
  data.meta.unlocked = nowUnlocked
  return fresh.map((id) => ACHIEVEMENTS.find((a) => a.id === id))
}

// Flag / country-recognition answer — drives country mastery, streak, volume.
export function recordCountry(iso2, correct, streak) {
  const data = load()
  const entry = data.countries[iso2] || { correct: 0, wrong: 0 }
  const wasMastered = entry.correct >= MASTER_AT

  if (correct) {
    entry.correct += 1
    data.meta.totalCorrect += 1
  } else {
    entry.wrong += 1
  }
  data.meta.totalAnswered += 1
  data.countries[iso2] = entry

  if (typeof streak === 'number') {
    data.meta.bestStreak = Math.max(data.meta.bestStreak, streak)
  }

  const newAchievements = syncAchievements(data)
  persist(data)

  return {
    justMastered: !wasMastered && entry.correct >= MASTER_AT,
    newAchievements,
  }
}

// Capital answer — has its own mastery track (never touches country mastery),
// but still counts toward the general streak/volume achievements.
export function recordCapital(iso2, correct, streak) {
  const data = load()
  const entry = data.capitals[iso2] || { correct: 0, wrong: 0 }
  const wasMastered = entry.correct >= MASTER_AT

  if (correct) {
    entry.correct += 1
    data.meta.totalCorrect += 1
  } else {
    entry.wrong += 1
  }
  data.meta.totalAnswered += 1
  data.capitals[iso2] = entry

  if (typeof streak === 'number') {
    data.meta.bestStreak = Math.max(data.meta.bestStreak, streak)
  }

  const newAchievements = syncAchievements(data)
  persist(data)

  return {
    justMastered: !wasMastered && entry.correct >= MASTER_AT,
    newAchievements,
  }
}

export function resetProgress() {
  persist(defaults())
}
