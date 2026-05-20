import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DeactivatedPage() {
  const { organisasi } = useApp();
  const { fetchUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReactivate = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/bandings', {
        organisasi_id: organisasi.id,
        message: 'Mohon pengaktifan kembali akun organisasi kami yang sebelumnya dinonaktifkan secara otomatis.'
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengaktifkan kembali akun. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-200/50 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 text-center relative overflow-hidden">
          {/* Top colored bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-slate-400" />

          {/* Icon */}
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-bed text-3xl text-slate-500" />
          </div>

          <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">Akun Nonaktif</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Akun organisasi <strong className="text-slate-700">{organisasi?.name}</strong> telah dinonaktifkan sementara karena tidak ada aktivitas lebih dari 30 hari. 
            Anda dapat mengajukan pengaktifan kembali kepada administrator untuk melanjutkan penggunaan sistem.
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-6 text-left flex items-start gap-3">
              <i className="fas fa-exclamation-circle mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="bg-amber-50 text-amber-600 text-sm p-4 rounded-xl mb-6 flex flex-col items-center gap-2">
              <i className="fas fa-clock text-2xl" />
              <span className="font-medium text-center">Pengajuan Berhasil Dikirim!</span>
              <span className="text-amber-600/80 text-center text-xs">Mohon tunggu hingga administrator menyetujui pengajuan Anda. Kami akan mengirimkan pemberitahuan melalui email setelah disetujui.</span>
              
              <button
                onClick={logout}
                className="mt-2 py-2 px-4 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors"
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReactivate}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Mengaktifkan...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" />
                    Ajukan Pengaktifan Kembali
                  </>
                )}
              </button>
              
              <button
                onClick={logout}
                disabled={loading}
                className="w-full py-3 px-4 bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
              >
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
