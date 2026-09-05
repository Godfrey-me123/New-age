import React, { useState } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  icon?: LucideIcon;
  error?: string | null;
  helperText?: string;
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  options,
  icon: Icon,
  error,
  helperText,
  value,
  id,
  className = '',
  disabled,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const selectId = id || `floating-select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const hasValue = value !== undefined && value !== null && value.toString().length > 0;
  const isFloating = isFocused || hasValue;

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColorClass = error
    ? 'border-rose-500/80 focus-within:border-rose-500 focus-within:shadow-[0_0_16px_rgba(244,63,94,0.18)]'
    : 'border-[#4C5055]/70 hover:border-[#4C5055] focus-within:border-[#47A5FF] focus-within:shadow-[0_0_16px_rgba(71,165,255,0.18)]';

  const labelColorClass = error
    ? 'text-rose-400'
    : isFocused
    ? 'text-[#47A5FF]'
    : 'text-[#A0A4A8]';

  return (
    <div className="w-full space-y-1.5 font-sans">
      <div
        className={`relative flex items-center bg-[#000000] border rounded-xl transition-all duration-200 ${borderColorClass} ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/60' : ''
        }`}
      >
        {/* Leading Icon */}
        {Icon && (
          <div className="pl-3.5 pr-1 flex items-center pointer-events-none text-[#4C5055]">
            <Icon
              className={`w-4 h-4 transition-colors duration-200 ${
                isFocused ? 'text-[#47A5FF]' : error ? 'text-rose-400' : 'text-[#7D8287]'
              }`}
            />
          </div>
        )}

        {/* Select container with floating label */}
        <div className="relative flex-1 py-1 px-3.5">
          <label
            htmlFor={selectId}
            className={`absolute left-3.5 transition-all duration-200 pointer-events-none select-none font-medium tracking-wide ${
              isFloating
                ? `top-1.5 text-[10px] uppercase font-semibold ${labelColorClass}`
                : 'top-3.5 text-sm text-[#7D8287]'
            }`}
          >
            {label}
          </label>

          <select
            id={selectId}
            value={value}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-full bg-transparent text-[#FFFFFF] text-sm pt-4 pb-1 outline-none font-medium appearance-none cursor-pointer tracking-wide ${className}`}
            {...props}
          >
            <option value="" disabled className="bg-[#1C1F22] text-[#7D8287]">
              Select {label}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1C1F22] text-[#FFFFFF] py-1">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Dropdown Chevron */}
        <div className="pr-3.5 pointer-events-none flex items-center text-[#7D8287]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {/* Messages */}
      {(error || helperText) && (
        <div className="px-1 text-xs">
          {error ? (
            <p className="text-rose-400 font-medium text-[11px] flex items-center gap-1">
              <span>•</span> {error}
            </p>
          ) : (
            <p className="text-[#7D8287] text-[11px]">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
};
