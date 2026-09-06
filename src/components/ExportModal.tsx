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
      const formData = useTemplateStore.getState().lastNidaFormData || {};
      renderTemplateToCanvas(currentTemplate, formData, 150).then((canvas) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E7E9EB] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E7E9EB] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#000000] text-white">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#000000]">Export Template & Card</h2>
              <p className="text-xs text-[#555555] font-medium">
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
              className="px-3 py-1.5 bg-[#000000] hover:bg-[#222222] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Merge</span>
            </button>

            <button
              onClick={() => setExportModalOpen(false)}
              className="p-1.5 text-[#555555] hover:text-[#000000] rounded-lg hover:bg-[#E7E9EB] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FFFFFF]">
          {/* Crop Before Export Accordion / Toggle Section */}
          <div className="bg-[#E7E9EB]/40 border border-[#E7E9EB] rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crop className="w-4 h-4 text-[#000000]" />
                <span className="font-bold text-sm text-[#000000]">Crop Before Export</span>
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-[#E7E9EB] text-[#000000] border border-[#dadcdc]">
                  Non-Destructive
                </span>
              </div>

              <div className="flex items-center gap-3">
                {enableCrop && (
                  <button
                    onClick={handleResetCrop}
                    className="text-xs font-bold text-[#000000] flex items-center gap-1 bg-[#E7E9EB] hover:bg-[#dadcdc] px-2.5 py-1 rounded-lg border border-[#dadcdc] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-[#000000]" />
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
                  <div className="w-9 h-5 bg-[#dadcdc] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#dadcdc] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#000000]"></div>
                </label>
              </div>
            </div>

            {enableCrop && (
              <div className="space-y-4 pt-2 border-t border-[#E7E9EB]">
                {/* Live Card Overlay Canvas Preview */}
                <div
                  ref={previewRef}
                  className="relative aspect-[1.586/1] w-full max-w-md mx-auto bg-[#FFFFFF] border border-[#E7E9EB] rounded-xl overflow-hidden flex items-center justify-center p-2 shadow-xs"
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
                    className="absolute border-2 border-dashed border-[#000000] bg-black/10 shadow-[0_0_0_9999px_rgba(255,255,255,0.7)] transition-all pointer-events-none flex items-center justify-center"
                  >
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-[#000000] text-white rounded shadow-xs">
                      Width: {crop.width.toFixed(1)} mm Height: {crop.height.toFixed(1)} mm
                    </span>
                  </div>
                </div>

                {/* Live Dimensions Header Display */}
                <div className="p-3 bg-[#FFFFFF] border border-[#E7E9EB] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#000000]" />
                    <span className="text-xs font-bold text-[#000000]">Live Output Dimensions:</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#000000] bg-[#E7E9EB] px-3 py-1 rounded-lg border border-[#dadcdc]">
                    Width: {crop.width.toFixed(1)} mm Height: {crop.height.toFixed(1)} mm
                  </span>
                </div>

                {/* Crop Boundaries Steppers / Sliders Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">
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
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7E9EB] rounded-lg text-xs font-mono font-bold text-[#000000]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">
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
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7E9EB] rounded-lg text-xs font-mono font-bold text-[#000000]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">
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
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7E9EB] rounded-lg text-xs font-mono font-bold text-[#000000]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">
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
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7E9EB] rounded-lg text-xs font-mono font-bold text-[#000000]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Mandatory JSON Template */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E9EB] hover:border-[#000000] text-left transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className="w-4 h-4 text-[#000000]" />
                  <span className="font-bold text-xs text-[#000000]">JSON Template</span>
                </div>
                <p className="text-[11px] text-[#555555] mb-3 font-medium">
                  Reusable JSON schema with millimeter measurements and layer hierarchy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadJSON(currentTemplate)}
                className="w-full py-2 bg-[#000000] hover:bg-[#222222] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                JSON
              </button>
            </div>

            {/* 2. Print-Ready PDF */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E9EB] hover:border-[#000000] text-left transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Printer className="w-4 h-4 text-[#000000]" />
                  <span className="font-bold text-xs text-[#000000]">Print PDF</span>
                </div>
                <p className="text-[11px] text-[#555555] mb-3 font-medium">
                  High-precision PDF set to physical card dimensions ({crop.width.toFixed(1)} × {crop.height.toFixed(1)} mm).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const formData = useTemplateStore.getState().lastNidaFormData || {};
                  downloadPDF(currentTemplate, formData, undefined, cropPayload);
                }}
                className="w-full py-2 bg-[#000000] hover:bg-[#222222] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                PDF
              </button>
            </div>

            {/* 3. High-Res PNG */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E9EB] hover:border-[#000000] text-left transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileImage className="w-4 h-4 text-[#000000]" />
                  <span className="font-bold text-xs text-[#000000]">PNG Image</span>
                </div>
                <p className="text-[11px] text-[#555555] mb-3 font-medium">
                  300 DPI high-resolution PNG with alpha transparency.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const formData = useTemplateStore.getState().lastNidaFormData || {};
                  downloadPNG(currentTemplate, formData, undefined, cropPayload);
                }}
                className="w-full py-2 bg-[#000000] hover:bg-[#222222] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                PNG
              </button>
            </div>

            {/* 4. High-Res JPG */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E9EB] hover:border-[#000000] text-left transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileImage className="w-4 h-4 text-[#000000]" />
                  <span className="font-bold text-xs text-[#000000]">JPG Image</span>
                </div>
                <p className="text-[11px] text-[#555555] mb-3 font-medium">
                  Compressed 300 DPI JPG image for general printing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const formData = useTemplateStore.getState().lastNidaFormData || {};
                  downloadJPG(currentTemplate, formData, undefined, cropPayload);
                }}
                className="w-full py-2 bg-[#000000] hover:bg-[#222222] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                JPG
              </button>
            </div>

            {/* 5. Vector SVG */}
            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E7E9EB] hover:border-[#000000] text-left transition-all flex flex-col justify-between col-span-full">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className="w-4 h-4 text-[#000000]" />
                  <span className="font-bold text-xs text-[#000000]">Vector SVG</span>
                </div>
                <p className="text-[11px] text-[#555555] mb-3 font-medium">
                  Scalable Vector Graphics for resolution-independent editing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadSVG(currentTemplate)}
                className="w-full py-2 bg-[#000000] hover:bg-[#222222] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                SVG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
