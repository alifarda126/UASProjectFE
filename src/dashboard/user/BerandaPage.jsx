import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { useApp } from '../../context/AppContext';
import { useFilters } from '../../hooks/useFilters';
import { formatRupiah, formatDate, getInitials } from '../../utils/formatters';
import { StatCards, BuktiViewerModal } from './shared';
import { SkeletonBeranda } from '../../components/Skeleton';

Chart.register(...registerables);

/* FUNGSI UTILITY: Mengelompokkan data pemasukan & pengeluaran untuk 6 bulan terakhir  */
/* Digunakan untuk menyuplai data pada grafik Bar Chart */
function buildLast6Months(transactions) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
      year: d.getFullYear(), month: d.getMonth(),
      income: 0, expense: 0,
    });
  }
  transactions.forEach(t => {
    const d = new Date(t.date);
    const m = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
    if (!m) return;
    if (t.type === 'pemasukan') m.income  += Number(t.amount);
    else                       m.expense += Number(t.amount);
  });
  return months;
}

/* FUNGSI UTILITY: Memformat angka pada sumbu Y di grafik agar lebih ringkas (contoh: 1000000 jadi Rp1jt)  */
function smartTick(v) {
  if (v >= 1_000_000) return 'Rp' + (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'jt';
  if (v >= 1_000)     return 'Rp' + (v / 1_000).toFixed(0) + 'rb';
  return 'Rp' + v;
}

/* FUNGSI UTILITY: Menentukan batas maksimal sumbu Y pada grafik, diberi headroom 25% agar visual lebih rapi  */
function smartMax(maxVal) {
  if (maxVal <= 0) return 100_000;
  const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const nice = Math.ceil(maxVal / mag) * mag;
  return nice * 1.25; // 25% headroom
}

/* KOMPONEN UTAMA: Halaman Beranda (Dashboard User)  */
export default function BerandaPage() {
  const navigate = useNavigate();
  const { openModal } = useOutletContext();
  
  // Mengambil state global (berisi data transaksi, program, agenda) dari AppContext
  const { state, isDataLoading } = useApp();
  const filters = useFilters();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [viewBuktiTxn, setViewBuktiTxn] = useState(null);

  // Mengambil ringkasan statistik (total saldo, pemasukan, pengeluaran)
  const stats   = filters.getStats();
  // Mengambil data transaksi yang sudah difilter
  const filtered = filters.getFiltered();
  // Mengambil 5 transaksi terbaru untuk ditampilkan di daftar 'Transaksi Terakhir'
  const recent  = filtered.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  // Menyusun data 6 bulan terakhir khusus untuk grafik bar, dihitung ulang hanya jika state.transactions berubah
  const months6 = useMemo(() => buildLast6Months(state.transactions), [state.transactions]);
  // Mengecek apakah ada data transaksi untuk ditampilkan pada grafik
  const hasChartData = months6.some(m => m.income > 0 || m.expense > 0);
  const maxVal = Math.max(...months6.map(m => Math.max(m.income, m.expense)));

  /* BAGIAN CHART: Inisialisasi dan Render Chart.js  */
  useEffect(() => {
    if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }
    if (!hasChartData) return;
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;
    const yMax = smartMax(maxVal);
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months6.map(m => m.label),
        datasets: [
          { label: 'Pemasukan',   data: months6.map(m => m.income),  backgroundColor: '#00695C', borderRadius: 6, barPercentage: 0.55 },
          { label: 'Pengeluaran', data: months6.map(m => m.expense), backgroundColor: '#083D56', borderRadius: 6, barPercentage: 0.55 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'rectRounded', padding: 16, font: { family: 'Plus Jakarta Sans', size: 12 } } },
          tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ': ' + formatRupiah(ctx.raw) } },
        },
        scales: {
          y: {
            beginAtZero: true, max: yMax,
            ticks: { callback: smartTick, font: { family: 'Space Grotesk', size: 11 }, color: '#767779' },
            grid: { color: 'rgba(118,119,121,0.1)' },
          },
          x: { ticks: { font: { family: 'Plus Jakarta Sans', size: 12 }, color: '#424242' }, grid: { display: false } },
        },
      },
    });
    return () => chartInstance.current?.destroy();
  }, [hasChartData, months6, maxVal]);

  const colors = ['#00695C', '#083D56', '#00897B', '#546E7A', '#78909C', '#0C5272'];

  // Tampilkan skeleton saat data pertama kali dimuat (ditempatkan setelah semua hooks)
  if (isDataLoading && state.transactions.length === 0) return <SkeletonBeranda />;

  return (
    <div className="page-enter space-y-6">
      {/* KARTU STATISTIK: Menampilkan Saldo, Pemasukan & Pengeluaran  */}
      <StatCards stats={stats} />

      {/* BARIS PERTAMA: Berisi Grafik (Kiri) dan Realisasi Anggaran (Kanan)  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-neutral-light/30">
          <h3 className="font-semibold text-primary mb-4 text-sm">Pemasukan &amp; Pengeluaran 6 Bulan Terakhir</h3>
          {hasChartData ? (
            <div className="h-64"><canvas ref={chartRef} /></div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-neutral">
              <i className="fas fa-chart-bar text-4xl text-neutral-light mb-3" />
              <p className="font-semibold text-sm text-neutral-dark">Belum ada data transaksi</p>
              <p className="text-xs mt-1">Tambah transaksi untuk melihat grafik</p>
            </div>
          )}
        </div>

        {/* BAGIAN KANAN: Daftar Realisasi Anggaran (Progress Bar Program)  */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary text-sm">Realisasi Anggaran</h3>
            <button type="button" onClick={() => openModal('editReal')}
              className="text-[11px] text-tertiary font-semibold hover:text-tertiary-dark flex items-center gap-1">
              <i className="fas fa-pen text-[9px]" /> Revisi
            </button>
          </div>
          {state.programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-neutral">
              <i className="fas fa-tasks text-3xl text-neutral-light mb-3" />
              <p className="text-xs font-semibold text-neutral-dark">Belum ada program anggaran</p>
              <p className="text-[11px] mt-1">Klik Revisi untuk menambahkan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.programs.map((p, i) => {
                const clr = colors[i % colors.length];
                return (
                  <div key={i} className="prog-row flex items-center gap-3 p-2.5 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-neutral-dark font-medium truncate">{p.name}</span>
                        <span className="text-[11px] font-semibold flex-shrink-0 ml-2" style={{ color: clr }}>{p.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="progress-fill h-full rounded-full" style={{ width: `${p.progress}%`, background: clr }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BARIS KEDUA: Berisi Transaksi Terakhir (Kiri) dan Agenda Pembayaran (Kanan)  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-neutral-light/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary text-sm">Transaksi Terakhir</h3>
            <button type="button" onClick={() => navigate('/dashboard/transaksi')}
              className="text-xs text-tertiary font-semibold hover:text-tertiary-dark">Lihat Semua</button>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-neutral text-center py-4">Belum ada transaksi</p>}
            {recent.map((t) => {
              const isM = t.type === 'pemasukan';
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isM ? 'bg-tertiary-50' : 'bg-red-50'}`}>
                    <i className={`fas ${isM ? 'fa-arrow-down text-tertiary' : 'fa-arrow-up text-red-400'} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-dark truncate">{t.desc}</p>
                    <p className="text-xs text-neutral">{formatDate(t.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-display font-semibold text-sm ${isM ? 'text-tertiary' : 'text-red-500'}`}>
                      {isM ? '+' : '-'}{formatRupiah(t.amount)}
                    </p>
                    {t.docs?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setViewBuktiTxn(t)}
                        className="text-[10px] text-tertiary hover:text-primary mt-0.5 flex items-center gap-0.5 transition-colors cursor-pointer"
                        title={`Lihat ${t.docs.length} bukti`}
                      >
                        <i className="fas fa-paperclip mr-0.5" />{t.docs.length} file
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BAGIAN KANAN BAWAH: Panel Agenda Pembayaran  */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary text-sm">Agenda Pembayaran</h3>
            <button type="button" onClick={() => openModal('agenda')}
              className="w-7 h-7 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary hover:bg-tertiary/20 transition-colors" title="Tambah agenda">
              <i className="fas fa-plus text-xs" />
            </button>
          </div>
          <AgendaList onOpenModal={openModal} />
        </div>
      </div>

      {/* Modal Bukti Transaksi  */}
      <BuktiViewerModal txn={viewBuktiTxn} onClose={() => setViewBuktiTxn(null)} />
    </div>
  );
}

/* SUB-KOMPONEN: List Item untuk Agenda Pembayaran  */
/* Menerima props onOpenModal untuk mengedit agenda */
function AgendaList({ onOpenModal }) {
  const { state, deleteAgenda } = useApp();
  if (!state.agendas.length) return <p className="text-sm text-neutral text-center py-4">Belum ada agenda</p>;
  return (
    <div className="space-y-2">
      {state.agendas.map((a) => {
        const due = new Date(a.date);
        const now = new Date();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        const isUrgent  = diffDays <= 3;
        const isOverdue = diffDays < 0;
        return (
          <div key={a.id} className="agenda-item flex items-center gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-light/30">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-red-50' : isUrgent ? 'bg-amber-50' : 'bg-tertiary-50'}`}>
              <i className={`fas fa-calendar-alt text-sm ${isOverdue ? 'text-red-400' : isUrgent ? 'text-amber-500' : 'text-tertiary'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-neutral-dark truncate">{a.name}</p>
              <p className="text-[10px] text-neutral mt-0.5">{formatRupiah(a.amount)} · {formatDate(a.date)}</p>
            </div>
            <div className="agenda-actions flex gap-1 flex-shrink-0">
              <button type="button" onClick={() => onOpenModal('agenda', a)}
                className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-neutral-light hover:text-primary transition-colors">
                <i className="fas fa-pen text-[10px]" />
              </button>
              <button type="button" onClick={() => deleteAgenda(a.id)}
                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-neutral-light hover:text-red-500 transition-colors">
                <i className="fas fa-trash text-[10px]" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
