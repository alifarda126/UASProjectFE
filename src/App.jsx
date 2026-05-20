/* ── KOMPONEN UTAMA (ROOT): Menangani routing aplikasi ── */
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import ConfirmDialog from './components/ConfirmDialog';
import { SkeletonBeranda, SkeletonTransaksi, SkeletonLaporan, SkeletonPage, SkeletonAdminDashboard } from './components/Skeleton';

// Auth — src/auth/user/
import LoginPage          from './auth/user/LoginPage';
import RegisterPage       from './auth/user/RegisterPage';
import ForgotPasswordPage from './auth/user/ForgotPasswordPage';
import OAuthCallback      from './auth/user/OAuthCallback';

// Layout — src/layout/user/
import Sidebar from './layout/user/Sidebar';
import Topbar  from './layout/user/Topbar';

// Dashboard Pages — src/dashboard/user/
import BerandaPage    from './dashboard/user/BerandaPage';
import TransaksiPage  from './dashboard/user/TransaksiPage';
import LaporanPage    from './dashboard/user/LaporanPage';
import AnggotaPage    from './dashboard/user/AnggotaPage';
import PengaturanPage from './dashboard/user/PengaturanPage';
import ProfilPage     from './dashboard/user/ProfilPage';
import SuspendedPage  from './dashboard/user/SuspendedPage';
import DeactivatedPage from './dashboard/user/DeactivatedPage';

// Modals — src/modals/user/
import TambahTransaksiModal from './modals/user/TambahTransaksiModal';
import EditTransaksiModal   from './modals/user/EditTransaksiModal';
import EditRealisasiModal   from './modals/user/EditRealisasiModal';
import AgendaModal          from './modals/user/AgendaModal';
import NotifikasiModal      from './modals/user/NotifikasiModal';
import OrgInfoModal         from './modals/user/OrgInfoModal';

// Admin — layout + dashboard
import AdminSidebar        from './layout/admin/AdminSidebar';
import AdminTopbar         from './layout/admin/AdminTopbar';
import DashboardAdminPage  from './dashboard/admin/DashboardAdminPage';
import OrganisasiPage      from './dashboard/admin/OrganisasiPage';
import LaporanAdminPage    from './dashboard/admin/LaporanAdminPage';
import SistemPage          from './dashboard/admin/SistemPage';
import ProfilKeamananPage  from './dashboard/admin/ProfilKeamananPage';

/* ============================================================
   CONTENT LOADER — skeleton saat auth check pertama kali
   ============================================================ */
function ContentLoader({ page }) {
  if (page === 'beranda')  return <SkeletonBeranda />;
  if (page === 'transaksi') return <SkeletonTransaksi />;
  if (page === 'laporan')  return <SkeletonLaporan />;
  if (page === 'dashboard') return <SkeletonAdminDashboard />;
  return <SkeletonPage />;
}

/* ============================================================
   ADMIN LAYOUT — dengan auth guard built-in + session timeout
   ============================================================ */
function AdminLayout() {
  const { isAuthenticated, isLoading, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTimeoutWarn, setShowTimeoutWarn] = useState(false);
  const currentPage = location.pathname.split('/').pop() || 'dashboard';

  // ✅ Session timeout — 30 menit tidak aktif
  useSessionTimeout({
    enabled: isAuthenticated,
    onWarning: () => setShowTimeoutWarn(true),
    onTimeout: () => { setShowTimeoutWarn(false); logout(); },
  });

  if (!isLoading && !isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isLoading && !isAdmin)         return <Navigate to="/dashboard" replace />;

  return (
    <div className="admin-layout h-screen overflow-hidden">
      <AdminSidebar currentPage={currentPage} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="admin-main-scroll">
        <AdminTopbar currentPage={currentPage} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="admin-content-scroll">
          <main className="p-4 lg:p-8">
            {isLoading ? <ContentLoader page={currentPage} /> : <Outlet />}
          </main>
        </div>
      </div>

      {/* ── Session Timeout Warning ── */}
      <ConfirmDialog
        isOpen={showTimeoutWarn}
        title="Sesi Akan Berakhir"
        message={'Anda telah meninggalkan tab ini cukup lama. Sesi akan otomatis berakhir. Klik "Tetap Masuk" untuk melanjutkan.'}
        confirmText="Tetap Masuk"
        cancelText="Keluar Sekarang"
        type="warning"
        onConfirm={() => setShowTimeoutWarn(false)}
        onCancel={() => { setShowTimeoutWarn(false); logout(); }}
      />
    </div>
  );
}

/* ============================================================
   USER LAYOUT — dengan auth guard built-in + session timeout
   ============================================================ */
function UserLayout() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { unreadCount, organisasi } = useApp();
  const location = useLocation();
  const [showTimeoutWarn, setShowTimeoutWarn] = useState(false);

  // ✅ Session timeout — 30 menit tidak aktif
  useSessionTimeout({
    enabled: isAuthenticated,
    onWarning: () => setShowTimeoutWarn(true),
    onTimeout: () => { setShowTimeoutWarn(false); logout(); },
  });

  if (!isLoading && !isAuthenticated)  return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isLoading && organisasi?.is_suspended) return <Navigate to="/dashboard/suspended" replace />;
  if (!isLoading && organisasi?.is_active === false && !organisasi?.is_suspended) return <Navigate to="/dashboard/deactivated" replace />;

  const pathParts   = location.pathname.split('/');
  const currentPage = pathParts.length > 2 ? pathParts[2] : 'beranda';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modals, setModals] = useState({
    tambah: false, editTxn: false, editReal: false,
    agenda: false, notif:   false, orgInfo:  false,
  });
  const [editTxnId,  setEditTxnId]  = useState(null);
  const [agendaData, setAgendaData] = useState(null);

  const openModal  = (name, data) => {
    if (name === 'editTxn') setEditTxnId(data);
    if (name === 'agenda')  setAgendaData(data || null);
    setModals((m) => ({ ...m, [name]: true }));
  };
  const closeModal = (name) => setModals((m) => ({ ...m, [name]: false }));

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <Sidebar currentPage={currentPage} onOpenModal={openModal} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="main-scroll flex-1 flex flex-col">
        <Topbar currentPage={currentPage} onOpenModal={openModal} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} unreadCount={unreadCount} />
        <div className="content-scroll flex-1">
          <main className="p-4 lg:p-8">
            {isLoading ? <ContentLoader page={currentPage} /> : <Outlet context={{ openModal }} />}
          </main>
        </div>
      </div>

      <TambahTransaksiModal isOpen={modals.tambah}   onClose={() => closeModal('tambah')} />
      <EditTransaksiModal   isOpen={modals.editTxn}  txnId={editTxnId} onClose={() => closeModal('editTxn')} />
      <EditRealisasiModal   isOpen={modals.editReal} onClose={() => closeModal('editReal')} />
      <AgendaModal          isOpen={modals.agenda}   agenda={agendaData} onClose={() => closeModal('agenda')} />
      <NotifikasiModal      isOpen={modals.notif}    onClose={() => closeModal('notif')} />
      <OrgInfoModal         isOpen={modals.orgInfo}  onClose={() => closeModal('orgInfo')} />

      {/* ── Session Timeout Warning ── */}
      <ConfirmDialog
        isOpen={showTimeoutWarn}
        title="Sesi Akan Berakhir"
        message={'Anda telah meninggalkan tab ini cukup lama. Sesi akan otomatis berakhir. Klik "Tetap Masuk" untuk melanjutkan.'}
        confirmText="Tetap Masuk"
        cancelText="Keluar Sekarang"
        type="warning"
        onConfirm={() => setShowTimeoutWarn(false)}
        onCancel={() => { setShowTimeoutWarn(false); logout(); }}
      />
    </div>
  );
}

/* Guard khusus untuk halaman suspended — tanpa layout */
function RequireSuspendedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { organisasi } = useApp();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!organisasi?.is_suspended) return <Navigate to="/dashboard" replace />;

  return <SuspendedPage />;
}

/* Guard khusus untuk halaman dinonaktifkan — tanpa layout */
function RequireDeactivatedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { organisasi } = useApp();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  // Jika tersuspend, arahkan ke suspended
  if (organisasi?.is_suspended) return <Navigate to="/dashboard/suspended" replace />;
  // Jika masih aktif, arahkan ke dashboard
  if (organisasi?.is_active !== false) return <Navigate to="/dashboard" replace />;

  return <DeactivatedPage />;
}

/* ============================================================
   MAIN APP ROUTER
   ============================================================ */
export default function App() {
  const { fetchUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Re-fetch user setelah login berhasil (misalnya OAuth callback)
    const handleLoginSuccess = () => fetchUser().catch(() => {});
    // Redirect ke login setelah logout
    const handleLogout = () => navigate('/login', { replace: true });
    
    window.addEventListener('auth:login_success', handleLoginSuccess);
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:login_success', handleLoginSuccess);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [fetchUser, navigate]);

  return (
    <>
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      
      {/* ROOT REDIRECT — arahkan ke dashboard, RequireAuth akan handle jika belum login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* USER DASHBOARD ROUTES — auth guard built-in di UserLayout */}
      <Route path="/dashboard" element={<UserLayout />}>
        <Route index element={<BerandaPage />} />
        <Route path="transaksi" element={<TransaksiPage />} />
        <Route path="laporan" element={<LaporanPage />} />
        <Route path="anggota" element={<AnggotaPage />} />
        <Route path="pengaturan" element={<PengaturanPage />} />
        <Route path="profil" element={<ProfilPage />} />
      </Route>

      {/* Halaman khusus untuk organisasi yang tersuspend/dinonaktifkan (tanpa UserLayout/sidebar) */}
      <Route path="/dashboard/suspended" element={<RequireSuspendedPage />} />
      <Route path="/dashboard/deactivated" element={<RequireDeactivatedPage />} />

      {/* ADMIN DASHBOARD ROUTES — auth guard built-in di AdminLayout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardAdminPage />} />
        <Route path="organisasi" element={<OrganisasiPage />} />
        <Route path="laporan" element={<LaporanAdminPage />} />
        <Route path="sistem" element={<SistemPage />} />
        <Route path="pengaturan" element={<ProfilKeamananPage />} />
      </Route>

      {/* CATCH ALL 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}
