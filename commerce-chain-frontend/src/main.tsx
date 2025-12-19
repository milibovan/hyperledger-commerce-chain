import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import ArchitectureDiagram from './components/reusables/ArchitectureDiagram.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* <ArchitectureDiagram /> */}
  </StrictMode>,
)
