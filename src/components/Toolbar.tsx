import React, { useState } from 'react';
import {
  Menu,
  Save,
  FolderOpen,
  Download,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Grid,
  Magnet,
  Ruler,
  Sliders,
  ChevronDown,
  Maximize2,
  Home,
  CreditCard,
  UserCheck,
  FileSpreadsheet,
  Info,
  X,
  CheckCircle2,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { Unit } from '../types';
import { ServiceMenuDrawer } from './navigation/ServiceMenuDrawer';
import { HorizontalActionRow } from './common/HorizontalActionRow';

export const Toolbar: React.FC = () => {
  const {
    currentTemplate,
    updateTemplateMeta,
    activeUnit,
    setActiveUnit,
    zoom,
    setZoom,
    setPanOffset,
    showRulers,
    toggleRulers,
    showGuides,
    toggleGuides,
    showSafeZones,
    toggleSafeZones,
    gridSettings,
    setGridSettings,
    snapSettings,
    setSnapSettings,
    saveCurrentTemplate,
    setTemplateLibraryOpen,
    setCardGeneratorOpen,
    setExportModalOpen,
    undo,
    redo,
    historyIndex,
    history,
    setActiveScreen,
  } = useTemplateStore();

  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [infoService, setInfoService] = useState<{
    name: string;
    authority: string;
    description: string;
    features: string[];
  } | null>(null);

  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);

  const toggleSaveDropdown = () => {
    if (!showSaveDropdown && saveButtonRef.current) {
      const rect = saveButtonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom,
        left: rect.right - 224,
      });
    }
    setShowSaveDropdown(!showSaveDropdown);
  };

  const [showSnapDropdown, setShowSnapDropdown] = useState(false);
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSave = async () => {
    await saveCurrentTemplate();
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleFitScreen = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const unitOptions: { value: Unit; label: string }[] = [
    { value: 'mm', label: 'mm' },
    { value: 'cm', label: 'cm' },
    { value: 'in', label: 'in' },
    { value: 'px', label: 'px' },
  ];

  return (
    <>
      <header className="h-14 bg-[#FFFFFF] border-b border-[#E7E9EB] px-2 sm:px-4 flex items-center justify-between text-[#000000] select-none sticky top-0 z-40 shrink-0 w-full gap-2 shadow-xs">
        {/* Top-Left: Menu Button, Home & Template Info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          {/* Menu Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuDrawerOpen(true)}
            className="p-2 rounded-xl bg-[#E7E9EB] hover:bg-[#dadcdc] text-[#000000] border border-[#dadcdc] transition-colors flex items-center justify-center cursor-pointer"
            title="Open Services Menu"
            aria-label="Open Services Navigation Menu"
          >
            <Menu className="w-4 h-4 text-[#000000]" />
          </button>

          {/* Return Home Button */}
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className="p-2 rounded-xl bg-[#E7E9EB] hover:bg-[#dadcdc] text-[#000000] border border-[#dadcdc] transition-colors flex items-center justify-center cursor-pointer"
            title="Return to Services Home"
            aria-label="Return to Services Overview"
          >
            <Home className="w-4 h-4 text-[#000000]" />
          </button>

          {/* Application Brand / App Name */}
          <div className="hidden lg:flex flex-col border-r border-[#E7E9EB] pr-3">
            <span className="text-xs font-bold text-[#000000] tracking-wide uppercase font-sans">
              ID Template Studio
            </span>
            <span className="text-[10px] text-[#555555] font-mono">
              Card Specification
            </span>
          </div>

          {/* Current Template Name & Dimensions */}
          <div className="flex flex-col justify-center max-w-[120px] sm:max-w-[180px] md:max-w-[220px]">
            <input
              type="text"
              value={currentTemplate.templateName}
              onChange={(e) => updateTemplateMeta({ templateName: e.target.value })}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#000000] hover:bg-[#E7E9EB]/60 focus:bg-[#FFFFFF] focus:outline-none px-1.5 py-0.5 rounded border border-transparent focus:border-[#E7E9EB] transition-colors w-full truncate"
              title="Edit Template Name"
            />
            <span className="text-[9px] sm:text-[10px] text-[#555555] px-1.5 font-mono truncate">
              {currentTemplate.cardWidth}×{currentTemplate.cardHeight} mm
            </span>
          </div>
        </div>

      {/* Desktop View: Full Tools & Display Settings (Visible on md and up) */}
      <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#E7E9EB] rounded-lg p-0.5 border border-[#dadcdc]">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 hover:bg-[#dadcdc] text-[#000000] disabled:opacity-30 disabled:hover:bg-transparent rounded flex items-center justify-center transition-colors cursor-pointer"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 hover:bg-[#dadcdc] text-[#000000] disabled:opacity-30 disabled:hover:bg-transparent rounded flex items-center justify-center transition-colors cursor-pointer"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Unit Selector */}
        <div className="relative">
          <select
            value={activeUnit}
            onChange={(e) => setActiveUnit(e.target.value as Unit)}
            className="h-8 bg-[#E7E9EB] text-xs text-[#000000] font-bold px-2 py-1 rounded-lg border border-[#dadcdc] focus:outline-none focus:border-[#000000] transition-colors cursor-pointer"
            title="Change Active Unit"
          >
            {unitOptions.map((u) => (
              <option key={u.value} value={u.value}>
                {u.value.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Zoom Controls & Fit */}
        <div className="flex items-center bg-[#E7E9EB] rounded-lg p-0.5 border border-[#dadcdc] text-xs text-[#000000]">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
            className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitScreen}
            className="px-2 font-mono text-[11px] text-center font-bold hover:text-[#000000] flex items-center justify-center cursor-pointer"
            title="Fit Screen (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(4.0, z + 0.25))}
            className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitScreen}
            className="p-1.5 hover:bg-[#dadcdc] rounded flex items-center justify-center text-[#000000] transition-colors cursor-pointer"
            title="Fit Card to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Extended Tools (Visible directly on xl+ screens) */}
        <div className="hidden xl:flex items-center gap-1.5">
          {/* Rulers Toggle */}
          <button
            onClick={toggleRulers}
            className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              showRulers
                ? 'bg-[#000000] border-[#000000] text-white'
                : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000] hover:bg-[#dadcdc]'
            }`}
            title="Toggle Rulers"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Safe Zones Toggle */}
          <button
            onClick={toggleSafeZones}
            className={`p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              showSafeZones
                ? 'bg-[#000000] border-[#000000] text-white'
                : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000] hover:bg-[#dadcdc]'
            }`}
            title="Toggle Safe / Cut / Bleed Zones"
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Grid Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowGridDropdown(!showGridDropdown)}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                gridSettings.enabled
                  ? 'bg-[#000000] border-[#000000] text-white'
                  : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000] hover:bg-[#dadcdc]'
              }`}
              title="Grid System Settings"
            >
              <Grid className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showGridDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] border border-[#E7E9EB] rounded-xl shadow-xl p-3 z-30 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-[#000000] pb-1 border-b border-[#E7E9EB]">
                  <span>Grid Overlay</span>
                  <input
                    type="checkbox"
                    checked={gridSettings.enabled}
                    onChange={(e) => setGridSettings({ enabled: e.target.checked })}
                    className="rounded accent-black cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#555555] block mb-1 font-medium">Grid Size (mm)</label>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 5, 10].map((size) => (
                      <button
                        key={size}
                        onClick={() => setGridSettings({ sizeMm: size, enabled: true })}
                        className={`py-1 rounded text-center border font-mono font-bold cursor-pointer ${
                          gridSettings.sizeMm === size && gridSettings.enabled
                            ? 'bg-[#000000] text-white border-[#000000]'
                            : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000] hover:bg-[#dadcdc]'
                        }`}
                      >
                        {size}mm
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Magnetic Snap System Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSnapDropdown(!showSnapDropdown)}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                snapSettings.snapToObjects || snapSettings.snapToGuides
                  ? 'bg-[#000000] border-[#000000] text-white'
                  : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000] hover:bg-[#dadcdc]'
              }`}
              title="Magnetic Snap System"
            >
              <Magnet className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showSnapDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] border border-[#E7E9EB] rounded-xl shadow-xl p-3 z-30 text-xs space-y-2">
                <div className="font-bold text-[#000000] pb-1 border-b border-[#E7E9EB]">
                  Magnetic Snap Options
                </div>
                <label className="flex items-center gap-2 text-[#000000] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snapSettings.snapToGrid}
                    onChange={(e) => setSnapSettings({ snapToGrid: e.target.checked })}
                    className="accent-black rounded"
                  />
                  <span>Snap To Grid</span>
                </label>
                <label className="flex items-center gap-2 text-[#000000] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snapSettings.snapToGuides}
                    onChange={(e) => setSnapSettings({ snapToGuides: e.target.checked })}
                    className="accent-black rounded"
                  />
                  <span>Snap To Guides</span>
                </label>
                <label className="flex items-center gap-2 text-[#000000] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snapSettings.snapToObjects}
                    onChange={(e) => setSnapSettings({ snapToObjects: e.target.checked })}
                    className="accent-black rounded"
                  />
                  <span>Snap To Objects</span>
                </label>
                <label className="flex items-center gap-2 text-[#000000] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snapSettings.snapToCenter}
                    onChange={(e) => setSnapSettings({ snapToCenter: e.target.checked })}
                    className="accent-black rounded"
                  />
                  <span>Snap To Center</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Compact View Dropdown for intermediate widths (md to xl) */}
        <div className="flex xl:hidden relative">
          <button
            onClick={() => setShowSnapDropdown(!showSnapDropdown)}
            className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs cursor-pointer ${
              showRulers || showSafeZones || gridSettings.enabled || snapSettings.snapToObjects
                ? 'bg-[#000000] border-[#000000] text-white'
                : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000] hover:bg-[#dadcdc]'
            }`}
            title="Display & Snapping Options"
          >
            <Sliders className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showSnapDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-[#FFFFFF] border border-[#E7E9EB] rounded-xl shadow-xl p-3 z-30 text-xs space-y-2">
              <div className="font-bold text-[#000000] pb-1 border-b border-[#E7E9EB]">
                Display & Snapping
              </div>
              <label className="flex items-center justify-between text-[#000000] font-medium cursor-pointer py-0.5">
                <span>Show Rulers</span>
                <input
                  type="checkbox"
                  checked={showRulers}
                  onChange={toggleRulers}
                  className="accent-black rounded"
                />
              </label>
              <label className="flex items-center justify-between text-[#000000] font-medium cursor-pointer py-0.5">
                <span>Safe Zones</span>
                <input
                  type="checkbox"
                  checked={showSafeZones}
                  onChange={toggleSafeZones}
                  className="accent-black rounded"
                />
              </label>
              <label className="flex items-center justify-between text-[#000000] font-medium cursor-pointer py-0.5">
                <span>Grid Overlay</span>
                <input
                  type="checkbox"
                  checked={gridSettings.enabled}
                  onChange={(e) => setGridSettings({ enabled: e.target.checked })}
                  className="accent-black rounded"
                />
              </label>
              <label className="flex items-center justify-between text-[#000000] font-medium cursor-pointer py-0.5">
                <span>Snap to Objects</span>
                <input
                  type="checkbox"
                  checked={snapSettings.snapToObjects}
                  onChange={(e) => setSnapSettings({ snapToObjects: e.target.checked })}
                  className="accent-black rounded"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Right: PRIMARY ACTION BAR - Swipable on mobile without whole-page horizontal scrolling */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 max-w-[58vw] sm:max-w-none overflow-x-auto no-scrollbar">
        <HorizontalActionRow className="gap-1.5">
          {/* Undo / Redo for Mobile */}
          <div className="flex md:hidden items-center bg-[#E7E9EB] rounded-lg p-0.5 border border-[#dadcdc] shrink-0">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="w-7 h-7 hover:bg-[#dadcdc] disabled:opacity-30 flex items-center justify-center rounded transition-colors text-[#000000] cursor-pointer"
              title="Undo"
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="w-7 h-7 hover:bg-[#dadcdc] disabled:opacity-30 flex items-center justify-center rounded transition-colors text-[#000000] cursor-pointer"
              title="Redo"
            >
              <RotateCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* NIDA Auto-Fill Button */}
          <button
            onClick={() => setActiveScreen('nida')}
            className="h-8 px-2.5 bg-[#CEE9E9] hover:bg-[#b8dede] border border-[#a1d3d3] text-[#000000] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
            title="NIDA Form"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#000000] shrink-0" />
            <span className="text-xs whitespace-nowrap">NIDA</span>
          </button>

          {/* Templates Button */}
          <button
            onClick={() => setActiveScreen('templates')}
            className="hidden sm:flex px-2 py-1.5 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-[#000000] text-xs font-bold rounded-lg transition-colors items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Templates"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#000000] shrink-0" />
            <span className="text-xs whitespace-nowrap">Templates</span>
          </button>

          {/* Save Button */}
          <div className="relative">
            <button
              ref={saveButtonRef}
              onClick={toggleSaveDropdown}
              className={`h-8 px-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
                isSavedNotice
                  ? 'bg-[#CEE9B9] border-[#b8df9c] text-[#000000]'
                  : 'bg-[#E7E9EB] hover:bg-[#dadcdc] border-[#dadcdc] text-[#000000]'
              }`}
              title="Save"
            >
              <Save className="w-3.5 h-3.5 text-[#000000] shrink-0" />
              <span className="text-xs whitespace-nowrap">{isSavedNotice ? 'Saved' : 'Save'}</span>
              <ChevronDown className="w-3 h-3 text-[#000000]/60 shrink-0" />
            </button>

            {showSaveDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSaveDropdown(false)}
                />
                <div
                  className="fixed bg-white border border-[#dadcdc] rounded-xl shadow-lg p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in slide-in-from-top-1"
                  style={{
                    top: dropdownCoords ? `${dropdownCoords.top + 6}px` : '52px',
                    left: dropdownCoords ? `${Math.max(8, dropdownCoords.left)}px` : 'auto',
                    right: dropdownCoords ? 'auto' : '16px',
                    width: '224px',
                  }}
                >
                  <button
                    onClick={async () => {
                      updateTemplateMeta({ side: 'Front Side' });
                      // Allow state update to settle before saving
                      setTimeout(async () => {
                        await saveCurrentTemplate();
                        setIsSavedNotice(true);
                        setShowSaveDropdown(false);
                        setTimeout(() => setIsSavedNotice(false), 2000);
                      }, 50);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#E7E9EB] rounded-lg text-[#000000] font-bold transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>Save as Front Template</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#CEE9B9] text-[#000000] border border-[#b8df9d]">FRONT</span>
                  </button>
                  <button
                    onClick={async () => {
                      updateTemplateMeta({ side: 'Back Side' });
                      // Allow state update to settle before saving
                      setTimeout(async () => {
                        await saveCurrentTemplate();
                        setIsSavedNotice(true);
                        setShowSaveDropdown(false);
                        setTimeout(() => setIsSavedNotice(false), 2000);
                      }, 50);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#E7E9EB] rounded-lg text-[#000000] font-bold transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>Save as Back Template</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#ECA6FC] text-[#000000] border border-[#dd76f8]">BACK</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={() => setCardGeneratorOpen(true)}
            className="h-8 px-2.5 sm:px-3 bg-[#ECA6FC] hover:bg-[#e48efa] border border-[#dd76f8] text-[#000000] text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Generate"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs whitespace-nowrap">Generate</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="h-8 px-2.5 sm:px-3 bg-[#000000] hover:bg-[#222222] text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
            title="Export"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs whitespace-nowrap">Export</span>
          </button>

        {/* More Tools (Mobile & Small Screens) */}
        <div className="flex md:hidden relative">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
              showMobileMenu || gridSettings.enabled || snapSettings.snapToObjects || showSafeZones
                ? 'bg-[#000000] border-[#000000] text-white'
                : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000]'
            }`}
            title="More Options & Tools"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Tools Dropdown Popover */}
          {showMobileMenu && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowMobileMenu(false)}
            >
              <div
                className="absolute right-2 top-16 w-64 bg-[#FFFFFF] border border-[#E7E9EB] rounded-2xl shadow-xl p-3 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E7E9EB]">
                  <span className="font-bold text-[#000000]">Tools & Settings</span>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-1 text-[#555555] hover:text-[#000000] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* NIDA Navigation */}
                <div>
                  <button
                    onClick={() => {
                      setActiveScreen('nida');
                      setShowMobileMenu(false);
                    }}
                    className="w-full p-2 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded-lg flex items-center gap-2 text-[#000000] font-bold cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-[#000000]" />
                    <span>NIDA</span>
                  </button>
                </div>

                {/* Templates Navigation */}
                <div>
                  <button
                    onClick={() => {
                      setActiveScreen('templates');
                      setShowMobileMenu(false);
                    }}
                    className="w-full p-2 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] rounded-lg flex items-center gap-2 text-[#000000] font-bold cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-[#000000]" />
                    <span>Templates</span>
                  </button>
                </div>

                {/* Active Unit */}
                <div className="flex items-center justify-between py-1 border-t border-[#E7E9EB]">
                  <span className="text-[#555555] font-medium">Unit</span>
                  <div className="flex items-center gap-1">
                    {unitOptions.map((u) => (
                      <button
                        key={u.value}
                        onClick={() => setActiveUnit(u.value)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                          activeUnit === u.value
                            ? 'bg-[#000000] text-white font-bold'
                            : 'bg-[#E7E9EB] text-[#000000] hover:bg-[#dadcdc]'
                        }`}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid Overlay & Size */}
                <div className="py-1 border-t border-[#E7E9EB] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#000000] font-bold">Grid Overlay</span>
                    <input
                      type="checkbox"
                      checked={gridSettings.enabled}
                      onChange={(e) => setGridSettings({ enabled: e.target.checked })}
                      className="rounded accent-black cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 5, 10].map((size) => (
                      <button
                        key={size}
                        onClick={() => setGridSettings({ sizeMm: size, enabled: true })}
                        className={`flex-1 py-1 rounded text-center border font-mono text-[10px] font-bold cursor-pointer ${
                          gridSettings.sizeMm === size && gridSettings.enabled
                            ? 'bg-[#000000] text-white border-[#000000]'
                            : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000]'
                        }`}
                      >
                        {size}mm
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snapping Options */}
                <div className="py-1 border-t border-[#E7E9EB] space-y-1">
                  <span className="text-[#000000] font-bold block mb-1">Snapping</span>
                  <label className="flex items-center justify-between text-[#000000] font-medium py-0.5 cursor-pointer">
                    <span>Snap to Objects</span>
                    <input
                      type="checkbox"
                      checked={snapSettings.snapToObjects}
                      onChange={(e) => setSnapSettings({ snapToObjects: e.target.checked })}
                      className="accent-black rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-[#000000] font-medium py-0.5 cursor-pointer">
                    <span>Snap to Center</span>
                    <input
                      type="checkbox"
                      checked={snapSettings.snapToCenter}
                      onChange={(e) => setSnapSettings({ snapToCenter: e.target.checked })}
                      className="accent-black rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-[#000000] font-medium py-0.5 cursor-pointer">
                    <span>Snap to Grid</span>
                    <input
                      type="checkbox"
                      checked={snapSettings.snapToGrid}
                      onChange={(e) => setSnapSettings({ snapToGrid: e.target.checked })}
                      className="accent-black rounded"
                    />
                  </label>
                </div>

                {/* Safe Zones & Fit */}
                <div className="pt-2 border-t border-[#E7E9EB] grid grid-cols-2 gap-1.5">
                  <button
                    onClick={toggleSafeZones}
                    className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                      showSafeZones
                        ? 'bg-[#000000] border-[#000000] text-white'
                        : 'bg-[#E7E9EB] border-[#dadcdc] text-[#000000]'
                    }`}
                  >
                    Safe Zones
                  </button>
                  <button
                    onClick={() => {
                      handleFitScreen();
                      setShowMobileMenu(false);
                    }}
                    className="p-2 rounded-lg border border-[#dadcdc] bg-[#E7E9EB] text-[#000000] font-bold cursor-pointer"
                  >
                    Fit to Screen
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </HorizontalActionRow>
    </div>
  </header>

      {/* Services Navigation Drawer */}
      <ServiceMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onSelectInfoService={(srv) => setInfoService(srv)}
      />

      {/* Clean Informational Dialog for Services */}
      {infoService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0F131A] border border-slate-700/80 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#47A5FF]">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {infoService.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{infoService.authority}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoService(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {infoService.description}
            </p>

            {infoService.features && infoService.features.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Planned Standard Features
                </span>
                <div className="space-y-1">
                  {infoService.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoService(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
