import { useAdmin } from '../../context/AdminContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { SkeletonAdminDashboard } from '../../components/Skeleton';

/* SUB-KOMPONEN: Kartu Statistik Kecil  */
/* Digunakan untuk menampilkan angka ringkasan seperti total organisasi, total anggota, dll */
function StatCard({ icon, iconBg, label, value, sub, trend }) {
  return (
    <div className="admin-card rounded-2xl p-6 flex items-start gap-4 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <i className={`fas ${icon} text-lg`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-500 text-sm">{label}</p>
        <p className="text-slate-800 text-2xl font-display font-bold mt-0.5">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
          trend > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
        }`}>
          <i className={`fas fa-arrow-${trend > 0 ? 'up' : 'down'} text-[10px]`} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

/* SUB-KOMPONEN: Progress Bar Status Organisasi  */
/* Menampilkan persentase jumlah organisasi berdasarkan statusnya (Aktif, Pending, Non-aktif, Tersuspend) */
function OrgStatusBar({ orgs }) {
  if (orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-slate-500">
        <i className="fas fa-sitemap text-2xl text-slate-700 mb-2" />
        <p className="text-xs">Belum ada organisasi terdaftar</p>
      </div>
    );
  }
  const total   = orgs.length;
  const aktif   = orgs.filter(o => o.status === 'Aktif' && !o.isSuspended).length;
  const pending = orgs.filter(o => o.status === 'Pending' && !o.isSuspended).length;
  const nonAktif = orgs.filter(o => o.status === 'Non-aktif' && !o.isSuspended).length;
  const tersuspend = orgs.filter(o => o.isSuspended).length;
  
  return (
    <div className="space-y-3">
      {[
        { label: 'Aktif',      count: aktif,       color: 'bg-emerald-500', text: 'text-emerald-400' },
        { label: 'Pending',    count: pending,     color: 'bg-amber-500',   text: 'text-amber-400'   },
        { label: 'Non-aktif',  count: nonAktif,    color: 'bg-slate-600',   text: 'text-slate-500'   },
        { label: 'Tersuspend', count: tersuspend,  color: 'bg-red-500',     text: 'text-red-400'     },
      ].map(({ label, count, color, text }) => (
        count > 0 || label === 'Aktif' ? (
          <div key={label}>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500 text-xs">{label}</span>
              <span className={`text-xs font-semibold ${text}`}>{count} organisasi</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div className={`h-full rounded-full ${color} transition-all duration-700`}
                style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </div>
        ) : null
      ))}
    </div>
  );
}

/* SUB-KOMPONEN: Baris Tabel Organisasi Terkini  */
/* Digunakan pada daftar singkat organisasi di panel dashboard */
function RecentOrgRow({ org, index }) {
  // Tentukan status yang benar berdasarkan isSuspended
  const getStatus = () => {
    if (org.isSuspended) return 'Tersuspend';
    return org.status;
  };
  
  const STATUS_STYLE = {
    'Aktif':      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Pending':    'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Non-aktif':  'bg-slate-600/30 text-slate-500 border-slate-600/50',
    'Tersuspend': 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  
  const displayStatus = getStatus();
  const initials = org.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-200 last:border-0 group hover:bg-white/2 rounded-lg px-2 -mx-2 transition-all">
      <span className="text-slate-600 text-xs w-4">{index + 1}</span>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-800 text-xs font-bold overflow-hidden"
           style={!org.logo_url ? { backgroundColor: org.color + '33', border: `1px solid ${org.color}55` } : {}}>
        {org.logo_url
          ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
          : <span style={{ color: org.color }}>{initials}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-800 text-sm font-medium truncate">{org.name}</p>
        <p className="text-slate-500 text-xs">{org.type}</p>
      </div>
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[displayStatus] || ''}`}>
        {displayStatus}
      </span>
    </div>
  );
}

/* SUB-KOMPONEN: Modal Catatan Admin saat Resolve Banding  */
/* Menggunakan createPortal agar modal di-render ke document.body,
   melewati semua overflow:hidden dari admin-layout dan admin-main-scroll */
function ResolveModal({ banding, onConfirm, onCancel }) {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState(null); // 'accepted' | 'rejected'

  // Reset state saat banding berubah
  useEffect(() => {
    if (!banding) { setNote(''); setAction(null); setIsLoading(false); }
  }, [banding]);

  if (!banding) return null;

  // Step 1: pilih Terima atau Tolak
  if (!action) {
    return createPortal(
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
        <div className="admin-card-modal relative w-full max-w-sm rounded-2xl p-6 z-10">
          <h3 className="text-slate-800 font-display font-bold text-lg text-center mb-2">Proses Banding</h3>
          <p className="text-slate-500 text-sm text-center mb-5">
            Banding dari <span className="text-slate-800 font-semibold">"{banding.organisasi?.name}"</span>
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAction('rejected')}
              className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all">
              <i className="fas fa-times mr-1.5 text-xs" /> Tolak
            </button>
            <button type="button" onClick={() => setAction('accepted')}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all">
              <i className="fas fa-check mr-1.5 text-xs" /> Terima
            </button>
          </div>
          <button type="button" onClick={onCancel} className="w-full mt-3 py-2 text-slate-500 text-sm hover:text-slate-600 transition-colors">Batal</button>
        </div>
      </div>,
      document.body
    );
  }

  const isAccept = action === 'accepted';
  const handleConfirm = async () => {
    setIsLoading(true);
    try { await onConfirm(banding.id, action, note); }
    finally { setIsLoading(false); }
  };

  // Step 2: isi catatan admin dan konfirmasi
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="admin-card-modal relative w-full max-w-md rounded-2xl p-6 z-10">
        <div className={`w-14 h-14 rounded-2xl ${isAccept ? 'bg-emerald-500/15' : 'bg-red-500/15'} flex items-center justify-center mx-auto mb-4`}>
          <i className={`fas ${isAccept ? 'fa-check-circle text-emerald-400' : 'fa-times-circle text-red-400'} text-xl`} />
        </div>
        <h3 className="text-slate-800 font-display font-bold text-lg text-center mb-1">{isAccept ? 'Terima Banding?' : 'Tolak Banding?'}</h3>
        <p className="text-slate-500 text-sm text-center mb-5">
          Banding dari <span className="text-slate-800 font-semibold">"{banding.organisasi?.name}"</span>.
          {isAccept && ' Suspend akan otomatis dicabut.'}
        </p>
        <div className="mb-5">
          <label className="block text-slate-600 text-sm font-medium mb-2">Catatan Admin (opsional)</label>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Tambahkan catatan untuk dikirimkan ke organisasi..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-teal-600/60 focus:ring-2 focus:ring-teal-600/10 transition-all placeholder-slate-400 resize-none" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => setAction(null)} disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all">Kembali</button>
          <button type="button" onClick={handleConfirm} disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${isAccept ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-500 hover:bg-red-600'}`}>
            {isLoading ? <i className="fas fa-spinner fa-spin" /> : null}
            {isLoading ? 'Memproses...' : (isAccept ? 'Konfirmasi Terima' : 'Konfirmasi Tolak')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


/* SUB-KOMPONEN: Panel Daftar Banding  */
function BandingPanel() {
  const { bandings, bandingsLoading, fetchBandings, resolveBanding } = useAdmin();
  const [filterStatus, setFilterStatus] = useState('pending');
  const [resolveTarget, setResolveTarget] = useState(null);
  const showToast = useToast();

  useEffect(() => { fetchBandings(filterStatus); }, [filterStatus, fetchBandings]);

  const handleResolve = async (id, status, note) => {
    try {
      await resolveBanding(id, status, note);
      setResolveTarget(null);
      fetchBandings(filterStatus);
    } catch {
      // error handled by resolveBanding
    }
  };

  const BADGE = {
    pending:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    accepted: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    rejected: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  const LABEL = { pending: 'Menunggu', accepted: 'Diterima', rejected: 'Ditolak' };

  return (
    <>
      <div className="admin-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
              <i className="fas fa-gavel text-amber-400 text-xs" />
            </div>
            <div>
              <p className="text-slate-800 text-sm font-semibold">Pengajuan Banding Organisasi</p>
              <p className="text-slate-500 text-xs">{bandings.filter(b => b.status === 'pending').length} menunggu diproses</p>
            </div>
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
            {['pending', 'accepted', 'rejected'].map((s) => (
              <button key={s} type="button" onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? 'bg-teal-700 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                {LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-white/5">
          {bandingsLoading ? (
            <div className="py-10 text-center">
              <i className="fas fa-spinner fa-spin text-slate-500 text-xl" />
              <p className="text-slate-500 text-sm mt-2">Memuat data...</p>
            </div>
          ) : bandings.length === 0 ? (
            <div className="py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-inbox text-slate-500 text-lg" />
              </div>
              <p className="text-slate-500 text-sm font-semibold">Tidak ada banding {LABEL[filterStatus].toLowerCase()}</p>
            </div>
          ) : bandings.map((b) => (
            <div key={b.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-4">
                {/* Org avatar */}
                <div className="w-10 h-10 rounded-xl bg-teal-700/20 flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-sitemap text-teal-600 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-slate-800 text-sm font-semibold">{b.organisasi?.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Diajukan oleh <span className="text-slate-500">{b.user?.name}</span> · {new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${BADGE[b.status]}`}>{LABEL[b.status]}</span>
                  </div>

                  {/* Pesan banding */}
                  <div className="mt-2 p-3 bg-white rounded-xl">
                    <p className="text-slate-600 text-sm leading-relaxed">{b.message}</p>
                  </div>

                  {/* Bukti foto */}
                  {b.evidence_url && (
                    <div className="mt-2">
                      <a href={b.evidence_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-slate-600 text-xs hover:bg-teal-50 hover:text-teal-700 transition-colors">
                        <i className="fas fa-image text-teal-600" /> Lihat Bukti Foto/Dokumen
                        <i className="fas fa-external-link-alt text-slate-500 text-[10px]" />
                      </a>
                    </div>
                  )}

                  {/* Catatan admin (jika sudah resolve) */}
                  {b.admin_note && (
                    <div className="mt-2 flex items-start gap-2 p-2.5 bg-slate-50/30 rounded-lg">
                      <i className="fas fa-comment text-slate-500 text-xs mt-0.5 flex-shrink-0" />
                      <p className="text-slate-500 text-xs leading-relaxed">{b.admin_note}</p>
                    </div>
                  )}

                  {/* Tombol aksi (hanya untuk status pending) */}
                  {b.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setResolveTarget(b)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-700/15 hover:bg-teal-700/25 border border-teal-600/30 rounded-xl text-teal-600 text-xs font-semibold transition-all">
                        <i className="fas fa-gavel text-xs" /> Proses Banding
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ResolveModal di luar div overflow-hidden agar tidak terpotong */}
      <ResolveModal banding={resolveTarget} onConfirm={handleResolve} onCancel={() => setResolveTarget(null)} />
    </>
  );
}

/* KOMPONEN UTAMA: Halaman Dashboard Admin  */

export default function DashboardAdminPage() {
  const navigate = useNavigate();
  const { orgs, stats, fetchAdminData, isLoading } = useAdmin();
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const totalOrgs      = orgs.length;
  const aktifOrgs      = orgs.filter(o => o.status === 'Aktif' && !o.isSuspended).length;
  const pendingOrgs    = orgs.filter(o => o.status === 'Pending' && !o.isSuspended).length;
  const tersuspendOrgs = orgs.filter(o => o.isSuspended).length;

  if (isLoading && orgs.length === 0) return <SkeletonAdminDashboard />;

  return (
    <div className="page-enter space-y-6">
      {/* BANNER SELAMAT DATANG  */}
      <div className="admin-card rounded-2xl p-6 flex items-center justify-between gap-4 overflow-hidden relative">
        <div className="relative z-10">
          <p className="text-teal-600 text-sm font-semibold mb-1">Selamat Datang</p>
          <h2 className="text-slate-800 text-2xl font-display font-bold">Panel Admin MoneFlo</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola semua organisasi yang terdaftar di sistem.</p>
        </div>
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0 relative z-10">
          <button type="button" onClick={() => navigate('/admin/organisasi')}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-teal-700/25">
            <i className="fas fa-sitemap text-xs" /> Lihat Organisasi
          </button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-teal-600/10 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full bg-slate-400/10 translate-y-1/2 pointer-events-none" />
      </div>

      {/* BARIS STATISTIK: 4 Kartu Ringkasan Admin  */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="fa-sitemap"      iconBg="bg-teal-700/20 text-teal-600"      label="Total Organisasi" value={isLoading ? '...' : totalOrgs}          sub="Semua status" />
        <StatCard icon="fa-check-circle" iconBg="bg-emerald-600/20 text-emerald-500" label="Aktif"           value={isLoading ? '...' : aktifOrgs}          sub="Beroperasi" />
        <StatCard icon="fa-users"        iconBg="bg-slate-700/20 text-slate-500"     label="Total Anggota"  value={isLoading ? '...' : stats.totalMembers}  sub="Semua organisasi" />
        <StatCard icon="fa-ban"          iconBg="bg-red-600/20 text-red-500"         label="Tersuspend"     value={isLoading ? '...' : tersuspendOrgs}      sub="Disuspend admin" />
      </div>

      {/* BARIS KEDUA: Total Saldo Sistem (Kiri) & Organisasi Terdaftar (Kanan)  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="admin-card rounded-2xl p-6 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-700/20 flex items-center justify-center">
              <i className="fas fa-wallet text-teal-600 text-xs" />
            </div>
            <p className="text-slate-600 text-sm font-semibold">Total Saldo Sistem</p>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 py-2">
              <i className="fas fa-spinner fa-spin text-slate-500" />
              <span className="text-slate-500 text-sm">Memuat...</span>
            </div>
          ) : (
            <>
              <p className="text-slate-800 text-3xl font-display font-bold">{fmt(stats.totalBalance)}</p>
              <p className="text-slate-500 text-xs mt-2">Akumulasi semua organisasi</p>
              {/* Breakdown pemasukan & pengeluaran */}
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#00695C] flex items-center gap-1"><i className="fas fa-arrow-down text-[10px]" /> Pemasukan</span>
                  <span className="text-[#00695C] font-semibold">{fmt(stats.totalPemasukan || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-red-600 flex items-center gap-1"><i className="fas fa-arrow-up text-[10px]" /> Pengeluaran</span>
                  <span className="text-red-600 font-semibold">{fmt(stats.totalPengeluaran || 0)}</span>
                </div>
              </div>
            </>
          )}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <OrgStatusBar orgs={orgs} />
          </div>
        </div>

        <div className="admin-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-700/20 flex items-center justify-center">
                <i className="fas fa-list text-teal-600 text-xs" />
              </div>
              <p className="text-slate-600 text-sm font-semibold">Organisasi Terdaftar</p>
            </div>
            <button type="button" onClick={() => navigate('/admin/organisasi')}
              className="text-teal-600 hover:text-teal-500 text-xs font-semibold transition-colors">
              Lihat Semua →
            </button>
          </div>
          <div>
            {orgs.slice(0, 5).map((org, i) => <RecentOrgRow key={org.id} org={org} index={i} />)}
            {orgs.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Belum ada organisasi terdaftar.</p>}
          </div>
        </div>
      </div>

      {/* BARIS KETIGA: Panel Pengajuan Banding  */}
      <BandingPanel />
    </div>
  );
}