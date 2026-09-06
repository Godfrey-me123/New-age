import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string | null;
  warning?: string | null;
  success?: boolean;
  successMessage?: string | null;
  helperText?: string;
  badge?: React.ReactNode;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  icon: Icon,
  error,
  warning,
  success,
  successMessage,
  helperText,
  badge,
  value,
  id,
  className = '',
  disabled,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `floating-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const hasValue = value !== undefined && value !== null && value.toString().length > 0;
  const isFloating = isFocused || hasValue;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Determine border and highlight state
  let borderColorClass = 'border-[#4C5055]/70 hover:border-[#4C5055]';
  let labelColorClass = 'text-[#A0A4A8]';
  let focusRingClass = 'focus-within:border-[#47A5FF] focus-within:shadow-[0_0_16px_rgba(71,165,255,0.18)]';

  if (error) {
    borderColorClass = 'border-rose-500/80';
    labelColorClass = 'text-rose-400';
    focusRingClass = 'focus-within:border-rose-500 focus-within:shadow-[0_0_16px_rgba(244,63,94,0.18)]';
  } else if (warning) {
    borderColorClass = 'border-[#FF8F00]/80';
    labelColorClass = 'text-[#FF8F00]';
    focusRingClass = 'focus-within:border-[#FF8F00] focus-within:shadow-[0_0_16px_rgba(255,143,0,0.18)]';
  } else if (success) {
    borderColorClass = 'border-emerald-500/80';
    labelColorClass = 'text-emerald-400';
    focusRingClass = 'focus-within:border-emerald-500 focus-within:shadow-[0_0_16px_rgba(16,185,129,0.18)]';
  } else if (isFocused) {
    labelColorClass = 'text-[#47A5FF]';
  }

  return (
    <div className="w-full space-y-1.5 font-sans">
      <div
        className={`relative flex items-center bg-[#000000] border rounded-xl transition-all duration-200 ${borderColorClass} ${focusRingClass} ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/60' : ''
        }`}
      >
        {/* Leading Icon */}
        {Icon && (
          <div className="pl-3.5 pr-1 flex items-center pointer-events-none text-[#4C5055]">
            <Icon
              className={`w-4 h-4 transition-colors duration-200 ${
                isFocused ? 'text-[#47A5FF]' : error ? 'text-rose-400' : warning ? 'text-[#FF8F00]' : 'text-[#7D8287]'
              }`}
            />
          </div>
        )}

        {/* Input container with floating label */}
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
            id={inputId}
            value={value}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full bg-transparent text-[#FFFFFF] text-sm pt-4 pb-1 outline-none font-medium placeholder-transparent tracking-wide ${className}`}
            {...props}
          />
        </div>

        {/* Optional trailing badge or status */}
        {badge && <div className="pr-3.5 flex items-center">{badge}</div>}
      </div>

      {/* Validation or helper message rendered OUTSIDE the input field */}
      {error ? (
        <div className="flex items-center justify-between px-1 text-xs">
          <p className="text-rose-400 font-medium text-[11px] flex items-center gap-1">
            <span className="font-bold">•</span> {error}
          </p>
        </div>
      ) : warning ? (
        <div className="flex items-center justify-between px-1 text-xs">
          <p className="text-[#FF8F00] font-medium text-[11px] flex items-center gap-1">
            <span className="font-bold">•</span> {warning}
          </p>
        </div>
      ) : success && successMessage ? (
        <div className="flex items-center justify-between px-1 text-xs">
          <p className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
            <span className="font-bold">•</span> {successMessage}
          </p>
        </div>
      ) : helperText ? (
        <p className="px-1 text-[11px] text-[#7D8287]">{helperText}</p>
      ) : null}
    </div>
  );
};
