/* ── KOMPONEN MODAL: Melihat profil publik organisasi (User) ── */
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getInitials } from '../../utils/formatters';
import Modal from '../../components/user/Modal';

export default function OrgInfoModal({ isOpen, onClose }) {
  const { state } = useApp();
  const { profile, members } = state;
  const initials = getInitials(profile.name);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between p-5 border-b border-neutral-light/50 flex-shrink-0">
        <h3 className="font-semibold text-primary">Profil Organisasi</h3>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center text-neutral">
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="overflow-y-auto">
        {/* Header banner */}
        <div className="bg-gradient-to-br from-primary via-primary-light to-tertiary px-6 pt-8 pb-10 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold mx-auto ring-4 ring-white/20 shadow-lg overflow-hidden">
            {profile.photo ? <img src={profile.photo} alt="" className="w-full h-full object-cover" /> : initials}
          </div>
          <h4 className="text-xl font-bold text-white mt-4">{profile.name}</h4>
          <p className="text-white/70 text-sm mt-1">{profile.type}</p>
        </div>

        {/* Stats grid */}
        <div className="px-6 pt-5 pb-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-xl p-3.5 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <i className="fas fa-users text-tertiary text-xs" />
                <span className="text-[10px] font-semibold text-neutral uppercase tracking-wider">Anggota</span>
              </div>
              <p className="font-display font-bold text-xl text-primary-dark">{members.length}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="fas fa-envelope text-tertiary text-xs" />
                <span className="text-[10px] font-semibold text-neutral uppercase tracking-wider">Email</span>
              </div>
              <p className="text-xs font-medium text-neutral-dark truncate">{profile.email}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="fas fa-phone text-tertiary text-xs" />
                <span className="text-[10px] font-semibold text-neutral uppercase tracking-wider">Telepon</span>
              </div>
              <p className="text-xs font-medium text-neutral-dark">{profile.phone}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 pb-4">
          <h5 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-2">Deskripsi</h5>
          <p className="text-sm text-neutral-dark leading-relaxed">{profile.description}</p>
        </div>

        <div className="mx-6 border-t border-neutral-light/50" />

        {/* Members */}
        <div className="px-6 pt-4 pb-5">
          <h5 className="text-xs font-semibold text-neutral uppercase tracking-wider mb-3">Daftar Anggota</h5>
          <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
            {members.map((m) => (
              <div key={m.id} className="member-row flex items-center gap-3 p-3 rounded-xl bg-white border border-neutral-light/50 shadow-sm">
                <div className="member-avatar" style={{ background: m.color }}>
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-dark truncate">{m.name}</p>
                  <p className="text-xs text-tertiary mt-0.5">{m.nim}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 p-5 border-t border-neutral-light/50">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 border border-neutral-light rounded-xl text-sm font-semibold text-neutral-dark hover:bg-neutral-50 transition-colors">
          Tutup
        </button>
      </div>
    </Modal>
  );
}
