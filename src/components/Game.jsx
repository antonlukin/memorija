import { useState } from 'react'
import styles from './Game.module.scss'

import Welcome from './Welcome'
import Question from './Question'

function Game() {
  const [rules, setRules] = useState(null)

  return (
    <main className={styles.game}>
      { rules
        ? <Question rules={rules} setRules={setRules} />
        : <Welcome setRules={setRules} />
      }
    </main>
  )
}

export default Game
