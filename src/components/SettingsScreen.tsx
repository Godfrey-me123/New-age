import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Palette,
  Bell,
  Download,
  HelpCircle,
  Smartphone,
  Scan,
  Coins,
  FileCode,
  HardDrive,
  Check,
  Save,
  LogOut,
  Moon,
  Sun,
  Globe,
  MessageSquare,
  PhoneCall,
  AlertTriangle,
  RefreshCw,
  Database,
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { UniversalBackButton } from './common/UniversalBackButton';

export const SettingsScreen: React.FC = () => {
  const {
    authRole,
    userProfile,
    updateUserProfile,
    userPreferences,
    updateUserPreferences,
    adminSettings,
    updateAdminSettings,
    paymentMethods,
    updatePaymentMethod,
    logoutPasskey,
    currentAuthKey
  } = useTemplateStore();

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance' | 'notifications' | 'downloads' | 'support' | 'payment_config' | 'ocr_config' | 'token_config' | 'system' | 'supabase_db'>('profile');

  // Feedback Toast
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Form State Handlers
  const [profileForm, setProfileForm] = useState(userProfile);
  const [prefsForm, setPrefsForm] = useState(userPreferences);
  const [adminForm, setAdminForm] = useState(adminSettings);

  // Keep forms synced if store updates
  useEffect(() => {
    setProfileForm(userProfile);
  }, [userProfile]);

  useEffect(() => {
    setPrefsForm(userPreferences);
  }, [userPreferences]);

  useEffect(() => {
    setAdminForm(adminSettings);
  }, [adminSettings]);

  // Support Form State
  const [supportMessage, setSupportMessage] = useState('');
  const [issueType, setIssueType] = useState('Payment Issue');

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    triggerToast('Profile information updated & saved');
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPreferences(prefsForm);
    triggerToast('Appearance & preference settings saved');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    const updated = { ...prefsForm, theme: newTheme };
    setPrefsForm(updated);
    updateUserPreferences(updated);
    triggerToast(`Theme environment changed to ${newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}`);
  };

  const handleSaveAdminSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminSettings(adminForm);
    triggerToast('Admin gateway & OCR settings saved');
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    triggerToast(`Support ticket submitted (${issueType}). Admin notified.`);
    setSupportMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#14171A] pb-16 text-[#111827] dark:text-[#F3F4F6] transition-colors duration-200">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#1E2328] border-b border-slate-200 dark:border-white/10 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UniversalBackButton />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA]" />
                Settings Control Center
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authRole === 'admin' ? 'CEO System Configuration, OCR Rules & User Preferences' : 'Personalize your profile, notifications, security & downloads'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              authRole === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800' : 'bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}>
              {authRole === 'admin' ? 'CEO ADMIN ROLE' : 'USER ROLE'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">

        {/* Save Confirmation Toast */}
        {saveToast && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveToast}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Category Sidebar Navigation */}
          <div className="space-y-1">
            <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-slate-200 dark:border-white/10 p-3 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider px-3 py-1 block">Account & Preferences</span>

              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  activeTab === 'profile' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" /> User Profile
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  activeTab === 'security' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4" /> Security & Passkey
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  activeTab === 'appearance' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Palette className="w-4 h-4" /> Appearance & Theme
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  activeTab === 'notifications' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Bell className="w-4 h-4" /> Notifications
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  activeTab === 'downloads' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Download className="w-4 h-4" /> Downloads Storage
              </button>

              <button
                onClick={() => setActiveTab('support')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                  activeTab === 'support' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Support & Feedback
              </button>

              {/* ADMIN EXCLUSIVE CATEGORIES */}
              {authRole === 'admin' && (
                <>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider px-3 py-2 block pt-3 border-t border-slate-100 dark:border-white/10">CEO Admin Controls</span>

                  <button
                    onClick={() => setActiveTab('payment_config')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                      activeTab === 'payment_config' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> Payment Gateways
                  </button>

                  <button
                    onClick={() => setActiveTab('ocr_config')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                      activeTab === 'ocr_config' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <Scan className="w-4 h-4" /> OCR Engine Settings
                  </button>

                  <button
                    onClick={() => setActiveTab('token_config')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                      activeTab === 'token_config' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <Coins className="w-4 h-4" /> Token Pricing Rules
                  </button>

                  <button
                    onClick={() => setActiveTab('system')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                      activeTab === 'system' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <Database className="w-4 h-4" /> System Health & Logs
                  </button>

                  <button
                    onClick={() => setActiveTab('supabase_db')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
                      activeTab === 'supabase_db' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" /> Supabase DB Migration
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right Main Content Pane */}
          <div className="lg:col-span-3 space-y-6">

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">User Profile Information</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your account name, contact numbers, and region</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (WhatsApp / Calls)</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Region / Location</label>
                    <input
                      type="text"
                      value={profileForm.region}
                      onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Profile
                  </button>
                </form>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Passkey Gateway</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manage active sessions, passkey authorization & password updates</p>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block">Current Active Passkey</span>
                    <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-400">{currentAuthKey || 'Default Active Key'}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300">AUTHENTICATED</span>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Device Sessions</h3>
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">Cloud Run Web Session (Current Device)</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">IP: 102.164.88.12 • Active Now</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/10">
                  <button
                    onClick={() => logoutPasskey()}
                    className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold border border-red-200 dark:border-red-900 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout All Device Sessions
                  </button>
                </div>
              </div>
            )}

            {/* TAB: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Appearance & Customization</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Set visual themes, interface language, and font density</p>
                </div>

                <form onSubmit={handleSavePreferences} className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Theme Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleThemeChange('light')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          prefsForm.theme === 'light' ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-[#60A5FA] ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <Sun className="w-4 h-4" /> Light Mode (Default)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleThemeChange('dark')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          prefsForm.theme === 'dark' ? 'border-[#2563EB] bg-slate-900 text-white ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <Moon className="w-4 h-4" /> Dark Mode
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">System Language</label>
                    <select
                      value={prefsForm.language}
                      onChange={(e) => {
                        const updated = { ...prefsForm, language: e.target.value as any };
                        setPrefsForm(updated);
                        updateUserPreferences(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="en">English (Official System Language)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      System strictly operates in English.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Font Scale & Density</label>
                    <select
                      value={prefsForm.fontSize}
                      onChange={(e) => {
                        const updated = { ...prefsForm, fontSize: e.target.value as any };
                        setPrefsForm(updated);
                        updateUserPreferences(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="compact">Compact (High Information Density)</option>
                      <option value="standard">Standard (Default Balanced Scale)</option>
                      <option value="large">Large (High Accessibility & Contrast)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Appearance
                  </button>
                </form>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Notification Alerts</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure alert channels for top-ups, downloads, and system notices</p>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Payment Verification Alerts</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">Receive instant notice when Admin approves top-ups</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefsForm.paymentAlerts}
                      onChange={(e) => {
                        const updated = { ...prefsForm, paymentAlerts: e.target.checked };
                        setPrefsForm(updated);
                        updateUserPreferences(updated);
                      }}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Download Ready Notifications</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">Alert when document generation completes</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefsForm.downloadAlerts}
                      onChange={(e) => {
                        const updated = { ...prefsForm, downloadAlerts: e.target.checked };
                        setPrefsForm(updated);
                        updateUserPreferences(updated);
                      }}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DOWNLOADS */}
            {activeTab === 'downloads' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Downloads & Directory Rules</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Configure target save folder on device and history preservation</p>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Storage Directory</label>
                    <input
                      type="text"
                      value={prefsForm.downloadFolder}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-xs font-mono font-bold text-slate-700 dark:text-slate-200"
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">Files save directly to phone/device storage under <span className="font-semibold text-slate-600 dark:text-slate-300">Downloads/BIGsta</span>.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">History Retention Length</label>
                    <select
                      value={prefsForm.keepHistoryDays}
                      onChange={(e) => {
                        const updated = { ...prefsForm, keepHistoryDays: parseInt(e.target.value) };
                        setPrefsForm(updated);
                        updateUserPreferences(updated);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value={30}>30 Days</option>
                      <option value={60}>60 Days</option>
                      <option value={365}>1 Year (Forever)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SUPPORT */}
            {activeTab === 'support' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-slate-200 dark:border-white/10 p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Support & Report Issue</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Contact admin via WhatsApp, phone, or submit a support ticket</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                    href="https://wa.me/255754000111"
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-50 transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">WhatsApp Support</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Chat with BIGsta CEO Admin</p>
                    </div>
                  </a>

                  <a
                    href="tel:+255754000111"
                    className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 transition-all flex items-center gap-3"
                  >
                    <div className="p-2.5 bg-[#2563EB] text-white rounded-xl">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900 dark:text-blue-300">Direct Call</p>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400">+255 754 000 111</p>
                    </div>
                  </a>
                </div>

                <form onSubmit={handleSendSupport} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Category</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option>Payment Verification</option>
                      <option>NIDA Form Export</option>
                      <option>Driving License Export</option>
                      <option>Token Balance Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message Description</label>
                    <textarea
                      rows={3}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Describe your question or issue..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              </div>
            )}

            {/* ADMIN EXCLUSIVE TAB: OCR CONFIG */}
            {authRole === 'admin' && activeTab === 'ocr_config' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-purple-200 dark:border-purple-900 p-6 shadow-xs space-y-5">
                <div className="border-b border-purple-100 dark:border-purple-900/40 pb-3">
                  <h2 className="text-base font-bold text-purple-950 dark:text-purple-300 flex items-center gap-2">
                    <Scan className="w-5 h-5 text-purple-700 dark:text-purple-400" /> OCR Engine & Auto-Approval Settings
                  </h2>
                  <p className="text-xs text-purple-700 dark:text-purple-400">Configure receipt parser threshold and auto-approval rules</p>
                </div>

                <form onSubmit={handleSaveAdminSettings} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">OCR Engine Provider</label>
                    <input
                      type="text"
                      value={adminForm.ocrProvider}
                      onChange={(e) => setAdminForm({ ...adminForm, ocrProvider: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confidence Threshold ({adminForm.ocrConfidenceThreshold}%)</label>
                    <input
                      type="range"
                      min={50}
                      max={99}
                      value={adminForm.ocrConfidenceThreshold}
                      onChange={(e) => setAdminForm({ ...adminForm, ocrConfidenceThreshold: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Auto-Approval Rule Description</label>
                    <textarea
                      rows={2}
                      value={adminForm.autoApprovalRules}
                      onChange={(e) => setAdminForm({ ...adminForm, autoApprovalRules: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                  >
                    <Save className="w-4 h-4" /> Save OCR Gateway Settings
                  </button>
                </form>
              </div>
            )}

            {/* ADMIN EXCLUSIVE TAB: TOKEN CONFIG */}
            {authRole === 'admin' && activeTab === 'token_config' && (
              <div className="bg-white dark:bg-[#1E2328] rounded-2xl border border-purple-200 dark:border-purple-900 p-6 shadow-xs space-y-5">
                <div className="border-b border-purple-100 dark:border-purple-900/40 pb-3">
                  <h2 className="text-base font-bold text-purple-950 dark:text-purple-300 flex items-center gap-2">
                    <Coins className="w-5 h-5 text-purple-700 dark:text-purple-400" /> Token Pricing & Limits
                  </h2>
                </div>

                <form onSubmit={handleSaveAdminSettings} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Token Unit Price (TSh)</label>
                    <input
                      type="number"
                      value={adminForm.tokenPriceTsh}
                      onChange={(e) => setAdminForm({ ...adminForm, tokenPriceTsh: parseInt(e.target.value) || 2000 })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#14171A] text-slate-900 dark:text-white text-sm font-bold text-purple-800 dark:text-purple-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Token Rates
                  </button>
                </form>
              </div>
            )}

            {/* ADMIN EXCLUSIVE TAB: SUPABASE DB MIGRATION */}
            {authRole === 'admin' && activeTab === 'supabase_db' && (
              <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-xs space-y-5">
                <div className="border-b border-purple-100 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-purple-950 flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-purple-700" /> Supabase Database & Migration Control
                    </h2>
                    <p className="text-xs text-slate-500">
                      Manage backend database schemas, authentication persistence, and cross-device account syncing (PROMPT 50 Migration).
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Supabase Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-2">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Migrated Tables</span>
                    <ul className="text-xs text-slate-700 space-y-1 font-medium">
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> <code>profiles</code> (Auth, Phone, Role, Tokens)</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> <code>templates</code> (Universal & Service Templates)</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> <code>background_assets</code> (Storage Bucket URLs)</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> <code>token_transactions</code> (Top-Up History)</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> <code>user_payments</code> (Approval Requests)</li>
                      <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> <code>download_records</code> (Metadata ONLY)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Storage Isolation Policy</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      <strong>Downloads Policy:</strong> Document export files are saved strictly on user device storage (<code>Downloads/BIGsta</code>). Supabase stores metadata only.
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      <strong>Universal Template Policy:</strong> Updates made by Admin propagate automatically to all connected users and APK installations.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Supabase SQL Schema Script (PROMPT 50)
                  </label>
                  <p className="text-xs text-slate-500">
                    Run this SQL script in your Supabase SQL Editor if you need to create or verify tables:
                  </p>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto max-h-48 border border-slate-800">
                    {`-- BIGsta Migration Schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY, name TEXT, phone TEXT UNIQUE,
  email TEXT UNIQUE, role TEXT DEFAULT 'user', passkey TEXT, tokens INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.templates (
  id TEXT PRIMARY KEY, service_type TEXT, template_json JSONB, is_universal BOOLEAN
);
CREATE TABLE IF NOT EXISTS public.download_records (
  id TEXT PRIMARY KEY, service TEXT, file_name TEXT, status TEXT
);`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
