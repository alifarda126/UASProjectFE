import { NavLink, useNavigate } from 'react-router-dom';
import { useSystem } from '../../context/SystemContext';
import defaultLogo2 from '../../assets/MoneFloLogo2.webp';

/* KONSTANTA: Daftar menu navigasi untuk sidebar Admin  */
const NAV = [
  { key: 'dashboard',  icon: 'fa-gauge-high',   label: 'Dashboard',         path: '/admin' },
  { key: 'organisasi', icon: 'fa-sitemap',       label: 'Organisasi',        path: '/admin/organisasi' },
  { key: 'laporan',    icon: 'fa-chart-bar',     label: 'Laporan',           path: '/admin/laporan' },
  { key: 'sistem',     icon: 'fa-cog',           label: 'Pengaturan Sistem', path: '/admin/sistem' },
  { key: 'pengaturan', icon: 'fa-user-shield',   label: 'Profil & Keamanan', path: '/admin/pengaturan' },
];

/* KOMPONEN UTAMA: Layout Sidebar khusus Admin  */
/* Menerima props untuk mengontrol state buka/tutup di mobile (isOpen, onToggle) */
export default function AdminSidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const { settings: sys } = useSystem();
  const logoSrc = sys.logo2Url || defaultLogo2;

  return (
    <>
      {/* OVERLAY MOBILE: Latar belakang redup saat sidebar terbuka di layar kecil  */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside className={`sidebar bg-primary ${isOpen ? 'open' : ''}`}>

        {/* BAGIAN ATAS: Logo & Nama Sistem  */}
        <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={logoSrc} alt="logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-lg leading-tight truncate">{sys.appName}</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest truncate">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* BAGIAN TENGAH: Menu Navigasi  */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(({ key, icon, label, path }) => (
            <NavLink
              key={key}
              to={path}
              end={path === '/admin'}
              onClick={(e) => { e.preventDefault(); if (onToggle) onToggle(); navigate(path); }}
              className={({ isActive }) => `nav-item w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 transition-colors
                ${isActive
                  ? 'active bg-white/10 text-white font-medium'
                  : 'hover:bg-white/5 hover:text-white'}`
              }
            >
              <i className={`fas ${icon} w-5 text-center`} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* BAGIAN BAWAH: Info User Aktif (Admin)  */}
        <div className="px-4 pb-5 flex-shrink-0">
          <div className="org-card-clickable bg-white/10 rounded-xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary/40 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                <i className="fas fa-user-shield text-white text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">Administrator</p>
                <p className="text-white/40 text-[11px] truncate">Super Admin</p>
              </div>
              <i className="fas fa-chevron-up text-white/30 text-[10px] flex-shrink-0" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
