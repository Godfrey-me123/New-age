import React from 'react';

export const AppFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer
      id="app-global-footer"
      className={`w-full py-8 text-center border-t border-slate-800/40 mt-auto select-none pointer-events-auto ${className}`}
    >
      <p className="text-[11px] text-slate-500 tracking-wider font-medium">
        All Rights Reserved @2026
      </p>
    </footer>
  );
};
