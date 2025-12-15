import type { BowlingStyle } from '../../types';
import { BOWLING_STYLES } from '../../utils/constants';

interface BowlingStyleSelectorProps {
  value: BowlingStyle;
  onChange: (value: BowlingStyle) => void;
  disabled?: boolean;
}

export default function BowlingStyleSelector({ 
  value, 
  onChange, 
  disabled = false 
}: BowlingStyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {BOWLING_STYLES.map((style) => (
        <button
          key={style.value}
          type="button"
          onClick={() => onChange(style.value)}
          disabled={disabled}
          className={`
            p-4 rounded-xl border-2 transition-all duration-200
            ${value === style.value
              ? 'border-emerald-500 bg-emerald-500/10 text-white'
              : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-700'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
          `}
        >
          <div className="text-3xl mb-2">{style.emoji}</div>
          <div className="font-bold text-sm">{style.label}</div>
          <div className="text-xs mt-1 opacity-75">{style.description}</div>
        </button>
      ))}
    </div>
  );
}
