import { useState, useRef, useEffect } from 'react';
import { useSystem, DEFAULTS } from '../../context/SystemContext';
import { useToast } from '../../context/ToastContext';
import defaultLogo  from '../../assets/MoneFloLogo.webp';
import defaultLogo2 from '../../assets/MoneFloLogo2.webp';

/* FUNGSI UTILITY: Mengonversi file gambar yang diunggah menjadi format Data URL (Base64)  */
function readFileAsDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(file); });
}

/* SUB-KOMPONEN: Kontainer Section dengan Header  */
/* Membungkus kelompok pengaturan (misal: Identitas, Logo, dll) agar UI rapi */
function Section({ title, icon, children, accent = 'teal' }) {
  const c = {
    teal:    'bg-teal-700/20 text-teal-600',
    emerald: 'bg-emerald-600/15 text-emerald-600',
    amber:   'bg-amber-500/15 text-amber-500',
    sky:     'bg-[#083D56]/15 text-[#083D56]',
    slate:   'bg-slate-500/15 text-slate-500',
  };
  return (
    <div className="admin-card rounded-2xl p-5 lg:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c[accent]}`}><i className={`fas ${icon} text-sm`} /></div>
        <h3 className="text-slate-800 font-display font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* SUB-KOMPONEN: Form Row  */
/* Struktur dasar label dan deskripsi kecil untuk setiap input form */
function FRow({ label, hint, children }) {
  return <div><label className="block text-slate-600 text-sm font-medium mb-1.5">{label}</label>{children}{hint && <p className="text-slate-600 text-xs mt-1.5">{hint}</p>}</div>;
}

/* SUB-KOMPONEN: Text Input Custom  */
function TInput({ value, onChange, placeholder, maxLength, type = 'text' }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className="admin-input w-full px-4 py-2.5 rounded-xl text-sm" />;
}

/* SUB-KOMPONEN: Toggle/Switch Button  */
/* Digunakan untuk pengaturan on/off seperti 'Pendaftaran Dibuka/Ditutup' */
function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 border border-slate-200">
      <div><p className="text-slate-700 text-sm font-medium">{label}</p>{desc && <p className="text-slate-500 text-xs mt-0.5">{desc}</p>}</div>
      <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-teal-700' : 'bg-slate-300'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

/* SUB-KOMPONEN: Area Drag-and-Drop Gambar  */
/* Memungkinkan admin mengubah logo/ikon dengan klik atau seret (drag) file */
function UploadZone({ currentUrl, fallbackSrc, hint, onUpload, onClear }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const go = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2097152) { alert('Maks 2MB'); return; }
    onUpload(await readFileAsDataURL(file));
  };
  return (
    <div className={`rounded-xl border-2 border-dashed cursor-pointer p-4 transition-all ${drag ? 'border-teal-600 bg-teal-600/10' : 'border-slate-200 hover:border-teal-600/50'}`}
      onClick={() => ref.current?.click()} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); go(e.dataTransfer.files[0]); }}>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => go(e.target.files[0])} />
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-700/60 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200">
          {currentUrl ? <img src={currentUrl} alt="p" className="w-full h-full object-contain" /> : fallbackSrc ? <img src={fallbackSrc} alt="d" className="w-full h-full object-contain opacity-40" /> : <i className="fas fa-image text-slate-500 text-xl" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-600 text-sm font-medium">{currentUrl ? 'Klik/seret untuk ganti' : 'Klik atau seret file ke sini'}</p>
          <p className="text-slate-500 text-xs mt-0.5">{hint}</p>
          {currentUrl && <button type="button" onClick={e => { e.stopPropagation(); onClear(); }} className="mt-1.5 text-xs text-red-400 hover:text-red-300"><i className="fas fa-times mr-1" />Hapus (gunakan default)</button>}
        </div>
      </div>
    </div>
  );
}

/* SUB-KOMPONEN: Panel Live Preview  */
/* Menampilkan simulasi tampilan hasil konfigurasi sistem secara real-time */
function LivePreview({ d, s }) {
  const ls = d.logoUrl || defaultLogo;
  const l2 = d.logo2Url || defaultLogo2;
  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-2">Halaman Login</p>
        <div className="bg-gradient-to-br from-[#083D56] to-[#00695C] rounded-xl p-4 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-full max-w-[200px] text-center shadow-lg">
            <div className="w-9 h-9 rounded-lg mx-auto overflow-hidden mb-1.5"><img src={ls} alt="logo" className="w-full h-full object-contain" /></div>
            <p className="font-display font-bold text-[#083D56] text-sm truncate">{d.appName || '—'}</p>
            <p className="text-[#767779] text-[10px] mt-0.5 truncate">{d.tagline || '—'}</p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-2">Sidebar Pengguna</p>
        <div className="bg-[#083D56] rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/15 p-0.5">
            <img src={l2} alt="icon" className="w-full h-full object-contain rounded-sm" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-white text-sm truncate">{d.appName || '—'}</p>
            <p className="text-white/50 text-[9px] tracking-wider uppercase truncate">{d.sidebarSub || '—'}</p>
          </div>
        </div>
      </div>
      { (d.announcement || s.announcement) && (d.announcement !== '-') && (
        <div>
          <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-2">Banner Pengumuman</p>
          <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-2">
            <p className="text-amber-300 text-xs"><i className="fas fa-bullhorn mr-1.5" />{d.announcement || s.announcement}</p>
          </div>
        </div>
      )}
      <div>
        <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mb-2">Status Pendaftaran</p>
        <div className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-2 ${d.registOpen ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border border-red-500/30 text-red-400'}`}>
          <i className={`fas ${d.registOpen ? 'fa-door-open' : 'fa-door-closed'}`} />
          {d.registOpen ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
        </div>
      </div>
    </div>
  );
}

/* KOMPONEN UTAMA: Halaman Konfigurasi Sistem  */
/* Admin dapat mengubah branding aplikasi (nama, logo) serta toggle pengaturan global */
export default function SistemPage() {
  const { settings, updateSettings, resetSettings } = useSystem();
  const showToast = useToast();
  const [draft, setDraft] = useState({ ...settings });
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  // Sinkronisasi draft jika data settings dari backend baru masuk setelah komponen mount
  useEffect(() => {
    setDraft(prev => ({ ...settings, announcement: prev.announcement }));
  }, [settings]);

  const handleSave = () => { 
    const finalDraft = { ...draft };
    
    // Jika input kosong, pertahankan pengumuman lama agar tidak terhapus tak sengaja
    if (draft.announcement === '') {
      finalDraft.announcement = settings.announcement;
    } 
    // Jika input '-', artinya admin sengaja ingin menghapus pengumuman
    else if (draft.announcement.trim() === '-') {
      finalDraft.announcement = '';
    }

    updateSettings(finalDraft); 
    setConfirmReset(false); 
    showToast('Pengaturan sistem berhasil disimpan', 'success'); 
    
    // Reset teks pengumuman di form setelah disimpan sesuai permintaan
    setDraft(prev => ({ ...prev, announcement: '' }));
  };
  const handleResetConfirm = () => { resetSettings(); setDraft({ ...DEFAULTS }); setConfirmReset(false); showToast('Pengaturan direset ke default', 'info'); };

  return (
    <div className="page-enter space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-slate-800 font-display font-bold text-xl">Pengaturan Sistem</h2>
          <p className="text-slate-500 text-sm mt-0.5">Kelola identitas, branding, dan konfigurasi aplikasi</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button type="button" onClick={() => setConfirmReset(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 text-sm font-semibold transition-all">
            <i className="fas fa-undo text-xs" /> Reset Default
          </button>
          <button type="button" onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-teal-700/25">
            <i className="fas fa-save text-xs" /> Simpan Perubahan
          </button>
        </div>
      </div>

      {confirmReset && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <i className="fas fa-exclamation-triangle text-red-400" />
          <p className="text-red-300 text-sm flex-1">Semua pengaturan akan dikembalikan ke <strong>default</strong>. Perubahan yang belum disimpan akan hilang.</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 text-xs font-semibold transition-all">Batal</button>
            <button type="button" onClick={handleResetConfirm} className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-all">Ya, Reset</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Section title="Identitas Aplikasi" icon="fa-font" accent="teal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FRow label="Nama Aplikasi" hint={`${(draft.appName || '').length}/30 karakter`}><TInput value={draft.appName || ''} onChange={v => set('appName', v)} placeholder="MoneFlo" maxLength={30} /></FRow>
              <FRow label="Sub-label Sidebar" hint="Teks kecil di bawah nama pada sidebar"><TInput value={draft.sidebarSub || ''} onChange={v => set('sidebarSub', v)} placeholder="Keuangan Organisasi" maxLength={30} /></FRow>
              <FRow label="Tagline / Subjudul" hint="Muncul di halaman login & judul tab browser"><TInput value={draft.tagline || ''} onChange={v => set('tagline', v)} placeholder="Sistem Keuangan Organisasi" maxLength={60} /></FRow>
              <FRow label="Email Kontak" hint="Ditampilkan di halaman pengaturan & info sistem"><TInput value={draft.contactEmail || ''} onChange={v => set('contactEmail', v)} placeholder="admin@moneflo.com" type="email" /></FRow>
            </div>
          </Section>

          <Section title="Logo & Ikon" icon="fa-image" accent="emerald">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FRow label="Logo Halaman Login" hint="PNG/SVG · Maks 2MB · Rasio 1:1">
                <UploadZone currentUrl={draft.logoUrl} fallbackSrc={defaultLogo} hint="PNG/SVG/JPG · Maks 2MB" onUpload={url => set('logoUrl', url)} onClear={() => set('logoUrl', null)} />
              </FRow>
              <FRow label="Ikon Sidebar" hint="PNG/SVG · Maks 2MB · Rasio 1:1">
                <UploadZone currentUrl={draft.logo2Url} fallbackSrc={defaultLogo2} hint="PNG/SVG/ICO · Maks 2MB" onUpload={url => set('logo2Url', url)} onClear={() => set('logo2Url', null)} />
              </FRow>
            </div>
          </Section>

          <Section title="Favicon Browser" icon="fa-globe" accent="sky">
            <FRow label="Ikon Tab Browser" hint="ICO/PNG/SVG · Rasio 1:1 · Disarankan 32×32px">
              <UploadZone currentUrl={draft.faviconUrl} fallbackSrc={null} hint="ICO/PNG/SVG · Maks 2MB" onUpload={url => set('faviconUrl', url)} onClear={() => set('faviconUrl', null)} />
            </FRow>
            <p className="text-slate-600 text-xs mt-3"><i className="fas fa-info-circle mr-1" />Favicon berubah di tab browser segera setelah disimpan.</p>
          </Section>

          <Section title="Pengumuman & Konfigurasi" icon="fa-cog" accent="amber">
            <div className="space-y-4">
              <FRow label="Banner Pengumuman" hint="Ketik pengumuman baru untuk disiarkan. Ketik '-' (tanda strip) untuk menghapus pengumuman aktif.">
                <textarea value={draft.announcement || ''} onChange={e => set('announcement', e.target.value)}
                  placeholder="Ketik pengumuman atau ketik '-' untuk menghapus..."
                  rows={3} maxLength={200} className="admin-input w-full px-4 py-2.5 rounded-xl text-sm resize-none" />
                <p className="text-slate-600 text-xs mt-1">{(draft.announcement || '').length}/200 karakter</p>
              </FRow>
              <Toggle checked={draft.registOpen} onChange={v => set('registOpen', v)}
                label="Pendaftaran Organisasi Baru"
                desc="Jika dimatikan, tombol 'Daftar Organisasi' di halaman login disembunyikan" />
            </div>
          </Section>
        </div>

        <div className="xl:col-span-1">
          <div className="admin-card rounded-2xl p-5 sticky top-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-teal-700/20 flex items-center justify-center"><i className="fas fa-eye text-teal-600 text-xs" /></div>
              <h3 className="text-slate-800 font-display font-semibold text-sm">Live Preview</h3>
            </div>
            <LivePreview d={draft} s={settings} />
            <div className="mt-5 pt-4 border-t border-slate-200">
              <p className="text-slate-600 text-[11px] text-center">Preview berubah real-time. Klik <span className="text-slate-500 font-semibold">Simpan</span> untuk menerapkan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
