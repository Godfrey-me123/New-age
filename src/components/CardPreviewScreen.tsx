import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  ArrowLeft,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Edit3,
  CheckCircle2,
  FileCheck,
  CreditCard,
  RefreshCw,
  Eye,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
  Home,
  FileCode,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { renderTemplateToCanvas, downloadPDF, downloadPNG } from '../utils/export';
import { HorizontalActionRow } from './common/HorizontalActionRow';
import { AppFooter } from './common/AppFooter';
import { SAMPLE_TEMPLATES } from '../utils/sampleTemplates';
import { applyTemplateMapping, isBackSideTemplate, matchLayerToBinding, SupportedBinding } from '../utils/templateMappingEngine';
import { CardTemplate } from '../types';
import { FieldMappingInspectorModal } from './nida/FieldMappingInspectorModal';

export const CardPreviewScreen: React.FC = () => {
  const {
    currentTemplate,
    setCurrentTemplate,
    setActiveScreen,
    setExportModalOpen,
    frontPopulatedTemplate,
    backPopulatedTemplate,
    lastNidaFormData,
    setPopulatedCardPair,
  } = useTemplateStore();

  const [activeSide, setActiveSide] = useState<'front' | 'back'>(
    isBackSideTemplate(currentTemplate) ? 'back' : 'front'
  );

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Field Mapping Inspector (Development Only)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [selectedFieldId, setSelectedFieldId] = useState<SupportedBinding | null>(null);

  const isDevMode = typeof window !== 'undefined' && (
    (import.meta as any).env?.DEV ||
    window.location.search.includes('debug') ||
    window.location.search.includes('inspect') ||
    window.location.search.includes('dev')
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartDistRef = useRef<number | null>(null);

  // Keyboard shortcut Ctrl+Shift+D or Cmd+Shift+D for Dev Inspector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active template based on selected side
  const activeTemplate: CardTemplate = React.useMemo(() => {
    if (activeSide === 'back' && backPopulatedTemplate) {
      return backPopulatedTemplate;
    }
    if (activeSide === 'front' && frontPopulatedTemplate) {
      return frontPopulatedTemplate;
    }
    return currentTemplate;
  }, [activeSide, frontPopulatedTemplate, backPopulatedTemplate, currentTemplate]);

  // Ensure current template in store is synchronized when side changes
  const handleSideSwitch = (side: 'front' | 'back') => {
    setActiveSide(side);
    if (side === 'front' && frontPopulatedTemplate) {
      setCurrentTemplate(frontPopulatedTemplate);
    } else if (side === 'back' && backPopulatedTemplate) {
      setCurrentTemplate(backPopulatedTemplate);
    } else if (side === 'back' && !backPopulatedTemplate && lastNidaFormData) {
      // Find sample back template and populate it
      const sampleBack = SAMPLE_TEMPLATES.find((t) => t.id === 'sample_tanzania_nida_back') || SAMPLE_TEMPLATES[1];
      if (sampleBack) {
        const result = applyTemplateMapping(sampleBack, lastNidaFormData);
        setPopulatedCardPair(frontPopulatedTemplate || currentTemplate, result.populatedTemplate, lastNidaFormData);
        setCurrentTemplate(result.populatedTemplate);
      }
    }
  };

  // Render high-res card canvas to data URL for smooth interactive display
  useEffect(() => {
    let isCancelled = false;
    setIsRendering(true);

    renderTemplateToCanvas(activeTemplate, {}, 300)
      .then((canvas) => {
        if (!isCancelled) {
          setPreviewDataUrl(canvas.toDataURL('image/png'));
          setIsRendering(false);
        }
      })
      .catch((err) => {
        console.error('Failed to render preview canvas:', err);
        if (!isCancelled) setIsRendering(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTemplate]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.0, +(prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.65, +(prev - 0.15).toFixed(2)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
  };

  // Direct quick print action using existing export engine
  const handleQuickPrint = async () => {
    try {
      setIsPrinting(true);
      await downloadPDF(activeTemplate, {}, `${activeTemplate.templateName || 'card'}.pdf`);
    } catch (e) {
      console.error('Print failed', e);
    } finally {
      setIsPrinting(false);
    }
  };

  // Mobile pinch to zoom handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = (dist - touchStartDistRef.current) / 200;
      setZoomLevel((prev) => Math.min(2.0, Math.max(0.65, +(prev + diff).toFixed(2))));
      touchStartDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Extract meta details for display
  const holderName = lastNidaFormData
    ? `${lastNidaFormData.firstName || ''} ${lastNidaFormData.middleName || ''} ${lastNidaFormData.lastName || ''}`.trim()
    : 'Identity Document';
  const nidaNumber = lastNidaFormData?.nidaNumber || '';
  const gender = lastNidaFormData?.gender ? (lastNidaFormData.gender.toUpperCase().startsWith('M') ? 'M' : 'F') : 'M';

  const hasBackCounterpart = Boolean(
    backPopulatedTemplate || SAMPLE_TEMPLATES.some((t) => t.id === 'sample_tanzania_nida_back')
  );

  return (
    <div className="w-full min-h-screen bg-[#08090B] text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full bg-[#0F1115]/95 backdrop-blur-md border-b border-[#4C5055]/50 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              id="back-to-form-btn"
              type="button"
              onClick={() => setActiveScreen('nida')}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-[#4C5055]/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Return to form to edit fields"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Form</span>
            </button>

            <div className="h-4 w-px bg-[#4C5055]/60 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Card Preview
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Ready to Export
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDevMode && (
              <button
                id="dev-mapping-inspector-btn"
                type="button"
                onClick={() => setIsInspectorOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-[#FF8F00]/15 hover:bg-[#FF8F00]/25 text-[#FF8F00] border border-[#FF8F00]/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open Field Mapping & Data Inspector (Ctrl+Shift+D)"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">[Dev] Field Inspector</span>
                <span className="sm:hidden">Dev</span>
              </button>
            )}

            <button
              id="header-edit-studio-btn"
              type="button"
              onClick={() => setActiveScreen('editor')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-[#4C5055]/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#47A5FF]" />
              <span className="hidden sm:inline">Edit in Studio</span>
              <span className="sm:hidden">Edit</span>
            </button>

            <button
              id="header-home-btn"
              type="button"
              onClick={() => setActiveScreen('home')}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-[#4C5055]/50 text-xs transition-colors cursor-pointer"
              title="Return to Services Home"
            >
              <Home className="w-4 h-4 text-[#47A5FF]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 flex flex-col items-center">
        {/* Front / Back Side Switcher */}
        {hasBackCounterpart && (
          <div className="mb-4 flex items-center justify-center">
            <div className="p-1 rounded-2xl bg-[#14171D] border border-[#4C5055]/60 flex items-center gap-1 shadow-inner">
              <button
                id="preview-side-front-btn"
                type="button"
                onClick={() => handleSideSwitch('front')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeSide === 'front'
                    ? 'bg-gradient-to-r from-[#47A5FF] to-[#2563eb] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Front Side</span>
              </button>

              <button
                id="preview-side-back-btn"
                type="button"
                onClick={() => handleSideSwitch('back')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeSide === 'back'
                    ? 'bg-gradient-to-r from-[#47A5FF] to-[#2563eb] text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Back Side</span>
              </button>
            </div>
          </div>
        )}

        {/* Card Stage / Viewer */}
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full relative flex flex-col items-center justify-center p-3 sm:p-6 bg-[#0E1015] border border-[#4C5055]/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Card Viewer Canvas Box */}
          <div className="w-full flex items-center justify-center min-h-[240px] sm:min-h-[380px] relative overflow-hidden">
            {isRendering && !previewDataUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0E1015]/80 z-10 gap-2">
                <RefreshCw className="w-7 h-7 text-[#47A5FF] animate-spin" />
                <span className="text-xs text-slate-400 font-medium">Rendering card preview...</span>
              </div>
            )}

            {previewDataUrl ? (
              <div
                className="transition-transform duration-150 ease-out origin-center select-none flex items-center justify-center relative"
                style={{
                  transform: `scale(${zoomLevel})`,
                  maxWidth: '100%',
                }}
              >
                <div className="relative rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] border border-slate-700/50 overflow-hidden bg-white">
                  <img
                    src={previewDataUrl}
                    alt={`${activeTemplate.templateName} Preview`}
                    className="max-w-full h-auto max-h-[55vh] object-contain rounded-2xl pointer-events-none"
                    draggable={false}
                  />

                  {/* Dev Visual Highlight Overlay for Inspected Element */}
                  {selectedFieldId && (() => {
                    const matchedLayer = activeTemplate.layers.find((l) =>
                      matchLayerToBinding(l, selectedFieldId, activeTemplate.layers)
                    );
                    if (!matchedLayer) return null;

                    const tWidth = activeTemplate.cardWidth || 85.6;
                    const tHeight = activeTemplate.cardHeight || 53.98;

                    const leftPct = (matchedLayer.x / tWidth) * 100;
                    const topPct = (matchedLayer.y / tHeight) * 100;
                    const widthPct = (matchedLayer.width / tWidth) * 100;
                    const heightPct = (matchedLayer.height / tHeight) * 100;

                    return (
                      <div
                        className="absolute border-2 border-[#47A5FF] bg-[#47A5FF]/20 rounded shadow-[0_0_15px_#47A5FF] pointer-events-none z-20 animate-pulse"
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 px-2 py-0.5 bg-[#47A5FF] text-white text-[9px] font-mono font-bold rounded shadow whitespace-nowrap">
                          {selectedFieldId}: {matchedLayer.name} ({matchedLayer.width}×{matchedLayer.height}mm)
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-12">
                Generating card display...
              </div>
            )}
          </div>

          {/* Zoom Controls (Below card, clean and distinct) */}
          <div className="mt-4 pt-3 border-t border-[#4C5055]/40 w-full flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-semibold text-white">
                {activeSide === 'front' ? 'Front Side' : 'Back Side'}
              </span>
              <span>•</span>
              <span>CR80 (85.6 × 54.0 mm)</span>
            </div>

            <div className="flex items-center gap-1 bg-[#14171E] border border-[#4C5055]/60 rounded-xl p-1">
              <button
                id="zoom-out-btn"
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.65}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                id="zoom-reset-btn"
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 rounded-lg hover:bg-white/10 text-[11px] font-mono font-semibold text-slate-200 transition-colors cursor-pointer"
                title="Reset Zoom (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                id="zoom-in-btn"
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.0}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Center */}
        <div className="w-full mt-6 space-y-4">
          {/* Primary Action Button (Download / Export) */}
          <button
            id="primary-download-export-btn"
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#2563eb] hover:from-emerald-500 hover:to-blue-600 text-white font-bold text-base shadow-[0_10px_35px_rgba(16,185,129,0.35)] hover:shadow-[0_12px_45px_rgba(16,185,129,0.45)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Download / Export Card</span>
          </button>

          {/* Secondary Actions (Horizontal row for safe responsive mobile wrapping) */}
          <HorizontalActionRow className="justify-center gap-2 pt-1">
            <button
              id="action-edit-studio-btn"
              type="button"
              onClick={() => setActiveScreen('editor')}
              className="px-4 py-2.5 rounded-xl bg-[#14171E] hover:bg-[#1E222A] text-slate-200 hover:text-white border border-[#4C5055]/70 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#47A5FF]" />
              <span>Edit in Studio</span>
            </button>

            <button
              id="action-edit-form-btn"
              type="button"
              onClick={() => setActiveScreen('nida')}
              className="px-4 py-2.5 rounded-xl bg-[#14171E] hover:bg-[#1E222A] text-slate-200 hover:text-white border border-[#4C5055]/70 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edit Form Details</span>
            </button>

            <button
              id="action-quick-print-btn"
              type="button"
              onClick={handleQuickPrint}
              disabled={isPrinting}
              className="px-4 py-2.5 rounded-xl bg-[#14171E] hover:bg-[#1E222A] text-slate-200 hover:text-white border border-[#4C5055]/70 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-[#FF8F00]" />
              <span>{isPrinting ? 'Preparing PDF...' : 'Print PDF'}</span>
            </button>

            <button
              id="action-all-services-btn"
              type="button"
              onClick={() => setActiveScreen('home')}
              className="px-4 py-2.5 rounded-xl bg-[#14171E] hover:bg-[#1E222A] text-slate-200 hover:text-white border border-[#4C5055]/70 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-purple-400" />
              <span>All Services</span>
            </button>
          </HorizontalActionRow>
        </div>

        {/* Identity Summary Card (Compact specifications) */}
        {nidaNumber && (
          <div className="w-full mt-6 p-4 rounded-2xl bg-[#0F1115]/70 border border-[#4C5055]/40 text-xs text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] uppercase text-[#A0A4A8] font-bold block">Cardholder</span>
                <span className="font-semibold text-white truncate block">{holderName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#A0A4A8] font-bold block">NIDA Number</span>
                <span className="font-mono font-semibold text-[#47A5FF] block">{nidaNumber}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#A0A4A8] font-bold block">Gender / Sex</span>
                <span className="font-semibold text-white block">{gender}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <AppFooter />

      {/* Field Mapping & Data Inspector Modal (Dev Only) */}
      <FieldMappingInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        frontTemplate={frontPopulatedTemplate || currentTemplate}
        backTemplate={backPopulatedTemplate || null}
        formData={lastNidaFormData || {}}
        selectedFieldId={selectedFieldId}
        onSelectField={(fieldId) => setSelectedFieldId(fieldId)}
      />
    </div>
  );
};
