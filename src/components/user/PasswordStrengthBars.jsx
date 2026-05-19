/* ── KOMPONEN REUSABLE: Bar indikator kekuatan kata sandi ── */
import { STRENGTH_COLORS, STRENGTH_LABELS } from '../../utils/passwordUtils';

/**
 * PasswordStrengthBars — renders 5 colored bars + label
 * Props: score (0-4)
 */
export default function PasswordStrengthBars({ score }) {
  if (score === 0) return null;
  return (
    <div className="mt-2 flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-1.5 rounded-full"
          style={{ background: i <= score ? STRENGTH_COLORS[score] : '#ECEFF1' }}
        />
      ))}
      <span className="text-[10px] ml-2 font-semibold" style={{ color: STRENGTH_COLORS[score] }}>
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}
