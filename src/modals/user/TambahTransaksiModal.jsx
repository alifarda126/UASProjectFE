/* ── KOMPONEN MODAL: Form catat transaksi baru (User) ── */
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/user/Modal';
import CustomSelect from '../../components/user/CustomSelect';
import FileDropZone from '../../components/FileDropZone';



export default function TambahTransaksiModal({ isOpen, onClose }) {
  const { addTransaction } = useApp();
  const showToast = useToast();

  // ── Helpers tanggal ──
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // ── Form states ──
  const [date,         setDate]         = useState(getTodayDate());
  const [displayDate,  setDisplayDate]  = useState(formatDateForDisplay(getTodayDate()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [type,         setType]         = useState('pemasukan');
  const [desc,         setDesc]         = useState('');
  const [cat,          setCat]          = useState('Operasional');
  const [amount,       setAmount]       = useState('');
  const [note,         setNote]         = useState('');
  const [files,        setFiles]        = useState([]); // { url, name, size, mime_type, is_image }
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileRef       = useRef(null);
  const datePickerRef = useRef(null);

  // ── Reset form saat modal ditutup ──
  useEffect(() => {
    if (!isOpen) {
      const today = getTodayDate();
      setDate(today);
      setDisplayDate(formatDateForDisplay(today));
      setType('pemasukan');
      setDesc('');
      setCat('Operasional');
      setAmount('');
      setNote('');
      setFiles([]);
      setShowDatePicker(false);
      setCurrentMonth(new Date());
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // ── Tutup date picker saat klik di luar ──
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Calendar helpers ──
  const getDaysInMonth     = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day) => {
    const year  = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const selectedDate = `${year}-${month}-${dayStr}`;
    setDate(selectedDate);
    setDisplayDate(formatDateForDisplay(selectedDate));
    setShowDatePicker(false);
  };

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const goToToday = () => {
    const today = getTodayDate();
    setDate(today);
    setDisplayDate(formatDateForDisplay(today));
    const [year, month] = today.split('-');
    setCurrentMonth(new Date(parseInt(year), parseInt(month) - 1, 1));
    setShowDatePicker(false);
  };

  const clearDate = () => { setDate(''); setDisplayDate(''); setShowDatePicker(false); };

  const renderCalendar = () => {
    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay    = getFirstDayOfMonth(year, month);
    const today       = getTodayDate();
    const monthNames  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isToday    = currentDate === today;
      const isSelected = currentDate === date;
      days.push(
        <button key={day} onClick={() => handleDateSelect(day)}
          className={`h-10 rounded-lg text-sm font-medium transition-all
            ${isSelected ? 'bg-tertiary text-white' : 'hover:bg-neutral-50 text-neutral-dark'}
            ${isToday && !isSelected ? 'border border-tertiary text-tertiary' : ''}`}>
          {day}
        </button>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-light/50 p-4 w-80">
        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center text-neutral">
            <i className="fas fa-chevron-left text-sm" />
          </button>
          <div className="flex gap-2">
            <span className="text-sm font-semibold text-neutral-dark">{monthNames[month]}</span>
            <span className="text-sm font-semibold text-neutral-dark">{year}</span>
          </div>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center text-neutral">
            <i className="fas fa-chevron-right text-sm" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2 px-1">
          {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-neutral py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">{days}</div>
        <div className="flex gap-2 pt-3 border-t border-neutral-light/50">
          <button onClick={clearDate} className="flex-1 px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-50 rounded-lg transition-colors">Hapus</button>
          <button onClick={goToToday} className="flex-1 px-3 py-2 text-sm font-medium bg-tertiary text-white rounded-lg hover:bg-tertiary-light transition-colors">Hari ini</button>
        </div>
      </div>
    );
  };

  // ── File helpers — pakai FileDropZone yang upload langsung ke S3 ————————— ──
  const handleFilesAdded  = (uploaded) => setFiles((p) => [...p, ...uploaded]);
  const handleFileRemoved = (i)         => setFiles((p) => p.filter((_, idx) => idx !== i));

  // ── Simpan transaksi via API (async dengan error handling) ──
  const handleSave = async () => {
    if (!date)                          { showToast('Pilih tanggal', 'error');             return; }
    if (!desc.trim())                   { showToast('Isi Keterangan', 'error');            return; }
    if (!amount || Number(amount) <= 0) { showToast('Masukkan jumlah yang valid', 'error'); return; }

    setIsSubmitting(true);
    try {
      await addTransaction({
        date,
        type,
        desc: desc.trim(),
        cat,
        amount: Number(amount),
        note,
        // docs: array URL dari S3 (format baru)
        docs: files.map(({ url, name, size, mime_type, is_image }) => ({ url, name, size, mime_type, is_image })),
      });
      showToast('Transaksi berhasil ditambahkan', 'success');
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal menambah transaksi';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-5 border-b border-neutral-light/50 sticky top-0 bg-white rounded-t-2xl z-10">
        <h3 className="font-semibold text-primary text-lg">Tambah Transaksi</h3>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center text-neutral">
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Custom Date Picker */}
          <div className="relative" ref={datePickerRef}>
            <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Tanggal</label>
            <div className="relative">
              <input
                type="text"
                value={displayDate}
                onClick={() => setShowDatePicker(!showDatePicker)}
                readOnly
                placeholder="dd/mm/yyyy"
                className="input-styled w-full px-4 py-2.5 pr-10 border border-neutral-light rounded-xl text-sm outline-none transition-all focus:border-tertiary focus:ring-1 focus:ring-tertiary cursor-pointer bg-white"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-light pointer-events-none">
                <i className="fas fa-calendar-alt text-sm" />
              </div>
            </div>
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-2 z-50" style={{ position: 'absolute', zIndex: 9999 }}>
                {renderCalendar()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Tipe</label>
            <CustomSelect value={type} onChange={(e) => setType(e.target.value)}
              className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all">
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </CustomSelect>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Keterangan</label>
          <input type="text" placeholder="Contoh: Pembelian ATK" value={desc} onChange={(e) => setDesc(e.target.value)}
            className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all focus:border-tertiary focus:ring-1 focus:ring-tertiary" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Kategori</label>
            <CustomSelect value={cat} onChange={(e) => setCat(e.target.value)}
              className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all">
              {['Operasional', 'Event', 'Sponsor', 'Logistik', 'Kepegawaian', 'Lainnya'].map((c) => <option key={c}>{c}</option>)}
            </CustomSelect>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Jumlah (Rp)</label>
            <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all focus:border-tertiary focus:ring-1 focus:ring-tertiary" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Catatan (Opsional)</label>
          <textarea rows={2} placeholder="Tambahkan catatan..." value={note} onChange={(e) => setNote(e.target.value)}
            className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all resize-none focus:border-tertiary focus:ring-1 focus:ring-tertiary" />
        </div>

        {/* ── Bukti Transaksi ── */}
        <div>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Bukti Transaksi <span className="text-neutral/50 font-normal normal-case">(Opsional)</span></label>
          <FileDropZone
            files={files}
            onAdd={handleFilesAdded}
            onRemove={handleFileRemoved}
          />
        </div>
      </div>

      {/* ── Footer Aksi ── */}
      <div className="flex gap-3 p-5 border-t border-neutral-light/50 sticky bottom-0 bg-white rounded-b-2xl">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 border border-neutral-light rounded-xl text-sm font-semibold text-neutral-dark hover:bg-neutral-50 transition-colors">
          Batal
        </button>
        <button type="button" onClick={handleSave} disabled={isSubmitting}
          className="flex-1 py-2.5 bg-tertiary text-white rounded-xl text-sm font-semibold hover:bg-tertiary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isSubmitting && <i className="fas fa-spinner fa-spin text-xs" />}
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </Modal>
  );
}