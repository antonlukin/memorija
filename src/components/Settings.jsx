import { useState } from 'react'
import styles from './Settings.module.scss'

import { IconArrowLeft, IconCheck } from './icons'
import { CONTINENTS, ROUND_STOPS, getSettings, setRegions, setRound } from '../storage'

function Settings({ onBack }) {
  const [regions, setRegionsState] = useState(() => getSettings().regions)
  const [round, setRoundState] = useState(() => getSettings().round)

  const toggle = (key) => {
    const next = regions.includes(key)
      ? regions.filter((item) => item !== key)
      : [...regions, key]
    setRegionsState(setRegions(next))
  }

  const changeRound = (index) => {
    setRoundState(setRound(ROUND_STOPS[index]))
  }

  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <button className={styles.back} onClick={onBack} aria-label="Back to menu"><IconArrowLeft /></button>
        <span className={styles.mode}>Settings</span>
      </header>

      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.heading}>Practice regions</h2>
          <p className={styles.hint}>Only selected regions appear in quizzes</p>
          <div className={styles.regions}>
            {CONTINENTS.map((item) => {
              const on = regions.includes(item.key)
              return (
                <button
                  key={item.key}
                  className={on ? `${styles.region} ${styles.regionOn}` : styles.region}
                  onClick={() => toggle(item.key)}
                  aria-pressed={on}
                >
                  <span className={styles.regionName}>{item.label}</span>
                  <span className={on ? `${styles.box} ${styles.boxOn}` : styles.box}>
                    {on && <IconCheck />}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Round length</h2>
          <p className={styles.hint}>How many questions per round</p>
          <div className={styles.slider}>
            <input
              type="range"
              min={0}
              max={ROUND_STOPS.length - 1}
              step={1}
              value={ROUND_STOPS.indexOf(round)}
              onChange={(event) => changeRound(Number(event.target.value))}
              aria-label="Round length"
            />
            <span className={styles.sliderValue}>{round === 0 ? 'All' : round}</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>About</h2>
          <p className={styles.about}>
            Memorija is a flag &amp; geography trainer. Learn the world&apos;s flags, countries and
            capitals through quick quizzes, master each country, and unlock achievements as you go.
          </p>
          <p className={styles.about}>
            Your progress is saved on this device. No account, no internet required.
          </p>
        </section>
      </div>
    </div>
  )
}

export default Settings
