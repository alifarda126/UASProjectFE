import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useFilters } from '../../hooks/useFilters';
import { StatCards, FilterBar, TransactionTable, TableWrapper } from './shared';
import { useToast } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { SkeletonTransaksi } from '../../components/Skeleton';

/* KOMPONEN UTAMA: Halaman Transaksi  */
/* Menampilkan daftar lengkap pemasukan dan pengeluaran beserta fitur filter & pencarian */
export default function TransaksiPage() {
  const { openModal } = useOutletContext();

  const { deleteTransaction, fetchTransactions, isDataLoading, state } = useApp();
  const showToast = useToast();
  const filters = useFilters();

  // State untuk custom confirm dialog
  const [confirmId,   setConfirmId]   = useState(null); // ID transaksi yang akan dihapus
  const [isDeleting,  setIsDeleting]  = useState(false);

  // Auto-refresh data saat halaman dimuat
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

  // Mengambil ringkasan statistik dan data tabel yang sudah terfilter
  const stats     = filters.getStats();
  const tableData = filters.getTableData();

  // Tampilkan skeleton saat data pertama kali dimuat
  if (isDataLoading && state.transactions.length === 0) return <SkeletonTransaksi />;

  /* HANDLER: Buka dialog konfirmasi hapus  */
  const handleDeleteRequest = (id) => setConfirmId(id);

  /* HANDLER: Konfirmasi hapus — panggil API  */
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(confirmId);
      showToast('Transaksi dihapus', 'success');
      await filters.refresh();
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal menghapus transaksi';
      showToast(message, 'error');
    } finally {
      setIsDeleting(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* KARTU STATISTIK  */}
      <StatCards stats={stats} />

      {/* BARIS FILTER & PENCARIAN  */}
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
      />

      {/* TABEL TRANSAKSI  */}
      <TableWrapper>
        <TransactionTable
          data={tableData}
          onEdit={(id) => openModal('editTxn', id)}
          onDelete={handleDeleteRequest}
          onViewProof={(id) => openModal('editTxn', id)}
        />
      </TableWrapper>

      {/* Custom Confirm Dialog (pengganti window.confirm)  */}
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