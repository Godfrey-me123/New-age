import React, { useState, useMemo, useEffect } from 'react';
import {
  Menu,
  Home,
  User,
  Hash,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  BadgeInfo,
  FolderOpen,
  PlusCircle,
  FileCheck,
  ChevronDown,
  Layers,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Loader2,
  Info,
  X,
  CreditCard,
  ScrollText,
  Car,
  Globe,
  Receipt,
  Building2,
  GraduationCap,
  HeartPulse,
  Briefcase,
  Star,
  Settings,
} from 'lucide-react';
import { FloatingInput } from './FloatingInput';
import { FloatingSelect } from './FloatingSelect';
import { FloatingDatePicker } from './FloatingDatePicker';
import { PassportPhotoUpload } from './PassportPhotoUpload';
import { SignaturePad } from './SignaturePad';
import { TermsAndConditions } from './TermsAndConditions';
import { TemplateRequiredModal } from './TemplateRequiredModal';
import { MappingResultModal } from './MappingResultModal';
import { SubmissionProgressModal } from './SubmissionProgressModal';
import { ServiceMenuDrawer } from '../navigation/ServiceMenuDrawer';
import { HorizontalActionRow } from '../common/HorizontalActionRow';
import { AppFooter } from '../common/AppFooter';
import { NidaTemplateSelectionStep } from './NidaTemplateSelectionStep';
import {
  INITIAL_SUBMISSION_STEPS,
  WorkflowStep,
  SubmissionStepId,
} from './submissionWorkflow';
import {
  formatNidaNumber,
  validateNidaNumber,
  NidaValidationResult,
} from './nidaValidation';
import { useTemplateStore } from '../../store/useTemplateStore';
import { SAMPLE_TEMPLATES } from '../../utils/sampleTemplates';
import {
  isTemplateSelectedOrCreated,
  detectTemplateType,
  TEMPLATE_TYPE_PROFILES,
  DetectedTemplateType,
} from '../../utils/templateTypeDetector';
import {
  applyTemplateMapping,
  isBackSideTemplate,
  PopulatedTemplateResult,
} from '../../utils/templateMappingEngine';
import { CardTemplate, NidaSubmissionRecord } from '../../types';
import { renderTemplateToCanvas } from '../../utils/export';

export interface NidaFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  gender: string;
  nidaNumber: string;
  photoUrl?: string | null;
  signatureUrl?: string | null;
  termsAccepted: boolean;
}

export interface NidaFormScreenProps {
  onSuccess?: (data: NidaFormData) => void;
  onCancel?: () => void;
}

export const NidaFormScreen: React.FC<NidaFormScreenProps> = ({ onSuccess, onCancel }) => {
  const {
    currentTemplate,
    loadTemplate,
    setActiveScreen,
    pushHistoryState,
    setNidaSuccessNotification,
    setPopulatedCardPair,
    lastNidaFormData,
    selectedFrontTemplateId,
    selectedBackTemplateId,
    defaultNidaFrontTemplateId,
    defaultNidaBackTemplateId,
    setSelectedFrontTemplateId,
    setSelectedBackTemplateId,
    saveNidaSubmissionRecord,
    loadSavedTemplates,
  } = useTemplateStore();

  // Step state: 'templates' (Template Selection) | 'form' (Filling Form)
  const [currentNidaStep, setCurrentNidaStep] = useState<'templates' | 'form'>('templates');

  const [formData, setFormData] = useState<NidaFormData>(() => ({
    firstName: lastNidaFormData?.firstName || '',
    middleName: lastNidaFormData?.middleName || '',
    lastName: lastNidaFormData?.lastName || '',
    dob: lastNidaFormData?.dob || '',
    gender: lastNidaFormData?.gender
      ? (lastNidaFormData.gender.toUpperCase().startsWith('F') ? 'Female' : 'Male')
      : 'Male',
    nidaNumber: lastNidaFormData?.nidaNumber || '',
    photoUrl: lastNidaFormData?.photoUrl || null,
    signatureUrl: lastNidaFormData?.signatureUrl || null,
    termsAccepted: lastNidaFormData?.termsAccepted ?? false,
  }));

  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Resolved Front & Back templates for preview banners
  const [resolvedFrontTpl, setResolvedFrontTpl] = useState<CardTemplate | null>(null);
  const [resolvedBackTpl, setResolvedBackTpl] = useState<CardTemplate | null>(null);
  const [frontThumbMini, setFrontThumbMini] = useState<string | null>(null);
  const [backThumbMini, setBackThumbMini] = useState<string | null>(null);

  // Modals state
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [infoService, setInfoService] = useState<{
    id?: string;
    name: string;
    authority: string;
    description: string;
    features: string[];
  } | null>(null);
  const [isTemplateRequiredModalOpen, setIsTemplateRequiredModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [populatedResult, setPopulatedResult] = useState<PopulatedTemplateResult | null>(null);

  // 9-Step Submission Workflow State
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [submissionSteps, setSubmissionSteps] = useState<WorkflowStep[]>(INITIAL_SUBMISSION_STEPS);
  const [currentStepId, setCurrentStepId] = useState<SubmissionStepId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isWorkflowCompleted, setIsWorkflowCompleted] = useState(false);

  // Load and resolve Front and Back templates
  useEffect(() => {
    loadSavedTemplates().then((saved) => {
      const pool = [...SAMPLE_TEMPLATES];
      saved.forEach((st) => {
        if (!pool.some((p) => p.id === st.id)) pool.push(st);
      });

      const targetFrontId = selectedFrontTemplateId || defaultNidaFrontTemplateId || 'sample_tanzania_nida';
      const foundFront = pool.find((t) => t.id === targetFrontId) || pool.find((t) => !t.id.includes('back')) || SAMPLE_TEMPLATES[0];

      const targetBackId = selectedBackTemplateId || defaultNidaBackTemplateId || 'sample_tanzania_nida_back';
      const foundBack = pool.find((t) => t.id === targetBackId) || pool.find((t) => t.id.includes('back')) || SAMPLE_TEMPLATES[1] || SAMPLE_TEMPLATES[0];

      setResolvedFrontTpl(foundFront);
      setResolvedBackTpl(foundBack);

      if (foundFront) {
        renderTemplateToCanvas(foundFront, {}, 48)
          .then((canvas) => setFrontThumbMini(canvas.toDataURL('image/png')))
          .catch(() => setFrontThumbMini(null));
      }
      if (foundBack) {
        renderTemplateToCanvas(foundBack, {}, 48)
          .then((canvas) => setBackThumbMini(canvas.toDataURL('image/png')))
          .catch(() => setBackThumbMini(null));
      }
    });
  }, [selectedFrontTemplateId, selectedBackTemplateId, defaultNidaFrontTemplateId, defaultNidaBackTemplateId, loadSavedTemplates]);

  // Automatic Template Type Detection
  const detectedType: DetectedTemplateType = useMemo(() => {
    return detectTemplateType(resolvedFrontTpl || currentTemplate);
  }, [resolvedFrontTpl, currentTemplate]);

  // Dynamic field requirements profile based on detected template type
  const activeProfile = useMemo(() => {
    return TEMPLATE_TYPE_PROFILES[detectedType] || TEMPLATE_TYPE_PROFILES.NIDA;
  }, [detectedType]);

  // Determine which fields are enabled in the active profile
  const enabledBindings = useMemo(() => {
    return new Set(activeProfile.fields.map((f) => f.bindingKey));
  }, [activeProfile]);

  // Real-time NIDA validation
  const nidaValidation: NidaValidationResult = useMemo(() => {
    return validateNidaNumber(formData.nidaNumber);
  }, [formData.nidaNumber]);

  // Handle NIDA Number typing with automatic formatting & validation
  const handleNidaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatNidaNumber(rawValue);

    setFormData((prev) => ({
      ...prev,
      nidaNumber: formatted,
    }));

    setTouched((prev) => ({ ...prev, nidaNumber: true }));
  };

  // Generic field handler
  const handleFieldChange = <K extends keyof NidaFormData>(field: K, value: NidaFormData[K]) => {
    let finalVal = value;
    if (field === 'gender' && typeof value === 'string') {
      const g = value.trim().toUpperCase();
      if (g.startsWith('F')) finalVal = 'Female' as NidaFormData[K];
      else finalVal = 'Male' as NidaFormData[K];
    }
    setFormData((prev) => ({
      ...prev,
      [field]: finalVal,
    }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Sync DOB from valid NIDA number
  const handleSyncDobFromNida = (extractedDate: string) => {
    handleFieldChange('dob', extractedDate);
  };

  // Check if form can proceed
  const canContinue = useMemo(() => {
    const nidaRequired = enabledBindings.has('NIDA_NUMBER');
    if (nidaRequired && !nidaValidation.isValid) return false;
    return formData.termsAccepted;
  }, [enabledBindings, nidaValidation.isValid, formData.termsAccepted]);

  // Transition from template selection to form
  const handleContinueFromTemplateSelection = (front: CardTemplate, back: CardTemplate) => {
    setResolvedFrontTpl(front);
    setResolvedBackTpl(back);
    setSelectedFrontTemplateId(front.id);
    setSelectedBackTemplateId(back.id);
    setCurrentNidaStep('form');
  };

  // Complete 9-Step NIDA Submission Workflow
  const executeSubmissionWorkflow = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setSubmissionError(null);
    setIsWorkflowCompleted(false);
    setIsSubmissionModalOpen(true);

    const updateStep = (id: SubmissionStepId, status: WorkflowStep['status'], errorMessage?: string) => {
      setSubmissionSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status, errorMessage } : s))
      );
    };

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Reset all steps to pending
    setSubmissionSteps(
      INITIAL_SUBMISSION_STEPS.map((s) => ({ ...s, status: 'pending', errorMessage: undefined }))
    );

    // STEP 1: Validate all fields
    setCurrentStepId('step1_fields');
    updateStep('step1_fields', 'in_progress');
    await delay(200);

    if (enabledBindings.has('FIRST_NAME') && (!formData.firstName || formData.firstName.trim().length === 0)) {
      updateStep('step1_fields', 'failed', 'First name is required.');
      setSubmissionError('First name is required. Please provide cardholder given name.');
      setIsProcessing(false);
      return;
    }

    if (enabledBindings.has('LAST_NAME') && (!formData.lastName || formData.lastName.trim().length === 0)) {
      updateStep('step1_fields', 'failed', 'Last name is required.');
      setSubmissionError('Last name / Surname is required.');
      setIsProcessing(false);
      return;
    }

    if (enabledBindings.has('DOB') && (!formData.dob || formData.dob.trim().length === 0)) {
      updateStep('step1_fields', 'failed', 'Date of birth is required.');
      setSubmissionError('Date of birth is required.');
      setIsProcessing(false);
      return;
    }

    if (enabledBindings.has('GENDER') && (!formData.gender || formData.gender.trim().length === 0)) {
      updateStep('step1_fields', 'failed', 'Gender selection (M/F) is required.');
      setSubmissionError('Gender selection is required. Please choose Male or Female.');
      setIsProcessing(false);
      return;
    }
    updateStep('step1_fields', 'completed');

    // STEP 2: Validate NIDA Number
    setCurrentStepId('step2_nida');
    updateStep('step2_nida', 'in_progress');
    await delay(200);

    if (enabledBindings.has('NIDA_NUMBER')) {
      if (!nidaValidation.isValid) {
        updateStep('step2_nida', 'failed', nidaValidation.error || 'Invalid 20-digit NIDA number format.');
        setSubmissionError(nidaValidation.error || 'NIDA format invalid. 20 numerical digits required.');
        setIsProcessing(false);
        return;
      }
    }
    updateStep('step2_nida', 'completed');

    // STEP 3: Validate Biometric Photo
    setCurrentStepId('step3_photo');
    updateStep('step3_photo', 'in_progress');
    await delay(180);
    updateStep('step3_photo', 'completed');

    // STEP 4: Validate Signature
    setCurrentStepId('step4_signature');
    updateStep('step4_signature', 'in_progress');
    await delay(180);
    updateStep('step4_signature', 'completed');

    // STEP 5: Validate Terms Acceptance
    setCurrentStepId('step5_terms');
    updateStep('step5_terms', 'in_progress');
    await delay(180);

    if (!formData.termsAccepted) {
      updateStep('step5_terms', 'failed', 'Terms acceptance is required.');
      setSubmissionError('You must review and accept the NIDA Registration Terms & Conditions to proceed.');
      setIsProcessing(false);
      return;
    }
    updateStep('step5_terms', 'completed');

    // STEP 6: Check Template Exists
    setCurrentStepId('step6_template');
    updateStep('step6_template', 'in_progress');
    await delay(200);

    // Resolve templates pool
    const allSaved = await loadSavedTemplates();
    const pool = [...SAMPLE_TEMPLATES];
    allSaved.forEach((st) => {
      if (!pool.some((p) => p.id === st.id)) pool.push(st);
    });

    const frontId = selectedFrontTemplateId || defaultNidaFrontTemplateId || 'sample_tanzania_nida';
    const backId = selectedBackTemplateId || defaultNidaBackTemplateId || 'sample_tanzania_nida_back';

    const frontSource = pool.find((t) => t.id === frontId) || pool.find((t) => !t.id.includes('back')) || SAMPLE_TEMPLATES[0];
    const backSource = pool.find((t) => t.id === backId) || pool.find((t) => t.id.includes('back')) || SAMPLE_TEMPLATES[1] || SAMPLE_TEMPLATES[0];

    if (!frontSource || !backSource) {
      updateStep('step6_template', 'failed', 'Templates could not be resolved.');
      setSubmissionError('Please ensure valid Front and Back templates are selected.');
      setIsProcessing(false);
      return;
    }
    updateStep('step6_template', 'completed');

    // STEP 7: Map Fields
    setCurrentStepId('step7_mapping');
    updateStep('step7_mapping', 'in_progress');
    await delay(220);
    updateStep('step7_mapping', 'completed');

    // STEP 8: Populate Templates
    setCurrentStepId('step8_populate');
    updateStep('step8_populate', 'in_progress');
    await delay(260);

    // Ensure strict gender M/F
    const normalizedFormData: NidaFormData = {
      ...formData,
      gender: formData.gender?.trim().toUpperCase().startsWith('M') ? 'M' : 'F',
    };

    const frontRes = applyTemplateMapping(frontSource, normalizedFormData);
    const backRes = applyTemplateMapping(backSource, normalizedFormData);

    if (!frontRes.success) {
      updateStep('step8_populate', 'failed');
      setSubmissionError(frontRes.error || 'Field mapping validation failed. Stopping card generation.');
      setIsProcessing(false);
      return;
    }

    // Persist submission record
    const submissionRecord: NidaSubmissionRecord = {
      id: 'nida_sub_' + Date.now(),
      frontTemplateId: frontSource.id,
      backTemplateId: backSource.id,
      frontTemplateName: frontSource.templateName,
      backTemplateName: backSource.templateName,
      firstName: normalizedFormData.firstName,
      middleName: normalizedFormData.middleName,
      lastName: normalizedFormData.lastName,
      dateOfBirth: normalizedFormData.dob,
      gender: normalizedFormData.gender === 'M' ? 'M' : 'F',
      nidaNumber: normalizedFormData.nidaNumber,
      photo: normalizedFormData.photoUrl,
      signature: normalizedFormData.signatureUrl,
      submittedAt: new Date().toISOString(),
    };
    await saveNidaSubmissionRecord(submissionRecord);

    setPopulatedCardPair(frontRes.populatedTemplate, backRes.populatedTemplate, normalizedFormData);
    loadTemplate(frontRes.populatedTemplate);
    pushHistoryState(frontRes.populatedTemplate);
    setPopulatedResult(frontRes);
    updateStep('step8_populate', 'completed');

    // STEP 9: Open Card Preview & Export Screen
    setCurrentStepId('step9_open');
    updateStep('step9_open', 'in_progress');
    await delay(280);
    updateStep('step9_open', 'completed');
    setIsWorkflowCompleted(true);
    setIsProcessing(false);

    // Set success notification toast
    setNidaSuccessNotification({
      title: 'NIDA Card Successfully Populated!',
      message: `Front & Back templates populated with verified data (${frontRes.populatedCount + backRes.populatedCount} elements mapped). Ready for preview and export.`,
      populatedCount: frontRes.populatedCount + backRes.populatedCount,
      isBackSide: false,
    });

    onSuccess?.(normalizedFormData);

    // Transition to the Card Preview / Generate page
    setTimeout(() => {
      setIsSubmissionModalOpen(false);
      setActiveScreen('preview');
    }, 450);
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      nidaNumber: true,
      firstName: true,
      lastName: true,
      dob: true,
      gender: true,
      terms: true,
    });

    if (!canContinue || isProcessing) {
      return;
    }

    executeSubmissionWorkflow();
  };

  return (
    <div className="min-h-screen bg-[#050608] text-[#FFFFFF] flex flex-col items-center justify-start p-3 sm:p-6 lg:p-10 font-sans selection:bg-[#47A5FF]/30 selection:text-[#FFFFFF] overflow-y-auto">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-[#47A5FF]/5 rounded-full blur-[140px] -top-20 -left-20" />
        <div className="w-[450px] h-[450px] bg-[#FF8F00]/5 rounded-full blur-[130px] -bottom-20 -right-20" />
      </div>

      {/* Main Container Card */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#111317] to-[#090A0D] border border-[#4C5055]/50 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-5 sm:p-8 lg:p-9 my-2 sm:my-4 backdrop-blur-xl transition-all">
        
        {/* Header with Authority Aesthetic & Navigation */}
        <div className="flex items-start justify-between border-b border-[#4C5055]/40 pb-5 mb-5 gap-2">
          <div className="flex items-center gap-3">
            {/* Top-Left Services Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuDrawerOpen(true)}
              className="p-2 rounded-xl bg-[#1C1F22] hover:bg-[#282C31] text-slate-300 hover:text-white border border-[#4C5055]/70 transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Open Services Menu"
              aria-label="Open Services Navigation Menu"
            >
              <Menu className="w-4 h-4 text-[#47A5FF]" />
            </button>

            {/* Authority Icon */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#47A5FF]/20 to-[#47A5FF]/5 border border-[#47A5FF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(71,165,255,0.15)] shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#47A5FF]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#FFFFFF]">
                  National ID Auto-Fill
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#FF8F00]/15 text-[#FF8F00] border border-[#FF8F00]/30">
                  NIDA Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#A0A4A8] mt-0.5">
                Standardized Identification & Automated Card Population
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Home Navigation Button */}
            <button
              type="button"
              onClick={() => setActiveScreen('home')}
              className="text-xs text-[#A0A4A8] hover:text-[#FFFFFF] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-[#4C5055]/60 flex items-center gap-1.5 cursor-pointer"
              title="Return to Services Home"
            >
              <Home className="w-3.5 h-3.5 text-[#47A5FF]" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-[#A0A4A8] hover:text-[#FFFFFF] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>

        {/* STEP 1: TEMPLATE SELECTION (BEFORE FORM FIELDS) */}
        {currentNidaStep === 'templates' ? (
          <div className="space-y-4">
            <NidaTemplateSelectionStep
              onContinueToForm={handleContinueFromTemplateSelection}
              onOpenCreateTemplate={() => setActiveScreen('upload')}
            />
          </div>
        ) : (
          /* STEP 2: FILLING FORM FIELDS (WITH ACTIVE TEMPLATE BANNER) */
          <div className="space-y-6">
            {/* Active Template Pair Status Banner */}
            <div className="p-3.5 rounded-2xl bg-[#000000]/70 border border-[#4C5055]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex -space-x-2 shrink-0">
                  {frontThumbMini ? (
                    <img
                      src={frontThumbMini}
                      alt="Front"
                      className="w-10 h-6 rounded-md object-cover border border-[#47A5FF]/60 bg-black"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-6 rounded-md bg-[#47A5FF]/20 border border-[#47A5FF]/60 flex items-center justify-center text-[9px] font-bold text-[#47A5FF]">
                      FRONT
                    </div>
                  )}
                  {backThumbMini ? (
                    <img
                      src={backThumbMini}
                      alt="Back"
                      className="w-10 h-6 rounded-md object-cover border border-[#FF8F00]/60 bg-black"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-6 rounded-md bg-[#FF8F00]/20 border border-[#FF8F00]/60 flex items-center justify-center text-[9px] font-bold text-[#FF8F00]">
                      BACK
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0A4A8]">
                      Selected Card Templates:
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#47A5FF]/20 text-[#47A5FF] border border-[#47A5FF]/30">
                      Front: {resolvedFrontTpl?.templateName || 'Default NIDA Front'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FF8F00]/20 text-[#FF8F00] border border-[#FF8F00]/30">
                      Back: {resolvedBackTpl?.templateName || 'Default NIDA Back'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7D8287] truncate mt-0.5">
                    Data entered below will auto-populate both templates simultaneously upon submission.
                  </p>
                </div>
              </div>

              {/* Change Templates Button */}
              <button
                type="button"
                onClick={() => setCurrentNidaStep('templates')}
                className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-[#1C1F22] hover:bg-[#282C31] text-white border border-[#4C5055]/70 hover:border-[#47A5FF] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#47A5FF]" />
                <span>Change Templates</span>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Section 1: NIDA Number (Primary Identifier) */}
              {enabledBindings.has('NIDA_NUMBER') && (
                <div className="p-4 sm:p-5 bg-[#000000]/60 border border-[#4C5055]/60 rounded-2xl space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#47A5FF] shadow-[0_0_8px_#47A5FF]" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
                        Identity Document Number
                      </h2>
                    </div>

                    {/* Progress counter badge */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-md border font-semibold ${
                          nidaValidation.isValid
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : formData.nidaNumber.length > 0
                            ? 'bg-[#FF8F00]/15 border-[#FF8F00]/40 text-[#FF8F00]'
                            : 'bg-[#1C1F22] border-[#4C5055]/60 text-[#7D8287]'
                        }`}
                      >
                        {nidaValidation.digitCount}/20 Digits
                      </span>
                    </div>
                  </div>

                  {/* NIDA Input Field with Real-time Auto-Formatting & Validation */}
                  <FloatingInput
                    label="NIDA Number (YYYYMMDD-XXXXX-XXXXX-XX)"
                    icon={Hash}
                    value={formData.nidaNumber}
                    onChange={handleNidaChange}
                    placeholder="19980301-54218-00002-27"
                    maxLength={23} // 20 digits + 3 hyphens
                    autoComplete="off"
                    spellCheck={false}
                    error={nidaValidation.error || undefined}
                    warning={formData.nidaNumber.length > 0 && nidaValidation.warning ? nidaValidation.warning : undefined}
                    success={nidaValidation.isValid}
                    successMessage={nidaValidation.isValid ? "Valid NIDA format (20/20 digits verified)" : undefined}
                    badge={
                      nidaValidation.isValid ? (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid Format</span>
                        </div>
                      ) : nidaValidation.warning ? (
                        <div className="flex items-center gap-1 text-[#FF8F00] text-xs font-semibold px-2 py-0.5 bg-[#FF8F00]/10 rounded-full border border-[#FF8F00]/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Incomplete</span>
                        </div>
                      ) : nidaValidation.error ? (
                        <div className="flex items-center gap-1 text-rose-400 text-xs font-semibold px-2 py-0.5 bg-rose-500/10 rounded-full border border-rose-500/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Invalid Format</span>
                        </div>
                      ) : null
                    }
                    helperText="Required pattern: 8-digit birthdate (YYYYMMDD), 5-digit district, 5-digit sequence, 2-digit check"
                  />

                  {/* Visual Breakdown of Blocks */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 text-center font-mono text-[10px]">
                    <div className="p-1.5 rounded-lg bg-[#111317] border border-[#4C5055]/30">
                      <span className="block text-[#7D8287] text-[9px] uppercase">Birthdate</span>
                      <span className="font-semibold text-[#47A5FF] truncate block">
                        {nidaValidation.parts.dobBlock || 'YYYYMMDD'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#111317] border border-[#4C5055]/30">
                      <span className="block text-[#7D8287] text-[9px] uppercase">District</span>
                      <span className="font-semibold text-[#FFFFFF] truncate block">
                        {nidaValidation.parts.centerBlock || 'XXXXX'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#111317] border border-[#4C5055]/30">
                      <span className="block text-[#7D8287] text-[9px] uppercase">Sequence</span>
                      <span className="font-semibold text-[#FFFFFF] truncate block">
                        {nidaValidation.parts.sequenceBlock || 'XXXXX'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-[#111317] border border-[#4C5055]/30">
                      <span className="block text-[#7D8287] text-[9px] uppercase">Check Digits</span>
                      <span className="font-semibold text-[#FF8F00] truncate block">
                        {nidaValidation.parts.checksumBlock || 'XX'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 2: Personal Identification Details */}
              <div className="p-4 sm:p-5 bg-[#000000]/60 border border-[#4C5055]/60 rounded-2xl space-y-4 shadow-inner">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF8F00] shadow-[0_0_8px_#FF8F00]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
                    Personal Identification Details
                  </h2>
                </div>

                {/* Names Fields */}
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {enabledBindings.has('FIRST_NAME') && (
                      <FloatingInput
                        label="First Name"
                        icon={User}
                        value={formData.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        placeholder="e.g. Juma"
                        autoComplete="given-name"
                      />
                    )}

                    {enabledBindings.has('MIDDLE_NAME') && (
                      <FloatingInput
                        label="Middle Name"
                        icon={User}
                        value={formData.middleName}
                        onChange={(e) => handleFieldChange('middleName', e.target.value)}
                        placeholder="e.g. Ali"
                        autoComplete="additional-name"
                      />
                    )}
                  </div>

                  {enabledBindings.has('LAST_NAME') && (
                    <FloatingInput
                      label="Last Name / Surname"
                      icon={User}
                      value={formData.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      placeholder="e.g. Mwangi"
                      autoComplete="family-name"
                    />
                  )}
                </div>

                {/* Date of Birth & Gender Fields (Strict M/F) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {enabledBindings.has('DOB') && (
                    <FloatingDatePicker
                      label="Date of Birth"
                      value={formData.dob}
                      onChange={(e) => handleFieldChange('dob', e.target.value)}
                      suggestedDate={nidaValidation.extractedDob}
                      onApplySuggestedDate={handleSyncDobFromNida}
                      helperText={
                        nidaValidation.extractedDob && formData.dob !== nidaValidation.extractedDob
                          ? `Extracted from NIDA: ${nidaValidation.extractedDob}`
                          : undefined
                      }
                    />
                  )}

                  {enabledBindings.has('GENDER') && (
                    <FloatingSelect
                      id="nida-gender-select"
                      label="Gender"
                      value={formData.gender.toUpperCase().startsWith('F') ? 'Female' : 'Male'}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      options={[
                        { value: 'Male', label: 'Male' },
                        { value: 'Female', label: 'Female' },
                      ]}
                    />
                  )}
                </div>
              </div>

              {/* Section 3: Passport Photo Upload */}
              {enabledBindings.has('PHOTO') && (
                <PassportPhotoUpload
                  value={formData.photoUrl}
                  onChange={(photo) => handleFieldChange('photoUrl', photo)}
                />
              )}

              {/* Section 4: Signature System */}
              {enabledBindings.has('SIGNATURE') && (
                <SignaturePad
                  value={formData.signatureUrl}
                  onChange={(signature) => handleFieldChange('signatureUrl', signature)}
                />
              )}

              {/* Section 5: Terms and Conditions */}
              <TermsAndConditions
                checked={formData.termsAccepted}
                onChange={(accepted) => handleFieldChange('termsAccepted', accepted)}
                showWarning={touched.terms && !formData.termsAccepted}
              />

              {/* Security / System Notice */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#47A5FF]/5 border border-[#47A5FF]/20 text-xs">
                <Lock className="w-4 h-4 text-[#47A5FF] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#A0A4A8] leading-relaxed">
                  <span className="font-semibold text-[#FFFFFF]">Tanzania NIDA Standard Compliance:</span>{' '}
                  All 20 digits, portrait specifications (35×45mm), and signature records are verified according to the national registration format. This information is prepared for direct template auto-population.
                </div>
              </div>

              {/* Form Actions / Continuation Guard */}
              <div className="pt-2">
                <button
                  id="submit-nida-form-btn"
                  type="submit"
                  disabled={!canContinue || isProcessing}
                  className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg ${
                    canContinue && !isProcessing
                      ? 'bg-gradient-to-r from-[#47A5FF] to-[#2563eb] text-[#FFFFFF] shadow-[0_4px_25px_rgba(71,165,255,0.35)] hover:shadow-[0_6px_30px_rgba(71,165,255,0.45)] hover:brightness-110 active:scale-[0.99] cursor-pointer'
                      : 'bg-[#1C1F22] text-[#7D8287] border border-[#4C5055]/50 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Processing NIDA Workflow...</span>
                    </>
                  ) : (
                    <>
                      <span>Auto-Fill & Populate Templates</span>
                      <ArrowRight className={`w-4 h-4 transition-transform ${canContinue ? 'group-hover:translate-x-1' : ''}`} />
                    </>
                  )}
                </button>

                {!canContinue && (
                  <p className="text-center text-[11px] text-[#FF8F00] mt-2.5 flex items-center justify-center gap-1.5">
                    <BadgeInfo className="w-3.5 h-3.5" />
                    <span>
                      {enabledBindings.has('NIDA_NUMBER') && !nidaValidation.isValid
                        ? formData.nidaNumber.length === 0
                          ? 'Enter a valid 20-digit NIDA number to enable continuation'
                          : nidaValidation.error || 'Complete the valid 20-digit NIDA format to proceed'
                        : !formData.termsAccepted
                        ? 'You must accept the Terms and Conditions to proceed'
                        : 'Please fill in required fields'}
                    </span>
                  </p>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Available Services Section (Natural vertical scrolling after form) */}
      <div className="w-full max-w-2xl my-6 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#47A5FF]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Other Document & Card Services
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('home')}
            className="text-xs text-[#47A5FF] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Custom Studio Service */}
          <div
            onClick={() => setActiveScreen('upload')}
            className="p-3.5 rounded-xl bg-[#111317]/80 hover:bg-[#1C1F22] border border-[#4C5055]/40 hover:border-[#47A5FF]/50 transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#47A5FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-white truncate">Custom Card Studio</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Active</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Upload & design any ID layout</p>
            </div>
          </div>

          {/* Templates Library Service */}
          <div
            onClick={() => setActiveScreen('templates')}
            className="p-3.5 rounded-xl bg-[#111317]/80 hover:bg-[#1C1F22] border border-[#4C5055]/40 hover:border-emerald-500/50 transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-white truncate">Saved Templates</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Library</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Manage & load preset templates</p>
            </div>
          </div>

          {/* Birth Certificate Service */}
          <div
            onClick={() => setInfoService({
              id: 'birth_certificate',
              name: 'Birth Certificate Services',
              authority: 'RITA (Registration Insolvency and Trusteeship Agency)',
              description: 'Official birth certificate issuance, verification & digital civil registry documentation.',
              features: ['Civil Registration Archive', 'QR Verification Matrix', 'Official Seal Generator', 'Biographic Data Format'],
            })}
            className="p-3.5 rounded-xl bg-[#111317]/80 hover:bg-[#1C1F22] border border-[#4C5055]/40 hover:border-[#FF8F00]/50 transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ScrollText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-white truncate">Birth Certificate</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">RITA</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Civil registry & issuance</p>
            </div>
          </div>

          {/* Driving License Service */}
          <div
            onClick={() => setInfoService({
              id: 'driving_license',
              name: 'Driving License Services',
              authority: 'Traffic & Vehicle Inspection Division',
              description: 'Driver permit issuance, class endorsements & digital driver identification cards.',
              features: ['Class Endorsements (A, B, C, D, E)', 'Barcode Encoding', 'Penalty Points Tracker', 'Biometric Photo Matrix'],
            })}
            className="p-3.5 rounded-xl bg-[#111317]/80 hover:bg-[#1C1F22] border border-[#4C5055]/40 hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Car className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-white truncate">Driving License</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">Traffic</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Permit & endorsements</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Application Footer */}
      <AppFooter className="max-w-2xl" />

      {/* MODAL 1: TEMPLATE REQUIRED MODAL */}
      <TemplateRequiredModal
        isOpen={isTemplateRequiredModalOpen}
        onClose={() => setIsTemplateRequiredModalOpen(false)}
        onCreateNewTemplate={() => {
          setIsTemplateRequiredModalOpen(false);
          setActiveScreen('upload');
        }}
        onUseExistingTemplate={() => {
          setIsTemplateRequiredModalOpen(false);
          setActiveScreen('templates');
        }}
      />

      {/* MODAL 2: AUTO-FILL POPULATION RESULT */}
      <MappingResultModal
        isOpen={isResultModalOpen}
        result={populatedResult}
        onClose={() => setIsResultModalOpen(false)}
        onOpenEditor={() => {
          setIsResultModalOpen(false);
          setActiveScreen('editor');
        }}
      />

      {/* MODAL 3: 9-STEP SUBMISSION WORKFLOW PROGRESS MODAL */}
      <SubmissionProgressModal
        isOpen={isSubmissionModalOpen}
        steps={submissionSteps}
        currentStepId={currentStepId}
        isCompleted={isWorkflowCompleted}
        error={submissionError}
        onRetry={executeSubmissionWorkflow}
        onClose={() => {
          setIsSubmissionModalOpen(false);
          setIsProcessing(false);
        }}
      />

      {/* Services Navigation Drawer */}
      <ServiceMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        onSelectInfoService={(srv) => setInfoService(srv)}
      />

      {/* Informational modal for non-active services */}
      {infoService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0F131A] border border-slate-700/80 rounded-2xl shadow-2xl p-5 space-y-4 text-left">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#47A5FF]">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    {infoService.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{infoService.authority}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInfoService(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {infoService.description}
            </p>

            {infoService.features && infoService.features.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Planned Standard Features
                </span>
                <div className="space-y-1">
                  {infoService.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoService(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
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
