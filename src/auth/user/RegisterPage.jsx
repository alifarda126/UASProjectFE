import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import OtpInput from '../../components/user/OtpInput';
import PasswordStrengthBars from '../../components/user/PasswordStrengthBars';
import CustomSelect from '../../components/user/CustomSelect';
import { getPasswordStrength } from '../../utils/passwordUtils';
import logoProject from '../../assets/MoneFloLogo.png';
/* ── KOMPONEN UTAMA: Halaman Registrasi (Daftar Organisasi Baru) ── */
/* Terdiri dari 3 langkah: Isi Data, Verifikasi OTP, dan Berhasil */
export default function RegisterPage({ onShowLogin }) {
  const showToast = useToast();
  const { updateProfile } = useApp();

  // Multi-step: 1=form, 2=otp, 3=success
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: '', type: '', email: '', phone: '', desc: '', pass: '', passConfirm: '',
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTips,    setShowTips]    = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isGoogleAuth, setIsGoogleAuth] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('oauth') === 'true') {
      setForm(f => ({ ...f, email: params.get('email') || '' }));
      setIsGoogleAuth(true);
    }
  }, [location.search]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [isLoading, setIsLoading] = useState(false);

  /* ── FUNGSI HANDLER STEP 1 ── */
  const handleRegister = () => {
    if (!form.name || !form.type || !form.email || !form.phone) {
      showToast('Lengkapi semua data wajib', 'error'); return;
    }
    // Password wajib untuk registrasi biasa, opsional untuk Google Auth
    if (!isGoogleAuth && !form.pass) {
      showToast('Lengkapi semua data wajib', 'error'); return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
      showToast('Format email tidak valid', 'error');
      return;
    }

    // Validasi nomor telepon minimal 11 karakter
    if (form.phone.replace(/[^0-9]/g, '').length < 11) {
      showToast('Nomor telepon minimal 11 angka', 'error');
      return;
    }

    if (!isGoogleAuth) {
      if (form.pass !== form.passConfirm) {
        showToast('Konfirmasi kata sandi tidak cocok', 'error'); return;
      }
      if (!/[a-zA-Z]/.test(form.pass) || !/\d/.test(form.pass)) {
        showToast('Kata sandi harus mengandung huruf dan angka', 'error'); return;
      }
      if (getPasswordStrength(form.pass) < 2) {
        showToast('Kata sandi terlalu lemah', 'error'); return;
      }
    }
    
    if (isGoogleAuth) {
      // Langsung hit API jika dari Google (karena email sudah terverifikasi)
      setIsLoading(true);
      import('../../utils/api').then(({ default: api }) => {
        api.post('/auth/register', { ...form, oauth: true })
          .then(() => {
            showToast('Organisasi berhasil didaftarkan!', 'success');
            setStep(3);
          })
          .catch((err) => {
            const msg = err.response?.data?.message || 'Gagal mendaftarkan organisasi';
            showToast(msg, 'error');
          })
          .finally(() => setIsLoading(false));
      });
    } else {
      // Pergi ke step OTP untuk email biasa dengan mengirim OTP dulu
      setIsLoading(true);
      import('../../utils/api').then(({ default: api }) => {
        api.post('/auth/send-otp', { email: form.email, action: 'register' })
          .then(() => {
            showToast('Kode verifikasi dikirim ke email', 'info');
            setStep(2);
          })
          .catch((err) => {
            const msg = err.response?.data?.message || 'Gagal mengirim OTP';
            showToast(msg, 'error');
          })
          .finally(() => setIsLoading(false));
      });
    }
  };

  /* ── FUNGSI HANDLER STEP 2: Memvalidasi kode OTP 6 digit & Hit API Registrasi ── */
  const handleVerifyOtp = async () => {
    if (otp.join('').length < 6) { showToast('Masukkan 6 digit kode', 'error'); return; }
    
    setIsLoading(true);
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/register', { ...form, otp: otp.join('') });
      
      showToast('Organisasi berhasil didaftarkan!', 'success');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mendaftarkan organisasi';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-lg items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={logoProject} alt="Logo MoneFlo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">MoneFlo</h1>
          <p className="text-white/60 mt-1 text-sm">
            {step === 1 && 'Daftarkan Organisasi Anda'}
            {step === 2 && 'Verifikasi Email'}
            {step === 3 && 'Pendaftaran Selesai'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* ========== STEP 1: Registration Form ========== */}
          {step === 1 && (
            <div className="page-enter">
              <h2 className="text-xl font-bold text-primary mb-1">Buat Akun Organisasi</h2>
              <p className="text-sm text-neutral mb-6">Lengkapi data identitas organisasi di bawah ini.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Nama Organisasi <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="Contoh: BEM Fakultas Teknik" value={form.name} onChange={set('name')}
                    className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Jenis Organisasi <span className="text-red-400">*</span></label>
                  <CustomSelect value={form.type} onChange={set('type')}
                    className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all">
                    <option value="">Pilih jenis</option>
                    {['Kemahasiswaan', 'Himpunan Mahasiswa', 'Unit Kegiatan Mahasiswa', 'OSIS', 'Lembaga', 'Komunitas', 'Yayasan', 'Lainnya'].map(t => <option key={t}>{t}</option>)}
                  </CustomSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Email Resmi <span className="text-red-400">*</span></label>
                  <input type="email" placeholder="humas@organisasi.com" value={form.email} onChange={set('email')} disabled={isGoogleAuth}
                    className={`input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all ${isGoogleAuth ? 'bg-neutral-100 text-neutral cursor-not-allowed opacity-80' : ''}`} />
                  {isGoogleAuth && (
                    <p className="text-[11px] text-tertiary mt-1.5 flex items-start gap-1">
                      <i className="fas fa-info-circle mt-0.5"></i>
                      <span>Email terisi dari Google. Jika ingin mengubah, selesaikan pendaftaran lalu ubah di Pengaturan Profil.</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">No. Telepon / WhatsApp <span className="text-red-400">*</span></label>
                  <input type="tel" placeholder="08xxxxxxxxxx" value={form.phone} onChange={set('phone')}
                    className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Deskripsi Singkat</label>
                  <textarea rows={2} placeholder="Ceritakan sedikit tentang organisasi..." value={form.desc} onChange={set('desc')}
                    className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all resize-none" />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Kata Sandi <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} placeholder="Minimal 8 karakter" value={form.pass} onChange={set('pass')}
                      className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-11" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="btn-show-pass">
                      <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  <PasswordStrengthBars score={getPasswordStrength(form.pass)} />
                  
                  {/* Password Tips Accordion */}
                  <div className="mt-3">
                    <button type="button" onClick={() => setShowTips(!showTips)} className="flex items-center gap-1.5 text-xs font-medium text-neutral hover:text-primary transition-colors">
                      <i className="fas fa-exclamation-circle text-tertiary"></i> Tips kata sandi yang kuat
                      <i className={`fas fa-chevron-${showTips ? 'up' : 'down'} ml-1 text-[10px]`}></i>
                    </button>
                    
                    {showTips && (
                      <div className="mt-2 bg-neutral-50 border border-neutral-light/60 rounded-xl p-4 text-sm animate-fade-in">
                        <p className="font-semibold text-primary-dark flex items-center gap-2 mb-3">
                          <i className="fas fa-shield-alt text-primary"></i> Tips Membuat Kata Sandi yang Kuat:
                        </p>
                        <ul className="space-y-2 text-neutral-dark">
                          <li className="flex items-start gap-2">
                            <i className="fas fa-check-circle text-tertiary mt-0.5 text-xs"></i> <span>Minimal <strong>8 karakter</strong></span>
                          </li>
                          <li className="flex items-start gap-2">
                            <i className="fas fa-check-circle text-tertiary mt-0.5 text-xs"></i> <span>Mengandung <strong>huruf kapital</strong> (A-Z) dan <strong>huruf kecil</strong> (a-z)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <i className="fas fa-check-circle text-tertiary mt-0.5 text-xs"></i> <span>Mengandung <strong>angka</strong> (0-9)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <i className="fas fa-check-circle text-tertiary mt-0.5 text-xs"></i> <span>Mengandung <strong>simbol/karakter khusus</strong> (@, #, $, %, !, _, -, dll)</span>
                          </li>
                        </ul>
                        <hr className="my-3 border-neutral-light" />
                        <p className="text-xs text-neutral mb-2 flex items-center gap-1.5">
                          <i className="fas fa-lightbulb text-yellow-500"></i> Contoh kata sandi kuat:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-white px-2.5 py-1 rounded border border-neutral-light text-xs font-mono text-neutral-dark">User_12345</span>
                          <span className="bg-white px-2.5 py-1 rounded border border-neutral-light text-xs font-mono text-neutral-dark">MoneFlo#2024</span>
                          <span className="bg-white px-2.5 py-1 rounded border border-neutral-light text-xs font-mono text-neutral-dark">Saya@Kuat99</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-1.5">Konfirmasi Kata Sandi <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} placeholder="Ulangi kata sandi" value={form.passConfirm} onChange={set('passConfirm')}
                      className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-11" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="btn-show-pass">
                      <i className={`fa-regular ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  {form.passConfirm && (
                    <div className={`text-xs px-3 py-2 rounded-lg mt-2 ${form.pass === form.passConfirm ? 'bg-tertiary-50 text-tertiary' : 'bg-red-50 text-red-500'}`}>
                      <i className={`fas ${form.pass === form.passConfirm ? 'fa-check-circle' : 'fa-times-circle'} mr-1`} />
                      {form.pass === form.passConfirm ? 'Kata sandi cocok' : 'Kata sandi tidak cocok'}
                    </div>
                  )}
                </div>

                <button type="button" onClick={handleRegister}
                  className="w-full py-3 bg-tertiary text-white rounded-xl font-semibold hover:bg-tertiary-light transition-colors mt-2">
                  Daftarkan Sekarang
                </button>

                {/* Divider */}
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-light"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-neutral">atau daftar dengan</span>
                  </div>
                </div>

                {/* Google Button */}
                <button type="button"
                  onClick={() => {
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
                    window.location.href = `${backendUrl}/api/auth/google/redirect`;
                  }}
                  className="w-full py-2.5 bg-white border border-neutral-light text-neutral-dark rounded-xl font-semibold hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-neutral mb-3">Sudah punya akun?</p>
                <button type="button" onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors text-sm">
                  <i className="fas fa-sign-in-alt text-xs" /> Masuk di Sini
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 2: OTP Verification ========== */}
          {step === 2 && (
            <div className="page-enter">
              <h2 className="text-xl font-bold text-primary mb-1">Masukkan Kode Verifikasi</h2>
              <p className="text-sm text-neutral mb-1">Kode dikirim ke <strong className="text-primary">{form.email}</strong></p>
              <p className="text-xs text-neutral mb-6">Kode berlaku 5 menit.{' '}
                <button type="button" onClick={() => {
                  import('../../utils/api').then(({ default: api }) => {
                    api.post('/auth/send-otp', { email: form.email, action: 'register' })
                      .then(() => showToast('Kode verifikasi baru telah dikirim', 'info'))
                      .catch(() => showToast('Gagal mengirim ulang OTP', 'error'));
                  });
                }}
                  className="text-tertiary font-semibold hover:text-tertiary-dark">Kirim ulang</button>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-3 text-center">Kode 6 Digit</label>
                  <OtpInput value={otp} onChange={setOtp} />
                </div>
                <button type="button" onClick={handleVerifyOtp}
                  className="w-full py-3 bg-tertiary text-white rounded-xl font-semibold hover:bg-tertiary-light transition-colors">
                  Verifikasi & Daftarkan
                </button>
              </div>

              <div className="mt-4 text-center">
                <button type="button" onClick={() => setStep(1)}
                  className="text-sm text-neutral hover:text-neutral-dark font-medium flex items-center gap-2 mx-auto">
                  <i className="fas fa-arrow-left text-xs" /> Kembali
                </button>
              </div>
            </div>
          )}

          {/* ========== STEP 3: Success ========== */}
          {step === 3 && (
            <div className="page-enter text-center py-4">
              <div className="w-16 h-16 rounded-full bg-tertiary-50 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-tertiary text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-primary mb-2">Berhasil!</h2>
              <p className="text-sm text-neutral mb-6">Organisasi Anda berhasil didaftarkan.</p>
              <button type="button" onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors text-sm">
                <i className="fas fa-sign-in-alt text-xs" /> Masuk Sekarang
              </button>

              <div className="mt-6">
                <button type="button" onClick={() => navigate('/login')}
                  className="text-sm text-neutral hover:text-neutral-dark font-medium flex items-center gap-2 mx-auto">
                  <i className="fas fa-arrow-left text-xs" /> Kembali ke Masuk
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
