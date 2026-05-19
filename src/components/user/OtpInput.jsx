/* ── KOMPONEN REUSABLE: Input 6 digit OTP ── */
import { useRef, useEffect } from 'react';

/**
 * OtpInput — renders 6 input boxes for OTP entry
 * Props: value (array of 6 chars), onChange (new array)
 */
export default function OtpInput({ value, onChange }) {
  const inputs = useRef([]);

  useEffect(() => {
    if (inputs.current[0]) inputs.current[0].focus();
  }, []);

  const handleInput = (e, idx) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[idx] = char;
    onChange(next);
    if (char && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      const next = [...value];
      next[idx - 1] = '';
      onChange(next);
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6).split('');
    const next = [...value];
    data.forEach((c, i) => { next[i] = c; });
    onChange(next);
    const nextFocus = Math.min(data.length, 5);
    inputs.current[nextFocus]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleInput(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className="otp-digit text-center text-xl font-bold border-2 border-neutral-light rounded-xl outline-none focus:border-tertiary transition-colors input-styled"
        />
      ))}
    </div>
  );
}
