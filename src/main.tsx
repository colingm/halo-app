import '@mantine/core/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// React Router SPA route changes are auto-detected by Pendo via History API hooks.
// Pendo initialization is deferred to Phase 6 (Pendo Install & Wiring).

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
