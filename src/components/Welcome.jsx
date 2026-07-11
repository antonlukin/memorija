import styles from './Welcome.module.scss'

import { IconTrophy, IconChart, IconGear } from './icons'
import { getAchievements } from '../storage'

const MODES = [
  {
    key: 'flag',
    label: 'Guess the country',
    hint: 'See a flag, pick the country',
    icon: <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" />,
  },
  {
    key: 'reverse',
    label: 'Guess the flag',
    hint: 'See a country, pick its flag',
    icon: <path d="M16 3h5v5M4 20L20.2 3.8M21 16v5h-5M15 15l5.1 5.1M4 4l5 5" />,
  },
  {
    key: 'shape',
    label: 'Guess by shape',
    hint: 'See an outline, pick the country',
    icon: <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15" />,
  },
  {
    key: 'zen',
    label: 'Zen mode',
    hint: 'Flip the card, check yourself',
    icon: <circle cx="12" cy="12" r="9" />,
  },
  {
    key: 'capital',
    label: 'Guess the capital',
    hint: 'See a country, pick its capital',
    icon: <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  },
]

function Welcome({ setMode, onAchievements, onStats, onSettings }) {
  const achievements = getAchievements()
  const unlocked = achievements.filter((item) => item.unlocked).length

  return (
    <div className={styles.welcome}>
      <div className={styles.actions}>
        <button className={styles.iconButton} onClick={onSettings} aria-label="Settings">
          <IconGear />
        </button>

        <div className={styles.actionsRight}>
          <button className={styles.iconButton} onClick={onStats} aria-label="Statistics">
            <IconChart />
          </button>
          <button className={styles.trophy} onClick={onAchievements} aria-label="Achievements">
            <IconTrophy />
            <span className={styles.trophyCount}>{unlocked}<i>/{achievements.length}</i></span>
          </button>
        </div>
      </div>

      <div className={styles.center}>
        <header className={styles.head}>
          <h1 className={styles.title}>Memorija</h1>
          <p className={styles.subtitle}>Flags · countries · capitals</p>
        </header>

        <div className={styles.options}>
        {MODES.map((item) => (
          <button key={item.key} className={styles.button} onClick={() => setMode(item.key)}>
            <span className={styles.icon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {item.icon}
              </svg>
            </span>

            <span className={styles.text}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.hint}>{item.hint}</span>
            </span>

            <span className={styles.chevron}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </span>
          </button>
        ))}
        </div>
      </div>
    </div>
  )
}

export default Welcome
