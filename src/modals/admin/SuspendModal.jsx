/* KOMPONEN MODAL: Konfirmasi Suspend Organisasi (Admin)  */
/* Admin wajib mengisi pesan suspend yang akan terkirim sebagai notifikasi ke creator organisasi */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function SuspendModal({ org, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (org) { setReason(''); setError(''); setIsLoading(false); }
  }, [org]);

  if (!org) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) { setError('Pesan suspend wajib diisi.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await onConfirm(reason.trim());
    } catch {
      setError('Gagal menyuspend organisasi. Coba lagi.');
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="admin-card-modal relative w-full max-w-md rounded-2xl p-6 z-10">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-ban text-orange-400 text-xl" />
        </div>

        {/* Heading */}
        <h3 className="text-slate-800 font-display font-bold text-lg text-center mb-1">Suspend Organisasi?</h3>
        <p className="text-slate-500 text-sm text-center mb-5">
          Anda akan menyuspend <span className="text-slate-800 font-semibold">"{org.name}"</span>.
          Organisasi tidak bisa beroperasi selama suspend aktif. Pesan akan dikirim ke organisasi.
        </p>

        {/* Pesan Suspend */}
        <div className="mb-4">
          <label className="block text-slate-600 text-sm font-medium mb-2">
            Alasan / Pesan Suspend <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            placeholder="Jelaskan alasan penyuspendan organisasi ini. Pesan ini akan terkirim ke organisasi sebagai notifikasi..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder-slate-500 resize-none"
          />
          {error && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <i className="fas fa-exclamation-circle" /> {error}
            </p>
          )}
          <p className="text-slate-600 text-xs mt-1">{reason.length}/1000 karakter</p>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-orange-500/8 border border-orange-500/20 rounded-xl mb-5">
          <i className="fas fa-info-circle text-orange-400 text-xs mt-0.5 flex-shrink-0" />
          <p className="text-orange-300 text-xs leading-relaxed">
            Notifikasi beserta alasan suspend akan otomatis dikirim ke creator organisasi ini.
            Organisasi dapat mengajukan banding setelah menerima notifikasi.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all disabled:opacity-50">
            Batal
          </button>
          <button type="button" onClick={handleConfirm} disabled={isLoading || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {isLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-ban text-xs" />}
            {isLoading ? 'Memproses...' : 'Konfirmasi Suspend'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
