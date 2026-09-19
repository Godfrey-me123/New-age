import React, { useState } from 'react';
import { X, Phone, MessageSquare, User, Send, CheckCircle2 } from 'lucide-react';
import { useTemplateStore } from '../../store/useTemplateStore';

export const ManualApplicationModal: React.FC = () => {
  const { isManualAppModalOpen, setManualAppModalOpen, selectedManualService, submitManualRequest } = useTemplateStore();

  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [normalCallNumber, setNormalCallNumber] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isManualAppModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || (!whatsappNumber.trim() && !normalCallNumber.trim())) {
      alert('Please enter your full name and at least one contact number (WhatsApp or Normal Calls).');
      return;
    }

    submitManualRequest({
      serviceId: selectedManualService?.id || 'general',
      serviceName: selectedManualService?.name || 'General Service Application',
      fullName: fullName.trim(),
      whatsappNumber: whatsappNumber.trim(),
      normalNumber: normalCallNumber.trim(),
    });

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setFullName('');
      setWhatsappNumber('');
      setNormalCallNumber('');
      setManualAppModalOpen(false);
    }, 2000);
  };

  return (
    <div
      onClick={() => setManualAppModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#E7E2DE] border-none rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left text-[#101010] cursor-default"
      >
        <button
          type="button"
          onClick={() => setManualAppModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#101010]/10 text-[#101010] hover:bg-[#101010] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedSuccess ? (
          <div className="py-8 text-center space-y-3 animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#101010]">Request Submitted Successfully!</h3>
            <p className="text-xs text-[#101010]/80">
              Our administrative team has received your manual application request and will contact you shortly via WhatsApp or phone.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#101010] text-white shadow-xs">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#101010]/10 text-[#101010]">
                  Manual Processing Service
                </span>
                <h3 className="text-lg font-bold text-[#101010] mt-1">
                  Request Manual Application
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#101010]/80 leading-relaxed mb-5 font-medium">
              Submit your details for <strong className="text-[#101010] font-bold">{selectedManualService?.name || 'this service'}</strong>. Our admin team will manually process your application and contact you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#101010]" />
                  Applicant Full Names *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Juma Ally Mohamed"
                  className="w-full px-4 py-3 bg-white border border-[#C8C2BE] rounded-xl text-xs font-semibold text-[#101010] focus:outline-none focus:border-[#101010] shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  WhatsApp Contact Number *
                </label>
                <input
                  type="text"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +255 712 345 678"
                  className="w-full px-4 py-3 bg-white border border-[#C8C2BE] rounded-xl text-xs font-semibold text-[#101010] focus:outline-none focus:border-[#101010] shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#101010] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  Normal Call Contact Number *
                </label>
                <input
                  type="text"
                  required
                  value={normalCallNumber}
                  onChange={(e) => setNormalCallNumber(e.target.value)}
                  placeholder="e.g. +255 754 123 456"
                  className="w-full px-4 py-3 bg-white border border-[#C8C2BE] rounded-xl text-xs font-semibold text-[#101010] focus:outline-none focus:border-[#101010] shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 bg-[#101010] hover:bg-[#222222] text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Application Request</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualAppModalOpen(false)}
                  className="py-3 px-5 bg-[#D8D2CE] hover:bg-[#dad5d0] text-[#101010] rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
