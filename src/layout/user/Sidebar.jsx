/* KOMPONEN LAYOUT: Sidebar Navigasi User  */
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getInitials } from '../../utils/formatters';
import logoProject2 from '../../assets/MoneFloLogo2.webp';

const NAV_ITEMS = [
  { page: 'beranda',    icon: 'fa-home',         label: 'Beranda',    path: '/dashboard' },
  { page: 'transaksi',  icon: 'fa-exchange-alt',  label: 'Transaksi',  path: '/dashboard/transaksi' },
  { page: 'laporan',    icon: 'fa-chart-pie',     label: 'Laporan',    path: '/dashboard/laporan' },
  { page: 'anggota',   icon: 'fa-users',          label: 'Anggota',    path: '/dashboard/anggota' },
  { page: 'pengaturan', icon: 'fa-cog',           label: 'Pengaturan', path: '/dashboard/pengaturan' },
];

export default function Sidebar({ onOpenModal, isOpen, onToggle }) {
  const navigate = useNavigate();
  const { state, organisasi, logout } = useApp();
  const { profile } = state;

  // Baca cache dari localStorage agar Sidebar langsung tampil saat refresh
  // (sebelum API fetchUser() selesai)
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
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay fixed inset-0 bg-black/40 z-[45] lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside className={`sidebar bg-primary ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/15 p-0.5">
              <img src={logoProject2} alt="MoneFlo Logo" className="w-full h-full object-contain rounded-md" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight">MoneFlo</h1>
              <p className="text-white/40 text-[10px] tracking-wider uppercase">Keuangan Organisasi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ page, icon, label, path }) => (
            <NavLink
              key={page}
              to={path}
              end={path === '/dashboard'}
              onClick={onToggle}
              className={({ isActive }) =>
                `nav-item w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 transition-colors ${
                  isActive ? 'active bg-white/10 text-white font-medium' : 'hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <i className={`fas ${icon} w-5 text-center`} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Add Transaction Button */}
        <div className="px-4 pb-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => onOpenModal('tambah')}
            className="btn-pulse w-full flex items-center justify-center gap-2 py-3 bg-tertiary text-white rounded-xl text-sm font-semibold hover:bg-tertiary-light transition-colors"
          >
            <i className="fas fa-plus" /> Tambah Transaksi
          </button>
        </div>

        {/* Org Card */}
        <div className="px-4 pb-5 flex-shrink-0">
          <div className="org-card-clickable bg-white/10 rounded-xl p-3.5" onClick={() => onOpenModal('orgInfo')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary/40 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                {displayPhoto
                  ? <img src={displayPhoto} alt="" className="w-full h-full object-cover" />
                  : <span>{initials}</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                <p className="text-white/40 text-[11px]">{displayType || 'Akun Organisasi'}</p>
              </div>
              <i className="fas fa-chevron-up text-white/30 text-[10px] flex-shrink-0" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
