// Achievement definitions evaluated against a stats snapshot:
//   { mastered, total, continents: [{key, mastered, total}], bestStreak, totalCorrect }

function continentOf(stats, key) {
  return stats.continents.find((item) => item.key === key) || { mastered: 0, total: 0 }
}

function continentAchievement(key, title) {
  return {
    id: `continent_${key.toLowerCase()}`,
    group: 'continent',
    title,
    desc: `Master every country in ${key}`,
    current: (s) => continentOf(s, key).mastered,
    target: (s) => continentOf(s, key).total,
  }
}

export const ACHIEVEMENTS = [
  { id: 'collect_1', group: 'collection', title: 'First Steps', desc: 'Master your first country', current: (s) => s.mastered, target: () => 1 },
  { id: 'collect_10', group: 'collection', title: 'Collector', desc: 'Master 10 countries', current: (s) => s.mastered, target: () => 10 },
  { id: 'collect_50', group: 'collection', title: 'Globetrotter', desc: 'Master 50 countries', current: (s) => s.mastered, target: () => 50 },
  { id: 'collect_100', group: 'collection', title: 'Cartographer', desc: 'Master 100 countries', current: (s) => s.mastered, target: () => 100 },
  { id: 'collect_200', group: 'collection', title: 'Globe Scholar', desc: 'Master 200 countries', current: (s) => s.mastered, target: () => 200 },
  { id: 'collect_all', group: 'collection', title: 'World Master', desc: 'Master every country', current: (s) => s.mastered, target: (s) => s.total },

  continentAchievement('Europe', 'Europe Master'),
  continentAchievement('Asia', 'Asia Master'),
  continentAchievement('Africa', 'Africa Master'),
  continentAchievement('Americas', 'Americas Master'),
  continentAchievement('Oceania', 'Oceania Master'),

  { id: 'capital_1', group: 'capital', title: 'Capital Beginner', desc: 'Master your first capital', current: (s) => s.capitalsMastered, target: () => 1 },
  { id: 'capital_25', group: 'capital', title: 'Capital Collector', desc: 'Master 25 capitals', current: (s) => s.capitalsMastered, target: () => 25 },
  { id: 'capital_100', group: 'capital', title: 'Capital Expert', desc: 'Master 100 capitals', current: (s) => s.capitalsMastered, target: () => 100 },
  { id: 'capital_all', group: 'capital', title: 'Capital Master', desc: 'Master every capital', current: (s) => s.capitalsMastered, target: (s) => s.capitalsTotal },

  { id: 'geo_1', group: 'geo', title: 'Explorer', desc: 'Locate your first country on the map', current: (s) => s.geoMastered, target: () => 1 },
  { id: 'geo_25', group: 'geo', title: 'Navigator', desc: 'Locate 25 countries on the map', current: (s) => s.geoMastered, target: () => 25 },
  { id: 'geo_100', group: 'geo', title: 'Pathfinder', desc: 'Locate 100 countries on the map', current: (s) => s.geoMastered, target: () => 100 },
  { id: 'geo_all', group: 'geo', title: 'Atlas', desc: 'Locate every country on the map', current: (s) => s.geoMastered, target: (s) => s.geoTotal },

  { id: 'streak_10', group: 'streak', title: 'On Fire', desc: 'Answer 10 in a row correctly', current: (s) => s.bestStreak, target: () => 10 },
  { id: 'streak_25', group: 'streak', title: 'Unstoppable', desc: 'Answer 25 in a row correctly', current: (s) => s.bestStreak, target: () => 25 },
  { id: 'streak_50', group: 'streak', title: 'Flawless Fifty', desc: 'Answer 50 in a row correctly', current: (s) => s.bestStreak, target: () => 50 },

  { id: 'volume_100', group: 'volume', title: 'Dedicated', desc: 'Answer 100 questions correctly', current: (s) => s.totalCorrect, target: () => 100 },
  { id: 'volume_500', group: 'volume', title: 'Veteran', desc: 'Answer 500 questions correctly', current: (s) => s.totalCorrect, target: () => 500 },
]

export function evaluate(stats) {
  return ACHIEVEMENTS.map((def) => {
    const target = def.target(stats)
    const current = Math.min(def.current(stats), target)
    return {
      id: def.id,
      group: def.group,
      title: def.title,
      desc: def.desc,
      current,
      target,
      unlocked: target > 0 && current >= target,
    }
  })
}

export function unlockedIds(stats) {
  return evaluate(stats).filter((item) => item.unlocked).map((item) => item.id)
}
