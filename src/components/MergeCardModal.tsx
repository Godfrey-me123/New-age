import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Layers,
  Save,
  Trash2,
  FileCheck,
  Download,
  CreditCard,
  CheckCircle,
  ArrowDown,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { CardTemplate, SavedMergeLayout } from '../types';
import {
  getAllMergeLayoutsDB,
  saveMergeLayoutDB,
  deleteMergeLayoutDB,
} from '../utils/idb';
import { download2In1PDF, renderTemplateToCanvas } from '../utils/export';
import { TemplateBadge } from './TemplateBadge';

export const MergeCardModal: React.FC = () => {
  const { isMergeModalOpen, setMergeModalOpen, loadSavedTemplates, currentTemplate } =
    useTemplateStore();

  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [frontTemplateId, setFrontTemplateId] = useState<string>('');
  const [backTemplateId, setBackTemplateId] = useState<string>('');
  
  const [layoutName, setLayoutName] = useState<string>('National ID Full');
  const [savedLayouts, setSavedLayouts] = useState<SavedMergeLayout[]>([]);
  
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [backPreview, setBackPreview] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const fetchInitialData = async () => {
    const list = await loadSavedTemplates();
    setTemplates(list);

    const store = useTemplateStore.getState();
    if (store.frontPopulatedTemplate && store.backPopulatedTemplate) {
      setFrontTemplateId(store.frontPopulatedTemplate.id);
      setBackTemplateId(store.backPopulatedTemplate.id);
    } else if (list.length > 0) {
      // Find default front and back
      const front = list.find((t) => t.side === 'Front Side') || list[0];
      const back = list.find((t) => t.side === 'Back Side') || list[1] || list[0];
      setFrontTemplateId(front.id);
      setBackTemplateId(back.id);
    }

    const layouts = await getAllMergeLayoutsDB();
    setSavedLayouts(layouts);
  };

  useEffect(() => {
    if (isMergeModalOpen) {
      fetchInitialData();
    }
  }, [isMergeModalOpen]);

  const frontTemplate = templates.find((t) => t.id === frontTemplateId);
  const backTemplate = templates.find((t) => t.id === backTemplateId);

  // Render previews when selection changes
  useEffect(() => {
    let active = true;
    const generatePreviews = async () => {
      const store = useTemplateStore.getState();
      const formData = store.lastNidaFormData || {};
      const fTpl = (store.frontPopulatedTemplate && store.frontPopulatedTemplate.id === frontTemplateId)
        ? store.frontPopulatedTemplate
        : frontTemplate;
      const bTpl = (store.backPopulatedTemplate && store.backPopulatedTemplate.id === backTemplateId)
        ? store.backPopulatedTemplate
        : backTemplate;

      if (fTpl || frontTemplate) {
        try {
          const c = await renderTemplateToCanvas((fTpl || frontTemplate)!, formData, 100);
          if (active) setFrontPreview(c.toDataURL('image/png'));
        } catch {}
      }
      if (bTpl || backTemplate) {
        try {
          const c = await renderTemplateToCanvas((bTpl || backTemplate)!, formData, 100);
          if (active) setBackPreview(c.toDataURL('image/png'));
        } catch {}
      }
    };
    generatePreviews();
    return () => {
      active = false;
    };
  }, [frontTemplateId, backTemplateId, templates]);

  if (!isMergeModalOpen) return null;

  const handleExportPDF = async () => {
    const store = useTemplateStore.getState();
    const fTpl = (store.frontPopulatedTemplate && store.frontPopulatedTemplate.id === frontTemplateId)
      ? store.frontPopulatedTemplate
      : frontTemplate;
    const bTpl = (store.backPopulatedTemplate && store.backPopulatedTemplate.id === backTemplateId)
      ? store.backPopulatedTemplate
      : backTemplate;
    const formData = store.lastNidaFormData || {};

    if (!fTpl && !frontTemplate) {
      alert('Please select a Front template.');
      return;
    }
    setIsExporting(true);
    try {
      await download2In1PDF((fTpl || frontTemplate)!, (bTpl || backTemplate)!, formData);
    } catch (e) {
      console.error(e);
      alert('Error generating 2-in-1 PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveMergeLayout = async () => {
    if (!layoutName.trim()) return;
    if (!frontTemplate || !backTemplate) return;

    const newLayout: SavedMergeLayout = {
      id: 'merge_' + Date.now(),
      name: layoutName.trim(),
      frontTemplateId: frontTemplate.id,
      backTemplateId: backTemplate.id,
      frontTemplateName: frontTemplate.templateName,
      backTemplateName: backTemplate.templateName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveMergeLayoutDB(newLayout);
    const updated = await getAllMergeLayoutsDB();
    setSavedLayouts(updated);

    setSaveSuccessMsg('Merge layout saved!');
    setTimeout(() => setSaveSuccessMsg(''), 2000);
  };

  const handleLoadLayout = (layout: SavedMergeLayout) => {
    setLayoutName(layout.name);
    if (templates.some((t) => t.id === layout.frontTemplateId)) {
      setFrontTemplateId(layout.frontTemplateId);
    }
    if (templates.some((t) => t.id === layout.backTemplateId)) {
      setBackTemplateId(layout.backTemplateId);
    }
  };

  const handleDeleteLayout = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteMergeLayoutDB(id);
    const updated = await getAllMergeLayoutsDB();
    setSavedLayouts(updated);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Merge 2-in-1 Card PDF</h2>
              <p className="text-xs text-slate-400">
                Combine Front & Back templates into a single print-ready PDF
              </p>
            </div>
          </div>

          <button
            onClick={() => setMergeModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Selection Controls & Saved Configurations */}
          <div className="md:col-span-5 space-y-5">
            {/* Front Template Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Front Template</span>
                <span className="text-[10px] text-blue-400 font-mono">TOP POSITION</span>
              </label>
              <select
                value={frontTemplateId}
                onChange={(e) => setFrontTemplateId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.templateName} ({t.cardType || 'ID Card'} - {t.orientation})
                  </option>
                ))}
              </select>
            </div>

            {/* Back Template Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Back Template</span>
                <span className="text-[10px] text-amber-400 font-mono">BOTTOM POSITION</span>
              </label>
              <select
                value={backTemplateId}
                onChange={(e) => setBackTemplateId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.templateName} ({t.cardType || 'ID Card'} - {t.orientation})
                  </option>
                ))}
              </select>
            </div>

            {/* Save Merge Configuration Section */}
            <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Save Merge Configuration
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="e.g. National ID Full..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSaveMergeLayout}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-blue-400" />
                  <span>Save</span>
                </button>
              </div>
              {saveSuccessMsg && (
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{saveSuccessMsg}</span>
                </p>
              )}

              {/* Saved Configurations List */}
              {savedLayouts.length > 0 && (
                <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Saved Merge Layouts:
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {savedLayouts.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => handleLoadLayout(l)}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700/50 rounded-lg text-xs text-slate-200 flex items-center justify-between cursor-pointer border border-slate-800"
                      >
                        <span className="truncate font-medium">{l.name}</span>
                        <button
                          onClick={(e) => handleDeleteLayout(l.id, e)}
                          className="p-1 text-slate-500 hover:text-red-400"
                          title="Delete saved merge layout"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting || !frontTemplate || !backTemplate}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Export 2-in-1 PDF'}</span>
            </button>
          </div>

          {/* Right Live Visual Layout Preview */}
          <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[360px]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-4 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              Print Page Layout Preview
            </span>

            <div className="w-full max-w-xs bg-slate-900 border-2 border-dashed border-slate-700 p-4 rounded-2xl flex flex-col items-center gap-4 shadow-xl">
              {/* Front Card Box */}
              <div className="w-full flex flex-col items-center">
                <div className="w-full aspect-[1.586/1] bg-slate-950 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center shadow">
                  {frontPreview ? (
                    <img
                      src={frontPreview}
                      alt="Front Card"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Front Preview</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-1">
                  FRONT CARD (TOP)
                </span>
              </div>

              <ArrowDown className="w-4 h-4 text-slate-600 my-[-4px]" />

              {/* Back Card Box */}
              <div className="w-full flex flex-col items-center">
                <div className="w-full aspect-[1.586/1] bg-slate-950 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center shadow">
                  {backPreview ? (
                    <img
                      src={backPreview}
                      alt="Back Card"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Back Preview</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-1">
                  BACK CARD (BOTTOM)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
