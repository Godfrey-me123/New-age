import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, CreditCard, Check, AlertCircle, RefreshCw, X, ShieldCheck, ArrowRight, Clock, Copy, Hash, Zap, Sparkles } from 'lucide-react';
import { useTemplateStore, NIDA_USAGE_PACKAGES } from '../../store/useTemplateStore';
import { paymentService } from '../../services/paymentService';

export const RechargeModal: React.FC = () => {
  const {
    isRechargeModalOpen,
    setRechargeModalOpen,
    rechargeNotice,
    authRole,
    currentAuthKey,
    activePasskeys,
    paymentRequests,
    submitPaymentRequest,
    refreshUserStatus,
    tokenPackages,
  } = useTemplateStore();

  const activePkgs = useMemo(() => {
    return (tokenPackages || []).filter((p) => p.active !== false);
  }, [tokenPackages]);

  const [selectedPkgId, setSelectedPkgId] = useState<string>('');

  useEffect(() => {
    if (activePkgs.length > 0 && !selectedPkgId) {
      setSelectedPkgId(activePkgs[0].id);
    }
  }, [activePkgs, selectedPkgId]);

  const [copiedLipa, setCopiedLipa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [reference, setReference] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // OCR state (Prompt 22)
  const [ocrImage, setOcrImage] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [scanError, setScanError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setOcrImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScanOCR = async () => {
    if (!ocrImage && !ocrText.trim()) {
      setScanError('Please upload a screenshot or paste SMS text/receipt.');
      return;
    }
    setIsScanning(true);
    setScanError('');
    try {
      const res = await fetch('/api/payment/extract-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: ocrImage, text: ocrText }),
      });
      const data = await res.json();
      if (data.success) {
        setExtractedData(data.data);
        if (data.data.transactionId) {
          setReference(data.data.transactionId);
        }
      } else {
        setScanError(data.error || 'Extraction failed');
      }
    } catch (err: any) {
      setScanError('Network or extraction error: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Escape key listener
  useEffect(() => {
    if (!isRechargeModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRechargeModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRechargeModalOpen, setRechargeModalOpen]);

  const currentPasskey = useMemo(() => activePasskeys.find(
    (p) => p.role === 'user' && p.key.toLowerCase() === (currentAuthKey || '').toLowerCase()
  ), [activePasskeys, currentAuthKey]);

  const remainingUsages = currentPasskey?.remainingUsages ?? 0;
  const paymentStatus = currentPasskey?.paymentStatus || 'ACTIVE';

  // Find latest user payment request if any
  const userRequests = useMemo(() => paymentRequests.filter(
    (r) => r.userPasskey.toLowerCase() === (currentAuthKey || '').toLowerCase()
  ), [paymentRequests, currentAuthKey]);
  
  const latestRequest = userRequests.length > 0 ? userRequests[userRequests.length - 1] : null;
  const pendingRequest = userRequests.find((r) => r.status === 'PENDING') || latestRequest;

  const selectedPkg = useMemo(() => activePkgs.find((p) => p.id === selectedPkgId) || activePkgs[0] || { id: '', name: 'Standard', price: 'TSh 15,000', usages: 5 }, [activePkgs, selectedPkgId]);

  if (!isRechargeModalOpen) return null;

  const handleCopyLipa = () => {
    navigator.clipboard.writeText('1234678');
    setCopiedLipa(true);
    setTimeout(() => setCopiedLipa(false), 2000);
  };

  const handleAutoVerify = async () => {
    if (!reference.trim()) {
      setVerificationError('Please enter your transaction reference.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    
    try {
      const res = await paymentService.autoConfirmWithReference(reference.trim(), currentPasskey?.id || '');
      if (res.success) {
        setSubmittedMessage(res.message);
        refreshUserStatus();
        setReference('');
      } else {
        setVerificationError(res.message);
      }
    } catch (error) {
      setVerificationError('Verification failed. Please check your reference and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePaymentSubmit = () => {
    setIsSubmitting(true);
    setSubmittedMessage('');

    setTimeout(() => {
      const res = submitPaymentRequest(
        selectedPkg.id,
        selectedPkg.name,
        selectedPkg.price,
        selectedPkg.usages
      );

      setIsSubmitting(false);

      if (res.success) {
        setSubmittedMessage('Payment request submitted. You can wait for manual approval OR enter your Transaction Reference below for instant auto-verification.');
      }
    }, 300);
  };

  const handleRefresh = () => {
    refreshUserStatus();
  };

  return (
    <div
      onClick={() => setRechargeModalOpen(false)}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in font-sans cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-[#0B132B] text-white flex flex-col items-center justify-between border-b border-slate-800 text-center">
          <div className="w-full flex items-center justify-end mb-1">
            <button
              type="button"
              onClick={() => setRechargeModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-3xl font-black text-white tracking-wider">BIGsta</h2>
            <p className="text-gray-100 text-base font-bold">Dear BIGsta User,</p>
            <p className="text-gray-300 text-sm font-medium">You need to recharge your account.</p>
          </div>
          {rechargeNotice && (
            <p className="text-amber-300 text-xs mt-3 bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30 w-full text-center font-bold">
              {rechargeNotice}
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-slate-900">
          {/* Out of Usages Notice if passed */}
          {rechargeNotice && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-800 text-xs animate-shake">
              <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold block text-red-950">You're out of usages.</strong>
                <span className="text-red-700">{rechargeNotice}</span>
              </div>
            </div>
          )}

          {/* Current Usages & Status Header */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Usages Available
              </span>
              <span className="text-xl font-black font-mono text-slate-900">
                {remainingUsages} {remainingUsages === 1 ? 'Usage' : 'Usages'}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] text-slate-500 font-medium">Payment Status:</span>
              {paymentStatus === 'PENDING' ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin text-amber-700" />
                  PENDING
                </span>
              ) : paymentStatus === 'ACTIVE' || (latestRequest && latestRequest.status === 'APPROVED') ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  {latestRequest?.status === 'APPROVED' ? 'APPROVED' : 'ACTIVE'}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-900 border border-red-300 text-xs font-bold">
                  {paymentStatus}
                </span>
              )}
            </div>
          </div>

          {/* Pending Payment Notice if currently pending */}
          {paymentStatus === 'PENDING' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-[13px]">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Your previous payment request is still awaiting Admin approval.</span>
              </div>

              <div className="p-3 bg-white border border-amber-200 rounded-lg space-y-1.5 font-mono text-[11px] text-slate-800">
                <div className="flex justify-between border-b border-amber-100 pb-1.5 mb-1.5">
                  <span className="text-slate-500 font-sans">Status:</span>
                  <span className="font-bold text-amber-700">PENDING</span>
                </div>
                {pendingRequest && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Requested Package:</span>
                      <span className="font-bold">{pendingRequest.packageName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Requested Tokens:</span>
                      <span className="font-bold">{pendingRequest.requestedUsages} Tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Request Date:</span>
                      <span className="font-bold">{pendingRequest.date}</span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-amber-800 leading-relaxed text-[11px]">
                Your top-up request has been submitted. The Administrator is currently verifying your payment. Click "Refresh Status" to update once approved.
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Status</span>
              </button>
            </div>
          )}

          {/* Submitted Message */}
          {submittedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{submittedMessage}</span>
              </div>
            </div>
          )}

          {/* Smart AI Payment Scanner (Prompt 22) */}
          <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-lg text-white space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/40 text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-200">Smart AI Payment Scanner</h4>
                <p className="text-[10px] text-indigo-300">Upload screenshot, PDF or paste SMS text for instant OCR extraction</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2">
                <label className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-xs font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-2">
                  <span>📷 Upload Screenshot/PDF</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {ocrImage && (
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg text-xs">
                  <span className="truncate max-w-[200px] text-indigo-200">Screenshot attached</span>
                  <button type="button" onClick={() => setOcrImage('')} className="text-red-400 hover:text-red-300 text-[10px]">Remove</button>
                </div>
              )}

              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                placeholder="Or paste SMS / receipt text here (M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, Mixx, Bank)..."
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 text-xs text-white placeholder:text-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />

              {scanError && (
                <p className="text-[10px] font-bold text-red-300 bg-red-950/50 px-2 py-1 rounded flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {scanError}
                </p>
              )}

              <button
                type="button"
                onClick={handleScanOCR}
                disabled={isScanning || (!ocrImage && !ocrText.trim())}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Extracting Details with AI OCR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Scan & Extract Details</span>
                  </>
                )}
              </button>

              {extractedData && (
                <div className="p-3 bg-white/10 rounded-xl border border-white/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold text-emerald-300">
                    <span>✨ Extracted Transaction Record</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                      {extractedData.status || 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                    <div><span className="text-indigo-300 font-sans">Provider:</span> {extractedData.paymentProvider || 'N/A'}</div>
                    <div><span className="text-indigo-300 font-sans">Tx ID:</span> {extractedData.transactionId || 'N/A'}</div>
                    <div><span className="text-indigo-300 font-sans">Amount:</span> {extractedData.currency || 'TSh'} {extractedData.amount || '0'}</div>
                    <div><span className="text-indigo-300 font-sans">Sender:</span> {extractedData.sender || 'N/A'}</div>
                    <div className="col-span-2 truncate"><span className="text-indigo-300 font-sans">Receiver:</span> {extractedData.receiver || 'N/A'} ({extractedData.receiverAccount || ''})</div>
                  </div>
                  <p className="text-[10px] text-indigo-200 italic pt-1 border-t border-white/10">
                    Data parsed successfully. Reference filled automatically below for verification.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Verification Section */}
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Zap className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">Instant Auto-Verify</h4>
                <p className="text-[10px] text-blue-100">Enter transaction reference for instant tokens</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Hash className="w-4 h-4 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.toUpperCase())}
                  placeholder="E.g. QRC7W8X9Z2"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-3 py-2.5 text-sm font-bold placeholder:text-blue-300/50 focus:outline-none focus:ring-2 focus:ring-white/30 uppercase"
                />
              </div>
              
              {verificationError && (
                <p className="text-[10px] font-bold text-red-200 bg-red-900/30 px-2 py-1 rounded flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {verificationError}
                </p>
              )}

              <button
                type="button"
                onClick={handleAutoVerify}
                disabled={isVerifying || !reference.trim()}
                className="w-full py-2.5 bg-white text-blue-600 font-black text-xs rounded-xl shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Reference
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Package Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
              Select Token Package
            </label>

            <div className="grid grid-cols-1 gap-2">
              {activePkgs.map((pkg) => {
                const isSelected = pkg.id === selectedPkgId;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPkgId(pkg.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="font-bold text-xs text-slate-900">{pkg.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {pkg.usages} {pkg.usages === 1 ? 'Usage' : 'Usages'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold font-mono text-blue-700">
                        {pkg.price}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lipa Number Payment Instruction Box */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Payment Instructions
              </span>
              <span className="text-[10px] text-slate-400">Merchant Number</span>
            </div>

            <div className="flex items-center justify-between bg-slate-800/90 p-2.5 rounded-lg border border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400 block">Merchant Lipa Number:</span>
                <span className="text-base font-black font-mono text-blue-400 tracking-wider">
                  1234678
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyLipa}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedLipa ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 font-medium">
              <p>• Pay <strong>{selectedPkg.price}</strong> to Merchant Number: <strong>1234678</strong> (BIGSTA RECHARGE).</p>
              <p>• After completing your payment, click <strong>"Add Tokens"</strong> below.</p>
            </div>
          </div>

          {/* Selected Package Summary */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[11px] text-blue-900/80 block font-semibold">Selected Package:</span>
              <strong className="text-blue-950 font-bold">{selectedPkg.name} ({selectedPkg.usages} Usages)</strong>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-blue-900/80 block font-semibold">Total Price:</span>
              <strong className="text-blue-700 font-extrabold font-mono text-sm">{selectedPkg.price}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {submittedMessage ? (
              <button
                type="button"
                onClick={() => {
                  setRechargeModalOpen(false);
                  setSubmittedMessage('');
                }}
                className="w-full py-3 bg-[#0B132B] hover:bg-[#1C2541] text-white font-bold text-sm rounded-xl transition-all cursor-pointer text-center"
              >
                OK
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRechargeModalOpen(false)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all flex-1 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting || paymentStatus === 'PENDING'}
                  className="py-3 px-4 flex-[2] bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-95 active:shadow-inner flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting Request...
                    </span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Add Tokens</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-center text-slate-500">
            Refresh the page or click "Refresh Status" to check your payment status and available usages.
          </p>
        </div>
      </div>
    </div>
  );
};
