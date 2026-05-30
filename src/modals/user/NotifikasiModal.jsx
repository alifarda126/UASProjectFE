/* KOMPONEN MODAL: Menampilkan daftar pemberitahuan (User)  */
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/user/Modal';

export default function NotifikasiModal({ isOpen, onClose }) {
  const { state, markAllRead, markOneRead } = useApp();
  const showToast = useToast();
  const { notifications } = state;

  const handleMarkAllRead = () => {
    markAllRead();
    showToast('Semua notifikasi telah ditandai dibaca', 'success');
  };

  const handleClickNotif = (n) => {
    if (!n.read) markOneRead(n.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" align="top-right">
      <div className="flex items-center justify-between p-4 border-b border-neutral-light/50">
        <h3 className="font-semibold text-primary">Notifikasi</h3>
        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs text-tertiary font-semibold hover:text-tertiary-dark transition-colors"
        >
          Tandai semua dibaca
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-center text-sm text-neutral py-8">Tidak ada notifikasi</p>
        ) : notifications.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleClickNotif(n)}
            className={`w-full text-left flex items-start gap-3 p-4 border-b border-neutral-light/30 last:border-0 transition-colors ${
              !n.read
                ? 'bg-primary-50/50 hover:bg-primary-50'
                : 'hover:bg-neutral-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-tertiary-50' : 'bg-neutral-50'}`}>
              <i className={`fas ${n.icon} text-sm ${n.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!n.read ? 'font-semibold text-neutral-dark' : 'text-neutral-dark'}`}>
                {n.text}
              </p>
              <p className="text-xs text-neutral mt-0.5">{n.time}</p>
            </div>
            {!n.read && (
              <div className="w-2 h-2 rounded-full bg-tertiary flex-shrink-0 mt-1.5" />
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}
