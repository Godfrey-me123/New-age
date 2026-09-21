import React, { useState, useMemo } from 'react';
import {
  Menu,
  CreditCard,
  UserCheck,
  ScrollText,
  Home,
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
  Phone,
  DownloadCloud,
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
  const { setActiveScreen, navigateSafely, loadSavedTemplates, authRole, logoutPasskey, setPasskeyManagerOpen, setManualAppModalOpen, submitManualRequest } = useTemplateStore();

  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('all');
  const [comingSoonService, setComingSoonService] = useState<ServiceItem | null>(null);
  const [manualRequestService, setManualRequestService] = useState<ServiceItem | null>(null);
  const [manualFullName, setManualFullName] = useState('');
  const [manualWhatsapp, setManualWhatsapp] = useState('');
  const [manualNormalPhone, setManualNormalPhone] = useState('');
  const [manualSubmitSuccess, setManualSubmitSuccess] = useState(false);
  const [savedCount, setSavedCount] = useState<number>(0);

  // Load saved count on mount
  React.useEffect(() => {
    loadSavedTemplates().then((list) => setSavedCount(list.length)).catch(() => {});
  }, [loadSavedTemplates]);

  // Escape key listener for coming soon modal
  React.useEffect(() => {
    if (!comingSoonService) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setComingSoonService(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [comingSoonService]);

  const storeServices = useTemplateStore((state) => state.services);

  // Icon mapping for dynamic loading
  const iconMap: Record<string, React.ComponentType<any>> = useMemo(() => ({
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
  }), []);

  // Color configurations for services
  const colorMap: Record<string, { iconBg: string; iconColor: string }> = useMemo(() => ({
    nida: { iconBg: 'bg-blue-500/15 border-blue-500/30', iconColor: 'text-[#47A5FF]' },
    driving_license: { iconBg: 'bg-amber-500/15 border-amber-500/30', iconColor: 'text-amber-400' },
    birth_certificate: { iconBg: 'bg-emerald-500/15 border-emerald-500/30', iconColor: 'text-emerald-400' },
    passport: { iconBg: 'bg-cyan-500/15 border-cyan-500/30', iconColor: 'text-cyan-400' },
    tin: { iconBg: 'bg-violet-500/15 border-violet-500/30', iconColor: 'text-violet-400' },
    business_license: { iconBg: 'bg-orange-500/15 border-orange-500/30', iconColor: 'text-orange-400' },
    heslb: { iconBg: 'bg-indigo-500/15 border-indigo-500/30', iconColor: 'text-indigo-400' },
    nhif: { iconBg: 'bg-rose-500/15 border-rose-500/30', iconColor: 'text-rose-400' },
    ajira: { iconBg: 'bg-teal-500/15 border-teal-500/30', iconColor: 'text-teal-400' },
    custom_studio: { iconBg: 'bg-blue-600/20 border-blue-500/40', iconColor: 'text-blue-400' },
  }), []);

  // Define services according to instructions
  const services: ServiceItem[] = useMemo(
    () => {
      const list: ServiceItem[] = storeServices.map((s) => {
        const colors = colorMap[s.id] || { iconBg: 'bg-gray-500/15 border-gray-500/30', iconColor: 'text-gray-400' };
        const IconComp = iconMap[s.iconName] || ScrollText;

        const action = s.id === 'nida'
          ? () => navigateSafely('nida', 'nida')
          : s.id === 'driving_license'
          ? () => navigateSafely('driving_license', 'driving_license')
          : s.id === 'nhif'
          ? () => navigateSafely('nhif', 'nhif')
          : () => navigateSafely('nida', s.id);

        return {
          id: s.id,
          name: s.name,
          authority: s.authority,
          description: s.description,
          category: s.category as ServiceCategory,
          icon: IconComp,
          iconBg: colors.iconBg,
          iconColor: colors.iconColor,
          status: s.active ? ('active' as const) : ('coming_soon' as const),
          badgeText: s.active ? `Active • Cost: ${s.tokenCost ?? 1} Token${(s.tokenCost ?? 1) > 1 ? 's' : ''}` : 'Coming Soon',
          action,
          primaryActionLabel: s.active ? 'Open' : undefined,
          features: s.features,
        };
      });

      // Append Custom Card Studio or Request Manual Application for standard users
      if (authRole === 'admin') {
        list.push({
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
        });
      } else {
        const manualService: ServiceItem = {
          id: 'custom_studio',
          name: 'Request Manual Application',
          authority: 'Support & Assistance',
          description: 'Request help from our staff for complex applications or custom card designs not available in the automated portal.',
          category: 'all',
          icon: Phone,
          iconBg: 'bg-blue-600/20 border-blue-500/40',
          iconColor: 'text-blue-400',
          status: 'active',
          badgeText: 'Active • Manual Support',
          action: () => setManualRequestService(manualService),
          primaryActionLabel: 'Request Assistance',
          features: ['Direct Staff Support', 'Custom Document Design', 'Application Review', 'WhatsApp Support'],
        };
        list.push(manualService);
      }

      return list;
    },
    [storeServices, setActiveScreen, colorMap, iconMap, authRole]
  );

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesCategory =
        selectedCategory === 'all' ||
        service.category === selectedCategory ||
        service.id === 'custom_studio';

      const isReady = service.status === 'active';

      const matchesSearch =
        searchQuery.trim() === '' ||
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch && isReady;
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
    <div className="min-h-screen bg-[#D8D2CE] text-[#101010] flex flex-col selection:bg-[#B5A5FF] selection:text-[#101010]">
      {/* 1. PROFESSIONAL APP HEADER */}
      <header className="sticky top-0 z-40 bg-[#D8D2CE]/95 backdrop-blur-md border-b border-[#E7E2DE] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        {/* Brand & App Name */}
        <div className="flex items-center gap-3">
          {/* Menu Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMenuDrawerOpen(true)}
            className="p-2 rounded-xl bg-[#E7E2DE] hover:bg-[#dad5d0] text-[#101010] border border-[#dad5d0] transition-colors flex items-center justify-center cursor-pointer"
            title="Open Services Menu"
            aria-label="Open Services Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#101010]" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#101010] text-sm sm:text-base tracking-tight font-sans">
                BIGsta
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E7E2DE] text-[#101010] border border-[#dad5d0]">
                <ShieldCheck className="w-3 h-3 text-[#101010]" />
                <span>Service Portal</span>
              </span>
            </div>
            <span className="text-[11px] text-[#101010]/70 font-medium truncate max-w-[220px] sm:max-w-none hidden sm:inline">
              National Documents & Card Specification Platform
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
              type="button"
              onClick={() => setActiveScreen('downloads')}
              className="p-2 sm:p-2.5 rounded-xl bg-[#E7E2DE] hover:bg-[#dad5d0] text-[#101010] border border-[#dad5d0] transition-colors flex items-center justify-center cursor-pointer"
              title="Downloads Center"
            >
              <DownloadCloud className="w-5 h-5 text-blue-600" />
            </button>
          
          {/* Custom Designer Direct Button (Admin Only) */}
          {authRole === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveScreen('upload')}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-[#E7E2DE] hover:bg-[#dad5d0] border border-[#dad5d0] text-xs font-bold text-[#101010] rounded-2xl transition-all shadow-xs cursor-pointer whitespace-nowrap"
              title="Card Studio"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#101010]" />
              <span>Studio</span>
            </button>
          )}

          {/* Saved Templates Button (Admin Only) */}
          {authRole === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveScreen('templates')}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#101010] hover:bg-[#222222] text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md group cursor-pointer whitespace-nowrap"
              title="Templates"
            >
              <FolderOpen className="w-4 h-4 text-[#B5A5FF] group-hover:scale-110 transition-transform" />
              <span>Templates</span>
              {savedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#B5A5FF] text-[#101010] text-[10px] font-extrabold">
                  {savedCount}
                </span>
              )}
            </button>
          )}
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
              iconBg: 'bg-[#B5A5FF]',
              iconColor: 'text-[#101010]',
              status: 'coming_soon',
              badgeText: 'Coming Soon',
              action: () => {},
              features: srv.features,
            });
          }
        }}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-4 sm:py-10 flex flex-col pb-20 sm:pb-10">
        {/* 2. WELCOME SECTION */}
        <div className="mb-4 sm:mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-[#E7E2DE]">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-[#E7E2DE] border border-[#dad5d0] text-[#101010] text-[11px] sm:text-xs font-bold tracking-wide mb-0.5 sm:mb-1">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#101010]" />
              <span>Official Document Services</span>
            </div>

            <h1 className="text-xl sm:text-4xl font-extrabold text-[#101010] tracking-tight">
              Choose a Service
            </h1>

            <p className="text-[#101010]/80 text-sm sm:text-base max-w-2xl leading-relaxed font-medium hidden sm:block">
              Select the service you want to continue with. Auto-fill verified credentials, generate compliant ID templates, or customize credentials with precision.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-72 md:w-80 relative shrink-0">
            <Search className="w-4.5 h-4.5 text-[#101010]/60 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="search-input w-full pl-11 pr-9 focus:outline-none focus:ring-2 focus:ring-[#101010]/20 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#101010]/60 hover:text-[#101010] p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters (Horizontal Action Row) */}
        <div className="mb-6">
          <HorizontalActionRow className="gap-2.5 pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`filter-chip cursor-pointer transition-all ${isActive ? 'active shadow-sm font-bold' : 'font-semibold hover:bg-[#dad5d0]'}`}
                >
                  {cat.label}
                </button>
              );
            })}
          </HorizontalActionRow>
        </div>

        {/* 3. SERVICE SELECTION GRID */}
        {filteredServices.length === 0 ? (
          <div className="py-16 text-center bg-[#E7E2DE] rounded-[28px] border-none p-8 shadow-xs">
            <Search className="w-8 h-8 text-[#101010]/60 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#101010] mb-1">No services found</h3>
            <p className="text-xs text-[#101010]/70 max-w-sm mx-auto mb-4 font-medium">
              No service matching "{searchQuery}" in this category. Try adjusting your search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-5 py-2.5 bg-[#101010] hover:bg-[#222222] text-xs font-bold text-white rounded-2xl cursor-pointer shadow-sm"
            >
              Reset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 pb-8 sm:pb-12">
            {filteredServices.map((service, idx) => {
              const IconComponent = service.icon;
              const isActive = service.status === 'active';

              // Determine card class mapping according to instructions:
              // - NIDA Services -> #B5A5FF (.card-nida)
              // - Custom Studio -> #FF9A5A (.card-highlight)
              // - Birth Certificate / Urgent -> #FF6839 (.card-urgent)
              // - Others -> #E7E2DE (.card-default)
              let cardBgClass = 'card-default';
              if (service.id === 'nida') {
                cardBgClass = 'card-nida';
              } else if (service.id === 'custom_studio') {
                cardBgClass = 'card-highlight';
              } else if (service.id === 'birth_certificate') {
                cardBgClass = 'card-urgent';
              }

              return (
                <div
                  key={`${service.id}-${idx}`}
                  onClick={() => handleCardClick(service)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(service);
                    }
                  }}
                  className={`card ${cardBgClass} transition-all duration-200 hover:-translate-y-1 active:scale-[0.99] cursor-pointer select-none group min-h-0 sm:min-h-[220px] w-full max-w-full`}
                >
                  {/* Top Card Row: Icon & Status Badge */}
                  <div>
                    <div className="flex items-center sm:items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-4">
                      {/* Icon */}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#101010] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-[#101010] text-white shadow-xs">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#B5A5FF] animate-pulse" />
                            <span className="hidden sm:inline">{service.badgeText}</span>
                            <span className="sm:hidden">Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#101010]/10 text-[#101010]">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#101010]" />
                            <span className="hidden sm:inline">Coming Soon</span>
                            <span className="sm:hidden">Soon</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Service Name & Authority (Authority hidden on mobile for Title-Only cards) */}
                    <div className="mb-1 sm:mb-2">
                      <h3 className="card-title text-sm sm:text-lg font-bold text-[#101010] truncate sm:whitespace-normal">
                        {service.name}
                      </h3>
                      <p className="text-xs font-bold text-[#101010]/70 hidden sm:block">
                        {service.authority}
                      </p>
                    </div>

                    {/* Short Description (Hidden on mobile for Title-Only cards) */}
                    <p className="card-description line-clamp-2 hidden sm:block">
                      {service.description}
                    </p>
                  </div>

                  {/* Circular Action Arrow Button */}
                  <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-black/10 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#101010]">
                      {isActive ? (service.primaryActionLabel || 'Open') : 'Info'}
                    </span>

                    <button
                      type="button"
                      className="card-arrow-btn w-8 h-8 sm:w-11 sm:h-11 group-hover:scale-110 transition-transform shadow-md shrink-0 flex items-center justify-center"
                      title={isActive ? service.name : 'Coming Soon'}
                    >
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER QUICK ACTIONS / SYSTEM CAPABILITIES */}
        <div className="mt-auto pt-6 border-t border-[#E7E2DE] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#101010]/70 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#101010]" />
            <span>CR80 Millimeter Precision Engine • Tanzania Standards Compliant</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveScreen('upload')}
              className="text-[#101010] hover:underline font-bold cursor-pointer"
            >
              Upload Card Background
            </button>
            <span>•</span>
          {authRole === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveScreen('templates')}
              className="text-[#101010] hover:underline font-bold cursor-pointer"
            >
              Preset Templates
            </button>
          )}
          </div>
        </div>

        {/* Global Footer */}
        <AppFooter />
      </main>

      {/* COMING SOON MODAL */}
      {comingSoonService && (
        <div
          onClick={() => setComingSoonService(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#E7E2DE] border-none rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left text-[#101010] cursor-default"
          >
            <button
              type="button"
              onClick={() => setComingSoonService(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#101010]/10 text-[#101010] hover:bg-[#101010] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#101010] text-white shadow-xs">
                {React.createElement(comingSoonService.icon, {
                  className: 'w-6 h-6 stroke-[2.2]',
                })}
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#101010]/10 text-[#101010]">
                  Feature In Development
                </span>
                <h3 className="text-lg font-bold text-[#101010] mt-1">
                  {comingSoonService.name}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#101010]/80 leading-relaxed mb-4 font-medium">
              {comingSoonService.description}
            </p>

            <div className="p-4 bg-[#D8D2CE] rounded-2xl mb-5 space-y-2">
              <span className="text-[11px] font-extrabold text-[#101010] block uppercase tracking-wider">
                Planned Features:
              </span>
              <ul className="space-y-1.5 text-xs text-[#101010]">
                {comingSoonService.features?.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#101010] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const srv = comingSoonService;
                  setComingSoonService(null);
                  setManualAppModalOpen(true, srv);
                }}
                className="w-full sm:flex-1 py-3 px-5 bg-[#101010] hover:bg-[#222222] text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Request Manual Application</span>
              </button>

              <button
                type="button"
                onClick={() => setComingSoonService(null)}
                className="w-full sm:w-auto py-3 px-5 bg-[#D8D2CE] hover:bg-[#dad5d0] text-[#101010] rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL APPLICATION REQUEST FORM MODAL */}
      {manualRequestService && (
        <div
          onClick={() => setManualRequestService(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#E7E2DE] border-none rounded-[28px] max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-left text-[#101010] cursor-default"
          >
            <button
              type="button"
              onClick={() => setManualRequestService(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-[#101010]/10 text-[#101010] hover:bg-[#101010] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#101010] text-white shadow-xs">
                {React.createElement(manualRequestService.icon, {
                  className: 'w-6 h-6 stroke-[2.2]',
                })}
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#101010]/10 text-[#101010]">
                  Manual Assistance Form
                </span>
                <h3 className="text-lg font-bold text-[#101010] mt-1">
                  {manualRequestService.name}
                </h3>
              </div>
            </div>

            {manualSubmitSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold text-[#101010]">Request Submitted Successfully!</h4>
                <p className="text-xs text-[#101010]/70 max-w-xs mx-auto">
                  Your manual application has been received. Our administrators will review your details and contact you via WhatsApp or phone call.
                </p>
                <button
                  type="button"
                  onClick={() => setManualRequestService(null)}
                  className="w-full py-3 bg-[#101010] text-white text-xs font-bold rounded-2xl hover:bg-[#252525] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!manualFullName.trim() || !manualWhatsapp.trim()) {
                    alert('Please enter your full name and WhatsApp contact number.');
                    return;
                  }
                  submitManualRequest({
                    serviceId: manualRequestService.id,
                    serviceName: manualRequestService.name,
                    fullName: manualFullName,
                    whatsappNumber: manualWhatsapp,
                    normalNumber: manualNormalPhone || manualWhatsapp,
                  });
                  setManualSubmitSuccess(true);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#101010]/80 mb-1.5">
                    Applicant Full Names *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualFullName}
                    onChange={(e) => setManualFullName(e.target.value)}
                    placeholder="e.g. Juma Ally Rashidi"
                    className="w-full px-4 py-3 bg-white border border-[#C8C2BE] rounded-xl text-xs font-semibold text-[#101010] focus:outline-none focus:border-[#101010]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#101010]/80 mb-1.5">
                    WhatsApp Contact Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualWhatsapp}
                    onChange={(e) => setManualWhatsapp(e.target.value)}
                    placeholder="e.g. +255 712 345 678"
                    className="w-full px-4 py-3 bg-white border border-[#C8C2BE] rounded-xl text-xs font-semibold text-[#101010] focus:outline-none focus:border-[#101010]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#101010]/80 mb-1.5">
                    Normal Call Contact Number
                  </label>
                  <input
                    type="text"
                    value={manualNormalPhone}
                    onChange={(e) => setManualNormalPhone(e.target.value)}
                    placeholder="e.g. 0712 345 678 (Optional if same as WhatsApp)"
                    className="w-full px-4 py-3 bg-white border border-[#C8C2BE] rounded-xl text-xs font-semibold text-[#101010] focus:outline-none focus:border-[#101010]"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#101010] hover:bg-[#222222] text-white rounded-2xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ScrollText className="w-4 h-4" />
                    <span>Submit Application</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualRequestService(null)}
                    className="py-3 px-5 bg-[#D8D2CE] hover:bg-[#dad5d0] text-[#101010] rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
