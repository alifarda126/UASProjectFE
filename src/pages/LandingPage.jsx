import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoProject from '../assets/MoneFloLogo.png';

/* ── Feature card data ── */
const FEATURES = [
  {
    icon: 'fa-wallet',
    color: '#00897B',
    bg: 'rgba(0,137,123,0.1)',
    title: 'Kelola Keuangan Organisasi',
    desc: 'Catat setiap pemasukan dan pengeluaran dengan mudah. Kategorisasi otomatis dan detail lengkap untuk setiap transaksi.',
  },
  {
    icon: 'fa-chart-line',
    color: '#0C5272',
    bg: 'rgba(12,82,114,0.1)',
    title: 'Laporan Real-Time',
    desc: 'Pantau arus kas organisasi dengan grafik interaktif. Ekspor laporan ke PDF kapan saja dengan tampilan profesional.',
  },
  {
    icon: 'fa-users',
    color: '#6B48D9',
    bg: 'rgba(107,72,217,0.1)',
    title: 'Pencatatan Iuran Anggota',
    desc: 'Kelola data anggota organisasi dengan mudah. Catat iuran dan kontribusi dari setiap anggota secara terpusat.',
  },
  {
    icon: 'fa-calendar-check',
    color: '#E05C26',
    bg: 'rgba(224,92,38,0.1)',
    title: 'Agenda & Kegiatan',
    desc: 'Catat dan pantau agenda kegiatan organisasi. Hubungkan kegiatan dengan anggaran yang telah direncanakan.',
  },
  {
    icon: 'fa-shield-halved',
    color: '#2E7D32',
    bg: 'rgba(46,125,50,0.1)',
    title: 'Keamanan Data',
    desc: 'Data keuangan organisasi Anda tersimpan aman dengan enkripsi tingkat tinggi dan sistem autentikasi berlapis.',
  },
  {
    icon: 'fa-bell',
    color: '#C62828',
    bg: 'rgba(198,40,40,0.1)',
    title: 'Notifikasi Cerdas',
    desc: 'Dapatkan notifikasi otomatis untuk transaksi penting dan jatuh tempo anggaran.',
  },
];

/* ── Steps data ── */
const STEPS = [
  {
    num: '1',
    icon: 'fa-building',
    color: '#00897B',
    bg: 'rgba(0,137,123,0.1)',
    title: 'Daftarkan Organisasi',
    desc: 'Buat akun dan daftarkan organisasi Anda dalam hitungan menit. Tidak perlu keahlian teknis.',
  },
  {
    num: '2',
    icon: 'fa-user-plus',
    color: '#0C5272',
    bg: 'rgba(12,82,114,0.1)',
    title: 'Data Anggota',
    desc: 'Masukkan data anggota organisasi dan mulai mencatat iuran atau kontribusi dari anggota.',
  },
  {
    num: '3',
    icon: 'fa-chart-pie',
    color: '#6B48D9',
    bg: 'rgba(107,72,217,0.1)',
    title: 'Mulai Kelola Keuangan',
    desc: 'Catat transaksi, pantau laporan, dan buat keputusan finansial yang lebih cerdas.',
  },
];

/* ── "Why MoneFlo" highlights — cocok untuk project UAS ── */
const HIGHLIGHTS = [
  {
    icon: 'fa-laptop-code',
    color: '#0C5272',
    bg: 'rgba(12,82,114,0.08)',
    title: 'Berbasis Web Modern',
    desc: 'Dibangun dengan teknologi web modern yang ringan, cepat, dan dapat diakses dari perangkat mana pun.',
  },
  {
    icon: 'fa-lock',
    color: '#00897B',
    bg: 'rgba(0,137,123,0.08)',
    title: 'Autentikasi Aman',
    desc: 'Sistem login multi-metode dengan OTP email dan OAuth Google. Setiap sesi dijaga dengan enkripsi token.',
  },
  {
    icon: 'fa-file-pdf',
    color: '#C62828',
    bg: 'rgba(198,40,40,0.08)',
    title: 'Ekspor Laporan PDF',
    desc: 'Hasilkan laporan keuangan organisasi dalam format PDF profesional siap cetak langsung dari dashboard.',
  },
  {
    icon: 'fa-mobile-screen',
    color: '#E05C26',
    bg: 'rgba(224,92,38,0.08)',
    title: 'Responsif di Semua Perangkat',
    desc: 'Tampilan menyesuaikan otomatis di desktop, tablet, maupun smartphone sehingga mudah digunakan di mana saja.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-root">

      {/* ══ NAVBAR ══ */}
      <nav className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav__inner landing-container">
          {/* Logo — pojok kiri */}
          <div className="landing-nav__logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoProject} alt="MoneFlo" className="landing-nav__logo-img" />
            <span className="landing-nav__logo-text">MoneFlo</span>
          </div>

          {/* Links — tengah */}
          <div className="landing-nav__links">
            <button onClick={() => scrollTo('fitur')} className="landing-nav__link">Fitur</button>
            <button onClick={() => scrollTo('cara-kerja')} className="landing-nav__link">Cara Kerja</button>
            <button onClick={() => scrollTo('tentang')} className="landing-nav__link">Tentang</button>
          </div>

          {/* CTA — pojok kanan */}
          <div className="landing-nav__cta">
            <button onClick={() => navigate('/login')} className="landing-btn landing-btn--ghost">
              Masuk
            </button>
            <button onClick={() => navigate('/register')} className="landing-btn landing-btn--primary">
              Daftar Gratis
            </button>
          </div>

          {/* Hamburger mobile */}
          <button className="landing-nav__hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="landing-mobile-menu">
            <button onClick={() => scrollTo('fitur')} className="landing-mobile-menu__item">Fitur</button>
            <button onClick={() => scrollTo('cara-kerja')} className="landing-mobile-menu__item">Cara Kerja</button>
            <button onClick={() => scrollTo('tentang')} className="landing-mobile-menu__item">Tentang</button>
            <div className="landing-mobile-menu__divider" />
            <button onClick={() => navigate('/login')} className="landing-btn landing-btn--ghost w-full">Masuk</button>
            <button onClick={() => navigate('/register')} className="landing-btn landing-btn--primary w-full">Daftar Gratis</button>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section className="landing-hero">
        <div className="landing-hero__blob landing-hero__blob--1" />
        <div className="landing-hero__blob landing-hero__blob--2" />
        <div className="landing-hero__blob landing-hero__blob--3" />
        <div className="landing-hero__grid" />

        <div className="landing-container landing-hero__content">
          <div className="landing-hero__badge">
            <span className="landing-hero__badge-dot" />
            Pengelola Keuangan Organisasi Berbasis Web
          </div>

          <h1 className="landing-hero__title">
            Kelola Keuangan
            <span className="landing-hero__title-gradient"> Organisasi</span>
            <br />Lebih Cerdas &amp; Transparan
          </h1>

          <p className="landing-hero__subtitle">
            MoneFlo membantu organisasi Anda mencatat, memantau, dan melaporkan
            keuangan secara real-time, mudah, aman, dan profesional.
          </p>

          <div className="landing-hero__actions">
            <button onClick={() => navigate('/register')} className="landing-btn landing-btn--hero-primary">
              <i className="fas fa-rocket mr-2" />
              Mulai Sekarang
            </button>
            <button onClick={() => scrollTo('fitur')} className="landing-btn landing-btn--hero-ghost">
              <i className="fas fa-circle-info mr-2" />
              Pelajari Fitur
            </button>
          </div>

          {/* Feature pills (replaced tech stack) */}
          <div className="landing-hero__mini-stats">
            <div className="landing-hero__mini-stat">
              <i className="fas fa-shield-halved" style={{ color: '#4ADE80', marginRight: 6 }} />
              <span>Aman & Terenkripsi</span>
            </div>
            <div className="landing-hero__mini-stat-divider" />
            <div className="landing-hero__mini-stat">
              <i className="fas fa-bolt" style={{ color: '#FFBD2E', marginRight: 6 }} />
              <span>Akses Cepat</span>
            </div>
            <div className="landing-hero__mini-stat-divider" />
            <div className="landing-hero__mini-stat">
              <i className="fas fa-mobile-screen" style={{ color: '#38BDF8', marginRight: 6 }} />
              <span>Multi-Perangkat</span>
            </div>
            <div className="landing-hero__mini-stat-divider" />
            <div className="landing-hero__mini-stat">
              <i className="fas fa-clock" style={{ color: '#FF5F57', marginRight: 6 }} />
              <span>Data Real-time</span>
            </div>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="landing-container landing-hero__mockup-wrap">
          <div className="landing-mockup">
            <div className="landing-mockup__topbar">
              <div className="landing-mockup__dots">
                <span style={{ background: '#FF5F57' }} />
                <span style={{ background: '#FFBD2E' }} />
                <span style={{ background: '#28CA41' }} />
              </div>
              <div className="landing-mockup__url">MoneFlo Dashboard</div>
            </div>
            <div className="landing-mockup__body">
              <div className="landing-mockup__sidebar">
                <div className="landing-mockup__sidebar-logo">
                  <img src={logoProject} alt="Logo" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                </div>
                {['fa-house', 'fa-arrow-right-arrow-left', 'fa-chart-bar', 'fa-users', 'fa-gear'].map((ic, i) => (
                  <div key={i} className={`landing-mockup__sidebar-item ${i === 0 ? 'active' : ''}`}>
                    <i className={`fas ${ic}`} />
                  </div>
                ))}
              </div>
              <div className="landing-mockup__main">
                <div className="landing-mockup__cards">
                  {[
                    { label: 'Total Pemasukan', val: 'Rp 12,5 Jt', color: '#00897B', icon: 'fa-arrow-up' },
                    { label: 'Total Pengeluaran', val: 'Rp 8,2 Jt', color: '#E05C26', icon: 'fa-arrow-down' },
                    { label: 'Saldo Bersih', val: 'Rp 4,3 Jt', color: '#0C5272', icon: 'fa-wallet' },
                  ].map((c, i) => (
                    <div key={i} className="landing-mockup__card">
                      <div className="landing-mockup__card-label">{c.label}</div>
                      <div className="landing-mockup__card-val" style={{ color: c.color }}>{c.val}</div>
                      <div className="landing-mockup__card-icon" style={{ background: c.color + '18' }}>
                        <i className={`fas ${c.icon}`} style={{ color: c.color, fontSize: 10 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="landing-mockup__chart">
                  <div className="landing-mockup__chart-label">Arus Kas 6 Bulan</div>
                  <div className="landing-mockup__bars">
                    {[60, 80, 45, 90, 70, 85].map((h, i) => (
                      <div key={i} className="landing-mockup__bar-wrap">
                        <div className="landing-mockup__bar" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="landing-mockup__txn-list">
                  <div className="landing-mockup__txn-label">Transaksi Terbaru</div>
                  {[
                    { name: 'Iuran Anggota', amt: '+Rp 500K', color: '#00897B' },
                    { name: 'Biaya Kegiatan', amt: '-Rp 200K', color: '#E05C26' },
                    { name: 'Dana Hibah', amt: '+Rp 1,5Jt', color: '#00897B' },
                  ].map((t, i) => (
                    <div key={i} className="landing-mockup__txn-row">
                      <div className="landing-mockup__txn-dot" style={{ background: t.color }} />
                      <span className="landing-mockup__txn-name">{t.name}</span>
                      <span className="landing-mockup__txn-amt" style={{ color: t.color }}>{t.amt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="landing-float-card landing-float-card--1">
            <i className="fas fa-check-circle" style={{ color: '#00897B', marginRight: 6 }} />
            <span>Laporan diekspor!</span>
          </div>
          <div className="landing-float-card landing-float-card--2">
            <i className="fas fa-bell" style={{ color: '#0C5272', marginRight: 6 }} />
            <span>3 transaksi baru</span>
          </div>
        </div>

        <div className="landing-hero__wave">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#F8FAFB" />
          </svg>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="fitur" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-badge">Fitur Unggulan</div>
            <h2 className="landing-section-title">Semua yang Anda Butuhkan</h2>
            <p className="landing-section-subtitle">
              Dari pencatatan harian hingga laporan keuangan — MoneFlo menyediakan
              semua alat yang dibutuhkan organisasi modern.
            </p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-card__icon" style={{ background: f.bg }}>
                  <i className={`fas ${f.icon}`} style={{ color: f.color, fontSize: 22 }} />
                </div>
                <h3 className="landing-feature-card__title">{f.title}</h3>
                <p className="landing-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="cara-kerja" className="landing-section landing-section--alt">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-badge">Cara Kerja</div>
            <h2 className="landing-section-title">Mulai dalam 3 Langkah Mudah</h2>
            <p className="landing-section-subtitle">
              Tidak perlu pengaturan rumit. Mulai kelola keuangan organisasi Anda hari ini.</p>
          </div>

          <div className="landing-steps-v2">
            {/* Connector line antara step */}
            <div className="landing-steps-v2__line" />

            {STEPS.map((s, i) => (
              <div key={i} className="landing-step-v2">
                {/* Circle dengan ikon */}
                <div className="landing-step-v2__circle" style={{ background: s.bg, borderColor: s.color + '40' }}>
                  <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: 24 }} />
                  {/* Badge nomor */}
                  <div className="landing-step-v2__num" style={{ background: s.color }}>
                    {s.num}
                  </div>
                </div>
                <h3 className="landing-step-v2__title">{s.title}</h3>
                <p className="landing-step-v2__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TENTANG (ganti Testimoni) ══ */}
      <section id="tentang" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-badge">Tentang Aplikasi</div>
            <h2 className="landing-section-title">Mengapa MoneFlo?</h2>
            <p className="landing-section-subtitle">
              MoneFlo dirancang sebagai solusi pengelolaan keuangan yang transparan,
              efisien, dan mudah digunakan oleh organisasi dari berbagai skala.
            </p>
          </div>

          <div className="landing-highlights-grid">
            {HIGHLIGHTS.map((h, i) => (
              <div key={i} className="landing-highlight-card">
                <div className="landing-highlight-card__icon" style={{ background: h.bg }}>
                  <i className={`fas ${h.icon}`} style={{ color: h.color, fontSize: 26 }} />
                </div>
                <div className="landing-highlight-card__body">
                  <h3 className="landing-highlight-card__title">{h.title}</h3>
                  <p className="landing-highlight-card__desc">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="landing-cta-section">
        <div className="landing-cta-blob landing-cta-blob--1" />
        <div className="landing-cta-blob landing-cta-blob--2" />
        <div className="landing-container landing-cta-content">
          <h2 className="landing-cta-title">Siap Mengelola Keuangan Organisasi Anda?</h2>
          <p className="landing-cta-subtitle">
            Daftar sekarang dan mulai kelola keuangan organisasi dengan lebih tertib,
            transparan, dan profesional bersama MoneFlo.
          </p>
          <div className="landing-cta-actions">
            <button onClick={() => navigate('/register')} className="landing-btn landing-btn--cta-primary">
              <i className="fas fa-rocket mr-2" />
              Daftar Sekarang
            </button>
            <button onClick={() => navigate('/login')} className="landing-btn landing-btn--cta-ghost">
              Sudah punya akun? Masuk
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer__inner">
          <div className="landing-footer__brand">
            <div className="landing-footer__logo">
              <img src={logoProject} alt="MoneFlo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              <span className="landing-footer__logo-text">MoneFlo</span>
            </div>
            <p className="landing-footer__tagline">
              Platform pengelolaan keuangan organisasi yang modern, aman, dan mudah digunakan.
            </p>
          </div>

          <div className="landing-footer__links-group">
            <div className="landing-footer__links-col">
              <div className="landing-footer__links-title">Navigasi</div>
              <button onClick={() => scrollTo('fitur')} className="landing-footer__link">Fitur</button>
              <button onClick={() => scrollTo('cara-kerja')} className="landing-footer__link">Cara Kerja</button>
              <button onClick={() => scrollTo('tentang')} className="landing-footer__link">Tentang</button>
            </div>
            <div className="landing-footer__links-col">
              <div className="landing-footer__links-title">Akun</div>
              <button onClick={() => navigate('/login')} className="landing-footer__link">Masuk</button>
              <button onClick={() => navigate('/register')} className="landing-footer__link">Daftar</button>
              <button onClick={() => navigate('/forgot-password')} className="landing-footer__link">Lupa Kata Sandi</button>
            </div>
          </div>
        </div>

        <div className="landing-footer__bottom">
          <div className="landing-container landing-footer__bottom-inner">
            <span>© {new Date().getFullYear()} MoneFlo — Aplikasi Web Pengelola Keuangan Organisasi</span>
            <span>Dibangun dengan Teknologi web modern</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
