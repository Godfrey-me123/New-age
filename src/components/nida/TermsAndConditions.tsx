import React, { useState } from 'react';
import { Shield, AlertCircle, Check, X, FileText, Lock, Eye, Scale } from 'lucide-react';

interface TermsAndConditionsProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  showWarning?: boolean;
  disabled?: boolean;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
  checked,
  onChange,
  showWarning = false,
  disabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full font-sans">
      <div
        className={`p-4 bg-[#000000]/60 border rounded-2xl transition-all shadow-inner ${
          showWarning && !checked
            ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : checked
            ? 'border-emerald-500/50'
            : 'border-[#4C5055]/60'
        }`}
      >
        {/* Checkbox and Clickable Link */}
        <div className="flex items-start gap-3">
          <label className="relative flex items-center justify-center cursor-pointer mt-0.5 select-none shrink-0">
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                checked
                  ? 'bg-gradient-to-r from-[#47A5FF] to-[#2563eb] border-[#47A5FF] shadow-[0_0_10px_rgba(71,165,255,0.4)]'
                  : showWarning
                  ? 'bg-[#14171C] border-rose-500/90'
                  : 'bg-[#14171C] border-[#4C5055] hover:border-[#47A5FF]'
              }`}
            >
              {checked && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
            </div>
          </label>

          <div className="flex-1 text-xs text-[#A0A4A8] leading-relaxed">
            <span>I agree to the </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-[#47A5FF] hover:text-[#3b8fdc] font-semibold underline underline-offset-2 transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <span>Terms and Conditions</span>
            </button>
            <span className="text-[#7D8287]"> for identity processing and digital template generation.</span>
          </div>
        </div>

        {/* Validation Warning Alert (Only shown on submit attempt when unchecked) */}
        {showWarning && !checked && (
          <div className="mt-3 flex items-center gap-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Please accept the Terms and Conditions to proceed.</span>
          </div>
        )}
      </div>

      {/* Dedicated Terms and Conditions Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0F1115] border border-[#2D3139] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#14171D]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#47A5FF]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Terms and Conditions</h3>
                  <p className="text-xs text-[#A0A4A8]">Identity verification and template generation policy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-[#C5C8CD] leading-relaxed">
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <FileText className="w-4 h-4 text-[#47A5FF]" />
                  <h4>1. Lawful Data Input & Verification</h4>
                </div>
                <p className="text-xs text-[#A0A4A8] pl-6 leading-relaxed">
                  The user warrants and confirms that all provided national identification data (including Full Names, Date of Birth, Gender, 20-digit NIDA number, Passport Photograph, and Digital Specimen Signature) are authentic, accurate, and belong to the authorized identity holder. Any fraudulent generation of national credentials is strictly prohibited.
                </p>
              </section>

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <h4>2. Purpose of Processing & Security</h4>
                </div>
                <p className="text-xs text-[#A0A4A8] pl-6 leading-relaxed">
                  Information input into this module is dedicated strictly to automated card template mapping, barcode encoding, and document layout formatting. All image data (portrait and signature) remain within local browser memory and session state. No external distribution, commercial broker resale, or unauthorized sharing of citizen identification data is executed.
                </p>
              </section>

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <h4>3. Biometric Image & Media Preservation</h4>
                </div>
                <p className="text-xs text-[#A0A4A8] pl-6 leading-relaxed">
                  The original biometric photograph and specimen signature files provided by the user are preserved in their native format and transparency. The application applies positioning and dimensional fitting to standard CR80 templates without altering the integrity of the underlying digital assets.
                </p>
              </section>

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h4>4. Legal Compliance & Limitation of Liability</h4>
                </div>
                <p className="text-xs text-[#A0A4A8] pl-6 leading-relaxed">
                  Generated identification templates and documents are formatted according to official CR80 dimension standards. Users are responsible for ensuring that physical card production and cardholder verification adhere to all relevant statutory regulations governing official identification documents.
                </p>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D3139] bg-[#14171D]">
              <p className="text-xs text-[#7D8287]">
                Last updated: March 2026
              </p>
              <div className="flex items-center gap-2">
                {!checked && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(true);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Accept & Continue
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
