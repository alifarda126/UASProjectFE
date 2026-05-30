/* KOMPONEN MODAL: Form Pengajuan Banding Organisasi (User Side)  */
/* Ditampilkan saat organisasi user tersuspend; user dapat ajukan banding dengan pesan + bukti foto */
import { useState } from 'react';
import api from '../../utils/api';

export default function BandingModal({ isOpen, organisasi, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !organisasi) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }
    setEvidence(file);
    setError('');
    // Buat preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setEvidence(null);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!message.trim()) { setError('Pesan banding wajib diisi.'); return; }
    if (!evidence) { setError('Bukti dokumen (KTM/Surat Tugas) wajib diunggah.'); return; }
    setIsLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('organisasi_id', organisasi.id);
      formData.append('message', message.trim());
      if (evidence) formData.append('evidence', evidence);

      await api.post('/bandings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengajukan banding. Coba lagi.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setMessage(''); setEvidence(null); setPreview(null); setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <i className="fas fa-gavel text-amber-500" />
            </div>
            <div>
              <h3 className="text-gray-900 font-bold text-base">
                {organisasi.isDeactivated ? 'Minta Aktifkan Kembali' : 'Ajukan Banding'}
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">{organisasi.name}</p>
            </div>
          </div>
          <button type="button" onClick={handleClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Info suspend */}
          {organisasi.suspendedReason && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <i className="fas fa-ban text-red-400 text-sm mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 text-xs font-semibold mb-0.5">
                  {organisasi.isDeactivated ? 'Alasan Dinonaktifkan:' : 'Alasan Suspend:'}
                </p>
                <p className="text-red-600 text-sm leading-relaxed">{organisasi.suspendedReason}</p>
              </div>
            </div>
          )}

          {/* Pesan banding */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Pesan Pengajuan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setError(''); }}
              placeholder={organisasi.isDeactivated 
                ? "Berikan alasan untuk mengaktifkan kembali organisasi ini. Sertakan kontak yang bisa dihubungi..."
                : "Jelaskan alasan mengapa suspend ini seharusnya dicabut. Sertakan konteks yang relevan..."}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15 transition-all placeholder-gray-400 resize-none"
            />
            <p className="text-gray-400 text-xs mt-1">{message.length}/2000 karakter</p>
          </div>

          {/* Upload Bukti Foto */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Bukti Identitas/Dokumen <span className="text-red-500">*</span>
            </label>
            <p className="text-gray-500 text-xs mb-2">Wajib mengunggah foto KTM atau surat keterangan bahwa Anda adalah pengurus/bendahara.</p>
            {!evidence ? (
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all group">
                <input type="file" accept="image/jpg,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange} className="hidden" />
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-amber-100 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <i className="fas fa-cloud-upload-alt text-gray-400 group-hover:text-amber-500 text-xl transition-colors" />
                </div>
                <p className="text-gray-600 text-sm font-medium">Klik untuk upload foto/dokumen</p>
                <p className="text-gray-400 text-xs mt-1">JPG, PNG, WEBP, atau PDF</p>
              </label>
            ) : (
              <div className="relative border border-gray-200 rounded-xl overflow-hidden">
                {preview && evidence.type.startsWith('image/') ? (
                  <img src={preview} alt="Preview bukti" className="w-full h-48 object-cover" />
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-gray-50">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-file-alt text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-800 text-sm font-medium truncate">{evidence.name}</p>
                      <p className="text-gray-400 text-xs">{(evidence.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                )}
                <button type="button" onClick={handleRemoveFile}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md">
                  <i className="fas fa-times text-xs" />
                </button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
              <i className="fas fa-exclamation-circle text-red-500 text-sm flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={handleClose} disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-all disabled:opacity-50">
            Batal
          </button>
          <button type="button" onClick={handleSubmit} disabled={isLoading || !message.trim() || !evidence}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-md shadow-amber-500/20">
            {isLoading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-paper-plane text-xs" />}
            {isLoading ? 'Mengirim...' : (organisasi.isDeactivated ? 'Kirim Pengajuan' : 'Kirim Banding')}
          </button>
        </div>
      </div>
    </div>
  );
}
