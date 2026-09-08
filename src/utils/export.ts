import jsPDF from 'jspdf';
import { CardTemplate, CardData, Layer } from '../types';
import { generateBarcodeDataUrl, generateQRCodeDataUrl } from './barcodes';
import { mmToPx } from './units';
import { applyTemplateMapping, NidaFormData, isBackSideTemplate } from './templateMappingEngine';
import { FONT_WEIGHTS_BY_FAMILY } from './fonts';
import { useTemplateStore } from '../store/useTemplateStore';
import { SAMPLE_TEMPLATES } from './sampleTemplates';

export interface CropRegion {
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
  let c = hex.startsWith('#') ? hex.substring(1) : hex;
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Render template with replaced card data onto an offscreen canvas
 */
export async function renderTemplateToCanvas(
  template: CardTemplate,
  cardData: CardData = {},
  renderDpi: number = 300,
  cropRegion?: CropRegion
): Promise<HTMLCanvasElement> {
  const store = useTemplateStore.getState();

  // 1. Determine effective card data (fallback to store's lastNidaFormData)
  const storeFormData = store.lastNidaFormData || {};
  const effectiveCardData: CardData = {
    ...storeFormData,
    ...cardData,
  };

  // 2. Determine effective template: prefer store's populated front/back template if available and IDs match exactly
  if (store.frontPopulatedTemplate && template.id === store.frontPopulatedTemplate.id) {
    template = store.frontPopulatedTemplate;
  } else if (store.backPopulatedTemplate && template.id === store.backPopulatedTemplate.id) {
    template = store.backPopulatedTemplate;
  }

  // 3. Apply mapping engine pass if form data exists
  if (effectiveCardData && (effectiveCardData.nidaNumber || effectiveCardData.firstName || effectiveCardData.lastName || effectiveCardData.dob)) {
    const mappedRes = applyTemplateMapping(template, effectiveCardData as unknown as NidaFormData);
    if (mappedRes.populatedTemplate) {
      template = mappedRes.populatedTemplate;
    }
  }

  const canvas = document.createElement('canvas');
  const widthPx = Math.round(mmToPx(template.cardWidth, renderDpi));
  const heightPx = Math.round(mmToPx(template.cardHeight, renderDpi));

  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);

  if (template.background?.type === 'image' && template.background.src) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, widthPx, heightPx);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = template.background.src!;
    });
  } else if (template.background?.type === 'color' && template.background.color) {
    ctx.fillStyle = template.background.color;
    ctx.fillRect(0, 0, widthPx, heightPx);
  }

  // Replace variable helper function with alias resolution
  const replaceVars = (str: string): string => {
    if (!str) return '';
    return str.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const trimmed = key.trim();
      const val = cardData[trimmed] !== undefined ? cardData[trimmed] : effectiveCardData[trimmed];
      if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);

      const f = ((cardData.firstName ?? effectiveCardData.firstName ?? '') as string).trim();
      const m = ((cardData.middleName ?? effectiveCardData.middleName ?? '') as string).trim();
      const l = ((cardData.lastName ?? effectiveCardData.lastName ?? '') as string).trim();
      const displayNameLine1 = m ? `${f} ${m}`.trim() : f;

      // Fallback aliases for NIDA fields
      if (
        trimmed === 'first_middle_name' ||
        trimmed === 'first_name_middle_name' ||
        trimmed === 'first_name_plus_middle_name' ||
        trimmed === 'first_plus_middle_name' ||
        trimmed === 'display_name_line1' ||
        trimmed === 'displaynameline1' ||
        trimmed === 'first_name_and_middle_name'
      ) {
        return displayNameLine1;
      }
      if (trimmed === 'first_name' || trimmed === 'given_names' || trimmed === 'fname' || trimmed === 'firstname') return f;
      if (trimmed === 'middle_name' || trimmed === 'middlename' || trimmed === 'other_names' || trimmed === 'mname') return m;
      if (trimmed === 'last_name' || trimmed === 'surname' || trimmed === 'family_name' || trimmed === 'lname' || trimmed === 'lastname') return l;
      if (trimmed === 'dob' || trimmed === 'date_of_birth' || trimmed === 'birth_date' || trimmed === 'birthdate') return (effectiveCardData.dob as string) || '';
      if (trimmed === 'gender' || trimmed === 'sex' || trimmed === 'jinsi' || trimmed === 'jinsia') return (effectiveCardData.gender as string) || '';
      if (trimmed === 'nida_number' || trimmed === 'id_number' || trimmed === 'nin' || trimmed === 'national_id') return (effectiveCardData.nidaNumber as string) || '';

      return `{{${trimmed}}}`;
    });
  };

  // Render layers in z-index order
  for (const layer of template.layers) {
    if (layer.hidden) continue;

    const x = mmToPx(layer.x, renderDpi);
    const y = mmToPx(layer.y, renderDpi);
    const w = mmToPx(layer.width, renderDpi);
    const h = mmToPx(layer.height, renderDpi);

    ctx.save();
    ctx.globalAlpha = layer.type === 'text'
      ? (layer.opacity ?? 1) * ((layer as any).textOpacity ?? 1)
      : (layer.opacity ?? 1);

    if (layer.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }

    if (layer.type === 'text') {
      let textVal = replaceVars(layer.text) || '';

      // Text Case Display Transformation (Display-only, original unchanged)
      const textCase = (layer as any).textCase || 'original';
      if (textCase === 'uppercase') {
        textVal = textVal.toUpperCase();
      } else if (textCase === 'lowercase') {
        textVal = textVal.toLowerCase();
      } else if (textCase === 'capitalize') {
        textVal = textVal.split(' ').map(word => {
          if (!word) return '';
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
      }

      const fontSizePx = mmToPx(layer.fontSize, renderDpi);

      // Bold Simulation
      const availableWeights = FONT_WEIGHTS_BY_FAMILY[layer.fontFamily] || [400, 700];
      const hasRealBold = availableWeights.some(w => w >= 600);
      const isBoldSimulationActive = (layer as any).boldSimulation === 'simulated_bold' || 
        ((layer as any).boldSimulation === 'bold' && !hasRealBold);

      let finalWeight = layer.fontWeight ?? (layer.fontStyle?.includes('bold') ? 700 : 400);
      if ((layer as any).boldSimulation === 'bold' && hasRealBold) {
        finalWeight = 700;
      } else if ((layer as any).boldSimulation === 'normal' || (layer as any).boldSimulation === 'simulated_bold') {
        finalWeight = 400;
      }

      // Format font string for standard canvas: weight italic size family
      const isItalic = layer.fontStyle?.includes('italic');
      ctx.font = `${isItalic ? 'italic ' : ''}${finalWeight} ${fontSizePx}px "${layer.fontFamily || 'Helvetica'}"`;
      ctx.fillStyle = layer.color || '#000000';
      ctx.textBaseline = 'top';

      let textX = x;
      if (layer.align === 'center') textX = x + w / 2;
      if (layer.align === 'right') textX = x + w;

      ctx.textAlign = layer.align === 'justify' ? 'left' : layer.align;

      // Text width presets (Normal, Condensed, Expanded)
      const PRESET_SCALES: Record<string, number> = {
        normal: 1.0,
        condensed: 0.75,
        semi_condensed: 0.85,
        expanded: 1.25,
        semi_expanded: 1.15,
      };
      const presetScale = PRESET_SCALES[(layer as any).widthPreset || 'normal'] || 1.0;
      const finalScaleX = ((layer as any).horizontalScale ?? 1) * presetScale;
      const finalScaleY = (layer as any).verticalScale ?? 1;

      // Letter spacing and word spacing setup
      const letterSpacingPx = mmToPx(layer.letterSpacing || 0, renderDpi);
      if (letterSpacingPx) {
        (ctx as any).letterSpacing = `${letterSpacingPx}px`;
      } else {
        (ctx as any).letterSpacing = '0px';
      }

      const wordSpacingPx = mmToPx((layer as any).wordSpacing || 0, renderDpi);
      if (wordSpacingPx) {
        (ctx as any).wordSpacing = `${wordSpacingPx}px`;
      } else {
        (ctx as any).wordSpacing = '0px';
      }

      // Shadow setup
      if ((layer as any).shadowEnabled) {
        ctx.shadowColor = hexToRgba((layer as any).shadowColor || '#000000', ((layer as any).shadowOpacity ?? 50) / 100);
        ctx.shadowBlur = mmToPx((layer as any).shadowBlur ?? 1.5, renderDpi);
        ctx.shadowOffsetX = mmToPx((layer as any).shadowOffsetX ?? 0.5, renderDpi);
        ctx.shadowOffsetY = mmToPx((layer as any).shadowOffsetY ?? 0.5, renderDpi);
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      // Handle multiline text
      const lines = textVal.split('\n');
      const lineGap = fontSizePx * (layer.lineHeight || 1.1);

      lines.forEach((line, idx) => {
        const lineY = y + idx * lineGap;
        ctx.save();
        
        // Translate to the specific line's baseline coordinate, then apply scale!
        ctx.translate(textX, lineY);
        ctx.scale(finalScaleX, finalScaleY);

        // Draw fill text
        ctx.fillText(line, 0, 0);

        // Draw outline if enabled (or if simulated bold is active)
        let drawStroke = false;
        let strokeColor = '#000000';
        let strokeWidth = 0;

        if ((layer as any).strokeEnabled && (layer as any).strokeWidth) {
          drawStroke = true;
          strokeColor = (layer as any).strokeColor || '#000000';
          strokeWidth = mmToPx((layer as any).strokeWidth, renderDpi);
        } else if (isBoldSimulationActive) {
          drawStroke = true;
          strokeColor = layer.color || '#000000';
          strokeWidth = fontSizePx * 0.04;
        }

        if (drawStroke && strokeWidth > 0) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.strokeText(line, 0, 0);
        }

        // Draw underline inside the translated & scaled matrix for mathematical perfection
        if (layer.textDecoration === 'underline') {
          const metrics = ctx.measureText(line);
          ctx.beginPath();
          ctx.strokeStyle = layer.color || '#000000';
          ctx.lineWidth = Math.max(1, fontSizePx / 15);
          
          let uStartX = 0;
          if (layer.align === 'center') uStartX = -metrics.width / 2;
          else if (layer.align === 'right') uStartX = -metrics.width;
          
          ctx.moveTo(uStartX, fontSizePx + 2);
          ctx.lineTo(uStartX + metrics.width, fontSizePx + 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      // Clear layout-specific text metrics parameters to avoid bleeding into other canvas layers
      (ctx as any).letterSpacing = '0px';
      (ctx as any).wordSpacing = '0px';
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else if (layer.type === 'image') {
      const imgSrc = replaceVars(layer.src);
      if (imgSrc) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.drawImage(img, x, y, w, h);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = imgSrc;
        });
      }
    } else if (layer.type === 'placeholder') {
      const key = (layer.placeholderKey || '').toLowerCase();
      let photoSrc = cardData[layer.placeholderKey] || effectiveCardData[layer.placeholderKey];
      if (!photoSrc) {
        if (key.includes('photo') || key === 'picture' || key === 'avatar') {
          photoSrc = (effectiveCardData.photoUrl as string) || (effectiveCardData.photo as string);
        } else if (key.includes('sig') || key === 'signature') {
          photoSrc = (effectiveCardData.signatureUrl as string) || (effectiveCardData.signature as string);
        }
      }

      if (photoSrc) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            ctx.drawImage(img, x, y, w, h);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = photoSrc;
        });
      } else {
        // Render placeholder box
        ctx.fillStyle = layer.backgroundColor || '#f1f5f9';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = layer.borderColor || '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#64748b';
        ctx.font = `${Math.max(12, h / 8)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(layer.label || `{{${layer.placeholderKey}}}`, x + w / 2, y + h / 2);
      }
    } else if (layer.type === 'shape') {
      ctx.fillStyle = layer.fill || 'transparent';
      ctx.strokeStyle = layer.stroke || 'transparent';
      ctx.lineWidth = mmToPx(layer.strokeWidth || 0.5, renderDpi);

      if (layer.shapeType === 'rectangle') {
        const radiusPx = mmToPx(layer.borderRadius || 0, renderDpi);
        if (radiusPx > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, w, h, radiusPx);
          if (layer.fill) ctx.fill();
          if (layer.stroke) ctx.stroke();
        } else {
          if (layer.fill) ctx.fillRect(x, y, w, h);
          if (layer.stroke) ctx.strokeRect(x, y, w, h);
        }
      } else if (layer.shapeType === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
        if (layer.fill) ctx.fill();
        if (layer.stroke) ctx.stroke();
      } else if (layer.shapeType === 'line') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
      }
    } else if (layer.type === 'barcode') {
      const barcodeData = replaceVars(layer.data);
      const dataUrl = await generateBarcodeDataUrl(
        layer.barcodeType,
        barcodeData,
        layer.lineColor,
        layer.backgroundColor,
        layer.includeText
      );
      if (dataUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x, y, w, h);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = dataUrl;
        });
      }
    } else if (layer.type === 'qrcode') {
      const qrData = replaceVars(layer.data);
      const dataUrl = await generateQRCodeDataUrl(qrData, layer.colorDark, layer.colorLight);
      if (dataUrl) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, x, y, w, h);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = dataUrl;
        });
      }
    }

    ctx.restore();
  }

  // Apply crop region if specified
  if (cropRegion && (cropRegion.x > 0 || cropRegion.y > 0 || cropRegion.width !== template.cardWidth || cropRegion.height !== template.cardHeight)) {
    const cropX = Math.max(0, mmToPx(cropRegion.x, renderDpi));
    const cropY = Math.max(0, mmToPx(cropRegion.y, renderDpi));
    const cropW = Math.min(canvas.width - cropX, mmToPx(cropRegion.width, renderDpi));
    const cropH = Math.min(canvas.height - cropY, mmToPx(cropRegion.height, renderDpi));

    if (cropW > 0 && cropH > 0) {
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = Math.round(cropW);
      croppedCanvas.height = Math.round(cropH);
      const croppedCtx = croppedCanvas.getContext('2d');
      if (croppedCtx) {
        croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        return croppedCanvas;
      }
    }
  }

  return canvas;
}

/**
 * Export options
 */
export async function downloadPNG(
  template: CardTemplate,
  cardData: CardData = {},
  filename?: string,
  cropRegion?: CropRegion
) {
  const canvas = await renderTemplateToCanvas(template, cardData, 300, cropRegion);
  const link = document.createElement('a');
  link.download = filename || `${template.templateName.toLowerCase().replace(/\s+/g, '_')}_300dpi.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function downloadJPG(
  template: CardTemplate,
  cardData: CardData = {},
  filename?: string,
  cropRegion?: CropRegion
) {
  const canvas = await renderTemplateToCanvas(template, cardData, 300, cropRegion);
  const link = document.createElement('a');
  link.download = filename || `${template.templateName.toLowerCase().replace(/\s+/g, '_')}_300dpi.jpg`;
  link.href = canvas.toDataURL('image/jpeg', 0.95);
  link.click();
}

export async function downloadPDF(
  template: CardTemplate,
  cardData: CardData = {},
  filename?: string,
  cropRegion?: CropRegion
) {
  const cardWidth = cropRegion ? cropRegion.width : template.cardWidth;
  const cardHeight = cropRegion ? cropRegion.height : template.cardHeight;

  // Standard A4 sheet dimensions in mm (210 x 297 mm)
  const pageWidth = 210;
  const pageHeight = 297;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const canvas = await renderTemplateToCanvas(template, cardData, 300, cropRegion);
  const imgData = canvas.toDataURL('image/png');

  // Position card in exact 1:1 physical real-world size centered on A4 paper
  const x = (pageWidth - cardWidth) / 2;
  const y = (pageHeight - cardHeight) / 2;

  pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight);
  pdf.save(filename || `${template.templateName.toLowerCase().replace(/\s+/g, '_')}_print.pdf`);
}

export async function download2In1PDF(
  frontTemplate?: CardTemplate,
  backTemplate?: CardTemplate,
  cardData: CardData = {},
  filename?: string
) {
  const store = useTemplateStore.getState();

  const storeFormData = store.lastNidaFormData || {};
  const effectiveCardData: CardData = {
    ...storeFormData,
    ...cardData,
  };

  // Source of truth for templates:
  // If the passed template ID matches the active populated template in the store, use the store's populated template directly!
  // This guarantees that the PDF export matches the preview exactly, with all latest layout and text edits intact.
  let fTpl = frontTemplate;
  if (fTpl && store.frontPopulatedTemplate && fTpl.id === store.frontPopulatedTemplate.id) {
    fTpl = store.frontPopulatedTemplate;
  } else if (!fTpl) {
    fTpl = store.frontPopulatedTemplate || store.currentTemplate;
  }

  let bTpl = backTemplate;
  if (bTpl && store.backPopulatedTemplate && bTpl.id === store.backPopulatedTemplate.id) {
    bTpl = store.backPopulatedTemplate;
  } else if (!bTpl) {
    bTpl = store.backPopulatedTemplate;
  }

  if (!bTpl) {
    // If no back template provided, find or generate sample back
    const sampleBack = SAMPLE_TEMPLATES.find((t) => t.id === 'sample_tanzania_nida_back') || SAMPLE_TEMPLATES[1];
    if (sampleBack) {
      const bRes = applyTemplateMapping(sampleBack, effectiveCardData as unknown as NidaFormData);
      bTpl = bRes.populatedTemplate || sampleBack;
    } else {
      bTpl = fTpl;
    }
  }

  // Ensure both front and back templates have 1:1 mapping applied
  if (fTpl && effectiveCardData && (effectiveCardData.firstName || effectiveCardData.nidaNumber || effectiveCardData.lastName)) {
    const fRes = applyTemplateMapping(fTpl, effectiveCardData as unknown as NidaFormData);
    if (fRes.populatedTemplate) fTpl = fRes.populatedTemplate;
  }

  if (bTpl && effectiveCardData && (effectiveCardData.firstName || effectiveCardData.nidaNumber || effectiveCardData.lastName)) {
    const bRes = applyTemplateMapping(bTpl, effectiveCardData as unknown as NidaFormData);
    if (bRes.populatedTemplate) bTpl = bRes.populatedTemplate;
  }

  // Standard A4 sheet dimensions in mm (210 x 297 mm)
  const pageWidth = 210;
  const pageHeight = 297;
  const gapMm = 12; // 12mm spacing between front and back cards

  const frontW = fTpl.cardWidth;
  const frontH = fTpl.cardHeight;
  const backW = bTpl.cardWidth;
  const backH = bTpl.cardHeight;

  const totalHeight = frontH + gapMm + backH;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Calculate vertical centering for the front + back stack on A4 page
  const startY = (pageHeight - totalHeight) / 2;

  // Render front card
  const frontCanvas = await renderTemplateToCanvas(fTpl, effectiveCardData, 300);
  const frontImg = frontCanvas.toDataURL('image/png');
  const frontX = (pageWidth - frontW) / 2;
  const frontY = startY;
  pdf.addImage(frontImg, 'PNG', frontX, frontY, frontW, frontH);

  // Render back card directly below with 12mm gap
  const backCanvas = await renderTemplateToCanvas(bTpl, effectiveCardData, 300);
  const backImg = backCanvas.toDataURL('image/png');
  const backX = (pageWidth - backW) / 2;
  const backY = frontY + frontH + gapMm;
  pdf.addImage(backImg, 'PNG', backX, backY, backW, backH);

  pdf.save(
    filename || `merged_2in1_${fTpl.templateName.toLowerCase().replace(/\s+/g, '_')}.pdf`
  );
}

export function downloadJSON(template: CardTemplate, filename?: string) {
  const exportPayload = {
    templateName: template.templateName,
    cardWidth: template.cardWidth,
    cardHeight: template.cardHeight,
    unit: template.unit || 'mm',
    dpi: template.dpi || 300,
    orientation: template.orientation,
    background: template.background,
    guides: template.guides,
    layers: template.layers.map((layer) => ({
      ...layer,
      x: Number(layer.x.toFixed(2)),
      y: Number(layer.y.toFixed(2)),
      width: Number(layer.width.toFixed(2)),
      height: Number(layer.height.toFixed(2)),
      unit: 'mm',
    })),
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename || `${template.templateName.toLowerCase().replace(/\s+/g, '_')}_template.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadSVG(template: CardTemplate, cardData: CardData = {}): Promise<void> {
  const wMm = template.cardWidth;
  const hMm = template.cardHeight;

  let svgElements = '';

  for (const layer of template.layers) {
    if (layer.hidden) continue;
    if (layer.type === 'text') {
      const textVal = layer.text.replace(/\{\{(.*?)\}\}/g, (_, k) => cardData[k.trim()] || `{{${k.trim()}}}`);
      svgElements += `<text x="${layer.x}" y="${layer.y + layer.fontSize}" font-family="${layer.fontFamily}" font-size="${layer.fontSize}" fill="${layer.color}">${textVal}</text>`;
    } else if (layer.type === 'shape' && layer.shapeType === 'rectangle') {
      svgElements += `<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${layer.fill}" stroke="${layer.stroke}" stroke-width="${layer.strokeWidth}" />`;
    }
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wMm} ${hMm}" width="${wMm}mm" height="${hMm}mm">
    <rect width="${wMm}" height="${hMm}" fill="#ffffff"/>
    ${svgElements}
  </svg>`;

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${template.templateName.toLowerCase().replace(/\s+/g, '_')}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
