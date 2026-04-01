import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { SupervisorApp } from './components/SupervisorApp.tsx'
import './index.css'

// Detectar se é a rota do supervisor mobile
const isSupervisorRoute = window.location.pathname.startsWith('/supervisor');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isSupervisorRoute ? <SupervisorApp /> : <App />}
  </React.StrictMode>,
)
