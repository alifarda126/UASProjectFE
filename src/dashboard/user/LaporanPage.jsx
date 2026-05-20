// src/pages/user/LaporanPage.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import { useApp } from '../../context/AppContext';
import { useFilters } from '../../hooks/useFilters';
import { formatRupiah } from '../../utils/formatters';
import { StatCards, FilterBar, TransactionTable, TableWrapper, PrintLayout } from './shared';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SkeletonLaporan } from '../../components/Skeleton';

Chart.register(...registerables);

/* ── Helper: bangun data 6 bulan terakhir ── */
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
    if (t.type === 'pemasukan') m.income += Number(t.amount);
    else m.expense += Number(t.amount);
  });
  return months;
}

/* ── Smart Y-axis formatting ── */
function smartTick(v) {
  if (v >= 1_000_000) return 'Rp' + (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + 'jt';
  if (v >= 1_000) return 'Rp' + (v / 1_000).toFixed(0) + 'rb';
  return 'Rp' + v;
}

function smartMax(maxVal) {
  if (maxVal <= 0) return 100_000;
  const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
  return Math.ceil(maxVal / mag) * mag * 1.25;
}

/* ── Warna per kategori pengeluaran ── */
const CAT_COLORS = {
  Operasional: '#083D56', Event: '#00695C', Sponsor: '#0C5272',
  Logistik: '#546E7A', Kepegawaian: '#00897B', Lainnya: '#78909C',
  Iuran: '#00897B',
};

export default function LaporanPage() {
  const { openModal } = useOutletContext();
  const { state, deleteTransaction, organisasi, fetchTransactions, isDataLoading } = useApp();
  const showToast = useToast();
  const filters = useFilters();
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // State untuk custom confirm dialog
  const [confirmId,  setConfirmId]  = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refresh data saat halaman dimuat
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchTransactions();
        filters.refresh();
      } catch (error) {
        console.error('Gagal memuat transaksi:', error);
      }
    };
    loadData();
  }, [fetchTransactions]);

  const stats = filters.getStats();
  const tableData = filters.getTableData();

  /* 6-bulan data */
  const months6 = useMemo(() => buildLast6Months(state.transactions), [state.transactions]);
  const hasChartData = months6.some(m => m.income > 0 || m.expense > 0);
  const maxVal = Math.max(...months6.map(m => Math.max(m.income, m.expense)), 0);

  /* Alokasi dari transaksi pengeluaran real per kategori */
  const allocations = useMemo(() => {
    const map = {};
    state.transactions
      .filter(t => t.type === 'pengeluaran')
      .forEach(t => { map[t.cat] = (map[t.cat] || 0) + Number(t.amount); });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount, color: CAT_COLORS[name] || '#9E9E9E' }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.transactions]);
  const totalAlloc = allocations.reduce((s, a) => s + a.amount, 0);

  /* ── Arus Kas Chart ── */
  useEffect(() => {
    if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; }
    if (!hasChartData) return;
    const ctx = chartRef.current?.getContext('2d');
    if (!ctx) return;
    const yMax = smartMax(maxVal);
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months6.map(m => m.label),
        datasets: [
          { label: 'Pemasukan', data: months6.map(m => m.income), borderColor: '#00695C', backgroundColor: 'rgba(0,105,92,0.08)', tension: 0.4, fill: true, pointBackgroundColor: '#00695C', pointRadius: 4 },
          { label: 'Pengeluaran', data: months6.map(m => m.expense), borderColor: '#083D56', backgroundColor: 'rgba(8,61,86,0.06)', tension: 0.4, fill: true, pointBackgroundColor: '#083D56', pointRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { family: 'Plus Jakarta Sans', size: 12 } } },
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

  // ✅ Tampilkan skeleton saat data pertama kali dimuat (setelah semua hooks)
  if (isDataLoading && state.transactions.length === 0) return <SkeletonLaporan />;

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = [['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah', 'Status']];
    tableData.forEach(t => rows.push([t.date, t.desc, t.cat, t.type, t.amount, t.status]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'laporan.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Export PDF via window.print() ── */
  const exportPDF = () => window.print();

  /* ── Hapus transaksi — buka dialog konfirmasi ── */
  const handleDelete = (id) => setConfirmId(id);

  /* ── Konfirmasi hapus — panggil API ── */
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(confirmId);
      showToast('Transaksi dihapus', 'success');
      await filters.refresh();
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menghapus transaksi';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <StatCards stats={stats} />

      <FilterBar
        timeFilter={filters.timeFilter}
        typeFilter={filters.typeFilter}
        customStart={filters.customStart}
        customEnd={filters.customEnd}
        search={filters.search}
        onSwitchTime={filters.switchTime}
        onSetType={filters.setTypeFilter}
        onCustomDate={filters.handleCustomDate}
        onSearch={filters.setSearch}
        extraRight={
          <>
            <button type="button" onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-tertiary/10 text-tertiary rounded-lg text-xs font-medium hover:bg-tertiary/20 transition-colors">
              <i className="fas fa-file-excel" /> CSV
            </button>
            <button type="button" onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
              <i className="fas fa-file-pdf" /> PDF
            </button>
          </>
        }
      />

      {/* ── Chart + Alokasi ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-neutral-light/30">
          <h3 className="font-semibold text-primary mb-4">Visualisasi Arus Kas</h3>
          {hasChartData ? (
            <div className="h-72"><canvas ref={chartRef} /></div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-neutral">
              <i className="fas fa-chart-line text-4xl text-neutral-light mb-3" />
              <p className="font-semibold text-sm text-neutral-dark">Belum ada data transaksi</p>
              <p className="text-xs mt-1">Tambah transaksi untuk melihat grafik arus kas</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-light/30">
          <h3 className="font-semibold text-primary mb-4">Alokasi Pengeluaran</h3>
          {allocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-neutral">
              <i className="fas fa-pie-chart text-3xl text-neutral-light mb-3" />
              <p className="text-xs font-semibold text-neutral-dark">Belum ada pengeluaran</p>
              <p className="text-[11px] mt-1">Data alokasi muncul dari transaksi pengeluaran</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {allocations.map((a, i) => {
                  const pct = totalAlloc > 0 ? Math.round(a.amount / totalAlloc * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-neutral-dark">{a.name}</span>
                        <span className="text-[11px] font-semibold" style={{ color: a.color }}>{pct}%</span>
                      </div>
                      <div className="pct-bar-track">
                        <div className="pct-bar-fill" style={{ width: `${pct}%`, background: a.color }} />
                      </div>
                      <p className="text-[10px] text-neutral mt-0.5">{formatRupiah(a.amount)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-neutral-light/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral uppercase tracking-wider">Total Pengeluaran</span>
                <span className="font-display font-bold text-sm text-neutral-dark">{formatRupiah(totalAlloc)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Tabel Transaksi ── */}
      <TableWrapper>
        <TransactionTable
          data={tableData}
          onEdit={(id) => openModal('editTxn', id)}
          onDelete={handleDelete}
          onViewProof={(id) => openModal('editTxn', id)}
        />
      </TableWrapper>

      {/* ── Hidden Print Layout ── */}
      <PrintLayout 
        organisasi={organisasi}
        stats={stats}
        allocations={allocations}
        tableData={tableData}
        totalAlloc={totalAlloc}
      />

      {/* ── Custom Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={confirmId !== null}
        title="Hapus Transaksi"
        message="Transaksi ini akan dihapus secara permanen dan tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}