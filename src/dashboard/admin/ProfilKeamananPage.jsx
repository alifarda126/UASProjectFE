import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { getPasswordStrength, strengthColors, strengthLabels } from '../../utils/passwordStrength';
import OtpInput from '../../components/user/OtpInput';

function PwdInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-teal-600/60 focus:ring-2 focus:ring-teal-600/10 transition-all pr-10 placeholder-slate-500" />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
        <i className={`fas fa-eye${show ? '-slash' : ''} text-sm`} />
      </button>
    </div>
  );
}

function StrengthBar({ pass }) {
  const sc = getPasswordStrength(pass);
  if (!pass || sc < 0) return null;
  return (
    <div className="mt-2 flex gap-1 items-center">
      {[0,1,2,3,4].map(i => <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= sc ? strengthColors[sc] : '#334155' }} />)}
      <span className="text-[10px] ml-2 font-semibold" style={{ color: strengthColors[sc] }}>{strengthLabels[sc]}</span>
    </div>
  );
}

const LBL = 'block text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5';

/* ---- Info row (tabel info sistem) ---- */
function InfoRow({ icon, label, value, green }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
      <div className="flex items-center gap-2.5">
        <i className={`fas ${icon} text-slate-500 text-xs w-4`} />
        <span className="text-slate-500 text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium flex items-center gap-1.5 ${green ? 'text-emerald-400' : 'text-slate-600'}`}>
        {green && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />}
        {value}
      </span>
    </div>
  );
}

/* ---- Activity card dengan icon badge besar ---- */
function ActivityCard({ icon, iconBg, label, value, valueColor = 'text-slate-200' }) {
  return (
    <div className="flex items-center gap-3.5 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-200 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <i className={`fas ${icon} text-base`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-slate-500 text-xs">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 truncate ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

/* ── KOMPONEN UTAMA: Halaman Profil & Keamanan (Admin) ── */
/* Mengelola identitas Super Admin, perubahan kata sandi, serta melihat sesi login aktif dan info server */
export default function ProfilKeamananPage() {
  const showToast = useToast();
  const { settings } = useSystem();
  const { user, updateUser, changePassword } = useAuth();
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Placeholder untuk data dari backend (nantinya di-fetch dari API)
  const [sysInfo, setSysInfo] = useState({
    appVersion: 'v1.0.0',
    feFramework: 'React + Vite',
    beFramework: 'Laravel 11',
    styling: 'Tailwind CSS',
    dbEngine: 'MySQL',
    storageMode: 'Local Storage',
    serverStatus: 'Online',
    language: 'Indonesia',
    ipAddress: '192.168.1.1',
    timezone: 'Asia/Jakarta'
  });

  // ✅ State untuk session dari backend
  const [activeSession, setActiveSession] = useState({
    device: 'Desktop',
    os: 'Memuat...',
    browser: 'Memuat...',
    location: 'Mendeteksi lokasi...',
    icon: 'fa-desktop',
    ip_address: '',
    last_activity: ''
  });
  
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // ✅ Ambil session dari backend
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await api.get('/admin/user/session');
        setActiveSession({
          device: data.device || 'Desktop',
          os: data.os || 'Unknown',
          browser: data.browser || 'Unknown',
          location: data.location || 'Tidak diketahui',
          icon: data.icon || 'fa-desktop',
          ip_address: data.ip_address || '',
          last_activity: data.last_activity || ''
        });
      } catch (error) {
        console.error('Gagal mengambil session:', error);
        // Fallback ke deteksi lokal
        const ua = navigator.userAgent;
        let os = 'Unknown';
        let browser = 'Unknown';
        let device = 'Desktop';
        let icon = 'fa-desktop';

        if (/Windows/i.test(ua)) os = 'Windows';
        else if (/Mac/i.test(ua)) os = 'MacOS';
        else if (/Linux/i.test(ua)) os = 'Linux';
        else if (/Android/i.test(ua)) { os = 'Android'; device = 'Mobile'; icon = 'fa-mobile-alt'; }
        else if (/iPhone/i.test(ua)) { os = 'iOS'; device = 'Mobile'; icon = 'fa-mobile-alt'; }
        else if (/iPad/i.test(ua)) { os = 'iOS'; device = 'Tablet'; icon = 'fa-tablet-alt'; }

        if (/Edg/i.test(ua)) browser = 'Edge';
        else if (/Chrome/i.test(ua)) browser = 'Chrome';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/Safari/i.test(ua)) browser = 'Safari';

        setActiveSession(prev => ({
          ...prev,
          device,
          os,
          browser,
          icon,
          location: 'Deteksi lokal'
        }));
      } finally {
        setIsLoadingSession(false);
      }
    };
    
    fetchSession();
  }, []);

  /* ── Profile ── */
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');

  // Update ketika user berubah
  useEffect(() => {
    if (user?.name) setAdminName(user.name);
    if (user?.email) setAdminEmail(user.email);
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!adminName || !adminEmail) { showToast('Nama dan Email wajib diisi', 'error'); return; }
    try {
      await updateUser({ name: adminName, email: adminEmail });
      showToast('Profil berhasil diperbarui', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Gagal memperbarui profil', 'error');
    }
  };

  /* ── Password change ── */
  const [passMethod, setPassMethod] = useState('profile');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleChangeOld = async () => {
    if (!oldPass) { showToast('Masukkan kata sandi lama', 'error'); return; }
    if (!newPass || newPass.length < 8) { showToast('Kata sandi baru minimal 8 karakter', 'error'); return; }
    if (newPass !== confirmPass) { showToast('Konfirmasi tidak cocok', 'error'); return; }
    if (getPasswordStrength(newPass) < 2) { showToast('Kata sandi terlalu lemah', 'error'); return; }
    
    try {
      await changePassword({ current_password: oldPass, new_password: newPass, new_password_confirmation: confirmPass });
      setOldPass(''); setNewPass(''); setConfirmPass('');
      showToast('Kata sandi berhasil diubah', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Gagal mengubah kata sandi', 'error');
    }
  };

  /* ── Forgot flow ── */
  const [forgotStep, setForgotStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fpNew, setFpNew] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpSuccess, setFpSuccess] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const resetForgot = () => { setForgotStep(1); setOtp(['', '', '', '', '', '']); setFpNew(''); setFpConfirm(''); setFpSuccess(false); };

  const handleForgotStep1 = async () => {
    setIsForgotLoading(true);
    try {
      await api.post('/auth/send-otp', { email: adminEmail, action: 'forgot_password' });
      setForgotStep(2);
      showToast('Kode verifikasi telah dikirim ke email Anda', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengirim kode verifikasi', 'error');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleForgotStep2 = async () => {
    if (otp.join('').length < 6) { showToast('Masukkan 6 digit kode', 'error'); return; }
    setIsForgotLoading(true);
    try {
      await api.post('/auth/verify-otp', { email: adminEmail, otp: otp.join('') });
      setForgotStep(3);
    } catch (err) {
      showToast(err.response?.data?.message || 'Kode OTP tidak valid', 'error');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleForgotStep3 = async () => {
    if (!fpNew || fpNew.length < 8) { showToast('Kata sandi minimal 8 karakter', 'error'); return; }
    if (fpNew !== fpConfirm) { showToast('Konfirmasi tidak cocok', 'error'); return; }
    if (getPasswordStrength(fpNew) < 2) { showToast('Kata sandi terlalu lemah', 'error'); return; }
    
    setIsForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: adminEmail, otp: otp.join(''), password: fpNew, password_confirmation: fpConfirm });
      setFpSuccess(true);
      showToast('Kata sandi berhasil diubah', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Gagal mengubah kata sandi', 'error');
      if (error.response?.status === 400) setForgotStep(2);
    } finally {
      setIsForgotLoading(false);
    }
  };

  const tabBtn = (active) => `flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`;

  return (
    <div className="page-enter space-y-6">
      <div>
        <h2 className="text-slate-800 font-display font-bold text-xl">Profil & Keamanan</h2>
        <p className="text-slate-500 text-sm mt-0.5">Kelola profil dan keamanan akun administrator</p>
      </div>

      {/* Admin Profile Card */}
      <div className="admin-card rounded-2xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-teal-700/20 border border-teal-600/30 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-user-tie text-teal-600 text-2xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-800 font-display font-bold text-lg">Administrator</h3>
            <p className="text-slate-500 text-sm">{adminName} · {adminEmail}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktif
              </span>
              <span className="text-slate-600 text-xs">Terakhir login: baru saja</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="admin-card rounded-2xl p-6">
        <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
          <i className="fas fa-user-cog text-teal-600" /> Pengaturan Akun
        </h3>
        <div className="bg-slate-50 p-1 rounded-xl flex mb-6">
          <button type="button" onClick={() => setPassMethod('profile')} className={tabBtn(passMethod === 'profile')}><i className="fas fa-user-edit mr-1.5" /> Profil</button>
          <button type="button" onClick={() => setPassMethod('old')} className={tabBtn(passMethod === 'old')}><i className="fas fa-key mr-1.5" /> Kata Sandi</button>
          <button type="button" onClick={() => { setPassMethod('forgot'); resetForgot(); }} className={tabBtn(passMethod === 'forgot')}><i className="fas fa-unlock-alt mr-1.5" /> Lupa Sandi</button>
        </div>

        {passMethod === 'profile' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LBL}>Nama Lengkap</label>
                <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-teal-600/60 focus:ring-2 focus:ring-teal-600/10 transition-all placeholder-slate-500" />
              </div>
              <div>
                <label className={LBL}>Email Administrator</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:border-teal-600/60 focus:ring-2 focus:ring-teal-600/10 transition-all placeholder-slate-500" />
              </div>
            </div>
            <button type="button" onClick={handleUpdateProfile}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all">
              Simpan Perubahan
            </button>
          </div>
        )}

        {passMethod === 'old' && (
          <div className="space-y-4">
            <div><label className={LBL}>Kata Sandi Lama</label><PwdInput value={oldPass} onChange={setOldPass} placeholder="Kata sandi lama" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LBL}>Kata Sandi Baru</label>
                <PwdInput value={newPass} onChange={setNewPass} placeholder="Minimal 8 karakter" />
                <StrengthBar pass={newPass} />
              </div>
              <div>
                <label className={LBL}>Konfirmasi</label>
                <PwdInput value={confirmPass} onChange={setConfirmPass} placeholder="Ulangi kata sandi baru" />
                {confirmPass && (
                  <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${newPass === confirmPass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    <i className={`fas fa-${newPass === confirmPass ? 'check' : 'times'}-circle mr-1`} />
                    {newPass === confirmPass ? 'Cocok' : 'Tidak cocok'}
                  </div>
                )}
              </div>
            </div>
            <button type="button" onClick={handleChangeOld}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all">
              Ubah Kata Sandi
            </button>
          </div>
        )}

        {passMethod === 'forgot' && !fpSuccess && forgotStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">Kode verifikasi OTP akan dikirimkan ke email <strong>{adminEmail}</strong>.</p>
            <button type="button" onClick={handleForgotStep1} disabled={isForgotLoading} className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60">
              {isForgotLoading ? 'Mengirim...' : 'Kirim Kode Verifikasi'}
            </button>
            <button type="button" onClick={() => setPassMethod('old')} className="w-full text-xs text-slate-500 hover:text-slate-600 underline">Kembali</button>
          </div>
        )}

        {passMethod === 'forgot' && !fpSuccess && forgotStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">Masukkan 6 digit kode OTP yang dikirim ke email Anda.</p>
            <div>
              <label className={LBL}>Kode Verifikasi</label>
              <OtpInput value={otp} onChange={setOtp} />
            </div>
            <button type="button" onClick={handleForgotStep2} disabled={isForgotLoading || otp.join('').length < 6} className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60 mt-2">
              {isForgotLoading ? 'Memverifikasi...' : 'Verifikasi Kode'}
            </button>
            <button type="button" onClick={resetForgot} className="w-full text-xs text-slate-500 hover:text-slate-600 underline">Batal</button>
          </div>
        )}

        {passMethod === 'forgot' && !fpSuccess && forgotStep === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-2">Verifikasi berhasil. Buat kata sandi baru Anda.</p>
            <div><label className={LBL}>Kata Sandi Baru</label><PwdInput value={fpNew} onChange={setFpNew} placeholder="Minimal 8 karakter" /><StrengthBar pass={fpNew} /></div>
            <div>
              <label className={LBL}>Konfirmasi Kata Sandi Baru</label>
              <PwdInput value={fpConfirm} onChange={setFpConfirm} placeholder="Ulangi kata sandi baru" />
              {fpConfirm && <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${fpNew === fpConfirm ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}><i className={`fas fa-${fpNew === fpConfirm ? 'check' : 'times'}-circle mr-1`} />{fpNew === fpConfirm ? 'Cocok' : 'Tidak cocok'}</div>}
            </div>
            <button type="button" onClick={handleForgotStep3} disabled={isForgotLoading} className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60">
              {isForgotLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
            </button>
            <button type="button" onClick={resetForgot} className="w-full text-xs text-slate-500 hover:text-slate-600 underline">Batal</button>
          </div>
        )}

        {passMethod === 'forgot' && fpSuccess && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-check-circle text-emerald-400 text-3xl" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Kata Sandi Berhasil Diubah!</h2>
            <p className="text-sm text-slate-500 mb-6">Gunakan kata sandi baru untuk login berikutnya.</p>
            <button type="button" onClick={() => { setPassMethod('old'); resetForgot(); }}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all">Kembali</button>
          </div>
        )}
      </div>

      {/* ✅ Session Info - UPDATED dengan data dari backend */}
      <div className="admin-card rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-history text-teal-600 text-xs" /> Sesi Aktif
          {activeSession.ip_address && (
            <span className="text-xs text-slate-500 ml-2">IP: {activeSession.ip_address}</span>
          )}
        </h4>
        
        {isLoadingSession ? (
          <div className="flex items-center justify-center py-4">
            <i className="fas fa-spinner fa-spin text-slate-500" />
            <span className="text-slate-500 text-sm ml-2">Memuat sesi...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-teal-600/10 rounded-xl border border-teal-600/20">
            <div className="w-9 h-9 rounded-lg bg-teal-700/20 flex items-center justify-center flex-shrink-0">
              <i className={`fas ${activeSession.icon} text-teal-600 text-sm`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {activeSession.browser} di {activeSession.os}
                {activeSession.device === 'Mobile' && <span className="ml-1 text-xs text-slate-500">(Mobile)</span>}
                {activeSession.device === 'Tablet' && <span className="ml-1 text-xs text-slate-500">(Tablet)</span>}
              </p>
              <p className="text-xs text-slate-500">{activeSession.location}</p>
              {activeSession.last_activity && (
                <p className="text-xs text-slate-600 mt-1">Aktivitas terakhir: {activeSession.last_activity}</p>
              )}
            </div>
            <span className="text-[10px] font-semibold text-teal-600 bg-teal-600/10 px-2 py-1 rounded-md flex-shrink-0">
              <i className="fas fa-circle text-[6px] mr-1 text-emerald-400" /> Aktif
            </span>
          </div>
        )}
      </div>

      {/* Bottom 3-col — Info Sistem + Konfigurasi Aktif + Aktivitas Sistem */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Informasi Sistem */}
        <div className="admin-card rounded-2xl p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-info-circle text-emerald-400 text-sm" />
            </div>
            <h3 className="text-slate-800 font-display font-semibold">Informasi Sistem</h3>
          </div>
          <InfoRow icon="fa-code-branch" label="Versi Aplikasi" value={sysInfo.appVersion} />
          <InfoRow icon="fa-layer-group" label="Frontend"       value={sysInfo.feFramework} />
          <InfoRow icon="fa-server"      label="Backend"        value={sysInfo.beFramework} />
          <InfoRow icon="fa-palette"     label="Styling"        value={sysInfo.styling} />
          <InfoRow icon="fa-signal"      label="Status Server"  value={sysInfo.serverStatus} green={sysInfo.serverStatus === 'Online'} />
          <InfoRow icon="fa-hdd"         label="Storage"        value={sysInfo.storageMode} />
          <InfoRow icon="fa-database"    label="Database"       value={sysInfo.dbEngine} />
        </div>

        {/* Konfigurasi Aktif */}
        <div className="admin-card rounded-2xl p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-slate-600/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-cog text-slate-500 text-sm" />
            </div>
            <h3 className="text-slate-800 font-display font-semibold">Konfigurasi Aktif</h3>
          </div>
          <InfoRow icon="fa-font"      label="Nama Aplikasi" value={settings.appName} />
          <InfoRow icon="fa-comment"   label="Tagline"        value={settings.tagline.length > 22 ? settings.tagline.slice(0,20)+'…' : settings.tagline} />
          <InfoRow icon="fa-envelope"  label="Email Kontak"   value={adminEmail} />
          <InfoRow icon="fa-door-open" label="Pendaftaran"     value={settings.registOpen ? 'Dibuka' : 'Ditutup'} green={settings.registOpen} />
          <InfoRow icon="fa-bullhorn"  label="Pengumuman"      value={settings.announcement ? 'Aktif' : 'Tidak Ada'} green={!!settings.announcement} />
          <InfoRow icon="fa-clock"     label="Zona Waktu"      value={sysInfo.timezone} />
          <InfoRow icon="fa-language"  label="Bahasa"          value={sysInfo.language} />
        </div>

        {/* Aktivitas Sistem — icon badge berwarna besar */}
        <div className="admin-card rounded-2xl p-5 lg:p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-sky-600/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-chart-simple text-sky-400 text-sm" />
            </div>
            <h3 className="text-slate-800 font-display font-semibold">Aktivitas Sistem</h3>
          </div>
          <div className="space-y-2.5">
            <ActivityCard icon="fa-circle-check"  iconBg="bg-emerald-500/15 text-emerald-500" label="Status Sesi"      value="1 Sesi Aktif"  valueColor="text-emerald-500" />
            <ActivityCard icon="fa-calendar-check" iconBg="bg-teal-700/15 text-teal-600"    label="Hari Beroperasi" value="1 Hari"        valueColor="text-teal-600" />
            <ActivityCard icon="fa-clock"          iconBg="bg-slate-500/15 text-slate-500"   label="Tanggal Login"   value={today}        valueColor="text-slate-600" />
            <ActivityCard icon="fa-code"           iconBg="bg-amber-500/15 text-amber-500"   label="Mode Deployment" value="Development"   valueColor="text-amber-500" />
            <ActivityCard icon="fa-shield-halved"  iconBg="bg-[#083D56]/15 text-[#083D56]"  label="Level Akses"     value="Super Admin"  valueColor="text-[#083D56]" />
            <ActivityCard icon="fa-network-wired"  iconBg="bg-teal-600/15 text-teal-600"    label="IP Address"      value={activeSession.ip_address || sysInfo.ipAddress} valueColor="text-slate-600" />
            <ActivityCard icon="fa-server"         iconBg="bg-emerald-500/15 text-emerald-500" label="Uptime Server"   value="Online"       valueColor="text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
}