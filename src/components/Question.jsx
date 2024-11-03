import { useState, useEffect } from 'react'
import styles from './Question.module.scss'

import dictionary from '../dictionary.json'

function Question({rules, setRules}) {
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

  return (
    <>
      {current &&
        <div className={styles.question}>
          {rules === 'flag' &&
            <div className={styles.group}>
              <figure className={styles.picture}>
                <img src={`./flags/${current.code}.svg`} alt={current.country} />
              </figure>

              {answer &&
                <div className={styles.results}>
                  <p className={styles.title}>{current.country}</p>
                  <p className={styles.subtitle}>{current.capital}</p>
                </div>
              }
            </div>
          }

          {answer
            ? <button className={styles.button} onClick={nextQuestion}>Next question</button>
            : <button className={styles.button} onClick={showAnswer}>Check result</button>
          }
        </div>
      }
    </>
  )
}

export default Question