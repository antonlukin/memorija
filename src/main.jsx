import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Game from './components/Game'
import './index.scss'

createRoot(document.getElementById('root')).render(
  <Game />
)
