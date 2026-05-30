/* FUNGSI UTILITY: Pengecekan kekuatan kata sandi  */
export function getPasswordStrength(pw) {
  if (!pw) return -1;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

export const strengthColors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#00695C'];
export const strengthLabels  = ['Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
