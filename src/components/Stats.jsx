import { useState } from 'react'
import styles from './Stats.module.scss'

import Progress from './Progress'
import { IconArrowLeft, IconCross } from './icons'

import { getHardest, resetProgress } from '../storage'

function Flag({ iso2, country }) {
  return <img src={`./flags/${iso2.toLowerCase()}.svg`} alt={country} />
}

function Stats({ onBack }) {
  const [tick, setTick] = useState(0)
  const hardest = getHardest(8)

  const reset = () => {
    if (window.confirm('Reset all statistics?\n\nThis also erases your achievements and cannot be undone.')) {
      resetProgress()
      setTick((value) => value + 1)
    }
  }

  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <button className={styles.back} onClick={onBack} aria-label="Back to menu"><IconArrowLeft /></button>
        <span className={styles.mode}>Statistics</span>
      </header>

      <div className={styles.body}>
        <section className={styles.section}>
          <h2 className={styles.heading}>Progress</h2>
          <Progress key={tick} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.heading}>Hardest countries</h2>
          {hardest.length === 0
            ? <p className={styles.empty}>No mistakes yet — keep playing to find your weak spots.</p>
            : <ul className={styles.hard}>
                {hardest.map((item) => (
                  <li key={item.iso2} className={styles.hardItem}>
                    <span className={styles.hardFlag}><Flag iso2={item.iso2} country={item.country} /></span>
                    <span className={styles.hardName}>{item.country}</span>
                    <span className={styles.hardWrong}><IconCross />{item.wrong}</span>
                  </li>
                ))}
              </ul>
          }
        </section>

        <section className={styles.section}>
          <button className={styles.reset} onClick={reset}>Reset statistics</button>
          <p className={styles.resetHint}>Erases all progress and achievements. This can&apos;t be undone.</p>
        </section>
      </div>
    </div>
  )
}

export default Stats
