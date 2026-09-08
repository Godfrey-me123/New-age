export type Unit = 'px' | 'mm' | 'cm' | 'in';

export type CardType = 'National ID' | 'Employee ID' | 'Student ID' | 'Membership Card' | 'Access Badge' | 'Other';
export type CardSide = 'Front Side' | 'Back Side' | 'Full Card' | 'Single Side';

export type LayerType = 'text' | 'image' | 'placeholder' | 'shape' | 'barcode' | 'qrcode' | 'group';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'polygon';

export type BarcodeType = 'Code128' | 'PDF417' | 'EAN13';

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number; // Stored in mm
  color: string;
  locked: boolean;
  hidden: boolean;
}

export interface UploadedBackground {
  id: string;
  name: string;
  src: string;
  originalWidthPx: number;
  originalHeightPx: number;
  orientation: 'landscape' | 'portrait';
  createdAt: string;
}

export interface SmartGuide {
  type: 'x' | 'y' | 'rect' | 'distance';
  position?: number; // in canvas px
  label?: string;
  line?: { x1: number; y1: number; x2: number; y2: number };
}

export interface BaseLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number; // mm
  y: number; // mm
  width: number; // mm
  height: number; // mm
  rotation: number; // degrees
  opacity: number; // 0 to 1
  locked: boolean;
  hidden: boolean;
  groupId?: string;
  fieldName?: string; // e.g. "firstName", "lastName", "dateOfBirth", "gender", "nidaNumber", "photo", "signature"
  fieldId?: string;   // e.g. "firstName", "lastName", "dateOfBirth", "gender", "nidaNumber", "photo", "signature"
  fieldType?: string; // e.g. "firstName", "lastName", "dateOfBirth", "gender", "nidaNumber", "photo", "signature"
  bindingKey?: string;// e.g. "FIRST_NAME", "LAST_NAME", "DOB", "GENDER", "NIDA_NUMBER", "PHOTO", "SIGNATURE"
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string; // e.g. "{{first_name}}" or "JOHN DOE"
  fontFamily: string;
  fontSize: number; // in pt or mm
  fontStyle: string; // e.g. 'normal', 'bold', 'italic', 'bold italic', '700', etc.
  fontWeight?: number; // e.g. 300, 400, 500, 600, 700, 800, 900
  textDecoration: 'none' | 'underline';
  color: string;
  align: 'left' | 'center' | 'right' | 'justify';
  letterSpacing: number; // mm
  lineHeight: number;

  // Advanced Typography Properties
  verticalScale?: number; // stretch ratio, default 1
  horizontalScale?: number; // stretch ratio, default 1
  wordSpacing?: number; // in mm, default 0

  // Text Opacity
  textOpacity?: number; // 0 to 1, default 1

  // Text Stroke / Outline
  strokeEnabled?: boolean;
  strokeWidth?: number; // in mm
  strokeColor?: string;

  // Text Shadow
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowOpacity?: number; // 0 to 100
  shadowBlur?: number; // in mm
  shadowOffsetX?: number; // in mm
  shadowOffsetY?: number; // in mm

  // Text Case Control (Prompt 6)
  textCase?: 'original' | 'uppercase' | 'lowercase' | 'capitalize';

  // Bold Simulation (Prompt 7)
  boldSimulation?: 'normal' | 'bold' | 'simulated_bold';

  // Condensed / Expanded Width Presets (Prompt 8)
  widthPreset?: 'normal' | 'condensed' | 'semi_condensed' | 'expanded' | 'semi_expanded';
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string; // base64 or url
  aspectRatioLocked?: boolean;
}

export interface PlaceholderLayer extends BaseLayer {
  type: 'placeholder';
  placeholderKey: string; // e.g. "photo", "signature", "logo"
  label: string; // e.g. "Passport Photo"
  placeholderType: 'photo' | 'signature' | 'badge';
  borderColor: string;
  backgroundColor: string;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: ShapeType;
  fill: string;
  stroke: string;
  strokeWidth: number; // mm
  borderRadius?: number; // mm for rectangle
  polygonSides?: number; // for polygon
}

export interface BarcodeLayer extends BaseLayer {
  type: 'barcode';
  barcodeType: BarcodeType;
  data: string; // e.g. "{{id_number}}" or "12345678"
  lineColor: string;
  backgroundColor: string;
  includeText: boolean;
}

export interface QRCodeLayer extends BaseLayer {
  type: 'qrcode';
  data: string; // e.g. "ID: {{id_number}} | Name: {{first_name}}"
  colorDark: string;
  colorLight: string;
}

export interface GroupLayer extends BaseLayer {
  type: 'group';
  childrenIds: string[];
}

export type Layer =
  | TextLayer
  | ImageLayer
  | PlaceholderLayer
  | ShapeLayer
  | BarcodeLayer
  | QRCodeLayer
  | GroupLayer;

export interface BackgroundConfig {
  type: 'image' | 'color';
  src?: string; // base64 / URL if image
  color?: string; // hex color
  aspectRatio?: number;
  originalWidthPx?: number;
  originalHeightPx?: number;
}

export interface GridSettings {
  enabled: boolean;
  sizeMm: number; // 1, 2, 5, 10 mm
  color: string;
  opacity: number;
}

export interface SnapSettings {
  snapToGrid: boolean;
  snapToGuides: boolean;
  snapToObjects: boolean;
  snapToCenter: boolean;
  snapToEqualSpacing: boolean;
  thresholdMm: number; // default 1.5mm
}

export interface CardTemplate {
  id: string;
  templateName: string;
  cardType?: CardType;
  side?: CardSide;
  cardWidth: number; // mm (e.g., 85.60 for standard CR80)
  cardHeight: number; // mm (e.g., 53.98)
  unit: Unit; // default 'mm'
  dpi: number; // default 300
  orientation: 'landscape' | 'portrait';
  background: BackgroundConfig;
  layers: Layer[];
  guides: Guide[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedMergeLayout {
  id: string;
  name: string;
  frontTemplateId: string;
  backTemplateId: string;
  frontTemplateName?: string;
  backTemplateName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardData {
  [key: string]: string; // key matches template variable e.g. "first_name": "Alex", "photo": "data:image/png..."
}

export interface NidaSubmissionRecord {
  id: string;
  frontTemplateId: string;
  backTemplateId: string;
  frontTemplateName?: string;
  backTemplateName?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  nidaNumber: string;
  photo?: string | null;
  signature?: string | null;
  submittedAt: string;
}
