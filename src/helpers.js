import { MASTER_AT, regionOf, hasCapital } from './storage'
import { LOOKALIKES, similarCountries } from './similar'

// Questions per round. Small sections use their whole pool.
export const ROUND_SIZE = 12

// Modes that ask about a capital need entries that actually have one
export function getPool(mode, dictionary) {
  return mode === 'capital'
    ? dictionary.filter(hasCapital)
    : dictionary
}

export function shuffle(arr) {
  const result = [...arr]

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = result[i]
    result[i] = result[j]
    result[j] = swap
  }

  return result
}

function filterByRegions(dictionary, regions) {
  if (!regions || !regions.length) {
    return dictionary
  }
  const set = new Set(regions)
  const filtered = dictionary.filter((item) => set.has(regionOf(item)))
  return filtered.length ? filtered : dictionary
}

// The pool of countries a round can draw from for the given mode. Tricky keeps
// its distractors global (look-alikes cross continents), but the asked flag
// still respects the selected regions.
function sectionPool(mode, dictionary, regions) {
  if (mode === 'tricky') {
    return filterByRegions(LOOKALIKES, regions)
  }
  return getPool(mode, filterByRegions(dictionary, regions))
}

// Bias selection toward unseen and frequently-missed countries.
function weightFor(entry) {
  if (!entry) {
    return 6
  }
  if (entry.correct >= MASTER_AT) {
    return 1
  }
  return 3 + 2 * Math.min(entry.wrong, 4)
}

// Pick `count` distinct countries from the pool, weighted by progress.
function weightedSample(pool, progress, count) {
  const remaining = [...pool]
  const picked = []

  while (picked.length < count && remaining.length) {
    let total = 0
    const weights = remaining.map((item) => {
      const weight = weightFor(progress[item.iso2])
      total += weight
      return weight
    })

    let threshold = Math.random() * total
    let index = remaining.length - 1
    for (let i = 0; i < remaining.length; i++) {
      threshold -= weights[i]
      if (threshold <= 0) {
        index = i
        break
      }
    }

    picked.push(remaining[index])
    remaining.splice(index, 1)
  }

  return picked
}

// Build the 4 answer options for one question. In capital mode the visible
// label is the capital, so distractors must have distinct capital names too —
// otherwise two identical options could appear and one read as "wrong".
function buildOptions(mode, current, pool, dictionary) {
  const isCapital = mode === 'capital'
  const usedIso = new Set([current.iso2])
  const usedLabel = isCapital ? new Set([current.capital]) : null
  const distractors = []

  const take = (candidates) => {
    for (const country of candidates) {
      if (distractors.length >= 3) {
        break
      }
      if (usedIso.has(country.iso2)) {
        continue
      }
      if (usedLabel && usedLabel.has(country.capital)) {
        continue
      }
      distractors.push(country)
      usedIso.add(country.iso2)
      if (usedLabel) {
        usedLabel.add(country.capital)
      }
    }
  }

  take(shuffle(mode === 'tricky' ? similarCountries(current.iso2) : pool))

  // Top up from the full pool if a family (or unique-label set) was too small.
  if (distractors.length < 3) {
    take(shuffle(getPool(mode, dictionary)))
  }

  return shuffle([current, ...distractors])
}

// Build a finite round: a sample of the section, each country once, ending
// when every question has been answered. `size` of 0 means the whole section.
export function buildSession(mode, dictionary, progress = {}, regions = null, size = ROUND_SIZE) {
  const pool = sectionPool(mode, dictionary, regions)
  const count = size > 0 ? Math.min(size, pool.length) : pool.length
  const order = weightedSample(pool, progress, count)

  return order.map((current) => ({
    current,
    options: mode === 'zen' ? [] : buildOptions(mode, current, pool, dictionary),
  }))
}
