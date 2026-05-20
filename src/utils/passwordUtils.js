/* ── FUNGSI UTILITY: Konstanta dan pengecekan sandi ── */
export function getPasswordStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

export const STRENGTH_COLORS = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#00695C'];
export const STRENGTH_LABELS = ['Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
