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
 * Token matcher patterns for each supported binding
 */
const BINDING_TOKENS: Record<SupportedBinding, RegExp[]> = {
  FIRST_NAME: [
    /\{\{first_name\}\}/gi,
    /\{\{firstname\}\}/gi,
    /\{\{given_name\}\}/gi,
    /\{\{given_names\}\}/gi,
    /\{\{fname\}\}/gi,
  ],
  MIDDLE_NAME: [
    /\{\{middle_name\}\}/gi,
    /\{\{middlename\}\}/gi,
    /\{\{other_names\}\}/gi,
    /\{\{othernames\}\}/gi,
    /\{\{mname\}\}/gi,
  ],
  LAST_NAME: [
    /\{\{last_name\}\}/gi,
    /\{\{lastname\}\}/gi,
    /\{\{surname\}\}/gi,
    /\{\{family_name\}\}/gi,
    /\{\{lname\}\}/gi,
  ],
  DOB: [
    /\{\{dob\}\}/gi,
    /\{\{date_of_birth\}\}/gi,
    /\{\{birth_date\}\}/gi,
    /\{\{birthdate\}\}/gi,
  ],
  GENDER: [
    /\{\{gender\}\}/gi,
    /\{\{sex\}\}/gi,
    /\{\{jinsia\}\}/gi,
    /\{\{jinsi\}\}/gi,
    /\{\{me_ke\}\}/gi,
    /\{\{m_f\}\}/gi,
    /\{\{gender_val\}\}/gi,
    /\{\{sex_val\}\}/gi,
    /\{\{jinsi_val\}\}/gi,
    /\{\{gender_value\}\}/gi,
  ],
  NIDA_NUMBER: [
    /\{\{nida_number\}\}/gi,
    /\{\{nida\}\}/gi,
    /\{\{id_number\}\}/gi,
    /\{\{national_id\}\}/gi,
    /\{\{nin\}\}/gi,
    /\{\{id_no\}\}/gi,
    /\{\{namba_nida\}\}/gi,
  ],
  PHOTO: [],
  SIGNATURE: [],
};

/**
 * Layer name/id heuristics when literal {{tokens}} aren't present
 */
const BINDING_LAYER_HEURISTICS: Record<SupportedBinding, RegExp> = {
  FIRST_NAME: /(?:^|[_\s\/:.-])(?:first[_\s-]?name|given[_\s-]?name|fname|jina_kwanza)(?:$|[_\s\/:.-])/i,
  MIDDLE_NAME: /(?:^|[_\s\/:.-])(?:middle[_\s-]?name|other[_\s-]?name|mname|jina_kati)(?:$|[_\s\/:.-])/i,
  LAST_NAME: /(?:^|[_\s\/:.-])(?:last[_\s-]?name|surname|family[_\s-]?name|lname|jina_mwisho|jina_la_mwisho)(?:$|[_\s\/:.-])/i,
  DOB: /(?:^|[_\s\/:.-])(?:dob|date[_\s-]?of[_\s-]?birth|birth[_\s-]?date|tarehe_kuzaliwa)(?:$|[_\s\/:.-])/i,
  GENDER: /(?:^|[_\s\/:.-])(?:gender|sex|jinsi|jinsia|me_ke|m_f)(?:$|[_\s\/:.-])/i,
  NIDA_NUMBER: /(?:^|[_\s\/:.-])(?:nida|id[_\s-]?number|national[_\s-]?id|nin|id[_\s-]?no|namba_nida)(?:$|[_\s\/:.-])/i,
  PHOTO: /(?:^|[_\s\/:.-])(?:photo|portrait|avatar|picture|picha|image_holder)(?:$|[_\s\/:.-])/i,
  SIGNATURE: /(?:^|[_\s\/:.-])(?:signature|sign|specimen|sahihi)(?:$|[_\s\/:.-])/i,
};

/**
 * Helper: Check if a layer is purely a static label for Gender/Sex (which must NOT be overwritten)
 */
export function isGenderLabelLayer(layer: Layer): boolean {
  if (layer.type !== 'text') return false;
  const textLayer = layer as TextLayer;
  const text = (textLayer.text || '').trim();

  // If text has tokens or composite with value like "SEX: M", it's not a pure static label
  if (text.includes('{{') || /:\s*[A-Za-z0-9]/.test(text)) {
    return false;
  }

  // Pure label regex
  const isLabelText = /^(?:sex|jinsi|jinsia|gender|sex\s*[\/\\]\s*jinsi[a]?|jinsi[a]?\s*[\/\\]\s*sex|gender\s*[\/\\]\s*sex|sex\s*[\/\\]\s*gender|me\s*[\/\\]\s*ke|m\s*[\/\\]\s*f)\s*[:：\-]?$/i.test(text);
  const isLabelIdOrName = /lbl[_\s-]?gender|lbl[_\s-]?sex|lbl[_\s-]?jinsi|gender[_\s-]?label|sex[_\s-]?label|jinsi[_\s-]?label/i.test(layer.id) ||
                          /lbl[_\s-]?gender|lbl[_\s-]?sex|lbl[_\s-]?jinsi|gender[_\s-]?label|sex[_\s-]?label|jinsi[_\s-]?label/i.test(layer.name);

  // If the text itself is "M" or "F" or "ME" or "KE" or "MALE" or "FEMALE", it's a value, NOT a label!
  if (/^(?:[MF]|ME|KE|MALE|FEMALE)$/i.test(text)) {
    return false;
  }

  return isLabelText || (isLabelIdOrName && text.length > 2);
}

/**
 * Helper: Check if a layer is a Gender Value layer by token, composite text, name/id, or spatial proximity to a gender label
 */
export function isGenderValueLayer(layer: Layer, allLayers: Layer[] = []): boolean {
  if (layer.type !== 'text') return false;
  if (isGenderLabelLayer(layer)) return false;

  // Disqualify layer if it is explicitly named/id'd for another field (unless it also has gender in id/name)
  const isExplicitOtherField =
    (BINDING_LAYER_HEURISTICS.LAST_NAME.test(layer.id) || BINDING_LAYER_HEURISTICS.LAST_NAME.test(layer.name)) ||
    (BINDING_LAYER_HEURISTICS.FIRST_NAME.test(layer.id) || BINDING_LAYER_HEURISTICS.FIRST_NAME.test(layer.name)) ||
    (BINDING_LAYER_HEURISTICS.MIDDLE_NAME.test(layer.id) || BINDING_LAYER_HEURISTICS.MIDDLE_NAME.test(layer.name)) ||
    (BINDING_LAYER_HEURISTICS.DOB.test(layer.id) || BINDING_LAYER_HEURISTICS.DOB.test(layer.name)) ||
    (BINDING_LAYER_HEURISTICS.NIDA_NUMBER.test(layer.id) || BINDING_LAYER_HEURISTICS.NIDA_NUMBER.test(layer.name));

  const isExplicitGenderField =
    BINDING_LAYER_HEURISTICS.GENDER.test(layer.id) ||
    BINDING_LAYER_HEURISTICS.GENDER.test(layer.name) ||
    /(?:var[_\s-]?gender|gender[_\s-]?var|var[_\s-]?sex|sex[_\s-]?var|var[_\s-]?jinsi|jinsi[_\s-]?var|gender[_\s-]?val(?:ue)?|sex[_\s-]?val(?:ue)?|jinsi[_\s-]?val(?:ue)?|val[_\s-]?gender|val[_\s-]?sex|val[_\s-]?jinsi)/i.test(layer.id) ||
    /(?:var[_\s-]?gender|gender[_\s-]?var|var[_\s-]?sex|sex[_\s-]?var|var[_\s-]?jinsi|jinsi[_\s-]?var|gender[_\s-]?val(?:ue)?|sex[_\s-]?val(?:ue)?|jinsi[_\s-]?val(?:ue)?|val[_\s-]?gender|val[_\s-]?sex|val[_\s-]?jinsi)/i.test(layer.name);

  if (isExplicitOtherField && !isExplicitGenderField) {
    return false;
  }

  const textLayer = layer as TextLayer;
  const text = (textLayer.text || '').trim();

  // 1. Literal token
  for (const regex of BINDING_TOKENS.GENDER) {
    if (regex.test(text)) return true;
  }

  // 2. Composite label + value (e.g. "SEX: M", "JINSI: M", "SEX / JINSIA: M", "GENDER: MALE")
  if (/^(?:sex|jinsi|jinsia|gender)(?:\s*[\/\\]\s*(?:sex|jinsi|jinsia|gender))?\s*[:：\-]\s*(?:[MF]|ME|KE|MALE|FEMALE|Male|Female)/i.test(text)) {
    return true;
  }

  // 3. Explicit Variable ID or Name
  if (isExplicitGenderField) return true;

  // 4. Standalone Gender Value (e.g. "M", "F", "ME", "KE", "MALE", "FEMALE", "[M]", "[F]")
  const isStandaloneGenderText = /^(?:[MF]|ME|KE|MALE|FEMALE|Male|Female|Me|Ke|\[M\]|\[F\]|\(M\)|\(F\)|M\s*[\/\\]\s*F|ME\s*[\/\\]\s*KE)$/i.test(text);
  if (isStandaloneGenderText) {
    // Spatial proximity check against all other layers in the template
    const genderLabels = allLayers.filter((l) => l.id !== layer.id && isGenderLabelLayer(l));
    for (const lbl of genderLabels) {
      // Below label: within 25mm horizontal, 0..16mm vertical
      const isBelow = Math.abs(layer.x - lbl.x) <= 25 && layer.y >= lbl.y - 1 && layer.y - lbl.y <= 16;
      // To the right of label: within 8mm vertical, 0..45mm horizontal
      const isRight = Math.abs(layer.y - lbl.y) <= 8 && layer.x >= lbl.x && layer.x - lbl.x <= 45;
      if (isBelow || isRight) {
        return true;
      }
    }

    // If there's only one short text layer with "M" or "F" on the card
    const shortLayers = allLayers.filter((l) => l.type === 'text' && /^(?:[MF]|ME|KE)$/i.test(((l as TextLayer).text || '').trim()));
    if (shortLayers.length === 1 && shortLayers[0].id === layer.id) {
      return true;
    }
  }

  // 5. Proximity to Gender Label for generic placeholder layer
  const genderLabels = allLayers.filter((l) => l.id !== layer.id && isGenderLabelLayer(l));
  for (const lbl of genderLabels) {
    const isBelow = Math.abs(layer.x - lbl.x) <= 20 && layer.y >= lbl.y && layer.y - lbl.y <= 12;
    const isRight = Math.abs(layer.y - lbl.y) <= 6 && layer.x >= lbl.x && layer.x - lbl.x <= 35;
    if ((isBelow || isRight) && text.length <= 10 && !text.toLowerCase().includes('authority') && !text.toLowerCase().includes('republic') && !text.toLowerCase().includes('card')) {
      return true;
    }
  }

  return false;
}

/**
 * Robust replacement of gender in any string format:
 * - {{gender}} tokens
 * - Composite strings: "SEX: M" -> "SEX: F", "JINSI / SEX: M" -> "JINSI / SEX: F"
 * - Standalone values: "M" -> "F", "ME" -> "F"
 */
export function replaceGenderInText(originalText: string, targetGender: 'M' | 'F'): string {
  let result = originalText;

  // 1. Standard curly tokens
  result = result.replace(
    /\{\{gender\}\}|\{\{sex\}\}|\{\{jinsia\}\}|\{\{jinsi\}\}|\{\{me_ke\}\}|\{\{m_f\}\}|\{\{gender_val\}\}|\{\{sex_val\}\}|\{\{jinsi_val\}\}|\{\{gender_value\}\}/gi,
    targetGender
  );

  // 2. Composite label + value (e.g. "SEX: M", "JINSI: M", "SEX / JINSIA: M", "GENDER: MALE")
  const compositeRegex = /^(.*?(?:sex|jinsi|jinsia|gender)(?:\s*[\/\\]\s*(?:sex|jinsi|jinsia|gender))?\s*[:：\-]\s*)(?:[MF]|ME|KE|MALE|FEMALE|Male|Female)(.*)$/i;
  if (compositeRegex.test(result)) {
    result = result.replace(compositeRegex, `$1${targetGender}$2`);
    return result;
  }

  // 3. Standalone gender strings
  const trimmed = result.trim();
  if (/^(?:[MF]|ME|KE|MALE|FEMALE|Male|Female|Me|Ke|\[M\]|\[F\]|\(M\)|\(F\)|M\s*[\/\\]\s*F|ME\s*[\/\\]\s*KE)$/i.test(trimmed)) {
    result = targetGender;
  }

  return result;
}

/**
 * Extracts string value for a binding from NidaFormData
 */
export function getFormValueForBinding(binding: SupportedBinding, formData: Partial<NidaFormData>): string {
  switch (binding) {
    case 'FIRST_NAME':
      return formData.firstName?.trim().toUpperCase() || '';
    case 'MIDDLE_NAME':
      return formData.middleName?.trim().toUpperCase() || '';
    case 'LAST_NAME':
      return formData.lastName?.trim().toUpperCase() || '';
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
 * Detects whether a layer matches a given binding with spatial & heuristic awareness
 */
export function matchLayerToBinding(layer: Layer, binding: SupportedBinding, allLayers: Layer[] = []): boolean {
  // 1. Photo and Signature match placeholder types or keys first
  if (binding === 'PHOTO') {
    if (layer.type === 'placeholder') {
      const p = layer as PlaceholderLayer;
      if (p.placeholderKey === 'photo' || p.placeholderType === 'photo') return true;
    }
    if (layer.type === 'image' || layer.type === 'placeholder') {
      return BINDING_LAYER_HEURISTICS.PHOTO.test(layer.name) || BINDING_LAYER_HEURISTICS.PHOTO.test(layer.id);
    }
    return false;
  }

  if (binding === 'SIGNATURE') {
    if (layer.type === 'placeholder') {
      const p = layer as PlaceholderLayer;
      if (p.placeholderKey === 'signature' || p.placeholderType === 'signature') return true;
    }
    if (layer.type === 'image' || layer.type === 'placeholder') {
      return BINDING_LAYER_HEURISTICS.SIGNATURE.test(layer.name) || BINDING_LAYER_HEURISTICS.SIGNATURE.test(layer.id);
    }
    return false;
  }

  // 2. GENDER with specialized label protection and spatial value matching
  if (binding === 'GENDER') {
    if (layer.type !== 'text') return false;
    return isGenderValueLayer(layer, allLayers);
  }

  // 3. Other Text layers matching tokens or heuristics
  if (layer.type === 'text') {
    const textLayer = layer as TextLayer;
    const text = textLayer.text || '';

    // Check literal tokens e.g. {{first_name}}
    const tokens = BINDING_TOKENS[binding];
    for (const regex of tokens) {
      if (regex.test(text)) {
        return true;
      }
    }

    // Heuristic: If text contains curly brackets or layer id/name specifically marks this variable
    if (
      (text.includes('{{') || layer.name.toLowerCase().includes('var') || layer.id.toLowerCase().includes('var_')) &&
      (BINDING_LAYER_HEURISTICS[binding].test(layer.name) || BINDING_LAYER_HEURISTICS[binding].test(layer.id))
    ) {
      return true;
    }
  }

  // 4. Barcode / QR Code layers matching ID or NIDA bindings
  if (binding === 'NIDA_NUMBER') {
    if (layer.type === 'barcode') {
      const b = layer as BarcodeLayer;
      return /\{\{id_number\}\}|\{\{nida_number\}\}|\{\{nida\}\}/i.test(b.data) || BINDING_LAYER_HEURISTICS.NIDA_NUMBER.test(layer.name);
    }
    if (layer.type === 'qrcode') {
      const q = layer as QRCodeLayer;
      return /\{\{id_number\}\}|\{\{nida_number\}\}|\{\{nida\}\}/i.test(q.data);
    }
  }

  return false;
}

/**
 * Plans the mapping between a template and the form data without mutating the template.
 * Detects placeholders, matches correct fields, and prepares automatic population.
 */
export function planTemplateMapping(template: CardTemplate, formData: Partial<NidaFormData>): MappingPlan {
  const isBackSide = isBackSideTemplate(template);
  const matchedBindingsSet = new Set<SupportedBinding>();
  const fieldMappings: FieldMappingDetail[] = [];
  const warnings: string[] = [];

  // When template is a back side template, only NIDA_NUMBER is populated!
  const bindingsToCheck: SupportedBinding[] = isBackSide ? ['NIDA_NUMBER'] : ALL_SUPPORTED_BINDINGS;

  // Inspect each layer
  for (const layer of template.layers) {
    for (const binding of bindingsToCheck) {
      if (matchLayerToBinding(layer, binding, template.layers)) {
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
  }

  // Check for any compound text layers (e.g. {{first_name}} {{last_name}})
  for (const layer of template.layers) {
    if (layer.type === 'text') {
      const t = (layer as TextLayer).text;
      for (const binding of bindingsToCheck) {
        if (!matchedBindingsSet.has(binding)) {
          const tokens = BINDING_TOKENS[binding];
          for (const regex of tokens) {
            if (regex.test(t)) {
              matchedBindingsSet.add(binding);
              fieldMappings.push({
                binding,
                layerId: layer.id,
                layerName: layer.name,
                layerType: 'text',
                originalValue: t,
                newValue: getFormValueForBinding(binding, formData),
              });
            }
          }
        }
      }
    }
  }

  // Identify missing bindings and generate warnings
  const missingBindings: MissingBindingDetail[] = [];
  for (const binding of bindingsToCheck) {
    if (!matchedBindingsSet.has(binding)) {
      const label = binding.replace(/_/g, ' ');
      const warning = `Placeholder for "${label}" was not found in template "${template.templateName}". Skipping this field.`;
      missingBindings.push({
        binding,
        label,
        warning,
      });
      warnings.push(warning);
    }
  }

  return {
    templateId: template.id,
    templateName: template.templateName,
    matchedBindings: Array.from(matchedBindingsSet),
    missingBindings,
    fieldMappings,
    warnings,
  };
}

/**
 * Replaces tokens in a text string with form values
 */
export function replaceTextTokens(text: string, formData: NidaFormData): string {
  let result = text;

  // First Name
  if (formData.firstName) {
    result = result.replace(/\{\{first_name\}\}|\{\{firstname\}\}|\{\{given_name\}\}|\{\{given_names\}\}|\{\{fname\}\}/gi, formData.firstName.trim().toUpperCase());
  }

  // Middle Name
  if (formData.middleName) {
    result = result.replace(/\{\{middle_name\}\}|\{\{middlename\}\}|\{\{other_names\}\}|\{\{othernames\}\}|\{\{mname\}\}/gi, formData.middleName.trim().toUpperCase());
  } else {
    // If middle name is empty, remove token cleanly
    result = result.replace(/\{\{middle_name\}\}|\{\{middlename\}\}|\{\{other_names\}\}|\{\{othernames\}\}|\{\{mname\}\}\s*/gi, '');
  }

  // Last Name
  if (formData.lastName) {
    result = result.replace(/\{\{last_name\}\}|\{\{lastname\}\}|\{\{surname\}\}|\{\{family_name\}\}|\{\{lname\}\}/gi, formData.lastName.trim().toUpperCase());
  }

  // Date of Birth
  if (formData.dob) {
    result = result.replace(/\{\{dob\}\}|\{\{date_of_birth\}\}|\{\{birth_date\}\}|\{\{birthdate\}\}/gi, formData.dob);
  }

  // Gender (Strict: Male -> M, Female -> F, including composite prefixes and tokens)
  if (formData.gender) {
    const targetGender: 'M' | 'F' = formData.gender.trim().toUpperCase().startsWith('M') ? 'M' : 'F';
    result = replaceGenderInText(result, targetGender);
  }

  // NIDA Number
  if (formData.nidaNumber) {
    result = result.replace(/\{\{nida_number\}\}|\{\{nida\}\}|\{\{id_number\}\}|\{\{national_id\}\}|\{\{nin\}\}|\{\{id_no\}\}|\{\{namba_nida\}\}/gi, formData.nidaNumber);
  }

  return result;
}

/**
 * Applies the Template Field Mapping Engine to populates NIDA Front Side templates.
 *
 * Strict Rules Preserved:
 * - Use existing template coordinates (x, y).
 * - Use existing template sizes (width, height).
 * - Use existing template fonts (fontFamily, fontSize, fontStyle, fontWeight).
 * - Use existing template alignment (align).
 * - Use existing template spacing (letterSpacing, lineHeight).
 * - Do not modify template layout.
 * - Do not move layers.
 * - Do not resize layers.
 * - Do not create duplicate layers.
 * - Only replace placeholder content.
 * - If a placeholder is missing, show warning and skip only that field, continuing remaining fields.
 */
export function applyTemplateMapping(template: CardTemplate, formData: NidaFormData): PopulatedTemplateResult {
  const isBackSide = isBackSideTemplate(template);
  // 1. Generate mapping plan
  const plan = planTemplateMapping(template, formData);

  // 2. Target gender
  const targetGender: 'M' | 'F' = (formData.gender || '').trim().toUpperCase().startsWith('M') ? 'M' : 'F';

  // 3. Clone template immutably
  const clonedLayers: Layer[] = [];
  let populatedCount = 0;

  if (isBackSide) {
    // -------------------------------------------------------------
    // STRICT NIDA BACK SIDE POPULATION RULES:
    // - Populate ONLY: NIDA_NUMBER
    // - Keep barcode position intact.
    // - Keep existing coordinates.
    // - Keep existing layout.
    // - Keep existing styling.
    // - Keep existing spacing.
    // - If barcode exists: Synchronize NIDA Number with barcode data source.
    // - Do not modify any other back-side content.
    // - Do not alter legal text.
    // - Do not alter background elements.
    // - Only update NIDA Number related elements.
    // -------------------------------------------------------------
    for (const layer of template.layers) {
      // 1. If layer is Barcode: Synchronize NIDA Number with barcode data source
      if (layer.type === 'barcode') {
        const barcodeLayer = layer as BarcodeLayer;
        let barcodeData = barcodeLayer.data;
        if (formData.nidaNumber) {
          barcodeData = replaceTextTokens(barcodeData, formData);
          if (barcodeData === barcodeLayer.data || barcodeData.startsWith('{{')) {
            barcodeData = barcodeLayer.barcodeType === 'Code128'
              ? formData.nidaNumber.replace(/-/g, '')
              : formData.nidaNumber;
          }
        }
        if (barcodeData !== barcodeLayer.data) {
          populatedCount++;
        }
        // Strict preservation: Keep barcode position, coordinates, layout, styling, and spacing intact
        clonedLayers.push({
          ...barcodeLayer,
          data: barcodeData,
        });
        continue;
      }

      // 2. If layer is QR Code relating to ID: Synchronize with NIDA Number
      if (layer.type === 'qrcode') {
        const qrLayer = layer as QRCodeLayer;
        let qrData = qrLayer.data;
        if (formData.nidaNumber && (matchLayerToBinding(layer, 'NIDA_NUMBER', template.layers) || qrData.includes('{{'))) {
          qrData = replaceTextTokens(qrData, formData);
          if (qrData === qrLayer.data) {
            qrData = formData.nidaNumber;
          }
        }
        if (qrData !== qrLayer.data) {
          populatedCount++;
        }
        clonedLayers.push({
          ...qrLayer,
          data: qrData,
        });
        continue;
      }

      // 3. If layer is Text: ONLY update if it relates to NIDA Number!
      // Do NOT modify legal text, terms, issuing authority, headers, or any other content!
      if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        const hasNidaToken = /\{\{nida_number\}\}|\{\{nida\}\}|\{\{id_number\}\}|\{\{national_id\}\}|\{\{nin\}\}|\{\{id_no\}\}/i.test(textLayer.text);
        const isNidaLayer = BINDING_LAYER_HEURISTICS.NIDA_NUMBER.test(layer.name) || BINDING_LAYER_HEURISTICS.NIDA_NUMBER.test(layer.id);

        if (hasNidaToken || (isNidaLayer && !textLayer.text.toLowerCase().includes('authority') && !textLayer.text.toLowerCase().includes('jamhuri'))) {
          let newText = textLayer.text;
          if (formData.nidaNumber) {
            newText = replaceTextTokens(textLayer.text, formData);
            if (newText === textLayer.text && isNidaLayer) {
              newText = formData.nidaNumber;
            }
          }

          if (newText !== textLayer.text) {
            populatedCount++;
          }

          // Strict preservation: Keep existing coordinates, styling, font, font-size, alignment, spacing
          clonedLayers.push({
            ...textLayer,
            text: newText,
          });
          continue;
        }

        // Legal text, notices, card title, issuer address: STRICTLY UNTOUCHED
        clonedLayers.push({ ...textLayer });
        continue;
      }

      // 4. All other layers (Images, shapes, backgrounds, watermarks, MRZ decorations): STRICTLY UNTOUCHED
      clonedLayers.push({ ...layer });
    }
  } else {
    // -------------------------------------------------------------
    // FRONT SIDE / STANDARD TEMPLATE POPULATION
    // Populates: FIRST_NAME, MIDDLE_NAME, LAST_NAME, DOB, GENDER, NIDA_NUMBER, PHOTO, SIGNATURE
    // -------------------------------------------------------------
    for (const layer of template.layers) {
      // Check if this layer matches Photo binding
      if (matchLayerToBinding(layer, 'PHOTO', template.layers)) {
        if (formData.photoUrl) {
          // Convert to ImageLayer or update ImageLayer src while keeping 100% of layout & coordinates
          const photoLayer: ImageLayer = {
            id: layer.id,
            name: layer.name,
            type: 'image',
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            rotation: layer.rotation,
            opacity: layer.opacity,
            locked: layer.locked,
            hidden: layer.hidden,
            groupId: layer.groupId,
            src: formData.photoUrl,
            aspectRatioLocked: true,
          };
          clonedLayers.push(photoLayer);
          populatedCount++;
          continue;
        } else {
          // Photo not provided, keep placeholder without moving or resizing
          clonedLayers.push({ ...layer });
          continue;
        }
      }

      // Check if this layer matches Signature binding
      if (matchLayerToBinding(layer, 'SIGNATURE', template.layers)) {
        if (formData.signatureUrl) {
          // Convert to ImageLayer or update ImageLayer src while keeping 100% of layout & coordinates
          const signatureLayer: ImageLayer = {
            id: layer.id,
            name: layer.name,
            type: 'image',
            x: layer.x,
            y: layer.y,
            width: layer.width,
            height: layer.height,
            rotation: layer.rotation,
            opacity: layer.opacity,
            locked: layer.locked,
            hidden: layer.hidden,
            groupId: layer.groupId,
            src: formData.signatureUrl,
            aspectRatioLocked: true,
          };
          clonedLayers.push(signatureLayer);
          populatedCount++;
          continue;
        } else {
          // Signature not provided, keep placeholder
          clonedLayers.push({ ...layer });
          continue;
        }
      }

      // Check if layer is TextLayer
      if (layer.type === 'text') {
        const textLayer = layer as TextLayer;

        // 1. If this is a static label for Gender/Sex, NEVER overwrite with M/F value!
        if (isGenderLabelLayer(layer)) {
          clonedLayers.push({ ...textLayer });
          continue;
        }

        // 2. Check if this layer is specifically the Gender Value layer (e.g. saved as "M", "F", {{gender}}, or positioned next to/below JINSI/SEX label)
        if (isGenderValueLayer(layer, template.layers)) {
          let updatedGenderText = replaceGenderInText(textLayer.text, targetGender);
          const isCompositeGender = /^(?:sex|jinsi|jinsia|gender).*[:：\-]/i.test(textLayer.text);
          if (!isCompositeGender) {
            updatedGenderText = targetGender;
          }

          if (updatedGenderText !== textLayer.text) {
            populatedCount++;
          }

          clonedLayers.push({
            ...textLayer,
            text: updatedGenderText,
          });
          continue;
        }

        // 3. General token replacement for names, dob, nida number, composite tokens
        let newText = replaceTextTokens(textLayer.text, formData);

        // If text didn't change via token, check if layer was matched via heuristic variable layer name
        // (Ensuring we don't accidentally overwrite static label layers!)
        const isLikelyLabel = /lbl_|label|header|title/i.test(layer.id) || /label|header|title/i.test(layer.name);

        if (newText === textLayer.text && !isLikelyLabel) {
          if (BINDING_LAYER_HEURISTICS.FIRST_NAME.test(layer.name) || BINDING_LAYER_HEURISTICS.FIRST_NAME.test(layer.id)) {
            if (formData.firstName) newText = formData.firstName.trim().toUpperCase();
          } else if (BINDING_LAYER_HEURISTICS.MIDDLE_NAME.test(layer.name) || BINDING_LAYER_HEURISTICS.MIDDLE_NAME.test(layer.id)) {
            if (formData.middleName) newText = formData.middleName.trim().toUpperCase();
          } else if (BINDING_LAYER_HEURISTICS.LAST_NAME.test(layer.name) || BINDING_LAYER_HEURISTICS.LAST_NAME.test(layer.id)) {
            if (formData.lastName) newText = formData.lastName.trim().toUpperCase();
          } else if (BINDING_LAYER_HEURISTICS.DOB.test(layer.name) || BINDING_LAYER_HEURISTICS.DOB.test(layer.id)) {
            if (formData.dob) newText = formData.dob;
          } else if (BINDING_LAYER_HEURISTICS.GENDER.test(layer.name) || BINDING_LAYER_HEURISTICS.GENDER.test(layer.id)) {
            newText = targetGender;
          } else if (BINDING_LAYER_HEURISTICS.NIDA_NUMBER.test(layer.name) || BINDING_LAYER_HEURISTICS.NIDA_NUMBER.test(layer.id)) {
            if (formData.nidaNumber) newText = formData.nidaNumber;
          }
        }

        if (newText !== textLayer.text) {
          populatedCount++;
        }

        // Preserve EXACT coordinates, dimensions, fonts, style, color, alignment, spacing
        clonedLayers.push({
          ...textLayer,
          text: newText,
        });
        continue;
      }

      // Check if layer is Barcode
      if (layer.type === 'barcode') {
        const barcodeLayer = layer as BarcodeLayer;
        let barcodeData = barcodeLayer.data;
        if (formData.nidaNumber) {
          barcodeData = replaceTextTokens(barcodeData, formData);
          if (barcodeData === barcodeLayer.data && (barcodeData.startsWith('{{') || barcodeData.length < 5)) {
            barcodeData = formData.nidaNumber.replace(/-/g, '');
          }
        }
        if (barcodeData !== barcodeLayer.data) {
          populatedCount++;
        }
        clonedLayers.push({
          ...barcodeLayer,
          data: barcodeData,
        });
        continue;
      }

      // Check if layer is QR Code
      if (layer.type === 'qrcode') {
        const qrLayer = layer as QRCodeLayer;
        const qrData = replaceTextTokens(qrLayer.data, formData);
        if (qrData !== qrLayer.data) {
          populatedCount++;
        }
        clonedLayers.push({
          ...qrLayer,
          data: qrData,
        });
        continue;
      }

      // All other layers (shapes, backgrounds, static headers) remain unchanged
      clonedLayers.push({ ...layer });
    }
  }

  const populatedTemplate: CardTemplate = {
    ...template,
    layers: clonedLayers,
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    populatedTemplate,
    plan,
    populatedCount,
    skippedCount: plan.missingBindings.length,
    warnings: plan.warnings,
    isBackSide,
  };
}
