import React from 'react';
import { useTemplateStore } from './store/useTemplateStore';
import { UploadScreen } from './components/UploadScreen';
import { TemplatesScreen } from './components/TemplatesScreen';
import { Toolbar } from './components/Toolbar';
import { LeftPanel } from './components/LeftPanel';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { RightPanel } from './components/RightPanel';
import { BottomStatusBar } from './components/BottomStatusBar';
import { TemplateLibraryModal } from './components/TemplateLibraryModal';
import { CardGeneratorModal } from './components/CardGeneratorModal';
import { ExportModal } from './components/ExportModal';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { MergeCardModal } from './components/MergeCardModal';
import { MobileNavBar } from './components/MobileNavBar';
import { MobileBottomSheet } from './components/MobileBottomSheet';

export default function App() {
  const { activeScreen } = useTemplateStore();

  if (activeScreen === 'upload') {
    return <UploadScreen />;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Screen Router */}
      {activeScreen === 'templates' ? (
        <TemplatesScreen />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative pb-14 lg:pb-0">
          <LeftPanel />
          <CanvasWorkspace />
          <RightPanel />
        </div>
      )}

      {/* Mobile Canva-style Dock (Visible only on mobile editor) */}
      {activeScreen === 'editor' && <MobileNavBar />}

      {/* Mobile Slide-Up Drawer for Elements, Layers, Backgrounds, Properties */}
      {activeScreen === 'editor' && <MobileBottomSheet />}

      {/* Bottom Status Bar (Desktop) */}
      <BottomStatusBar />

      {/* Modals */}
      <TemplateLibraryModal />
      <CardGeneratorModal />
      <ExportModal />
      <SaveTemplateModal />
      <MergeCardModal />
    </div>
  );
}
