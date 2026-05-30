/* KOMPONEN MODAL: Menampilkan detail organisasi (Admin)  */
import { createPortal } from 'react-dom';
const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const STATUS_STYLE = {
  'Aktif':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Pending':   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Non-aktif': 'bg-slate-600/30 text-slate-500 border-slate-600/50',
};

export default function OrgDetailModal({ isOpen, org, onClose, onEdit, onDelete }) {
  if (!isOpen || !org) return null;
  const initials = org.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="admin-card-modal relative w-full max-w-md rounded-2xl p-6 z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-slate-800 text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: org.color + '30', border: `2px solid ${org.color}60`, color: org.color }}>
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-slate-800 font-display font-bold text-lg leading-tight">{org.name}</h3>
              <p className="text-slate-500 text-sm mt-0.5">{org.type}</p>
              <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[org.status] || ''}`}>
                {org.status}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0">
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 text-xs">Total Anggota</p>
            <p className="text-slate-800 font-display font-bold text-xl mt-0.5">{org.memberCount}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 text-xs">Saldo Organisasi</p>
            <p className="text-slate-800 font-display font-bold text-base mt-0.5 truncate">{fmt(org.balance)}</p>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <i className="fas fa-envelope text-slate-500 w-4 text-center" />
            <p className="text-slate-600 text-sm truncate">{org.email}</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <i className="fas fa-phone text-slate-500 w-4 text-center" />
            <p className="text-slate-600 text-sm">{org.phone}</p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <i className="fas fa-calendar text-slate-500 w-4 text-center" />
            <p className="text-slate-600 text-sm">Terdaftar: {org.createdAt}</p>
          </div>
        </div>

        {org.description && (
          <div className="p-3 bg-white rounded-xl mb-5">
            <p className="text-slate-500 text-xs mb-1">Deskripsi</p>
            <p className="text-slate-600 text-sm leading-relaxed">{org.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={() => onDelete(org)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-all">
            <i className="fas fa-trash-alt text-xs" /> Hapus
          </button>
          <button type="button" onClick={() => onEdit(org)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-teal-700/25">
            <i className="fas fa-pen text-xs" /> Edit Organisasi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
