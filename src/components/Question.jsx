import { useState, useEffect } from 'react'
import styles from './Question.module.scss'

import dictionary from '../dictionary.json'

function Question({ mode, setMode }) {
  const [current, setCurrent] = useState(null);
  const [repeats, setRepeats] = useState([]);
  const [answer, setAnswer] = useState(false);

  useEffect(() => {
    const search = dictionary.filter((result) => !repeats.includes(result.code))
    const result = search[Math.floor(Math.random() * search.length)]

    console.log(repeats)
    setCurrent(result)
  }, [repeats]);

  const showAnswer = () => {
    setAnswer(true)
  }

  const nextQuestion = () => {
    setAnswer(false)
    setRepeats([...repeats, current.code])
  }

  const classes = [styles.question]

  if (!answer) {
    classes.push(styles.hidden)
  }

  return (
    <>
      {current &&
        <div className={classes.join(' ')}>
          {mode === 'flag' &&
            <>
              <figure className={styles.picture}>
                <img src={`./flags/${current.code}.svg`} alt={current.country} />
              </figure>

              {answer &&
                <>
                  <p className={styles.title}>{current.country}</p>
                  <p className={styles.subtitle}>{current.capital}</p>
                </>
              }

              {!answer &&
                <>
                  <p className={styles.help}>Try to guess the country and its capital before viewing the result</p>
                </>
              }
            </>
          }

          {answer
            ? <button className={styles.button} onClick={nextQuestion}>Next question</button>
            : <button className={styles.button + ' ' + styles.result} onClick={showAnswer}>Check result</button>
          }
        </div>
      }
    </>
  )
}

export default Question