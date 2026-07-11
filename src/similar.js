import dictionary from './dictionary'

// Groups of countries whose flags are commonly confused with each other.
const GROUPS = [
  ['RO', 'TD', 'MD', 'AD'],             // blue-yellow-red verticals (Romania / Chad …)
  ['ID', 'MC', 'PL'],                   // red & white two stripes
  ['RU', 'SK', 'SI', 'RS', 'HR'],       // pan-Slavic tricolors
  ['NL', 'LU'],                         // red-white-blue horizontal
  ['NO', 'IS', 'DK', 'SE', 'FI', 'FO'], // Nordic crosses
  ['AU', 'NZ', 'CK', 'TV', 'FJ'],       // blue ensigns / Southern Cross
  ['US', 'LR', 'MY'],                   // stars and stripes
  ['CO', 'EC', 'VE'],                   // Gran Colombia yellow-blue-red
  ['EG', 'IQ', 'SY', 'YE'],             // Arab red-white-black
  ['JO', 'PS', 'SD', 'EH'],             // Arab red triangle
  ['AE', 'KW'],                         // Arab horizontal with red hoist
  ['ML', 'GN', 'SN', 'CM'],             // African green-yellow-red verticals
  ['IT', 'MX', 'IE', 'CI'],             // green-white-red / orange verticals
  ['AR', 'UY', 'SV', 'NI', 'HN'],       // light-blue & white of the Americas
  ['QA', 'BH'],                         // serrated maroon / red
  ['TR', 'TN'],                         // red with white crescent and star
  ['CR', 'TH', 'KP'],                   // horizontal striped red-white-blue
  ['HU', 'BG'],                         // red-white-green horizontal
  ['BE', 'DE'],                         // black-yellow-red
  ['JP', 'BD', 'PW'],                   // single disc on a plain field
  ['CN', 'VN'],                         // red field with yellow star(s)
]

const byIso = {}
for (const country of dictionary) {
  byIso[country.iso2] = country
}

// Build a neighbour set per country (union across every group it appears in).
const neighbours = {}
for (const group of GROUPS) {
  for (const iso of group) {
    if (!byIso[iso]) {
      continue
    }
    neighbours[iso] = neighbours[iso] || new Set()
    for (const other of group) {
      if (other !== iso && byIso[other]) {
        neighbours[iso].add(other)
      }
    }
  }
}

// Return the look-alike countries for a flag, used to bias wrong answers in the
// flag-guessing modes toward visually confusable options.
export function similarCountries(iso2) {
  const set = neighbours[iso2]
  if (!set) {
    return []
  }
  return [...set].map((iso) => byIso[iso]).filter(Boolean)
}
