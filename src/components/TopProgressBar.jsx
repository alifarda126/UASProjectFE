import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopProgressBar — Bar loading tipis di bagian paling atas layar.
 * Otomatis muncul saat ganti halaman dan hilang setelah selesai.
 * Tidak mempengaruhi layout apapun (position: fixed).
 */
export default function TopProgressBar() {
  const location = useLocation();
  const [visible, setVisible]   = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Mulai progress bar setiap kali path berubah
    setVisible(true);
    setProgress(20);

    // Simulasi loading: naikkan progress bertahap
    const t1 = setTimeout(() => setProgress(50),  80);
    const t2 = setTimeout(() => setProgress(75), 200);
    const t3 = setTimeout(() => setProgress(92), 400);

    // Selesai: isi penuh lalu sembunyikan
    const t4 = setTimeout(() => setProgress(100), 550);
    const t5 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [location.pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        height:     '3px',
        zIndex:     9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height:     '100%',
          width:      `${progress}%`,
          background: 'linear-gradient(90deg, #00897B, #00BCD4)',
          borderRadius: '0 2px 2px 0',
          transition: progress === 0
            ? 'none'
            : progress === 100
              ? 'width 0.15s ease-out'
              : 'width 0.25s ease-out',
          boxShadow:  '0 0 8px rgba(0, 188, 212, 0.6)',
          opacity:    visible ? 1 : 0,
          transition: `width 0.25s ease-out, opacity 0.25s ease`,
        }}
      />
    </div>
  );
}
