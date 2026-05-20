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

    const fetchSettings = () => {
      api.get('/settings').then(({ data }) => {
        if (data.data) {
          const newStr = JSON.stringify(data.data);
          
          if (!lastSettingsStr) {
            // Muat pertama kali
            lastSettingsStr = newStr;
            setSettings({ ...DEFAULTS, ...data.data });
          } else if (lastSettingsStr !== newStr) {
            // Data berubah
            if (sessionStorage.getItem('just_saved_settings')) {
              // Jika ini adalah browser admin yang baru saja menyimpan, kita abaikan reload
              sessionStorage.removeItem('just_saved_settings');
              lastSettingsStr = newStr;
              setSettings({ ...DEFAULTS, ...data.data });
            } else {
              // Browser user lain, otomatis refresh untuk menerima update baru
              window.location.reload();
            }
          }
        }
      }).catch(err => console.error("Gagal load settings:", err));
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 5000); // Polling tiap 5 detik
    
    return () => clearInterval(interval);
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
