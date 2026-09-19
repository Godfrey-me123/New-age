import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const StartupDisclaimerModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('bigsta_startup_disclaimer_accepted');
      if (accepted !== 'true') {
        setIsOpen(true);
      }
    } catch (e) {
      setIsOpen(true);
    }
  }, []);

  const handleAgree = () => {
    try {
      localStorage.setItem('bigsta_startup_disclaimer_accepted', 'true');
    } catch (e) {}
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsCancelled(true);
  };

  if (isCancelled) {
    return (
      <div className="fixed inset-0 z-50 bg-[#08090B]/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#14171D] border border-red-500/30 rounded-3xl p-6 text-center shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            You must agree to the Terms of Use and unofficial platform notice before accessing BIGsta. Please refresh the page if you wish to accept.
          </p>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#08090B]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-lg w-full bg-[#14171D] border border-[#2D3139] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="p-6 bg-[#1A1F26] border-b border-[#2D3139] flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Legal & Compliance Notice</span>
            <h2 className="text-lg font-bold text-white tracking-tight">Important Notice</h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 font-medium space-y-2">
            <p className="font-bold">
              This platform is not a government website or government system. Services, templates and generated documents available through this application are independent and unofficial. Please read and agree to the Terms of Use before proceeding.
            </p>
          </div>

          <p>
            Documents, templates, cards and generated outputs provided through this platform are unofficial and intended only for personal reference, memory keeping, demonstration, design, testing or educational purposes.
          </p>

          <div className="space-y-1.5 text-slate-400 text-xs">
            <p>• BIGsta does not connect to, access, or verify records from government databases.</p>
            <p>• Generated outputs must not be used for official identity verification, legal transactions, or government submissions.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#1A1F26] border-t border-[#2D3139] flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAgree}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Agree & Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
