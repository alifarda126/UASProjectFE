import { useEffect } from 'react';

/**
 * ── KOMPONEN REUSABLE: Wrapper Modal (Popup) ──
 * Digunakan secara luas di seluruh aplikasi untuk menampilkan form atau detail dalam bentuk overlay.
 * 
 * @param {boolean} isOpen - Menentukan apakah modal sedang tampil atau sembunyi.
 * @param {function} onClose - Fungsi yang dipanggil saat area luar modal (backdrop) diklik.
 * @param {ReactNode} children - Isi konten di dalam modal.
 * @param {string} maxWidth - Menentukan lebar maksimal modal (misal: 'max-w-lg', 'max-w-xl').
 * @param {string} align - Posisi modal (misal: 'center' atau 'top-right').
 */
export default function Modal({ isOpen, onClose, children, maxWidth = 'max-w-lg', align = 'center' }) {
  /* ── Mencegah background halaman ikut ter-scroll ketika modal sedang terbuka ── */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const alignClass = align === 'top-right'
    ? 'items-start justify-end pt-14 pr-4 lg:pr-8'
    : 'items-center justify-center';

  return (
    <div
      className={`modal-backdrop fixed inset-0 bg-black/50 z-[60] flex ${alignClass} p-4`}
      style={{ opacity: 1 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`modal-content bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}
