import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  FileCode,
  FileImage,
  Printer,
  FileJson,
  Crop,
  RotateCcw,
  Sliders,
  Layers,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import {
  downloadPNG,
  downloadJPG,
  downloadPDF,
  downloadSVG,
  downloadJSON,
  renderTemplateToCanvas,
  CropRegion,
} from '../utils/export';

export const ExportModal: React.FC = () => {
  const { isExportModalOpen, setExportModalOpen, currentTemplate, setMergeModalOpen } =
    useTemplateStore();

  const [enableCrop, setEnableCrop] = useState(false);
  const [crop, setCrop] = useState<CropRegion>({
    x: 0,
    y: 0,
    width: currentTemplate.cardWidth,
    height: currentTemplate.cardHeight,
  });

  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Sync crop when template changes
  useEffect(() => {
    if (isExportModalOpen) {
      setCrop({
        x: 0,
        y: 0,
        width: currentTemplate.cardWidth,
        height: currentTemplate.cardHeight,
      });
      setEnableCrop(false);
    }
  }, [isExportModalOpen, currentTemplate]);

  // Generate card preview image
  useEffect(() => {
    if (isExportModalOpen) {
      renderTemplateToCanvas(currentTemplate, {}, 150).then((canvas) => {
        setPreviewSrc(canvas.toDataURL('image/png'));
      });
    }
  }, [isExportModalOpen, currentTemplate]);

  if (!isExportModalOpen) return null;

  const handleResetCrop = () => {
    setCrop({
      x: 0,
      y: 0,
      width: currentTemplate.cardWidth,
      height: currentTemplate.cardHeight,
    });
  };

  const cropPayload = enableCrop ? crop : undefined;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Export Template & Card</h2>
              <p className="text-xs text-slate-400">
                Choose format, crop output boundaries, or merge 2-in-1 layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setExportModalOpen(false);
                useTemplateStore.getState().setCardGeneratorOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>2-in-1 Merge</span>
            </button>

            <button
              onClick={() => setExportModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Crop Before Export Accordion / Toggle Section */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-white">Crop Before Export</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Non-Destructive
                </span>
              </div>

              <div className="flex items-center gap-3">
                {enableCrop && (
                  <button
                    onClick={handleResetCrop}
                    className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-400" />
                    <span>Reset Crop</span>
                  </button>
                )}

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCrop}
                    onChange={(e) => setEnableCrop(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            </div>

            {enableCrop && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                {/* Live Card Overlay Canvas Preview */}
                <div
                  ref={previewRef}
                  className="relative aspect-[1.586/1] w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-inner"
                >
                  {previewSrc && (
                    <img
                      src={previewSrc}
                      alt="Card Preview"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  )}

                  {/* Crop Rect Overlay */}
                  <div
                    style={{
                      left: `${(crop.x / currentTemplate.cardWidth) * 100}%`,
                      top: `${(crop.y / currentTemplate.cardHeight) * 100}%`,
                      width: `${(crop.width / currentTemplate.cardWidth) * 100}%`,
                      height: `${(crop.height / currentTemplate.cardHeight) * 100}%`,
                    }}
                    className="absolute border-2 border-dashed border-amber-400 bg-amber-500/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all pointer-events-none flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-amber-500 text-slate-950 rounded shadow">
                      Width: {crop.width.toFixed(1)} mm Height: {crop.height.toFixed(1)} mm
                    </span>
                  </div>
                </div>

                {/* Live Dimensions Header Display */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200">Live Output Dimensions:</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    Width: {crop.width.toFixed(1)} mm Height: {crop.height.toFixed(1)} mm
                  </span>
                </div>

                {/* Crop Boundaries Steppers / Sliders Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      X Offset (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={currentTemplate.cardWidth - 10}
                      value={crop.x}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          x: Math.max(0, Math.min(Number(e.target.value), currentTemplate.cardWidth - crop.width)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Y Offset (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={currentTemplate.cardHeight - 10}
                      value={crop.y}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          y: Math.max(0, Math.min(Number(e.target.value), currentTemplate.cardHeight - crop.height)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Crop Width (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max={currentTemplate.cardWidth - crop.x}
                      value={crop.width}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          width: Math.max(10, Math.min(Number(e.target.value), currentTemplate.cardWidth - crop.x)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Crop Height (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max={currentTemplate.cardHeight - crop.y}
                      value={crop.height}
                      onChange={(e) =>
                        setCrop({
                          ...crop,
                          height: Math.max(10, Math.min(Number(e.target.value), currentTemplate.cardHeight - crop.y)),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Mandatory JSON Template */}
            <button
              onClick={() => downloadJSON(currentTemplate)}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-blue-500/50 hover:border-blue-400 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileJson className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm text-white group-hover:text-blue-400">
                  JSON Template
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Reusable JSON schema with millimeter measurements and layer hierarchy.
              </p>
              <span className="text-[11px] font-semibold text-blue-400">Download JSON →</span>
            </button>

            {/* 2. Print-Ready PDF */}
            <button
              onClick={() => downloadPDF(currentTemplate, {}, undefined, cropPayload)}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-white group-hover:text-emerald-400">
                  Print PDF
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                High-precision PDF set to physical card dimensions ({crop.width.toFixed(1)} ×{' '}
                {crop.height.toFixed(1)} mm).
              </p>
              <span className="text-[11px] font-semibold text-emerald-400">Download PDF →</span>
            </button>

            {/* 3. High-Res PNG */}
            <button
              onClick={() => downloadPNG(currentTemplate, {}, undefined, cropPayload)}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-purple-400 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileImage className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm text-white group-hover:text-purple-400">
                  PNG Image
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                300 DPI high-resolution PNG with alpha transparency.
              </p>
              <span className="text-[11px] font-semibold text-purple-400">Download PNG →</span>
            </button>

            {/* 4. High-Res JPG */}
            <button
              onClick={() => downloadJPG(currentTemplate, {}, undefined, cropPayload)}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 text-left transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileImage className="w-5 h-5 text-sky-400" />
                <span className="font-bold text-sm text-white group-hover:text-sky-400">
                  JPG Image
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Compressed 300 DPI JPG image for general printing.
              </p>
              <span className="text-[11px] font-semibold text-sky-400">Download JPG →</span>
            </button>

            {/* 5. Vector SVG */}
            <button
              onClick={() => downloadSVG(currentTemplate)}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-left transition-all group flex flex-col justify-between col-span-full"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm text-white group-hover:text-amber-400">
                  Vector SVG
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Scalable Vector Graphics for resolution-independent editing.
              </p>
              <span className="text-[11px] font-semibold text-amber-400">Download SVG →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
