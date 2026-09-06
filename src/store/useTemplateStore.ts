import { create } from 'zustand';
import {
  CardTemplate,
  Layer,
  Guide,
  Unit,
  GridSettings,
  SnapSettings,
  SmartGuide,
  BackgroundConfig,
  UploadedBackground,
  NidaSubmissionRecord,
} from '../types';
import { CR80_WIDTH_MM, CR80_HEIGHT_MM } from '../utils/units';
import { SAMPLE_TEMPLATES } from '../utils/sampleTemplates';
import { ensureTemplateFieldIds, sanitizeTemplateForSaving } from '../utils/templateMappingEngine';
import { getClosestValidWeight } from '../utils/fonts';
import {
  saveTemplateDB,
  getAllTemplatesDB,
  deleteTemplateDB,
  saveBackgroundDB,
  getAllBackgroundsDB,
  deleteBackgroundDB,
} from '../utils/idb';

interface TemplateState {
  activeScreen: 'home' | 'upload' | 'editor' | 'templates' | 'nida' | 'preview';
  currentTemplate: CardTemplate;
  frontPopulatedTemplate: CardTemplate | null;
  backPopulatedTemplate: CardTemplate | null;
  lastNidaFormData: any | null;

  // NIDA Template Selections & Universal Defaults
  selectedFrontTemplateId: string | null;
  selectedBackTemplateId: string | null;
  defaultNidaFrontTemplateId: string | null;
  defaultNidaBackTemplateId: string | null;
  activeUnit: Unit;
  selectedLayerIds: string[];
  zoom: number; // 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0
  panOffset: { x: number; y: number };

  gridSettings: GridSettings;
  snapSettings: SnapSettings;
  showRulers: boolean;
  showGuides: boolean;
  showSafeZones: boolean;

  cursorPosMm: { x: number; y: number };
  activeSmartGuides: SmartGuide[];

  uploadedBackgrounds: UploadedBackground[];

  // Modals
  isTemplateLibraryOpen: boolean;
  isCardGeneratorOpen: boolean;
  isExportModalOpen: boolean;
  isMergeModalOpen: boolean;
  isSaveModalOpen: boolean;
  activeMobileSheet: 'elements' | 'layers' | 'backgrounds' | 'properties' | 'settings' | null;

  // NIDA Success Notification Toast
  nidaSuccessNotification: {
    title: string;
    message: string;
    populatedCount: number;
    isBackSide?: boolean;
  } | null;
  setNidaSuccessNotification: (
    notification: {
      title: string;
      message: string;
      populatedCount: number;
      isBackSide?: boolean;
    } | null
  ) => void;

  // History stack for Undo/Redo
  history: CardTemplate[];
  historyIndex: number;

  // Actions
  setActiveScreen: (screen: 'home' | 'upload' | 'editor' | 'templates' | 'nida' | 'preview') => void;
  setPopulatedCardPair: (front: CardTemplate | null, back: CardTemplate | null, formData?: any) => void;
  createNewTemplate: (background: BackgroundConfig, name?: string) => void;
  loadTemplate: (template: CardTemplate) => void;
  setCurrentTemplate: (template: CardTemplate) => void;
  updateTemplateMeta: (meta: Partial<CardTemplate>) => void;
  setActiveUnit: (unit: Unit) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  resetView: () => void;

  // Layer Management
  setSelectedLayerIds: (ids: string[]) => void;
  selectLayer: (id: string, multiSelect?: boolean) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  updateLayerLive: (id: string, patch: Partial<Layer>) => void;
  applyFontToLayers: (fontFamily: string, scope: 'selected' | 'all', targetLayerId?: string) => void;
  applyWeightToLayers: (fontWeight: number, scope: 'selected' | 'all', targetLayerId?: string) => void;
  deleteSelectedLayers: () => void;
  duplicateSelectedLayers: () => void;
  reorderLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;

  // Precision Movement & Alignment
  nudgeSelectedLayers: (dxMm: number, dyMm: number) => void;
  alignSelectedLayers: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelectedLayers: (direction: 'horizontal' | 'vertical') => void;

  // Background Library
  loadUploadedBackgrounds: () => Promise<void>;
  addUploadedBackground: (
    bg: Omit<UploadedBackground, 'id' | 'createdAt'>
  ) => Promise<UploadedBackground>;
  updateUploadedBackground: (id: string, patch: Partial<UploadedBackground>) => Promise<void>;
  deleteUploadedBackground: (id: string) => Promise<void>;

  // Guides & Rulers & Safe Zones
  addGuide: (guide: Omit<Guide, 'id'>) => void;
  updateGuide: (id: string, patch: Partial<Guide>) => void;
  deleteGuide: (id: string) => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleSafeZones: () => void;

  // Grid & Snap
  setGridSettings: (settings: Partial<GridSettings>) => void;
  setSnapSettings: (settings: Partial<SnapSettings>) => void;

  // Live cursor & smart guides
  setCursorPosMm: (pos: { x: number; y: number }) => void;
  setActiveSmartGuides: (guides: SmartGuide[]) => void;

  // Modals
  setTemplateLibraryOpen: (open: boolean) => void;
  setCardGeneratorOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setMergeModalOpen: (open: boolean) => void;
  setSaveModalOpen: (open: boolean) => void;
  setActiveMobileSheet: (sheet: 'elements' | 'layers' | 'backgrounds' | 'properties' | 'settings' | null) => void;

  // Storage / Persistence
  saveCurrentTemplate: () => Promise<void>;
  saveAsNewTemplate: (newName: string, cardType?: any, side?: any) => Promise<CardTemplate>;
  loadSavedTemplates: () => Promise<CardTemplate[]>;
  deleteSavedTemplate: (id: string) => Promise<void>;

  // NIDA Template Selection & Universal Default Actions
  setSelectedFrontTemplateId: (id: string | null) => void;
  setSelectedBackTemplateId: (id: string | null) => void;
  setUniversalDefaultNidaTemplates: (frontId: string, backId: string) => void;
  saveNidaSubmissionRecord: (record: NidaSubmissionRecord) => Promise<void>;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  pushHistoryState: (template: CardTemplate) => void;
}

const DEFAULT_TEMPLATE: CardTemplate = {
  id: 'template_' + Date.now(),
  templateName: 'Untitled Card Template',
  cardWidth: CR80_WIDTH_MM,
  cardHeight: CR80_HEIGHT_MM,
  unit: 'mm',
  dpi: 300,
  orientation: 'landscape',
  background: {
    type: 'color',
    color: '#ffffff',
  },
  layers: [],
  guides: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useTemplateStore = create<TemplateState>((set, get) => {
  const savedDefaultFrontId =
    typeof window !== 'undefined'
      ? localStorage.getItem('nida_default_front_template_id')
      : null;
  const savedDefaultBackId =
    typeof window !== 'undefined'
      ? localStorage.getItem('nida_default_back_template_id')
      : null;

  const savedSelectedFrontId =
    typeof window !== 'undefined'
      ? localStorage.getItem('nida_selected_front_template_id') || savedDefaultFrontId || 'sample_tanzania_nida'
      : savedDefaultFrontId || 'sample_tanzania_nida';
  const savedSelectedBackId =
    typeof window !== 'undefined'
      ? localStorage.getItem('nida_selected_back_template_id') || savedDefaultBackId || 'sample_tanzania_nida_back'
      : savedDefaultBackId || 'sample_tanzania_nida_back';

  return {
    activeScreen: 'home',
    currentTemplate: DEFAULT_TEMPLATE,
    frontPopulatedTemplate: null,
    backPopulatedTemplate: null,
    lastNidaFormData: null,

    // NIDA Template Selections & Universal Defaults
    selectedFrontTemplateId: savedSelectedFrontId,
    selectedBackTemplateId: savedSelectedBackId,
    defaultNidaFrontTemplateId: savedDefaultFrontId,
    defaultNidaBackTemplateId: savedDefaultBackId,

    activeUnit: 'mm',
    selectedLayerIds: [],
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },

  gridSettings: {
    enabled: false,
    sizeMm: 5,
    color: '#cbd5e1',
    opacity: 0.5,
  },

  snapSettings: {
    snapToGrid: true,
    snapToGuides: true,
    snapToObjects: true,
    snapToCenter: true,
    snapToEqualSpacing: true,
    thresholdMm: 1.5,
  },

  showRulers: true,
  showGuides: true,
  showSafeZones: false,

  cursorPosMm: { x: 0, y: 0 },
  activeSmartGuides: [],

  uploadedBackgrounds: [],

  isTemplateLibraryOpen: false,
  isCardGeneratorOpen: false,
  isExportModalOpen: false,
  isMergeModalOpen: false,
  isSaveModalOpen: false,
  activeMobileSheet: null,

  nidaSuccessNotification: null,
  setNidaSuccessNotification: (notification) => set({ nidaSuccessNotification: notification }),

  history: [DEFAULT_TEMPLATE],
  historyIndex: 0,

  setActiveScreen: (screen) => set({ activeScreen: screen }),

  setPopulatedCardPair: (front, back, formData) =>
    set({
      frontPopulatedTemplate: front,
      backPopulatedTemplate: back,
      lastNidaFormData: formData !== undefined ? formData : get().lastNidaFormData,
    }),

  createNewTemplate: (background, name) => {
    let cardWidth = CR80_WIDTH_MM;
    let cardHeight = CR80_HEIGHT_MM;
    let orientation: 'landscape' | 'portrait' = 'landscape';

    if (background.type === 'image' && background.originalWidthPx && background.originalHeightPx) {
      if (background.originalHeightPx > background.originalWidthPx) {
        orientation = 'portrait';
        cardWidth = CR80_HEIGHT_MM;
        cardHeight = CR80_WIDTH_MM;
      }
    }

    const newTpl: CardTemplate = {
      id: 'template_' + Date.now(),
      templateName: name || 'New Card Template',
      cardWidth,
      cardHeight,
      unit: 'mm',
      dpi: 300,
      orientation,
      background,
      layers: [],
      guides: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({
      currentTemplate: newTpl,
      selectedLayerIds: [],
      activeScreen: 'editor',
      zoom: 1.0,
      history: [newTpl],
      historyIndex: 0,
    });
  },

  loadTemplate: (template) => {
    set({
      currentTemplate: template,
      selectedLayerIds: [],
      activeScreen: 'editor',
      history: [template],
      historyIndex: 0,
      zoom: 1.0,
    });
  },

  setCurrentTemplate: (template) => {
    set({ currentTemplate: template });
  },

  updateTemplateMeta: (meta) => {
    const updated = {
      ...get().currentTemplate,
      ...meta,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  setActiveUnit: (unit) => set({ activeUnit: unit }),

  setZoom: (zoomOrFn) =>
    set((state) => {
      const newZoom = typeof zoomOrFn === 'function' ? zoomOrFn(state.zoom) : zoomOrFn;
      // Clamp zoom between 0.25 and 4.0
      return { zoom: Math.min(4.0, Math.max(0.25, Number(newZoom.toFixed(2)))) };
    }),

  setPanOffset: (offsetOrFn) =>
    set((state) => ({
      panOffset: typeof offsetOrFn === 'function' ? offsetOrFn(state.panOffset) : offsetOrFn,
    })),

  resetView: () => set({ zoom: 1.0, panOffset: { x: 0, y: 0 } }),

  setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),

  selectLayer: (id, multiSelect = false) => {
    const { selectedLayerIds } = get();
    if (multiSelect) {
      if (selectedLayerIds.includes(id)) {
        set({ selectedLayerIds: selectedLayerIds.filter((item) => item !== id) });
      } else {
        set({ selectedLayerIds: [...selectedLayerIds, id] });
      }
    } else {
      set({ selectedLayerIds: [id] });
    }
  },

  addLayer: (layer) => {
    const template = get().currentTemplate;
    const updated = {
      ...template,
      layers: [...template.layers, layer],
      updatedAt: new Date().toISOString(),
    };
    set({
      currentTemplate: updated,
      selectedLayerIds: [layer.id],
    });
    get().pushHistoryState(updated);
  },

  updateLayer: (id, patch) => {
    const template = get().currentTemplate;
    const updatedLayers = template.layers.map((l) =>
      l.id === id ? ({ ...l, ...patch } as Layer) : l
    );
    const updated = {
      ...template,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  updateLayerLive: (id, patch) => {
    const template = get().currentTemplate;
    const updatedLayers = template.layers.map((l) =>
      l.id === id ? ({ ...l, ...patch } as Layer) : l
    );
    set({
      currentTemplate: {
        ...template,
        layers: updatedLayers,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  applyFontToLayers: (fontFamily, scope, targetLayerId) => {
    const { currentTemplate, selectedLayerIds } = get();
    let targetIds: string[] = [];
    if (scope === 'selected') {
      if (targetLayerId) {
        targetIds = [targetLayerId];
      } else if (selectedLayerIds.length > 0) {
        targetIds = selectedLayerIds;
      }
    } else {
      targetIds = currentTemplate.layers.filter((l) => l.type === 'text').map((l) => l.id);
    }

    if (targetIds.length === 0) return;

    const updatedLayers = currentTemplate.layers.map((l) => {
      if (targetIds.includes(l.id) && l.type === 'text') {
        const textLayer = l as any;
        const currentWeight = textLayer.fontWeight ?? (textLayer.fontStyle?.includes('bold') ? 700 : 400);
        const validWeight = getClosestValidWeight(fontFamily, currentWeight);
        const isItalic = textLayer.fontStyle?.includes('italic');
        const isBold = validWeight >= 600;

        let fontStyle = 'normal';
        if (isBold && isItalic) fontStyle = 'bold italic';
        else if (isBold) fontStyle = 'bold';
        else if (isItalic) fontStyle = 'italic';

        return {
          ...l,
          fontFamily,
          fontWeight: validWeight,
          fontStyle,
        };
      }
      return l;
    });

    const updated = {
      ...currentTemplate,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };

    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  applyWeightToLayers: (targetWeight, scope, targetLayerId) => {
    const { currentTemplate, selectedLayerIds } = get();
    let targetIds: string[] = [];
    if (scope === 'selected') {
      if (targetLayerId) {
        targetIds = [targetLayerId];
      } else if (selectedLayerIds.length > 0) {
        targetIds = selectedLayerIds;
      }
    } else {
      targetIds = currentTemplate.layers.filter((l) => l.type === 'text').map((l) => l.id);
    }

    if (targetIds.length === 0) return;

    const updatedLayers = currentTemplate.layers.map((l) => {
      if (targetIds.includes(l.id) && l.type === 'text') {
        const textLayer = l as any;
        const validWeight = getClosestValidWeight(textLayer.fontFamily || 'Helvetica', targetWeight);
        const isItalic = textLayer.fontStyle?.includes('italic');
        const isBold = validWeight >= 600;

        let fontStyle = 'normal';
        if (isBold && isItalic) fontStyle = 'bold italic';
        else if (isBold) fontStyle = 'bold';
        else if (isItalic) fontStyle = 'italic';

        return {
          ...l,
          fontWeight: validWeight,
          fontStyle,
        };
      }
      return l;
    });

    const updated = {
      ...currentTemplate,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };

    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  deleteSelectedLayers: () => {
    const { currentTemplate, selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) return;
    const remaining = currentTemplate.layers.filter((l) => !selectedLayerIds.includes(l.id));
    const updated = {
      ...currentTemplate,
      layers: remaining,
      updatedAt: new Date().toISOString(),
    };
    set({
      currentTemplate: updated,
      selectedLayerIds: [],
    });
    get().pushHistoryState(updated);
  },

  duplicateSelectedLayers: () => {
    const { currentTemplate, selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) return;

    const duplicates: Layer[] = [];
    currentTemplate.layers.forEach((l) => {
      if (selectedLayerIds.includes(l.id)) {
        const copy: Layer = {
          ...JSON.parse(JSON.stringify(l)),
          id: 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: `${l.name} Copy`,
          x: l.x + 3.0, // Offset 3mm
          y: l.y + 3.0,
        };
        duplicates.push(copy);
      }
    });

    const updated = {
      ...currentTemplate,
      layers: [...currentTemplate.layers, ...duplicates],
      updatedAt: new Date().toISOString(),
    };

    set({
      currentTemplate: updated,
      selectedLayerIds: duplicates.map((d) => d.id),
    });
    get().pushHistoryState(updated);
  },

  reorderLayer: (id, direction) => {
    const template = get().currentTemplate;
    const idx = template.layers.findIndex((l) => l.id === id);
    if (idx === -1) return;

    const layers = [...template.layers];
    const target = layers.splice(idx, 1)[0];

    if (direction === 'up' && idx < layers.length) {
      layers.splice(idx + 1, 0, target);
    } else if (direction === 'down' && idx > 0) {
      layers.splice(idx - 1, 0, target);
    } else if (direction === 'top') {
      layers.push(target);
    } else if (direction === 'bottom') {
      layers.unshift(target);
    }

    const updated = {
      ...template,
      layers,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  toggleLayerVisibility: (id) => {
    const template = get().currentTemplate;
    const updatedLayers = template.layers.map((l) =>
      l.id === id ? ({ ...l, hidden: !l.hidden } as Layer) : l
    );
    const updated = {
      ...template,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
  },

  toggleLayerLock: (id) => {
    const template = get().currentTemplate;
    const updatedLayers = template.layers.map((l) =>
      l.id === id ? ({ ...l, locked: !l.locked } as Layer) : l
    );
    const updated = {
      ...template,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
  },

  nudgeSelectedLayers: (dxMm, dyMm) => {
    const { currentTemplate, selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) return;

    const updatedLayers = currentTemplate.layers.map((l) => {
      if (selectedLayerIds.includes(l.id) && !l.locked) {
        return {
          ...l,
          x: Number((l.x + dxMm).toFixed(2)),
          y: Number((l.y + dyMm).toFixed(2)),
        };
      }
      return l;
    });

    const updated = {
      ...currentTemplate,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  alignSelectedLayers: (type) => {
    const { currentTemplate, selectedLayerIds } = get();
    if (selectedLayerIds.length === 0) return;

    const selected = currentTemplate.layers.filter(
      (l) => selectedLayerIds.includes(l.id) && !l.locked
    );
    if (selected.length === 0) return;

    const updatedLayers = [...currentTemplate.layers];

    if (selected.length === 1) {
      const layer = selected[0];
      let newX = layer.x;
      let newY = layer.y;

      if (type === 'left') newX = 0;
      if (type === 'center') newX = (currentTemplate.cardWidth - layer.width) / 2;
      if (type === 'right') newX = currentTemplate.cardWidth - layer.width;
      if (type === 'top') newY = 0;
      if (type === 'middle') newY = (currentTemplate.cardHeight - layer.height) / 2;
      if (type === 'bottom') newY = currentTemplate.cardHeight - layer.height;

      const idx = updatedLayers.findIndex((l) => l.id === layer.id);
      if (idx !== -1) {
        updatedLayers[idx] = { ...layer, x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) };
      }
    } else {
      const minX = Math.min(...selected.map((l) => l.x));
      const maxX = Math.max(...selected.map((l) => l.x + l.width));
      const minY = Math.min(...selected.map((l) => l.y));
      const maxY = Math.max(...selected.map((l) => l.y + l.height));

      const avgCenterX = (minX + maxX) / 2;
      const avgCenterY = (minY + maxY) / 2;

      selected.forEach((layer) => {
        let newX = layer.x;
        let newY = layer.y;

        if (type === 'left') newX = minX;
        if (type === 'center') newX = avgCenterX - layer.width / 2;
        if (type === 'right') newX = maxX - layer.width;
        if (type === 'top') newY = minY;
        if (type === 'middle') newY = avgCenterY - layer.height / 2;
        if (type === 'bottom') newY = maxY - layer.height;

        const idx = updatedLayers.findIndex((l) => l.id === layer.id);
        if (idx !== -1) {
          updatedLayers[idx] = { ...layer, x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) };
        }
      });
    }

    const updated = {
      ...currentTemplate,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  distributeSelectedLayers: (direction) => {
    const { currentTemplate, selectedLayerIds } = get();
    const selected = currentTemplate.layers.filter(
      (l) => selectedLayerIds.includes(l.id) && !l.locked
    );
    if (selected.length < 3) return;

    const updatedLayers = [...currentTemplate.layers];

    if (direction === 'horizontal') {
      const sorted = [...selected].sort((a, b) => a.x - b.x);
      const minX = sorted[0].x;
      const last = sorted[sorted.length - 1];
      const maxX = last.x + last.width;
      const totalWidthOfItems = sorted.reduce((sum, item) => sum + item.width, 0);
      const totalGapSpace = maxX - minX - totalWidthOfItems;
      const gap = totalGapSpace / (sorted.length - 1);

      let currentPos = minX;
      sorted.forEach((layer) => {
        const idx = updatedLayers.findIndex((l) => l.id === layer.id);
        if (idx !== -1) {
          updatedLayers[idx] = { ...layer, x: Number(currentPos.toFixed(2)) };
        }
        currentPos += layer.width + gap;
      });
    } else {
      const sorted = [...selected].sort((a, b) => a.y - b.y);
      const minY = sorted[0].y;
      const last = sorted[sorted.length - 1];
      const maxY = last.y + last.height;
      const totalHeightOfItems = sorted.reduce((sum, item) => sum + item.height, 0);
      const totalGapSpace = maxY - minY - totalHeightOfItems;
      const gap = totalGapSpace / (sorted.length - 1);

      let currentPos = minY;
      sorted.forEach((layer) => {
        const idx = updatedLayers.findIndex((l) => l.id === layer.id);
        if (idx !== -1) {
          updatedLayers[idx] = { ...layer, y: Number(currentPos.toFixed(2)) };
        }
        currentPos += layer.height + gap;
      });
    }

    const updated = {
      ...currentTemplate,
      layers: updatedLayers,
      updatedAt: new Date().toISOString(),
    };
    set({ currentTemplate: updated });
    get().pushHistoryState(updated);
  },

  loadUploadedBackgrounds: async () => {
    const bgs = await getAllBackgroundsDB();
    set({ uploadedBackgrounds: bgs });
  },

  addUploadedBackground: async (bgData) => {
    const newBg: UploadedBackground = {
      ...bgData,
      id: 'bg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    await saveBackgroundDB(newBg);
    await get().loadUploadedBackgrounds();
    return newBg;
  },

  updateUploadedBackground: async (id, patch) => {
    const { uploadedBackgrounds } = get();
    const existing = uploadedBackgrounds.find((b) => b.id === id);
    if (!existing) return;
    const updated = { ...existing, ...patch };
    await saveBackgroundDB(updated);
    await get().loadUploadedBackgrounds();
  },

  deleteUploadedBackground: async (id) => {
    await deleteBackgroundDB(id);
    await get().loadUploadedBackgrounds();
  },

  toggleSafeZones: () => set((state) => ({ showSafeZones: !state.showSafeZones })),

  addGuide: (guideData) => {
    const template = get().currentTemplate;
    const newGuide: Guide = {
      ...guideData,
      id: 'guide_' + Date.now(),
    };
    const updated = {
      ...template,
      guides: [...template.guides, newGuide],
    };
    set({ currentTemplate: updated });
  },

  updateGuide: (id, patch) => {
    const template = get().currentTemplate;
    const updatedGuides = template.guides.map((g) => (g.id === id ? { ...g, ...patch } : g));
    set({ currentTemplate: { ...template, guides: updatedGuides } });
  },

  deleteGuide: (id) => {
    const template = get().currentTemplate;
    const updatedGuides = template.guides.filter((g) => g.id !== id);
    set({ currentTemplate: { ...template, guides: updatedGuides } });
  },

  toggleRulers: () => set((state) => ({ showRulers: !state.showRulers })),
  toggleGuides: () => set((state) => ({ showGuides: !state.showGuides })),

  setGridSettings: (settings) =>
    set((state) => ({ gridSettings: { ...state.gridSettings, ...settings } })),
  setSnapSettings: (settings) =>
    set((state) => ({ snapSettings: { ...state.snapSettings, ...settings } })),

  setCursorPosMm: (pos) => set({ cursorPosMm: pos }),
  setActiveSmartGuides: (guides) => set({ activeSmartGuides: guides }),

  setTemplateLibraryOpen: (open) => set({ isTemplateLibraryOpen: open }),
  setCardGeneratorOpen: (open) => set({ isCardGeneratorOpen: open }),
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  setMergeModalOpen: (open) => set({ isMergeModalOpen: open }),
  setSaveModalOpen: (open) => set({ isSaveModalOpen: open }),
  setActiveMobileSheet: (sheet) => set({ activeMobileSheet: sheet }),

  saveCurrentTemplate: async () => {
    const template = get().currentTemplate;
    const sanitized = sanitizeTemplateForSaving(template);
    await saveTemplateDB(sanitized);
  },

  saveAsNewTemplate: async (newName: string, cardType?: any, side?: any) => {
    const current = get().currentTemplate;
    const sanitizedCurrent = sanitizeTemplateForSaving(current);
    const newTpl: CardTemplate = {
      ...JSON.parse(JSON.stringify(sanitizedCurrent)),
      id: 'template_' + Date.now(),
      templateName: newName,
      cardType: cardType || current.cardType || 'National ID',
      side: side || current.side || 'Front Side',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveTemplateDB(newTpl);
    set({ currentTemplate: newTpl });
    return newTpl;
  },

  loadSavedTemplates: async () => {
    const dbTemplates = await getAllTemplatesDB();
    const map = new Map<string, CardTemplate>();

    dbTemplates.forEach((t) => {
      map.set(t.id, ensureTemplateFieldIds(t));
    });

    // Always ensure built-in SAMPLE_TEMPLATES use current code version with explicit field IDs
    for (const sample of SAMPLE_TEMPLATES) {
      const sanitized = ensureTemplateFieldIds(sample);
      map.set(sanitized.id, sanitized);
      await saveTemplateDB(sanitized);
    }

    const all = Array.from(map.values());
    return all.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
      return timeB - timeA;
    });
  },

  deleteSavedTemplate: async (id) => {
    await deleteTemplateDB(id);
  },

  setSelectedFrontTemplateId: (id) => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem('nida_selected_front_template_id', id);
    }
    set({ selectedFrontTemplateId: id });
  },

  setSelectedBackTemplateId: (id) => {
    if (typeof window !== 'undefined' && id) {
      localStorage.setItem('nida_selected_back_template_id', id);
    }
    set({ selectedBackTemplateId: id });
  },

  setUniversalDefaultNidaTemplates: (frontId, backId) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nida_default_front_template_id', frontId);
      localStorage.setItem('nida_default_back_template_id', backId);
      localStorage.setItem('nida_selected_front_template_id', frontId);
      localStorage.setItem('nida_selected_back_template_id', backId);
    }
    set({
      defaultNidaFrontTemplateId: frontId,
      defaultNidaBackTemplateId: backId,
      selectedFrontTemplateId: frontId,
      selectedBackTemplateId: backId,
    });
  },

  saveNidaSubmissionRecord: async (record) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nida_last_submission', JSON.stringify(record));
        const historyStr = localStorage.getItem('nida_submission_history') || '[]';
        const history: NidaSubmissionRecord[] = JSON.parse(historyStr);
        history.unshift(record);
        // Keep last 50 submissions
        if (history.length > 50) history.pop();
        localStorage.setItem('nida_submission_history', JSON.stringify(history));
      } catch (err) {
        console.warn('Failed to persist submission record to localStorage:', err);
      }
    }
  },

  pushHistoryState: (template) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(template)));
    // Limit history stack size to 30
    if (newHistory.length > 30) newHistory.shift();

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({
        currentTemplate: JSON.parse(JSON.stringify(prev)),
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        currentTemplate: JSON.parse(JSON.stringify(next)),
        historyIndex: historyIndex + 1,
      });
    }
  },
};
});
