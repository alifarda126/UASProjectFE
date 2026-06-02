/* ENTRY POINT: File utama React yang di-render ke DOM  */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AppProvider }    from './context/AppContext.jsx'
import { ToastProvider }  from './context/ToastContext.jsx'
import { SystemProvider } from './context/SystemContext.jsx'
import { AdminProvider }  from './context/AdminContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SystemProvider>
        <AdminProvider>
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </AdminProvider>
      </SystemProvider>
    </BrowserRouter>
  </StrictMode>,
)