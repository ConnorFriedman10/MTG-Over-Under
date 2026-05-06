import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import IntroPage from './MainComponents/IntroPage.jsx'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'

const root = createRoot(document.getElementById('root'))
root.render(
  //<StrictMode>
    <BrowserRouter>
      <IntroPage />
      <Analytics />
    </BrowserRouter>
  //</StrictMode>,
)
