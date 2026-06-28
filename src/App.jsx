import { useState } from 'react'

import Welcome from './components/Welcome'
import Question from './components/Question'
import Achievements from './components/Achievements'
import Stats from './components/Stats'
import Settings from './components/Settings'

function App() {
  const [mode, setMode] = useState(null)
  const [screen, setScreen] = useState(null)

  if (screen === 'achievements') {
    return <Achievements onBack={() => setScreen(null)} />
  }

  if (screen === 'stats') {
    return <Stats onBack={() => setScreen(null)} />
  }

  if (screen === 'settings') {
    return <Settings onBack={() => setScreen(null)} />
  }

  if (mode) {
    return <Question mode={mode} setMode={setMode} />
  }

  return (
    <Welcome
      setMode={setMode}
      onAchievements={() => setScreen('achievements')}
      onStats={() => setScreen('stats')}
      onSettings={() => setScreen('settings')}
    />
  )
}

export default App
