import React, { useEffect } from 'react';
import {
  Menu,
  X,
  Home,
  UserCheck,
  ScrollText,
  Car,
  Globe,
  Receipt,
  Building2,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Layers,
  FolderOpen,
  ChevronRight,
  Shield,
  CreditCard,
  Info,
} from 'lucide-react';
import { useTemplateStore } from '../../store/useTemplateStore';

export interface ServiceMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInfoService?: (service: { id: string; name: string; authority: string; description: string; features: string[] }) => void;
}

interface NavItem {
  id: string;
  name: string;
  authority: string;
  category: 'core' | 'identity' | 'civil' | 'education' | 'finance' | 'health';
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  status: 'active' | 'coming_soon';
  badgeText?: string;
  action: () => void;
  description?: string;
  features?: string[];
}

export const ServiceMenuDrawer: React.FC<ServiceMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectInfoService,
}) => {
  const { setActiveScreen, activeScreen } = useTemplateStore();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navItems: NavItem[] = [
    {
      id: 'home',
      name: 'Services Overview',
      authority: 'Portal Home',
      category: 'core',
      icon: Home,
      iconColor: 'text-[#47A5FF]',
      status: 'active',
      badgeText: 'Home',
      action: () => {
        setActiveScreen('home');
        onClose();
      },
    },
    {
      id: 'nida',
      name: 'NIDA Services',
      authority: 'National Identification Authority',
      category: 'identity',
      icon: UserCheck,
      iconColor: 'text-[#47A5FF]',
      status: 'active',
      badgeText: 'Active',
      action: () => {
        setActiveScreen('nida');
        onClose();
      },
      description: 'Instant auto-fill, verification & CR80 card generation for Front & Back National IDs.',
      features: ['20-Digit ID Verification', 'Biometric Photo Upload', 'Digital Signature Pad', 'Barcode Sync'],
    },
    {
      id: 'custom_studio',
      name: 'Custom Card Studio',
      authority: 'ID Template Designer',
      category: 'core',
      icon: Layers,
      iconColor: 'text-blue-400',
      status: 'active',
      badgeText: 'Active',
      action: () => {
        setActiveScreen('upload');
        onClose();
      },
      description: 'Create custom employee badges, student cards, or upload background artwork.',
      features: ['CR80 Millimeter Layout', 'Custom Image Backgrounds', 'Smart Magnetic Snap', 'PDF & SVG Export'],
    },
    {
      id: 'templates',
      name: 'Saved Templates Library',
      authority: 'Template Storage',
      category: 'core',
      icon: FolderOpen,
      iconColor: 'text-amber-400',
      status: 'active',
      badgeText: 'Active',
      action: () => {
        setActiveScreen('templates');
        onClose();
      },
      description: 'Manage, duplicate, search, and export saved card templates.',
      features: ['Local Storage Persistence', 'JSON Import & Export', 'Template Duplication'],
    },
    {
      id: 'birth_certificate',
      name: 'Birth Certificate Services',
      authority: 'RITA Civil Registration',
      category: 'civil',
      icon: ScrollText,
      iconColor: 'text-emerald-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'birth_certificate',
          name: 'Birth Certificate Services',
          authority: 'RITA (Registration Insolvency and Trusteeship Agency)',
          description: 'Official birth certificate issuance, verification & digital civil registry documentation.',
          features: ['Civil Registration Archiving', 'Legal Certification Verification', 'Official Watermark Validation'],
        });
        onClose();
      },
    },
    {
      id: 'driving_license',
      name: 'Driving License Services',
      authority: 'Traffic & Vehicle Inspection',
      category: 'civil',
      icon: Car,
      iconColor: 'text-amber-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'driving_license',
          name: 'Driving License Services',
          authority: 'Traffic & Vehicle Inspection Division',
          description: 'Driver permit issuance, class endorsements & digital driver identification cards.',
          features: ['Class Endorsements (A, B, C, D, E)', 'Penalty Point Tracking', 'Digital QR Validation'],
        });
        onClose();
      },
    },
    {
      id: 'passport',
      name: 'Passport Services',
      authority: 'Immigration Services Department',
      category: 'identity',
      icon: Globe,
      iconColor: 'text-cyan-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'passport',
          name: 'Passport Services',
          authority: 'Immigration Services Department',
          description: 'East African e-Passport booklet formatting, bio-data pages & travel credentials.',
          features: ['ICAO 9303 Compliant MRZ', 'Biometric Chip Layout', 'Diplomatic & Ordinary Profiles'],
        });
        onClose();
      },
    },
    {
      id: 'tin',
      name: 'TIN Services',
      authority: 'Tanzania Revenue Authority',
      category: 'finance',
      icon: Receipt,
      iconColor: 'text-violet-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'tin',
          name: 'TIN Services',
          authority: 'Tanzania Revenue Authority (TRA)',
          description: 'Taxpayer Identification Number cards, tax compliance credentials & PIN certificates.',
          features: ['Taxpayer PIN Sync', 'QR Compliance Stamp', 'Corporate & Individual Formats'],
        });
        onClose();
      },
    },
    {
      id: 'business_license',
      name: 'Business License Services',
      authority: 'BRELA & Municipal Authorities',
      category: 'finance',
      icon: Building2,
      iconColor: 'text-orange-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'business_license',
          name: 'Business License Services',
          authority: 'BRELA & Municipal Authorities',
          description: 'Commercial enterprise registration certificates, municipal trade permits & corporate IDs.',
          features: ['BRELA Certificate Layout', 'Annual Renewal Badges', 'Sector Trade Validation'],
        });
        onClose();
      },
    },
    {
      id: 'heslb',
      name: 'HESLB Student Loans Services',
      authority: 'Higher Education Students’ Loans Board',
      category: 'education',
      icon: GraduationCap,
      iconColor: 'text-indigo-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'heslb',
          name: 'HESLB Student Loans Services',
          authority: 'Higher Education Students’ Loans Board (HESLB)',
          description: 'Student beneficiary loan allocation cards, academic verification & repayment IDs.',
          features: ['Index Number Verification', 'Institution Allocation Status', 'Beneficiary Smart Badges'],
        });
        onClose();
      },
    },
    {
      id: 'nhif',
      name: 'NHIF Services',
      authority: 'National Health Insurance Fund',
      category: 'health',
      icon: HeartPulse,
      iconColor: 'text-rose-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'nhif',
          name: 'NHIF Services',
          authority: 'National Health Insurance Fund (NHIF)',
          description: 'Healthcare membership smart cards, dependent coverage validation & biometric health passes.',
          features: ['Principal & Dependent Mapping', 'Hospital Tier Endorsements', 'Smart Card Chip Specs'],
        });
        onClose();
      },
    },
    {
      id: 'ajira',
      name: 'Ajira Portal Services',
      authority: 'Public Service Recruitment Secretariat',
      category: 'education',
      icon: Briefcase,
      iconColor: 'text-teal-400',
      status: 'coming_soon',
      badgeText: 'Coming Soon',
      action: () => {
        onSelectInfoService?.({
          id: 'ajira',
          name: 'Ajira Portal Services',
          authority: 'Public Service Recruitment Secretariat (PSRS)',
          description: 'Government job application portfolios, civil service recruitment IDs & applicant profiles.',
          features: ['Civil Service Application Sync', 'Cadre Certificate Validation', 'Interview Pass Generation'],
        });
        onClose();
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex font-sans animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-xs sm:max-w-sm bg-[#FFFFFF] border-r border-[#E7E9EB] text-[#000000] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-250"
        role="dialog"
        aria-modal="true"
        aria-label="Services Navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E9EB] bg-[#FFFFFF] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#000000] text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#000000] tracking-wide uppercase">
                BIGsta
              </h2>
              <p className="text-[11px] text-[#555555] font-semibold">Government & Identity Services</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#555555] hover:text-[#000000] hover:bg-[#E7E9EB] transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List - Vertically Scrollable */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 divide-y divide-[#E7E9EB]">
          {/* Active Workspaces */}
          <div className="pb-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#777777]">
              Workspace Navigation
            </div>
            {navItems.filter(item => item.category === 'core').map((item) => {
              const Icon = item.icon;
              const isActive = (item.id === 'home' && activeScreen === 'home') ||
                               (item.id === 'custom_studio' && (activeScreen === 'upload' || activeScreen === 'editor')) ||
                               (item.id === 'templates' && activeScreen === 'templates');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#000000] text-[#FFFFFF]'
                      : 'hover:bg-[#E7E9EB] text-[#000000]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-[#E7E9EB] text-[#000000]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{item.authority}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${isActive ? 'bg-white text-black' : 'bg-[#E7E9EB] text-[#000000]'}`}>
                    Active
                  </span>
                </button>
              );
            })}
          </div>

          {/* National & Public Services */}
          <div className="pt-3 pb-2 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#777777]">
              Public Services Directory
            </div>
            {navItems.filter(item => item.category !== 'core').map((item) => {
              const Icon = item.icon;
              const isNidaActive = item.id === 'nida' && activeScreen === 'nida';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isNidaActive
                      ? 'bg-[#000000] text-[#FFFFFF]'
                      : 'hover:bg-[#E7E9EB] text-[#000000]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isNidaActive ? 'bg-white/20 text-white' : 'bg-[#E7E9EB] text-[#000000]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{item.name}</div>
                      <div className={`text-[10px] truncate ${isNidaActive ? 'text-slate-300' : 'text-slate-500'}`}>{item.authority}</div>
                    </div>
                  </div>

                  {item.status === 'active' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#CEE9B9] text-[#000000] shrink-0">
                      Ready
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#555555] px-2 py-0.5 rounded-md bg-[#E7E9EB] shrink-0 font-medium">
                      Info
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#E7E9EB] bg-[#FFFFFF] shrink-0 text-center">
          <p className="text-[11px] text-[#555555] font-semibold">
            Standard CR80 (85.60 × 53.98 mm)
          </p>
          <p className="text-[10px] text-[#777777]">
            Precision card generation system
          </p>
        </div>
      </div>
    </div>
  );
};
