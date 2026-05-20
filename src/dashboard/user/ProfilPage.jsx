import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { getInitials } from '../../utils/formatters';

/* ── KOMPONEN UTAMA: Halaman Profil Organisasi (User) ── */
/* Tempat pengurus melihat dan mengubah data publik organisasi (nama, jenis, logo, deskripsi) */
export default function ProfilPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { state, updateOrganisasi, uploadOrgLogo, deleteOrgLogo, organisasi, user } = useApp();
  const showToast = useToast();
  const { profile } = state;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', email: '', phone: '', description: '' });

  const initials = getInitials(profile.name);

  const openEdit = () => {
    setForm({ name: profile.name, type: profile.type, email: profile.email, phone: profile.phone, description: profile.description });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!form.name || !form.type || !form.phone) {
      showToast('Semua field wajib diisi', 'error'); return;
    }
    try {
      await updateOrganisasi({
        name: form.name,
        type: form.type,
        phone: form.phone,
        description: form.description,
      });
      setEditing(false);
      showToast('Profil organisasi berhasil diperbarui', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memperbarui profil';
      showToast(msg, 'error');
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Hanya file gambar yang diizinkan', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran maksimal 5MB', 'error'); return; }
    try {
      await uploadOrgLogo(file);
      showToast('Logo berhasil diperbarui', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengunggah logo';
      showToast(msg, 'error');
    }
    e.target.value = '';
  };

  const handleDeletePhoto = async () => {
    try {
      await deleteOrgLogo();
      showToast('Logo berhasil dihapus', 'success');
    } catch {
      showToast('Gagal menghapus logo', 'error');
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-neutral-light/30 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary via-primary-light to-tertiary relative">
          <button type="button" onClick={editing ? () => setEditing(false) : openEdit}
            className="absolute top-4 right-4 px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2">
            <i className={`fas ${editing ? 'fa-times' : 'fa-pen'} text-xs`} />
            {editing ? 'Batal Edit' : 'Edit Profil'}
          </button>
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Profile photo */}
            <div className="profile-photo-wrap bg-primary-light flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 ring-4 ring-white shadow-lg"
              onClick={() => document.getElementById('profile-photo-input').click()}>
              {(organisasi?.logo_url || profile.photo)
                ? <img src={organisasi?.logo_url || profile.photo} alt="" className="w-full h-full object-cover" />
                : <span>{initials}</span>
              }
              <div className="profile-photo-overlay">
                <i className="fas fa-camera text-white text-lg mb-1" />
                <span className="text-white text-[10px] font-medium">Ubah Logo</span>
              </div>
              <input type="file" id="profile-photo-input" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handlePhoto} />
            </div>
            {/* Tombol hapus logo — hanya muncul jika ada logo */}
            {(organisasi?.logo_url || profile.photo) && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="mt-2 self-start sm:self-auto text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <i className="fas fa-trash-alt text-[10px]" /> Hapus Logo
              </button>
            )}

            <div className="pt-2 sm:pt-14 flex-1 w-full">
              <h3 className="text-xl font-bold text-primary-dark">{profile.name}</h3>
              <p className="text-sm text-neutral mt-0.5">{profile.type}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-neutral bg-neutral-50 px-3 py-1.5 rounded-lg">
                  <i className="fas fa-envelope text-tertiary" /> {profile.email}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-neutral bg-neutral-50 px-3 py-1.5 rounded-lg">
                  <i className="fas fa-phone text-tertiary" /> {profile.phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 border-t border-neutral-light/50 pt-4">
          <h4 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-2">Tentang Kami</h4>
          <p className="text-sm text-neutral-dark leading-relaxed">{profile.description}</p>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-2xl p-6 border border-neutral-light/30 page-enter">
          <h3 className="font-semibold text-primary mb-5 flex items-center gap-2">
            <i className="fas fa-edit text-tertiary" /> Edit Data Organisasi
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Nama Organisasi</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Jenis</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all text-neutral">
                  {['Kemahasiswaan', 'Himpunan Mahasiswa', 'Unit Kegiatan Mahasiswa', 'OSIS', 'Lembaga', 'Komunitas', 'Yayasan', 'Lainnya'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Email</label>
                <div className="flex gap-2 items-center">
                  <input type="email" value={form.email} readOnly
                    className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none bg-neutral-50 text-neutral cursor-not-allowed" />
                  {user?.provider !== 'google' && (
                    <button type="button" onClick={() => navigate('/dashboard/pengaturan')}
                      title="Ubah email di Pengaturan"
                      className="flex-shrink-0 px-3 py-2.5 border border-neutral-light rounded-xl text-xs font-semibold text-tertiary hover:bg-tertiary/5 hover:border-tertiary/40 transition-all whitespace-nowrap">
                      <i className="fas fa-pen text-[10px] mr-1" /> Ubah
                    </button>
                  )}
                </div>
                {user?.provider !== 'google' ? (
                  <p className="text-[11px] text-neutral mt-1.5">
                    <i className="fas fa-lock text-[10px] mr-1" />
                    Untuk keamanan, perubahan email dilakukan di <button type="button" onClick={() => navigate('/dashboard/pengaturan')} className="text-tertiary font-semibold hover:underline">Pengaturan</button>
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral mt-1.5">
                    <i className="fas fa-info-circle text-[10px] mr-1" />
                    Email dari akun Google tidak dapat diubah.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">No. Telepon</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Deskripsi</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={saveEdit}
                className="px-6 py-2.5 bg-tertiary text-white rounded-xl text-sm font-semibold hover:bg-tertiary-light transition-colors">
                Simpan Perubahan
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="px-6 py-2.5 border border-neutral-light rounded-xl text-sm font-semibold text-neutral-dark hover:bg-neutral-50 transition-colors">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Card */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-light/30">
        <h3 className="font-semibold text-primary mb-5 flex items-center gap-2">
          <i className="fas fa-shield-alt text-tertiary" /> Keamanan Akun
        </h3>
        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl border border-primary/10">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-primary-dark">Keluar dari Sistem</p>
            <p className="text-sm text-neutral">Anda akan keluar dari akun organisasi ini.</p>
          </div>
          <button type="button" onClick={() => {
            logout();
            showToast('Anda telah keluar', 'info');
          }}
            className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0 font-medium">
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
