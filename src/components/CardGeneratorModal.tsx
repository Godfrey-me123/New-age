import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Download,
  Image as ImageIcon,
  CreditCard,
  Printer,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { CardData, CardTemplate } from '../types';
import {
  renderTemplateToCanvas,
  downloadPNG,
  downloadJPG,
  downloadPDF,
  download2In1PDF,
} from '../utils/export';
import { SAMPLE_TEMPLATES } from '../utils/sampleTemplates';

export const CardGeneratorModal: React.FC = () => {
  const { isCardGeneratorOpen, setCardGeneratorOpen, currentTemplate, loadSavedTemplates } =
    useTemplateStore();

  const [outputType, setOutputType] = useState<'single' | 'merge'>('single');
  const [formData, setFormData] = useState<CardData>({});
  const [detectedFields, setDetectedFields] = useState<string[]>([]);
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<string[]>([]);

  // Templates state for 2-in-1 Merge mode
  const [templateList, setTemplateList] = useState<CardTemplate[]>([]);
  const [frontTemplateId, setFrontTemplateId] = useState<string>('');
  const [backTemplateId, setBackTemplateId] = useState<string>('');

  // Render previews
  const [singlePreviewUrl, setSinglePreviewUrl] = useState<string>('');
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string>('');
  const [backPreviewUrl, setBackPreviewUrl] = useState<string>('');

  // Load saved templates list on open
  useEffect(() => {
    if (!isCardGeneratorOpen) return;

    loadSavedTemplates().then((saved) => {
      // Combine currentTemplate + saved + sample templates without duplicates
      const allMap = new Map<string, CardTemplate>();
      if (currentTemplate) allMap.set(currentTemplate.id, currentTemplate);
      saved.forEach((t) => allMap.set(t.id, t));
      SAMPLE_TEMPLATES.forEach((t) => {
        if (!allMap.has(t.id)) allMap.set(t.id, t);
      });

      const list = Array.from(allMap.values());
      setTemplateList(list);

      // Default front template: currentTemplate or first front side
      const defaultFront =
        currentTemplate || list.find((t) => t.side === 'Front Side') || list[0];
      const defaultBack =
        list.find((t) => t.id !== defaultFront.id && t.side === 'Back Side') ||
        list.find((t) => t.id !== defaultFront.id) ||
        defaultFront;

      setFrontTemplateId(defaultFront.id);
      setBackTemplateId(defaultBack.id);
    });
  }, [isCardGeneratorOpen, currentTemplate, loadSavedTemplates]);

  // Scan templates for variable placeholders
  useEffect(() => {
    if (!isCardGeneratorOpen) return;

    const fieldsSet = new Set<string>();
    const placeholdersSet = new Set<string>();

    const activeTemplates: CardTemplate[] = [];

    if (outputType === 'single') {
      if (currentTemplate) activeTemplates.push(currentTemplate);
    } else {
      const ft = templateList.find((t) => t.id === frontTemplateId) || currentTemplate;
      const bt = templateList.find((t) => t.id === backTemplateId) || currentTemplate;
      if (ft) activeTemplates.push(ft);
      if (bt && bt.id !== ft?.id) activeTemplates.push(bt);
    }

    activeTemplates.forEach((template) => {
      template.layers.forEach((layer) => {
        if (layer.type === 'text') {
          const matches = layer.text.match(/\{\{(.*?)\}\}/g);
          if (matches) {
            matches.forEach((m) => fieldsSet.add(m.replace(/[{}]/g, '').trim()));
          }
        } else if (layer.type === 'placeholder') {
          placeholdersSet.add(layer.placeholderKey);
        } else if (layer.type === 'barcode' || layer.type === 'qrcode') {
          const matches = layer.data.match(/\{\{(.*?)\}\}/g);
          if (matches) {
            matches.forEach((m) => fieldsSet.add(m.replace(/[{}]/g, '').trim()));
          }
        }
      });
    });

    const fields = Array.from(fieldsSet);
    const placeholders = Array.from(placeholdersSet);

    setDetectedFields(fields);
    setDetectedPlaceholders(placeholders);

    // Initial default mock values for detected fields
    const initData: CardData = { ...formData };
    fields.forEach((f) => {
      if (!initData[f]) {
        if (f === 'first_name') initData[f] = 'Alex';
        else if (f === 'last_name') initData[f] = 'Morgan';
        else if (f === 'id_number') initData[f] = 'ID-88492041';
        else if (f === 'dob') initData[f] = '1995-08-14';
        else if (f === 'gender') initData[f] = 'M';
        else if (f === 'nationality') initData[f] = 'USA';
        else if (f === 'card_expiry') initData[f] = '2030-12-31';
        else if (f === 'role') initData[f] = 'Senior Developer';
        else if (f === 'department') initData[f] = 'Engineering';
        else initData[f] = `SAMPLE ${f.toUpperCase()}`;
      }
    });

    setFormData(initData);
  }, [isCardGeneratorOpen, outputType, currentTemplate, frontTemplateId, backTemplateId, templateList]);

  // Render live preview canvases
  useEffect(() => {
    if (!isCardGeneratorOpen) return;

    let isMounted = true;

    if (outputType === 'single') {
      if (currentTemplate) {
        renderTemplateToCanvas(currentTemplate, formData, 200).then((canvas) => {
          if (isMounted) setSinglePreviewUrl(canvas.toDataURL('image/png'));
        });
      }
    } else {
      const ft = templateList.find((t) => t.id === frontTemplateId) || currentTemplate;
      const bt = templateList.find((t) => t.id === backTemplateId) || currentTemplate;

      if (ft) {
        renderTemplateToCanvas(ft, formData, 200).then((canvas) => {
          if (isMounted) setFrontPreviewUrl(canvas.toDataURL('image/png'));
        });
      }

      if (bt) {
        renderTemplateToCanvas(bt, formData, 200).then((canvas) => {
          if (isMounted) setBackPreviewUrl(canvas.toDataURL('image/png'));
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [
    formData,
    outputType,
    currentTemplate,
    frontTemplateId,
    backTemplateId,
    templateList,
    isCardGeneratorOpen,
  ]);

  if (!isCardGeneratorOpen) return null;

  const handleFieldChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleImageUpload = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setFormData((prev) => ({ ...prev, [key]: src }));
    };
    reader.readAsDataURL(file);
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const selectedFrontTemplate =
    templateList.find((t) => t.id === frontTemplateId) || currentTemplate;
  const selectedBackTemplate =
    templateList.find((t) => t.id === backTemplateId) || currentTemplate;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Generate ID</h2>
              <p className="text-xs text-slate-400">
                Inject custom data and export single cards or merged 2-in-1 print sheets
              </p>
            </div>
          </div>

          <button
            onClick={() => setCardGeneratorOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Output Type Selector */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Choose Output Type:
          </span>
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setOutputType('single')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                outputType === 'single'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Single Card</span>
            </button>

            <button
              onClick={() => setOutputType('merge')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                outputType === 'merge'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Front + Back (Merge 2-in-1)</span>
            </button>
          </div>
        </div>

        {/* Content Split: Options/Form vs WYSIWYG Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Template Options & Form Data */}
          <div className="space-y-6">
            {/* Merge Template Dropdowns when in Merge Mode */}
            {outputType === 'merge' && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Select Merge Templates</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Template Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">
                      Front Template
                    </label>
                    <select
                      value={frontTemplateId}
                      onChange={(e) => setFrontTemplateId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {templateList.map((tpl) => (
                        <option key={`front_${tpl.id}`} value={tpl.id}>
                          {tpl.templateName} ({tpl.side || 'Front'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Back Template Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-400">
                      Back Template
                    </label>
                    <select
                      value={backTemplateId}
                      onChange={(e) => setBackTemplateId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {templateList.map((tpl) => (
                        <option key={`back_${tpl.id}`} value={tpl.id}>
                          {tpl.templateName} ({tpl.side || 'Back'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
              Cardholder Information
            </div>

            {/* Photo & Media Upload Placeholders */}
            {detectedPlaceholders.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">Image Placeholders</div>
                <div className="grid grid-cols-2 gap-3">
                  {detectedPlaceholders.map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="block text-xs text-slate-400 capitalize">
                        {formatLabel(key)} Image
                      </label>
                      <label className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl bg-slate-800/60 cursor-pointer transition-colors text-center">
                        {formData[key] ? (
                          <img
                            src={formData[key]}
                            alt={key}
                            className="h-14 object-contain rounded mb-1"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-slate-400">
                            <ImageIcon className="w-5 h-5 text-emerald-400" />
                            <span className="text-[11px]">Upload {formatLabel(key)}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] && handleImageUpload(key, e.target.files[0])
                          }
                          className="hidden"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Text Variable Fields */}
            {detectedFields.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">Text & Code Fields</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detectedFields.map((field) => (
                    <div key={field} className="space-y-1">
                      <label className="block text-xs text-slate-400">
                        {formatLabel(field)}
                      </label>
                      <input
                        type="text"
                        value={formData[field] || ''}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No variable placeholders (like <code className="text-blue-400">&#123;&#123;first_name&#125;&#125;</code>) detected in these templates.
              </p>
            )}
          </div>

          {/* Right Column: Live WYSIWYG Preview & Export Actions */}
          <div className="flex flex-col items-center justify-between bg-slate-950 p-6 rounded-xl border border-slate-800">
            <div className="w-full flex flex-col items-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
                {outputType === 'single'
                  ? 'Live Card Preview (1:1 Physical Scale)'
                  : 'Print Sheet Layout Preview (A4 Page)'}
              </div>

              {outputType === 'single' ? (
                /* Single Card Preview */
                singlePreviewUrl ? (
                  <div className="flex justify-center my-4">
                    <img
                      src={singlePreviewUrl}
                      alt="Single Card Preview"
                      className="max-w-full max-h-64 rounded-lg shadow-2xl border border-slate-700 object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
                    Rendering card preview...
                  </div>
                )
              ) : (
                /* Front + Back Merge 2-in-1 Preview (Vertical Stack matching A4 PDF) */
                <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col items-center space-y-4">
                  {/* Front Card Box */}
                  <div className="w-full bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 flex flex-col items-center">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <span>+---------------+</span>
                      <span className="text-slate-300">FRONT CARD</span>
                      <span>+---------------+</span>
                    </div>
                    {frontPreviewUrl ? (
                      <img
                        src={frontPreviewUrl}
                        alt="Front Card Preview"
                        className="w-full max-h-32 object-contain rounded border border-slate-700/60 shadow-md"
                      />
                    ) : (
                      <div className="h-20 flex items-center justify-center text-[10px] text-slate-500">
                        Rendering Front...
                      </div>
                    )}
                  </div>

                  {/* Connector arrow / gap indicator */}
                  <div className="text-slate-600 text-[10px] uppercase font-mono tracking-wider">
                    ↓ 12mm Print Gap ↓
                  </div>

                  {/* Back Card Box */}
                  <div className="w-full bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 flex flex-col items-center">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <span>+---------------+</span>
                      <span className="text-slate-300">BACK CARD</span>
                      <span>+---------------+</span>
                    </div>
                    {backPreviewUrl ? (
                      <img
                        src={backPreviewUrl}
                        alt="Back Card Preview"
                        className="w-full max-h-32 object-contain rounded border border-slate-700/60 shadow-md"
                      />
                    ) : (
                      <div className="h-20 flex items-center justify-center text-[10px] text-slate-500">
                        Rendering Back...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Export Actions */}
            <div className="w-full pt-6 border-t border-slate-800 space-y-2 mt-4">
              <div className="text-xs font-semibold text-slate-300 text-center mb-3">
                Export Generated Output
              </div>

              {outputType === 'single' ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => downloadPNG(currentTemplate, formData)}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>PNG</span>
                  </button>
                  <button
                    onClick={() => downloadJPG(currentTemplate, formData)}
                    className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>JPG</span>
                  </button>
                  <button
                    onClick={() => downloadPDF(currentTemplate, formData)}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    download2In1PDF(selectedFrontTemplate, selectedBackTemplate, formData)
                  }
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Export 2-in-1 Print PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
