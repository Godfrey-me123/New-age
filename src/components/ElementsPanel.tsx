import React, { useRef } from 'react';
import {
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Minus,
  Barcode as BarcodeIcon,
  QrCode,
  Tag,
  Brackets,
  Shield,
  FileSignature,
  Upload,
} from 'lucide-react';
import { useTemplateStore } from '../store/useTemplateStore';
import { Layer, ShapeType, BarcodeType } from '../types';

interface ElementsPanelProps {
  onElementAdded?: () => void;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({ onElementAdded }) => {
  const { addLayer, currentTemplate } = useTemplateStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = (defaultText: string = '{{first_name}}') => {
    const isVar = defaultText.startsWith('{{');
    let layerName = 'Text Layer';
    let bindingKey: any = undefined;
    let fieldId: string | undefined = undefined;

    if (defaultText.includes('first_middle_name')) {
      layerName = 'First Name + Middle Name';
      bindingKey = 'FIRST_MIDDLE_NAME';
      fieldId = 'firstMiddleName';
    } else if (defaultText.includes('first_name')) {
      layerName = 'First Name';
      bindingKey = 'FIRST_NAME';
      fieldId = 'firstName';
    } else if (defaultText.includes('middle_name')) {
      layerName = 'Middle Name';
      bindingKey = 'MIDDLE_NAME';
      fieldId = 'middleName';
    } else if (defaultText.includes('last_name')) {
      layerName = 'Last Name';
      bindingKey = 'LAST_NAME';
      fieldId = 'lastName';
    } else if (defaultText.includes('id_number')) {
      layerName = 'ID Number';
      bindingKey = 'NIDA_NUMBER';
      fieldId = 'nidaNumber';
    } else if (defaultText.includes('dob')) {
      layerName = 'Date of Birth';
      bindingKey = 'DOB';
      fieldId = 'dateOfBirth';
    } else if (defaultText.includes('gender')) {
      layerName = 'Gender / Sex';
      bindingKey = 'GENDER';
      fieldId = 'gender';
    } else if (isVar) {
      layerName = defaultText.replace(/[{}]/g, '');
    }

    const newLayer: Layer = {
      id: 'text_' + Date.now(),
      name: layerName,
      type: 'text',
      x: 10,
      y: 10,
      width: 45,
      height: 6,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      text: defaultText,
      bindingKey,
      fieldId,
      fieldName: fieldId || (bindingKey ? String(bindingKey).toLowerCase() : undefined),
      fontFamily: 'Helvetica',
      fontSize: 3.5, // mm
      fontWeight: 700,
      fontStyle: 'bold',
      textDecoration: 'none',
      color: '#0f172a',
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1.1,
    };
    addLayer(newLayer);
    onElementAdded?.();
  };

  const handleAddPlaceholder = (key: string, label: string) => {
    const newLayer: Layer = {
      id: 'ph_' + Date.now(),
      name: `${label} Placeholder`,
      type: 'placeholder',
      placeholderKey: key,
      label,
      placeholderType: key === 'photo' ? 'photo' : 'signature',
      x: 10,
      y: 10,
      width: key === 'photo' ? 25 : 30,
      height: key === 'photo' ? 32 : 12,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      borderColor: '#1e3a8a',
      backgroundColor: '#f1f5f9',
    };
    addLayer(newLayer);
    onElementAdded?.();
  };

  const handleAddShape = (shapeType: ShapeType, isRounded = false) => {
    const newLayer: Layer = {
      id: 'shape_' + Date.now(),
      name: isRounded ? 'Rounded Rectangle' : `${shapeType.toUpperCase()} Shape`,
      type: 'shape',
      shapeType,
      x: 15,
      y: 15,
      width: 30,
      height: shapeType === 'line' ? 1 : 20,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      fill: shapeType === 'line' ? 'transparent' : '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 0.5,
      borderRadius: isRounded ? 2 : 0,
      polygonSides: shapeType === 'polygon' ? 5 : undefined,
    };
    addLayer(newLayer);
    onElementAdded?.();
  };

  const handleAddBarcode = (barcodeType: BarcodeType) => {
    const newLayer: Layer = {
      id: 'bc_' + Date.now(),
      name: `Barcode (${barcodeType.toUpperCase()})`,
      type: 'barcode',
      barcodeType,
      data: 'ID-987654321',
      x: 10,
      y: currentTemplate.cardHeight - 14,
      width: 45,
      height: 10,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      includeText: true,
      lineColor: '#000000',
      backgroundColor: '#ffffff',
    };
    addLayer(newLayer);
    onElementAdded?.();
  };

  const handleAddQRCode = () => {
    const newLayer: Layer = {
      id: 'qr_' + Date.now(),
      name: 'QR Code',
      type: 'qrcode',
      data: 'https://example.com/verify/id/987654321',
      x: currentTemplate.cardWidth - 22,
      y: currentTemplate.cardHeight - 22,
      width: 18,
      height: 18,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      colorDark: '#000000',
      colorLight: '#ffffff',
    };
    addLayer(newLayer);
    onElementAdded?.();
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const wMm = 25;
        const hMm = wMm / aspect;

        const newLayer: Layer = {
          id: 'img_' + Date.now(),
          name: file.name.split('.')[0] || 'Image',
          type: 'image',
          src,
          x: 10,
          y: 10,
          width: wMm,
          height: hMm,
          rotation: 0,
          opacity: 1,
          locked: false,
          hidden: false,
        };
        addLayer(newLayer);
        onElementAdded?.();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-4 bg-[#FFFFFF]">
      {/* 1. Dynamic Variables */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] mb-2">
          <Tag className="w-3.5 h-3.5 text-[#000000]" />
          <span>ID Template Fields</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleAddText('{{first_name}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">First Name</span>
          </button>
          <button
            onClick={() => handleAddText('{{middle_name}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">Middle Name</span>
          </button>
          <button
            onClick={() => handleAddText('{{first_middle_name}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer col-span-2"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">First Name + Middle Name</span>
          </button>
          <button
            onClick={() => handleAddText('{{last_name}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">Last Name</span>
          </button>
          <button
            onClick={() => handleAddText('{{id_number}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">ID Number</span>
          </button>
          <button
            onClick={() => handleAddText('{{dob}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">Date of Birth</span>
          </button>
          <button
            onClick={() => handleAddText('{{gender}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">Gender / Sex</span>
          </button>
          <button
            onClick={() => handleAddText('{{card_expiry}}')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-1.5 transition-colors min-h-[40px] cursor-pointer"
          >
            <Brackets className="w-3.5 h-3.5 text-[#000000] flex-shrink-0" />
            <span className="truncate">Expiry Date</span>
          </button>
        </div>
      </div>

      {/* 2. Photo & Signature Placeholders */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] mb-2">
          <Shield className="w-3.5 h-3.5 text-[#000000]" />
          <span>Biometrics & Placeholders</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleAddPlaceholder('photo', 'ID Photo')}
            className="p-2.5 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-2 transition-colors min-h-[42px] cursor-pointer"
          >
            <div className="w-5 h-5 rounded bg-[#CEE9B9] text-[#000000] flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Photo Slot</span>
          </button>
          <button
            onClick={() => handleAddPlaceholder('signature', 'Signature')}
            className="p-2.5 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-2 transition-colors min-h-[42px] cursor-pointer"
          >
            <div className="w-5 h-5 rounded bg-[#ECA6FC] text-[#000000] flex items-center justify-center flex-shrink-0">
              <FileSignature className="w-3.5 h-3.5" />
            </div>
            <span className="truncate">Signature Slot</span>
          </button>
        </div>
      </div>

      {/* 3. Text & Media Elements */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] mb-2">
          <Type className="w-3.5 h-3.5 text-[#000000]" />
          <span>Text & Image</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleAddText('Static Text')}
            className="p-2.5 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-2 transition-colors min-h-[42px] cursor-pointer"
          >
            <Type className="w-4 h-4 text-[#000000] flex-shrink-0" />
            <span className="truncate">Custom Text</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-2 transition-colors min-h-[42px] cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#000000] flex-shrink-0" />
            <span className="truncate">Upload Image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              className="hidden"
            />
          </button>
        </div>
      </div>

      {/* 4. Shapes */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] mb-2">
          <Square className="w-3.5 h-3.5 text-[#000000]" />
          <span>Geometric Shapes</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleAddShape('rectangle')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex flex-col items-center justify-center gap-1 transition-colors min-h-[50px] cursor-pointer"
          >
            <Square className="w-4 h-4 text-[#000000]" />
            <span className="text-[10px]">Rect</span>
          </button>
          <button
            onClick={() => handleAddShape('rectangle', true)}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex flex-col items-center justify-center gap-1 transition-colors min-h-[50px] cursor-pointer"
          >
            <div className="w-4 h-4 rounded border-2 border-[#000000]" />
            <span className="text-[10px]">Rounded</span>
          </button>
          <button
            onClick={() => handleAddShape('circle')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex flex-col items-center justify-center gap-1 transition-colors min-h-[50px] cursor-pointer"
          >
            <CircleIcon className="w-4 h-4 text-[#000000]" />
            <span className="text-[10px]">Circle</span>
          </button>
          <button
            onClick={() => handleAddShape('line')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex flex-col items-center justify-center gap-1 transition-colors min-h-[50px] cursor-pointer"
          >
            <Minus className="w-4 h-4 text-[#000000]" />
            <span className="text-[10px]">Line</span>
          </button>
          <button
            onClick={() => handleAddShape('polygon')}
            className="p-2 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex flex-col items-center justify-center gap-1 transition-colors min-h-[50px] cursor-pointer"
          >
            <Shield className="w-4 h-4 text-[#000000]" />
            <span className="text-[10px]">Badge</span>
          </button>
        </div>
      </div>

      {/* 5. Barcodes & QR Codes */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#000000] mb-2">
          <BarcodeIcon className="w-3.5 h-3.5 text-[#000000]" />
          <span>Barcodes & QR Codes</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleAddBarcode('Code128')}
            className="p-2.5 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-2 transition-colors min-h-[42px] cursor-pointer"
          >
            <BarcodeIcon className="w-4 h-4 text-[#000000] flex-shrink-0" />
            <span className="truncate">Code 128</span>
          </button>
          <button
            onClick={handleAddQRCode}
            className="p-2.5 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-2 transition-colors min-h-[42px] cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#000000] flex-shrink-0" />
            <span className="truncate">QR Code</span>
          </button>
          <button
            onClick={() => handleAddBarcode('PDF417')}
            className="p-2.5 rounded-lg bg-[#E7E9EB] hover:bg-[#dadcdc] border border-[#dadcdc] text-xs font-semibold text-[#000000] flex items-center gap-2 transition-colors min-h-[42px] cursor-pointer"
          >
            <BarcodeIcon className="w-4 h-4 text-[#000000] flex-shrink-0" />
            <span className="truncate">PDF417 2D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
