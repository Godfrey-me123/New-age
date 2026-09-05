import React, { useState, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { convertIsoToDdMmmYyyy, normalizeDateInput, validateDdMmmYyyy } from '../../utils/dateValidation';

interface FloatingDatePickerProps {
  label: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  error?: string | null;
  helperText?: string;
  suggestedDate?: string;
  onApplySuggestedDate?: (date: string) => void;
  id?: string;
  disabled?: boolean;
}

export const FloatingDatePicker: React.FC<FloatingDatePickerProps> = ({
  label,
  value = '',
  onChange,
  error,
  helperText,
  suggestedDate,
  onApplySuggestedDate,
  id,
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  const inputId = id || `floating-date-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  // Handle manual typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase();
    onChange?.({ target: { value: raw } });
  };

  // When blurred, normalize if valid
  const handleBlur = () => {
    setIsFocused(false);
    if (value) {
      const normalized = normalizeDateInput(value);
      if (normalized !== value) {
        onChange?.({ target: { value: normalized } });
      }
    }
  };

  // Handle native calendar picker selection
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      const formatted = convertIsoToDdMmmYyyy(isoVal);
      if (formatted) {
        onChange?.({ target: { value: formatted } });
      }
    }
  };

  const borderColorClass = error
    ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:shadow-[0_0_16px_rgba(244,63,94,0.18)]'
    : 'border-[#4C5055]/70 hover:border-[#4C5055] focus-within:border-[#47A5FF] focus-within:shadow-[0_0_16px_rgba(71,165,255,0.18)]';

  const labelColorClass = error
    ? 'text-rose-400'
    : isFocused
    ? 'text-[#47A5FF]'
    : 'text-[#A0A4A8]';

  const showSuggestion = suggestedDate && suggestedDate !== value;

  return (
    <div className="w-full space-y-1.5 font-sans">
      <div
        className={`relative flex items-center bg-[#000000] border rounded-xl transition-all duration-200 ${borderColorClass} ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/60' : ''
        }`}
      >
        {/* Leading Icon & Calendar trigger button */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => hiddenDateInputRef.current?.showPicker?.()}
          className="pl-3.5 pr-1 flex items-center text-[#4C5055] hover:text-[#47A5FF] transition-colors cursor-pointer"
          title="Pick date from calendar"
        >
          <Calendar
            className={`w-4 h-4 transition-colors duration-200 ${
              isFocused ? 'text-[#47A5FF]' : error ? 'text-rose-400' : 'text-[#7D8287]'
            }`}
          />
        </button>

        {/* Hidden HTML5 date picker input */}
        <input
          ref={hiddenDateInputRef}
          type="date"
          tabIndex={-1}
          className="sr-only"
          onChange={handleNativePickerChange}
        />

        {/* Date text input with floating label */}
        <div className="relative flex-1 py-1 px-3.5">
          <label
            htmlFor={inputId}
            className={`absolute left-3.5 transition-all duration-200 pointer-events-none select-none font-medium tracking-wide ${
              isFloating
                ? `top-1.5 text-[10px] uppercase font-semibold ${labelColorClass}`
                : 'top-3.5 text-sm text-[#7D8287]'
            }`}
          >
            {label}
          </label>

          <input
            type="text"
            id={inputId}
            value={value}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onChange={handleInputChange}
            placeholder={!isFloating ? '' : undefined}
            maxLength={11}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent text-[#FFFFFF] text-sm pt-4 pb-1 outline-none font-medium tracking-wider"
          />
        </div>

        {/* Quick sync with NIDA extracted date */}
        {showSuggestion && onApplySuggestedDate && (
          <div className="pr-3 flex items-center">
            <button
              type="button"
              onClick={() => onApplySuggestedDate(suggestedDate)}
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-[#47A5FF]/15 text-[#47A5FF] border border-[#47A5FF]/30 hover:bg-[#47A5FF]/25 transition-colors cursor-pointer"
              title={`Sync NIDA date: ${suggestedDate}`}
            >
              <span>Use {suggestedDate}</span>
            </button>
          </div>
        )}
      </div>

      {/* Error-only validation message (PROMPT 27 & 28) */}
      {error && (
        <div className="px-1 text-xs">
          <p className="text-rose-400 font-medium text-[11px] flex items-center gap-1">
            <span>•</span> {error}
          </p>
        </div>
      )}
    </div>
  );
};
