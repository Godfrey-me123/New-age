import React, { useState } from 'react';
import {
  Sliders,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Square,
  Barcode as BarcodeIcon,
  QrCode,
  Layers,
  Ruler,
  Trash2,
  Lock,
  Brackets,
  UserCheck,
  Plus,
  Minus,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  ArrowUpDown,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Save,
  Sparkles,
  Download,
  Check,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { convertFromMm, convertToMm } from '../utils/units';
import {
  FONT_LIBRARY,
  FontScope,
  getAvailableWeightsForFont,
  getClosestValidWeight,
} from '../utils/fonts';
import { FontChangeModal } from './FontChangeModal';
import { WeightChangeModal } from './WeightChangeModal';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  badge,
  isOpen,
  onToggle,
  children,
}) => (
  <div className="border border-[#E7E9EB] rounded-xl bg-[#FFFFFF] overflow-hidden transition-all shadow-xs">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-[#E7E9EB] transition-colors text-left select-none cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <span className="text-[#000000]">{icon}</span>
        <span className="text-xs font-bold text-[#000000]">{title}</span>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E7E9EB] text-[#000000] font-mono">
            {badge}
          </span>
        )}
      </div>
      {isOpen ? (
        <ChevronUp className="w-4 h-4 text-[#000000]" />
      ) : (
        <ChevronDown className="w-4 h-4 text-[#000000]" />
      )}
    </button>
    {isOpen && <div className="p-3 border-t border-[#E7E9EB] space-y-3">{children}</div>}
  </div>
);

interface RightPanelProps {
  isMobileDrawer?: boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({ isMobileDrawer = false }) => {
  const {
    currentTemplate,
    updateTemplateMeta,
    selectedLayerIds,
    updateLayer,
    applyFontToLayers,
    applyWeightToLayers,
    activeUnit,
    deleteSelectedLayers,
    alignSelectedLayers,
    distributeSelectedLayers,
    saveCurrentTemplate,
    setCardGeneratorOpen,
    setExportModalOpen,
    setActiveMobileSheet,
  } = useTemplateStore();

  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleSave = async () => {
    await saveCurrentTemplate();
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [pendingFont, setPendingFont] = useState('Arial Black');
  const [pendingLayerId, setPendingLayerId] = useState<string | undefined>(undefined);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [pendingWeight, setPendingWeight] = useState(700);
  const [pendingWeightLayerId, setPendingWeightLayerId] = useState<string | undefined>(undefined);

  // Collapsible section open states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    textProps: true,
    positionSize: true,
    appearance: false,
    cardSettings: true,
    alignTools: true,
    multiLayers: true,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const selectedLayers = currentTemplate.layers.filter((l) => selectedLayerIds.includes(l.id));
  const selectedLayer = selectedLayers.length === 1 ? selectedLayers[0] : null;

  const handleFontSelectRequest = (font: string, targetLayerId?: string) => {
    setPendingFont(font);
    setPendingLayerId(targetLayerId);
    setIsFontModalOpen(true);
  };

  const handleApplyFont = (scope: FontScope) => {
    applyFontToLayers(pendingFont, scope, pendingLayerId);
  };

  const handleWeightSelectRequest = (weight: number, targetLayerId?: string) => {
    setPendingWeight(weight);
    setPendingWeightLayerId(targetLayerId);
    setIsWeightModalOpen(true);
  };

  const handleApplyWeight = (scope: FontScope) => {
    applyWeightToLayers(pendingWeight, scope, pendingWeightLayerId);
  };

  const variableOptions = [
    { label: 'First Name', val: '{{first_name}}' },
    { label: 'Last Name', val: '{{last_name}}' },
    { label: 'ID Number', val: '{{id_number}}' },
    { label: 'Date of Birth', val: '{{dob}}' },
    { label: 'Gender / Sex', val: '{{gender}}' },
    { label: 'Nationality', val: '{{nationality}}' },
    { label: 'Expiry Date', val: '{{card_expiry}}' },
    { label: 'Department / Role', val: '{{role}}' },
  ];

  // Quick actions header for Save, Generate, and Export
  const quickActionsHeader = (
    <div className="flex items-center gap-1.5 p-1.5 bg-[#E7E9EB] rounded-xl border border-[#dadcdc] shrink-0 mb-3 shadow-xs">
      <button
        onClick={handleSave}
        className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border shadow-xs cursor-pointer ${
          isSavedNotice
            ? 'bg-[#CEE9B9] border-[#CEE9B9] text-[#000000] font-bold'
            : 'bg-[#FFFFFF] hover:bg-[#dadcdc] border-[#dadcdc] text-[#000000]'
        }`}
        title="Save Template"
      >
        <Save className="w-3.5 h-3.5 text-[#000000] shrink-0" />
        <span>{isSavedNotice ? 'Saved!' : 'Save'}</span>
      </button>

      <button
        onClick={() => setCardGeneratorOpen(true)}
        className="flex-1 py-1.5 px-2 bg-[#CEE9B9] hover:opacity-90 text-[#000000] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        title="Generate Cards from CSV / Records"
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#000000]" />
        <span>Generate</span>
      </button>

      <button
        onClick={() => setExportModalOpen(true)}
        className="flex-1 py-1.5 px-2 bg-[#ECA6FC] hover:opacity-90 text-[#000000] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        title="Export Card as High-Res Image or Print PDF"
      >
        <Download className="w-3.5 h-3.5 shrink-0 text-[#000000]" />
        <span>Export</span>
      </button>

      {isMobileDrawer && (
        <button
          onClick={() => setActiveMobileSheet(null)}
          className="py-1.5 px-2.5 bg-[#FFFFFF] hover:bg-[#dadcdc] border border-[#dadcdc] text-[#000000] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0 cursor-pointer"
          title="Done - Close Editor to View Canvas"
        >
          <Check className="w-3.5 h-3.5 text-[#000000] shrink-0" />
          <span>Done</span>
        </button>
      )}
    </div>
  );

  // Helper container wrapper
  const renderPanelWrapper = (content: React.ReactNode) => {
    if (isMobileDrawer) {
      return (
        <div className="space-y-3 pb-6 bg-[#FFFFFF]">
          {quickActionsHeader}
          {content}
          <FontChangeModal
            isOpen={isFontModalOpen}
            pendingFont={pendingFont}
            onClose={() => setIsFontModalOpen(false)}
            onApply={handleApplyFont}
            selectedLayerName={selectedLayer?.name || (selectedLayer as any)?.text}
            textLayers={currentTemplate.layers.filter((l) => l.type === 'text')}
          />
          <WeightChangeModal
            isOpen={isWeightModalOpen}
            pendingWeight={pendingWeight}
            onClose={() => setIsWeightModalOpen(false)}
            onApply={handleApplyWeight}
            selectedLayerName={selectedLayer?.name || (selectedLayer as any)?.text}
            textLayers={currentTemplate.layers.filter((l) => l.type === 'text')}
          />
        </div>
      );
    }

    return (
      <aside className="hidden lg:flex lg:w-80 bg-[#FFFFFF] border-l border-[#E7E9EB] p-3.5 flex-col h-[calc(100vh-3.5rem)] select-none text-[#000000] overflow-y-auto shrink-0">
        {quickActionsHeader}
        {content}
        <FontChangeModal
          isOpen={isFontModalOpen}
          pendingFont={pendingFont}
          onClose={() => setIsFontModalOpen(false)}
          onApply={handleApplyFont}
          selectedLayerName={selectedLayer?.name || (selectedLayer as any)?.text}
          textLayers={currentTemplate.layers.filter((l) => l.type === 'text')}
        />
        <WeightChangeModal
          isOpen={isWeightModalOpen}
          pendingWeight={pendingWeight}
          onClose={() => setIsWeightModalOpen(false)}
          onApply={handleApplyWeight}
          selectedLayerName={selectedLayer?.name || (selectedLayer as any)?.text}
          textLayers={currentTemplate.layers.filter((l) => l.type === 'text')}
        />
      </aside>
    );
  };

  // Case 1: No Layer Selected -> Card Settings & Global Replacers
  if (selectedLayers.length === 0) {
    const cardContent = (
      <>
        <div className="flex items-center gap-2 pb-3 border-b border-[#E7E9EB] font-bold text-xs uppercase text-[#000000] tracking-wider">
          <Sliders className="w-4 h-4 text-[#000000]" />
          <span>Card Settings & Global Font</span>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          {/* Collapsible Card Dimensions & Color */}
          <CollapsibleSection
            id="cardSettings"
            title="Card Canvas & Dimensions"
            icon={<Square className="w-3.5 h-3.5 text-[#000000]" />}
            badge={`${currentTemplate.cardWidth} × ${currentTemplate.cardHeight} mm`}
            isOpen={openSections.cardSettings}
            onToggle={() => toggleSection('cardSettings')}
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">
                  Card Width (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentTemplate.cardWidth}
                  onChange={(e) =>
                    updateTemplateMeta({ cardWidth: parseFloat(e.target.value) || 85.6 })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-[#000000] font-mono text-xs focus:outline-none focus:border-[#000000]"
                />
              </div>

              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">
                  Card Height (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={currentTemplate.cardHeight}
                  onChange={(e) =>
                    updateTemplateMeta({ cardHeight: parseFloat(e.target.value) || 53.98 })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-[#000000] font-mono text-xs focus:outline-none focus:border-[#000000]"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-[#000000] font-semibold mb-1 text-[11px]">
                Canvas Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentTemplate.background?.color || '#ffffff'}
                  onChange={(e) =>
                    updateTemplateMeta({
                      background: {
                        ...currentTemplate.background,
                        type: 'color',
                        color: e.target.value,
                      },
                    })
                  }
                  className="w-8 h-8 rounded-lg border border-[#dadcdc] cursor-pointer bg-transparent"
                />
                <span className="font-mono text-[#000000] text-xs uppercase font-bold">
                  {currentTemplate.background?.color || '#ffffff'}
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* Template Font Replacer */}
          <CollapsibleSection
            id="templateFont"
            title="Batch Font & Boldness"
            icon={<Type className="w-3.5 h-3.5 text-[#000000]" />}
            badge={`${currentTemplate.layers.filter((l) => l.type === 'text').length} text layers`}
            isOpen={true}
            onToggle={() => {}}
          >
            <p className="text-[11px] text-[#444444] leading-snug">
              Batch update all text objects (First Name, Last Name, ID Number, DOB, Labels) to any
              font family or weight in one action.
            </p>

            <div>
              <label className="block text-[#000000] font-semibold mb-1 text-[11px]">
                Change Template Font Family
              </label>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleFontSelectRequest(e.target.value, undefined);
                    e.target.value = '';
                  }
                }}
                className="w-full px-2.5 py-2 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-xs font-semibold text-[#000000] cursor-pointer focus:outline-none focus:border-[#000000]"
              >
                <option value="" disabled>
                  Select Template Font...
                </option>
                {FONT_LIBRARY.map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[#000000] font-semibold mb-1 text-[11px]">
                Change Template Font Weight
              </label>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const weightVal = parseInt(e.target.value, 10);
                    if (!isNaN(weightVal)) {
                      handleWeightSelectRequest(weightVal, undefined);
                    }
                    e.target.value = '';
                  }
                }}
                className="w-full px-2.5 py-2 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-xs font-semibold text-[#000000] cursor-pointer focus:outline-none focus:border-[#000000]"
              >
                <option value="" disabled>
                  Select Template Weight...
                </option>
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi Bold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800)</option>
                <option value="900">Black (900)</option>
              </select>
            </div>
          </CollapsibleSection>
        </div>
      </>
    );
    return renderPanelWrapper(cardContent);
  }

  // Case 2: Multiple Layers Selected
  if (selectedLayers.length > 1) {
    const multiContent = (
      <>
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E9EB]">
          <div className="flex items-center gap-2 font-bold text-xs uppercase text-[#000000] tracking-wider">
            <Layers className="w-4 h-4 text-[#000000]" />
            <span>Multiple Layers ({selectedLayers.length})</span>
          </div>
          <button
            onClick={deleteSelectedLayers}
            className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
            title="Delete Selected Layers"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 space-y-3 text-xs">
          {/* Alignment Tools */}
          <CollapsibleSection
            id="multiAlign"
            title="Align Selection"
            icon={<AlignStartVertical className="w-3.5 h-3.5 text-[#000000]" />}
            isOpen={openSections.alignTools}
            onToggle={() => toggleSection('alignTools')}
          >
            <div className="grid grid-cols-3 gap-1 bg-[#E7E9EB] p-1.5 rounded-lg border border-[#dadcdc]">
              <button
                onClick={() => alignSelectedLayers('left')}
                className="p-2 hover:bg-[#dadcdc] rounded flex flex-col items-center gap-1 text-[#000000] cursor-pointer"
                title="Align Left"
              >
                <AlignStartVertical className="w-4 h-4" />
                <span className="text-[9px]">Left</span>
              </button>
              <button
                onClick={() => alignSelectedLayers('center')}
                className="p-2 hover:bg-[#dadcdc] rounded flex flex-col items-center gap-1 text-[#000000] cursor-pointer"
                title="Align Center"
              >
                <AlignCenterVertical className="w-4 h-4" />
                <span className="text-[9px]">Center</span>
              </button>
              <button
                onClick={() => alignSelectedLayers('right')}
                className="p-2 hover:bg-[#dadcdc] rounded flex flex-col items-center gap-1 text-[#000000] cursor-pointer"
                title="Align Right"
              >
                <AlignEndVertical className="w-4 h-4" />
                <span className="text-[9px]">Right</span>
              </button>

              <button
                onClick={() => alignSelectedLayers('top')}
                className="p-2 hover:bg-[#dadcdc] rounded flex flex-col items-center gap-1 text-[#000000] cursor-pointer"
                title="Align Top"
              >
                <AlignStartHorizontal className="w-4 h-4" />
                <span className="text-[9px]">Top</span>
              </button>
              <button
                onClick={() => alignSelectedLayers('middle')}
                className="p-2 hover:bg-[#dadcdc] rounded flex flex-col items-center gap-1 text-[#000000] cursor-pointer"
                title="Align Middle"
              >
                <AlignCenterHorizontal className="w-4 h-4" />
                <span className="text-[9px]">Middle</span>
              </button>
              <button
                onClick={() => alignSelectedLayers('bottom')}
                className="p-2 hover:bg-[#dadcdc] rounded flex flex-col items-center gap-1 text-[#000000] cursor-pointer"
                title="Align Bottom"
              >
                <AlignEndHorizontal className="w-4 h-4" />
                <span className="text-[9px]">Bottom</span>
              </button>
            </div>
          </CollapsibleSection>

          {/* Equal Spacing */}
          <CollapsibleSection
            id="multiSpacing"
            title="Distribute & Spacing"
            icon={<ArrowLeftRight className="w-3.5 h-3.5 text-[#000000]" />}
            isOpen={true}
            onToggle={() => {}}
          >
            <div className="grid grid-cols-2 gap-1.5 bg-[#E7E9EB] p-1.5 rounded-lg border border-[#dadcdc]">
              <button
                onClick={() => distributeSelectedLayers('horizontal')}
                className="p-2 hover:bg-[#dadcdc] rounded flex items-center justify-center gap-2 text-[#000000] cursor-pointer"
                title="Equal Horizontal Spacing"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#000000]" />
                <span className="text-[10px] font-medium">Horizontal</span>
              </button>
              <button
                onClick={() => distributeSelectedLayers('vertical')}
                className="p-2 hover:bg-[#dadcdc] rounded flex items-center justify-center gap-2 text-[#000000] cursor-pointer"
                title="Equal Vertical Spacing"
              >
                <ArrowUpDown className="w-4 h-4 text-[#000000]" />
                <span className="text-[10px] font-medium">Vertical</span>
              </button>
            </div>
          </CollapsibleSection>
        </div>
      </>
    );
    return renderPanelWrapper(multiContent);
  }

  // Case 3: Single Layer Selected
  if (!selectedLayer) return null;

  // Geometry conversions
  const xDisplay = Number(convertFromMm(selectedLayer.x, activeUnit).toFixed(2));
  const yDisplay = Number(convertFromMm(selectedLayer.y, activeUnit).toFixed(2));
  const wDisplay = Number(convertFromMm(selectedLayer.width, activeUnit).toFixed(2));
  const hDisplay = Number(convertFromMm(selectedLayer.height, activeUnit).toFixed(2));

  const stepSize =
    activeUnit === 'mm' ? 0.5 : activeUnit === 'cm' ? 0.05 : activeUnit === 'in' ? 0.02 : 2;

  const handlePositionChange = (field: 'x' | 'y' | 'width' | 'height', val: number) => {
    const valInMm = convertToMm(val, activeUnit);
    updateLayer(selectedLayer.id, { [field]: Math.max(0.1, valInMm) });
  };

  const singleContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E7E9EB] shrink-0">
        <div className="flex items-center gap-2 font-bold text-xs uppercase text-[#000000] tracking-wider truncate">
          <Sliders className="w-4 h-4 text-[#000000] shrink-0" />
          <span className="truncate">{selectedLayer.name}</span>
        </div>
        <button
          onClick={deleteSelectedLayers}
          className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
          title="Delete Layer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-3 text-xs">
        {/* Layer Title Input */}
        <div>
          <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Layer Title</label>
          <input
            type="text"
            value={selectedLayer.name}
            onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-[#000000] text-xs focus:outline-none focus:border-[#000000]"
          />
        </div>

        {/* 1. COMPACT UNIFIED TEXT PROPERTIES SECTION (User requirement) */}
        {selectedLayer.type === 'text' && (
          <CollapsibleSection
            id="textProps"
            title="Text Properties"
            icon={<Type className="w-3.5 h-3.5 text-[#000000]" />}
            badge={selectedLayer.fontFamily || 'Helvetica'}
            isOpen={openSections.textProps}
            onToggle={() => toggleSection('textProps')}
          >
            {/* Quick Variable Picker & Text Content */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#000000]">Content / Variable</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      updateLayer(selectedLayer.id, {
                        text: (selectedLayer.text ? selectedLayer.text + ' ' : '') + e.target.value,
                      });
                      e.target.value = '';
                    }
                  }}
                  className="px-2 py-0.5 bg-[#E7E9EB] border border-[#dadcdc] rounded text-[11px] text-[#000000] font-semibold cursor-pointer"
                >
                  <option value="">+ Insert Variable...</option>
                  {variableOptions.map((v) => (
                    <option key={v.val} value={v.val}>
                      {v.label} ({v.val})
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                rows={2}
                value={selectedLayer.text}
                onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-[#000000] font-mono text-xs focus:outline-none focus:border-[#000000]"
              />
            </div>

            {/* Font Family & Font Size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">
                  Font Family
                </label>
                <select
                  value={selectedLayer.fontFamily || 'Helvetica'}
                  onChange={(e) => handleFontSelectRequest(e.target.value, selectedLayer.id)}
                  className="w-full px-2 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-xs cursor-pointer text-[#000000] font-semibold focus:outline-none focus:border-[#000000]"
                >
                  {FONT_LIBRARY.map((f) => (
                    <option key={f} value={f} style={{ fontFamily: f }}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">
                  Size ({activeUnit})
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateLayer(selectedLayer.id, {
                        fontSize: Math.max(1, selectedLayer.fontSize - 0.2),
                      })
                    }
                    className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    step="0.2"
                    value={selectedLayer.fontSize}
                    onChange={(e) =>
                      updateLayer(selectedLayer.id, {
                        fontSize: parseFloat(e.target.value) || 2,
                      })
                    }
                    className="w-full px-1 py-1 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-center text-[#000000] focus:outline-none focus:border-[#000000]"
                  />
                  <button
                    onClick={() =>
                      updateLayer(selectedLayer.id, {
                        fontSize: selectedLayer.fontSize + 0.2,
                      })
                    }
                    className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Font Weight Control directly below Font Family (Exact Available Weights only) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#000000] font-semibold text-[11px]">
                  Font Weight / Boldness
                </label>
                <span className="text-[10px] text-[#000000] font-mono font-bold">
                  {selectedLayer.fontWeight ?? (selectedLayer.fontStyle?.includes('bold') ? 700 : 400)}
                </span>
              </div>
              <select
                value={getClosestValidWeight(
                  selectedLayer.fontFamily || 'Helvetica',
                  selectedLayer.fontWeight ?? (selectedLayer.fontStyle?.includes('bold') ? 700 : 400)
                )}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    handleWeightSelectRequest(val, selectedLayer.id);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg text-xs cursor-pointer text-[#000000] font-semibold focus:outline-none focus:border-[#000000]"
              >
                {getAvailableWeightsForFont(selectedLayer.fontFamily || 'Helvetica').map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color & Quick Formatting & Alignment */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Color Picker with hex display */}
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={selectedLayer.color || '#000000'}
                  onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                  className="w-7 h-7 rounded border border-[#dadcdc] cursor-pointer bg-transparent"
                />
                <span className="font-mono text-[10px] text-[#000000] font-bold uppercase">
                  {selectedLayer.color || '#000000'}
                </span>
              </div>

              {/* Quick Bold (B), Italic (I), Underline (U) */}
              <div className="flex items-center bg-[#E7E9EB] rounded-lg p-0.5 border border-[#dadcdc]">
                <button
                  onClick={() => {
                    const availableWeights = getAvailableWeightsForFont(
                      selectedLayer.fontFamily || 'Helvetica'
                    );
                    const currentWeight =
                      selectedLayer.fontWeight ??
                      (selectedLayer.fontStyle?.includes('bold') ? 700 : 400);
                    const isBoldNow = currentWeight >= 600;

                    let targetWeight: number;
                    if (isBoldNow) {
                      const minWeight = Math.min(...availableWeights.map((w) => w.value));
                      targetWeight = availableWeights.some((w) => w.value === 400)
                        ? 400
                        : minWeight;
                    } else {
                      const maxWeight = Math.max(...availableWeights.map((w) => w.value));
                      targetWeight = availableWeights.some((w) => w.value === 700)
                        ? 700
                        : maxWeight;
                    }

                    const isItalic = selectedLayer.fontStyle?.includes('italic');
                    const newIsBold = targetWeight >= 600;
                    let newStyle = 'normal';
                    if (newIsBold && isItalic) newStyle = 'bold italic';
                    else if (newIsBold) newStyle = 'bold';
                    else if (isItalic) newStyle = 'italic';

                    updateLayer(selectedLayer.id, {
                      fontWeight: targetWeight,
                      fontStyle: newStyle,
                    });
                  }}
                  title="Quick Bold Toggle"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    (selectedLayer.fontWeight ??
                      (selectedLayer.fontStyle?.includes('bold') ? 700 : 400)) >= 600
                      ? 'bg-[#000000] text-[#FFFFFF] font-bold'
                      : 'text-[#000000] hover:bg-[#dadcdc]'
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    const isItalic = selectedLayer.fontStyle?.includes('italic');
                    const isBold =
                      selectedLayer.fontStyle?.includes('bold') ||
                      (selectedLayer.fontWeight ?? 400) >= 600;
                    let newStyle = 'normal';
                    if (isBold && !isItalic) newStyle = 'bold italic';
                    else if (!isBold && !isItalic) newStyle = 'italic';
                    else if (isBold && isItalic) newStyle = 'bold';
                    updateLayer(selectedLayer.id, { fontStyle: newStyle });
                  }}
                  title="Italic"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    selectedLayer.fontStyle?.includes('italic')
                      ? 'bg-[#000000] text-[#FFFFFF]'
                      : 'text-[#000000] hover:bg-[#dadcdc]'
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() =>
                    updateLayer(selectedLayer.id, {
                      textDecoration:
                        selectedLayer.textDecoration === 'underline' ? 'none' : 'underline',
                    })
                  }
                  title="Underline"
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    selectedLayer.textDecoration === 'underline'
                      ? 'bg-[#000000] text-[#FFFFFF]'
                      : 'text-[#000000] hover:bg-[#dadcdc]'
                  }`}
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Alignment */}
              <div className="flex items-center bg-[#E7E9EB] rounded-lg p-0.5 border border-[#dadcdc]">
                <button
                  onClick={() => updateLayer(selectedLayer.id, { align: 'left' })}
                  className={`p-1.5 rounded cursor-pointer ${
                    selectedLayer.align === 'left'
                      ? 'bg-[#000000] text-[#FFFFFF]'
                      : 'text-[#000000] hover:bg-[#dadcdc]'
                  }`}
                  title="Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateLayer(selectedLayer.id, { align: 'center' })}
                  className={`p-1.5 rounded cursor-pointer ${
                    selectedLayer.align === 'center'
                      ? 'bg-[#000000] text-[#FFFFFF]'
                      : 'text-[#000000] hover:bg-[#dadcdc]'
                  }`}
                  title="Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateLayer(selectedLayer.id, { align: 'right' })}
                  className={`p-1.5 rounded cursor-pointer ${
                    selectedLayer.align === 'right'
                      ? 'bg-[#000000] text-[#FFFFFF]'
                      : 'text-[#000000] hover:bg-[#dadcdc]'
                  }`}
                  title="Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* 2. POSITION & SIZE (Collapsible) */}
        <CollapsibleSection
          id="positionSize"
          title="Position & Size"
          icon={<Ruler className="w-3.5 h-3.5 text-[#000000]" />}
          badge={`${wDisplay} × ${hDisplay} ${activeUnit}`}
          isOpen={openSections.positionSize}
          onToggle={() => toggleSection('positionSize')}
        >
          {/* Alignment Tools (Single layer relative to card canvas) */}
          <div className="space-y-1">
            <div className="text-[#000000] font-semibold text-[10px]">Align to Card Canvas</div>
            <div className="grid grid-cols-6 gap-1 bg-[#E7E9EB] p-1 rounded-lg border border-[#dadcdc] text-[#000000]">
              <button
                onClick={() => alignSelectedLayers('left')}
                className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center cursor-pointer"
                title="Align Left"
              >
                <AlignStartVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedLayers('center')}
                className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center cursor-pointer"
                title="Align Center"
              >
                <AlignCenterVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedLayers('right')}
                className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center cursor-pointer"
                title="Align Right"
              >
                <AlignEndVertical className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedLayers('top')}
                className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center cursor-pointer"
                title="Align Top"
              >
                <AlignStartHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedLayers('middle')}
                className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center cursor-pointer"
                title="Align Middle"
              >
                <AlignCenterHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => alignSelectedLayers('bottom')}
                className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center cursor-pointer"
                title="Align Bottom"
              >
                <AlignEndHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* X & Y */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[#000000] font-semibold block mb-0.5">X Position</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePositionChange('x', xDisplay - stepSize)}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={xDisplay}
                  onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full px-1 py-1 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-center text-[#000000] focus:outline-none focus:border-[#000000]"
                />
                <button
                  onClick={() => handlePositionChange('x', xDisplay + stepSize)}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#000000] font-semibold block mb-0.5">Y Position</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePositionChange('y', yDisplay - stepSize)}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={yDisplay}
                  onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full px-1 py-1 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-center text-[#000000] focus:outline-none focus:border-[#000000]"
                />
                <button
                  onClick={() => handlePositionChange('y', yDisplay + stepSize)}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[#000000] font-semibold block mb-0.5">Width</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePositionChange('width', Math.max(0.1, wDisplay - stepSize))}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={wDisplay}
                  onChange={(e) => handlePositionChange('width', parseFloat(e.target.value) || 1)}
                  className="w-full px-1 py-1 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-center text-[#000000] focus:outline-none focus:border-[#000000]"
                />
                <button
                  onClick={() => handlePositionChange('width', wDisplay + stepSize)}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#000000] font-semibold block mb-0.5">Height</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePositionChange('height', Math.max(0.1, hDisplay - stepSize))}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={hDisplay}
                  onChange={(e) => handlePositionChange('height', parseFloat(e.target.value) || 1)}
                  className="w-full px-1 py-1 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-center text-[#000000] focus:outline-none focus:border-[#000000]"
                />
                <button
                  onClick={() => handlePositionChange('height', hDisplay + stepSize)}
                  className="px-1.5 py-1 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded text-[#000000] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 3. APPEARANCE & EFFECTS (Collapsible) */}
        <CollapsibleSection
          id="appearance"
          title="Appearance & Rotation"
          icon={<Palette className="w-3.5 h-3.5 text-[#000000]" />}
          isOpen={openSections.appearance}
          onToggle={() => toggleSection('appearance')}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Rotation (°)</label>
              <input
                type="number"
                value={selectedLayer.rotation || 0}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, { rotation: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded-lg font-mono text-xs text-[#000000] focus:outline-none focus:border-[#000000]"
              />
            </div>
            <div>
              <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedLayer.opacity ?? 1}
                onChange={(e) =>
                  updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })
                }
                className="w-full accent-[#000000] cursor-pointer mt-1"
              />
            </div>
          </div>

          {/* Shape Specific Styling */}
          {selectedLayer.type === 'shape' && (
            <div className="space-y-2 pt-2 border-t border-[#E7E9EB]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Fill Color</label>
                  <input
                    type="color"
                    value={selectedLayer.fill || '#3b82f6'}
                    onChange={(e) => updateLayer(selectedLayer.id, { fill: e.target.value })}
                    className="w-8 h-8 rounded border border-[#dadcdc] cursor-pointer bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Stroke Color</label>
                  <input
                    type="color"
                    value={selectedLayer.stroke || '#1e3a8a'}
                    onChange={(e) => updateLayer(selectedLayer.id, { stroke: e.target.value })}
                    className="w-8 h-8 rounded border border-[#dadcdc] cursor-pointer bg-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Stroke Width (mm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={selectedLayer.strokeWidth || 0.5}
                  onChange={(e) =>
                    updateLayer(selectedLayer.id, { strokeWidth: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-[#000000] focus:outline-none focus:border-[#000000]"
                />
              </div>
            </div>
          )}

          {/* Placeholder Specific Styling */}
          {selectedLayer.type === 'placeholder' && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E9EB]">
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Border Color</label>
                <input
                  type="color"
                  value={selectedLayer.borderColor || '#1e3a8a'}
                  onChange={(e) => updateLayer(selectedLayer.id, { borderColor: e.target.value })}
                  className="w-8 h-8 rounded border border-[#dadcdc] cursor-pointer bg-transparent"
                />
              </div>
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Background</label>
                <input
                  type="color"
                  value={selectedLayer.backgroundColor || '#f1f5f9'}
                  onChange={(e) => updateLayer(selectedLayer.id, { backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded border border-[#dadcdc] cursor-pointer bg-transparent"
                />
              </div>
            </div>
          )}

          {/* Barcode Specific Configuration */}
          {selectedLayer.type === 'barcode' && (
            <div className="space-y-2 pt-2 border-t border-[#E7E9EB]">
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Barcode Type</label>
                <select
                  value={selectedLayer.barcodeType}
                  onChange={(e) => updateLayer(selectedLayer.id, { barcodeType: e.target.value as any })}
                  className="w-full px-2 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded text-xs text-[#000000] font-semibold cursor-pointer"
                >
                  <option value="Code128">Code128 (Alphanumeric)</option>
                  <option value="PDF417">PDF417 (High Density 2D)</option>
                  <option value="EAN13">EAN13 (Numeric 13 Digits)</option>
                </select>
              </div>
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Data Expression</label>
                <input
                  type="text"
                  value={selectedLayer.data}
                  onChange={(e) => updateLayer(selectedLayer.id, { data: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-[#000000] focus:outline-none focus:border-[#000000]"
                />
              </div>
            </div>
          )}

          {/* QR Code Specific Configuration */}
          {selectedLayer.type === 'qrcode' && (
            <div className="space-y-2 pt-2 border-t border-[#E7E9EB]">
              <div>
                <label className="block text-[#000000] font-semibold mb-1 text-[11px]">Payload / Text</label>
                <textarea
                  rows={2}
                  value={selectedLayer.data}
                  onChange={(e) => updateLayer(selectedLayer.id, { data: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-[#E7E9EB] border border-[#dadcdc] rounded font-mono text-xs text-[#000000] focus:outline-none focus:border-[#000000]"
                />
              </div>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </>
  );

  return renderPanelWrapper(singleContent);
};
