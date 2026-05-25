import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

export const DEFAULTS = {
  appName:       'MoneFlo',
  tagline:       'Sistem Keuangan Organisasi',
  sidebarSub:    'Keuangan Organisasi',
  contactEmail:  'admin@moneflo.com',
  logoUrl:       null,
  logo2Url:      null,
  faviconUrl:    null,
  announcement:  '',
  registOpen:    true,
};

const SystemContext = createContext(null);

/* ── KOMPONEN PROVIDER: State Global Pengaturan Sistem ── */
/* Mengelola variabel yang bisa diubah Super Admin (branding, pendaftaran buka/tutup) */
export function SystemProvider({ children }) {
  const [settings, setSettings] = useState({ ...DEFAULTS });

  useEffect(() => {
    let lastSettingsStr = '';
    let abortController = null;

    const fetchSettings = () => {
      // Cancel request sebelumnya jika masih pending (hindari request menumpuk)
      if (abortController) abortController.abort();
      abortController = new AbortController();

      api.get('/settings', { signal: abortController.signal })
        .then(({ data }) => {
          abortController = null;
          if (data.data) {
            const newStr = JSON.stringify(data.data);

            if (!lastSettingsStr) {
              // Muat pertama kali
              lastSettingsStr = newStr;
              setSettings({ ...DEFAULTS, ...data.data });
            } else if (lastSettingsStr !== newStr) {
              // Data berubah
              if (sessionStorage.getItem('just_saved_settings')) {
                // Jika ini adalah browser admin yang baru saja menyimpan, abaikan reload
                sessionStorage.removeItem('just_saved_settings');
                lastSettingsStr = newStr;
                setSettings({ ...DEFAULTS, ...data.data });
              } else {
                // Browser user lain, otomatis refresh untuk menerima update baru
                window.location.reload();
              }
            }
          }
        })
        .catch(err => {
          // Abaikan error AbortError (request sengaja dibatalkan)
          if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
          // Abaikan timeout saat polling background — server mungkin cold start
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) return;
          console.warn('Settings poll gagal:', err.message);
        });
    };

    fetchSettings();
    // Polling tiap 60 detik — settings jarang berubah, tidak perlu tiap 5 detik
    const interval = setInterval(fetchSettings, 60000);

    return () => {
      clearInterval(interval);
      if (abortController) abortController.abort();
    };
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    sessionStorage.setItem('just_saved_settings', 'true');
    setSettings(newSettings);
    try {
      await api.post('/admin/settings', newSettings);
    } catch (err) {
      console.error("Gagal save settings:", err);
    }
  }, []);

  const resetSettings = useCallback(async () => {
    sessionStorage.setItem('just_saved_settings', 'true');
    setSettings({ ...DEFAULTS });
    try {
      await api.post('/admin/settings', DEFAULTS);
    } catch (err) {
      console.error("Gagal reset settings:", err);
    }
  }, []);

  return (
    <SystemContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  return useContext(SystemContext);
}
