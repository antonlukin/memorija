// One-off generator: builds a small "context map" per country from Natural
// Earth boundaries — the target country filled in the accent colour, its
// neighbours muted around it, zoomed to a tunable window. Renders as a plain
// <img> (like the flags), so the app just points at public/outlines/<iso2>.svg.
//
//   node scripts/generate-outlines.mjs   (or: yarn outlines)
//
// The target is drawn from the detailed 50m data; the surrounding neighbours
// come from the coarse 110m data (they're only muted background, and coarse
// keeps the files small). The projection is rotated to centre on the target's
// longitude, which keeps antimeridian countries (Russia, Fiji) from breaking.
//
// Output:
//   public/outlines/<iso2>.svg   — context map, target highlighted
//   src/outlines.js              — manifest of countries that have a map

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { geoMercator, geoPath, geoArea, geoCentroid } from 'd3-geo'
import { feature } from 'topojson-client'

import dictionary from '../src/dictionary.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const OUT_DIR = resolve(ROOT, 'public/outlines')

// Canvas the map is drawn into. 4:3 like the flags, so it fills the full column
// width in the app without being too tall.
const WIDTH = 400
const HEIGHT = 300

// Zoom knob: how much surrounding context to show. The target's main landmass is
// fit into a centred square of side HEIGHT / (1 + 2*ZOOM); the leftover margin is
// the neighbour ring. Smaller = tighter on the country, larger = more continent.
const ZOOM = 0.7

// Cap on projection scale, so tiny countries (Luxembourg, Singapore) don't zoom
// in so far that their neighbours fall out of frame — the whole point here is to
// place the country by its surroundings. Lower = wider minimum view.
const MAX_SCALE = 1400

// Minimum share of the canvas that must be land (target + neighbours). Scattered
// ocean microstates (Marshall Islands, Maldives, Seychelles…) fall below this —
// they're just empty sea, impossible to place by geography, so we drop them from
// the mode instead of showing a blank tile.
const MIN_LAND = 0.03

// If the target's drawn shape is smaller than this (canvas px), it's a sub-pixel
// microstate (Monaco, Vatican, San Marino…) — draw a marker dot on it instead so
// there's always something visible to spot.
const MARKER_MIN = 12
const MARKER_R = 6

// Baked colours (dark theme). Target pops in the lime accent; neighbours are a
// muted land grey separated by faint borders; oceans stay transparent (the app
// paints the surface colour behind the SVG).
const TARGET_FILL = '#b8e653'
const TARGET_STROKE = '#0c0e06'
const CONTEXT_FILL = '#2c2c34'
const CONTEXT_STROKE = '#474751'
const STROKE_W = 0.8

const load = (file) => {
  const topo = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/world-atlas', file), 'utf8'))
  return feature(topo, topo.objects.countries).features
}
const detailed = load('countries-50m.json')
const coarse = load('countries-110m.json')

// numeric ISO code (leading zeros stripped) -> iso2, plus a name fallback.
const byNumeric = new Map()
const byName = new Map()
for (const item of dictionary) {
  byNumeric.set(String(Number(item.isoNo)), item.iso2)
  byName.set(item.country, item.iso2)
}

// Natural Earth tags a few countries with numeric id "-99"; match those by name.
const NAME_OVERRIDES = {
  France: 'FR',
  Norway: 'NO',
  Kosovo: 'XK',
  Somaliland: null,
  'N. Cyprus': null,
}

function iso2For(f) {
  if (f.id && f.id !== '-99') {
    const hit = byNumeric.get(String(Number(f.id)))
    if (hit) return hit
  }
  const name = f.properties?.name
  if (name && name in NAME_OVERRIDES) return NAME_OVERRIDES[name]
  if (name && byName.has(name)) return byName.get(name)
  return undefined
}

const polygonsOf = (geometry) =>
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

const areaOf = (coords) => geoArea({ type: 'Polygon', coordinates: coords })

const round = (d) => d.replace(/-?\d+\.\d+/g, (m) => String(Math.round(+m * 10) / 10))

function contextMap(target) {
  // Focus the zoom on the target's largest landmass so a distant overseas
  // territory doesn't pull the whole map out to an ocean.
  const focus = polygonsOf(target.geometry).reduce((a, b) => (areaOf(a) >= areaOf(b) ? a : b))
  const focusGeo = { type: 'Polygon', coordinates: focus }
  const centre = geoCentroid(focusGeo)

  const side = HEIGHT / (1 + 2 * ZOOM)
  const offX = (WIDTH - side) / 2
  const offY = (HEIGHT - side) / 2
  const projection = geoMercator()
    .rotate([-centre[0], 0])
    .fitExtent([[offX, offY], [WIDTH - offX, HEIGHT - offY]], focusGeo)
  // Don't over-zoom tiny countries: cap the scale and re-centre on the target.
  if (projection.scale() > MAX_SCALE) {
    projection.scale(MAX_SCALE)
    const [cx, cy] = projection(centre)
    const [tx, ty] = projection.translate()
    projection.translate([tx + WIDTH / 2 - cx, ty + HEIGHT / 2 - cy])
  }
  projection.clipExtent([[0, 0], [WIDTH, HEIGHT]])
  const path = geoPath(projection)

  const targetD = path(target.geometry)
  if (!targetD) return null

  const targetIso = iso2For(target)
  let land = Math.abs(path.area(target.geometry))
  const parts = []
  for (const other of coarse) {
    if (iso2For(other) === targetIso) continue // don't draw a coarse copy under the target
    const d = path(other.geometry)
    if (d) {
      parts.push(`<path d="${round(d)}" fill="${CONTEXT_FILL}" stroke="${CONTEXT_STROKE}" stroke-width="${STROKE_W}"/>`)
      land += Math.abs(path.area(other.geometry))
    }
  }
  parts.push(`<path d="${round(targetD)}" fill="${TARGET_FILL}" stroke="${TARGET_STROKE}" stroke-width="1"/>`)

  // Sub-pixel microstates: drop a visible dot on the country's centre.
  const [[bx0, by0], [bx1, by1]] = path.bounds(target.geometry)
  const marked = Math.max(bx1 - bx0, by1 - by0) < MARKER_MIN
  if (marked) {
    const [mx, my] = projection(centre)
    const r = (n) => Math.round(n * 10) / 10
    parts.push(`<circle cx="${r(mx)}" cy="${r(my)}" r="${MARKER_R}" fill="${TARGET_FILL}" stroke="${TARGET_STROKE}" stroke-width="1"/>`)
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    parts.join('') +
    '</svg>\n'
  return { svg, land: land / (WIDTH * HEIGHT), marked }
}

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(OUT_DIR, { recursive: true })

const included = []
const marked = []
const sparse = []
const skipped = []
const seen = new Set()

for (const target of detailed) {
  const iso2 = iso2For(target)
  if (!iso2 || seen.has(iso2)) continue
  const map = contextMap(target)
  if (!map) {
    skipped.push(iso2)
    continue
  }
  seen.add(iso2)
  if (map.land < MIN_LAND) {
    sparse.push(`${iso2} ${(map.land * 100).toFixed(1)}%`)
    continue // too much open ocean to place by geography
  }
  writeFileSync(resolve(OUT_DIR, `${iso2.toLowerCase()}.svg`), map.svg)
  included.push(iso2)
  if (map.marked) marked.push(iso2)
}

included.sort()

const manifest =
  '// Auto-generated by scripts/generate-outlines.mjs — do not edit by hand.\n' +
  '// Countries that have a context map in public/outlines/.\n' +
  `export const OUTLINES = new Set(${JSON.stringify(included)})\n`
writeFileSync(resolve(ROOT, 'src/outlines.js'), manifest)

const missing = dictionary
  .map((d) => d.iso2)
  .filter((iso) => !seen.has(iso))
  .sort()

console.log(`Wrote ${included.length} context maps to public/outlines/`)
console.log(`Marker dot (too small to draw) — ${marked.length}: ${marked.join(' ') || '—'}`)
console.log(`\nDictionary countries WITHOUT a map (${missing.length}): ${missing.join(' ') || '—'}`)
if (sparse.length) {
  console.log(`\nDropped — too much open ocean to place (${sparse.length}): ${sparse.join(', ')}`)
}
if (skipped.length) {
  console.log(`Skipped (empty geometry): ${skipped.join(' ')}`)
}
