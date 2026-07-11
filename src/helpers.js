import { MASTER_AT, regionOf, hasCapital } from './storage'
import { similarCountries } from './similar'

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

// How many of the 3 wrong options may be flag look-alikes. Capping below 3
// keeps flag rounds a bit harder without turning every question into the old
// tricky drill.
const LOOKALIKE_MAX = 2

// Build the 4 answer options for one question. In capital mode the visible
// label is the capital, so distractors must have distinct capital names too —
// otherwise two identical options could appear and one read as "wrong".
function buildOptions(mode, current, pool, dictionary) {
  const isCapital = mode === 'capital'
  const usedIso = new Set([current.iso2])
  const usedLabel = isCapital ? new Set([current.capital]) : null
  const distractors = []

  const take = (candidates, limit = 3) => {
    for (const country of candidates) {
      if (distractors.length >= limit) {
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

  // Flag modes bias a couple of wrong options toward look-alike flags, so
  // confusable countries surface far more often than random chance would. Keep
  // them inside the round's pool so a region filter isn't given away.
  if (mode === 'flag' || mode === 'reverse') {
    const inPool = new Set(pool.map((item) => item.iso2))
    const lookalikes = similarCountries(current.iso2).filter((item) => inPool.has(item.iso2))
    take(shuffle(lookalikes), LOOKALIKE_MAX)
  }

  take(shuffle(pool))

  // Top up from the full pool if the region slice (or unique-label set) was too small.
  if (distractors.length < 3) {
    take(shuffle(getPool(mode, dictionary)))
  }

  return shuffle([current, ...distractors])
}

// Build a finite round: a sample of the section, each country once, ending
// when every question has been answered. `size` of 0 means the whole section.
export function buildSession(mode, dictionary, progress = {}, regions = null, size = ROUND_SIZE) {
  const pool = getPool(mode, filterByRegions(dictionary, regions))
  const count = size > 0 ? Math.min(size, pool.length) : pool.length
  const order = weightedSample(pool, progress, count)

  return order.map((current) => ({
    current,
    options: mode === 'zen' ? [] : buildOptions(mode, current, pool, dictionary),
  }))
}
