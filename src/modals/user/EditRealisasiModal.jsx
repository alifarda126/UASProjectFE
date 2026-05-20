/* ── KOMPONEN MODAL: Mengedit alokasi dana program (User) ── */
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/user/Modal';

export default function EditRealisasiModal({ isOpen, onClose }) {
  const { state, updatePrograms } = useApp();
  const showToast = useToast();

  const [programs, setPrograms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colors = ['#00695C', '#083D56', '#00897B', '#546E7A', '#78909C', '#0C5272'];

  useEffect(() => {
    if (isOpen) setPrograms(state.programs.map((p) => ({ ...p })));
  }, [isOpen, state.programs]);

  const update = (i, key, val) => {
    setPrograms((prev) => prev.map((p, idx) => idx === i ? { ...p, [key]: val } : p));
  };

  const addProgram = () => setPrograms((prev) => [...prev, { name: '', progress: 0 }]);
  const removeProgram = (i) => {
    if (programs.length <= 1) { showToast('Minimal 1 program', 'error'); return; }
    setPrograms((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    const cleaned = programs.map((p) => ({
      ...p,
      progress: Math.min(100, Math.max(0, Number(p.progress) || 0)),
    }));
    setIsSubmitting(true);
    try {
      await updatePrograms(cleaned);
      showToast('Realisasi anggaran berhasil diperbarui', 'success');
      onClose();
    } catch (error) {
      showToast('Gagal menyimpan program anggaran', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-center justify-between p-5 border-b border-neutral-light/50">
        <h3 className="font-semibold text-primary">Revisi Realisasi Anggaran</h3>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-neutral-50 flex items-center justify-center text-neutral">
          <i className="fas fa-times" />
        </button>
      </div>

      <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
        {programs.map((p, i) => {
          const clr = colors[i % colors.length];
          return (
            <div key={i} className="prog-row p-3 rounded-xl border border-neutral-light/50">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={p.name} onChange={(e) => update(i, 'name', e.target.value)}
                  placeholder="Nama program"
                  className="input-styled flex-1 px-3 py-2 border border-neutral-light rounded-lg text-sm outline-none transition-all font-medium" />
                <button type="button" onClick={() => removeProgram(i)}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-neutral-light hover:text-red-500 transition-colors">
                  <i className="fas fa-trash text-xs" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" value={p.progress} min={0} max={100}
                  onChange={(e) => update(i, 'progress', e.target.value)}
                  className="input-styled w-20 px-3 py-2 border border-neutral-light rounded-lg text-sm outline-none transition-all text-center" />
                <span className="text-sm text-neutral font-semibold">%</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, p.progress)}%`, background: clr }} />
                </div>
              </div>
              <input type="range" min={0} max={100} value={p.progress}
                onChange={(e) => update(i, 'progress', Number(e.target.value))}
                className="w-full mt-1" style={{ accentColor: clr }} />
            </div>
          );
        })}

        <button type="button" onClick={addProgram}
          className="w-full py-2.5 border-2 border-dashed border-neutral-light rounded-xl text-sm font-medium text-neutral hover:border-tertiary hover:text-tertiary transition-colors flex items-center justify-center gap-2">
          <i className="fas fa-plus text-xs" /> Tambah Program
        </button>
      </div>

      <div className="flex gap-3 p-5 border-t border-neutral-light/50">
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
