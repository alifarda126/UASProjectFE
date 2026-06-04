import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

/**
 * Halaman yang menangani redirect callback dari Google OAuth.
 *
 * FIX: Setelah Google OAuth, AppContext mungkin sudah menjalankan fetchUser()
 * sebelum login (hasilnya isAuthenticated=false). Kita perlu memanggil fetchUser()
 * ulang agar state auth diperbarui dengan cookie baru dari Google.
 */
export default function OAuthCallback() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { fetchUser } = useAuth();
  const showToast   = useToast();
  const handled     = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const searchParams  = new URLSearchParams(location.search);
    const error         = searchParams.get('error');
    const errorMessage  = searchParams.get('message');
    const status        = searchParams.get('status');

    // 1. Error dari backend OAuth 
    if (error) {
      handled.current = true;
      let msg = 'Gagal login dengan Google';
      if (error === 'account_inactive') msg = 'Akun Anda telah dinonaktifkan';
      if (error === 'manual_account') msg = 'Akun ini terdaftar secara manual. Silakan login menggunakan email dan kata sandi Anda.';
      if (errorMessage && error !== 'manual_account') msg += `: ${decodeURIComponent(errorMessage)}`;
      showToast(msg, 'error');
      navigate('/login', { replace: true });
      return;
    }

    // 2. Akun Google belum terdaftar — arahkan ke halaman register dengan email ter-prefill
    if (status === 'needs_register') {
      handled.current = true;
      const email = searchParams.get('email') || '';
      showToast('Akun Google belum terdaftar. Silakan daftarkan organisasi Anda.', 'info');
      navigate(`/register?oauth=true&email=${encodeURIComponent(email)}`, { replace: true });
      return;
    }

    // 3. Sukses — panggil fetchUser() ulang untuk baca cookie baru 
    if (status === 'success') {
      handled.current = true;

      fetchUser()
        .then((data) => {
          // fetchUser() mengembalikan { user, organisasi } dari API
          const role = data?.user?.role;
          showToast('Login berhasil!', 'success');
          if (role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        })
        .catch(() => {
          showToast('Sesi tidak valid. Silakan coba lagi.', 'error');
          navigate('/login', { replace: true });
        })
        .finally(() => {});
      return;
    }

    // 4. Fallback: status tidak dikenal atau tidak ada — redirect ke login
    handled.current = true;
    showToast('Terjadi kesalahan saat autentikasi Google. Silakan coba lagi.', 'error');
    navigate('/login', { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-primary">Memproses Autentikasi...</h2>
        <p className="text-neutral mt-2">Mohon tunggu sebentar, Anda akan dialihkan.</p>
      </div>
    </div>
  );
}
