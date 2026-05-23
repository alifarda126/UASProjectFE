import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import OrgFormModal from '../../modals/admin/OrgFormModal';
import OrgDetailModal from '../../modals/admin/OrgDetailModal';
import SuspendModal from '../../modals/admin/SuspendModal';

const STATUS_STYLE = {
  'Aktif':      'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  'Pending':    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  'Non-aktif':  'bg-slate-600/20 text-slate-500 border border-slate-600/40',
  'Tersuspend': 'bg-red-500/15 text-red-400 border border-red-500/30',
};

const ORG_TYPES    = ['Semua', 'Kemahasiswaan', 'Himpunan Mahasiswa', 'Unit Kegiatan Mahasiswa', 'OSIS', 'Lembaga', 'Komunitas', 'Yayasan', 'Lainnya'];
const ORG_STATUSES = ['Semua', 'Aktif', 'Pending', 'Non-aktif', 'Tersuspend'];

/* ── SUB-KOMPONEN: Dropdown Custom Tema Admin ── */
/* Digunakan untuk filter pencarian dengan UI yang lebih elegan dibandingkan <select> bawaan HTML */
function AdminSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(p => !p)}
        className="flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm hover:border-teal-600/40 transition-all min-w-[160px]">
        <span className="flex-1 truncate text-left">{value}</span>
        <i className={`fas fa-chevron-down text-slate-500 flex-shrink-0 text-[11px] transition-transform duration-200 ${open ? 'rotate-180 text-teal-600' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-[70] left-0 min-w-max mt-1.5 rounded-xl bg-white overflow-hidden border border-slate-200 shadow-xl">
          {options.map(opt => {
            const isSel = opt === value;
            return (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${
                  isSel ? 'bg-teal-600/15 text-teal-600 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
                <span className={`w-3.5 flex-shrink-0 ${isSel ? '' : 'opacity-0'}`}><i className="fas fa-check text-[10px]" /></span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── SUB-KOMPONEN: Modal Konfirmasi Penghapusan ── */
/* Muncul sebagai peringatan terakhir sebelum admin menghapus organisasi secara permanen */
function ConfirmDeleteModal({ org, onConfirm, onCancel }) {
  if (!org) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="admin-card-modal relative w-full max-w-sm rounded-2xl p-6 z-10">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-trash-alt text-red-400 text-xl" />
        </div>
        <h3 className="text-slate-800 font-display font-bold text-lg text-center mb-2">Hapus Organisasi?</h3>
        <p className="text-slate-500 text-sm text-center mb-6">
          Anda akan menghapus <span className="text-slate-800 font-semibold">"{org.name}"</span> dari sistem. Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all">Batal</button>
          <button type="button" onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all">Hapus</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── SUB-KOMPONEN: Baris Tabel Daftar Organisasi ── */
/* Menampilkan data per-organisasi beserta tombol aksi (Lihat, Edit, Suspend/Unsuspend, Hapus) yang muncul saat di-hover */
function OrgRow({ org, onDetail, onEdit, onDelete, onSuspend, onUnsuspend }) {
  const initials = org.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  
  let displayStatus = org.status;
  if (org.hasPendingBanding) {
    displayStatus = 'Pending';
  } else if (org.isSuspended) {
    displayStatus = 'Tersuspend';
  }

  // Hitung hari terakhir aktif
  let activeDaysStr = '-';
  if (org.lastActiveAt) {
    const diff = Math.floor((new Date() - new Date(org.lastActiveAt)) / (1000 * 60 * 60 * 24));
    activeDaysStr = diff === 0 ? 'Hari ini' : `${diff} hari lalu`;
  }

  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm overflow-hidden"
               style={!org.logo_url ? { backgroundColor: org.color + '25', border: `1px solid ${org.color}40`, color: org.color } : {}}>
            {org.logo_url
              ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="min-w-0">
            <p className="text-slate-800 text-sm font-semibold truncate max-w-[160px]">{org.name}</p>
            <p className="text-slate-500 text-xs">{org.type}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 hidden md:table-cell"><p className="text-slate-600 text-sm">{org.email}</p></td>
      <td className="px-4 py-4 hidden lg:table-cell"><p className="text-slate-600 text-sm">{org.memberCount} anggota</p></td>
      <td className="px-4 py-4 hidden lg:table-cell"><p className="text-slate-600 text-sm">{fmt(org.balance)}</p></td>
      <td className="px-4 py-4 hidden lg:table-cell"><p className="text-slate-600 text-sm">{activeDaysStr}</p></td>
      <td className="px-4 py-4">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[displayStatus] || ''}`}>{displayStatus}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 opacity-100 transition-opacity">
          <button type="button" onClick={() => onDetail(org)} title="Lihat Detail"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-600/10 transition-all">
            <i className="fas fa-eye text-xs" />
          </button>
          <button type="button" onClick={() => onEdit(org)} title="Edit"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
            <i className="fas fa-pen text-xs" />
          </button>
          {org.isSuspended ? (
            <button type="button" onClick={() => onUnsuspend(org)} title="Cabut Suspend"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
              <i className="fas fa-check-circle text-xs" />
            </button>
          ) : (
            <button type="button" onClick={() => onSuspend(org)} title="Suspend"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all">
              <i className="fas fa-ban text-xs" />
            </button>
          )}
          <button type="button" onClick={() => onDelete(org)} title="Hapus"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <i className="fas fa-trash-alt text-xs" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── KOMPONEN UTAMA: Halaman Manajemen Organisasi ── */
/* Tempat admin dapat menambah, mengedit, menghapus, suspend, serta mencari/memfilter organisasi */
export default function OrganisasiPage() {
  const { orgs, deleteOrg, suspendOrg, unsuspendOrg, fetchAdminData, isLoading } = useAdmin();
  const showToast = useToast();

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const [search,        setSearch]        = useState('');
  const [filterType,    setFilterType]    = useState('Semua');
  const [filterStatus,  setFilterStatus]  = useState('Semua');
  const [modalForm,     setModalForm]     = useState({ open: false, org: null });
  const [modalDetail,   setModalDetail]   = useState({ open: false, org: null });
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  /* ── FILTERING DATA: Menyaring data organisasi berdasarkan teks pencarian, tipe, dan status ── */
  const filtered = orgs.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.name.toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q) || o.type.toLowerCase().includes(q);
    const matchType   = filterType   === 'Semua' || o.type   === filterType;
    let matchStatus = true;
    if (filterStatus !== 'Semua') {
      if (filterStatus === 'Tersuspend') matchStatus = o.isSuspended;
      else matchStatus = o.status === filterStatus && !o.isSuspended;
    }
    return matchSearch && matchType && matchStatus;
  });

  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteOrg(target.id);
      showToast(`Organisasi "${target.name}" berhasil dihapus`, 'success');
    } catch {
      showToast(`Gagal menghapus organisasi "${target.name}"`, 'error');
    }
  };

  const handleSuspendConfirm = async (reason) => {
    const target = suspendTarget;
    try {
      await suspendOrg(target.id, reason);
      showToast(`Organisasi "${target.name}" berhasil disuspend. Notifikasi telah dikirim.`, 'success');
      setSuspendTarget(null);
    } catch {
      showToast(`Gagal menyuspend organisasi "${target.name}"`, 'error');
      throw new Error('suspend failed');
    }
  };

  const handleUnsuspend = async (org) => {
    try {
      await unsuspendOrg(org.id);
      showToast(`Suspend pada "${org.name}" berhasil dicabut.`, 'success');
    } catch {
      showToast(`Gagal mencabut suspend "${org.name}"`, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* ── HEADER BAGIAN ATAS: Judul dan Tombol Tambah ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-slate-800 font-display font-bold text-xl">Manajemen Organisasi</h2>
          <p className="text-slate-500 text-sm mt-0.5">{orgs.length} organisasi terdaftar di sistem</p>
        </div>
        <button type="button" onClick={() => setModalForm({ open: true, org: null })}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-teal-700/25 self-start sm:self-auto">
          <i className="fas fa-plus text-xs" /> Tambah Organisasi
        </button>
      </div>

      {/* ── BARIS FILTER & PENCARIAN ── */}
      <div className="admin-card rounded-2xl p-4 relative z-20">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0 max-w-[420px]">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none" />
            <input type="text" placeholder="Cari nama, email, atau tipe organisasi..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-600/60 focus:ring-2 focus:ring-teal-600/10 transition-all" />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800">
                <i className="fas fa-times text-xs" />
              </button>
            )}
          </div>
          <AdminSelect value={filterType}   onChange={setFilterType}   options={ORG_TYPES} />
          <AdminSelect value={filterStatus} onChange={setFilterStatus} options={ORG_STATUSES} />
        </div>
      </div>

      {/* ── TABEL UTAMA ORGANISASI ── */}
      <div className="admin-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Organisasi</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Anggota</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Saldo</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Terakhir Online</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <OrgRow key={org.id} org={org}
                  onDetail={(o) => setModalDetail({ open: true, org: o })}
                  onEdit={(o) => setModalForm({ open: true, org: o })}
                  onDelete={(o) => setDeleteTarget(o)}
                  onSuspend={(o) => setSuspendTarget(o)}
                  onUnsuspend={handleUnsuspend} />
              ))}
            </tbody>
          </table>
          {isLoading ? (
            <div className="text-center py-16">
              <i className="fas fa-spinner fa-spin text-teal-600 text-3xl mb-4" />
              <p className="text-slate-500 font-semibold">Memuat data organisasi...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-slate-500 text-xl" />
              </div>
              <p className="text-slate-500 font-semibold">Tidak ada organisasi ditemukan</p>
              <p className="text-slate-600 text-sm mt-1">Coba ubah filter pencarian</p>
            </div>
          ) : null}
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-slate-500 text-xs">Menampilkan {filtered.length} dari {orgs.length} organisasi</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-500 text-xs">{orgs.filter(o => o.status === 'Aktif' && !o.isSuspended).length} aktif</span>
              </div>
              {orgs.filter(o => o.isSuspended).length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-slate-500 text-xs">{orgs.filter(o => o.isSuspended).length} tersuspend</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── RENDER MODALS: Tersembunyi hingga state open menjadi true ── */}
      <OrgFormModal isOpen={modalForm.open} org={modalForm.org} onClose={() => setModalForm({ open: false, org: null })} />
      <OrgDetailModal isOpen={modalDetail.open} org={modalDetail.org} onClose={() => setModalDetail({ open: false, org: null })}
        onEdit={(o) => { setModalDetail({ open: false, org: null }); setModalForm({ open: true, org: o }); }}
        onDelete={(o) => { setModalDetail({ open: false, org: null }); setDeleteTarget(o); }} />
      <ConfirmDeleteModal org={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      <SuspendModal org={suspendTarget} onConfirm={handleSuspendConfirm} onCancel={() => setSuspendTarget(null)} />
    </div>
  );
}
