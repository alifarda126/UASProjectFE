import { useAdmin } from '../../context/AdminContext';
import { useRef, useEffect, useMemo, useState, useCallback, forwardRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const fmt  = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

function smartTick(v) {
  if (v >= 1_000_000) return 'Rp' + (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'jt';
  if (v >= 1_000)     return 'Rp' + (v / 1_000).toFixed(0) + 'rb';
  return 'Rp' + v;
}

function smartMax(maxVal) {
  if (maxVal <= 0) return 100_000;
  const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const nice = Math.ceil(maxVal / mag) * mag;
  return nice * 1.25;
}

function smartMaxCount(maxVal) {
  if (maxVal <= 0) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const nice = Math.ceil(maxVal / mag) * mag;
  return Math.ceil(nice * 1.25);
}

/* ── SUB-KOMPONEN: Pembungkus Chart.js Generik (forwardRef agar parent bisa akses canvas) ── */
const ChartCanvas = forwardRef(function ChartCanvas({ config, height = 'h-52' }, fwdRef) {
  const internalRef = useRef(null);
  const canvasRef   = fwdRef || internalRef;
  const inst = useRef(null);
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (inst.current) inst.current.destroy();
    const finalConfig = {
      ...config,
      options: {
        ...config.options,
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    };
    inst.current = new Chart(ctx, finalConfig);
    return () => inst.current?.destroy();
  }, [JSON.stringify(config)]);
  return <div className={height}><canvas ref={canvasRef} className="w-full h-full" /></div>;
});

const GRID  = { color: 'rgba(255,255,255,0.05)' };
const TICKS = (cb) => ({ ticks: { callback: cb, color: '#64748b', font: { size: 11 } }, grid: GRID });
const TICKS_INT = (cb) => ({ ticks: { callback: cb, color: '#64748b', font: { size: 11 }, stepSize: 1 }, grid: GRID });

/* ── FUNGSI UTILITY: Ekspor data laporan organisasi ke file CSV ── */
function exportCSV(orgs) {
  // Header kolom
  const header = ['Nama', 'Tipe', 'Email', 'Anggota', 'Saldo', 'Status'];
  
  // Mapping baris
  const rows = orgs.map(o => [o.name, o.type, o.email, o.memberCount, o.balance, o.status]);
  
  // Gabungin data: 'sep=;' bikin Excel otomatis pake titik koma. '\ufeff' biar UTF-8 jalan.
  const csvContent = "\ufeff" + "sep=;\n" + [header, ...rows].map(r => r.join(';')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  a.href = url;
  a.download = `laporan-organisasi-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── KOMPONEN: Admin Print Layout (tersembunyi kecuali saat print) ── */
function AdminPrintLayout({ orgs, stats, laporanSummary, chartImages = {} }) {
  const fmtPrint = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);
  const totalSaldo  = laporanSummary.total_saldo     || stats.totalBalance || 0;
  const totalMasuk  = laporanSummary.total_pemasukan  || 0;
  const totalKeluar = laporanSummary.total_pengeluaran || 0;
  const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const STATUS_PRINT = {
    'Aktif':      { bg: '#e0f2f1', color: '#00695C' },
    'Pending':    { bg: '#fffde7', color: '#f59e0b' },
    'Non-aktif':  { bg: '#f5f5f5', color: '#546e7a' },
    'Tersuspend': { bg: '#fdecea', color: '#c62828' },
  };

  return (
    <div className="admin-print-layout">
      {/* Header */}
      <div style={{ borderBottom: '3px solid #083D56', paddingBottom: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#083D56,#00695C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>M</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#083D56', lineHeight: 1.1 }}>MoneFlo Admin</div>
            <div style={{ fontSize: 9, color: '#546e7a', marginTop: 2 }}>Sistem Manajemen Keuangan Organisasi</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#083D56' }}>Laporan Sistem</div>
          <div style={{ fontSize: 9, color: '#546e7a', marginTop: 2 }}>Dicetak: {now}</div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ fontSize: 9, fontWeight: 700, color: '#083D56', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, borderLeft: '3px solid #00695C', paddingLeft: 8 }}>Ringkasan Sistem</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total Organisasi', value: stats.total || 0 },
          { label: 'Organisasi Aktif', value: stats.aktif || 0 },
          { label: 'Total Anggota',    value: stats.totalMembers || 0 },
          { label: 'Total Saldo',      value: fmtPrint(totalSaldo) },
        ].map(({ label, value }) => (
          <div key={label} style={{ border: '1.5px solid #e0e7ef', borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: '#546e7a', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#083D56' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Keuangan global */}
      <div style={{ fontSize: 9, fontWeight: 700, color: '#083D56', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, borderLeft: '3px solid #00695C', paddingLeft: 8 }}>Ringkasan Keuangan Global</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total Saldo',       value: fmtPrint(totalSaldo),  color: '#083D56' },
          { label: 'Total Pemasukan',   value: fmtPrint(totalMasuk),  color: '#00695C' },
          { label: 'Total Pengeluaran', value: fmtPrint(totalKeluar), color: '#c62828' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ border: '1.5px solid #e0e7ef', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: '#546e7a', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Grafik (2x2 grid dari canvas images) */}
      {(chartImages.donut || chartImages.hbar || chartImages.vbar || chartImages.line) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#083D56', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, borderLeft: '3px solid #00695C', paddingLeft: 8 }}>Grafik Statistik Organisasi</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { key: 'donut', label: 'Distribusi Status Organisasi' },
              { key: 'hbar',  label: 'Saldo Tertinggi per Organisasi' },
              { key: 'vbar',  label: 'Jumlah Organisasi per Tipe' },
              { key: 'line',  label: 'Jumlah Anggota per Organisasi' },
            ].map(({ key, label }) =>
              chartImages[key] ? (
                <div key={key} style={{ border: '1.5px solid #e0e7ef', borderRadius: 8, padding: 8, background: '#fff' }}>
                  <div style={{ fontSize: 7.5, fontWeight: 700, color: '#546e7a', marginBottom: 4 }}>{label}</div>
                  <img src={chartImages[key]} alt={label} style={{ width: '100%', height: 'auto', maxHeight: 120, objectFit: 'contain', display: 'block' }} />
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Tabel organisasi */}
      <div style={{ fontSize: 9, fontWeight: 700, color: '#083D56', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, borderLeft: '3px solid #00695C', paddingLeft: 8 }}>Daftar Organisasi ({orgs.length})</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8.5 }}>
        <thead>
          <tr style={{ background: '#083D56' }}>
            {['#', 'Nama Organisasi', 'Tipe', 'Email', 'Anggota', 'Saldo', 'Status'].map(h => (
              <th key={h} style={{ color: '#fff', padding: '6px 8px', textAlign: h === 'Saldo' || h === 'Anggota' ? 'right' : h === 'Status' ? 'center' : 'left', fontWeight: 600, fontSize: 8 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orgs.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#90a4ae', padding: 16 }}>Belum ada organisasi</td></tr>
          ) : orgs.map((org, idx) => {
            const displayStatus = org.isSuspended ? 'Tersuspend' : org.status;
            const sc = STATUS_PRINT[displayStatus] || { bg: '#f5f5f5', color: '#546e7a' };
            const initials = org.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
            return (
              <tr key={org.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', color: '#546e7a' }}>{idx + 1}</td>
                <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {org.logo_url
                      ? <img src={org.logo_url} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 20, height: 20, borderRadius: 5, background: (org.color || '#083D56') + '25', color: org.color || '#083D56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, flexShrink: 0 }}>{initials}</div>
                    }
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{org.name}</span>
                  </div>
                </td>
                <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', color: '#546e7a' }}>{org.type}</td>
                <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', color: '#546e7a' }}>{org.email || '-'}</td>
                <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', textAlign: 'right', color: '#083D56', fontWeight: 600 }}>{org.memberCount}</td>
                <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', textAlign: 'right', color: '#083D56', fontWeight: 600 }}>{fmtPrint(org.balance)}</td>
                <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', textAlign: 'center' }}>
                  <span style={{ background: sc.bg, color: sc.color, padding: '2px 7px', borderRadius: 4, fontSize: 7.5, fontWeight: 600 }}>{displayStatus}</span>
                </td>
              </tr>
            );
          })}
          {orgs.length > 0 && (
            <tr style={{ background: '#f0f4f8', fontWeight: 700 }}>
              <td colSpan={4} style={{ padding: '5px 8px', borderTop: '2px solid #083D56', color: '#083D56' }}>Total</td>
              <td style={{ padding: '5px 8px', borderTop: '2px solid #083D56', textAlign: 'right', color: '#083D56' }}>{stats.totalMembers}</td>
              <td style={{ padding: '5px 8px', borderTop: '2px solid #083D56', textAlign: 'right', color: '#083D56' }}>{fmtPrint(totalSaldo)}</td>
              <td style={{ borderTop: '2px solid #083D56' }} />
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: 20, paddingTop: 8, borderTop: '1.5px solid #e0e7ef', display: 'flex', justifyContent: 'space-between', fontSize: 7.5, color: '#90a4ae' }}>
        <span>MoneFlo — Sistem Manajemen Keuangan Organisasi</span>
        <span>Dokumen ini dibuat otomatis · {now}</span>
      </div>
    </div>
  );
}

/* ── KOMPONEN UTAMA: Halaman Laporan (Admin) ── */
/* Menyajikan ringkasan dan statistik global seluruh organisasi dalam bentuk grafik dan tabel */
export default function LaporanAdminPage() {
  const { orgs, stats, laporanSummary, fetchAdminData, fetchLaporanKeuangan, refreshAdminData, laporanLoading } = useAdmin();

  // ✅ Fetch laporan keuangan & data organisasi saat komponen dimuat
  useEffect(() => {
    fetchAdminData();
    fetchLaporanKeuangan();
  }, [fetchAdminData, fetchLaporanKeuangan]);

  // ✅ Listener untuk refresh data admin saat ada perubahan dari user
  useEffect(() => {
    const handleAdminDataRefresh = () => {
      console.log('📢 Event admin:data-changed diterima, refreshing...');
      if (refreshAdminData) {
        refreshAdminData();
      } else {
        // Fallback jika refreshAdminData tidak tersedia
        fetchLaporanKeuangan();
      }
    };
    
    window.addEventListener('admin:data-changed', handleAdminDataRefresh);
    return () => window.removeEventListener('admin:data-changed', handleAdminDataRefresh);
  }, [refreshAdminData, fetchLaporanKeuangan]);

  /* derived data */
  const byType       = useMemo(() => {
    const map = {};
    orgs.forEach(o => { map[o.type] = (map[o.type] || 0) + 1; });
    return Object.entries(map);
  }, [orgs]);

  const topBalance   = useMemo(() => [...orgs].sort((a, b) => b.balance - a.balance), [orgs]);
  const topMembers   = useMemo(() => [...orgs].sort((a, b) => b.memberCount - a.memberCount), [orgs]);

  const STATUS_STYLE = {
    'Aktif':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Pending':   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Non-aktif': 'bg-slate-600/30 text-slate-500 border-slate-600/50',
    'Tersuspend': 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  // ✅ Gunakan data dari laporanSummary untuk total saldo yang akurat
  const totalSaldoReal = laporanSummary.total_saldo || stats.totalBalance;
  const totalPemasukanReal = laporanSummary.total_pemasukan || 0;
  const totalPengeluaranReal = laporanSummary.total_pengeluaran || 0;

  const maxBalance = topBalance.length > 0 ? Math.max(...topBalance.map(o => o.balance)) : 0;
  const maxTypeCount = byType.length > 0 ? Math.max(...byType.map(([, c]) => c)) : 0;
  const maxMemberCount = topMembers.length > 0 ? Math.max(...topMembers.map(o => o.memberCount)) : 0;

  /* ── KONFIGURASI GRAFIK: Menyiapkan parameter visual untuk 4 grafik (Donut, Bar Horizontal, Bar Vertikal, Line) ── */
  const donutConfig = {
    type: 'doughnut',
    data: {
      labels: ['Aktif', 'Pending', 'Non-aktif', 'Tersuspend'],
      datasets: [{ data: [stats.aktif, stats.pending, stats.nonAktif, stats.suspended],
        backgroundColor: ['#00897B99', '#F59E0B99', '#78909C99', '#EF444499'],
        borderColor:     ['#00897B',   '#F59E0B',   '#78909C',   '#EF4444'],
        borderWidth: 2, hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { size: 11 }, padding: 12 } } },
    },
  };

  // Palet warna teal-emerald yang harmonis untuk bar chart saldo
  const TEAL_PALETTE = [
    '#083D56', '#0C5272', '#0C7A6E', '#00897B', '#26A69A',
    '#4DB6AC', '#006064', '#00838F', '#0097A7', '#00ACC1',
  ];

  const hBarConfig = {
    type: 'bar',
    data: {
      labels: topBalance.map(o => o.name.length > 16 ? o.name.slice(0,15) + '…' : o.name),
      datasets: [{ label: 'Saldo', data: topBalance.map(o => o.balance),
        backgroundColor: topBalance.map((_, i) => TEAL_PALETTE[i % TEAL_PALETTE.length] + 'BB'),
        borderColor:     topBalance.map((_, i) => TEAL_PALETTE[i % TEAL_PALETTE.length]),
        borderWidth: 1.5, borderRadius: 6, barPercentage: 0.6 }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ...TICKS(smartTick), beginAtZero: true, max: smartMax(maxBalance) },
        y: { ticks: { color: '#475569', font: { size: 11 } }, grid: { display: false } },
      },
    },
  };

  const vBarConfig = {
    type: 'bar',
    data: {
      labels: byType.map(([t]) => t.length > 14 ? t.slice(0,13) + '…' : t),
      datasets: [{ label: 'Jumlah', data: byType.map(([, c]) => c),
        backgroundColor: '#0C7A6E99', borderColor: '#0C7A6E',
        borderWidth: 1.5, borderRadius: 5, barPercentage: 0.55 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ...TICKS_INT(v => v + ' org'), beginAtZero: true, max: smartMaxCount(maxTypeCount) },
        x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
      },
    },
  };

  const lineConfig = {
    type: 'line',
    data: {
      labels: topMembers.map(o => o.name.length > 14 ? o.name.slice(0,13) + '…' : o.name),
      datasets: [{ label: 'Anggota', data: topMembers.map(o => o.memberCount),
        borderColor: '#083D56', backgroundColor: '#083D5615',
        pointBackgroundColor: '#083D56', pointBorderColor: '#00897B', pointRadius: 4,
        tension: 0.35, fill: true }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ...TICKS_INT(v => v + ' org'), beginAtZero: true, max: smartMaxCount(maxMemberCount) },
        x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
      },
    },
  };

  /* ── Refs untuk setiap canvas chart ── */
  const donutRef = useRef(null);
  const hBarRef  = useRef(null);
  const vBarRef  = useRef(null);
  const lineRef  = useRef(null);

  /* ── State gambar chart untuk dikirim ke AdminPrintLayout ── */
  const [chartImages, setChartImages] = useState({});

  /* ── Export PDF — tangkap semua canvas chart sebelum print ── */
  const exportPDF = useCallback(() => {
    const snap = (ref) => {
      try { return ref.current ? ref.current.toDataURL('image/png', 1.0) : null; } catch (_) { return null; }
    };
    setChartImages({
      donut: snap(donutRef),
      hbar:  snap(hBarRef),
      vbar:  snap(vBarRef),
      line:  snap(lineRef),
    });
    // Simpan judul halaman sebelum print
    const originalTitle = document.title;
    document.title = `Laporan Sistem - ${new Date().toISOString().slice(0,10)}`;
    // Beri waktu React render ulang AdminPrintLayout dengan gambar sebelum print
    setTimeout(() => {
      window.print();
      setTimeout(() => { document.title = originalTitle; }, 100);
    }, 150);
  }, []);

  /* ================================================================ */
  return (
    <div className="page-enter space-y-5 print:space-y-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-slate-800 font-display font-bold text-xl">Laporan Sistem</h2>
          <p className="text-slate-500 text-sm mt-0.5">Ringkasan data dan keuangan seluruh organisasi terdaftar</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button type="button" onClick={() => exportCSV(orgs)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-600/40 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-600/60 text-sm font-semibold transition-all">
            <i className="fas fa-file-csv text-xs text-teal-600" /> Ekspor CSV
          </button>
          <button type="button" onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#083D56] hover:bg-[#0C5272] text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-[#083D56]/30">
            <i className="fas fa-print text-xs" /> Cetak / PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Organisasi', value: stats.total,             icon: 'fa-sitemap',      color: 'text-teal-600',    bg: 'bg-teal-700/20'    },
          { label: 'Organisasi Aktif', value: stats.aktif,             icon: 'fa-check-circle', color: 'text-emerald-500', bg: 'bg-emerald-600/20' },
          { label: 'Total Anggota',    value: stats.totalMembers,      icon: 'fa-users',         color: 'text-slate-500',   bg: 'bg-slate-700/20'   },
          { label: 'Total Saldo',      value: fmt(totalSaldoReal),     icon: 'fa-wallet',       color: 'text-amber-500',   bg: 'bg-amber-600/20'   },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="admin-card rounded-2xl p-5 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <i className={`fas ${icon} ${color} text-base`} />
            </div>
            <div className="min-w-0">
              <p className="text-slate-500 text-xs">{label}</p>
              <p className="text-slate-800 font-display font-bold text-lg mt-0.5 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1 — Donut + Horizontal Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="admin-card rounded-2xl p-5">
          <h3 className="text-slate-800 font-semibold text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-chart-pie text-teal-600 text-xs" /> Distribusi Status Organisasi
          </h3>
          <ChartCanvas ref={donutRef} config={donutConfig} height="h-56" />
        </div>
        <div className="admin-card rounded-2xl p-5">
          <h3 className="text-slate-800 font-semibold text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-chart-bar text-amber-400 text-xs" /> Saldo Tertinggi per Organisasi
          </h3>
          <ChartCanvas ref={hBarRef} config={hBarConfig} height="h-56" />
        </div>
      </div>

      {/* Row 2 — Vertical Bar + Line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="admin-card rounded-2xl p-5">
          <h3 className="text-slate-800 font-semibold text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-layer-group text-teal-600 text-xs" /> Jumlah Organisasi per Tipe
          </h3>
          <ChartCanvas ref={vBarRef} config={vBarConfig} height="h-52" />
        </div>
        <div className="admin-card rounded-2xl p-5">
          <h3 className="text-slate-800 font-semibold text-sm mb-4 flex items-center gap-2">
            <i className="fas fa-chart-line text-emerald-500 text-xs" /> Jumlah Anggota per Organisasi
          </h3>
          <ChartCanvas ref={lineRef} config={lineConfig} height="h-52" />
        </div>
      </div>

      {/* Summary Table */}
      <div className="admin-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-slate-800 font-semibold text-sm">Ringkasan Keuangan Organisasi</h3>
          <span className="text-slate-500 text-xs">{orgs.length} organisasi</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {['#', 'Organisasi', 'Tipe', 'Anggota', 'Saldo', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laporanLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">Memuat data...</td></tr>
              ) : orgs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">Belum ada organisasi</td></tr>
              ) : (
                orgs.map((org, idx) => {
                  const initials = org.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
                  const displayStatus = org.isSuspended ? 'Tersuspend' : org.status;
                  return (
                    <tr key={org.id} className="border-b border-slate-200 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-600 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
                            style={!org.logo_url ? { backgroundColor: org.color + '25', color: org.color } : {}}>
                            {org.logo_url
                              ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                              : initials
                            }
                          </div>
                          <p className="text-slate-800 text-sm font-medium truncate max-w-[140px]">{org.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm">{org.type}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{org.memberCount}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm font-medium">{fmt(org.balance)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[displayStatus] || ''}`}>
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {orgs.length > 0 && !laporanLoading && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-white">
                  <td colSpan={3} className="px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wider">Total</td>
                  <td className="px-4 py-3 text-slate-800 text-sm font-bold">{stats.totalMembers}</td>
                  <td className="px-4 py-3 text-slate-800 text-sm font-bold">{fmt(totalSaldoReal)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── Hidden Admin Print Layout (ditampilkan hanya saat print) ── */}
      <AdminPrintLayout orgs={orgs} stats={stats} laporanSummary={laporanSummary} chartImages={chartImages} />
    </div>
  );
}