/* KOMPONEN MODAL: Form tambah/edit agenda (User)  */
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/user/Modal';
import { formatRupiah } from '../../utils/formatters';

export default function AgendaModal({ isOpen, agenda, onClose }) {
  const { addAgenda, editAgenda } = useApp();
  const showToast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format helpers
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const [name,   setName]   = useState('');
  const [amount, setAmount] = useState('');
  const [date,        setDate]        = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const datePickerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (agenda) {
        setName(agenda.name);
        setAmount(String(agenda.amount));
        setDate(agenda.date);
        setDisplayDate(formatDateForDisplay(agenda.date));
        const [y, m] = agenda.date.split('-');
        setCurrentMonth(new Date(parseInt(y), parseInt(m) - 1, 1));
      } else {
        setName(''); setAmount(''); setDate(''); setDisplayDate('');
        setCurrentMonth(new Date());
      }
      setShowDatePicker(false);
    }
  }, [isOpen, agenda]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) setShowDatePicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Calendar helpers
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handleDateSelect = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const selected = `${year}-${month}-${dayStr}`;
    setDate(selected);
    setDisplayDate(formatDateForDisplay(selected));
    setShowDatePicker(false);
  };

  const changeMonth = (inc) =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + inc, 1));

  const goToToday = () => {
    const today = getTodayDate();
    setDate(today); setDisplayDate(formatDateForDisplay(today));
    const [y, m] = today.split('-');
    setCurrentMonth(new Date(parseInt(y), parseInt(m) - 1, 1));
    setShowDatePicker(false);
  };

  const clearDate = () => { setDate(''); setDisplayDate(''); setShowDatePicker(false); };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = getTodayDate();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="h-10" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isTod = cur === today, isSel = cur === date;
      days.push(
        <button key={d} onClick={() => handleDateSelect(d)}
          className={`h-10 rounded-lg text-sm font-medium transition-all ${isSel ? 'bg-tertiary text-white' : 'hover:bg-neutral-50 text-neutral-dark'} ${isTod && !isSel ? 'border border-tertiary text-tertiary' : ''}`}>
          {d}
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
          {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
            <div key={d} className="text-center text-xs font-medium text-neutral py-2">{d}</div>
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

  const handleSave = async () => {
    if (!name.trim()) { showToast('Isi nama pembayaran', 'error'); return; }
    if (!amount || Number(amount) <= 0) { showToast('Masukkan jumlah yang valid', 'error'); return; }
    if (!date) { showToast('Pilih tanggal jatuh tempo', 'error'); return; }

    setIsSubmitting(true);
    try {
      const data = { name: name.trim(), amount: Number(amount), date };
      if (agenda) {
        await editAgenda(agenda.id, data);
        showToast('Agenda berhasil diperbarui', 'success');
      } else {
        await addAgenda(data);
        showToast('Agenda berhasil ditambahkan', 'success');
      }
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan agenda';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex items-center justify-between p-5 border-b border-neutral-light/50">
        <h3 className="font-semibold text-primary">{agenda ? 'Edit Agenda' : 'Tambah Agenda'}</h3>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center text-neutral">
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Nama Pembayaran</label>
          <input type="text" placeholder="Contoh: Sewa Aula" value={name} onChange={(e) => setName(e.target.value)}
            className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Jumlah (Rp)</label>
          <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
        </div>

        {/* Custom Date Picker */}
        <div className="relative" ref={datePickerRef}>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Tanggal Jatuh Tempo</label>
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
      </div>

      <div className="flex gap-3 p-5 border-t border-neutral-light/50">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 border border-neutral-light rounded-xl text-sm font-semibold text-neutral-dark hover:bg-neutral-50 transition-colors">
          Batal
        </button>
        <button type="button" onClick={handleSave} disabled={isSubmitting}
          className="flex-1 py-2.5 bg-tertiary text-white rounded-xl text-sm font-semibold hover:bg-tertiary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isSubmitting && <i className="fas fa-spinner fa-spin text-xs" />}
          Simpan
        </button>
      </div>
    </Modal>
  );
}
