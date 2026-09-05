import React, { useState, useMemo } from 'react';
import {
  Menu,
  CreditCard,
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
  Search,
  ArrowRight,
  ShieldCheck,
  Clock,
  X,
  ChevronRight,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { ServiceMenuDrawer } from './navigation/ServiceMenuDrawer';
import { HorizontalActionRow } from './common/HorizontalActionRow';
import { AppFooter } from './common/AppFooter';

export type ServiceCategory = 'all' | 'identity' | 'civil' | 'education' | 'finance' | 'health';

export interface ServiceItem {
  id: string;
  name: string;
  authority: string;
  description: string;
  category: ServiceCategory;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  status: 'active' | 'coming_soon';
  badgeText: string;
  action: () => void;
  primaryActionLabel?: string;
  features?: string[];
}

export const HomeScreen: React.FC = () => {
  const { setActiveScreen, loadSavedTemplates } = useTemplateStore();

  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [comingSoonService, setComingSoonService] = useState<ServiceItem | null>(null);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Load saved count on mount
  React.useEffect(() => {
    loadSavedTemplates().then((list) => setSavedCount(list.length)).catch(() => {});
  }, [loadSavedTemplates]);

  // Define services according to instructions
  const services: ServiceItem[] = useMemo(
    () => [
      {
        id: 'nida',
        name: 'NIDA Services',
        authority: 'National Identification Authority',
        description: 'Instant auto-fill, verification & CR80 card generation for Front & Back National IDs.',
        category: 'identity',
        icon: UserCheck,
        iconBg: 'bg-blue-500/15 border-blue-500/30',
        iconColor: 'text-[#47A5FF]',
        status: 'active',
        badgeText: 'Active • Auto-Fill Ready',
        action: () => setActiveScreen('nida'),
        primaryActionLabel: 'Open NIDA Form',
        features: ['20-Digit ID Verification', 'Biometric Photo Cropping', 'Digital Signature Pad', 'Barcode Sync'],
      },
      {
        id: 'birth_certificate',
        name: 'Birth Certificate Services',
        authority: 'RITA Civil Registration',
        description: 'Official birth certificate issuance, verification & digital civil registry documentation.',
        category: 'civil',
        icon: ScrollText,
        iconBg: 'bg-emerald-500/15 border-emerald-500/30',
        iconColor: 'text-emerald-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['Birth Certificate Archiving', 'Legal Certification', 'Official Watermark Validation'],
      },
      {
        id: 'driving_license',
        name: 'Driving License Services',
        authority: 'Traffic & Vehicle Inspection',
        description: 'Driver permit issuance, class endorsements & digital driver identification cards.',
        category: 'civil',
        icon: Car,
        iconBg: 'bg-amber-500/15 border-amber-500/30',
        iconColor: 'text-amber-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['Class Endorsements (A, B, C, D, E)', 'Penalty Point Tracking', 'Digital QR Validation'],
      },
      {
        id: 'passport',
        name: 'Passport Services',
        authority: 'Immigration Services Department',
        description: 'East African e-Passport booklet formatting, bio-data pages & travel credentials.',
        category: 'identity',
        icon: Globe,
        iconBg: 'bg-cyan-500/15 border-cyan-500/30',
        iconColor: 'text-cyan-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['ICAO 9303 Compliant MRZ', 'Biometric Chip Layout', 'Diplomatic & Ordinary Profiles'],
      },
      {
        id: 'tin',
        name: 'TIN Services',
        authority: 'Tanzania Revenue Authority',
        description: 'Taxpayer Identification Number cards, tax compliance credentials & PIN certificates.',
        category: 'finance',
        icon: Receipt,
        iconBg: 'bg-violet-500/15 border-violet-500/30',
        iconColor: 'text-violet-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['Taxpayer PIN Sync', 'QR Compliance Stamp', 'Corporate & Individual Formats'],
      },
      {
        id: 'business_license',
        name: 'Business License Services',
        authority: 'BRELA & Municipal Authorities',
        description: 'Commercial enterprise registration certificates, municipal trade permits & corporate IDs.',
        category: 'finance',
        icon: Building2,
        iconBg: 'bg-orange-500/15 border-orange-500/30',
        iconColor: 'text-orange-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['BRELA Certificate Layout', 'Annual Renewal Badges', 'Sector Trade Validation'],
      },
      {
        id: 'heslb',
        name: 'HESLB Student Loans Services',
        authority: 'Higher Education Students’ Loans Board',
        description: 'Student beneficiary loan allocation cards, academic verification & repayment IDs.',
        category: 'education',
        icon: GraduationCap,
        iconBg: 'bg-indigo-500/15 border-indigo-500/30',
        iconColor: 'text-indigo-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['Index Number Verification', 'Institution Allocation Status', 'Beneficiary Smart Badges'],
      },
      {
        id: 'nhif',
        name: 'NHIF Services',
        authority: 'National Health Insurance Fund',
        description: 'Healthcare membership smart cards, dependent coverage validation & biometric health passes.',
        category: 'health',
        icon: HeartPulse,
        iconBg: 'bg-rose-500/15 border-rose-500/30',
        iconColor: 'text-rose-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['Principal & Dependent Mapping', 'Hospital Tier Endorsements', 'Smart Card Chip Specs'],
      },
      {
        id: 'ajira',
        name: 'Ajira Portal Services',
        authority: 'Public Service Recruitment Secretariat',
        description: 'Government job application portfolios, civil service recruitment IDs & applicant profiles.',
        category: 'education',
        icon: Briefcase,
        iconBg: 'bg-teal-500/15 border-teal-500/30',
        iconColor: 'text-teal-400',
        status: 'coming_soon',
        badgeText: 'Coming Soon',
        action: () => {},
        features: ['Civil Service Application Sync', 'Cadre Certificate Validation', 'Interview Pass Generation'],
      },
      {
        id: 'custom_studio',
        name: 'Custom Card Studio',
        authority: 'ID Template Designer',
        description: 'Create custom employee badges, student cards, event passes or upload existing card backgrounds.',
        category: 'all',
        icon: Layers,
        iconBg: 'bg-blue-600/20 border-blue-500/40',
        iconColor: 'text-blue-400',
        status: 'active',
        badgeText: 'Active • Millimeter Canvas',
        action: () => setActiveScreen('upload'),
        primaryActionLabel: 'Open Card Studio',
        features: ['Millimeter Precision (CR80)', 'Custom Image Backgrounds', 'Smart Magnetic Snap', 'PDF & SVG Export'],
      },
    ],
    [setActiveScreen]
  );

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        service.category === selectedCategory ||
        service.id === 'custom_studio';

      const matchesSearch =
        searchQuery.trim() === '' ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [services, selectedCategory, searchQuery]);

  const categories: { key: ServiceCategory; label: string }[] = [
    { key: 'all', label: 'All Services' },
    { key: 'identity', label: 'Identity & Civil' },
    { key: 'education', label: 'Education & Jobs' },
    { key: 'finance', label: 'Revenue & Business' },
    { key: 'health', label: 'Health & Medical' },
  ];

  const handleCardClick = (service: ServiceItem) => {
    if (service.status === 'active') {
      service.action();
    } else {
      setComingSoonService(service);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col selection:bg-[#47A5FF] selection:text-white">
      {/* 1. PROFESSIONAL APP HEADER */}
      <header className="sticky top-0 z-40 bg-[#0F141E]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        {/* Brand & App Name */}
        <div className="flex items-center gap-3">
          {/* Menu Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuDrawerOpen(true)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 transition-colors flex items-center justify-center cursor-pointer"
            title="Open Services Menu"
            aria-label="Open Services Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#47A5FF]" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-[#47A5FF] flex items-center justify-center font-black text-white text-sm shadow-[0_0_20px_rgba(71,165,255,0.35)] shrink-0 border border-blue-400/40">
            ID
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight font-sans">
                ID Template Studio
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-[#47A5FF] border border-blue-500/25">
                <ShieldCheck className="w-3 h-3 text-[#47A5FF]" />
                <span>Service Portal</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[220px] sm:max-w-none">
              National Documents & Card Specification Platform
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Custom Designer Direct Button */}
          <button
            type="button"
            onClick={() => setActiveScreen('upload')}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white rounded-xl transition-all shadow-sm cursor-pointer"
            title="Upload custom card background or open blank canvas"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#47A5FF]" />
            <span>Card Studio</span>
          </button>

          {/* Saved Templates Button */}
          <button
            type="button"
            onClick={() => setActiveScreen('templates')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#161B26] hover:bg-[#1E2536] border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md group cursor-pointer"
            title="Browse Saved and Built-in Card Templates"
          >
            <FolderOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Templates Library</span>
            <span className="sm:hidden">Templates</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Services Navigation Drawer */}
      <ServiceMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onSelectInfoService={(srv) => {
          const matched = services.find((s) => s.id === srv.id);
          if (matched) {
            setComingSoonService(matched);
          } else {
            setComingSoonService({
              id: srv.id,
              name: srv.name,
              authority: srv.authority,
              description: srv.description,
              category: 'all',
              icon: CreditCard,
              iconBg: 'bg-blue-500/15 border-blue-500/30',
              iconColor: 'text-[#47A5FF]',
              status: 'coming_soon',
              badgeText: 'Coming Soon',
              action: () => {},
              features: srv.features,
            });
          }
        }}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10 flex flex-col">
        {/* 2. WELCOME SECTION */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#47A5FF] text-xs font-semibold tracking-wide mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#47A5FF]" />
              <span>Official Document Services</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Choose a Service
            </h1>

            <p className="text-slate-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Select the service you want to continue with. Auto-fill verified credentials, generate compliant ID templates, or customize credentials with precision.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-72 md:w-80 relative shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g. NIDA, Passport, TIN)..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#121722] border border-slate-700/80 focus:border-[#47A5FF] rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters (Horizontal Action Row) */}
        <div className="mb-6">
          <HorizontalActionRow className="gap-2 pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-[#47A5FF] text-white border-[#47A5FF] shadow-[0_2px_12px_rgba(71,165,255,0.35)]'
                      : 'bg-[#121722] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </HorizontalActionRow>
        </div>

        {/* 3. SERVICE SELECTION GRID */}
        {filteredServices.length === 0 ? (
          <div className="py-16 text-center bg-[#121722]/60 rounded-2xl border border-slate-800/80 p-8">
            <Search className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No services found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              No service matching "{searchQuery}" in this category. Try adjusting your search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl border border-slate-700 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pb-12">
            {filteredServices.map((service) => {
              const IconComponent = service.icon;
              const isActive = service.status === 'active';

              return (
                <div
                  key={service.id}
                  onClick={() => handleCardClick(service)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(service);
                    }
                  }}
                  className={`group relative rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between text-left border cursor-pointer select-none ${
                    isActive
                      ? 'bg-gradient-to-b from-[#131926] to-[#0E1420] border-slate-700/80 hover:border-[#47A5FF]/70 shadow-md hover:shadow-[0_8px_30px_rgba(71,165,255,0.18)] hover:-translate-y-0.5 active:scale-[0.99]'
                      : 'bg-[#0E121B]/80 border-slate-800/80 hover:border-slate-700 hover:bg-[#121622] hover:-translate-y-0.5 active:scale-[0.99]'
                  }`}
                >
                  {/* Top Card Row: Icon & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Consistent Professional Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105 shrink-0 ${service.iconBg}`}
                      >
                        <IconComponent className={`w-6 h-6 stroke-[2.2] ${service.iconColor}`} />
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{service.badgeText}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/90 text-slate-400 border border-slate-700/70">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Coming Soon</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Service Name & Authority */}
                    <div className="mb-2">
                      <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-[#47A5FF] transition-colors leading-snug">
                        {service.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs font-medium text-[#7D8287] mt-0.5">
                        {service.authority}
                      </p>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                      {service.description}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs mt-auto">
                    {isActive ? (
                      <>
                        <span className="font-semibold text-[#47A5FF] group-hover:underline flex items-center gap-1">
                          <span>{service.primaryActionLabel || 'Get Started'}</span>
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#47A5FF] group-hover:bg-[#47A5FF] group-hover:text-white transition-all">
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          <span>In Development</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER QUICK ACTIONS / SYSTEM CAPABILITIES */}
        <div className="mt-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>CR80 Millimeter Precision Engine • Tanzania Standards Compliant</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveScreen('upload')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Upload Card Background
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveScreen('templates')}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Preset Templates
            </button>
          </div>
        </div>

        {/* Global Footer */}
        <AppFooter />
      </main>

      {/* COMING SOON MODAL */}
      {comingSoonService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121620] border border-slate-700/90 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setComingSoonService(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${comingSoonService.iconBg}`}
              >
                {React.createElement(comingSoonService.icon, {
                  className: `w-6 h-6 stroke-[2.2] ${comingSoonService.iconColor}`,
                })}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  Feature In Development
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {comingSoonService.name}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              {comingSoonService.description}
            </p>

            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                Planned Features:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {comingSoonService.features?.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#47A5FF] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setComingSoonService(null);
                  setActiveScreen('upload');
                }}
                className="w-full sm:flex-1 py-2.5 px-4 bg-[#47A5FF] hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-all shadow-[0_2px_15px_rgba(71,165,255,0.35)] cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Open Custom Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setComingSoonService(null)}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
