import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';
import OtpInput from '../../components/user/OtpInput';
import PasswordStrengthBars from '../../components/user/PasswordStrengthBars';
import { getPasswordStrength } from '../../utils/passwordUtils';

/* ── KOMPONEN UTAMA: Halaman Pengaturan (User) ── */
/* Tempat pengurus mengubah sandi, mengelola email, dan memantau riwayat sesi (perangkat/browser aktif) */
export default function PengaturanPage() {
  const showToast = useToast();
  const { fetchUser, user } = useApp();

  const [activeSession, setActiveSession] = useState({
    device: 'Desktop',
    os: 'Windows',
    browser: 'Chrome',
    location: 'Mendeteksi lokasi...',
    icon: 'fa-desktop'
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { default: api } = await import('../../utils/api');
        const { data } = await api.get('/user/session');
        if (data) {
          setActiveSession(data);
        }
      } catch (error) {
        console.error('Gagal fetch session:', error);
      }
    };
    fetchSession();
  }, []);

  // ── State untuk Ubah Email ──────────────────────────────────────────
  const [emailStepUbah,  setEmailStepUbah]  = useState(1);
  const [currentEmail,   setCurrentEmail]   = useState('');
  const [newEmail,       setNewEmail]       = useState('');
  const [confirmEmail,   setConfirmEmail]   = useState('');
  const [emailPassVerify,setEmailPassVerify]= useState('');
  const [otpCode,        setOtpCode]        = useState('');
  const [otpInput,       setOtpInput]       = useState('');
  const [otpError,       setOtpError]       = useState('');
  const [showEmailPass,  setShowEmailPass]  = useState(false);

  const resetEmailUbah = () => {
    setEmailStepUbah(1); setCurrentEmail(''); setNewEmail('');
    setConfirmEmail(''); setEmailPassVerify('');
    setOtpCode(''); setOtpInput(''); setOtpError('');
  };

  const handleRequestOtp = async () => {
    if (!currentEmail) { showToast('Masukkan email saat ini', 'error'); return; }
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) { showToast('Format email baru tidak valid', 'error'); return; }
    if (newEmail !== confirmEmail) { showToast('Konfirmasi email tidak cocok', 'error'); return; }
    // emailPassVerify dipertahankan di UI, tapi mungkin tidak wajib di backend

    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/send-otp', { email: newEmail, action: 'update_email' });
      setOtpInput(''); setOtpError('');
      setEmailStepUbah(2);
      showToast(`Kode OTP dikirim ke ${newEmail}`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim OTP';
      showToast(msg, 'error');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) { setOtpError('Masukkan 6 digit kode OTP'); return; }

    try {
      const { default: api } = await import('../../utils/api');
      await api.put('/profil', { email: newEmail, otp: otpInput });
      
      setOtpError(''); setEmailStepUbah(3);
      showToast('Email berhasil diubah', 'success');
      // Refresh state user agar email baru langsung tampil di seluruh aplikasi
      await fetchUser();
    } catch (err) {
      const msg = err.response?.data?.message || 'Kode OTP tidak sesuai atau gagal mengubah email';
      setOtpError(msg);
      showToast(msg, 'error');
    }
  };

  const handleResendOtp = async () => {
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/send-otp', { email: newEmail, action: 'update_email' });
      setOtpInput(''); setOtpError('');
      showToast(`Kode OTP baru dikirim ke ${newEmail}`, 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim ulang OTP';
      showToast(msg, 'error');
    }
  };

  const labelCls = 'block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5';

  // Password method: 'old' | 'email'
  const [method, setMethod] = useState('old');

  // Method Old
  const [oldPass,     setOldPass]     = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld,  setShowOld]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);

  // Method Email
  const [emailStep, setEmailStep]       = useState(1);
  const [emailAddr, setEmailAddr]       = useState('');
  const [emailOtp,  setEmailOtp]        = useState(['', '', '', '', '', '']);
  const [emailNew,  setEmailNew]        = useState('');
  const [emailConf, setEmailConf]       = useState('');
  const [showEN, setShowEN] = useState(false);
  const [showEC, setShowEC] = useState(false);

  /* --- Method Old --- */
  const handleChangeOld = async () => {
    if (!oldPass) { showToast('Masukkan kata sandi lama', 'error'); return; }
    if (!newPass || newPass.length < 8) { showToast('Kata sandi baru minimal 8 karakter', 'error'); return; }
    if (newPass !== confirmPass) { showToast('Konfirmasi kata sandi tidak cocok', 'error'); return; }
    if (getPasswordStrength(newPass) < 2) { showToast('Kata sandi terlalu lemah', 'error'); return; }
    
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/profil/password', {
        current_password: oldPass,
        password: newPass,
        password_confirmation: confirmPass
      });
      setOldPass(''); setNewPass(''); setConfirmPass('');
      showToast('Kata sandi berhasil diubah', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah kata sandi';
      showToast(msg, 'error');
    }
  };

  /* --- Method Email --- */
  const emailStep1 = async () => {
    if (!emailAddr || !/\S+@\S+\.\S+/.test(emailAddr)) { showToast('Masukkan email yang valid', 'error'); return; }
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/auth/send-otp', { email: emailAddr, action: 'update_email' });
      setEmailStep(2);
      showToast('Kode verifikasi telah dikirim', 'info');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim OTP';
      showToast(msg, 'error');
    }
  };
  const emailStep2 = () => {
    if (emailOtp.join('').length < 6) { showToast('Masukkan 6 digit kode', 'error'); return; }
    setEmailStep(3); // OTP dikirim bersamaan dengan password baru di step 3
  };
  const emailStep3 = async () => {
    if (!emailNew || emailNew.length < 8) { showToast('Kata sandi baru minimal 8 karakter', 'error'); return; }
    if (emailNew !== emailConf) { showToast('Konfirmasi kata sandi tidak cocok', 'error'); return; }
    if (getPasswordStrength(emailNew) < 2) { showToast('Kata sandi terlalu lemah', 'error'); return; }
    
    try {
      const { default: api } = await import('../../utils/api');
      await api.post('/profil/password', {
        otp: emailOtp.join(''),
        password: emailNew,
        password_confirmation: emailConf
      });
      setEmailStep(4);
      showToast('Kata sandi berhasil diubah', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah kata sandi';
      showToast(msg, 'error');
    }
  };
  const resetEmail = () => { setEmailStep(1); setEmailAddr(''); setEmailOtp(['', '', '', '', '', '']); setEmailNew(''); setEmailConf(''); };

  return (
    <div className="page-enter space-y-6">
      {/* Change Password Card */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-light/30">
        <h3 className="font-semibold text-primary mb-5 flex items-center gap-2">
          <i className="fas fa-shield-alt text-secondary" /> Ubah Kata Sandi
        </h3>

        {/* Method Toggle — hanya tampilkan 'Kata Sandi Lama' */}
        <div className="bg-neutral-50 p-1 rounded-xl flex mb-6">
          <button type="button" id="btn-method-old"
            onClick={() => { setMethod('old'); resetEmail(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold text-neutral-dark transition-all ${method === 'old' ? 'active' : 'hover:bg-white/50'}`}>
            <i className="fas fa-key mr-1.5" /> Kata Sandi Lama
          </button>
        </div>

        {/* Method 1: Old password */}
        {method === 'old' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Kata Sandi Lama</label>
              <div className="relative">
                <input type={showOld ? 'text' : 'password'} placeholder="Kata sandi lama" value={oldPass} onChange={(e) => setOldPass(e.target.value)}
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                <button type="button" onClick={() => setShowOld(!showOld)} className="btn-show-pass">
                  <i className={`fa-regular ${showOld ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Kata Sandi Baru</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} placeholder="Minimal 8 karakter" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                    className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="btn-show-pass">
                    <i className={`fa-regular ${showNew ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
                <PasswordStrengthBars score={getPasswordStrength(newPass)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Konfirmasi</label>
                <div className="relative">
                  <input type={showConf ? 'text' : 'password'} placeholder="Ulangi kata sandi baru" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                    className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                  <button type="button" onClick={() => setShowConf(!showConf)} className="btn-show-pass">
                    <i className={`fa-regular ${showConf ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                  </button>
                </div>
                {confirmPass && (
                  <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${newPass === confirmPass ? 'bg-tertiary-50 text-tertiary' : 'bg-red-50 text-red-500'}`}>
                    <i className={`fas ${newPass === confirmPass ? 'fa-check-circle' : 'fa-times-circle'} mr-1`} />
                    {newPass === confirmPass ? 'Kata sandi cocok' : 'Kata sandi tidak cocok'}
                  </div>
                )}
              </div>
            </div>
            <button type="button" onClick={handleChangeOld}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
              Ubah Kata Sandi
            </button>
          </div>
        )}

        {/* Method 2: Email verification */}
        {method === 'email' && (
          <div>
            {emailStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-neutral mb-2">Masukkan email organisasi Anda untuk menerima kode verifikasi.</p>
                <div>
                  <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Email Terdaftar</label>
                  <input type="email" placeholder="nama@organisasi.com" value={emailAddr} onChange={(e) => setEmailAddr(e.target.value)}
                    className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
                </div>
                <button type="button" onClick={emailStep1}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
                  Kirim Kode Verifikasi
                </button>
              </div>
            )}

            {emailStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-neutral mb-1">Kode dikirim ke <strong className="text-primary">{emailAddr}</strong></p>
                <p className="text-xs text-neutral mb-4">Kode berlaku 5 menit.{' '}
                  <button type="button" onClick={emailStep1} className="text-tertiary font-semibold">Kirim ulang</button>
                </p>
                <div>
                  <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Kode 6 Digit</label>
                  <OtpInput value={emailOtp} onChange={setEmailOtp} />
                </div>
                <button type="button" onClick={emailStep2}
                  className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
                  Verifikasi Kode
                </button>
                <button type="button" onClick={resetEmail} className="w-full text-xs text-neutral hover:text-neutral-dark underline">Batal</button>
              </div>
            )}

            {emailStep === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-neutral mb-2">Verifikasi berhasil. Buat kata sandi baru.</p>
                <div>
                  <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Kata Sandi Baru</label>
                  <div className="relative">
                    <input type={showEN ? 'text' : 'password'} placeholder="Minimal 8 karakter" value={emailNew} onChange={(e) => setEmailNew(e.target.value)}
                      className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                    <button type="button" onClick={() => setShowEN(!showEN)} className="btn-show-pass">
                      <i className={`fa-regular ${showEN ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  <PasswordStrengthBars score={getPasswordStrength(emailNew)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Konfirmasi</label>
                  <div className="relative">
                    <input type={showEC ? 'text' : 'password'} placeholder="Ulangi kata sandi baru" value={emailConf} onChange={(e) => setEmailConf(e.target.value)}
                      className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                    <button type="button" onClick={() => setShowEC(!showEC)} className="btn-show-pass">
                      <i className={`fa-regular ${showEC ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                  </div>
                  {emailConf && (
                    <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${emailNew === emailConf ? 'bg-tertiary-50 text-tertiary' : 'bg-red-50 text-red-500'}`}>
                      <i className={`fas ${emailNew === emailConf ? 'fa-check-circle' : 'fa-times-circle'} mr-1`} />
                      {emailNew === emailConf ? 'Kata sandi cocok' : 'Kata sandi tidak cocok'}
                    </div>
                  )}
                </div>
                <button type="button" onClick={emailStep3}
                  className="w-full py-3 bg-tertiary text-white rounded-xl text-sm font-semibold hover:bg-tertiary-light transition-colors">
                  Simpan Kata Sandi Baru
                </button>
                <button type="button" onClick={resetEmail} className="w-full text-xs text-neutral hover:text-neutral-dark underline">Batal</button>
              </div>
            )}

            {emailStep === 4 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-tertiary-50 flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check-circle text-tertiary text-3xl" />
                </div>
                <h2 className="text-lg font-bold text-primary-dark mb-2">Kata Sandi Berhasil Diubah!</h2>
                <p className="text-sm text-neutral mb-6">Silakan gunakan kata sandi baru untuk login berikutnya.</p>
                <button type="button" onClick={() => { setMethod('old'); resetEmail(); }}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
                  Kembali
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Ubah Email ─────────────────────────────────────────────────── */}
      {user?.provider !== 'google' && (
      <div className="bg-white rounded-2xl p-6 border border-neutral-light/30">
        <h3 className="font-semibold text-primary mb-5 flex items-center gap-2">
          <i className="fas fa-envelope text-secondary" /> Ubah Email
        </h3>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${emailStepUbah >= s ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral'}`}>
                {emailStepUbah > s ? <i className="fas fa-check text-[10px]"></i> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 w-8 rounded-full transition-all ${emailStepUbah > s ? 'bg-primary' : 'bg-neutral-100'}`}></div>}
            </div>
          ))}
          <span className="ml-2 text-xs text-neutral">
            {emailStepUbah === 1 ? 'Isi Data' : emailStepUbah === 2 ? 'Verifikasi OTP' : 'Selesai'}
          </span>
        </div>

        {/* Step 1: Isi Data */}
        {emailStepUbah === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Email Saat Ini</label>
              <input type="email" value={currentEmail} onChange={e => setCurrentEmail(e.target.value)} placeholder="email@contoh.com"
                className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Email Baru</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="emailbaru@contoh.com"
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
              </div>
              <div>
                <label className={labelCls}>Konfirmasi Email Baru</label>
                <input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="Ulangi email baru"
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
                {confirmEmail && (
                  <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${newEmail === confirmEmail ? 'bg-tertiary-50 text-tertiary' : 'bg-red-50 text-red-500'}`}>
                    <i className={`fas ${newEmail === confirmEmail ? 'fa-check-circle' : 'fa-times-circle'} mr-1`} />
                    {newEmail === confirmEmail ? 'Cocok' : 'Tidak cocok'}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Verifikasi Kata Sandi</label>
              <div className="relative">
                <input type={showEmailPass ? 'text' : 'password'} value={emailPassVerify} onChange={e => setEmailPassVerify(e.target.value)}
                  placeholder="Konfirmasi dengan kata sandi akun"
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10" />
                <button type="button" onClick={() => setShowEmailPass(!showEmailPass)} className="btn-show-pass">
                  <i className={`fa-regular ${showEmailPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>
            <button type="button" onClick={handleRequestOtp}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
              <i className="fas fa-paper-plane mr-2"></i>Kirim Kode OTP
            </button>
          </div>
        )}

        {/* Step 2: Verifikasi OTP */}
        {emailStepUbah === 2 && (
          <div className="space-y-5">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-envelope-open-text text-primary text-sm"></i>
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-dark">Kode OTP Dikirim</p>
                <p className="text-xs text-neutral mt-0.5">Kode verifikasi 6 digit telah dikirim ke <strong>{newEmail}</strong>. Periksa email Anda dan masukkan kode di bawah.</p>
              </div>
            </div>
            <div>
              <label className={labelCls}>Kode OTP (6 digit)</label>
              <input type="text" maxLength={6} value={otpInput}
                onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                placeholder="_ _ _ _ _ _"
                className={`input-styled w-full px-4 py-3 border rounded-xl text-center text-xl font-bold tracking-[0.5em] outline-none transition-all ${otpError ? 'border-red-400 bg-red-50' : 'border-neutral-light'}`} />
              {otpError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><i className="fas fa-exclamation-circle"></i> {otpError}</p>}
            </div>
            <button type="button" onClick={handleVerifyOtp} disabled={otpInput.length !== 6}
              className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <i className="fas fa-shield-check mr-2"></i>Verifikasi &amp; Ubah Email
            </button>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setEmailStepUbah(1)} className="text-xs text-neutral hover:text-neutral-dark underline">
                <i className="fas fa-arrow-left mr-1"></i>Kembali
              </button>
              <button type="button" onClick={handleResendOtp} className="text-xs text-primary hover:text-primary-light font-medium">
                <i className="fas fa-redo mr-1"></i>Kirim Ulang OTP
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Sukses */}
        {emailStepUbah === 3 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-tertiary-50 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check-circle text-tertiary text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-primary-dark mb-2">Email Berhasil Diubah!</h2>
            <p className="text-sm text-neutral mb-1">Email baru Anda:</p>
            <p className="text-sm font-semibold text-primary mb-6">{newEmail}</p>
            <button type="button" onClick={resetEmailUbah}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors">
              Kembali
            </button>
          </div>
        )}
      </div>
      )}

      {/* Session History */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-light/30">
        <h4 className="text-sm font-semibold text-neutral-dark mb-2 flex items-center gap-2">
          <i className="fas fa-history text-secondary text-xs" /> Riwayat Sesi
        </h4>
        <div className="flex items-center gap-3 p-3 bg-tertiary-50 rounded-xl border border-tertiary/10">
          <div className="w-9 h-9 rounded-lg bg-tertiary flex items-center justify-center flex-shrink-0">
            <i className={`fas ${activeSession.icon} text-white text-sm`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-dark truncate">{activeSession.browser} di {activeSession.os}</p>
            <p className="text-xs text-neutral">{activeSession.location}</p>
          </div>
          <span className="text-[10px] font-semibold text-tertiary bg-tertiary-50 px-2 py-1 rounded-md flex-shrink-0">Aktif</span>
        </div>
      </div>
    </div>
  );
}
