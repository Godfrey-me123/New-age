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
import { ensureTemplateFieldIds, sanitizeTemplateForSaving, SupportedBinding, isBackSideTemplate } from '../utils/templateMappingEngine';
import { getClosestValidWeight } from '../utils/fonts';
import {
  saveTemplateDB,
  getAllTemplatesDB,
  deleteTemplateDB,
  saveBackgroundDB,
  getAllBackgroundsDB,
  deleteBackgroundDB,
  saveStudioDraftDB,
  getStudioDraftDB,
  deleteStudioDraftDB,
} from '../utils/idb';

export interface DynamicElementRegistration {
  id: string;
  name: string;
  type: 'text';
  defaultText: string;
  bindingKey: SupportedBinding;
  getterKey: 'displayNameLine1' | string;
  computeValue: (formData: Record<string, any>) => string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface ManualApplicationRequest {
  id: string;
  fullName: string;
  whatsappNumber: string;
  normalCallNumber: string;
  serviceName: string;
  submittedAt: string;
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'COMPLETED';
  userPasskey?: string;
}

export interface ServiceValidationResult {
  allowed: boolean;
  reason?: 'NOT_LOGGED_IN' | 'DISABLED' | 'PAYMENT_REQUIRED' | 'OUT_OF_TOKENS' | 'NO_CARD_DATA';
  message?: string;
  cost?: number;
  remainingUsages?: number;
  paymentStatus?: PaymentStatus;
}

export function computeDisplayNameLine1(formData: Record<string, any>): string {
  const f = (formData?.firstName || '').trim();
  const m = (formData?.middleName || '').trim();
  return m ? `${f} ${m}` : f;
}

export const DYNAMIC_ELEMENT_REGISTRY: Record<string, DynamicElementRegistration> = {
  FULL_NAME: {
    id: 'full_name',
    name: 'Full Name',
    type: 'text',
    defaultText: '{{first_middle_name}}',
    bindingKey: 'FIRST_MIDDLE_NAME',
    getterKey: 'displayNameLine1',
    computeValue: (formData) => computeDisplayNameLine1(formData),
    defaultWidth: 50,
    defaultHeight: 6,
  },
  FIRST_MIDDLE_NAME: {
    id: 'first_middle_name',
    name: 'First Name + Middle Name',
    type: 'text',
    defaultText: '{{first_middle_name}}',
    bindingKey: 'FIRST_MIDDLE_NAME',
    getterKey: 'displayNameLine1',
    computeValue: (formData) => computeDisplayNameLine1(formData),
    defaultWidth: 50,
    defaultHeight: 6,
  },
  FIRST_NAME: {
    id: 'first_name',
    name: 'First Name',
    type: 'text',
    defaultText: '{{first_name}}',
    bindingKey: 'FIRST_NAME',
    getterKey: 'firstName',
    computeValue: (formData) => (formData?.firstName || '').trim(),
    defaultWidth: 35,
    defaultHeight: 6,
  },
  MIDDLE_NAME: {
    id: 'middle_name',
    name: 'Middle Name',
    type: 'text',
    defaultText: '{{middle_name}}',
    bindingKey: 'MIDDLE_NAME',
    getterKey: 'middleName',
    computeValue: (formData) => (formData?.middleName || '').trim(),
    defaultWidth: 35,
    defaultHeight: 6,
  },
  LAST_NAME: {
    id: 'last_name',
    name: 'Last Name',
    type: 'text',
    defaultText: '{{last_name}}',
    bindingKey: 'LAST_NAME',
    getterKey: 'lastName',
    computeValue: (formData) => (formData?.lastName || '').trim(),
    defaultWidth: 35,
    defaultHeight: 6,
  },
  NIDA_NUMBER: {
    id: 'nida_number',
    name: 'NIDA Number',
    type: 'text',
    defaultText: '{{nida_number}}',
    bindingKey: 'NIDA_NUMBER',
    getterKey: 'nidaNumber',
    computeValue: (formData) => (formData?.nidaNumber || '').trim(),
    defaultWidth: 45,
    defaultHeight: 6,
  },
};

export type AuthRole = 'admin' | 'user' | null;

export type PaymentStatus = 'PENDING' | 'ACTIVE' | 'EXHAUSTED' | 'DISABLED';

export interface PasskeyUsageHistoryItem {
  id: string;
  timestamp: string;
  serviceName: string;
  details?: string;
}

export interface UsagePackage {
  id: string;
  name: string;
  usages: number;
  price: string;
  active?: boolean;
}

export interface ServiceData {
  id: string;
  name: string;
  authority: string;
  description: string;
  category: string;
  iconName: string;
  active: boolean;
  tokenCost: number;
  features: string[];
  processingMode?: 'auto' | 'manual';
}

export const NIDA_USAGE_PACKAGES: UsagePackage[] = [
  { id: 'pkg_1', name: '1 Usage Package', usages: 1, price: 'TSh 10,000', active: true },
  { id: 'pkg_2', name: '2 Usages Package', usages: 2, price: 'TSh 15,000', active: true },
  { id: 'pkg_5', name: '5 Usages Package', usages: 5, price: 'TSh 25,000', active: true },
];

export const INITIAL_SERVICES: ServiceData[] = [
  {
    id: 'nida',
    name: 'NIDA Services',
    authority: 'National Identification Authority',
    description: 'Instant auto-fill, verification & CR80 card generation for Front & Back National IDs.',
    category: 'identity',
    iconName: 'UserCheck',
    active: true,
    tokenCost: 1,
    features: ['20-Digit ID Verification', 'Biometric Photo Cropping', 'Digital Signature Pad', 'Barcode Sync'],
    processingMode: 'auto',
  },
  {
    id: 'driving_license',
    name: 'Driving License Services',
    authority: 'Traffic & Vehicle Inspection',
    description: 'Driver permit issuance, class endorsements & digital driver identification cards.',
    category: 'civil',
    iconName: 'Car',
    active: true,
    tokenCost: 1,
    features: ['Class Endorsements (A, B, C, D, E)', 'Penalty Point Tracking', 'Digital QR Validation'],
    processingMode: 'auto',
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate Services',
    authority: 'RITA Civil Registration',
    description: 'Unofficial birth certificate issuance, verification & digital civil registry documentation.',
    category: 'civil',
    iconName: 'ScrollText',
    active: false,
    tokenCost: 1,
    features: ['Birth Certificate Archiving', 'Legal Certification', 'Unofficial Watermark Validation'],
    processingMode: 'auto',
  },
  {
    id: 'passport',
    name: 'Passport Services',
    authority: 'Immigration Services Department',
    description: 'East African e-Passport booklet formatting, bio-data pages & travel credentials.',
    category: 'identity',
    iconName: 'Globe',
    active: false,
    tokenCost: 1,
    features: ['ICAO 9303 Compliant MRZ', 'Biometric Chip Layout', 'Diplomatic & Ordinary Profiles'],
    processingMode: 'auto',
  },
  {
    id: 'tin',
    name: 'TIN Services',
    authority: 'Tanzania Revenue Authority',
    description: 'Taxpayer Identification Number cards, tax compliance credentials & PIN certificates.',
    category: 'finance',
    iconName: 'Receipt',
    active: false,
    tokenCost: 1,
    features: ['Taxpayer PIN Sync', 'QR Compliance Stamp', 'Corporate & Individual Formats'],
    processingMode: 'auto',
  },
  {
    id: 'business_license',
    name: 'Business License Services',
    authority: 'BRELA & Municipal Authorities',
    description: 'Commercial enterprise registration certificates, municipal trade permits & corporate IDs.',
    category: 'finance',
    iconName: 'Building2',
    active: false,
    tokenCost: 1,
    features: ['BRELA Certificate Layout', 'Annual Renewal Badges', 'Sector Trade Validation'],
    processingMode: 'auto',
  },
  {
    id: 'heslb',
    name: 'HESLB Student Loans Services',
    authority: 'Higher Education Students’ Loans Board',
    description: 'Student beneficiary loan allocation cards, academic verification & repayment IDs.',
    category: 'education',
    iconName: 'GraduationCap',
    active: false,
    tokenCost: 1,
    features: ['Index Number Verification', 'Institution Allocation Status', 'Beneficiary Smart Badges'],
    processingMode: 'auto',
  },
  {
    id: 'nhif',
    name: 'NHIF Services',
    authority: 'National Health Insurance Fund',
    description: 'Healthcare membership smart cards, dependent coverage validation & biometric health passes.',
    category: 'health',
    iconName: 'HeartPulse',
    active: false,
    tokenCost: 1,
    features: ['Principal & Dependent Mapping', 'Hospital Tier Endorsements', 'Smart Card Chip Specs'],
    processingMode: 'auto',
  },
  {
    id: 'ajira',
    name: 'Ajira Portal Services',
    authority: 'Public Service Recruitment Secretariat',
    description: 'Government job application portfolios, civil service recruitment IDs & applicant profiles.',
    category: 'education',
    iconName: 'Briefcase',
    active: false,
    tokenCost: 1,
    features: ['Civil Service Application Sync', 'Cadre Certificate Validation', 'Interview Pass Generation'],
    processingMode: 'auto',
  },
];

export interface PasskeyItem {
  id: string;
  key: string;
  role: 'admin' | 'user';
  active: boolean;
  createdDate: string;
  createdAtTimestamp: number;
  createdBy?: string;
  description?: string;
  lastUsed?: string;

  // Usage Manager fields
  totalUsages: number;
  usedUsages: number;
  remainingUsages: number;
  paymentStatus: PaymentStatus;
  packageName?: string;
  packagePrice?: string;
  usageHistory?: PasskeyUsageHistoryItem[];
}

export const DEFAULT_PASSKEYS: PasskeyItem[] = [
  {
    id: 'pk_admin_1',
    key: 'admin123',
    role: 'admin',
    active: true,
    createdDate: '2026-01-01 09:00',
    createdAtTimestamp: 1767258000000,
    createdBy: 'System',
    description: 'Admin Passkey',
    totalUsages: 99999,
    usedUsages: 0,
    remainingUsages: 99999,
    paymentStatus: 'ACTIVE',
    packageName: 'Unlimited Admin',
    packagePrice: 'Free',
    usageHistory: [],
  },
  {
    id: 'pk_admin_2',
    key: 'BIGSTA-ADMIN',
    role: 'admin',
    active: true,
    createdDate: '2026-01-01 09:00',
    createdAtTimestamp: 1767258000001,
    createdBy: 'System',
    description: 'Master Admin Key',
    totalUsages: 99999,
    usedUsages: 0,
    remainingUsages: 99999,
    paymentStatus: 'ACTIVE',
    packageName: 'Unlimited Admin',
    packagePrice: 'Free',
    usageHistory: [],
  },
  {
    id: 'pk_user_1',
    key: 'user123',
    role: 'user',
    active: true,
    createdDate: '2026-01-01 09:00',
    createdAtTimestamp: 1767258000002,
    createdBy: 'System',
    description: 'User Portal Passkey (5 Usages)',
    totalUsages: 5,
    usedUsages: 0,
    remainingUsages: 5,
    paymentStatus: 'ACTIVE',
    packageName: '5 Usages Package',
    packagePrice: 'TSh 25,000',
    usageHistory: [],
  },
  {
    id: 'pk_user_2',
    key: 'BIGSTA-USER',
    role: 'user',
    active: true,
    createdDate: '2026-01-01 09:00',
    createdAtTimestamp: 1767258000003,
    createdBy: 'System',
    description: 'BIGsta User Key (3 Usages)',
    totalUsages: 3,
    usedUsages: 0,
    remainingUsages: 3,
    paymentStatus: 'ACTIVE',
    packageName: '2 Usages Package',
    packagePrice: 'TSh 15,000',
    usageHistory: [],
  },
];

export interface RegisteredUser {
  id: string;
  fullName: string;
  phone: string;
  passkey: string;
  passkeyId: string;
  role: 'user';
  status: 'ACTIVE' | 'DISABLED' | 'PENDING';
  registeredDate: string;
  createdAtTimestamp: number;
  lastActive: string;
  lastActiveTimestamp: number;
  isOnline: boolean;
  currentService: string;
  currentActivity: string;
  servicesUsed: string[];
}

export interface PaymentRequest {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  passkeyId: string;
  userPasskey: string;
  packageId: string;
  packageName: string;
  amount: string;
  requestedUsages: number;
  lipaNumber: string;
  date: string;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedDate?: string;
}

export interface ManualRequestItem {
  id: string;
  timestamp: number;
  date: string;
  serviceId: string;
  serviceName: string;
  fullName: string;
  whatsappNumber: string;
  normalNumber: string;
  normalCallNumber?: string;
  accountKey?: string;
  accountUser?: string;
  userPasskey?: string;
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  adminNotes?: string;
  submittedAt?: number;
}

export const DEFAULT_MANUAL_REQUESTS: ManualRequestItem[] = [
  {
    id: 'req_1',
    timestamp: Date.now() - 3600000,
    date: '2026-09-18 12:30',
    serviceId: 'ajira',
    serviceName: 'Ajira Portal Services',
    fullName: 'Juma Ally Rashidi',
    whatsappNumber: '+255712345678',
    normalNumber: '0712345678',
    accountKey: 'BIGSTA-USER',
    accountUser: 'Juma Ally',
    status: 'PENDING',
  },
];

export const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'usr_1',
    fullName: 'Juma Ally Rashidi',
    phone: '0712345678',
    passkey: 'user123',
    passkeyId: 'pk_user_1',
    role: 'user',
    status: 'ACTIVE',
    registeredDate: '2026-01-01 10:00',
    createdAtTimestamp: 1767261600000,
    lastActive: 'Just now',
    lastActiveTimestamp: Date.now(),
    isOnline: true,
    currentService: 'NIDA Services',
    currentActivity: 'Viewing Card Preview',
    servicesUsed: ['NIDA Verification', 'CR80 Card Generation'],
  },
  {
    id: 'usr_2',
    fullName: 'Aisha Said Mkwawa',
    phone: '0654987654',
    passkey: 'BIGSTA-USER',
    passkeyId: 'pk_user_2',
    role: 'user',
    status: 'ACTIVE',
    registeredDate: '2026-01-02 14:30',
    createdAtTimestamp: 1767364200000,
    lastActive: '25 mins ago',
    lastActiveTimestamp: Date.now() - 1500000,
    isOnline: false,
    currentService: 'Card Studio',
    currentActivity: 'Offline',
    servicesUsed: ['Custom Card Studio'],
  },
];

export const DEFAULT_PAYMENT_REQUESTS: PaymentRequest[] = [
  {
    id: 'pay_1',
    userId: 'usr_1',
    userName: 'Juma Ally Rashidi',
    userPhone: '0712345678',
    passkeyId: 'pk_user_1',
    userPasskey: 'user123',
    packageId: 'pkg_5',
    packageName: '5 Usages Package',
    amount: 'TSh 25,000',
    requestedUsages: 5,
    lipaNumber: '1234678',
    date: '2026-01-05 11:20',
    timestamp: 1767612000000,
    status: 'PENDING',
  },
];

interface TemplateState {
  activeScreen: 'home' | 'upload' | 'editor' | 'templates' | 'nida' | 'preview' | 'downloads' | 'driving_license';
  currentTemplate: CardTemplate;
  frontPopulatedTemplate: CardTemplate | null;
  backPopulatedTemplate: CardTemplate | null;
  lastNidaFormData: any | null;
  lastDrivingLicenseFormData: any | null;
  setLastNidaFormData: (data: any) => void;
  setLastDrivingLicenseFormData: (data: any) => void;
  customTemplates: CardTemplate[];

  // Multi-Service Studio Context
  activeServiceId: string;
  setActiveServiceId: (serviceId: string) => void;
  getUniversalFrontTemplate: (serviceId: string) => CardTemplate;
  getUniversalBackTemplate: (serviceId: string) => CardTemplate;
  saveUniversalFrontTemplate: (serviceId: string, template: CardTemplate) => Promise<void>;
  saveUniversalBackTemplate: (serviceId: string, template: CardTemplate) => Promise<void>;

  // Studio Working Mode & Universal Navigation
  studioMode: boolean;
  navigationHistory: Array<{
    screen: 'home' | 'upload' | 'editor' | 'templates' | 'nida' | 'preview' | 'downloads' | 'driving_license';
    serviceId?: string;
    templateId?: string;
  }>;
  hasUnsavedChanges: boolean;
  isUnsavedModalOpen: boolean;
  pendingNavigation: (() => void) | null;

  setStudioMode: (enabled: boolean) => void;
  setHasUnsavedChanges: (dirty: boolean) => void;
  saveStudioDraft: () => void;
  restoreStudioDraft: (serviceId?: string) => void;
  clearStudioDraft: (serviceId?: string) => void;

  navigateSafely: (
    targetScreen: 'home' | 'upload' | 'editor' | 'templates' | 'nida' | 'preview' | 'downloads' | 'driving_license',
    serviceId?: string,
    bypassDraftRestore?: boolean
  ) => void;
  goBack: () => void;
  confirmPendingNavigation: (saveFirst?: boolean) => Promise<void>;
  cancelPendingNavigation: () => void;

  // Dynamic Token Packages state & actions
  tokenPackages: UsagePackage[];
  addTokenPackage: (pkg: Omit<UsagePackage, 'id'>) => void;
  editTokenPackage: (id: string, pkg: Partial<UsagePackage>) => void;
  deleteTokenPackage: (id: string) => void;
  toggleTokenPackage: (id: string) => void;

  // Dynamic Services state & actions
  services: any[];
  addService: (service: any) => void;
  editService: (id: string, service: Partial<any>) => void;
  deleteService: (id: string) => void;
  toggleService: (id: string) => void;

  // Passkey Gateway Auth System
  authRole: AuthRole;
  currentAuthKey: string | null;
  activePasskeys: PasskeyItem[];
  isPasskeyManagerOpen: boolean;

  // Registered Users & Recharge Management
  registeredUsers: RegisteredUser[];
  paymentRequests: PaymentRequest[];
  manualRequests: ManualRequestItem[];
  isRechargeModalOpen: boolean;
  rechargeNotice: string | null;
  isManualAppModalOpen: boolean;
  selectedManualService: { id: string; name: string } | null;
  setManualAppModalOpen: (open: boolean, service?: { id: string; name: string } | null) => void;

  loginWithPasskey: (inputKey: string) => { success: boolean; role?: AuthRole; message?: string };
  logoutPasskey: () => void;
  setPasskeyManagerOpen: (open: boolean) => void;
  setRechargeModalOpen: (open: boolean, notice?: string | null) => void;
  registerUserAccount: (data: { fullName: string; phone: string; passkey: string }) => { success: boolean; message: string; user?: RegisteredUser };
  updateUserActivity: (currentService?: string, currentActivity?: string) => void;
  submitPaymentRequest: (packageId: string, packageName: string, amount: string, requestedUsages: number) => { success: boolean; message: string; request?: PaymentRequest };
  approvePaymentRequest: (requestId: string) => { success: boolean; message: string };
  rejectPaymentRequest: (requestId: string) => { success: boolean; message: string };
  submitManualRequest: (data: { serviceId: string; serviceName: string; fullName: string; whatsappNumber: string; normalNumber?: string; normalCallNumber?: string }) => { success: boolean; message: string; request?: ManualRequestItem };
  updateManualRequestStatus: (requestId: string, status: ManualRequestItem['status'], adminNotes?: string) => { success: boolean; message: string };
  deleteManualRequest: (requestId: string) => { success: boolean; message: string };
  toggleUserStatus: (userId: string) => void;
  deleteRegisteredUser: (userId: string) => void;
  refreshUserStatus: () => void;

  addPasskey: (item: Partial<PasskeyItem> & { key: string; role: 'admin' | 'user' }) => PasskeyItem;
  generateUserPasskey: (
    description?: string,
    usages?: number,
    options?: { paymentStatus?: PaymentStatus; packageName?: string; packagePrice?: number | string }
  ) => PasskeyItem;
  generateUserPasskeyWithPackage: (
    packageName: string,
    usages: number,
    price: string,
    isAutoActive?: boolean,
    description?: string
  ) => PasskeyItem;
  generateAdminPasskey: (description?: string) => PasskeyItem;
  resetAdminPasskey: (currentKey: string, newKey: string) => { success: boolean; message: string };
  togglePasskeyStatus: (id: string) => void;
  deletePasskey: (id: string) => void;

  // Usage Manager Actions
  consumeUsage: (serviceName?: string, details?: string, tokenCost?: number) => { success: boolean; remainingUsages: number; message?: string };
  confirmPaymentAndActivatePasskey: (id: string) => void;
  addUsagesToPasskey: (id: string, additionalUsages: number, newPackageName?: string) => void;

  // Central Authorization & Validation Gate
  checkAuthorization: () => boolean;
  executeProtectedAction: (actionCallback: () => void) => void;
  validateServiceAccess: (serviceId?: string) => ServiceValidationResult;
  validateExportAccess: (actionType?: string) => ServiceValidationResult;

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
  setActiveScreen: (screen: 'home' | 'upload' | 'editor' | 'templates' | 'nida' | 'preview' | 'downloads' | 'driving_license') => void;
  setPopulatedCardPair: (front: CardTemplate | null, back: CardTemplate | null, formData?: any) => void;
  createNewTemplate: (background: BackgroundConfig, name?: string) => void;
  loadTemplate: (template: CardTemplate) => void;
  setCurrentTemplate: (template: CardTemplate) => void;
  updateTemplateMeta: (meta: Partial<CardTemplate>) => void;
  setActiveUnit: (unit: Unit) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPanOffset: (offset: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  recenterWorkspace: () => void;
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

const normalizePasskeyItem = (raw: any): PasskeyItem => {
  const role: 'admin' | 'user' = raw.role === 'admin' ? 'admin' : 'user';
  const totalUsages = typeof raw.totalUsages === 'number' ? raw.totalUsages : (role === 'admin' ? 99999 : 5);
  const usedUsages = typeof raw.usedUsages === 'number' ? raw.usedUsages : 0;
  const remainingUsages = typeof raw.remainingUsages === 'number' ? raw.remainingUsages : Math.max(0, totalUsages - usedUsages);

  let paymentStatus: PaymentStatus = raw.paymentStatus;
  if (remainingUsages <= 0) {
    paymentStatus = 'EXHAUSTED';
  } else if (paymentStatus === 'EXHAUSTED' && remainingUsages > 0) {
    paymentStatus = 'ACTIVE';
  } else if (!paymentStatus) {
    if (raw.active === false) paymentStatus = 'DISABLED';
    else if (remainingUsages <= 0) paymentStatus = 'EXHAUSTED';
    else paymentStatus = 'ACTIVE';
  }

  return {
    id: raw.id || `pk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    key: raw.key,
    role,
    active: paymentStatus !== 'DISABLED' && raw.active !== false,
    createdDate: raw.createdDate || new Date().toISOString().replace('T', ' ').substring(0, 16),
    createdAtTimestamp: raw.createdAtTimestamp || Date.now(),
    createdBy: raw.createdBy || 'System',
    description: raw.description || '',
    lastUsed: raw.lastUsed,
    totalUsages,
    usedUsages,
    remainingUsages,
    paymentStatus,
    packageName: raw.packageName || (role === 'admin' ? 'Unlimited Admin' : `${totalUsages} Usages Package`),
    packagePrice: raw.packagePrice || (role === 'admin' ? 'Free' : totalUsages === 1 ? 'TSh 10,000' : totalUsages === 2 ? 'TSh 15,000' : 'TSh 25,000'),
    usageHistory: Array.isArray(raw.usageHistory) ? raw.usageHistory : [],
  };
};

export function safeLocalStorageSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    if (
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.number === -2147024882 ||
      err?.message?.includes('exceeded the quota')
    ) {
      console.warn(`[Storage System] LocalStorage quota limit reached for key '${key}'. Cleaning stale drafts...`);
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('bigsta_studio_draft_') && k !== key) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(key, value);
        return true;
      } catch {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === 'object') {
            const stripped = { ...parsed };
            if (stripped.background?.type === 'image' && stripped.background?.src?.length > 10000) {
              stripped.background = { ...stripped.background, src: '' };
            }
            if (Array.isArray(stripped.layers)) {
              stripped.layers = stripped.layers.map((l: any) => {
                if (l.type === 'image' && l.src?.length > 10000) {
                  return { ...l, src: '' };
                }
                return l;
              });
            }
            localStorage.setItem(key, JSON.stringify(stripped));
            return true;
          }
        } catch {
          // Ignore
        }
        console.warn(`[Storage System] LocalStorage quota reached for '${key}'. Full template draft stored in IndexedDB.`);
        return false;
      }
    } else {
      console.warn(`[Storage System] LocalStorage setItem error for '${key}':`, err);
      return false;
    }
  }
}

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

  const initialAuthRole: AuthRole = (() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('bigsta_auth_role');
      if (stored === 'admin' || stored === 'user') return stored;
    } catch (e) {}
    return null;
  })();

  const initialAuthKey: string | null = (() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('bigsta_auth_key');
    } catch (e) {}
    return null;
  })();

  const initialPasskeys: PasskeyItem[] = (() => {
    if (typeof window === 'undefined') return DEFAULT_PASSKEYS.map(normalizePasskeyItem);
    try {
      const raw = localStorage.getItem('bigsta_passkeys');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizePasskeyItem);
        }
      }
    } catch (e) {}
    return DEFAULT_PASSKEYS.map(normalizePasskeyItem);
  })();

  const initialRegisteredUsers: RegisteredUser[] = (() => {
    if (typeof window === 'undefined') return DEFAULT_REGISTERED_USERS;
    try {
      const raw = localStorage.getItem('bigsta_registered_users');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_REGISTERED_USERS;
  })();

  const initialPaymentRequests: PaymentRequest[] = (() => {
    if (typeof window === 'undefined') return DEFAULT_PAYMENT_REQUESTS;
    try {
      const raw = localStorage.getItem('bigsta_payment_requests');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PAYMENT_REQUESTS;
  })();

  const initialManualRequests: ManualRequestItem[] = (() => {
    if (typeof window === 'undefined') return DEFAULT_MANUAL_REQUESTS;
    try {
      const raw = localStorage.getItem('bigsta_manual_requests');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_MANUAL_REQUESTS;
  })();

  const initialTokenPackages: UsagePackage[] = (() => {
    if (typeof window === 'undefined') return NIDA_USAGE_PACKAGES;
    try {
      const raw = localStorage.getItem('bigsta_token_packages');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return NIDA_USAGE_PACKAGES;
  })();

  const initialServicesList: ServiceData[] = (() => {
    if (typeof window === 'undefined') return INITIAL_SERVICES;
    try {
      const raw = localStorage.getItem('bigsta_services');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SERVICES;
  })();

  return {
    activeScreen: 'home',
    currentTemplate: DEFAULT_TEMPLATE,
    frontPopulatedTemplate: null,
    backPopulatedTemplate: null,
    lastNidaFormData: null,
    lastDrivingLicenseFormData: null,
    setLastNidaFormData: (data: any) => set({ lastNidaFormData: data }),
    setLastDrivingLicenseFormData: (data: any) => set({ lastDrivingLicenseFormData: data }),
    customTemplates: [],

    activeServiceId: typeof window !== 'undefined' ? (localStorage.getItem('bigsta_active_service') || 'nida') : 'nida',
    studioMode: false,
    navigationHistory: [],
    hasUnsavedChanges: false,
    isUnsavedModalOpen: false,
    pendingNavigation: null,

    setStudioMode: (enabled: boolean) => set({ studioMode: enabled }),
    setHasUnsavedChanges: (dirty: boolean) => set({ hasUnsavedChanges: dirty }),

    saveStudioDraft: () => {
      const { currentTemplate, activeServiceId } = get();
      if (typeof window !== 'undefined' && currentTemplate) {
        saveStudioDraftDB(activeServiceId, currentTemplate).catch(() => {});
        safeLocalStorageSetItem(`bigsta_studio_draft_${activeServiceId}`, JSON.stringify(currentTemplate));
        safeLocalStorageSetItem('bigsta_active_service', activeServiceId);
      }
    },

    restoreStudioDraft: (serviceId?: string) => {
      const targetService = serviceId || get().activeServiceId;
      if (typeof window !== 'undefined') {
        const draft = localStorage.getItem(`bigsta_studio_draft_${targetService}`);
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            if (parsed && parsed.layers) {
              set({ currentTemplate: ensureTemplateFieldIds(parsed) });
            }
          } catch (e) {
            console.warn('Failed to restore studio draft from localStorage:', e);
          }
        }
        getStudioDraftDB(targetService).then((dbDraft) => {
          if (dbDraft && dbDraft.layers) {
            set({ currentTemplate: ensureTemplateFieldIds(dbDraft) });
          }
        }).catch(() => {});
      }
    },

    clearStudioDraft: (serviceId?: string) => {
      const targetService = serviceId || get().activeServiceId;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`bigsta_studio_draft_${targetService}`);
        deleteStudioDraftDB(targetService).catch(() => {});
      }
    },

    setActiveServiceId: (serviceId: string) => {
      get().saveStudioDraft();
      const savedDraft = typeof window !== 'undefined' ? localStorage.getItem(`bigsta_studio_draft_${serviceId}`) : null;
      let targetTemplate: CardTemplate | null = null;
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.layers) {
            targetTemplate = ensureTemplateFieldIds(parsed);
          }
        } catch (e) {
          console.warn('Error parsing draft:', e);
        }
      }
      if (!targetTemplate) {
        targetTemplate = get().getUniversalFrontTemplate(serviceId);
      }
      if (typeof window !== 'undefined') {
        safeLocalStorageSetItem('bigsta_active_service', serviceId);
      }
      set({
        activeServiceId: serviceId,
        currentTemplate: targetTemplate,
      });

      getStudioDraftDB(serviceId).then((dbDraft) => {
        if (dbDraft && dbDraft.layers) {
          set({ currentTemplate: ensureTemplateFieldIds(dbDraft) });
        }
      }).catch(() => {});
    },

    navigateSafely: (targetScreen, serviceId, bypassDraftRestore) => {
      const role = get().authRole;
      let finalTarget = targetScreen;
      if (role === 'user' && (targetScreen === 'upload' || targetScreen === 'editor' || targetScreen === 'templates')) {
        finalTarget = 'home';
      }

      const performNav = () => {
        const current = get().activeScreen;
        const history = get().navigationHistory;
        if (current !== finalTarget) {
          set({
            navigationHistory: [
              ...history,
              { screen: current, serviceId: get().activeServiceId, templateId: get().currentTemplate.id },
            ].slice(-25),
          });
        }

        if (serviceId) {
          get().setActiveServiceId(serviceId);
        }

        set({
          activeScreen: finalTarget as any,
          studioMode: finalTarget === 'editor',
          hasUnsavedChanges: false,
          isUnsavedModalOpen: false,
          pendingNavigation: null,
        });

        if (finalTarget === 'editor' && !bypassDraftRestore) {
          get().restoreStudioDraft(serviceId || get().activeServiceId);
        }
      };

      if (get().hasUnsavedChanges && get().activeScreen === 'editor' && finalTarget !== 'editor') {
        set({
          isUnsavedModalOpen: true,
          pendingNavigation: () => performNav(),
        });
      } else {
        performNav();
      }
    },

    goBack: () => {
      if (get().activeScreen === 'preview') {
        const targetForm = get().activeServiceId === 'driving_license' ? 'driving_license' : 'nida';
        get().navigateSafely(targetForm);
        return;
      }
      const history = [...get().navigationHistory];
      if (history.length === 0) {
        get().navigateSafely('home');
        return;
      }
      const last = history.pop();

      const performBack = () => {
        set({
          navigationHistory: history,
          activeScreen: last?.screen as any || 'home',
          studioMode: last?.screen === 'editor',
          hasUnsavedChanges: false,
          isUnsavedModalOpen: false,
          pendingNavigation: null,
        });
        if (last?.serviceId) {
          get().setActiveServiceId(last.serviceId);
        }
        if (last?.screen === 'editor') {
          get().restoreStudioDraft(last.serviceId || get().activeServiceId);
        }
      };

      if (get().hasUnsavedChanges && get().activeScreen === 'editor') {
        set({
          isUnsavedModalOpen: true,
          pendingNavigation: () => performBack(),
        });
      } else {
        performBack();
      }
    },

    confirmPendingNavigation: async (saveFirst = false) => {
      const { pendingNavigation, saveCurrentTemplate } = get();
      if (saveFirst) {
        await saveCurrentTemplate();
      }
      set({ hasUnsavedChanges: false, isUnsavedModalOpen: false });
      if (pendingNavigation) {
        pendingNavigation();
      }
    },

    cancelPendingNavigation: () => set({ isUnsavedModalOpen: false, pendingNavigation: null }),

    getUniversalFrontTemplate: (serviceId: string) => {
      const customTemplates = get().customTemplates;
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(`universal_front_${serviceId}`) : null;
      
      if (savedId) {
        const foundCustom = customTemplates.find((t) => t.id === savedId);
        if (foundCustom) return foundCustom;
        const foundSample = SAMPLE_TEMPLATES.find((t) => t.id === savedId);
        if (foundSample) return foundSample;
      }

      const universalCustom = customTemplates.find((t) => t.serviceId === serviceId && t.isUniversalFront && !isBackSideTemplate(t));
      if (universalCustom) return universalCustom;

      const sampleMatch = SAMPLE_TEMPLATES.find((t) => (t.serviceId === serviceId || t.cardType?.toLowerCase().includes(serviceId.replace('_', ' '))) && !isBackSideTemplate(t));
      if (sampleMatch) return sampleMatch;

      return SAMPLE_TEMPLATES.find((t) => t.id === 'sample_tanzania_nida_front') || SAMPLE_TEMPLATES[0];
    },

    getUniversalBackTemplate: (serviceId: string) => {
      const customTemplates = get().customTemplates;
      const savedId = typeof window !== 'undefined' ? localStorage.getItem(`universal_back_${serviceId}`) : null;
      
      if (savedId) {
        const foundCustom = customTemplates.find((t) => t.id === savedId);
        if (foundCustom) return foundCustom;
        const foundSample = SAMPLE_TEMPLATES.find((t) => t.id === savedId);
        if (foundSample) return foundSample;
      }

      const universalCustom = customTemplates.find((t) => t.serviceId === serviceId && t.isUniversalBack && isBackSideTemplate(t));
      if (universalCustom) return universalCustom;

      const sampleMatch = SAMPLE_TEMPLATES.find((t) => (t.serviceId === serviceId || t.cardType?.toLowerCase().includes(serviceId.replace('_', ' '))) && isBackSideTemplate(t));
      if (sampleMatch) return sampleMatch;

      return SAMPLE_TEMPLATES.find((t) => t.id === 'sample_tanzania_nida_back') || SAMPLE_TEMPLATES[1];
    },

    saveUniversalFrontTemplate: async (serviceId: string, template: CardTemplate) => {
      const updatedTpl: CardTemplate = {
        ...template,
        serviceId,
        side: 'Front Side',
        isUniversalFront: true,
        updatedAt: new Date().toISOString(),
      };
      const sanitized = sanitizeTemplateForSaving(updatedTpl);
      await saveTemplateDB(sanitized);
      if (typeof window !== 'undefined') {
        safeLocalStorageSetItem(`universal_front_${serviceId}`, updatedTpl.id);
      }
      await get().loadSavedTemplates();
      set({ currentTemplate: updatedTpl, hasUnsavedChanges: false });
      get().saveStudioDraft();
    },

    saveUniversalBackTemplate: async (serviceId: string, template: CardTemplate) => {
      const updatedTpl: CardTemplate = {
        ...template,
        serviceId,
        side: 'Back Side',
        isUniversalBack: true,
        updatedAt: new Date().toISOString(),
      };
      const sanitized = sanitizeTemplateForSaving(updatedTpl);
      await saveTemplateDB(sanitized);
      if (typeof window !== 'undefined') {
        safeLocalStorageSetItem(`universal_back_${serviceId}`, updatedTpl.id);
      }
      await get().loadSavedTemplates();
      set({ currentTemplate: updatedTpl, hasUnsavedChanges: false });
      get().saveStudioDraft();
    },

    tokenPackages: initialTokenPackages,
    addTokenPackage: (pkg) => {
      const id = `pkg_${Date.now()}`;
      const newPkg: UsagePackage = { ...pkg, id, active: pkg.active !== false };
      const updated = [...get().tokenPackages, newPkg];
      safeLocalStorageSetItem('bigsta_token_packages', JSON.stringify(updated));
      set({ tokenPackages: updated });
    },
    editTokenPackage: (id, updatedFields) => {
      const updated = get().tokenPackages.map((p) => p.id === id ? { ...p, ...updatedFields } : p);
      safeLocalStorageSetItem('bigsta_token_packages', JSON.stringify(updated));
      set({ tokenPackages: updated });
    },
    deleteTokenPackage: (id) => {
      const updated = get().tokenPackages.filter((p) => p.id !== id);
      safeLocalStorageSetItem('bigsta_token_packages', JSON.stringify(updated));
      set({ tokenPackages: updated });
    },
    toggleTokenPackage: (id) => {
      const updated = get().tokenPackages.map((p) => p.id === id ? { ...p, active: p.active === false ? true : false } : p);
      safeLocalStorageSetItem('bigsta_token_packages', JSON.stringify(updated));
      set({ tokenPackages: updated });
    },

    services: initialServicesList,
    addService: (service) => {
      const id = service.id || `srv_${Date.now()}`;
      const newSrv = { ...service, id, active: service.active !== false };
      const updated = [...get().services, newSrv];
      safeLocalStorageSetItem('bigsta_services', JSON.stringify(updated));
      set({ services: updated });
    },
    editService: (id, updatedFields) => {
      const updated = get().services.map((s) => s.id === id ? { ...s, ...updatedFields } : s);
      safeLocalStorageSetItem('bigsta_services', JSON.stringify(updated));
      set({ services: updated });
    },
    deleteService: (id) => {
      const updated = get().services.filter((s) => s.id !== id);
      safeLocalStorageSetItem('bigsta_services', JSON.stringify(updated));
      set({ services: updated });
    },
    toggleService: (id) => {
      const updated = get().services.map((s) => s.id === id ? { ...s, active: !s.active } : s);
      safeLocalStorageSetItem('bigsta_services', JSON.stringify(updated));
      set({ services: updated });
    },

    // Passkey Gateway Auth System State
    authRole: initialAuthRole,
    currentAuthKey: initialAuthKey,
    activePasskeys: initialPasskeys,
    isPasskeyManagerOpen: false,

    registeredUsers: initialRegisteredUsers,
    paymentRequests: initialPaymentRequests,
    manualRequests: initialManualRequests,
    isRechargeModalOpen: false,
    rechargeNotice: null,
    isManualAppModalOpen: false,
    selectedManualService: null,

    setPasskeyManagerOpen: (open) => set({ isPasskeyManagerOpen: open }),
    setRechargeModalOpen: (open, notice = null) =>
      set({ isRechargeModalOpen: open, rechargeNotice: notice }),
    setManualAppModalOpen: (open, service = null) =>
      set({ isManualAppModalOpen: open, selectedManualService: service }),

    registerUserAccount: (data) => {
      const fullName = data.fullName.trim();
      const rawPhone = data.phone.trim().replace(/\s+/g, '');
      const passkey = data.passkey.trim();

      const isTz = /^(?:\+255|255|0)[67]\d{8}$/.test(rawPhone);
      if (!isTz) {
        return { success: false, message: 'Nambari ya simu haijasajiliwa kulingana na muundo wa Tanzania' };
      }

      const users = get().registeredUsers;
      const passkeys = get().activePasskeys;

      const phoneExists = users.some((u) => u.phone.replace(/\s+/g, '') === rawPhone);
      if (phoneExists) {
        return { success: false, message: 'This phone number is already registered.' };
      }

      const passkeyExists =
        passkeys.some((p) => p.key.toLowerCase() === passkey.toLowerCase()) ||
        users.some((u) => u.passkey.toLowerCase() === passkey.toLowerCase());
      if (passkeyExists) {
        return { success: false, message: 'This passkey is already in use by another account. Please choose a different passkey.' };
      }

      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);
      const nowTs = now.getTime();

      const newPasskeyItem: PasskeyItem = {
        id: `pk_user_${nowTs}`,
        key: passkey,
        role: 'user',
        active: true,
        createdDate: dateStr,
        createdAtTimestamp: nowTs,
        createdBy: fullName,
        description: `Registered User: ${fullName} (${rawPhone})`,
        totalUsages: 1,
        usedUsages: 0,
        remainingUsages: 1,
        paymentStatus: 'ACTIVE',
        packageName: '1 Usage Free Starter',
        packagePrice: 'TSh 25,000',
        usageHistory: [],
      };

      const newUser: RegisteredUser = {
        id: `usr_${nowTs}`,
        fullName,
        phone: rawPhone,
        passkey,
        passkeyId: newPasskeyItem.id,
        role: 'user',
        status: 'ACTIVE',
        registeredDate: dateStr,
        createdAtTimestamp: nowTs,
        lastActive: 'Just registered',
        lastActiveTimestamp: nowTs,
        isOnline: false,
        currentService: 'None',
        currentActivity: 'Account Registered',
        servicesUsed: [],
      };

      const updatedPasskeys = [newPasskeyItem, ...passkeys];
      const updatedUsers = [newUser, ...users];

      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updatedPasskeys));
        localStorage.setItem('bigsta_registered_users', JSON.stringify(updatedUsers));
      } catch (e) {}

      set({ activePasskeys: updatedPasskeys, registeredUsers: updatedUsers });
      return { success: true, message: 'Usajili umekamilika kikamilifu! Tumia Passkey yako kuingia.', user: newUser };
    },

    updateUserActivity: (currentService, currentActivity) => {
      const currentAuthKey = get().currentAuthKey;
      if (!currentAuthKey) return;
      const users = get().registeredUsers;
      const match = users.find((u) => u.passkey.toLowerCase() === currentAuthKey.toLowerCase());
      if (!match) return;

      const nowTs = Date.now();
      const srv = currentService || match.currentService || 'BIGsta Portal';
      const act = currentActivity || match.currentActivity || 'Active Session';
      
      const servicesUsed = [...(match.servicesUsed || [])];
      if (srv && !servicesUsed.includes(srv)) {
        servicesUsed.push(srv);
      }

      const updatedUsers = users.map((u) =>
        u.id === match.id
          ? {
              ...u,
              currentService: srv,
              currentActivity: act,
              servicesUsed,
              lastActive: 'Just now',
              lastActiveTimestamp: nowTs,
              isOnline: true,
            }
          : u
      );

      try {
        localStorage.setItem('bigsta_registered_users', JSON.stringify(updatedUsers));
      } catch (e) {}

      set({ registeredUsers: updatedUsers });
    },

    submitPaymentRequest: (packageId, packageName, amount, requestedUsages) => {
      const currentAuthKey = get().currentAuthKey;
      const passkeys = get().activePasskeys;
      const users = get().registeredUsers;

      // Prevent multiple pending requests for the same user/passkey
      const existingPending = get().paymentRequests.find(
        (r) => r.status === 'PENDING' && r.userPasskey.toLowerCase() === (currentAuthKey || '').toLowerCase()
      );
      if (existingPending) {
        return {
          success: false,
          message: 'Your previous payment request is still awaiting Admin approval.',
        };
      }

      const userPasskeyItem = passkeys.find(
        (p) => p.role === 'user' && p.key.toLowerCase() === (currentAuthKey || '').toLowerCase()
      );
      const userRecord = users.find(
        (u) => u.passkey.toLowerCase() === (currentAuthKey || '').toLowerCase()
      );

      const now = new Date();
      const nowTs = now.getTime();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

      const newRequest: PaymentRequest = {
        id: `pay_${nowTs}`,
        userId: userRecord?.id,
        userName: userRecord?.fullName || userPasskeyItem?.createdBy || 'Registered User',
        userPhone: userRecord?.phone || 'N/A',
        passkeyId: userPasskeyItem?.id || '',
        userPasskey: userPasskeyItem?.key || currentAuthKey || '',
        packageId,
        packageName,
        amount,
        requestedUsages,
        lipaNumber: '1234678',
        date: dateStr,
        timestamp: nowTs,
        status: 'PENDING',
      };

      const updatedRequests = [...get().paymentRequests, newRequest];

      const updatedPasskeys = passkeys.map((p) =>
        p.id === userPasskeyItem?.id
          ? { ...p, paymentStatus: 'PENDING' as PaymentStatus, packageName, packagePrice: amount }
          : p
      );

      try {
        localStorage.setItem('bigsta_payment_requests', JSON.stringify(updatedRequests));
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updatedPasskeys));
      } catch (e) {}

      set({ paymentRequests: updatedRequests, activePasskeys: updatedPasskeys });

      return {
        success: true,
        message: 'Payment submitted. Please wait for Admin approval.',
        request: newRequest,
      };
    },

    approvePaymentRequest: (requestId) => {
      const requests = get().paymentRequests;
      const targetReq = requests.find((r) => r.id === requestId);
      if (!targetReq || targetReq.status !== 'PENDING') {
        return { success: false, message: 'Payment request not found or already processed.' };
      }

      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

      const updatedRequests = requests.map((r) =>
        r.id === requestId ? { ...r, status: 'APPROVED' as const, reviewedDate: dateStr } : r
      );

      const passkeys = get().activePasskeys;
      const updatedPasskeys = passkeys.map((p) => {
        if (p.id === targetReq.passkeyId || p.key.toLowerCase() === targetReq.userPasskey.toLowerCase()) {
          const newTotal = (p.totalUsages ?? 0) + targetReq.requestedUsages;
          const newRem = (p.remainingUsages ?? 0) + targetReq.requestedUsages;
          return {
            ...p,
            totalUsages: newTotal,
            remainingUsages: newRem,
            paymentStatus: 'ACTIVE' as PaymentStatus,
            active: true,
            packageName: targetReq.packageName,
            packagePrice: targetReq.amount,
          };
        }
        return p;
      });

      const users = get().registeredUsers;
      const updatedUsers = users.map((u) => {
        if (u.passkey.toLowerCase() === targetReq.userPasskey.toLowerCase() || u.id === targetReq.userId) {
          return { ...u, status: 'ACTIVE' as const };
        }
        return u;
      });

      try {
        localStorage.setItem('bigsta_payment_requests', JSON.stringify(updatedRequests));
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updatedPasskeys));
        localStorage.setItem('bigsta_registered_users', JSON.stringify(updatedUsers));
      } catch (e) {}

      set({
        paymentRequests: updatedRequests,
        activePasskeys: updatedPasskeys,
        registeredUsers: updatedUsers,
      });

      return { success: true, message: 'Payment request approved successfully. Usages activated!' };
    },

    rejectPaymentRequest: (requestId) => {
      const requests = get().paymentRequests;
      const targetReq = requests.find((r) => r.id === requestId);
      if (!targetReq) {
        return { success: false, message: 'Payment request not found.' };
      }

      const now = new Date();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

      const updatedRequests = requests.map((r) =>
        r.id === requestId ? { ...r, status: 'REJECTED' as const, reviewedDate: dateStr } : r
      );

      const passkeys = get().activePasskeys;
      const updatedPasskeys = passkeys.map((p) => {
        if (p.id === targetReq.passkeyId || p.key.toLowerCase() === targetReq.userPasskey.toLowerCase()) {
          const rem = p.remainingUsages ?? 0;
          return {
            ...p,
            paymentStatus: rem > 0 ? ('ACTIVE' as PaymentStatus) : ('EXHAUSTED' as PaymentStatus),
          };
        }
        return p;
      });

      try {
        localStorage.setItem('bigsta_payment_requests', JSON.stringify(updatedRequests));
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updatedPasskeys));
      } catch (e) {}

      set({ paymentRequests: updatedRequests, activePasskeys: updatedPasskeys });

      return { success: true, message: 'Payment request rejected.' };
    },

    submitManualRequest: (data) => {
      const currentAuthKey = get().currentAuthKey;
      const passkeys = get().activePasskeys;
      const users = get().registeredUsers;

      const userPasskeyItem = passkeys.find(
        (p) => p.key.toLowerCase() === (currentAuthKey || '').toLowerCase()
      );
      const userRecord = users.find(
        (u) => u.passkey.toLowerCase() === (currentAuthKey || '').toLowerCase()
      );

      const now = new Date();
      const nowTs = now.getTime();
      const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

      const normalNum = data.normalNumber || data.normalCallNumber || '';

      const newRequest: ManualRequestItem = {
        id: `req_${nowTs}`,
        timestamp: nowTs,
        submittedAt: nowTs,
        date: dateStr,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        fullName: data.fullName.trim(),
        whatsappNumber: data.whatsappNumber.trim(),
        normalNumber: normalNum.trim(),
        normalCallNumber: normalNum.trim(),
        accountKey: userPasskeyItem?.key || currentAuthKey || 'Guest',
        accountUser: userRecord?.fullName || userPasskeyItem?.createdBy || 'System User',
        userPasskey: userPasskeyItem?.key || currentAuthKey || 'Guest',
        status: 'PENDING',
      };

      const updatedRequests = [newRequest, ...get().manualRequests];
      try {
        localStorage.setItem('bigsta_manual_requests', JSON.stringify(updatedRequests));
      } catch (e) {}

      set({ manualRequests: updatedRequests });
      return { success: true, message: 'Manual application request submitted successfully!', request: newRequest };
    },

    updateManualRequestStatus: (requestId, status, adminNotes) => {
      const updated = get().manualRequests.map((r) =>
        r.id === requestId ? { ...r, status, ...(adminNotes !== undefined ? { adminNotes } : {}) } : r
      );
      try {
        localStorage.setItem('bigsta_manual_requests', JSON.stringify(updated));
      } catch (e) {}
      set({ manualRequests: updated });
      return { success: true, message: `Request status updated to ${status}` };
    },

    deleteManualRequest: (requestId) => {
      const updated = get().manualRequests.filter((r) => r.id !== requestId);
      try {
        localStorage.setItem('bigsta_manual_requests', JSON.stringify(updated));
      } catch (e) {}
      set({ manualRequests: updated });
      return { success: true, message: 'Request deleted successfully' };
    },

    toggleUserStatus: (userId) => {
      const users = get().registeredUsers;
      const targetUser = users.find((u) => u.id === userId);
      if (!targetUser) return;

      const newStatus = targetUser.status === 'ACTIVE' ? ('DISABLED' as const) : ('ACTIVE' as const);
      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));

      const passkeys = get().activePasskeys;
      const updatedPasskeys = passkeys.map((p) => {
        if (p.id === targetUser.passkeyId || p.key.toLowerCase() === targetUser.passkey.toLowerCase()) {
          const newActive = newStatus === 'ACTIVE';
          return {
            ...p,
            active: newActive,
            paymentStatus: newActive ? ('ACTIVE' as PaymentStatus) : ('DISABLED' as PaymentStatus),
          };
        }
        return p;
      });

      try {
        localStorage.setItem('bigsta_registered_users', JSON.stringify(updatedUsers));
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updatedPasskeys));
      } catch (e) {}

      set({ registeredUsers: updatedUsers, activePasskeys: updatedPasskeys });
    },

    deleteRegisteredUser: (userId) => {
      const targetUser = get().registeredUsers.find((u) => u.id === userId);
      const updatedUsers = get().registeredUsers.filter((u) => u.id !== userId);

      let updatedPasskeys = get().activePasskeys;
      if (targetUser) {
        updatedPasskeys = updatedPasskeys.filter(
          (p) => p.id !== targetUser.passkeyId && p.key.toLowerCase() !== targetUser.passkey.toLowerCase()
        );
      }

      try {
        localStorage.setItem('bigsta_registered_users', JSON.stringify(updatedUsers));
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updatedPasskeys));
      } catch (e) {}

      set({ registeredUsers: updatedUsers, activePasskeys: updatedPasskeys });
    },

    refreshUserStatus: () => {
      try {
        const rawPass = localStorage.getItem('bigsta_passkeys');
        const rawReqs = localStorage.getItem('bigsta_payment_requests');
        const rawUsers = localStorage.getItem('bigsta_registered_users');

        let updatedPass = get().activePasskeys;
        let updatedReqs = get().paymentRequests;
        let updatedUsers = get().registeredUsers;

        if (rawPass) updatedPass = JSON.parse(rawPass);
        if (rawReqs) updatedReqs = JSON.parse(rawReqs);
        if (rawUsers) updatedUsers = JSON.parse(rawUsers);

        set({
          activePasskeys: updatedPass,
          paymentRequests: updatedReqs,
          registeredUsers: updatedUsers,
        });
      } catch (e) {}
    },

    loginWithPasskey: (inputKey) => {
      const trimmed = inputKey.trim();
      const list = get().activePasskeys;
      const match = list.find((p) => p.key.toLowerCase() === trimmed.toLowerCase());

      if (!match) {
        return { success: false, message: 'Invalid Passkey' };
      }

      if (!match.active || match.paymentStatus === 'DISABLED') {
        return { success: false, message: 'Passkey is Disabled. Please contact Administrator.' };
      }

      if (match.role === 'user') {
        // We no longer block login based on usages or pending payments here.
        // The central authorization gate (executeProtectedAction) and 
        // UsageExhaustedBanner will handle restricting service access.
      }

      const now = new Date();
      const lastUsedStr = now.toISOString().replace('T', ' ').substring(0, 16);
      const updated = list.map((p) =>
        p.id === match.id ? { ...p, lastUsed: lastUsedStr } : p
      );

      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
        localStorage.setItem('bigsta_auth_role', match.role);
        localStorage.setItem('bigsta_auth_key', match.key);
      } catch (e) {}

      set({
        authRole: match.role,
        currentAuthKey: match.key,
        activeScreen: match.role === 'admin' ? 'home' : 'nida',
        activePasskeys: updated,
      });

      return { success: true, role: match.role };
    },

    logoutPasskey: () => {
      try {
        localStorage.removeItem('bigsta_auth_role');
        localStorage.removeItem('bigsta_auth_key');
      } catch (e) {}
      set({ authRole: null, currentAuthKey: null, activeScreen: 'home' });
    },

    addPasskey: (item) => {
      const now = new Date();
      const role = item.role || 'user';
      const totalUsages = item.totalUsages !== undefined ? item.totalUsages : (role === 'admin' ? 99999 : 1);
      const usedUsages = item.usedUsages || 0;
      const remainingUsages = Math.max(0, totalUsages - usedUsages);
      const paymentStatus: PaymentStatus = item.paymentStatus || (role === 'admin' ? 'ACTIVE' : 'PENDING');

      const newItem: PasskeyItem = {
        id: `pk_${Date.now()}`,
        key: item.key,
        role,
        active: paymentStatus !== 'DISABLED',
        createdDate: now.toISOString().replace('T', ' ').substring(0, 16),
        createdAtTimestamp: now.getTime(),
        createdBy: item.createdBy || 'Admin',
        description: item.description || (role === 'admin' ? 'Admin Passkey' : 'Custom User Passkey'),
        totalUsages,
        usedUsages,
        remainingUsages,
        paymentStatus,
        packageName: item.packageName || (role === 'admin' ? 'Unlimited Admin' : `${totalUsages} Usages Package`),
        packagePrice: item.packagePrice || (role === 'admin' ? 'Free' : 'Custom'),
        usageHistory: [],
      };
      const updated = [newItem, ...get().activePasskeys];
      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
      } catch (e) {}
      set({ activePasskeys: updated });
      return newItem;
    },

    generateUserPasskey: (description, usages = 1, options) => {
      const numUsages = typeof usages === 'number' ? usages : 1;
      const isAutoActive = options?.paymentStatus === 'ACTIVE';
      const packageName = options?.packageName || `${numUsages} Usages Package`;
      const priceStr = options?.packagePrice ? String(options.packagePrice) : (numUsages === 1 ? 'Free' : numUsages === 2 ? 'TSh 15,000' : 'TSh 25,000');
      
      return get().generateUserPasskeyWithPackage(packageName, numUsages, priceStr, isAutoActive, description);
    },

    generateUserPasskeyWithPackage: (packageName, usages, price, isAutoActive = false, description) => {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      const generatedKey = `BIGSTA-USR-${randNum}`;
      const now = new Date();
      const paymentStatus: PaymentStatus = isAutoActive ? 'ACTIVE' : 'PENDING';

      const newItem: PasskeyItem = {
        id: `pk_${Date.now()}`,
        key: generatedKey,
        role: 'user',
        active: true,
        createdDate: now.toISOString().replace('T', ' ').substring(0, 16),
        createdAtTimestamp: now.getTime(),
        createdBy: 'Admin',
        description: description || `User Passkey (${packageName})`,
        totalUsages: usages,
        usedUsages: 0,
        remainingUsages: usages,
        paymentStatus,
        packageName,
        packagePrice: price,
        usageHistory: [],
      };
      const updated = [newItem, ...get().activePasskeys];
      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
      } catch (e) {}
      set({ activePasskeys: updated });
      return newItem;
    },

    generateAdminPasskey: (description) => {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      const generatedKey = `BIGSTA-ADM-${randNum}`;
      const now = new Date();
      const newItem: PasskeyItem = {
        id: `pk_${Date.now()}`,
        key: generatedKey,
        role: 'admin',
        active: true,
        createdDate: now.toISOString().replace('T', ' ').substring(0, 16),
        createdAtTimestamp: now.getTime(),
        createdBy: 'Admin',
        description: description || 'Generated Admin Passkey',
        totalUsages: 99999,
        usedUsages: 0,
        remainingUsages: 99999,
        paymentStatus: 'ACTIVE',
        packageName: 'Unlimited Admin',
        packagePrice: 'Free',
        usageHistory: [],
      };
      const updated = [newItem, ...get().activePasskeys];
      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
      } catch (e) {}
      set({ activePasskeys: updated });
      return newItem;
    },

    consumeUsage: (serviceName = 'NIDA Service Completion', details, tokenCost) => {
      const authKey = get().currentAuthKey || (typeof window !== 'undefined' ? localStorage.getItem('bigsta_auth_key') : null);
      const role = get().authRole;

      if (role === 'admin') {
        return { success: true, remainingUsages: 99999 };
      }

      const list = get().activePasskeys;
      const match = list.find((p) => p.key.toLowerCase() === (authKey || '').toLowerCase());

      if (!match) {
        return { success: false, remainingUsages: 0, message: 'No valid active passkey session.' };
      }

      if (!match.active || match.paymentStatus === 'DISABLED') {
        return { success: false, remainingUsages: 0, message: 'Passkey has been disabled.' };
      }

      let cost = typeof tokenCost === 'number' ? tokenCost : 1;
      if (typeof tokenCost !== 'number' && get().currentTemplate) {
        const activeTpl = get().currentTemplate;
        const name = (activeTpl?.templateName || '').toLowerCase();
        const cardType = (activeTpl?.cardType || '').toLowerCase();

        if (
          cardType === 'driving license' ||
          name.includes('driving') ||
          name.includes('driver') ||
          name.includes('license') ||
          name.includes('licence') ||
          name.includes('permit')
        ) {
          const service = get().services.find((s) => s.id === 'driving_license');
          cost = service ? (service.tokenCost ?? 1) : 1;
        } else {
          const service = get().services.find((s) => s.id === 'nida');
          cost = service ? (service.tokenCost ?? 1) : 1;
        }
      }

      const currentRemaining = match.remainingUsages ?? 0;

      // Only block pending payments if the user does NOT have enough remaining usages
      if (match.paymentStatus === 'PENDING' && currentRemaining < cost) {
        return { success: false, remainingUsages: currentRemaining, message: 'Payment pending confirmation by Administrator.' };
      }

      if (currentRemaining < cost || match.paymentStatus === 'EXHAUSTED') {
        return {
          success: false,
          remainingUsages: currentRemaining,
          message: `Insufficient tokens. This service requires ${cost} tokens, but you only have ${currentRemaining} tokens.`,
        };
      }

      const newUsed = (match.usedUsages ?? 0) + cost;
      const newRemaining = Math.max(0, (match.totalUsages ?? 1) - newUsed);
      // Keep PENDING status if it was already pending and they still have remaining usages
      const newPaymentStatus: PaymentStatus = newRemaining === 0 ? 'EXHAUSTED' : (match.paymentStatus === 'PENDING' ? 'PENDING' : 'ACTIVE');

      const historyItem: PasskeyUsageHistoryItem = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        serviceName,
        details,
      };

      const updatedItem: PasskeyItem = {
        ...match,
        usedUsages: newUsed,
        remainingUsages: newRemaining,
        paymentStatus: newPaymentStatus,
        usageHistory: [historyItem, ...(match.usageHistory || [])],
      };

      const updatedList = list.map((p) => (p.id === match.id ? updatedItem : p));

      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updatedList));
      } catch (e) {}

      set({ activePasskeys: updatedList });

      return { success: true, remainingUsages: newRemaining };
    },

    confirmPaymentAndActivatePasskey: (id: string) => {
      const list = get().activePasskeys;
      const updated = list.map((p) => {
        if (p.id === id) {
          const remaining = Math.max(0, (p.totalUsages ?? 1) - (p.usedUsages ?? 0));
          return {
            ...p,
            active: true,
            paymentStatus: remaining > 0 ? ('ACTIVE' as PaymentStatus) : ('EXHAUSTED' as PaymentStatus),
          };
        }
        return p;
      });
      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
      } catch (e) {}
      set({ activePasskeys: updated });
    },

    addUsagesToPasskey: (id: string, additionalUsages: number, newPackageName?: string) => {
      const list = get().activePasskeys;
      const updated = list.map((p) => {
        if (p.id === id) {
          const newTotal = (p.totalUsages ?? 0) + additionalUsages;
          const newRemaining = Math.max(0, newTotal - (p.usedUsages ?? 0));
          const newPaymentStatus: PaymentStatus = newRemaining > 0 ? 'ACTIVE' : 'EXHAUSTED';
          return {
            ...p,
            totalUsages: newTotal,
            remainingUsages: newRemaining,
            packageName: newPackageName || p.packageName || `${newTotal} Usages Package`,
            paymentStatus: newPaymentStatus,
            active: true,
          };
        }
        return p;
      });
      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
      } catch (e) {}
      set({ activePasskeys: updated });
    },

    // =========================================================================
    // CENTRAL AUTHORIZATION & VALIDATION GATE
    // =========================================================================

    validateServiceAccess: (serviceId?: string): ServiceValidationResult => {
      const { authRole, currentAuthKey, activePasskeys, services, activeServiceId } = get();
      const targetServiceId = serviceId || activeServiceId || 'nida';

      console.log('[SERVICE VALIDATION DEBUG] Validating service access:', {
        targetServiceId,
        authRole,
        currentAuthKey,
      });

      // 1. Admin Override: Admins always bypass payment/usage checks
      if (authRole === 'admin') {
        return { allowed: true, remainingUsages: 99999, cost: 0 };
      }

      // 2. User Logged In Check
      if (!authRole || !currentAuthKey) {
        return {
          allowed: false,
          reason: 'NOT_LOGGED_IN',
          message: 'Please log in with a valid Passkey first.',
        };
      }

      // 3. Passkey Check
      const currentPasskey = activePasskeys.find(
        (p) => p.key.toLowerCase() === currentAuthKey.toLowerCase()
      );

      if (!currentPasskey || !currentPasskey.active || currentPasskey.paymentStatus === 'DISABLED') {
        const msg = 'Passkey is disabled or invalid. Please contact Administrator.';
        get().setRechargeModalOpen(true, msg);
        return {
          allowed: false,
          reason: 'DISABLED',
          message: msg,
        };
      }

      const service = services.find((s) => s.id === targetServiceId);
      const cost = service ? (service.tokenCost ?? 1) : 1;
      const remaining = currentPasskey.remainingUsages ?? 0;
      const pStatus = currentPasskey.paymentStatus;

      console.log('[SERVICE VALIDATION DEBUG] Passkey status:', {
        key: currentPasskey.key,
        paymentStatus: pStatus,
        remainingUsages: remaining,
        cost,
      });

      // 4. Payment Approval Check
      if (pStatus === 'PENDING' && remaining < cost) {
        const msg = 'Access Required: This service requires an approved token package.';
        get().setRechargeModalOpen(true, msg);
        return {
          allowed: false,
          reason: 'PAYMENT_REQUIRED',
          message: msg,
          paymentStatus: pStatus,
          remainingUsages: remaining,
          cost,
        };
      }

      if ((pStatus as string) === 'REJECTED') {
        const msg = 'Payment Rejected: Your previous payment request was rejected. Please submit a new package order.';
        get().setRechargeModalOpen(true, msg);
        return {
          allowed: false,
          reason: 'PAYMENT_REQUIRED',
          message: msg,
          paymentStatus: pStatus,
          remainingUsages: remaining,
          cost,
        };
      }

      // 5. Available Tokens / Usages Check
      if (remaining < cost || (pStatus === 'EXHAUSTED' && remaining <= 0) || remaining <= 0) {
        const msg = `Out Of Tokens: You have ${remaining} remaining usages (required: ${cost}). Please recharge now.`;
        get().setRechargeModalOpen(true, msg);
        return {
          allowed: false,
          reason: 'OUT_OF_TOKENS',
          message: msg,
          paymentStatus: pStatus,
          remainingUsages: remaining,
          cost,
        };
      }

      return {
        allowed: true,
        remainingUsages: remaining,
        cost,
        paymentStatus: pStatus,
      };
    },

    validateExportAccess: (actionType = 'export'): ServiceValidationResult => {
      const { authRole, currentTemplate, frontPopulatedTemplate, backPopulatedTemplate, activeServiceId } = get();

      console.log('[EXPORT DEBUG] Payment Check:', {
        authRole,
        currentAuthKey: get().currentAuthKey,
        activeServiceId,
      });

      // 1. Run service validation
      const serviceVal = get().validateServiceAccess(activeServiceId || undefined);
      console.log('[EXPORT DEBUG] Token Check & Usage Check:', serviceVal);

      if (!serviceVal.allowed) {
        return serviceVal;
      }

      // 2. Check Card Data Exists
      const hasCardData = Boolean(currentTemplate || frontPopulatedTemplate || backPopulatedTemplate);
      console.log('[EXPORT DEBUG] Export Creation:', {
        actionType,
        hasCardData,
        currentTemplateId: currentTemplate?.id,
      });

      if (!hasCardData) {
        return {
          allowed: false,
          reason: 'NO_CARD_DATA',
          message: 'No generated card or template data found to export.',
        };
      }

      return {
        allowed: true,
        cost: serviceVal.cost,
        remainingUsages: serviceVal.remainingUsages,
      };
    },

    checkAuthorization: () => {
      const res = get().validateExportAccess('check_auth');
      return res.allowed;
    },

    executeProtectedAction: (actionCallback: () => void) => {
      const val = get().validateExportAccess('execute_protected_action');
      if (val.allowed) {
        actionCallback();
      }
    },

    resetAdminPasskey: (currentKey, newKey) => {
      const list = get().activePasskeys;
      const trimmedCurrent = currentKey.trim();
      const trimmedNew = newKey.trim();

      if (!trimmedNew) {
        return { success: false, message: 'New passkey cannot be empty' };
      }

      // Verify current admin key match
      const currentAdminMatch = list.find(
        (p) => p.role === 'admin' && p.key.toLowerCase() === trimmedCurrent.toLowerCase() && p.active
      );

      // Check stored key in localStorage or logged-in state
      const storedKey = typeof window !== 'undefined' ? localStorage.getItem('bigsta_auth_key') : null;
      const isValidCurrent = currentAdminMatch || (storedKey && storedKey.toLowerCase() === trimmedCurrent.toLowerCase());

      if (!isValidCurrent) {
        return { success: false, message: 'Current Admin Passkey is incorrect' };
      }

      // Check if new passkey already exists
      if (list.some((p) => p.key.toLowerCase() === trimmedNew.toLowerCase())) {
        return { success: false, message: 'This passkey already exists' };
      }

      const now = new Date();
      // Replace existing match or update admin passkey
      let updated: PasskeyItem[];
      if (currentAdminMatch) {
        updated = list.map((p) =>
          p.id === currentAdminMatch.id
            ? { ...p, key: trimmedNew, createdDate: now.toISOString().replace('T', ' ').substring(0, 16), createdAtTimestamp: now.getTime() }
            : p
        );
      } else {
        const newAdminItem: PasskeyItem = {
          id: `pk_${Date.now()}`,
          key: trimmedNew,
          role: 'admin',
          active: true,
          createdDate: now.toISOString().replace('T', ' ').substring(0, 16),
          createdAtTimestamp: now.getTime(),
          createdBy: 'Admin',
          description: 'Updated Admin Passkey',
          totalUsages: 99999,
          usedUsages: 0,
          remainingUsages: 99999,
          paymentStatus: 'ACTIVE',
          packageName: 'Unlimited Admin',
          packagePrice: 'Free',
          usageHistory: [],
        };
        updated = [newAdminItem, ...list];
      }

      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
        localStorage.setItem('bigsta_auth_key', trimmedNew);
      } catch (e) {}

      set({ activePasskeys: updated });
      return { success: true, message: 'Admin Passkey Updated Successfully' };
    },

    togglePasskeyStatus: (id) => {
      const updated = get().activePasskeys.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p
      );
      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
      } catch (e) {}
      set({ activePasskeys: updated });
    },

    deletePasskey: (id) => {
      const updated = get().activePasskeys.filter((p) => p.id !== id);
      try {
        localStorage.setItem('bigsta_passkeys', JSON.stringify(updated));
      } catch (e) {}
      set({ activePasskeys: updated });
    },

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

  setActiveScreen: (screen) => {
    get().navigateSafely(screen);
  },

  setPopulatedCardPair: (front, back, formData) => {
    const activeService = get().activeServiceId;
    if (activeService === 'driving_license') {
      set({
        frontPopulatedTemplate: front,
        backPopulatedTemplate: back,
        lastDrivingLicenseFormData: formData !== undefined ? formData : get().lastDrivingLicenseFormData,
      });
    } else {
      set({
        frontPopulatedTemplate: front,
        backPopulatedTemplate: back,
        lastNidaFormData: formData !== undefined ? formData : get().lastNidaFormData,
      });
    }
  },

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

  loadTemplate: (template: CardTemplate) => {
    if (!template) {
      console.error('[Template Diagnostics Error] Attempted to load null or undefined template');
      return;
    }

    const prepared = ensureTemplateFieldIds(template);
    const serviceId = prepared.serviceId || get().activeServiceId || 'nida';

    // Diagnostic logging for template load (PROMPT 26)
    const elementCount = prepared.layers?.length || 0;
    const variableLayers = (prepared.layers || []).filter((l) => {
      if (l.bindingKey) return true;
      if (l.type === 'text' && (l as any).text?.includes('{{')) return true;
      return false;
    });

    const bgType = prepared.background?.type || 'color';
    const bgInfo = bgType === 'image'
      ? (prepared.background?.src ? `Image (${prepared.background.src.substring(0, 40)}...)` : 'Image (Missing URL!)')
      : `Color (${prepared.background?.color || '#ffffff'})`;

    console.log(`[Template Diagnostics] Loaded Template:`, {
      id: prepared.id,
      name: prepared.templateName,
      serviceId: serviceId,
      side: prepared.side || 'Front',
      background: bgInfo,
      elementCount: elementCount,
      variableCount: variableLayers.length,
    });

    if (bgType === 'image' && !prepared.background?.src) {
      console.warn(`[Template Diagnostics Warning] Template '${prepared.templateName}' (${prepared.id}) background is type 'image' but background image src URL is missing.`);
    }

    set({
      currentTemplate: prepared,
      activeServiceId: serviceId,
      selectedLayerIds: [],
      activeScreen: 'editor',
      studioMode: true,
      history: [prepared],
      historyIndex: 0,
      zoom: 1.0,
      hasUnsavedChanges: false,
    });

    // Save as studio draft for this active service to ensure navigating to editor restores this exact template
    if (typeof window !== 'undefined') {
      saveStudioDraftDB(serviceId, prepared);
      safeLocalStorageSetItem(`bigsta_studio_draft_${serviceId}`, JSON.stringify(prepared));
      safeLocalStorageSetItem('bigsta_active_service', serviceId);
    }
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
      // Clamp zoom between 0.25 (25%) and 5.0 (500%) as per PROMPT 47
      return { zoom: Math.min(5.0, Math.max(0.25, Number(newZoom.toFixed(2)))) };
    }),

  setPanOffset: (offsetOrFn) =>
    set((state) => ({
      panOffset: typeof offsetOrFn === 'function' ? offsetOrFn(state.panOffset) : offsetOrFn,
    })),

  recenterWorkspace: () => set({ panOffset: { x: 0, y: 0 } }),

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
      hasUnsavedChanges: true,
    });
    get().pushHistoryState(updated);
    get().saveStudioDraft();
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
    set({ currentTemplate: updated, hasUnsavedChanges: true });
    get().pushHistoryState(updated);
    get().saveStudioDraft();
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
      hasUnsavedChanges: true,
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
    const template = {
      ...get().currentTemplate,
      updatedAt: new Date().toISOString(),
    };
    const sanitized = sanitizeTemplateForSaving(template);
    await saveTemplateDB(sanitized);
    set({ currentTemplate: template, hasUnsavedChanges: false });
    get().saveStudioDraft();
    await get().loadSavedTemplates();
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
    set({ currentTemplate: newTpl, hasUnsavedChanges: false });
    get().saveStudioDraft();
    await get().loadSavedTemplates();
    return newTpl;
  },

  loadSavedTemplates: async () => {
    const dbTemplates = await getAllTemplatesDB();
    const map = new Map<string, CardTemplate>();

    dbTemplates.forEach((t) => {
      map.set(t.id, ensureTemplateFieldIds(t));
    });

    // Always ensure built-in SAMPLE_TEMPLATES use current code version with explicit field IDs, without overwriting user-modified versions
    for (const sample of SAMPLE_TEMPLATES) {
      if (!map.has(sample.id)) {
        const sanitized = ensureTemplateFieldIds(sample);
        map.set(sanitized.id, sanitized);
        await saveTemplateDB(sanitized);
      }
    }

    const all = Array.from(map.values());
    const sorted = all.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
      return timeB - timeA;
    });
    set({ customTemplates: sorted });
    return sorted;
  },

  deleteSavedTemplate: async (id) => {
    await deleteTemplateDB(id);
  },

  setSelectedFrontTemplateId: (id) => {
    if (typeof window !== 'undefined' && id) {
      safeLocalStorageSetItem('nida_selected_front_template_id', id);
    }
    set({ selectedFrontTemplateId: id });
  },

  setSelectedBackTemplateId: (id) => {
    if (typeof window !== 'undefined' && id) {
      safeLocalStorageSetItem('nida_selected_back_template_id', id);
    }
    set({ selectedBackTemplateId: id });
  },

  setUniversalDefaultNidaTemplates: (frontId, backId) => {
    if (typeof window !== 'undefined') {
      safeLocalStorageSetItem('nida_default_front_template_id', frontId);
      safeLocalStorageSetItem('nida_default_back_template_id', backId);
      safeLocalStorageSetItem('nida_selected_front_template_id', frontId);
      safeLocalStorageSetItem('nida_selected_back_template_id', backId);
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
        safeLocalStorageSetItem('nida_last_submission', JSON.stringify(record));
        const historyStr = localStorage.getItem('nida_submission_history') || '[]';
        const history: NidaSubmissionRecord[] = JSON.parse(historyStr);
        history.unshift(record);
        // Keep last 50 submissions
        if (history.length > 50) history.pop();
        safeLocalStorageSetItem('nida_submission_history', JSON.stringify(history));
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
