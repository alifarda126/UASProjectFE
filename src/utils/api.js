/* KONFIGURASI AXIOS: Instance HTTP client untuk komunikasi dengan backend MoneFlo  */
import axios from 'axios';

/**
 * Deteksi Safari browser.
 * Safari (iOS & macOS) menerapkan ITP (Intelligent Tracking Prevention) yang memblokir
 * cross-site httpOnly cookie meski sudah SameSite=None; Secure.
 * Solusi: gunakan localStorage token + Authorization Bearer header sebagai fallback.
 */
const isSafari = () => {
  const ua = navigator.userAgent;
  // Safari: ada "Safari" tapi tidak ada "Chrome" atau "Chromium" (Chrome pakai engine Blink)
  return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgA|OPiOS/i.test(ua);
};

/** Key localStorage untuk menyimpan token fallback Safari */
const SAFARI_TOKEN_KEY = 'mf_safari_token';

/** Simpan token untuk Safari fallback */
export const saveSafariToken = (token) => {
  try { localStorage.setItem(SAFARI_TOKEN_KEY, token); } catch (_) {}
};

/** Hapus token Safari (saat logout) */
export const clearSafariToken = () => {
  try { localStorage.removeItem(SAFARI_TOKEN_KEY); } catch (_) {}
};

/** Ambil token Safari dari localStorage */
export const getSafariToken = () => {
  try { return localStorage.getItem(SAFARI_TOKEN_KEY); } catch (_) { return null; }
};

/**
 * Instance axios yang sudah dikonfigurasi:
 * - baseURL: URL backend dari environment variable
 * - withCredentials: true → WAJIB agar browser mengirim httpOnly cookie
 * - Content-Type: application/json
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,   // Kirim httpOnly cookie di setiap request
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30000, // Timeout 30 detik (Railway cold start bisa lambat)
});

/* REQUEST INTERCEPTOR  */
api.interceptors.request.use(
  (config) => {
    // Safari ITP Fix: inject Bearer token jika browser adalah Safari
    // dan token tersedia di localStorage (cookie diblokir oleh ITP)
    if (isSafari()) {
      const token = getSafariToken();
      if (token && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* RESPONSE INTERCEPTOR  */
api.interceptors.response.use(
  // Jika sukses, langsung kembalikan response
  (response) => response,

  // Jika error, handle berdasarkan status code
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token tidak valid atau kadaluarsa — redirect ke login
      // Cek apakah bukan dari halaman login itu sendiri (hindari loop)
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/auth/callback')) {
        // Hapus state lokal jika ada
        clearSafariToken(); // Bersihkan Safari token jika ada
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    if (status === 403) {
      // Forbidden — akses ditolak
      console.warn('MoneFlo API: Akses ditolak (403)');
    }

    if (status === 500) {
      // Server error
      console.error('MoneFlo API: Server error (500)', error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default api;
