// src/pages/user/shared/shared.jsx
import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { formatRupiah, formatDate } from '../../utils/formatters';

/* ── KOMPONEN REUSABLE: File ini berisi komponen-komponen yang sering dipakai di berbagai halaman User ── */

/* ── SUB-KOMPONEN: Date Picker Mini ── */
function MiniDatePicker({ value, onChange, placeholder = 'dd/mm/yyyy' }) {
  const formatForDisplay = (v) => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${d}/${m}/${y}`;
  };
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) { const [y, m] = value.split('-'); return new Date(parseInt(y), parseInt(m)-1, 1); }
    return new Date();
  });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (y, m) => new Date(y, m, 1).getDay();

  const handleSelect = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const sel = `${year}-${month}-${String(day).padStart(2,'0')}`;
    onChange(sel);
    setOpen(false);
  };

  const changeMonth = (inc) =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + inc, 1));

  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const year  = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days  = [];
  for (let i = 0; i < getFirstDay(year, month); i++) days.push(<div key={`e${i}`} />);
  const today = getTodayDate();
  for (let d = 1; d <= getDaysInMonth(year, month); d++) {
    const cur  = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isSel = cur === value;
    const isTod = cur === today;
    days.push(
      <button key={d} onClick={() => handleSelect(d)}
        className={`h-7 w-7 rounded-md text-xs font-medium transition-all mx-auto flex items-center justify-center
          ${isSel ? 'bg-tertiary text-white' : 'hover:bg-neutral-50 text-neutral-dark'}
          ${isTod && !isSel ? 'border border-tertiary text-tertiary' : ''}`}>
        {d}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          readOnly
          value={formatForDisplay(value)}
          onClick={() => setOpen(o => !o)}
          placeholder={placeholder}
          className="input-styled px-2 py-2 pr-7 border border-neutral-light rounded-lg text-xs text-neutral-dark outline-none focus:border-tertiary transition-colors w-32 sm:w-auto cursor-pointer bg-white"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-light pointer-events-none">
          <i className="fas fa-calendar-alt text-xs" />
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-[9999] bg-white border border-neutral-light/50 rounded-xl p-3 w-64"
          style={{ boxShadow: '0 8px 24px rgba(8,61,86,0.12)' }}>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => changeMonth(-1)} className="w-6 h-6 rounded-md hover:bg-neutral-50 flex items-center justify-center text-neutral">
              <i className="fas fa-chevron-left text-[10px]" />
            </button>
            <span className="text-xs font-semibold text-neutral-dark">{monthNames[month]} {year}</span>
            <button onClick={() => changeMonth(1)} className="w-6 h-6 rounded-md hover:bg-neutral-50 flex items-center justify-center text-neutral">
              <i className="fas fa-chevron-right text-[10px]" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {['Mi','Se','Se','Ra','Ka','Ju','Sa'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-neutral py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">{days}</div>
          <div className="flex gap-1.5 mt-2 pt-2 border-t border-neutral-light/40">
            <button onClick={() => { onChange(''); setOpen(false); }}
              className="flex-1 py-1.5 text-[11px] font-medium text-neutral-dark hover:bg-neutral-50 rounded-md transition-colors">
              Hapus
            </button>
            <button onClick={() => { onChange(today); setOpen(false); }}
              className="flex-1 py-1.5 text-[11px] font-medium bg-tertiary text-white rounded-md hover:bg-tertiary-light transition-colors">
              Hari ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Shared FilterBar used in Transaksi and Laporan pages
 */
export function FilterBar({ timeFilter, typeFilter, customStart, customEnd, search, onSwitchTime, onSetType, onCustomDate, onSearch, pageKey, extraRight }) {
  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <span className="text-xs text-neutral font-medium mr-1">
        <i className="fas fa-calendar-alt mr-1" />Periode:
      </span>

      <button type="button" onClick={() => onSwitchTime('bulan')}
        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${timeFilter === 'bulan' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-neutral-50 text-neutral-dark hover:bg-neutral-100'}`}>
        Bulan Ini
      </button>
      <button type="button" onClick={() => onSwitchTime('semua')}
        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${timeFilter === 'semua' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-neutral-50 text-neutral-dark hover:bg-neutral-100'}`}>
        Semua
      </button>

      <div className="flex items-center gap-2 border-l border-neutral-light pl-2 ml-1">
        <MiniDatePicker
          value={customStart}
          onChange={(val) => onCustomDate(val, customEnd)}
          placeholder="Mulai"
        />
        <span className="text-neutral-light text-xs">s/d</span>
        <MiniDatePicker
          value={customEnd}
          onChange={(val) => onCustomDate(customStart, val)}
          placeholder="Selesai"
        />
      </div>

      <span className="text-neutral-light mx-1">|</span>

      {['semua', 'pemasukan', 'pengeluaran'].map((t) => (
        <button key={t} type="button" onClick={() => onSetType(t)}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-tertiary text-white shadow-md shadow-tertiary/20' : 'bg-neutral-50 text-neutral-dark hover:bg-neutral-100'}`}>
          {t === 'semua' ? 'Semua' : t === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
        </button>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-light text-sm" />
          <input type="text" placeholder="Cari..." value={search} onChange={(e) => onSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-neutral-light rounded-lg text-sm outline-none focus:border-tertiary transition-colors w-36" />
        </div>
        {extraRight}
      </div>
    </div>
  );
}

/**
 * Shared StatCards for Beranda, Transaksi, Laporan
 */
export function StatCards({ stats }) {
  const { saldo, masuk, keluar, mp, kp } = stats;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="card-hover bg-white rounded-2xl p-5 border border-neutral-light/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral uppercase tracking-wider">Saldo Kas Organisasi</span>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${saldo < 0 ? 'bg-red-50' : 'bg-primary/10'}`}>
            <i className={`fas fa-wallet text-sm ${saldo < 0 ? 'text-red-500' : 'text-primary'}`} />
          </div>
        </div>
        <p className={`font-display font-bold text-2xl stat-number ${saldo < 0 ? 'text-red-500' : 'text-primary-dark'}`}>{formatRupiah(saldo)}</p>
        <p className={`text-xs mt-1 ${saldo < 0 ? 'text-red-400' : 'text-tertiary'}`}>
          <i className={`fas ${saldo < 0 ? 'fa-exclamation-circle' : 'fa-wallet'} mr-1`} />
          {saldo < 0 ? 'Saldo Minus — Periksa Pengeluaran' : 'Total Saldo Akumulatif'}
        </p>
      </div>

      <div className="card-hover bg-white rounded-2xl p-5 border border-neutral-light/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral uppercase tracking-wider">Pemasukan</span>
          <div className="w-9 h-9 rounded-lg bg-tertiary/10 flex items-center justify-center">
            <i className="fas fa-arrow-circle-down text-tertiary text-sm" />
          </div>
        </div>
        <p className="font-display font-bold text-2xl text-tertiary stat-number">{formatRupiah(masuk)}</p>
        <p className="text-xs text-tertiary mt-1">
          <i className={`fas fa-arrow-${mp >= 0 ? 'up' : 'down'} mr-1`} />
          {mp >= 0 ? '+' : ''}{mp}% dari Bulan Lalu
        </p>
      </div>

      <div className="card-hover bg-white rounded-2xl p-5 border border-neutral-light/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral uppercase tracking-wider">Pengeluaran</span>
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <i className="fas fa-arrow-circle-up text-red-400 text-sm" />
          </div>
        </div>
        <p className="font-display font-bold text-2xl text-red-500 stat-number">{formatRupiah(keluar)}</p>
        <p className="text-xs text-red-500 mt-1">
          <i className={`fas fa-arrow-${kp >= 0 ? 'up' : 'down'} mr-1`} />
          {kp >= 0 ? '+' : ''}{kp}% dari Bulan Lalu
        </p>
      </div>
    </div>
  );
}

/**
 * View-only Bukti Modal
 */
export function BuktiViewerModal({ txn, onClose }) {
  const [activeIdx, setActiveIdx] = useState(null);
  if (!txn) return null;

  const getName    = (d) => typeof d === 'string' ? d : d.name;
  const getUrl     = (d) => typeof d === 'object' ? d.dataUrl : null;
  const isImgName  = (n) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(n);
  const isPdfName  = (n) => /\.pdf$/i.test(n);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-light/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
              <i className="fas fa-paperclip text-tertiary text-sm" />
            </div>
            <div>
              <p className="font-semibold text-neutral-dark text-sm">Bukti Transaksi</p>
              <p className="text-neutral text-xs">{txn.desc}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral transition-colors">
            <i className="fas fa-times text-sm" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {!txn.docs?.length ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-xl bg-neutral-50 flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-file-slash text-neutral-light text-2xl" />
              </div>
              <p className="text-neutral text-sm">Tidak ada bukti transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {txn.docs.map((doc, i) => {
                const name   = getName(doc);
                const url    = getUrl(doc);
                const isImg  = isImgName(name);
                const isPdf  = isPdfName(name);
                const isOpen = activeIdx === i;
                return (
                  <div key={i} className="rounded-xl border border-neutral-light/40 overflow-hidden">
                    <div className="flex items-center gap-3 p-3 bg-neutral-50">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                        ${isImg ? 'bg-blue-50 text-blue-400' : isPdf ? 'bg-red-50 text-red-400' : 'bg-amber-50 text-amber-400'}`}>
                        <i className={`fas ${isImg ? 'fa-image' : isPdf ? 'fa-file-pdf' : 'fa-file-alt'} text-sm`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-dark text-sm font-medium truncate">{name}</p>
                        <p className="text-neutral text-xs">{isImg ? 'Gambar' : isPdf ? 'Dokumen PDF' : 'Dokumen'}</p>
                      </div>
                      {url ? (
                        <button type="button" onClick={() => setActiveIdx(isOpen ? null : i)}
                          className="w-8 h-8 rounded-lg bg-white border border-neutral-light flex items-center justify-center text-primary hover:bg-primary/5 transition-colors flex-shrink-0"
                          title={isOpen ? 'Tutup' : 'Lihat'}>
                          <i className={`fas ${isOpen ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral bg-white border border-neutral-light px-2 py-0.5 rounded-md flex-shrink-0">#{i + 1}</span>
                      )}
                    </div>
                    {isOpen && url && (
                      <div className="p-3 bg-white border-t border-neutral-light/30">
                        {isImg ? (
                          <img src={url} alt={name} className="max-h-64 w-full object-contain rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center gap-3 py-4">
                            <i className={`fas ${isPdf ? 'fa-file-pdf text-red-400' : 'fa-file-alt text-amber-400'} text-3xl`} />
                            <a href={url} download={name}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold transition-colors">
                              <i className="fas fa-download" /> Unduh {name}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-5 pb-4 flex-shrink-0">
          <p className="text-neutral text-xs text-center">{txn.docs?.length || 0} file bukti · Untuk menambah/hapus, gunakan menu Edit</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Shared Transaction Table Body
 */
export function TransactionTable({ data, onEdit, onDelete, onViewProof }) {
  const [viewBuktiTxn, setViewBuktiTxn] = useState(null);

  if (!data.length) {
    return (
      <tr>
        <td colSpan="7" className="px-5 py-8 text-center text-neutral text-sm">Tidak ada transaksi ditemukan</td>
      </tr>
    );
  }
  return (
    <>
      {data.map((t) => {
        const isM = t.type === 'pemasukan';
        return (
          <tr key={t.id} className="border-t border-neutral-light/30 hover:bg-neutral-50/50 transition-colors">
            <td className="px-5 py-3 text-neutral whitespace-nowrap">{formatDate(t.date)}</td>
            <td className="px-5 py-3 text-neutral-dark font-medium">
              <span className="block">{t.desc}</span>
              {t.docs?.length > 0 && (
                <button type="button"
                  onClick={() => setViewBuktiTxn(t)}
                  className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-tertiary hover:text-primary transition-colors cursor-pointer"
                  title={`Lihat ${t.docs.length} bukti transaksi`}>
                  <i className="fas fa-paperclip" />
                  <span>{t.docs.length} bukti</span>
                </button>
              )}
            </td>
            <td className="px-5 py-3">
              <span className="px-2.5 py-1 bg-neutral-50 rounded-md text-xs font-medium text-neutral-dark">{t.cat}</span>
            </td>
            <td className="px-5 py-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isM ? 'text-tertiary' : 'text-red-500'}`}>
                <i className={`fas ${isM ? 'fa-arrow-down' : 'fa-arrow-up'} text-[10px]`} />
                {isM ? 'Masuk' : 'Keluar'}
              </span>
            </td>
            <td className={`px-5 py-3 text-right font-display font-semibold ${isM ? 'text-tertiary' : 'text-red-500'}`}>
              {isM ? '+' : '-'}{formatRupiah(t.amount)}
            </td>
            <td className="px-5 py-3 text-center">
              <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold bg-tertiary-50 text-tertiary">SELESAI</span>
            </td>
            <td className="px-5 py-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <button type="button" onClick={() => onEdit(t.id)} className="text-neutral-light hover:text-primary transition-colors" title="Edit">
                  <i className="fas fa-edit text-xs" />
                </button>
                <button type="button" onClick={() => onDelete(t.id)} className="text-neutral-light hover:text-red-500 transition-colors" title="Hapus">
                  <i className="fas fa-trash-alt text-xs" />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
      <BuktiViewerModal txn={viewBuktiTxn} onClose={() => setViewBuktiTxn(null)} />
    </>
  );
}

export function TableWrapper({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-light/30 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50/80">
              {['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah', 'Status', 'Aksi'].map((h) => (
                <th key={h} className={`${h === 'Jumlah' ? 'text-right' : h === 'Status' || h === 'Aksi' ? 'text-center' : 'text-left'} px-5 py-3 font-semibold text-neutral text-xs uppercase tracking-wider`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Print Layout Component untuk Laporan PDF Export ── */
export function PrintLayout({ organisasi, stats, allocations, tableData, totalAlloc }) {
  // Hitung inisial 2 kata (fallback saat tidak ada logo)
  const initials = (organisasi?.name || 'O')
    .split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || 'O';
  const logoUrl = organisasi?.logo_url || null;

  return (
    <div className="print-layout">
      <div className="print-no-break" style={{ borderBottom: '3px solid #083D56', paddingBottom: 12, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo: tampilkan gambar jika ada, fallback inisial */}
          <div style={{ width: 44, height: 44, borderRadius: 10, background: logoUrl ? 'transparent' : '#083D56', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: logoUrl ? 'unset' : (initials.length > 1 ? 16 : 22), fontWeight: 800, flexShrink: 0, overflow: 'hidden', border: logoUrl ? '1.5px solid #e0e7ef' : 'none' }}>
            {logoUrl
              ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#083D56', lineHeight: 1.1 }}>{organisasi?.name || 'Nama Organisasi'}</div>
            <div style={{ fontSize: 9, color: '#546e7a', marginTop: 2 }}>{[organisasi?.type, organisasi?.email].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#083D56' }}>Laporan Keuangan</div>
          <div style={{ fontSize: 9, color: '#546e7a', marginTop: 3 }}>Dicetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div style={{ fontSize: 9, fontWeight: 700, color: '#083D56', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px', borderLeft: '3px solid #00695C', paddingLeft: 8 }}>Ringkasan Keuangan</div>
      <div className="print-no-break" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 4 }}>
        {[{ label: 'Saldo Kas', val: stats.saldo, cls: '#083D56', note: 'Total saldo akumulatif' },
          { label: 'Total Pemasukan', val: stats.masuk, cls: '#00695C', note: `${stats.mp >= 0 ? '+' : ''}${stats.mp}% dari bulan lalu` },
          { label: 'Total Pengeluaran', val: stats.keluar, cls: '#c62828', note: `${stats.kp >= 0 ? '+' : ''}${stats.kp}% dari bulan lalu` }]
          .map(({ label, val, cls, note }) => (
            <div key={label} style={{ border: '1.5px solid #e0e7ef', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: '#546e7a', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>{label}</div>
              <div className="font-display" style={{ fontSize: 13, fontWeight: 800, color: cls }}>{formatRupiah(val)}</div>
              <div style={{ fontSize: 7.5, color: '#546e7a', marginTop: 2 }}>{note}</div>
            </div>
          ))}
      </div>

      {allocations.length > 0 && (
        <div className="print-no-break">
          <div style={{ fontSize: 9, fontWeight: 700, color: '#083D56', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px', borderLeft: '3px solid #00695C', paddingLeft: 8 }}>Alokasi Pengeluaran per Kategori</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <thead><tr style={{ background: '#00695C' }}>
              <th style={{ color: '#fff', padding: '6px 10px', textAlign: 'left', fontWeight: 600 }}>Kategori</th>
              <th style={{ color: '#fff', padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>Jumlah</th>
              <th style={{ color: '#fff', padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>%</th>
            </tr></thead>
            <tbody>
              {allocations.map((a, i) => {
                const pct = totalAlloc > 0 ? Math.round(a.amount / totalAlloc * 100) : 0;
                return (<tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '5px 10px', borderBottom: '1px solid #eceff1' }}>{a.name}</td>
                  <td style={{ padding: '5px 10px', borderBottom: '1px solid #eceff1', textAlign: 'right' }}>{formatRupiah(a.amount)}</td>
                  <td style={{ padding: '5px 10px', borderBottom: '1px solid #eceff1', textAlign: 'right' }}>{pct}%</td>
                </tr>);
              })}
              <tr style={{ background: '#f0f4f8', fontWeight: 700 }}>
                <td style={{ padding: '5px 10px', borderTop: '2px solid #083D56' }}>Total</td>
                <td style={{ padding: '5px 10px', borderTop: '2px solid #083D56', textAlign: 'right' }}>{formatRupiah(totalAlloc)}</td>
                <td style={{ padding: '5px 10px', borderTop: '2px solid #083D56', textAlign: 'right' }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{ fontSize: 9, fontWeight: 700, color: '#083D56', textTransform: 'uppercase', letterSpacing: '.05em', margin: '14px 0 8px', borderLeft: '3px solid #00695C', paddingLeft: 8 }}>Riwayat Transaksi ({tableData.length} transaksi)</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8.5 }}>
        <thead><tr style={{ background: '#083D56' }}>
          {['Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Jumlah', 'Status'].map((h) => (
            <th key={h} style={{ color: '#fff', padding: '6px 8px', textAlign: h === 'Jumlah' ? 'right' : h === 'Status' ? 'center' : 'left', fontWeight: 600, fontSize: 8 }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {tableData.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#90a4ae', padding: 16 }}>Tidak ada transaksi</td></tr>
          )}
          {tableData.map((t, i) => {
            const isM = t.type === 'pemasukan';
            const [y, m, d] = (t.date || '').split('-');
            return (<tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', whiteSpace: 'nowrap' }}>{d}/{m}/{y}</td>
              <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1' }}>{t.desc}</td>
              <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1' }}>{t.cat}</td>
              <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', color: isM ? '#00695C' : '#c62828', fontWeight: 600 }}>{isM ? 'Pemasukan' : 'Pengeluaran'}</td>
              <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', textAlign: 'right', color: isM ? '#00695C' : '#c62828', fontWeight: 600 }}>{isM ? '+' : '-'}{formatRupiah(t.amount)}</td>
              <td style={{ padding: '5px 8px', borderBottom: '1px solid #eceff1', textAlign: 'center' }}><span style={{ background: '#e0f2f1', color: '#00695C', padding: '2px 7px', borderRadius: 4, fontSize: 7.5 }}>SELESAI</span></td>
            </tr>);
          })}
          {tableData.length > 0 && [['Total Pemasukan', stats.masuk, '#00695C', '+'], ['Total Pengeluaran', stats.keluar, '#c62828', '-'], ['Saldo Akhir', stats.saldo, '#083D56', '']].map(([lbl, val, clr, pfx]) => (
            <tr key={lbl} style={{ background: '#f0f4f8', fontWeight: 700 }}>
              <td colSpan={4} style={{ padding: '5px 8px', borderTop: '2px solid #083D56' }}>{lbl}</td>
              <td style={{ padding: '5px 8px', borderTop: '2px solid #083D56', textAlign: 'right', color: clr }}>{pfx}{formatRupiah(val)}</td>
              <td style={{ borderTop: '2px solid #083D56' }} />
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20, paddingTop: 8, borderTop: '1.5px solid #e0e7ef', display: 'flex', justifyContent: 'space-between', fontSize: 7.5, color: '#90a4ae' }}>
        <span>MoneFlo — Sistem Manajemen Keuangan Organisasi</span>
        <span>Dokumen ini dibuat otomatis · {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  );
}