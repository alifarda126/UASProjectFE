/* KOMPONEN LAYOUT: Topbar User  */
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getInitials } from '../../utils/formatters';

const PAGE_TITLES = {
  beranda:    'Beranda',
  transaksi:  'Transaksi',
  laporan:    'Laporan',
  anggota:    'Manajemen Anggota',
  pengaturan: 'Pengaturan',
  profil:     'Profil Organisasi',
};

export default function Topbar({ currentPage, onOpenModal, onToggleSidebar, unreadCount }) {
  const navigate = useNavigate();
  const { state, user, organisasi } = useApp();
  const { profile } = state;

  // Baca cache agar Topbar langsung tampil saat refresh (sebelum API selesai)
  const cachedOrg = (() => {
    try { return JSON.parse(localStorage.getItem('mf_org_cache') || '{}'); }
    catch { return {}; }
  })();

  // Gunakan data dari API jika ada, fallback ke cache, lalu ke state lokal
  const displayName  = organisasi?.name     || profile.name  || cachedOrg.name     || '';
  const displayType  = organisasi?.type     || profile.type  || cachedOrg.type     || '';
  const displayPhoto = organisasi?.logo_url || profile.photo || cachedOrg.logo_url || null;
  const initials     = getInitials(displayName);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-neutral-light/50 flex-shrink-0 no-print">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-dark hover:bg-neutral-100 transition-colors"
          >
            <i className="fas fa-bars text-sm" />
          </button>
          <div>
            <h2 className="font-semibold text-primary text-lg leading-tight">{PAGE_TITLES[currentPage] || 'Beranda'}</h2>
            {currentPage === 'beranda' && profile.name && (
              <p className="text-xs text-neutral mt-0.5 leading-tight">
                Selamat datang di dashboard{' '}
                <span className="font-semibold text-primary">
                  {profile.type ? `${profile.type} ${profile.name}` : profile.name}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => onOpenModal('notif')}
              className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-dark hover:bg-neutral-100 transition-colors relative"
            >
              <i className="fas fa-bell text-sm" />
              {unreadCount > 0 && (
                <span className="notif-badge absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Profile button */}
          <button
            type="button"
            onClick={() => navigate('/dashboard/profil')}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-neutral-50 transition-colors"
          >

            <div className="profile-photo-sm bg-primary flex items-center justify-center text-white text-xs font-bold">
              {displayPhoto
                ? <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
                : <span>{initials}</span>
              }
            </div>
            <span className="text-sm font-medium text-neutral-dark hidden sm:block">{displayName}</span>
            <i className="fas fa-chevron-down text-[10px] text-neutral" />
          </button>
        </div>
      </div>
    </header>
  );
}
