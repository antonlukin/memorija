import { useState, useEffect } from 'react'
import styles from './Question.module.scss'

import Button from './Button'
import { IconArrowLeft, IconCheck, IconCross, IconGlobe, IconPin, IconTrophy } from './icons'

import dictionary from '../dictionary'
import { buildSession } from '../helpers'
import {
  recordCountry,
  recordCapital,
  getProgress,
  getCapitalProgress,
  getSummary,
  getCapitalSummary,
  getSettings,
} from '../storage'

const TITLES = {
  flag: 'Guess the country',
  reverse: 'Guess the flag',
  tricky: 'Tricky flags',
  zen: 'Zen mode',
  capital: 'Guess the capital',
}

function Flag({ iso2, country }) {
  return <img src={`./flags/${iso2.toLowerCase()}.svg`} alt={country} width="640" height="480" />
}

function Question({ mode, setMode }) {
  const newSession = () => {
    const settings = getSettings()
    const progress = mode === 'capital' ? getCapitalProgress() : getProgress()
    return buildSession(mode, dictionary, progress, settings.regions, settings.round)
  }

  const [session, setSession] = useState(newSession)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [missed, setMissed] = useState([])
  const [queue, setQueue] = useState([])

  useEffect(() => {
    if (!queue.length) {
      return
    }
    const timer = setTimeout(() => setQueue((prev) => prev.slice(1)), 2200)
    return () => clearTimeout(timer)
  }, [queue])

  // Warm the browser cache with this round's flags so they appear instantly.
  useEffect(() => {
    const isos = new Set()
    for (const item of session) {
      if (mode === 'reverse') {
        item.options.forEach((option) => isos.add(option.iso2))
      } else if (mode !== 'capital') {
        isos.add(item.current.iso2)
      }
    }
    isos.forEach((iso) => {
      const img = new Image()
      img.src = `./flags/${iso.toLowerCase()}.svg`
    })
  }, [session, mode])

  const total = session.length
  const finished = index >= total

  const enqueue = (toasts) => {
    if (toasts.length) {
      setQueue((prev) => [...prev, ...toasts])
    }
  }

  const achievementToasts = (newAchievements) =>
    newAchievements.map((achievement) => ({
      kind: 'achievement',
      title: achievement.title,
      note: 'Achievement unlocked',
    }))

  const playAgain = () => {
    setSession(newSession())
    setIndex(0)
    setSelected(null)
    setRevealed(false)
    setCorrect(0)
    setStreak(0)
    setBestStreak(0)
    setMissed([])
  }

  if (finished) {
    const accuracy = total ? Math.round((correct / total) * 100) : 0
    return (
      <div className={styles.screen}>
        <div className={styles.top}>
          <header className={styles.bar}>
            <button className={styles.back} onClick={() => setMode(null)} aria-label="Back to menu"><IconArrowLeft /></button>
            <span className={styles.mode}>{TITLES[mode]}</span>
          </header>
        </div>

        <div className={styles.results}>
          <div className={styles.resultHero}>
            <span className={styles.resultScore}>{correct}<i>/{total}</i></span>
            <span className={styles.resultLabel}>Round complete</span>
          </div>

          <div className={styles.resultMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaValue}>{accuracy}%</span>
              <span className={styles.metaName}>Accuracy</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaValue}>{bestStreak}</span>
              <span className={styles.metaName}>Best streak</span>
            </div>
          </div>

          {missed.length > 0 &&
            <div className={styles.review}>
              <h2 className={styles.reviewHead}>Review</h2>
              <div className={styles.reviewGrid}>
                {missed.map((item) => (
                  <div key={item.iso2} className={styles.reviewItem}>
                    <span className={styles.reviewFlag}><Flag iso2={item.iso2} country={item.country} /></span>
                    <span className={styles.reviewText}>
                      <span className={styles.reviewName}>{item.country}</span>
                      {mode === 'capital' &&
                        <span className={styles.reviewSub}>{item.capital}</span>
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          }
        </div>

        <div className={`${styles.manage} ${styles.manageZen}`}>
          <Button isPrimary={true} onClick={playAgain}>Play again</Button>
          <Button onClick={() => setMode(null)}>Back to menu</Button>
        </div>
      </div>
    )
  }

  const { current, options } = session[index]
  const answered = selected !== null

  const applyResult = (isCorrect) => {
    const nextStreak = isCorrect ? streak + 1 : 0
    setStreak(nextStreak)
    setBestStreak((value) => Math.max(value, nextStreak))

    if (isCorrect) {
      setCorrect((value) => value + 1)
    } else {
      setMissed((value) => [...value, current])
    }

    // Zen mode is self-assessed, so it never affects progress or achievements.
    if (mode === 'zen') {
      return
    }

    if (mode === 'capital') {
      const { justMastered, newAchievements } = recordCapital(current.iso2, isCorrect, nextStreak)
      const toasts = []
      if (justMastered) {
        const summary = getCapitalSummary()
        toasts.push({ kind: 'capital', title: `${current.capital} mastered!`, note: `${summary.mastered} / ${summary.total} capitals` })
      }
      enqueue([...toasts, ...achievementToasts(newAchievements)])
      return
    }

    const { justMastered, newAchievements } = recordCountry(current.iso2, isCorrect, nextStreak)
    const toasts = []
    if (justMastered) {
      const summary = getSummary()
      toasts.push({ kind: 'mastery', title: `${current.country} mastered!`, note: `${summary.mastered} / ${summary.total} countries` })
    }
    enqueue([...toasts, ...achievementToasts(newAchievements)])
  }

  const advance = () => {
    setIndex((value) => value + 1)
    setSelected(null)
    setRevealed(false)
  }

  const onSelect = (iso2) => {
    if (answered) {
      return
    }
    setSelected(iso2)
    applyResult(iso2 === current.iso2)
  }

  const resolveZen = (guessed) => {
    applyResult(guessed)
    advance()
  }

  const stateClass = (option) => {
    if (!answered) {
      return ''
    }
    if (option.iso2 === current.iso2) {
      return styles.correct
    }
    if (option.iso2 === selected) {
      return styles.wrong
    }
    return styles.muted
  }

  const renderMark = (option) => {
    if (!answered) {
      return null
    }
    if (option.iso2 === current.iso2) {
      return <span className={`${styles.mark} ${styles.markOk}`}><IconCheck /></span>
    }
    if (option.iso2 === selected) {
      return <span className={`${styles.mark} ${styles.markNo}`}><IconCross /></span>
    }
    return null
  }

  // Tricky shows one flag and offers look-alike country names as options.
  const showFlag = mode === 'flag' || mode === 'zen' || mode === 'tricky'
  const flagOptions = mode === 'reverse'
  const toast = queue[0]

  return (
    <div className={styles.screen}>
      {toast &&
        <div className={styles.toast} key={`${toast.kind}-${toast.title}`}>
          <span className={styles.toastIcon}>
            {toast.kind === 'achievement' ? <IconTrophy /> : toast.kind === 'capital' ? <IconPin /> : <IconGlobe />}
          </span>
          <span className={styles.toastText}>
            <span className={styles.toastTitle}>{toast.title}</span>
            <span className={styles.toastNote}>{toast.note}</span>
          </span>
        </div>
      }

      <div className={styles.top}>
        <header className={styles.bar}>
          <button className={styles.back} onClick={() => setMode(null)} aria-label="Back to menu"><IconArrowLeft /></button>
          <span className={styles.mode}>{TITLES[mode]}</span>
          <span className={styles.score}><IconCheck />{correct}</span>
        </header>

        <div className={styles.section}>
          <div className={styles.sectionBar}>
            <div className={styles.sectionFill} style={{ width: `${total ? Math.round((index / total) * 100) : 0}%` }} />
          </div>
          <span className={styles.sectionCount}>{index + 1}/{total}</span>
        </div>
      </div>

      <div className={styles.stage} key={current.iso2}>
        <div className={styles.prompt}>
          {showFlag &&
            <figure className={styles.picture}>
              <Flag iso2={current.iso2} country={current.country} />
            </figure>
          }

          {!showFlag &&
            <p className={styles.country}>{current.country}</p>
          }
        </div>

        {mode === 'zen' &&
          <div className={revealed ? styles.reveal : `${styles.reveal} ${styles.blurred}`}>
            <p className={styles.title}>{current.country}</p>
            <p className={styles.subtitle}>{current.capital}</p>
          </div>
        }

        {mode !== 'zen' &&
          <div className={flagOptions ? styles.flagGrid : styles.list}>
            {options.map((option) => (
              <button
                key={option.iso2}
                className={`${styles.option} ${stateClass(option)}`}
                onClick={() => onSelect(option.iso2)}
                disabled={answered}
              >
                {flagOptions
                  ? <Flag iso2={option.iso2} country={option.country} />
                  : <span className={styles.label}>{mode === 'capital' ? option.capital : option.country}</span>
                }
                {renderMark(option)}
              </button>
            ))}
          </div>
        }
      </div>

      <div className={mode === 'zen' ? `${styles.manage} ${styles.manageZen}` : styles.manage}>
        {mode === 'zen' && !revealed &&
          <Button isPrimary={true} onClick={() => setRevealed(true)}>Show answer</Button>
        }

        {mode === 'zen' && revealed &&
          <>
            <Button isPrimary={true} onClick={() => resolveZen(true)}>I guessed it</Button>
            <Button isWarning={true} onClick={() => resolveZen(false)}>I was wrong</Button>
          </>
        }

        {mode !== 'zen' && answered &&
          <Button isPrimary={true} onClick={advance}>Next question</Button>
        }
      </div>
    </div>
  )
}

export default Question
