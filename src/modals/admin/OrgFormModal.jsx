/* KOMPONEN MODAL: Form tambah/edit organisasi (Admin)  */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';

const ORG_TYPES    = ['Kemahasiswaan', 'Himpunan Mahasiswa', 'Unit Kegiatan Mahasiswa', 'OSIS', 'Lembaga', 'Komunitas', 'Yayasan', 'Lainnya'];
const ORG_STATUSES = ['Aktif', 'Pending', 'Non-aktif'];
const EMPTY = { name: '', type: 'Kemahasiswaan', email: '', phone: '', status: 'Aktif', description: '' };

export default function OrgFormModal({ isOpen, org, onClose }) {
  const { addOrg, editOrg } = useAdmin();
  const showToast = useToast();
  const isEdit = !!org;

  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (isOpen) {
      setForm(org
        ? { name: org.name, type: org.type, email: org.email, phone: org.phone, status: org.status, description: org.description }
        : EMPTY);
    }
  }, [isOpen, org]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!form.name || !form.type || !form.email || !form.phone) {
      showToast('Lengkapi semua data wajib', 'error'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showToast('Format email tidak valid', 'error'); return;
    }
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await editOrg(org.id, form);
        showToast('Data organisasi berhasil diperbarui', 'success');
      } else {
        await addOrg(form);
        showToast('Organisasi berhasil ditambahkan', 'success');
      }
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || (isEdit ? 'Gagal memperbarui organisasi' : 'Gagal menambah organisasi');
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const LBL = 'block text-slate-600 text-sm font-medium mb-1.5';
  const INP = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-teal-600/60 focus:ring-2 focus:ring-teal-600/10 transition-all placeholder-slate-500';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="admin-card-modal relative w-full max-w-lg rounded-2xl p-6 z-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700/20 flex items-center justify-center">
              <i className={`fas ${isEdit ? 'fa-pen' : 'fa-plus'} text-teal-600 text-sm`} />
            </div>
            <h3 className="text-slate-800 font-display font-bold">{isEdit ? 'Edit Organisasi' : 'Tambah Organisasi'}</h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors">
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Form - with custom scrollbar padding */}
        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
          <div>
            <label className={LBL}>Nama Organisasi <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Contoh: BEM Fakultas Teknik" className={INP} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Jenis Organisasi <span className="text-red-400">*</span></label>
              <select value={form.type} onChange={set('type')} className={INP + ' cursor-pointer'}>
                {ORG_TYPES.map(t => <option key={t} value={t} className="bg-slate-50">{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Status <span className="text-red-400">*</span></label>
              <select value={form.status} onChange={set('status')} className={INP + ' cursor-pointer'}>
                {ORG_STATUSES.map(s => <option key={s} value={s} className="bg-slate-50">{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={LBL}>Email Resmi <span className="text-red-400">*</span></label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="humas@organisasi.com" className={INP} />
          </div>

          <div>
            <label className={LBL}>No. Telepon <span className="text-red-400">*</span></label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="08xxxxxxxxxx" className={INP} />
          </div>

          <div>
            <label className={LBL}>Deskripsi</label>
            <textarea rows={3} value={form.description} onChange={set('description')}
              placeholder="Ceritakan sedikit tentang organisasi..."
              className={INP + ' resize-none'} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6 pt-5 border-t border-slate-200 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all">
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-teal-700/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting && <i className="fas fa-spinner fa-spin text-xs" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Organisasi'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
