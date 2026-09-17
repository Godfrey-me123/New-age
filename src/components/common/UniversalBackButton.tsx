import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTemplateStore } from '../../store/useTemplateStore';

interface UniversalBackButtonProps {
  className?: string;
  label?: string;
  onClickCustom?: () => void;
}

export const UniversalBackButton: React.FC<UniversalBackButtonProps> = ({
  className = '',
  label = 'Back',
  onClickCustom,
}) => {
  const { goBack } = useTemplateStore();

  const handleClick = () => {
    if (onClickCustom) {
      onClickCustom();
    } else {
      goBack();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-bold text-[#000000] transition-colors cursor-pointer shadow-xs shrink-0 active:scale-95 ${className}`}
      title="Return to previous screen"
      aria-label="Return to previous screen"
    >
      <ArrowLeft className="w-3.5 h-3.5 text-[#000000] shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
};
