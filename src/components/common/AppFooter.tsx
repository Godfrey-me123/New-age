import React from 'react';

export const AppFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer
      id="app-global-footer"
      className={`w-full py-4 text-center border-t border-[#E7E9EB] mt-auto select-none pointer-events-auto bg-[#FFFFFF] ${className}`}
    >
      <p className="text-[11px] text-slate-500 tracking-wider font-medium">
        All Rights Reserved © 2026
      </p>
    </footer>
  );
};
