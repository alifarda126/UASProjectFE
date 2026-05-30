/* ENTRY POINT: File utama React yang di-render ke DOM  */

// SPA Redirect Handler (Cloudflare Pages 404 fallback) 
// Ketika user refresh di /login atau /dashboard, Cloudflare Pages
// menyajikan 404.html yang menyimpan path asli ke sessionStorage,
// lalu redirect ke /. Di sini kita restore path-nya sebelum React render.
(function() {
  var redirect = sessionStorage.getItem('spa_redirect');
  if (redirect) {
    sessionStorage.removeItem('spa_redirect');
    window.history.replaceState(null, '', redirect);
  }
})();

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