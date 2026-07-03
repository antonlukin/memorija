import { createRoot } from 'react-dom/client'

import '@fontsource/montserrat/latin-500.css'
import '@fontsource/montserrat/latin-600.css'
import '@fontsource/montserrat/latin-700.css'
import './index.scss'

import App from './App'

// Telegram Mini App integration (all guarded — no-op outside Telegram / on old clients).
const telegram = window.Telegram?.WebApp
if (telegram) {
  telegram.ready()
  try {
    telegram.expand?.()
    telegram.disableVerticalSwipes?.()          // don't close the app while scrolling
    telegram.setHeaderColor?.('#141416')        // match our dark background
    telegram.setBackgroundColor?.('#141416')
    telegram.setBottomBarColor?.('#141416')
  } catch {
    /* older Telegram client — ignore unsupported methods */
  }
}

createRoot(document.getElementById('root')).render(
  <App />
)
