import React, { useEffect, useState, useRef } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  ArrowRight,
  FileJson,
  Edit2,
  Search,
  Filter,
  ArrowUpDown,
  Play,
  Layers,
  Sparkles,
  CreditCard,
  Check,
  X,
  Printer,
  ChevronRight,
  Home,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { CardTemplate, CardType, CardSide } from '../types';
import { downloadJSON, renderTemplateToCanvas } from '../utils/export';
import { TemplateBadge } from './TemplateBadge';
import { AppFooter } from './common/AppFooter';

export const TemplatesScreen: React.FC = () => {
  const {
    loadSavedTemplates,
    loadTemplate,
    deleteSavedTemplate,
    saveCurrentTemplate,
    setActiveScreen,
    setCardGeneratorOpen,
    setExportModalOpen,
  } = useTemplateStore();

  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'modified' | 'type'>('modified');
  
  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<CardType>('National ID');
  const [editSide, setEditSide] = useState<CardSide>('Front Side');

  // Preview canvases cache
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplates = async () => {
    const list = await loadSavedTemplates();
    setTemplates(list);

    // Generate thumbnails for each template
    const previewMap: Record<string, string> = {};
    for (const tpl of list) {
      try {
        const canvas = await renderTemplateToCanvas(tpl, {}, 100);
        previewMap[tpl.id] = canvas.toDataURL('image/png');
      } catch {
        // Fallback
      }
    }
    setPreviews(previewMap);
  };

  useEffect(() => {
    fetchTemplates();
  }, [loadSavedTemplates]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved template?')) {
      await deleteSavedTemplate(id);
      await fetchTemplates();
    }
  };

  const handleDuplicate = async (tpl: CardTemplate, e: React.MouseEvent) => {
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
    await fetchTemplates();
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

  const handleExport = (tpl: CardTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    loadTemplate(tpl);
    setExportModalOpen(true);
  };

  const startRename = (tpl: CardTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(tpl.id);
    setEditName(tpl.templateName);
    setEditType(tpl.cardType || 'National ID');
    setEditSide(tpl.side || 'Front Side');
  };

  const saveRename = async (tpl: CardTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editName.trim()) return;
    const updated: CardTemplate = {
      ...tpl,
      templateName: editName.trim(),
      cardType: editType,
      side: editSide,
      updatedAt: new Date().toISOString(),
    };
    useTemplateStore.getState().loadTemplate(updated);
    await saveCurrentTemplate();
    setEditingId(null);
    await fetchTemplates();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.cardWidth && parsed.cardHeight && Array.isArray(parsed.layers)) {
            const imported: CardTemplate = {
              id: 'template_' + Date.now(),
              templateName: parsed.templateName || 'Imported Template',
              cardType: parsed.cardType || 'National ID',
              side: parsed.side || 'Front Side',
              cardWidth: parsed.cardWidth,
              cardHeight: parsed.cardHeight,
              unit: parsed.unit || 'mm',
              dpi: parsed.dpi || 300,
              orientation: parsed.cardWidth >= parsed.cardHeight ? 'landscape' : 'portrait',
              background: parsed.background || { type: 'color', color: '#ffffff' },
              layers: parsed.layers,
              guides: parsed.guides || [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            loadTemplate(imported);
            await saveCurrentTemplate();
            await fetchTemplates();
          } else {
            alert('Invalid JSON template format.');
          }
        } catch {
          alert('Could not parse JSON file.');
        }
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  // Filter & Sort
  const filtered = templates.filter((t) => {
    const matchesSearch = t.templateName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      (t.cardType && t.cardType.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.templateName.localeCompare(b.templateName);
    if (sortBy === 'created')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'type') return (a.cardType || '').localeCompare(b.cardType || '');
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Templates Management</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {templates.length} Saved
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage, search, organize, duplicate, and open all your saved card templates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Return to Services Home"
          >
            <Home className="w-4 h-4 text-[#47A5FF]" />
            <span className="hidden sm:inline">Services</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Import JSON</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </button>

          <button
            onClick={() => setActiveScreen('editor')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Design</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {['All', 'National ID', 'Employee ID', 'Student ID', 'Membership Card'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="modified">Date Modified</option>
            <option value="created">Date Created</option>
            <option value="name">Template Name</option>
            <option value="type">Card Type</option>
          </select>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="flex-1 overflow-y-auto p-6">
        {sorted.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-600">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-400">No Templates Found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Try clearing your search filters or click "New Design" to start crafting your first ID template!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sorted.map((tpl) => (
              <div
                key={tpl.id}
                onClick={(e) => handleOpenEdit(tpl, e)}
                className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/80 rounded-2xl p-4 transition-all duration-200 shadow-lg hover:shadow-2xl flex flex-col justify-between relative overflow-hidden cursor-pointer"
              >
                {/* Thumbnail Preview Area */}
                <div className="aspect-[1.586/1] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center mb-3 group-hover:border-slate-700 transition-colors">
                  {previews[tpl.id] ? (
                    <img
                      src={previews[tpl.id]}
                      alt={tpl.templateName}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <CreditCard className="w-8 h-8 text-slate-700 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-600 font-mono uppercase">
                        CR80 Standard
                      </span>
                    </div>
                  )}

                  {/* Orientation Badge Overlay */}
                  <span className="absolute top-2 right-2 text-[9px] uppercase font-mono px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-300 border border-slate-700/80 backdrop-blur-sm">
                    {tpl.orientation}
                  </span>
                </div>

                {/* Info Header */}
                <div className="space-y-2 mb-3">
                  {editingId === tpl.id ? (
                    /* Inline Rename Form */
                    <div className="space-y-2 p-2 bg-slate-800 rounded-xl border border-blue-500/50" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        autoFocus
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as CardType)}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-200"
                        >
                          <option value="National ID">National ID</option>
                          <option value="Employee ID">Employee ID</option>
                          <option value="Student ID">Student ID</option>
                          <option value="Membership Card">Membership Card</option>
                          <option value="Access Badge">Access Badge</option>
                          <option value="Other">Other</option>
                        </select>
                        <select
                          value={editSide}
                          onChange={(e) => setEditSide(e.target.value as CardSide)}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-200"
                        >
                          <option value="Front Side">Front Side</option>
                          <option value="Back Side">Back Side</option>
                          <option value="Full Card">Full Card</option>
                          <option value="Single Side">Single Side</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={(e) => saveRename(tpl, e)}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {tpl.templateName}
                        </h3>
                        <button
                          onClick={(e) => startRename(tpl, e)}
                          className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors shrink-0"
                          title="Rename Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Visual Badges */}
                      <TemplateBadge cardType={tpl.cardType} side={tpl.side} size="sm" />

                      <div className="text-[11px] text-slate-400 space-y-0.5 pt-1 font-mono">
                        <p>
                          Size: {tpl.cardWidth} × {tpl.cardHeight} mm
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Modified: {new Date(tpl.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Template Actions Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleUseInGenerator(tpl, e)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Use in Card Generator"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(tpl, e)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleExport(tpl, e)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Export Options"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(tpl.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleOpenEdit(tpl, e)}
                    className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/20 flex items-center gap-1 transition-colors"
                  >
                    <span>Open</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Application Footer */}
      <AppFooter />
    </div>
  );
};
