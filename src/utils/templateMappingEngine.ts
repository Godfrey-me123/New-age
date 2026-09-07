import { CardTemplate, Layer, TextLayer, ImageLayer, PlaceholderLayer, BarcodeLayer, QRCodeLayer } from '../types';
import { NidaFormData } from '../components/nida/NidaFormScreen';

export type { NidaFormData };

export type SupportedBinding =
  | 'FIRST_NAME'
  | 'MIDDLE_NAME'
  | 'LAST_NAME'
  | 'DOB'
  | 'GENDER'
  | 'NIDA_NUMBER'
  | 'PHOTO'
  | 'SIGNATURE';

export const ALL_SUPPORTED_BINDINGS: SupportedBinding[] = [
  'FIRST_NAME',
  'MIDDLE_NAME',
  'LAST_NAME',
  'DOB',
  'GENDER',
  'NIDA_NUMBER',
  'PHOTO',
  'SIGNATURE',
];

export interface FieldMappingDetail {
  binding: SupportedBinding;
  layerId: string;
  layerName: string;
  layerType: Layer['type'];
  originalValue: string;
  newValue: string;
}

export interface MissingBindingDetail {
  binding: SupportedBinding;
  label: string;
  warning: string;
}

export interface MappingPlan {
  templateId: string;
  templateName: string;
  matchedBindings: SupportedBinding[];
  missingBindings: MissingBindingDetail[];
  fieldMappings: FieldMappingDetail[];
  warnings: string[];
}

export interface PopulatedTemplateResult {
  success: boolean;
  populatedTemplate: CardTemplate;
  plan: MappingPlan;
  populatedCount: number;
  skippedCount: number;
  warnings: string[];
  error?: string;
  isBackSide?: boolean;
}

/**
 * Checks if a template is a Back Side template
 */
export function isBackSideTemplate(template: CardTemplate | null | undefined): boolean {
  if (!template) return false;
  const side = (template.side || '').toLowerCase();
  const name = (template.templateName || '').toLowerCase();
  return (
    side.includes('back') ||
    name.includes('back side') ||
    name.includes('back-side') ||
    name.includes('(back)') ||
    name.includes('backside')
  );
}

/**
 * Ensures a template has explicit fieldId, fieldName, bindingKey, and fieldType attributes on all variable layers.
 * Guarantees persistent 1-to-1 mapping across environments and cached stores.
 */
export function ensureTemplateFieldIds(template: CardTemplate): CardTemplate {
  if (!template || !Array.isArray(template.layers)) return template;

  const keyMap: Record<SupportedBinding, string> = {
    FIRST_NAME: 'firstName',
    MIDDLE_NAME: 'middleName',
    LAST_NAME: 'lastName',
    DOB: 'dateOfBirth',
    GENDER: 'gender',
    NIDA_NUMBER: 'nidaNumber',
    PHOTO: 'photo',
    SIGNATURE: 'signature',
  };

  const sanitizedLayers = template.layers.map((layer) => {
    const resolvedBinding = getLayerBinding(layer, template.layers);
    if (!resolvedBinding) return layer;

    const canonicalKey = keyMap[resolvedBinding] || 'field';

    return {
      ...layer,
      bindingKey: layer.bindingKey || resolvedBinding,
      fieldId: layer.fieldId || layer.fieldName || canonicalKey,
      fieldName: layer.fieldName || layer.fieldId || canonicalKey,
      fieldType: layer.fieldType || canonicalKey,
    };
  });

  return {
    ...template,
    layers: sanitizedLayers,
  };
}

/**
 * Strict 1-to-1 Field Binding Resolution.
 * Identifies the exact canonical field binding for a layer based on explicit properties, tokens, layer IDs, or composite label patterns.
 * Never uses "first available field", "fallback text field", or position guessing.
 */
export function getLayerBinding(layer: Layer, _allLayers: Layer[] = []): SupportedBinding | null {
  if (!layer) return null;

  // 1. Explicit Layer bindingKey Check
  if (layer.bindingKey) {
    const b = layer.bindingKey.toUpperCase() as any;
    if (['FIRST_NAME', 'MIDDLE_NAME', 'LAST_NAME', 'DOB', 'GENDER', 'NIDA_NUMBER', 'PHOTO', 'SIGNATURE'].includes(b)) {
      return b as SupportedBinding;
    }
  }

  // 2. Text Layer Literal Token Matching (high priority, overrides label checks!)
  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    const text = (textLayer.text || '').trim();

    if (/\{\{(?:first_name|firstname|given_name|given_names|fname)\}\}/i.test(text)) return 'FIRST_NAME';
    if (/\{\{(?:middle_name|middlename|other_names|othernames|mname)\}\}/i.test(text)) return 'MIDDLE_NAME';
    if (/\{\{(?:last_name|lastname|surname|family_name|lname)\}\}/i.test(text)) return 'LAST_NAME';
    if (/\{\{(?:dob|date_of_birth|birth_date|birthdate)\}\}/i.test(text)) return 'DOB';
    if (/\{\{(?:gender|sex|jinsia|jinsi|gender_val|sex_val|jinsi_val)\}\}/i.test(text)) return 'GENDER';
    if (/\{\{(?:nida_number|nida|id_number|national_id|nin|id_no|namba_nida)\}\}/i.test(text)) return 'NIDA_NUMBER';
  }

  // 3. Explicit Layer Attribute Checks (fieldName, fieldId, fieldType)
  const explicitField = (
    layer.fieldName ||
    layer.fieldId ||
    layer.fieldType ||
    ''
  ).toLowerCase();

  if (explicitField) {
    if (/first_?name|fname|given_?name/i.test(explicitField)) return 'FIRST_NAME';
    if (/middle_?name|mname|other_?name/i.test(explicitField)) return 'MIDDLE_NAME';
    if (/last_?name|lname|surname|family_?name/i.test(explicitField)) return 'LAST_NAME';
    if (/dob|date_?of_?birth|birth_?date/i.test(explicitField)) return 'DOB';
    if (/gender|sex|jinsi|jinsia/i.test(explicitField)) return 'GENDER';
    if (/nida_?number|nida|id_?number|national_?id|nin/i.test(explicitField)) return 'NIDA_NUMBER';
    if (/photo|portrait|avatar|picture/i.test(explicitField)) return 'PHOTO';
    if (/signature|sign|specimen|sahihi/i.test(explicitField)) return 'SIGNATURE';
  }

  // 4. Static Labels Protection (only blocks if no explicit key/token matches above)
  const isLabelIdOrName =
    /lbl_|label|header|title|authority|country|jamhuri|legal_|address/i.test(layer.id) ||
    /label|header|title|authority|country|jamhuri|legal|address/i.test(layer.name);

  if (isLabelIdOrName) {
    return null; // Explicitly static label, do NOT inject!
  }

  // 5. Barcode / QR Code Layers
  if (layer.type === 'barcode') {
    const b = layer as BarcodeLayer;
    if (/\{\{(?:id_number|nida_number|nida)\}\}/i.test(b.data) || /nida|id_no|barcode_nida/i.test(layer.id)) {
      return 'NIDA_NUMBER';
    }
  }

  if (layer.type === 'qrcode') {
    const q = layer as QRCodeLayer;
    if (/\{\{(?:id_number|nida_number|nida)\}\}/i.test(q.data) || /qr_nida/i.test(layer.id)) {
      return 'NIDA_NUMBER';
    }
  }

  // 6. Image or Placeholder Photo/Signature layers by ID / Name
  if (layer.type === 'image' || layer.type === 'placeholder') {
    if (/photo/i.test(layer.id) || /photo/i.test(layer.name)) return 'PHOTO';
    if (/sig/i.test(layer.id) || /signature/i.test(layer.name)) return 'SIGNATURE';
  }

  // 7. Text Layer Suffix and Composite matching (when no tokens present)
  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    const text = (textLayer.text || '').trim();

    // Check MRZ machine-readable lines on back templates
    if (/mrz_line1|mrz.*1/i.test(layer.id) || /mrz.*1/i.test(layer.name)) {
      return 'NIDA_NUMBER';
    }

    // Check static label text without colon or token
    if (/^(?:SURNAME|JINA LA UKOO|FIRST NAME|JINA LA KWANZA|MIDDLE NAME|LA KATI|DATE OF BIRTH|TAREHE YA KUZALIWA|SEX|JINSIA|NATIONAL ID NO|NAMBARI YA NIDA|SIGNATURE|SAHIHI|JAMHURI|NATIONAL IDENTIFICATION)/i.test(text)) {
      if (!text.includes(':') && !text.includes('{{') && !/var_/i.test(layer.id)) {
        return null;
      }
    }

    // Check Specific Layer ID / Name Suffix (supporting spaces, underscores, or hyphens)
    const layerIdentifier = `${layer.id} ${layer.name}`.toLowerCase();
    if (/(?:^|[_\s-])(?:var|txt)?[_\s-]*(?:first[_\s-]*name|given[_\s-]*name|firstname|givenname|fname)(?:[_\s-]*var)?/i.test(layerIdentifier)) return 'FIRST_NAME';
    if (/(?:^|[_\s-])(?:var|txt)?[_\s-]*(?:middle[_\s-]*name|other[_\s-]*names|middlename|othernames|mname)(?:[_\s-]*var)?/i.test(layerIdentifier)) return 'MIDDLE_NAME';
    if (/(?:^|[_\s-])(?:var|txt)?[_\s-]*(?:last[_\s-]*name|surname|family[_\s-]*name|lastname|familyname|lname)(?:[_\s-]*var)?/i.test(layerIdentifier)) return 'LAST_NAME';
    if (/(?:^|[_\s-])(?:var|txt)?[_\s-]*(?:dob|date[_\s-]*of[_\s-]*birth|birth[_\s-]*date|birthdate)(?:[_\s-]*var)?/i.test(layerIdentifier)) return 'DOB';
    if (/(?:^|[_\s-])(?:var|txt)?[_\s-]*(?:gender|sex|jinsi|jinsia)(?:[_\s-]*var)?/i.test(layerIdentifier)) return 'GENDER';
    if (/(?:^|[_\s-])(?:var|txt)?[_\s-]*(?:nida[_\s-]*number|nida|id[_\s-]*number|national[_\s-]*id|nin|id[_\s-]*no|namba[_\s-]*nida|barcode)(?:[_\s-]*var)?/i.test(layerIdentifier)) return 'NIDA_NUMBER';

    // Check Composite Text Label Prefixes (supporting optional colons)
    if (/^jina\s*[:：\-]?\s*/i.test(text) && !/jina\s+la\s+(?:mwisho|ukoo)/i.test(text)) return 'FIRST_NAME';
    if (/^(?:jina\s+la\s+(?:mwisho|ukoo)|surname|last\s*name)\s*[:：\-]?\s*/i.test(text)) return 'LAST_NAME';
    if (/^(?:middle\s*name|la\s+kati)\s*[:：\-]?\s*/i.test(text)) return 'MIDDLE_NAME';
    if (/^(?:tarehe\s+ya\s+kuzaliwa|date\s+of\s+birth|dob)\s*[:：\-]?\s*/i.test(text)) return 'DOB';
    if (/^(?:jinsi|jinsia|sex|gender)\s*[:：\-]?\s*/i.test(text)) return 'GENDER';
    if (/^(?:national\s*id\s*no|nambari\s*ya\s*nida|nida\s*no)\s*[:：\-]?\s*/i.test(text)) return 'NIDA_NUMBER';
  }

  return null;
}

/**
 * Backward compatibility matchLayerToBinding wrapper
 */
export function matchLayerToBinding(layer: Layer, binding: SupportedBinding, allLayers: Layer[] = []): boolean {
  const resolved = getLayerBinding(layer, allLayers);
  return resolved === binding;
}

/**
 * Extracts form value for a binding
 */
export function getFormValueForBinding(binding: SupportedBinding, formData: Partial<NidaFormData>): string {
  switch (binding) {
    case 'FIRST_NAME':
      return formData.firstName?.trim() || '';
    case 'MIDDLE_NAME':
      return formData.middleName?.trim() || '';
    case 'LAST_NAME':
      return formData.lastName?.trim() || '';
    case 'DOB':
      return formData.dob || '';
    case 'GENDER': {
      const g = (formData.gender || '').trim().toUpperCase();
      if (g.startsWith('M')) return 'M';
      if (g.startsWith('F')) return 'F';
      return g || 'M';
    }
    case 'NIDA_NUMBER':
      return formData.nidaNumber || '';
    case 'PHOTO':
      return formData.photoUrl || '';
    case 'SIGNATURE':
      return formData.signatureUrl || '';
    default:
      return '';
  }
}

/**
 * Injects EXACT value into a matched layer.
 * Guarantees that a layer assigned to `lastName` receives `formData.lastName`, `dob` receives `formData.dob`, `gender` receives `'M'`/`'F'`, etc.
 */
export function injectValueIntoLayer(layer: Layer, binding: SupportedBinding, formData: NidaFormData): Layer {
  const targetGender: 'M' | 'F' = (formData.gender || '').trim().toUpperCase().startsWith('M') ? 'M' : 'F';

  if (binding === 'PHOTO') {
    if (layer.type === 'placeholder' || layer.type === 'image') {
      if (!formData.photoUrl) return layer;
      return {
        ...layer,
        type: 'image',
        src: formData.photoUrl,
        aspectRatioLocked: true,
      } as ImageLayer;
    }
    return layer; // NEVER replace text fields with photo!
  }

  if (binding === 'SIGNATURE') {
    if (layer.type === 'placeholder' || layer.type === 'image') {
      if (!formData.signatureUrl) return layer;
      return {
        ...layer,
        type: 'image',
        src: formData.signatureUrl,
        aspectRatioLocked: true,
      } as ImageLayer;
    }
    return layer; // NEVER replace text fields with signature!
  }

  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    let text = textLayer.text || '';

    switch (binding) {
      case 'FIRST_NAME': {
        const val = (formData.firstName || '').trim();
        if (text.includes('{{')) {
          text = text.replace(/\{\{(?:first_name|firstname|given_name|given_names|fname)\}\}/gi, val);
        } else if (/^(?:jina|given\s*name)\s*[:：\-]?\s*/i.test(text)) {
          text = text.replace(/^(?:jina|given\s*name)\s*[:：\-]?\s*.*/i, `JINA : ${val}`);
        } else {
          text = val;
        }
        break;
      }
      case 'MIDDLE_NAME': {
        const val = (formData.middleName || '').trim();
        if (text.includes('{{')) {
          text = text.replace(/\{\{(?:middle_name|middlename|other_names|othernames|mname)\}\}/gi, val);
        } else if (/^(?:middle\s*name|la\s+kati)\s*[:：\-]?\s*/i.test(text)) {
          text = text.replace(/^(?:middle\s*name|la\s+kati)\s*[:：\-]?\s*.*/i, `MIDDLE NAME : ${val}`);
        } else {
          text = val;
        }
        break;
      }
      case 'LAST_NAME': {
        const val = (formData.lastName || '').trim();
        if (text.includes('{{')) {
          text = text.replace(/\{\{(?:last_name|lastname|surname|family_name|lname)\}\}/gi, val);
        } else if (/^(?:jina\s+la\s+(?:mwisho|ukoo)|surname|last\s*name)\s*[:：\-]?\s*/i.test(text)) {
          text = text.replace(/^(?:jina\s+la\s+(?:mwisho|ukoo)|surname|last\s*name)\s*[:：\-]?\s*.*/i, `JINA LA MWISHO : ${val}`);
        } else {
          text = val;
        }
        break;
      }
      case 'DOB': {
        const val = formData.dob || '';
        if (text.includes('{{')) {
          text = text.replace(/\{\{(?:dob|date_of_birth|birth_date|birthdate)\}\}/gi, val);
        } else if (/^(?:tarehe\s+ya\s+kuzaliwa|date\s+of\s+birth|dob)\s*[:：\-]?\s*/i.test(text)) {
          text = text.replace(/^(?:tarehe\s+ya\s+kuzaliwa|date\s+of\s+birth|dob)\s*[:：\-]?\s*.*/i, `TAREHE YA KUZALIWA: ${val}`);
        } else {
          text = val;
        }
        break;
      }
      case 'GENDER': {
        if (text.includes('{{')) {
          text = text.replace(/\{\{(?:gender|sex|jinsia|jinsi|gender_val|sex_val|jinsi_val)\}\}/gi, targetGender);
        } else if (/^(?:jinsi|jinsia|sex|gender)\s*[:：\-]?\s*/i.test(text)) {
          text = text.replace(/^(?:jinsi|jinsia|sex|gender)\s*[:：\-]?\s*.*/i, `JINSI : ${targetGender}`);
        } else {
          text = targetGender;
        }
        break;
      }
      case 'NIDA_NUMBER': {
        const val = formData.nidaNumber || '';
        if (text.includes('{{')) {
          text = text.replace(/\{\{(?:nida_number|nida|id_number|national_id|nin|id_no|namba_nida)\}\}/gi, val);
        } else if (/^(?:national\s*id\s*no|nambari\s*ya\s*nida|nida\s*no)\s*[:：\-]?\s*/i.test(text)) {
          text = text.replace(/^(?:national\s*id\s*no|nambari\s*ya\s*nida|nida\s*no)\s*[:：\-]?\s*.*/i, `NATIONAL ID NO: ${val}`);
        } else {
          text = val;
        }
        break;
      }
    }

    return { ...textLayer, text };
  }

  if (layer.type === 'barcode' && binding === 'NIDA_NUMBER') {
    const b = layer as BarcodeLayer;
    const val = (formData.nidaNumber || '').replace(/-/g, '');
    return { ...b, data: val };
  }

  if (layer.type === 'qrcode' && binding === 'NIDA_NUMBER') {
    const q = layer as QRCodeLayer;
    const val = formData.nidaNumber || '';
    return { ...q, data: val };
  }

  return layer;
}

/**
 * Validates the populated template to prevent cross-contamination errors before generating the card.
 */
export function validatePopulatedTemplate(
  layers: Layer[],
  formData: NidaFormData,
  isBackSide: boolean = false
): { valid: boolean; error?: string; warnings: string[] } {
  const warnings: string[] = [];

  if (isBackSide) {
    return { valid: true, warnings };
  }

  const firstName = (formData.firstName || '').trim().toUpperCase();
  const lastName = (formData.lastName || '').trim().toUpperCase();
  const dob = (formData.dob || '').trim();
  const gender = (formData.gender || '').trim().toUpperCase().startsWith('M') ? 'M' : 'F';

  let injectedLastName: string | null = null;
  let injectedDob: string | null = null;
  let injectedGender: string | null = null;

  for (const layer of layers) {
    const binding = getLayerBinding(layer, layers);
    if (layer.type === 'text') {
      const text = (layer as TextLayer).text.toUpperCase();

      if (binding === 'LAST_NAME') {
        injectedLastName = text;
      } else if (binding === 'DOB') {
        injectedDob = text;
      } else if (binding === 'GENDER') {
        injectedGender = text;
      }
    }
  }

  // Cross-field collision checks
  if (firstName && lastName && firstName !== lastName && injectedLastName) {
    // If injectedLastName matches firstName instead of lastName
    if (injectedLastName.endsWith(firstName) || (injectedLastName.includes(firstName) && !injectedLastName.includes(lastName))) {
      return {
        valid: false,
        error: `Field Mapping Validation Error: First Name ('${firstName}') was incorrectly injected into Last Name field ('${injectedLastName}'). Expected '${lastName}'.`,
        warnings: [`Last Name layer received '${injectedLastName}' instead of '${lastName}'`],
      };
    }
  }

  if (firstName && dob && firstName !== dob && injectedDob) {
    if (injectedDob.endsWith(firstName) || injectedDob.includes(firstName)) {
      return {
        valid: false,
        error: `Field Mapping Validation Error: First Name ('${firstName}') was incorrectly injected into Date of Birth field ('${injectedDob}'). Expected '${dob}'.`,
        warnings: [`DOB layer received '${injectedDob}' instead of '${dob}'`],
      };
    }
  }

  if (firstName && gender && firstName !== gender && injectedGender) {
    if (injectedGender.endsWith(firstName) || injectedGender.includes(firstName)) {
      return {
        valid: false,
        error: `Field Mapping Validation Error: First Name ('${firstName}') was incorrectly injected into Gender field ('${injectedGender}'). Expected '${gender}'.`,
        warnings: [`Gender layer received '${injectedGender}' instead of '${gender}'`],
      };
    }
  }

  return { valid: true, warnings };
}

/**
 * Plans mapping between template and form data without mutating the template.
 */
export function planTemplateMapping(template: CardTemplate, formData: Partial<NidaFormData>): MappingPlan {
  const sanitizedTemplate = ensureTemplateFieldIds(template);
  const isBackSide = isBackSideTemplate(sanitizedTemplate);
  const matchedBindingsSet = new Set<SupportedBinding>();
  const fieldMappings: FieldMappingDetail[] = [];
  const warnings: string[] = [];

  const bindingsToCheck: SupportedBinding[] = isBackSide ? ['NIDA_NUMBER'] : ALL_SUPPORTED_BINDINGS;

  for (const layer of sanitizedTemplate.layers) {
    const binding = getLayerBinding(layer, sanitizedTemplate.layers);
    if (binding && bindingsToCheck.includes(binding)) {
      matchedBindingsSet.add(binding);
      const formVal = getFormValueForBinding(binding, formData);

      let original = '';
      if (layer.type === 'text') original = (layer as TextLayer).text;
      else if (layer.type === 'placeholder') original = `[Placeholder: ${(layer as PlaceholderLayer).label}]`;
      else if (layer.type === 'barcode') original = (layer as BarcodeLayer).data;
      else if (layer.type === 'qrcode') original = (layer as QRCodeLayer).data;
      else if (layer.type === 'image') original = '[Image Layer]';

      fieldMappings.push({
        binding,
        layerId: layer.id,
        layerName: layer.name,
        layerType: layer.type,
        originalValue: original,
        newValue: formVal,
      });
    }
  }

  const missingBindings: MissingBindingDetail[] = [];
  for (const binding of bindingsToCheck) {
    if (!matchedBindingsSet.has(binding)) {
      const label = binding.replace(/_/g, ' ');
      missingBindings.push({
        binding,
        label,
        warning: `Placeholder for "${label}" was not found in template "${sanitizedTemplate.templateName}". Skipping this field.`,
      });
    }
  }

  return {
    templateId: sanitizedTemplate.id,
    templateName: sanitizedTemplate.templateName,
    matchedBindings: Array.from(matchedBindingsSet),
    missingBindings,
    fieldMappings,
    warnings,
  };
}

/**
 * Applies the Template Field Mapping Engine to populate NIDA card templates.
 */
export function applyTemplateMapping(template: CardTemplate, formData: NidaFormData): PopulatedTemplateResult {
  const sanitizedTemplate = ensureTemplateFieldIds(template);
  const isBackSide = isBackSideTemplate(sanitizedTemplate);
  const plan = planTemplateMapping(sanitizedTemplate, formData);

  const clonedLayers: Layer[] = [];
  let populatedCount = 0;
  let skippedCount = 0;

  for (const layer of sanitizedTemplate.layers) {
    const binding = getLayerBinding(layer, sanitizedTemplate.layers);

    if (isBackSide) {
      if (binding === 'NIDA_NUMBER') {
        const injected = injectValueIntoLayer(layer, 'NIDA_NUMBER', formData);
        clonedLayers.push(injected);
        populatedCount++;
      } else {
        clonedLayers.push({ ...layer });
      }
      continue;
    }

    if (binding) {
      const injected = injectValueIntoLayer(layer, binding, formData);
      clonedLayers.push(injected);
      populatedCount++;
    } else {
      // Static layer, leave untouched
      clonedLayers.push({ ...layer });
      skippedCount++;
    }
  }

  // Run validation pass before returning
  const validation = validatePopulatedTemplate(clonedLayers, formData, isBackSide);

  const populatedTemplate: CardTemplate = {
    ...sanitizedTemplate,
    layers: clonedLayers,
    updatedAt: new Date().toISOString(),
  };

  return {
    success: validation.valid,
    populatedTemplate,
    plan,
    populatedCount,
    skippedCount,
    warnings: [...plan.warnings, ...validation.warnings],
    error: validation.error,
    isBackSide,
  };
}

/**
 * Legacy text token replacement helper
 */
export function replaceTextTokens(text: string, formData: NidaFormData): string {
  let result = text;
  if (formData.firstName) {
    result = result.replace(/\{\{(?:first_name|firstname|given_name|given_names|fname)\}\}/gi, formData.firstName.trim().toUpperCase());
  }
  if (formData.middleName) {
    result = result.replace(/\{\{(?:middle_name|middlename|other_names|othernames|mname)\}\}/gi, formData.middleName.trim().toUpperCase());
  } else {
    result = result.replace(/\{\{(?:middle_name|middlename|other_names|othernames|mname)\}\}\s*/gi, '');
  }
  if (formData.lastName) {
    result = result.replace(/\{\{(?:last_name|lastname|surname|family_name|lname)\}\}/gi, formData.lastName.trim().toUpperCase());
  }
  if (formData.dob) {
    result = result.replace(/\{\{(?:dob|date_of_birth|birth_date|birthdate)\}\}/gi, formData.dob);
  }
  if (formData.gender) {
    const g = formData.gender.trim().toUpperCase().startsWith('M') ? 'M' : 'F';
    result = result.replace(/\{\{(?:gender|sex|jinsia|jinsi|gender_val|sex_val|jinsi_val)\}\}/gi, g);
  }
  if (formData.nidaNumber) {
    result = result.replace(/\{\{(?:nida_number|nida|id_number|national_id|nin|id_no|namba_nida)\}\}/gi, formData.nidaNumber);
  }
  return result;
}

export function replaceGenderInText(text: string, targetGender: 'M' | 'F'): string {
  if (text.includes('{{')) {
    return text.replace(/\{\{(?:gender|sex|jinsia|jinsi|gender_val|sex_val|jinsi_val)\}\}/gi, targetGender);
  }
  return targetGender;
}

export function isGenderLabelLayer(layer: Layer): boolean {
  if (layer.type !== 'text') return false;
  const text = ((layer as TextLayer).text || '').trim();
  if (text.includes('{{') || /:\s*[A-Za-z0-9]/.test(text)) return false;
  return /^(?:sex|jinsi|jinsia|gender|sex\s*[\/\\]\s*jinsi[a]?|jinsi[a]?\s*[\/\\]\s*sex|gender\s*[\/\\]\s*sex|sex\s*[\/\\]\s*gender)\s*[:：\-]?$/i.test(text) ||
    /lbl[_\s-]?gender|lbl[_\s-]?sex|lbl[_\s-]?jinsi/i.test(layer.id) ||
    /lbl[_\s-]?gender|lbl[_\s-]?sex|lbl[_\s-]?jinsi/i.test(layer.name);
}

export function isGenderValueLayer(layer: Layer, allLayers: Layer[] = []): boolean {
  return getLayerBinding(layer, allLayers) === 'GENDER';
}

/**
 * Strips any personal/cardholder data from template layers and replaces them with standard temporary placeholder tokens.
 * Separation of Template Structure and Cardholder data is strictly enforced.
 */
export function sanitizeTemplateForSaving(template: CardTemplate): CardTemplate {
  if (!template || !Array.isArray(template.layers)) return template;

  const sanitizedLayers = template.layers.map((layer) => {
    const binding = getLayerBinding(layer, template.layers);
    if (!binding) return { ...layer };

    if (layer.type === 'text') {
      const textLayer = layer as TextLayer;
      let placeholderText = textLayer.text || '';

      switch (binding) {
        case 'FIRST_NAME':
          placeholderText = '{{first_name}}';
          break;
        case 'MIDDLE_NAME':
          placeholderText = '{{middle_name}}';
          break;
        case 'LAST_NAME':
          placeholderText = '{{last_name}}';
          break;
        case 'DOB':
          placeholderText = '{{dob}}';
          break;
        case 'GENDER':
          placeholderText = '{{gender}}';
          break;
        case 'NIDA_NUMBER':
          placeholderText = '{{nida_number}}';
          break;
      }

      return {
        ...textLayer,
        text: placeholderText,
      };
    }

    if (binding === 'PHOTO') {
      if (layer.type === 'image' || layer.type === 'placeholder') {
        const imgLayer = layer as any;
        return {
          ...imgLayer,
          type: 'placeholder',
          placeholderKey: 'photo',
          placeholderType: 'photo',
          label: 'Cardholder Photograph',
          src: undefined,
        } as any;
      }
    }

    if (binding === 'SIGNATURE') {
      if (layer.type === 'image' || layer.type === 'placeholder') {
        const imgLayer = layer as any;
        return {
          ...imgLayer,
          type: 'placeholder',
          placeholderKey: 'signature',
          placeholderType: 'signature',
          label: 'Cardholder Signature',
          src: undefined,
        } as any;
      }
    }

    if (layer.type === 'barcode' && binding === 'NIDA_NUMBER') {
      const b = layer as BarcodeLayer;
      return { ...b, data: '12345678901234567890' };
    }

    if (layer.type === 'qrcode' && binding === 'NIDA_NUMBER') {
      const q = layer as QRCodeLayer;
      return { ...q, data: '12345678901234567890' };
    }

    return { ...layer };
  });

  return {
    ...template,
    layers: sanitizedLayers,
    updatedAt: new Date().toISOString(),
  };
}

export interface ValidationIssue {
  layerId: string;
  layerName: string;
  layerType: string;
  variable: string; // The token found, e.g. "{{nationality}}"
  type: 'error' | 'warning';
  message: string;
  suggestedFix?: string;
  suggestedReplacement?: string; // What valid token we recommend using
}

const RECOGNIZED_TOKENS = new Set([
  'first_name', 'firstname', 'given_name', 'given_names', 'fname',
  'middle_name', 'middlename', 'other_names', 'othernames', 'mname',
  'last_name', 'lastname', 'surname', 'family_name', 'lname',
  'dob', 'date_of_birth', 'birth_date', 'birthdate',
  'gender', 'sex', 'jinsia', 'jinsi', 'gender_val', 'sex_val', 'jinsi_val',
  'nida_number', 'nida', 'id_number', 'national_id', 'nin', 'id_no', 'namba_nida'
]);

function getEditDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export function getClosestSupportedToken(token: string): string | undefined {
  const lowerToken = token.toLowerCase().trim();
  
  // Smart mappings
  if (lowerToken.includes('first')) return '{{first_name}}';
  if (lowerToken.includes('last')) return '{{last_name}}';
  if (lowerToken.includes('mid')) return '{{middle_name}}';
  if (lowerToken.includes('birth') || lowerToken.includes('date') || lowerToken === 'dob') return '{{dob}}';
  if (lowerToken.includes('gen') || lowerToken.includes('sex') || lowerToken.includes('jin')) return '{{gender}}';
  if (lowerToken.includes('nida') || lowerToken.includes('nin') || lowerToken.includes('num') || lowerToken.includes('id_')) return '{{nida_number}}';
  
  const cleanDefaults = [
    'first_name',
    'middle_name',
    'last_name',
    'dob',
    'gender',
    'nida_number',
  ];
  
  let bestDist = 999;
  let bestMatch: string | undefined = undefined;
  
  for (const candidate of cleanDefaults) {
    const dist = getEditDistance(lowerToken, candidate);
    if (dist < bestDist && dist <= 4) {
      bestDist = dist;
      bestMatch = `{{${candidate}}}`;
    }
  }
  
  return bestMatch;
}

/**
 * Scans the template layers and identifies validation issues like unmapped variables,
 * unbound containers, and static barcodes to ensure render-time integrity.
 */
export function getTemplateValidationIssues(template: CardTemplate): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!template || !Array.isArray(template.layers)) return issues;

  template.layers.forEach((layer) => {
    // 1. Text Layers Variable Extraction & Check
    if (layer.type === 'text') {
      const textLayer = layer as TextLayer;
      const text = textLayer.text || '';
      
      const variableRegex = /\{\{([^}]+)\}\}/g;
      let match;
      
      while ((match = variableRegex.exec(text)) !== null) {
        const fullToken = match[0];
        const rawVar = match[1].trim();
        
        if (!RECOGNIZED_TOKENS.has(rawVar.toLowerCase())) {
          const suggestion = getClosestSupportedToken(rawVar);
          issues.push({
            layerId: layer.id,
            layerName: layer.name,
            layerType: 'text',
            variable: fullToken,
            type: 'error',
            message: `Variable '${fullToken}' is unbound and won't be resolved at render time.`,
            suggestedFix: suggestion 
              ? `Correct spelling or use standard NIDA variable: '${suggestion}'`
              : 'Replace this with a supported NIDA dynamic field (First Name, Last Name, DOB, etc.).',
            suggestedReplacement: suggestion,
          });
        }
      }
    }

    // 2. Barcode & QR Code Dynamic Linkage Checks
    if (layer.type === 'barcode' || layer.type === 'qrcode') {
      const binding = getLayerBinding(layer, template.layers);
      if (!binding) {
        const payload = layer.type === 'barcode' ? (layer as BarcodeLayer).data : (layer as QRCodeLayer).data;
        const hasBraces = payload?.includes('{{');
        
        if (hasBraces) {
          // Has variable braces but they don't resolve to a binding
          const variableRegex = /\{\{([^}]+)\}\}/g;
          const match = variableRegex.exec(payload || '');
          const fullToken = match ? match[0] : '{{variable}}';
          issues.push({
            layerId: layer.id,
            layerName: layer.name,
            layerType: layer.type,
            variable: fullToken,
            type: 'error',
            message: `Variable '${fullToken}' inside ${layer.type === 'barcode' ? 'Barcode' : 'QR Code'} payload is unbound.`,
            suggestedFix: `Use standard dynamic variable '{{nida_number}}' to bind it to the cardholder ID.`,
            suggestedReplacement: '{{nida_number}}',
          });
        } else {
          // Completely static
          issues.push({
            layerId: layer.id,
            layerName: layer.name,
            layerType: layer.type,
            variable: 'STATIC_PAYLOAD',
            type: 'warning',
            message: `${layer.type === 'barcode' ? 'Barcode' : 'QR Code'} has a static payload and won't change per-cardholder.`,
            suggestedFix: `Insert '{{nida_number}}' to dynamically link it to the identity's NIDA Number.`,
            suggestedReplacement: '{{nida_number}}',
          });
        }
      }
    }

    // 3. Image/Placeholder Containers meant for Photo / Signature but unbound
    if (layer.type === 'placeholder' || layer.type === 'image') {
      const idLower = layer.id.toLowerCase();
      const nameLower = layer.name.toLowerCase();
      const isPhotoLike = idLower.includes('photo') || idLower.includes('portrait') || idLower.includes('avatar') || nameLower.includes('photo') || nameLower.includes('portrait');
      const isSigLike = idLower.includes('sig') || idLower.includes('signature') || nameLower.includes('sig') || nameLower.includes('signature');
      
      const binding = getLayerBinding(layer, template.layers);
      if ((isPhotoLike || isSigLike) && !binding) {
        issues.push({
          layerId: layer.id,
          layerName: layer.name,
          layerType: layer.type,
          variable: isPhotoLike ? 'PHOTO' : 'SIGNATURE',
          type: 'warning',
          message: `Container meant for ${isPhotoLike ? 'Photo' : 'Signature'} is missing a valid data binding.`,
          suggestedFix: `Rename this layer name or ID to include '${isPhotoLike ? 'photo' : 'signature'}' to auto-bind it.`,
        });
      }
    }
  });

  return issues;
}
