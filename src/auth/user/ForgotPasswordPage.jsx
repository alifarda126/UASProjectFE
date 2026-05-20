import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import OtpInput from '../../components/user/OtpInput';
import PasswordStrengthBars from '../../components/user/PasswordStrengthBars';
import { getPasswordStrength } from '../../utils/passwordUtils';
import logoProject from '../../assets/MoneFloLogo.png';
/* ── KOMPONEN UTAMA: Halaman Lupa Kata Sandi ── */
/* Menangani alur pemulihan akun melalui verifikasi email OTP */
export default function ForgotPasswordPage({ onBackToLogin }) {
  const showToast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newpass, 4=success
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* Step 1: Kirim OTP ke email */
  const step1 = async () => {
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) { showToast('Masukkan email yang valid', 'error'); return; }
    setIsLoading(true);
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/send-otp', { email: forgotEmail, action: 'forgot_password' });
      setStep(2);
      showToast('Kode verifikasi telah dikirim ke email Anda', 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim kode verifikasi';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /* Step 2: Verifikasi OTP ke backend sebelum lanjut ke input password */
  const step2 = async () => {
    if (otp.join('').length < 6) { showToast('Masukkan 6 digit kode', 'error'); return; }
    setIsLoading(true);
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/verify-otp', { email: forgotEmail, otp: otp.join('') });
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Kode OTP tidak valid';
      showToast(msg, 'error');
      // Reset kotak OTP agar user bisa input ulang
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  /* Kirim ulang OTP */
  const resendOtp = async () => {
    setIsLoading(true);
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/send-otp', { email: forgotEmail, action: 'forgot_password' });
      setOtp(['', '', '', '', '', '']);
      showToast('Kode verifikasi baru telah dikirim', 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim ulang kode';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /* Step 3: Submit OTP + password baru ke backend */
  const step3 = async () => {
    if (!newPass || newPass.length < 8) { showToast('Kata sandi baru minimal 8 karakter', 'error'); return; }
    if (newPass !== confirmPass) { showToast('Konfirmasi kata sandi tidak cocok', 'error'); return; }
    if (getPasswordStrength(newPass) < 2) { showToast('Kata sandi terlalu lemah', 'error'); return; }
    setIsLoading(true);
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/forgot-password', {
        email:                 forgotEmail,
        otp:                   otp.join(''),
        password:              newPass,
        password_confirmation: confirmPass,
      });
      setStep(4);
      showToast('Kata sandi berhasil diubah', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah kata sandi';
      showToast(msg, 'error');
      // Jika OTP salah, kembali ke step OTP
      if (err.response?.status === 400) setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-lg items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={logoProject} alt="Logo MoneFlo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">MoneFlo</h1>
          <p className="text-white/60 mt-1 text-sm">Pemulihan Kata Sandi</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-primary mb-1">Lupa Kata Sandi?</h2>
              <p className="text-sm text-neutral mb-6">Masukkan email organisasi yang terdaftar.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Email Terdaftar</label>
                  <input type="email" placeholder="nama@organisasi.com" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && step1()}
                    className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
                </div>
                <button type="button" onClick={step1} disabled={isLoading}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? <><i className="fas fa-spinner fa-spin mr-2" />Mengirim...</> : 'Kirim Kode Verifikasi'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="page-enter">
              <h2 className="text-xl font-bold text-primary mb-1">Masukkan Kode Verifikasi</h2>
              <p className="text-sm text-neutral mb-1">Kode dikirim ke <strong className="text-primary">{forgotEmail}</strong></p>
              <p className="text-xs text-neutral mb-6">Kode berlaku 5 menit.{' '}
                <button type="button" onClick={resendOtp} disabled={isLoading}
                  className="text-tertiary font-semibold hover:text-tertiary-dark disabled:opacity-60">Kirim ulang</button>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Kode 6 Digit</label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>
                <button type="button" onClick={step2} disabled={otp.join('').length < 6 || isLoading}
                  className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? <><i className="fas fa-spinner fa-spin mr-2" />Memverifikasi...</> : 'Verifikasi Kode'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="page-enter">
              <h2 className="text-xl font-bold text-primary mb-1">Buat Kata Sandi Baru</h2>
              <p className="text-sm text-neutral mb-6">Masukkan kata sandi baru yang kuat.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Kata Sandi Baru</label>
                  <div className="relative">
                    <input type={showNew ? 'text' : 'password'} placeholder="Minimal 8 karakter" value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="btn-show-pass">
                      <i className={`fa-regular ${showNew ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  <PasswordStrengthBars score={getPasswordStrength(newPass)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Konfirmasi</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} placeholder="Ulangi kata sandi baru" value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="btn-show-pass">
                      <i className={`fa-regular ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  {confirmPass && (
                    <div className={`text-xs px-3 py-2 rounded-lg mt-2 ${newPass === confirmPass ? 'bg-tertiary-50 text-tertiary' : 'bg-red-50 text-red-500'}`}>
                      <i className={`fas ${newPass === confirmPass ? 'fa-check-circle' : 'fa-times-circle'} mr-1`} />
                      {newPass === confirmPass ? 'Kata sandi cocok' : 'Kata sandi tidak cocok'}
                    </div>
                  )}
                </div>
                <button type="button" onClick={step3} disabled={isLoading}
                  className="w-full py-3 bg-tertiary text-white rounded-xl font-semibold hover:bg-tertiary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? <><i className="fas fa-spinner fa-spin mr-2" />Menyimpan...</> : 'Simpan Kata Sandi Baru'}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {step === 4 && (
            <div className="page-enter text-center py-4">
              <div className="w-16 h-16 rounded-full bg-tertiary-50 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-tertiary text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Berhasil!</h2>
              <p className="text-sm text-neutral mb-6">Kata sandi berhasil diubah.</p>
              <button type="button" onClick={onBackToLogin}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors text-sm">
                <i className="fas fa-sign-in-alt text-xs" /> Masuk Sekarang
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button type="button"
              onClick={() => onBackToLogin ? onBackToLogin() : navigate('/login')}
              className="text-sm text-neutral hover:text-neutral-dark font-medium flex items-center gap-2 mx-auto">
              <i className="fas fa-arrow-left text-xs" /> Kembali ke Masuk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
