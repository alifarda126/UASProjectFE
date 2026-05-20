/* ── KOMPONEN REUSABLE: Dropdown Kustom pengganti tag <select> ── */
import { useState, useRef, useEffect, Children, isValidElement } from 'react';

/**
 * CustomSelect — modern replacement for native <select>
 * Drop-in: same value/onChange/className/children props as <select>
 */
export default function CustomSelect({ value, onChange, className = '', children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Parse <option> children into options array
  const options = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const val = child.props.value !== undefined ? child.props.value : child.props.children;
    options.push({ value: val, label: child.props.children });
  });

  const selected = options.find((o) => String(o.value) === String(value));
  const isPlaceholder = !selected || value === '' || value === undefined;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (val) => { onChange({ target: { value: val } }); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button — same size & layout as native select */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`${className} bg-white flex items-center justify-between gap-2 cursor-pointer`}
      >
        <span className={`flex-1 truncate text-left ${isPlaceholder ? 'text-neutral' : 'text-neutral-dark'}`}>
          {selected?.label ?? 'Pilih...'}
        </span>
        <i className={`fas fa-chevron-down text-neutral flex-shrink-0 text-[11px] transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {/* Modern dropdown panel */}
      {open && (
        <div
          className="absolute z-[70] left-0 right-0 mt-1.5 bg-white border border-neutral-light/40 rounded-xl overflow-hidden"
          style={{ boxShadow: '0 10px 32px rgba(8,61,86,0.13), 0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {options.map((opt) => {
            const isSel = String(opt.value) === String(value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2.5 ${
                  isSel
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-neutral-dark hover:bg-primary/5 hover:text-primary'
                }`}
              >
                <span className={`w-3.5 flex-shrink-0 ${isSel ? '' : 'opacity-0'}`}>
                  <i className="fas fa-check text-[10px]" />
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
