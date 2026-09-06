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
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000] flex flex-col selection:bg-[#CEE9B9] selection:text-[#000000]">
      {/* 1. PROFESSIONAL APP HEADER */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E7E9EB] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Brand & App Name */}
        <div className="flex items-center gap-3">
          {/* Menu Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuDrawerOpen(true)}
            className="p-2 rounded-xl bg-[#E7E9EB] hover:bg-[#dadcdc] text-[#000000] border border-[#E7E9EB] transition-colors flex items-center justify-center cursor-pointer"
            title="Open Services Menu"
            aria-label="Open Services Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#000000]" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-[#000000] flex items-center justify-center font-black text-white text-sm shadow-xs shrink-0">
            ID
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#000000] text-sm sm:text-base tracking-tight font-sans">
                ID Template Studio
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#CEE9B9] text-[#000000] border border-[#b8df9d]">
                <ShieldCheck className="w-3 h-3 text-[#000000]" />
                <span>Service Portal</span>
              </span>
            </div>
            <span className="text-[11px] text-[#555555] font-medium truncate max-w-[220px] sm:max-w-none">
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
            className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#E7E9EB] text-xs font-semibold text-[#000000] rounded-xl transition-all shadow-xs cursor-pointer"
            title="Upload custom card background or open blank canvas"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#000000]" />
            <span>Card Studio</span>
          </button>

          {/* Saved Templates Button */}
          <button
            type="button"
            onClick={() => setActiveScreen('templates')}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#000000] hover:bg-[#222222] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md group cursor-pointer"
            title="Browse Saved and Built-in Card Templates"
          >
            <FolderOpen className="w-4 h-4 text-[#CEE9B9] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Templates Library</span>
            <span className="sm:hidden">Templates</span>
            {savedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#CEE9B9] text-[#000000] text-[10px] font-bold">
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
              iconBg: 'bg-[#CEE9B9]',
              iconColor: 'text-[#000000]',
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
        <div className="mb-8 sm:mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E7E9EB]">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CEE9B9] border border-[#b8df9d] text-[#000000] text-xs font-bold tracking-wide mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#000000]" />
              <span>Official Document Services</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#000000] tracking-tight">
              Choose a Service
            </h1>

            <p className="text-[#555555] text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
              Select the service you want to continue with. Auto-fill verified credentials, generate compliant ID templates, or customize credentials with precision.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-72 md:w-80 relative shrink-0">
            <Search className="w-4 h-4 text-[#777777] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g. NIDA, Passport, TIN)..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#FFFFFF] border border-[#E7E9EB] focus:border-[#000000] rounded-xl text-xs sm:text-sm text-[#000000] placeholder:text-[#888888] focus:outline-none transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#000000] p-0.5 rounded"
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#000000] text-[#FFFFFF] shadow-sm'
                      : 'bg-[#E7E9EB] text-[#000000] hover:bg-[#dadcdc]'
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
          <div className="py-16 text-center bg-[#FFFFFF] rounded-2xl border border-[#E7E9EB] p-8 shadow-xs">
            <Search className="w-8 h-8 text-[#888888] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#000000] mb-1">No services found</h3>
            <p className="text-xs text-[#555555] max-w-sm mx-auto mb-4">
              No service matching "{searchQuery}" in this category. Try adjusting your search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-[#000000] hover:bg-[#222222] text-xs font-semibold text-white rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pb-12">
            {filteredServices.map((service, index) => {
              const IconComponent = service.icon;
              const isActive = service.status === 'active';
              const isGreenCard = index % 2 === 0;

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
                  className={`group relative rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between text-left border cursor-pointer select-none shadow-xs hover:shadow-md ${
                    isActive
                      ? isGreenCard
                        ? 'bg-[#CEE9B9] border-[#b8df9d] text-[#000000] hover:-translate-y-0.5 active:scale-[0.99]'
                        : 'bg-[#ECA6FC] border-[#e08ef2] text-[#000000] hover:-translate-y-0.5 active:scale-[0.99]'
                      : 'bg-[#FFFFFF] border-[#E7E9EB] text-[#000000] hover:bg-[#F8FAFC] hover:-translate-y-0.5 active:scale-[0.99]'
                  }`}
                >
                  {/* Top Card Row: Icon & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      {/* Consistent Professional Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                          isActive
                            ? 'bg-[#000000] text-[#FFFFFF] border-[#000000]'
                            : 'bg-[#E7E9EB] text-[#000000] border-[#E7E9EB]'
                        }`}
                      >
                        <IconComponent className="w-6 h-6 stroke-[2.2]" />
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#000000] text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CEE9B9] animate-pulse" />
                            <span>{service.badgeText}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E7E9EB] text-[#000000] border border-[#dadcdc]">
                            <Clock className="w-3 h-3 text-[#000000]" />
                            <span>Coming Soon</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Service Name & Authority */}
                    <div className="mb-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-[#000000] leading-snug">
                        {service.name}
                      </h3>
                      <p className="text-[11px] sm:text-xs font-bold text-[#333333] mt-0.5">
                        {service.authority}
                      </p>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-[#222222] font-medium leading-relaxed line-clamp-2 mb-4">
                      {service.description}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs mt-auto">
                    {isActive ? (
                      <>
                        <span className="font-bold text-[#000000] flex items-center gap-1">
                          <span>{service.primaryActionLabel || 'Get Started'}</span>
                        </span>
                        <div className="w-8 h-8 rounded-xl bg-[#000000] text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-[#555555] font-medium flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>In Development</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#555555]" />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER QUICK ACTIONS / SYSTEM CAPABILITIES */}
        <div className="mt-auto pt-6 border-t border-[#E7E9EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666666]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#000000]" />
            <span className="font-medium">CR80 Millimeter Precision Engine • Tanzania Standards Compliant</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveScreen('upload')}
              className="text-[#000000] hover:underline font-medium cursor-pointer"
            >
              Upload Card Background
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveScreen('templates')}
              className="text-[#000000] hover:underline font-medium cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#E7E9EB] rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left text-[#000000]">
            <button
              type="button"
              onClick={() => setComingSoonService(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#555555] hover:text-[#000000] hover:bg-[#E7E9EB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#CEE9B9] border border-[#b8df9d] shadow-xs"
              >
                {React.createElement(comingSoonService.icon, {
                  className: 'w-6 h-6 stroke-[2.2] text-[#000000]',
                })}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E7E9EB] text-[#000000]">
                  Feature In Development
                </span>
                <h3 className="text-lg font-bold text-[#000000] mt-1">
                  {comingSoonService.name}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#333333] leading-relaxed mb-4">
              {comingSoonService.description}
            </p>

            <div className="p-3 bg-[#E7E9EB] rounded-xl mb-5 space-y-2">
              <span className="text-[11px] font-bold text-[#000000] block uppercase tracking-wider">
                Planned Features:
              </span>
              <ul className="space-y-1.5 text-xs text-[#222222]">
                {comingSoonService.features?.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#000000] shrink-0" />
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
                className="w-full sm:flex-1 py-2.5 px-4 bg-[#000000] hover:bg-[#222222] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Open Custom Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setComingSoonService(null)}
                className="w-full sm:w-auto py-2.5 px-4 bg-[#E7E9EB] hover:bg-[#dadcdc] text-[#000000] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
