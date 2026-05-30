import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { getInitials, formatRupiah, formatDate } from '../../utils/formatters';
import ConfirmDialog from '../../components/ConfirmDialog';

const MEMBER_COLORS = ['#083D56', '#00695C', '#546E7A', '#00897B', '#0C5272', '#78909C'];

/* Helper: hitung status iuran anggota  */
function getMemberStatus(member, duesSettings, transactions) {
  // Cari transaksi iuran untuk anggota ini dalam periode aktif
  const now = new Date();
  const intervalDays = duesSettings.interval || 30;
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - intervalDays);

  const iuranTxns = transactions.filter(t =>
    t.type === 'pemasukan' &&
    t.cat === 'Iuran' &&
    t.desc?.includes(member.name) &&
    new Date(t.date) >= periodStart
  );

  if (iuranTxns.length > 0) return 'dicatat';

  // Cek apakah periode sudah lewat (terlambat)
  const lastTxn = transactions
    .filter(t => t.type === 'pemasukan' && t.cat === 'Iuran' && t.desc?.includes(member.name))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!lastTxn) return 'belum';

  const lastDate = new Date(lastTxn.date);
  const nextDue = new Date(lastDate);
  nextDue.setDate(nextDue.getDate() + intervalDays);
  if (now > nextDue) return 'terlambat';

  return 'belum';
}

/* Helper: hitung periode iuran aktif  */
function getActivePeriod(duesSettings) {
  const now = new Date();
  const intervalDays = duesSettings.interval || 30;
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + intervalDays);

  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  const fmt = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  return { startStr: fmt(start), endStr: fmt(end), sisa: diffDays };
}

/* KOMPONEN UTAMA: Halaman Manajemen Anggota & Iuran Kas (User)  */
export default function AnggotaPage() {
  const navigate = useNavigate();
  const {
    state, addMember, deleteMember, toggleMemberPayment, toggleAllPayments,
    saveDuesSettings, recordAllDues,
  } = useApp();
  const showToast = useToast();

  const [form, setForm] = useState({ name: '', nim: '', phone: '' });
  const [duesDays,    setDuesDays]   = useState(state.duesSettings.interval);
  const [duesAmount,  setDuesAmount] = useState(state.duesSettings.amount);
  const [isRecording, setIsRecording] = useState(false);
  const [isAdding,    setIsAdding]   = useState(false);

  // State untuk confirm dialog hapus anggota
  const [confirmMemberId, setConfirmMemberId] = useState(null);
  const [isDeleting,      setIsDeleting]      = useState(false);

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleAddMember = async () => {
    if (!form.name || !form.nim || !form.phone) { showToast('Lengkapi data anggota', 'error'); return; }
    const color = MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)];
    setIsAdding(true);
    try {
      await addMember({ ...form, color, isPaid: false });
      setForm({ name: '', nim: '', phone: '' });
      showToast('Anggota berhasil ditambahkan', 'success');
    } catch (error) {
      showToast('Gagal menambah anggota', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveDues = async () => {
    if (!duesDays || duesDays <= 0) { showToast('Periode tidak valid', 'error'); return; }
    if (!duesAmount || duesAmount < 0) { showToast('Nominal tidak valid', 'error'); return; }
    try {
      await saveDuesSettings({ interval: Number(duesDays), amount: Number(duesAmount) });
      showToast('Pengaturan iuran disimpan ke sistem', 'success');
    } catch (err) {
      showToast('Gagal menyimpan pengaturan iuran', 'error');
    }
  };

  const handleRecordDues = async () => {
    const hasChecked = state.members.some((m) => m.isPaid);
    if (!hasChecked) { showToast('Silakan pilih (centang) anggota terlebih dahulu', 'error'); return; }
    const count = state.members.filter((m) => m.isPaid).length;
    setIsRecording(true);
    try {
      await recordAllDues();
      showToast(`Berhasil mencatat iuran untuk ${count} anggota!`, 'success');
      setTimeout(() => navigate('/dashboard/laporan'), 400);
    } catch (error) {
      showToast('Gagal mencatat iuran, coba lagi', 'error');
    } finally {
      setIsRecording(false);
    }
  };

  /* Buka dialog konfirmasi hapus anggota  */
  const handleDelete = (id) => setConfirmMemberId(id);

  /* Konfirmasi hapus — panggil API  */
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteMember(confirmMemberId);
      showToast('Anggota dihapus', 'success');
    } catch (error) {
      showToast('Gagal menghapus anggota', 'error');
    } finally {
      setIsDeleting(false);
      setConfirmMemberId(null);
    }
  };

  // Hitung status setiap anggota
  const membersWithStatus = useMemo(() =>
    state.members.map(m => ({
      ...m,
      status: getMemberStatus(m, state.duesSettings, state.transactions),
    })),
  [state.members, state.duesSettings, state.transactions]);

  const paidCount     = state.members.filter((m) => m.isPaid).length;
  const dicatatCount  = membersWithStatus.filter(m => m.status === 'dicatat').length;
  const skipCount     = state.members.length - dicatatCount;
  const period        = getActivePeriod(state.duesSettings);
  const hasDuesConfigured = state.duesSettings.hasSaved === true;

  return (
    <div className="page-enter space-y-5">

      {/* Banner Periode Iuran Aktif — hanya tampil jika pengaturan sudah disimpan  */}
      {hasDuesConfigured && (
        <div className="bg-white rounded-2xl border border-neutral-light/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-calendar-check text-tertiary text-sm" />
            </div>
            <div>
              <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">Periode Iuran Aktif</p>
              <p className="text-sm text-neutral-dark mt-0.5">
                {period.startStr} – {period.endStr}
                <span className="ml-2 text-xs text-neutral">Sisa {period.sisa} hari</span>
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-display font-bold text-primary">{dicatatCount}</p>
            <p className="text-[11px] text-neutral">Sudah Bayar</p>
          </div>
        </div>
      )}

      {/* Pengaturan Iuran Kas  */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-light/30">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <i className="fas fa-cogs text-secondary" /> Pengaturan Iuran Kas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Periode (Hari)</label>
            <input type="number" value={duesDays} onChange={(e) => setDuesDays(e.target.value)}
              className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Nominal (Rp)</label>
            <input type="number" value={duesAmount} onChange={(e) => setDuesAmount(e.target.value)}
              className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
          </div>
        </div>
        <button type="button" onClick={handleSaveDues}
          className="px-6 py-2.5 bg-secondary text-white rounded-xl text-sm font-semibold hover:bg-secondary-dark transition-colors">
          <i className="fas fa-save mr-2" />Simpan Pengaturan Iuran
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Tambah Anggota  */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-light/30">
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <i className="fas fa-user-plus text-tertiary" /> Tambah Anggota
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Nama Lengkap', key: 'name', placeholder: 'Nama anggota', type: 'text' },
              { label: 'NIM', key: 'nim', placeholder: 'Nomor Induk Mahasiswa', type: 'text' },
              { label: 'No. Telepon', key: 'phone', placeholder: '08xxxxxxxxxx', type: 'tel' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">{label}</label>
                <input type={type} placeholder={placeholder} value={form[key]} onChange={setF(key)}
                  className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
              </div>
            ))}
            <button type="button" onClick={handleAddMember} disabled={isAdding}
              className="w-full py-2.5 bg-tertiary text-white rounded-xl text-sm font-semibold hover:bg-tertiary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isAdding
                ? <><i className="fas fa-spinner fa-spin text-xs" /> Menambahkan...</>
                : <>Tambah Anggota</>
              }
            </button>
          </div>

          {/* Keterangan Status */}
          <div className="mt-6 pt-5 border-t border-neutral-light/40">
            <p className="text-[10px] font-semibold text-neutral uppercase tracking-wider mb-2">Keterangan Status</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-neutral-dark">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary flex-shrink-0" />
                <span><strong className="text-tertiary">Sudah Dicatat</strong> — Iuran sudah dicatat untuk periode ini</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-dark">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                <span><strong className="text-red-500">Terlambat</strong> — Periode iuran telah lewat dan belum membayar</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-dark">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span><strong className="text-amber-500">Belum Bayar</strong> — Belum membayar iuran periode ini</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Anggota  */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-neutral-light/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-primary">Daftar Anggota</h3>
              {state.members.length > 0 && (
                <span className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                  {state.members.length} orang
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toggleAllPayments(true)}
                className="text-xs text-tertiary hover:text-tertiary-dark underline">Centang Semua</button>
              <span className="text-neutral-light">|</span>
              <button type="button" onClick={() => toggleAllPayments(false)}
                className="text-xs text-red-500 hover:text-red-600 underline">Batal Centang</button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[380px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b border-neutral-light">
                  {['Anggota', 'NIM', 'Telepon', 'Status Iuran', 'Catat', 'Aksi'].map((h) => (
                    <th key={h} className={`${h === 'Status Iuran' || h === 'Catat' || h === 'Aksi' ? 'text-center' : 'text-left'} py-3 px-2 font-semibold text-neutral text-xs uppercase tracking-wider`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.members.length === 0 ? (
                  <tr><td colSpan="6" className="py-8 text-center text-neutral text-sm">Belum ada anggota</td></tr>
                ) : membersWithStatus.map((m) => {
                  const statusCfg = {
                    dicatat:   { label: 'Sudah Dicatat', cls: 'bg-tertiary-50 text-tertiary', dot: 'bg-tertiary' },
                    terlambat: { label: 'Terlambat',     cls: 'bg-red-50 text-red-500',       dot: 'bg-red-400' },
                    belum:     { label: 'Belum Bayar',   cls: 'bg-amber-50 text-amber-600',   dot: 'bg-amber-400' },
                  }[m.status] || { label: 'Belum Bayar', cls: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400' };

                  return (
                    <tr key={m.id} className={`member-row border-b border-neutral-light/30 transition-colors ${m.status === 'dicatat' ? 'opacity-60 bg-neutral-50/60' : ''}`}>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="member-avatar" style={{ background: m.color || '#083D56', width: 32, height: 32, fontSize: 10 }}>
                            {getInitials(m.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-dark text-sm truncate">{m.name}</p>
                            {m.lastPaidDate && (
                              <p className="text-[10px] text-neutral">Bayar terakhir: {formatDate(m.lastPaidDate)}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-sm text-neutral">{m.nim}</td>
                      <td className="py-3 px-2 text-sm text-neutral">{m.phone}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {/* Checkbox dinonaktifkan jika sudah dicatat — hanya bisa hapus */}
                        <input type="checkbox"
                          className={`w-5 h-5 ${m.status === 'dicatat' ? 'cursor-not-allowed opacity-40' : 'accent-tertiary cursor-pointer'}`}
                          checked={m.isPaid}
                          disabled={m.status === 'dicatat'}
                          onChange={() => m.status !== 'dicatat' && toggleMemberPayment(m.id)} />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button type="button" onClick={() => handleDelete(m.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Hapus Anggota">
                          <i className="fas fa-trash-alt text-xs" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer: Summary + Catat Iuran Button  */}
          <div className="mt-5 pt-5 border-t border-neutral-light/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <i className="fas fa-check-circle text-tertiary" />
                <span className="text-neutral-dark font-semibold">{dicatatCount} sudah dicatat</span>
              </span>
              <span className="text-neutral-light">|</span>
              <span className="flex items-center gap-1.5">
                <i className="fas fa-times-circle text-amber-400" />
                <span className="text-neutral-dark font-semibold">{skipCount} skip in</span>
              </span>
              <span className="text-neutral-light">|</span>
              <span className="text-neutral">Total anggota: <strong className="text-neutral-dark">{state.members.length}</strong></span>
            </div>
            {/* Disabled jika tidak ada anggota yang diceklis */}
            <button type="button" onClick={handleRecordDues}
              disabled={isRecording || paidCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tertiary to-teal-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
              {isRecording
                ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</>
                : <><i className="fas fa-hand-holding-usd" /> Catat Iuran Sekarang</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Custom Confirm Dialog hapus anggota  */}
      <ConfirmDialog
        isOpen={confirmMemberId !== null}
        title="Hapus Anggota"
        message="Anggota ini akan dihapus dari daftar kas. Data iuran yang sudah tercatat tidak akan terpengaruh."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmMemberId(null)}
      />
    </div>
  );
}
