/* KOMPONEN LAYOUT: Topbar Khusus Admin  */
import { useAuth } from '../../hooks/useAuth';

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  organisasi: 'Organisasi',
  laporan:    'Laporan',
  sistem:     'Pengaturan Sistem',
  pengaturan: 'Profil & Keamanan',
};

export default function AdminTopbar({ currentPage, onToggleSidebar }) {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-neutral-light/50 flex-shrink-0">
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
            <h2 className="font-semibold text-primary text-lg leading-tight">
              {PAGE_TITLES[currentPage] || 'Dashboard'}
            </h2>
            <p className="text-xs text-neutral mt-0.5 leading-tight">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">Online</span>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-neutral-light/30 text-neutral-dark hover:text-red-500 hover:border-red-500/30 hover:bg-red-50 text-sm font-medium transition-all"
          >
            <i className="fas fa-sign-out-alt text-xs ml-1" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
