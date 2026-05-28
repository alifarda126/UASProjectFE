import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useSystem } from '../../context/SystemContext';
import { useAuth } from '../../hooks/useAuth';
import GoogleIcon from '../../components/icons/SocialIcons';
import logoProject from '../../assets/MoneFloLogo.png';

/* ── KOMPONEN UTAMA: Halaman Login (Autentikasi) ── */
export default function LoginPage() {
  const showToast = useToast();
  const navigate = useNavigate();
  const { settings: sys } = useSystem();
  const { loginWithGoogle, isAuthenticated, user } = useAuth();
  
  const logoSrc = sys.logoUrl || logoProject;

  const [email,    setEmail]    = useState('');
  const [pass,     setPass]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Jika sudah login, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('moneflo_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  /* ── FUNGSI HANDLER: Memvalidasi dan memproses percobaan login manual ── */
  const handleLogin = async () => {
    if (!email || !pass) { 
      showToast('Harap isi email dan kata sandi', 'error'); 
      return; 
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showToast('Format email tidak valid', 'error');
      return;
    }

    if (pass.length < 8) {
      showToast('Kata sandi minimal 8 karakter', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Kita panggil API login manual yang disediakan di backend
      const { default: api } = await import('../../utils/api');
      const response = await api.post('/auth/login', { email, password: pass });
      
      if (remember) {
        localStorage.setItem('moneflo_remembered_email', email);
      } else {
        localStorage.removeItem('moneflo_remembered_email');
      }

      showToast('Berhasil masuk!', 'success');
      
      // Dispatch event global supaya App.jsx fetch ulang user lalu redirect ke dashboard
      window.dispatchEvent(new CustomEvent('auth:login_success'));


    } catch (error) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan saat login';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4 min-h-screen">
      <div className="w-full max-w-md relative z-10">
        {/* ── BAGIAN ATAS: Logo & Tagline Sistem ── */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-lg items-center justify-center flex-shrink-0 overflow-hidden">
            <img src={logoSrc} alt="Logo MoneFlo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">{sys.appName}</h1>
          <p className="text-white/60 mt-1 text-sm">{sys.tagline}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sys.announcement && (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3 animate-fade-in">
              <i className="fas fa-bullhorn text-amber-500 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">{sys.announcement}</p>
            </div>
          )}
          <h2 className="text-xl font-bold text-primary mb-1">Masuk ke Akun Organisasi</h2>
          <p className="text-sm text-neutral mb-6">Kelola keuangan organisasi Anda dengan mudah.</p>

          <div className="space-y-4">
            {/* ── INPUT FORM: Email & Kata Sandi ── */}
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="nama@organisasi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-1.5">Kata Sandi</label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="input-styled w-full px-4 py-3 border border-neutral-light rounded-xl text-sm outline-none transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="btn-show-pass absolute right-3 top-1/2 -translate-y-1/2 text-neutral">
                  <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-tertiary w-4 h-4 rounded" />
                Ingat saya
              </label>
              <Link to="/forgot-password" className="text-sm text-tertiary hover:text-tertiary-dark font-medium">
                Lupa sandi?
              </Link>
            </div>

            <button type="button" onClick={handleLogin} disabled={isLoading}
              className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-light transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <i className="fas fa-spinner fa-spin" /> : null}
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-light"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-neutral">atau masuk dengan</span>
              </div>
            </div>

            {/* Google Button */}
            <button type="button"
              onClick={loginWithGoogle}
              className="w-full py-2.5 bg-white border border-neutral-light text-neutral-dark rounded-xl font-semibold hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2">
              <GoogleIcon size={18} />
              Google
            </button>
          </div>

          <div className="mt-6 text-center">
            {sys.registOpen ? (
              <>
                <p className="text-sm text-neutral mb-3">Belum mendaftarkan organisasi?</p>
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-tertiary text-white rounded-xl font-semibold hover:bg-tertiary-light transition-colors text-sm">
                  <i className="fas fa-plus-circle text-xs" /> Daftar Organisasi
                </Link>
              </>
            ) : (
              <p className="text-xs text-neutral/60 italic">
                <i className="fas fa-lock mr-1" />Pendaftaran organisasi baru saat ini ditutup.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
