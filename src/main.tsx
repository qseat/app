import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Theme before first paint, so there is no flash of the wrong palette.
try {
  const saved = localStorage.getItem('qseat-theme')
  document.documentElement.dataset.theme = saved ?? 'nocturne'
} catch {
  document.documentElement.dataset.theme = 'nocturne'
}

// First run sends the guest through the introduction once.
try {
  if (!localStorage.getItem('qseat-seen-intro') && location.pathname === '/') {
    localStorage.setItem('qseat-seen-intro', '1')
    history.replaceState(null, '', '/intro')
  }
} catch {
  /* private mode — skip the intro rather than fail */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
