/* ── HALAMAN: Organisasi Tersuspend ── */
/* Ditampilkan otomatis saat user login ke dashboard tetapi organisasinya sedang tersuspend */
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import BandingModal from '../../modals/user/BandingModal';

export default function SuspendedPage() {
  const { organisasi, logout } = useApp();
  const navigate = useNavigate();
  const [showBanding, setShowBanding] = useState(false);
  const [bandingSuccess, setBandingSuccess] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const suspendedAt = organisasi?.suspended_at
    ? new Date(organisasi.suspended_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-600/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-orange-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 shadow-2xl">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <i className="fas fa-ban text-red-400 text-4xl" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-white font-bold text-2xl text-center mb-2">Akses Ditangguhkan</h1>
          <p className="text-slate-400 text-sm text-center mb-6">
            Organisasi <span className="text-white font-semibold">"{organisasi?.name}"</span> saat ini telah disuspend oleh administrator.
          </p>

          {/* Info card */}
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 mb-6 space-y-3">
            {suspendedAt && (
              <div className="flex items-start gap-3">
                <i className="fas fa-clock text-red-400 text-xs mt-0.5 w-4 text-center flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs font-medium">Waktu Suspend</p>
                  <p className="text-slate-300 text-sm">{suspendedAt}</p>
                </div>
              </div>
            )}
            {organisasi?.suspended_reason && (
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-red-400 text-xs mt-0.5 w-4 text-center flex-shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs font-medium">Alasan</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{organisasi.suspended_reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info pengajuan banding */}
          <div className="bg-slate-700/40 border border-white/5 rounded-xl p-4 mb-6">
            <p className="text-slate-300 text-sm font-semibold mb-1">Apa yang bisa Anda lakukan?</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <i className="fas fa-gavel text-amber-400 text-xs mt-1 flex-shrink-0" />
                Ajukan banding dengan menyertakan bukti dan penjelasan
              </li>
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <i className="fas fa-bell text-indigo-400 text-xs mt-1 flex-shrink-0" />
                Admin akan memproses banding dan mengirim notifikasi hasilnya
              </li>
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <i className="fas fa-check-circle text-emerald-400 text-xs mt-1 flex-shrink-0" />
                Jika banding diterima, suspend akan otomatis dicabut
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {bandingSuccess ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <i className="fas fa-check-circle text-emerald-400 text-lg flex-shrink-0" />
                <div>
                  <p className="text-emerald-300 text-sm font-semibold">Banding Berhasil Diajukan</p>
                  <p className="text-emerald-400/70 text-xs">Admin akan segera memproses pengajuan Anda.</p>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowBanding(true)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                <i className="fas fa-gavel" /> Ajukan Banding
              </button>
            )}

            <button type="button" onClick={handleLogout}
              className="w-full py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition-all flex items-center justify-center gap-2">
              <i className="fas fa-sign-out-alt text-xs" /> Keluar dari Akun
            </button>
          </div>
        </div>
      </div>

      {/* Modal Banding */}
      <BandingModal
        isOpen={showBanding}
        organisasi={organisasi ? {
          id: organisasi.id,
          name: organisasi.name,
          suspendedReason: organisasi.suspended_reason,
        } : null}
        onClose={() => setShowBanding(false)}
        onSuccess={() => { setShowBanding(false); setBandingSuccess(true); }}
      />
    </div>
  );
}
