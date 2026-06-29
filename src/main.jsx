import { createRoot } from 'react-dom/client'
import './index.scss'

import App from './App'

// Telegram Mini App: signal readiness and use the full height. Telegram keeps
// the --tg-safe-area-inset-* CSS variables updated on its own. No-op elsewhere.
const telegram = window.Telegram?.WebApp
if (telegram) {
  telegram.ready()
  telegram.expand?.()
}

createRoot(document.getElementById('root')).render(
  <App />
)
