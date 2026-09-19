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
import { NidaFormScreen } from './components/nida';
import { DrivingLicenseFormScreen } from './components/nida/DrivingLicenseFormScreen';
import { NidaSuccessToast } from './components/nida/NidaSuccessToast';
import { HomeScreen } from './components/HomeScreen';
import { CardPreviewScreen } from './components/CardPreviewScreen';
import { PasskeyScreen } from './components/auth/PasskeyScreen';
import { PasskeyManagerModal } from './components/auth/PasskeyManagerModal';
import { ManualApplicationModal } from './components/auth/ManualApplicationModal';
import { RechargeModal } from './components/auth/RechargeModal';
import { UsageExhaustedBanner } from './components/auth/UsageExhaustedBanner';
import { DownloadsScreen } from './components/DownloadsScreen';
import { UnsavedChangesModal } from './components/common/UnsavedChangesModal';
import { StartupDisclaimerModal } from './components/common/StartupDisclaimerModal';

export default function App() {
  const { activeScreen, setActiveScreen, authRole } = useTemplateStore();

  // PASSKEY GATEWAY SYSTEM: Must enter valid passkey first
  if (!authRole) {
    return (
      <>
        <PasskeyScreen />
        <StartupDisclaimerModal />
      </>
    );
  }

  // Strict RBAC Guard: Regular Users (authRole === 'user') are blocked from Studio/Editor/Templates
  if (authRole === 'user' && (activeScreen === 'editor' || activeScreen === 'templates' || activeScreen === 'upload')) {
    return (
      <>
        <UsageExhaustedBanner />
        <HomeScreen />
        <PasskeyManagerModal />
        <RechargeModal />
        <ExportModal />
        <SaveTemplateModal />
        <MergeCardModal />
        <TemplateLibraryModal />
        <CardGeneratorModal />
      </>
    );
  }

  if (activeScreen === 'downloads') {
    return (
      <>
        <UsageExhaustedBanner />
        <DownloadsScreen />
        <PasskeyManagerModal />
        <RechargeModal />
      </>
    );
  }

  if (activeScreen === 'home') {
    return (
      <>
        <UsageExhaustedBanner />
        <HomeScreen />
        <PasskeyManagerModal />
        <ManualApplicationModal />
        <RechargeModal />
        <ExportModal />
        <SaveTemplateModal />
        <MergeCardModal />
        <TemplateLibraryModal />
        <CardGeneratorModal />
      </>
    );
  }

  if (activeScreen === 'upload') {
    return (
      <>
        <UsageExhaustedBanner />
        <UploadScreen />
        <PasskeyManagerModal />
        <RechargeModal />
        <ExportModal />
        <SaveTemplateModal />
        <MergeCardModal />
        <TemplateLibraryModal />
        <CardGeneratorModal />
      </>
    );
  }

  if (activeScreen === 'templates') {
    return (
      <>
        <UsageExhaustedBanner />
        <TemplatesScreen />
        <PasskeyManagerModal />
        <RechargeModal />
        <ExportModal />
        <SaveTemplateModal />
        <MergeCardModal />
        <TemplateLibraryModal />
        <CardGeneratorModal />
      </>
    );
  }

  if (activeScreen === 'nida') {
    return (
      <>
        <UsageExhaustedBanner />
        <NidaFormScreen
          onCancel={() => setActiveScreen('home')}
          onSuccess={() => {
            // Handled in workflow -> transitions to preview screen
          }}
        />
        <PasskeyManagerModal />
        <RechargeModal />
        <ExportModal />
        <SaveTemplateModal />
        <MergeCardModal />
        <TemplateLibraryModal />
        <CardGeneratorModal />
      </>
    );
  }

  if (activeScreen === 'driving_license') {
    return (
      <>
        <UsageExhaustedBanner />
        <DrivingLicenseFormScreen
          onCancel={() => setActiveScreen('home')}
          onSuccess={() => {
            // Handled in workflow -> transitions to preview screen
          }}
        />
        <PasskeyManagerModal />
        <RechargeModal />
        <ExportModal />
        <SaveTemplateModal />
        <MergeCardModal />
        <TemplateLibraryModal />
        <CardGeneratorModal />
      </>
    );
  }

  if (activeScreen === 'preview') {
    return (
      <>
        <UsageExhaustedBanner />
        <CardPreviewScreen />
        <PasskeyManagerModal />
        <RechargeModal />
        <ExportModal />
        <SaveTemplateModal />
        <MergeCardModal />
        <TemplateLibraryModal />
        <CardGeneratorModal />
      </>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FFFFFF] text-[#000000] overflow-hidden font-sans">
      {/* Usage Exhaustion Auto-Logout Banner */}
      <UsageExhaustedBanner />

      {/* NIDA Success Notification Toast */}
      <NidaSuccessToast />

      {/* Top Toolbar */}
      <Toolbar />

      {/* Main Editor Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative pb-14 lg:pb-0">
        <LeftPanel />
        <CanvasWorkspace />
        <RightPanel />
      </div>

      {/* Mobile Canva-style Dock (Visible only on mobile editor) */}
      {activeScreen === 'editor' && <MobileNavBar />}

      {/* Mobile Slide-Up Drawer for Elements, Layers, Backgrounds, Properties */}
      {activeScreen === 'editor' && <MobileBottomSheet />}

      {/* Bottom Status Bar (Desktop) */}
      <BottomStatusBar />

      {/* Modals & Passkey Manager */}
      <UnsavedChangesModal />
      <PasskeyManagerModal />
      <ManualApplicationModal />
      <RechargeModal />
      <TemplateLibraryModal />
      <CardGeneratorModal />
      <ExportModal />
      <SaveTemplateModal />
      <MergeCardModal />
    </div>
  );
}
