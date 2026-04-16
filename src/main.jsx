import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppShell } from './app-shell.jsx'
import { loadAuthRuntimeConfig } from './load-auth-runtime-config.js'

async function bootstrap() {
  await loadAuthRuntimeConfig({ baseUrl: import.meta.env.BASE_URL })

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AppShell />
    </React.StrictMode>,
  )
}

void bootstrap()
