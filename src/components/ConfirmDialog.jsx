/**
 * ConfirmDialog — Custom confirmation modal pengganti window.confirm()
 * Digunakan di seluruh aplikasi (user & admin) untuk konfirmasi aksi destruktif.
 */
import ReactDOM from 'react-dom';

export default function ConfirmDialog({
  isOpen,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  type = 'danger',   // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen) return null;

  const cfgMap = {
    danger:  { icon: 'fa-trash-alt',           iconBg: 'bg-red-50',    iconColor: 'text-red-500',    btnCls: 'bg-red-500 hover:bg-red-600 shadow-red-200'    },
    warning: { icon: 'fa-exclamation-triangle', iconBg: 'bg-amber-50',  iconColor: 'text-amber-500',  btnCls: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' },
    info:    { icon: 'fa-info-circle',          iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   btnCls: 'bg-primary hover:bg-primary-dark shadow-primary/20' },
  };
  const cfg = cfgMap[type] || cfgMap.danger;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />

      {/* Dialog box */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        {/* Top accent bar */}
        <div className={`h-1 w-full ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-primary'}`} />

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
              <i className={`fas ${cfg.icon} ${cfg.iconColor} text-xl`} />
            </div>
            <div>
              <p className="font-bold text-neutral-dark text-base leading-tight">{title}</p>
              <p className="text-neutral text-sm mt-0.5 leading-relaxed">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 border border-neutral-light rounded-xl text-sm font-semibold text-neutral-dark hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${cfg.btnCls}`}
            >
              {isLoading && <i className="fas fa-spinner fa-spin text-xs" />}
              {isLoading ? 'Menghapus...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
