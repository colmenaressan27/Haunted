import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {App} from './app/App'
import './ui/styles/app.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Falta #root en index.html')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
