/* ── KOMPONEN MODAL: Mengubah rincian transaksi (User) ── */
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/user/Modal';
import CustomSelect from '../../components/user/CustomSelect';

const ICON_MAP = {
  PDF:  'fa-file-pdf text-red-400',
  JPG:  'fa-file-image text-blue-400',
  JPEG: 'fa-file-image text-blue-400',
  PNG:  'fa-file-image text-emerald-400',
  DOC:  'fa-file-word text-blue-500',
  DOCX: 'fa-file-word text-blue-500',
};

export default function EditTransaksiModal({ isOpen, txnId, onClose }) {
  const { state, editTransaction } = useApp();
  const showToast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Format helpers ──
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // ── Form states ──
  const [date,        setDate]        = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [type,   setType]   = useState('pemasukan');
  const [desc,   setDesc]   = useState('');
  const [cat,    setCat]    = useState('Operasional');
  const [amount, setAmount] = useState('');
  const [note,   setNote]   = useState('');

  // ── Bukti Transaksi states ──
  const [existingDocs, setExistingDocs] = useState([]); // dokumen tersimpan dari transaksi
  const [newFiles,     setNewFiles]     = useState([]); // File baru yang ditambahkan
  const [isDrag,       setIsDrag]       = useState(false);
  const [viewDoc,      setViewDoc]      = useState(null); // doc yang sedang dipratinjau

  const fileRef       = useRef(null);
  const datePickerRef = useRef(null);

  // ── Populate form saat modal dibuka ──
  useEffect(() => {
    if (txnId && isOpen) {
      const t = state.transactions.find((x) => x.id === txnId);
      if (t) {
        setDate(t.date);
        setDisplayDate(formatDateForDisplay(t.date));
        const [y, m] = t.date.split('-');
        setCurrentMonth(new Date(parseInt(y), parseInt(m) - 1, 1));
        setType(t.type); setDesc(t.desc); setCat(t.cat);
        setAmount(String(t.amount)); setNote(t.note || '');
        setExistingDocs(t.docs || []);
        setNewFiles([]);
        setIsDrag(false);
        setViewDoc(null);
      }
    }
    if (!isOpen) { setShowDatePicker(false); setViewDoc(null); }
  }, [txnId, isOpen, state.transactions]);

  // ── Tutup date picker saat klik di luar ──
  useEffect(() => {
    const handler = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) setShowDatePicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Calendar helpers ──
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const getDaysInMonth   = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const handleDateSelect = (day) => {
    const year  = currentMonth.getFullYear();
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
    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay    = getFirstDayOfMonth(year, month);
    const today       = getTodayDate();
    const monthNames  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="h-10" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const cur  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
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

  // ── Proses file baru (validasi + baca sebagai dataUrl) ──
  const processFiles = (incoming) => {
    const maxSz   = 10 * 1024 * 1024;
    const okTypes = ['image/jpeg','image/png','image/jpg','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    Array.from(incoming).forEach((f) => {
      if (!okTypes.includes(f.type)) { showToast(`Format "${f.name}" tidak didukung`, 'error'); return; }
      if (f.size > maxSz)            { showToast(`"${f.name}" melebihi 10MB`, 'error');          return; }
      setNewFiles((prev) => {
        if (prev.some((x) => x.name === f.name && x.size === f.size)) return prev;
        const reader = new FileReader();
        reader.onload = (e) =>
          setNewFiles((p) => p.some((x) => x.name === f.name && x.size === f.size) ? p
            : [...p, { name: f.name, type: f.type, size: f.size, dataUrl: e.target.result }]);
        reader.readAsDataURL(f);
        return prev;
      });
    });
  };

  const removeExistingDoc = (idx) => setExistingDocs((p) => p.filter((_, i) => i !== idx));
  const removeNewFile     = (idx) => setNewFiles((p) => p.filter((_, i) => i !== idx));

  // ── Simpan perubahan via API (async dengan error handling) ──
  const handleSave = async () => {
    if (!date)                          { showToast('Pilih tanggal', 'error');             return; }
    if (!desc.trim())                   { showToast('Isi keterangan', 'error');            return; }
    if (!amount || Number(amount) <= 0) { showToast('Masukkan jumlah yang valid', 'error'); return; }

    setIsSubmitting(true);
    try {
      // Gabungkan dokumen lama dan file baru
      const docs = [
        ...existingDocs,
        ...newFiles.map(({ name, type: t, dataUrl }) => ({ name, type: t, dataUrl })),
      ];
      await editTransaction(txnId, { date, type, desc: desc.trim(), cat, amount: Number(amount), note, docs });
      showToast('Transaksi berhasil diperbarui', 'success');
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal memperbarui transaksi';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-5 border-b border-neutral-light/50 sticky top-0 bg-white rounded-t-2xl z-10">
        <h3 className="font-semibold text-primary text-lg">Edit Transaksi</h3>
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
            className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
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
              className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Catatan (Opsional)</label>
          <textarea rows={2} placeholder="Catatan..." value={note} onChange={(e) => setNote(e.target.value)}
            className="input-styled w-full px-4 py-2.5 border border-neutral-light rounded-xl text-sm outline-none transition-all resize-none" />
        </div>

        {/* ── Bukti Transaksi ── */}
        <div>
          <label className="block text-xs font-semibold text-neutral uppercase tracking-wider mb-1.5">Bukti Transaksi</label>

          {/* Dokumen tersimpan (existing) */}
          {existingDocs.length > 0 && (
            <div className="space-y-2 mb-2">
              {existingDocs.map((doc, i) => {
                const name = typeof doc === 'string' ? doc : doc.name;
                const ext  = name.split('.').pop().toUpperCase();
                const ic   = ICON_MAP[ext] || 'fa-file text-neutral-light';
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-tertiary/5 border border-tertiary/20 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <i className={`fas ${ic}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-dark truncate">{name}</p>
                      <p className="text-[11px] text-tertiary">Tersimpan</p>
                    </div>
                    <button type="button" onClick={() => setViewDoc(viewDoc === doc ? null : doc)}
                      title="Lihat" className="w-8 h-8 rounded-lg hover:bg-primary/10 flex items-center justify-center text-primary transition-colors flex-shrink-0">
                      <i className={`fas ${viewDoc === doc ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                    </button>
                    <button type="button" onClick={() => removeExistingDoc(i)}
                      title="Hapus" className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-neutral-light hover:text-red-500 transition-colors flex-shrink-0">
                      <i className="fas fa-times text-sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pratinjau dokumen saat tombol mata diklik */}
          {viewDoc && (() => {
            const docName = typeof viewDoc === 'string' ? viewDoc : viewDoc.name;
            const docUrl  = typeof viewDoc === 'object' ? viewDoc.dataUrl : null;
            const isImg   = /\.(png|jpg|jpeg|gif|webp)$/i.test(docName);
            return (
              <div className="mb-2 p-3 bg-neutral-50 border border-neutral-light/50 rounded-xl">
                <p className="text-xs font-semibold text-neutral mb-2">{docName}</p>
                {docUrl && isImg ? (
                  <img src={docUrl} alt={docName} className="max-h-56 w-full object-contain rounded-lg" />
                ) : docUrl ? (
                  <a href={docUrl} download={docName}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark transition-colors">
                    <i className="fas fa-download" /> Unduh {docName}
                  </a>
                ) : (
                  <p className="text-[11px] text-neutral">Pratinjau tidak tersedia. Hapus dan unggah ulang untuk memperbarui.</p>
                )}
              </div>
            );
          })()}

          {/* File baru yang ditambahkan */}
          {newFiles.length > 0 && (
            <div className="space-y-2 mb-2">
              {newFiles.map((f, i) => {
                const ext = f.name.split('.').pop().toUpperCase();
                const sz  = f.size < 1048576 ? (f.size/1024).toFixed(1)+' KB' : (f.size/1048576).toFixed(1)+' MB';
                const ic  = ICON_MAP[ext] || 'fa-file text-neutral-light';
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <i className={`fas ${ic}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-dark truncate">{f.name}</p>
                      <p className="text-[11px] text-neutral">{sz} · Baru</p>
                    </div>
                    <button type="button" onClick={() => removeNewFile(i)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-neutral-light hover:text-red-500 transition-colors flex-shrink-0">
                      <i className="fas fa-times text-sm" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload zone */}
          <div
            className={`upload-zone p-4 text-center cursor-pointer ${isDrag ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={(e) => { e.preventDefault(); setIsDrag(false); processFiles(e.dataTransfer.files); }}
          >
            <input ref={fileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              multiple onChange={(e) => processFiles(e.target.files)} />
            <div className="flex flex-col items-center gap-1">
              <i className="fas fa-cloud-upload-alt text-neutral-light text-xl mb-1" />
              <p className="text-xs font-medium text-neutral-dark">Klik atau seret untuk menambah bukti</p>
              <p className="text-[11px] text-neutral">JPG, PNG, PDF, DOC (Maks. 10MB)</p>
            </div>
          </div>
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
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </Modal>
  );
}