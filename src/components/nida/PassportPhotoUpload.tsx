import React, { useState, useRef } from 'react';
import {
  Upload,
  Crop,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { PhotoCropModal } from './PhotoCropModal';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface PassportPhotoUploadProps {
  value?: string | null;
  onChange: (photoDataUrl: string | null) => void;
  disabled?: boolean;
}

export const PassportPhotoUpload: React.FC<PassportPhotoUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and read file while strictly preserving original format & transparency
  const processFile = (file: File) => {
    setError(null);

    // Format validation
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Unsupported file format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    // Size validation (Max 10MB)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setError(`File is too large (${sizeMb}MB). Maximum allowed size is 10MB.`);
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setError('Failed to read image file.');
        setIsProcessing(false);
        return;
      }

      // Preserve original file, format, MIME type, and transparency untouched!
      setIsProcessing(false);
      setRawImageForCrop(dataUrl);
      onChange(dataUrl);
    };

    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setIsProcessing(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input so same file can be chosen again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenCrop = () => {
    if (rawImageForCrop || value) {
      setShowCropModal(true);
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setShowCropModal(false);
    onChange(croppedDataUrl);
  };

  const handleRemovePhoto = () => {
    onChange(null);
    setRawImageForCrop(null);
    setError(null);
  };

  return (
    <div className="w-full space-y-3 font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* Main Upload Card Container */}
      <div className="p-4 sm:p-5 bg-[#000000]/60 border border-[#4C5055]/60 rounded-2xl space-y-4 shadow-inner">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#47A5FF] shadow-[0_0_8px_#47A5FF]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
              Passport Photo Specification
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#A0A4A8]">
            <span className="px-2 py-0.5 rounded-md bg-[#1C1F22] border border-[#4C5055]/60">
              35 × 45 mm (3:4)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#1C1F22] border border-[#4C5055]/60 text-[#FF8F00]">
              Max 10MB
            </span>
          </div>
        </div>

        {/* Content Area: Either Upload State or Photo Preview State */}
        {!value ? (
          <div className="space-y-3">
            {/* Large Upload Drop Zone / Button */}
            <div
              onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed border-[#4C5055]/80 hover:border-[#47A5FF] hover:bg-[#47A5FF]/5 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                disabled || isProcessing ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-[#111317] border border-[#4C5055] group-hover:border-[#47A5FF]/60 flex items-center justify-center mb-3 shadow-[0_4px_20px_rgba(0,0,0,0.6)] group-hover:shadow-[0_0_25px_rgba(71,165,255,0.2)] transition-all">
                {isProcessing ? (
                  <RefreshCw className="w-6 h-6 text-[#47A5FF] animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-[#47A5FF] group-hover:scale-110 transition-transform" />
                )}
              </div>

              <h3 className="text-sm font-semibold text-[#FFFFFF] group-hover:text-[#47A5FF] transition-colors">
                Upload Passport Photo from Files
              </h3>
              <p className="text-xs text-[#A0A4A8] mt-1 max-w-xs">
                Supports JPG, JPEG, PNG (including transparent backgrounds), or WEBP up to 10MB.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Choose Image File</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview State with Passport Ratio & Action Buttons */
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 p-3 sm:p-4 bg-[#0B0C0E] border border-[#4C5055]/50 rounded-2xl">
            {/* Passport Frame Preview (Exact 35:45 ratio with transparency checkerboard background) */}
            <div
              className="relative w-[130px] sm:w-[140px] h-[167px] sm:h-[180px] rounded-xl overflow-hidden border-2 border-[#47A5FF] shadow-[0_0_20px_rgba(71,165,255,0.25)] shrink-0 group"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #1e2229 25%, transparent 25%), linear-gradient(-45deg, #1e2229 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e2229 75%), linear-gradient(-45deg, transparent 75%, #1e2229 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                backgroundColor: '#12151a',
              }}
            >
              <img
                src={value}
                alt="Passport Photo Preview"
                className="w-full h-full object-contain"
              />

              {/* Verified Badge */}
              <div className="absolute top-1.5 right-1.5 bg-emerald-500/90 text-white rounded-full p-1 shadow-md">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>

              {/* Passport dimension tag */}
              <div className="absolute bottom-1 left-1 right-1 bg-black/75 backdrop-blur-xs rounded px-1.5 py-0.5 text-center text-[9px] font-mono text-slate-300">
                Original Asset Preserved
              </div>
            </div>

            {/* Photo Details & Action Controls */}
            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Photo Attached
                  </span>
                  <span className="text-[10px] text-[#A0A4A8]">
                    Ready for Identity Card
                  </span>
                </div>
                <p className="text-xs text-[#A0A4A8] mt-1 leading-relaxed">
                  Original image properties and transparency are preserved intact. You can adjust crop, replace, or remove as needed.
                </p>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
                {/* Crop Photo */}
                <button
                  type="button"
                  onClick={handleOpenCrop}
                  className="py-2 px-1.5 sm:px-2.5 bg-[#14171C] hover:bg-[#1E2228] border border-[#4C5055]/80 hover:border-[#47A5FF]/60 rounded-xl text-[11px] sm:text-xs font-medium text-white flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Crop Photo"
                >
                  <Crop className="w-3.5 h-3.5 text-[#47A5FF] shrink-0" />
                  <span className="truncate">Crop</span>
                </button>

                {/* Replace Photo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-1.5 sm:px-2.5 bg-[#14171C] hover:bg-[#1E2228] border border-[#4C5055]/80 hover:border-[#FF8F00]/60 rounded-xl text-[11px] sm:text-xs font-medium text-white flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Replace with new photo"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#FF8F00] shrink-0" />
                  <span className="truncate">Replace</span>
                </button>

                {/* Remove Photo */}
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="py-2 px-1.5 sm:px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-[11px] sm:text-xs font-medium text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1 sm:gap-1.5 transition-all active:scale-95 cursor-pointer"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Remove</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Friendly Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Interactive Passport Crop Modal */}
      {showCropModal && (rawImageForCrop || value) && (
        <PhotoCropModal
          imageSrc={rawImageForCrop || (value as string)}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropModal(false)}
        />
      )}
    </div>
  );
};
