/**
 * useSessionTimeout — Auto-logout berdasarkan waktu MENINGGALKAN tab/window.
 *
 * Cara kerja:
 * - Saat user pergi (tab hidden / minimize / buka tab lain):
 *     → catat waktu pergi ke localStorage
 * - Saat user kembali (tab visible lagi):
 *     → hitung berapa lama mereka pergi
 *     → jika >= 30 menit → logout otomatis
 *     → jika >= 28 menit → tampilkan warning, lalu logout setelah 2 menit
 *     → jika < 28 menit  → lanjut, timer reset dari nol
 * - Timer TIDAK berjalan selama user aktif di halaman
 *
 * @param {object} opts
 * @param {boolean}    opts.enabled   - Aktifkan hanya saat sudah login
 * @param {function}   opts.onWarning - Dipanggil saat mendekati timeout
 * @param {function}   opts.onTimeout - Dipanggil saat sudah timeout → logout
 */
import { useEffect, useRef, useCallback } from 'react';

const TIMEOUT_MS  = 30 * 60 * 1000;  // 30 menit
const WARNING_MS  = 2  * 60 * 1000;  // Warning 2 menit sebelum logout
const STORAGE_KEY = 'mf_hidden_at';   // localStorage key

export function useSessionTimeout({ onWarning, onTimeout, enabled = true }) {
  const warningTimerRef = useRef(null);
  const logoutTimerRef  = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);
  }, []);

  /**
   * Jadwalkan warning dan logout berdasarkan sisa waktu yang ada.
   * msRemaining = berapa ms lagi sebelum 30 menit habis.
   */
  const scheduleFromNow = useCallback((msRemaining) => {
    clearTimers();

    const msUntilWarn = msRemaining - WARNING_MS;

    if (msUntilWarn <= 0) {
      // Sudah masuk zona warning — tampilkan segera
      onWarning?.();
      logoutTimerRef.current = setTimeout(() => {
        onTimeout?.();
      }, Math.max(0, msRemaining));
    } else {
      // Jadwalkan warning dulu, lalu logout
      warningTimerRef.current = setTimeout(() => {
        onWarning?.();
        logoutTimerRef.current = setTimeout(() => {
          onTimeout?.();
        }, WARNING_MS);
      }, msUntilWarn);
    }
  }, [clearTimers, onWarning, onTimeout]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ── User MENINGGALKAN tab ──────────────────────────────────────
        // Simpan waktu pergi, batalkan semua timer (tidak perlu hitung mundur)
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        clearTimers();
      } else {
        // ── User KEMBALI ke tab ───────────────────────────────────────
        const hiddenAtStr = localStorage.getItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);

        if (!hiddenAtStr) return; // Tidak ada catatan pergi → tidak apa-apa

        const hiddenAt    = parseInt(hiddenAtStr, 10);
        const awayMs      = Date.now() - hiddenAt;
        const msRemaining = TIMEOUT_MS - awayMs;

        if (msRemaining <= 0) {
          // Sudah >= 30 menit pergi → logout langsung
          onTimeout?.();
        } else {
          // Belum 30 menit → jadwalkan sisa waktu
          scheduleFromNow(msRemaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Cek saat komponen pertama mount (misal setelah hard-refresh) ──
    // Jika ada timestamp tersimpan dari sebelum refresh
    const storedHiddenAt = localStorage.getItem(STORAGE_KEY);
    if (storedHiddenAt) {
      localStorage.removeItem(STORAGE_KEY);
      const awayMs      = Date.now() - parseInt(storedHiddenAt, 10);
      const msRemaining = TIMEOUT_MS - awayMs;
      if (msRemaining <= 0) {
        // Sudah timeout sebelum refresh → logout
        setTimeout(() => onTimeout?.(), 0);
      } else {
        scheduleFromNow(msRemaining);
      }
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimers();
    };
  }, [enabled, clearTimers, scheduleFromNow, onTimeout]);
}
