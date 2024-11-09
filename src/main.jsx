import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import './index.scss'

import Welcome from './components/Welcome'
import Question from './components/Question'

const Game = () => {
  const [mode, setMode] = useState(null)

  return (
    <>
      { mode
        ? <Question mode={mode} setMode={setMode} />
        : <Welcome setMode={setMode} />
      }
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <Game />
)
