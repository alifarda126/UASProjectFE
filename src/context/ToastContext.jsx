import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);
/* ── KOMPONEN PROVIDER: State Global Notifikasi (Toast) ── */
/* Menangani pemunculan pop-up pesan sukses/error di sudut layar */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const showToast = useCallback((msg, type = 'info') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const colorMap = {
    success: 'bg-tertiary text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-primary text-white',
  };
  const iconMap = {
    success: 'fa-check-circle',
    error:   'fa-exclamation-circle',
    info:    'fa-info-circle',
  };
  const [exiting, setExiting] = useState(false);

  const handleRemove = () => {
    setExiting(true);
    setTimeout(onRemove, 300);
  };

  return (
    <div className={`${exiting ? 'toast-exit' : 'toast-enter'} flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg ${colorMap[toast.type] || colorMap.info} min-w-[280px]`}>
      <i className={`fas ${iconMap[toast.type] || iconMap.info} text-sm flex-shrink-0`} />
      <span className="text-sm font-medium flex-1">{toast.msg}</span>
      <button type="button" onClick={handleRemove} className="flex-shrink-0 hover:opacity-70">
        <i className="fas fa-times text-xs" />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
