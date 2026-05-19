/* ── CUSTOM HOOK: useAuth — akses mudah ke state autentikasi dari AppContext ── */
import { useApp } from '../context/AppContext';

/**
 * useAuth — Shortcut hook untuk data dan aksi autentikasi.
 *
 * @returns {object} state dan method autentikasi dari AppContext
 *
 * Penggunaan:
 *   const { user, isAuthenticated, isLoading, loginWithGoogle, logout } = useAuth();
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithGoogle,
    logout,
    fetchUser,
    updateUser,
    changePassword,
    uploadAvatar,
    organisasi,
    organisasiList,
    setActiveOrganisasi,
  } = useApp();

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === 'admin',
    loginWithGoogle,
    logout,
    fetchUser,
    updateUser,
    changePassword,
    uploadAvatar,
    organisasi,
    organisasiList,
    setActiveOrganisasi,
  };
}

export default useAuth;
