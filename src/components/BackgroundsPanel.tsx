import React, { useState, useEffect } from 'react';
import { Upload, Check, Edit3, Trash2, RefreshCw, Palette } from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';

interface BackgroundsPanelProps {
  onBackgroundSelected?: () => void;
}

export const BackgroundsPanel: React.FC<BackgroundsPanelProps> = ({ onBackgroundSelected }) => {
  const {
    currentTemplate,
    updateTemplateMeta,
    uploadedBackgrounds,
    loadUploadedBackgrounds,
    addUploadedBackground,
    updateUploadedBackground,
    deleteUploadedBackground,
  } = useTemplateStore();

  const [editingBgId, setEditingBgId] = useState<string | null>(null);
  const [editingBgName, setEditingBgName] = useState('');

  useEffect(() => {
    loadUploadedBackgrounds();
  }, [loadUploadedBackgrounds]);

  const handleBgLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const orientation = img.height > img.width ? 'portrait' : 'landscape';
        await addUploadedBackground({
          name: file.name.split('.')[0] || 'Card Background',
          src,
          originalWidthPx: img.width,
          originalHeightPx: img.height,
          orientation,
        });

        // Set as active background
        updateTemplateMeta({
          background: {
            type: 'image',
            src,
            originalWidthPx: img.width,
            originalHeightPx: img.height,
          },
        });
        onBackgroundSelected?.();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleReplaceBg = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const orientation = img.height > img.width ? 'portrait' : 'landscape';
        await updateUploadedBackground(id, {
          src,
          originalWidthPx: img.width,
          originalHeightPx: img.height,
          orientation,
        });

        if (currentTemplate.background.src) {
          updateTemplateMeta({
            background: {
              type: 'image',
              src,
              originalWidthPx: img.width,
              originalHeightPx: img.height,
            },
          });
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const presetColors = [
    '#ffffff',
    '#f8fafc',
    '#f1f5f9',
    '#0f172a',
    '#1e293b',
    '#1e3a8a',
    '#065f46',
    '#831843',
    '#4c1d95',
    '#fef08a',
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* 1. Background Color Section */}
      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span>Card Background Color</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={currentTemplate.background?.color || '#ffffff'}
            onChange={(e) =>
              updateTemplateMeta({
                background: { type: 'color', color: e.target.value },
              })
            }
            className="w-9 h-9 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
          />
          <span className="font-mono text-xs text-slate-200 uppercase">
            {currentTemplate.background?.color || '#ffffff'}
          </span>
        </div>

        {/* Quick color swatches */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {presetColors.map((col) => (
            <button
              key={col}
              onClick={() =>
                updateTemplateMeta({
                  background: { type: 'color', color: col },
                })
              }
              className="w-6 h-6 rounded-md border border-slate-700/80 shadow-sm transition-transform hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: col }}
              title={col}
            >
              {currentTemplate.background?.color === col && (
                <Check
                  className={`w-3.5 h-3.5 ${
                    col === '#ffffff' || col === '#f8fafc' || col === '#fef08a'
                      ? 'text-slate-900'
                      : 'text-white'
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Uploaded Background Image Library */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
          <span className="font-semibold text-slate-300">
            Image Backgrounds ({uploadedBackgrounds.length})
          </span>
          <label className="min-h-[36px] px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleBgLibraryUpload}
              className="hidden"
            />
          </label>
        </div>

        {uploadedBackgrounds.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No image backgrounds stored yet. Upload an image template (front/back design) to use it as card canvas background.
          </div>
        ) : (
          <div className="space-y-2">
            {uploadedBackgrounds.map((bg) => {
              const isActive = currentTemplate.background.src === bg.src;
              const isEditing = editingBgId === bg.id;

              return (
                <div
                  key={bg.id}
                  className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-900/20 ring-1 ring-blue-500/40'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {/* Thumbnail & Info */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-14 h-10 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={bg.src}
                        alt={bg.name}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-xs">
                      {isEditing ? (
                        <div className="flex items-center gap-1 mb-1">
                          <input
                            type="text"
                            value={editingBgName}
                            onChange={(e) => setEditingBgName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-100 w-full focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={async () => {
                              if (editingBgName.trim()) {
                                await updateUploadedBackground(bg.id, { name: editingBgName.trim() });
                              }
                              setEditingBgId(null);
                            }}
                            className="p-1 text-emerald-400 hover:bg-slate-700 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-semibold text-slate-200 truncate">
                            {bg.name}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded border border-emerald-500/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[10px] font-mono text-slate-400">
                        {bg.originalWidthPx} × {bg.originalHeightPx} px ({bg.orientation})
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-700/50 text-xs">
                    <button
                      onClick={() => {
                        updateTemplateMeta({
                          background: {
                            type: 'image',
                            src: bg.src,
                            originalWidthPx: bg.originalWidthPx,
                            originalHeightPx: bg.originalHeightPx,
                          },
                        });
                        onBackgroundSelected?.();
                      }}
                      disabled={isActive}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                        isActive
                          ? 'bg-slate-800 text-slate-500 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{isActive ? 'In Use' : 'Apply Background'}</span>
                    </button>

                    <div className="flex items-center gap-1 text-slate-400">
                      <label
                        className="p-1.5 hover:bg-slate-700 rounded cursor-pointer hover:text-slate-200"
                        title="Replace Image File"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleReplaceBg(bg.id, e)}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={() => {
                          setEditingBgId(bg.id);
                          setEditingBgName(bg.name);
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded hover:text-slate-200"
                        title="Rename Background"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`Delete background "${bg.name}" from library?`)) {
                            await deleteUploadedBackground(bg.id);
                          }
                        }}
                        className="p-1.5 hover:bg-red-500/20 text-red-400 rounded"
                        title="Delete Background"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
