import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layers,
  CreditCard,
  ArrowRight,
  FolderOpen,
  Edit2,
  Trash2,
  Copy,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { CardTemplate } from '../types';
import { SAMPLE_TEMPLATES } from '../utils/sampleTemplates';
import { TemplateBadge } from './TemplateBadge';
import { renderTemplateToCanvas } from '../utils/export';

export const UploadScreen: React.FC = () => {
  const {
    createNewTemplate,
    loadTemplate,
    addUploadedBackground,
    loadSavedTemplates,
    deleteSavedTemplate,
    saveCurrentTemplate,
    setActiveScreen,
    setCardGeneratorOpen,
  } = useTemplateStore();

  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; name: string } | null>(null);
  const [customName, setCustomName] = useState('My Custom ID Card');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved templates state
  const [savedTemplates, setSavedTemplates] = useState<CardTemplate[]>([]);
  const [templatePreviews, setTemplatePreviews] = useState<Record<string, string>>({});

  const fetchSaved = async () => {
    const list = await loadSavedTemplates();
    setSavedTemplates(list);

    // Generate preview thumbnails for saved templates
    const previewMap: Record<string, string> = {};
    for (const tpl of list) {
      try {
        const canvas = await renderTemplateToCanvas(tpl, {}, 100);
        previewMap[tpl.id] = canvas.toDataURL('image/png');
      } catch {
        // Fallback silently
      }
    }
    setTemplatePreviews(previewMap);
  };

  useEffect(() => {
    fetchSaved();
  }, [loadSavedTemplates]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setPreviewImage(src);
        setImageMeta({
          width: img.width,
          height: img.height,
          name: file.name.replace(/\.[^/.]+$/, ''),
        });
        setCustomName(file.name.replace(/\.[^/.]+$/, '') + ' Template');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleCreateTemplate = async () => {
    if (previewImage && imageMeta) {
      const isPortrait = imageMeta.height > imageMeta.width;
      await addUploadedBackground({
        name: imageMeta.name || 'Uploaded Background',
        src: previewImage,
        originalWidthPx: imageMeta.width,
        originalHeightPx: imageMeta.height,
        orientation: isPortrait ? 'portrait' : 'landscape',
      });

      createNewTemplate(
        {
          type: 'image',
          src: previewImage,
          originalWidthPx: imageMeta.width,
          originalHeightPx: imageMeta.height,
        },
        customName || 'Custom ID Template'
      );
    } else {
      // Create with clean default background
      createNewTemplate(
        {
          type: 'color',
          color: '#ffffff',
        },
        'Blank ID Template'
      );
    }
  };

  const handleOpenEdit = (tpl: CardTemplate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    loadTemplate(tpl);
    setActiveScreen('editor');
  };

  const handleUseInGenerator = (tpl: CardTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    loadTemplate(tpl);
    setCardGeneratorOpen(true);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved template?')) {
      await deleteSavedTemplate(id);
      await fetchSaved();
    }
  };

  const handleDuplicateTemplate = async (tpl: CardTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy: CardTemplate = {
      ...JSON.parse(JSON.stringify(tpl)),
      id: 'template_' + Date.now(),
      templateName: `${tpl.templateName} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    loadTemplate(copy);
    await saveCurrentTemplate();
    await fetchSaved();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-blue-500 selection:text-white">
      {/* Container */}
      <div className="w-full max-w-4xl bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-10 text-center relative">
        {/* Brand Header & Top Actions */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700/60">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-semibold tracking-wide">
            <CreditCard className="w-4 h-4" />
            <span>ID TEMPLATE STUDIO</span>
          </div>

          {/* Saved Templates Section Button on First Screen */}
          <button
            onClick={() => setActiveScreen('templates')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-950 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md group"
          >
            <FolderOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Saved Templates</span>
            {savedTemplates.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                {savedTemplates.length}
              </span>
            )}
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Upload Card Background
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-md mx-auto">
          Start designing a reusable ID card template. Automatic orientation and dimension detection.
        </p>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 transition-all cursor-pointer flex flex-col items-center justify-center ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
              : previewImage
              ? 'border-emerald-500/50 bg-slate-900/50'
              : 'border-slate-600 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {previewImage ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative group max-w-xs max-h-48 overflow-hidden rounded-lg border border-slate-700 shadow-lg">
                <img src={previewImage} alt="Background preview" className="object-contain max-h-44" />
              </div>
              <div className="text-xs text-slate-300 font-mono bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700">
                Auto Detected: {imageMeta?.width} × {imageMeta?.height} px (
                {imageMeta && imageMeta.height > imageMeta.width ? 'Portrait' : 'Landscape'})
              </div>
              <p className="text-xs text-blue-400 hover:underline">Click or drop to replace image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 rounded-full bg-slate-800 text-blue-400 border border-slate-700">
                <Upload className="w-8 h-8" />
              </div>
              <div className="text-sm sm:text-base font-medium text-slate-200">
                Drag Image Here
              </div>
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">OR</div>
              <button
                type="button"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg border border-slate-600 transition-colors"
              >
                Choose Image
              </button>
              <p className="text-xs text-slate-400 mt-2">
                Supported formats: <span className="text-slate-300 font-medium">PNG, JPG, WEBP</span>
              </p>
            </div>
          )}
        </div>

        {/* Custom Template Name Input */}
        {previewImage && (
          <div className="mt-6 text-left max-w-md mx-auto">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
              Template Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="e.g. National ID Front"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleCreateTemplate}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>Create Template</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Saved Templates Section on First Screen */}
        {savedTemplates.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-700/60 text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-200 text-sm uppercase font-bold tracking-wider">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Your Saved Templates ({savedTemplates.length})</span>
              </div>
              <button
                onClick={() => setActiveScreen('templates')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>View All Saved Templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTemplates.slice(0, 6).map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleOpenEdit(tpl)}
                  className="group relative bg-slate-900/80 border border-slate-700/80 hover:border-emerald-500/80 rounded-xl p-4 transition-all hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Preview */}
                    <div className="w-full h-28 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden mb-3 p-2 relative group-hover:border-slate-700 transition-colors">
                      {templatePreviews[tpl.id] ? (
                        <img
                          src={templatePreviews[tpl.id]}
                          alt={tpl.templateName}
                          className="max-h-full max-w-full object-contain rounded shadow"
                        />
                      ) : (
                        <div className="text-slate-600 text-xs font-mono">Loading Preview...</div>
                      )}
                    </div>

                    {/* Template Meta */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {tpl.templateName}
                      </h3>
                    </div>

                    <p className="text-[11px] text-slate-400 mb-2">
                      {tpl.cardWidth} × {tpl.cardHeight} mm | {tpl.layers.length} Layers
                    </p>

                    <TemplateBadge cardType={tpl.cardType} side={tpl.side} size="sm" />
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleOpenEdit(tpl, e)}
                      className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      title="Open and edit template in editor section"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={(e) => handleUseInGenerator(tpl, e)}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                      title="Use template in ID Generator"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDuplicateTemplate(tpl, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Duplicate Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pre-made Samples Section */}
        <div className="mt-12 pt-8 border-t border-slate-700/60">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs uppercase font-semibold tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Or Start with Pre-built Professional Templates</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {SAMPLE_TEMPLATES.map((sample) => (
              <div
                key={sample.id}
                onClick={() => loadTemplate(sample)}
                className="group p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/70 hover:border-blue-500/70 hover:bg-slate-800/80 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {sample.templateName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {sample.cardWidth} × {sample.cardHeight} mm ({sample.orientation})
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
