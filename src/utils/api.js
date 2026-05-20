/* ── KONFIGURASI AXIOS: Instance HTTP client untuk komunikasi dengan backend MoneFlo ── */
import axios from 'axios';

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
  timeout: 15000, // Timeout 15 detik
});

/* ── REQUEST INTERCEPTOR ── */
api.interceptors.request.use(
  (config) => {
    // Bisa tambahkan logic global sebelum request dikirim
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── RESPONSE INTERCEPTOR ── */
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
