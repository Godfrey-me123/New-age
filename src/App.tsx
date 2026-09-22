import React, { useEffect } from 'react';
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
import { NhifFormScreen } from './components/nida/NhifFormScreen';
import { NidaSuccessToast } from './components/nida/NidaSuccessToast';
import { HomeScreen } from './components/HomeScreen';
import { CardPreviewScreen } from './components/CardPreviewScreen';
import { PasskeyScreen } from './components/auth/PasskeyScreen';
import { PasskeyManagerModal } from './components/auth/PasskeyManagerModal';
import { ManualApplicationModal } from './components/auth/ManualApplicationModal';
import { RechargeModal } from './components/auth/RechargeModal';
import { UsageExhaustedBanner } from './components/auth/UsageExhaustedBanner';
import { DownloadsScreen } from './components/DownloadsScreen';
import { TokenBillingScreen } from './components/billing/TokenBillingScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PaymentDashboard } from './components/admin/PaymentDashboard';
import { UnsavedChangesModal } from './components/common/UnsavedChangesModal';
import { StartupDisclaimerModal } from './components/common/StartupDisclaimerModal';

export default function App() {
  const { activeScreen, setActiveScreen, authRole, fetchPasskeysFromSupabase, userPreferences } = useTemplateStore();

  useEffect(() => {
    fetchPasskeysFromSupabase();
  }, [fetchPasskeysFromSupabase]);

  // Native Android APK JS Bridges
  useEffect(() => {
    // 1. Android Native SMS Receiver Callback
    (window as any).onNativeSmsReceived = async (sender: string, rawSms: string) => {
      console.log('[Native APK Bridge] SMS received:', { sender, rawSms });
      try {
        const response = await fetch('/api/payment-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: sender || 'Native SMS',
            raw_sms: rawSms,
            device_name: 'BIGsta Native Android APK'
          })
        });
        if (response.ok) {
          console.log('[Native APK Bridge] SMS successfully forwarded to backend.');
          alert(`[BIGsta Native APK] Successfully intercepted payment SMS from ${sender}! Checking and auto-confirming your tokens...`);
          
          // Force active state reload
          fetchPasskeysFromSupabase();
        } else {
          console.error('[Native APK Bridge] Webhook rejection:', await response.text());
        }
      } catch (err) {
        console.error('[Native APK Bridge] Network error posting intercepted SMS:', err);
      }
    };

    // 2. Request Permissions Bridge
    (window as any).requestApkPermissions = () => {
      const android = (window as any).AndroidInterface || (window as any).Android || (window as any).JSInterface;
      if (android && typeof android.requestPermissions === 'function') {
        android.requestPermissions();
        return true;
      }
      console.warn('[Native APK Bridge] No Java/Kotlin interface found. Run inside APK with standard WebAppInterface bindings.');
      return false;
    };

    // 3. Native Storage Save Bridge
    (window as any).saveFileNatively = (fileName: string, base64Data: string) => {
      const android = (window as any).AndroidInterface || (window as any).Android || (window as any).JSInterface;
      if (android && typeof android.saveFile === 'function') {
        android.saveFile(fileName, base64Data);
        return true;
      }
      return false;
    };
  }, [fetchPasskeysFromSupabase]);

  // Automatically trigger Native Permissions request if inside the APK Webview environment on startup
  useEffect(() => {
    const timer = setTimeout(() => {
      const android = (window as any).AndroidInterface || (window as any).Android || (window as any).JSInterface;
      if (android) {
        console.log('[Native APK Bridge] Native wrapper detected. Launching automated permission trigger...');
        if (typeof android.requestPermissions === 'function') {
          android.requestPermissions();
        }
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Synchronize system and user theme with DOM
  useEffect(() => {
    const isDark = userPreferences?.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    }
  }, [userPreferences?.theme]);

  // PASSKEY GATEWAY SYSTEM: Must enter valid passkey first
  if (!authRole) {
    // Redirect all restricted paths to login
    const path = window.location.pathname;
    if (path !== '/' && path !== '/login') {
      window.history.replaceState({}, '', '/login');
    }
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

  if (activeScreen === 'billing') {
    return (
      <>
        <UsageExhaustedBanner />
        <TokenBillingScreen />
        <PasskeyManagerModal />
        <RechargeModal />
      </>
    );
  }

  if (activeScreen === 'settings') {
    return (
      <>
        <UsageExhaustedBanner />
        <SettingsScreen />
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
          onCancel={() => useTemplateStore.getState().goBack()}
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
          onCancel={() => useTemplateStore.getState().goBack()}
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

  if (activeScreen === 'nhif') {
    return (
      <>
        <UsageExhaustedBanner />
        <NhifFormScreen
          onCancel={() => useTemplateStore.getState().goBack()}
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

  if (activeScreen === 'admin-payments' && authRole === 'admin') {
    return (
      <>
        <UsageExhaustedBanner />
        <PaymentDashboard />
        <PasskeyManagerModal />
        <RechargeModal />
      </>
    );
  }

  // Final Guard for Users: If they reach this point (unknown screen or editor), send back to home
  if (authRole === 'user') {
    return (
      <>
        <UsageExhaustedBanner />
        <HomeScreen />
        <RechargeModal />
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
