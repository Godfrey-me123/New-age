import React, { useState, useEffect } from 'react';
import { X, Save, Copy, RefreshCw, CheckCircle, Tag, Layers } from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { CardTemplate, CardType, CardSide } from '../types';

export const SaveTemplateModal: React.FC = () => {
  const {
    isSaveModalOpen,
    setSaveModalOpen,
    currentTemplate,
    saveCurrentTemplate,
    saveAsNewTemplate,
    loadSavedTemplates,
    updateTemplateMeta,
  } = useTemplateStore();

  const [mode, setMode] = useState<'options' | 'saveAs'>('options');
  const [templateName, setTemplateName] = useState('');
  const [cardType, setCardType] = useState<CardType>('National ID');
  const [side, setSide] = useState<CardSide>('Front Side');
  const [existingTemplates, setExistingTemplates] = useState<CardTemplate[]>([]);
  const [conflictTemplate, setConflictTemplate] = useState<CardTemplate | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  useEffect(() => {
    if (isSaveModalOpen) {
      setTemplateName(currentTemplate.templateName);
      setCardType(currentTemplate.cardType || 'National ID');
      setSide(currentTemplate.side || 'Front Side');
      setMode('options');
      setConflictTemplate(null);
      setIsSavedSuccess(false);

      loadSavedTemplates().then(setExistingTemplates);
    }
  }, [isSaveModalOpen, currentTemplate, loadSavedTemplates]);

  if (!isSaveModalOpen) return null;

  const handleQuickSave = async () => {
    updateTemplateMeta({ cardType, side });
    await saveCurrentTemplate();
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      setSaveModalOpen(false);
    }, 1200);
  };

  const checkConflictAndSaveAs = async (nameToSave: string) => {
    const trimmed = nameToSave.trim();
    if (!trimmed) return;

    const existingMatch = existingTemplates.find(
      (t) => t.templateName.toLowerCase() === trimmed.toLowerCase() && t.id !== currentTemplate.id
    );

    if (existingMatch) {
      setConflictTemplate(existingMatch);
    } else {
      await saveAsNewTemplate(trimmed, cardType, side);
      setIsSavedSuccess(true);
      setTimeout(() => {
        setIsSavedSuccess(false);
        setSaveModalOpen(false);
      }, 1200);
    }
  };

  const handleReplaceExisting = async () => {
    if (!conflictTemplate) return;
    const updated = {
      ...currentTemplate,
      id: conflictTemplate.id,
      templateName: templateName.trim(),
      cardType,
      side,
      updatedAt: new Date().toISOString(),
    };
    useTemplateStore.getState().loadTemplate(updated);
    await saveCurrentTemplate();
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      setSaveModalOpen(false);
    }, 1200);
  };

  const handleCreateNewCopy = async () => {
    const copyName = `${templateName.trim()} (Copy)`;
    await saveAsNewTemplate(copyName, cardType, side);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      setSaveModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Save Template</h2>
              <p className="text-xs text-slate-400">
                Update existing design or create a new template copy
              </p>
            </div>
          </div>

          <button
            onClick={() => setSaveModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isSavedSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
              <h3 className="text-base font-bold text-white">Template Saved Successfully!</h3>
              <p className="text-xs text-slate-400">
                Your changes have been safely stored in your local library.
              </p>
            </div>
          ) : conflictTemplate ? (
            /* Conflict Resolution View */
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed">
                <span className="font-bold block mb-1 text-amber-400">Name Already Exists</span>
                A template named <span className="underline font-semibold">"{templateName}"</span>{' '}
                already exists in your library. Please choose how you want to proceed:
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  onClick={handleReplaceExisting}
                  className="p-3.5 bg-slate-800 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/50 rounded-xl text-left flex items-center gap-3 transition-colors group"
                >
                  <RefreshCw className="w-5 h-5 text-amber-400 group-hover:rotate-180 transition-transform duration-300" />
                  <div>
                    <span className="font-bold text-sm text-white block">
                      Replace Existing Template
                    </span>
                    <span className="text-xs text-slate-400">
                      Overwrite target template with current workspace design
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleCreateNewCopy}
                  className="p-3.5 bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-xl text-left flex items-center gap-3 transition-colors group"
                >
                  <Copy className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="font-bold text-sm text-white block">Create New Copy</span>
                    <span className="text-xs text-slate-400">
                      Save as "{templateName} (Copy)" without touching existing file
                    </span>
                  </div>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setConflictTemplate(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Back
                </button>
              </div>
            </div>
          ) : mode === 'options' ? (
            /* Save / Save As Choice */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleQuickSave}
                  className="p-4 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl text-left flex flex-col justify-between transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Save className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm text-white group-hover:text-emerald-400">
                      Save
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Overwrites and updates current saved template: "{currentTemplate.templateName}"
                  </p>
                  <span className="text-xs font-semibold text-emerald-400">Update Existing →</span>
                </button>

                <button
                  onClick={() => setMode('saveAs')}
                  className="p-4 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl text-left flex flex-col justify-between transition-all group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Copy className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-sm text-white group-hover:text-blue-400">
                      Save As...
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Create a new independent template file with a custom name and badges
                  </p>
                  <span className="text-xs font-semibold text-blue-400">Save As New →</span>
                </button>
              </div>
            </div>
          ) : (
            /* Save As Custom Form */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  New Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. NIDA Front v2, Corporate Badge Back..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    Card Type
                  </label>
                  <select
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value as CardType)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="National ID">National ID</option>
                    <option value="Employee ID">Employee ID</option>
                    <option value="Student ID">Student ID</option>
                    <option value="Membership Card">Membership Card</option>
                    <option value="Access Badge">Access Badge</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Card Side
                  </label>
                  <select
                    value={side}
                    onChange={(e) => setSide(e.target.value as CardSide)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Front Side">Front Side</option>
                    <option value="Back Side">Back Side</option>
                    <option value="Full Card">Full Card</option>
                    <option value="Single Side">Single Side</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setMode('options')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => checkConflictAndSaveAs(templateName)}
                  disabled={!templateName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save New Template</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
