import { useState, useEffect } from 'react'
import styles from './Question.module.scss'

import Button from './Button'

import dictionary from '../dictionary'

function Question({ mode, setMode }) {
  const [current, setCurrent] = useState(null);
  const [repeats, setRepeats] = useState([]);
  const [answer, setAnswer] = useState(false);

  useEffect(() => {
    const search = dictionary.filter((result) => !repeats.includes(result.iso2))
    const result = search[Math.floor(Math.random() * search.length)]

    console.log(repeats)
    setCurrent(result)
  }, [repeats]);

  const showAnswer = () => {
    setAnswer(true)
  }

  const nextQuestion = () => {
    setAnswer(false)
    setRepeats([...repeats, current.iso2])
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
                <img src={`./flags/${current.iso2.toLowerCase()}.svg`} alt={current.country} />
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

          <div className={styles.manage}>
            {answer &&
              <>
                <Button onClick={nextQuestion}>Next question</Button>
                <Button isWarning={true} onClick={nextQuestion}>I was wrong</Button>
              </>
            }

            {!answer &&
              <>
                <Button isPrimary={true} onClick={showAnswer}>Show answer</Button>
              </>
            }
          </div>
        </div>
      }
    </>
  )
}

export default Question