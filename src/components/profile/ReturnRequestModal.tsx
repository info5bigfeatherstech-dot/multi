import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  Video,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Trash2,
  FileCheck,
  PackageX,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { customerReturnsApi, ReturnReasonType } from '../../api';

export interface ReturnRequestModalProps {
  orderId: string;
  orderTitle?: string;
  onClose: () => void;
  onSuccess: (returnRequest: any) => void;
}

const MAX_FILE_SIZE_BYTES = 60 * 1024 * 1024; // 60MB
const MAX_MESSAGE_CHARS = 500;

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  orderId,
  orderTitle,
  onClose,
  onSuccess,
}) => {
  const [reasonType, setReasonType] = useState<ReturnReasonType>('damaged');
  const [reasonMessage, setReasonMessage] = useState('');
  const [proofVideo, setProofVideo] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Handle Video Selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setErrorCode(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video type
    const validVideoExts = ['.mp4', '.mov', '.webm', '.mkv'];
    const fileNameLower = file.name.toLowerCase();
    const isExtValid = validVideoExts.some((ext) => fileNameLower.endsWith(ext));
    const isMimeValid = file.type.startsWith('video/') || file.type.includes('matroska');

    if (!isExtValid && !isMimeValid) {
      setErrorMessage('Please select a valid video file (.mp4, .mov, .webm, or .mkv)');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`Video size exceeds 60MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please compress or trim.`);
      return;
    }

    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setProofVideo(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setProofVideo(null);
    setVideoPreviewUrl(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  // Handle Images Selection (1-3 images)
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setErrorCode(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = 3 - proofImages.length;
    if (availableSlots <= 0) {
      setErrorMessage('You can upload a maximum of 3 proof images.');
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    const validImgExts = ['.jpg', '.jpeg', '.png', '.webp'];

    const newFiles: File[] = [];
    const newUrls: string[] = [];

    for (const f of selectedFiles) {
      const lower = f.name.toLowerCase();
      const isExtValid = validImgExts.some((ext) => lower.endsWith(ext));
      const isMimeValid = f.type.startsWith('image/');

      if (!isExtValid && !isMimeValid) {
        setErrorMessage('Proof images must be .jpg, .png, or .webp');
        return;
      }

      if (f.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`Image "${f.name}" exceeds 60MB limit.`);
        return;
      }

      newFiles.push(f);
      newUrls.push(URL.createObjectURL(f));
    }

    setProofImages((prev) => [...prev, ...newFiles]);
    setImagePreviewUrls((prev) => [...prev, ...newUrls]);

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const urlToRemove = imagePreviewUrls[index];
    if (urlToRemove) {
      URL.revokeObjectURL(urlToRemove);
    }
    setProofImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorCode(null);

    // Front validations
    if (!reasonType) {
      setErrorMessage('Please select a return reason (Damaged or Wrong item).');
      return;
    }

    if (!reasonMessage.trim()) {
      setErrorMessage('Please provide a description of the issue.');
      return;
    }

    if (reasonMessage.trim().length > MAX_MESSAGE_CHARS) {
      setErrorMessage(`Description cannot exceed ${MAX_MESSAGE_CHARS} characters.`);
      return;
    }

    if (!proofVideo) {
      setErrorMessage('Please upload 1 open box video of the item (open box video only).');
      return;
    }

    if (proofImages.length < 1) {
      setErrorMessage('Please upload at least 1 proof photo of the item (max 3 images).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customerReturnsApi.createReturnRequest(orderId, {
        reasonType,
        reasonMessage: reasonMessage.trim(),
        proofVideo,
        proofImages,
      });

      if (res?.success) {
        onSuccess(res.returnRequest || { orderId, status: 'requested', reasonType, requestedAt: new Date().toISOString() });
      } else {
        throw new Error(res?.message || 'Failed to submit return request.');
      }
    } catch (err: any) {
      console.error('Error submitting return request:', err);
      const code = err.code || err.response?.data?.code;
      const msg = err.message || err.response?.data?.message || 'Could not submit return request.';
      setErrorCode(code || null);

      // Map backend error codes to clear user-friendly guidance
      if (code === 'RETURN_NOT_ELIGIBLE') {
        setErrorMessage('This order is not eligible for return. Orders must be marked as delivered.');
      } else if (code === 'RETURN_REQUEST_EXISTS') {
        setErrorMessage('A return request is already open for this order.');
      } else if (code === 'RETURN_WINDOW_EXPIRED') {
        setErrorMessage('The return window for this order has expired.');
      } else if (code === 'RETURN_REASON_INVALID') {
        setErrorMessage('Invalid return reason. Please choose damaged or wrong item.');
      } else if (code === 'RETURN_MESSAGE_REQUIRED') {
        setErrorMessage('Please enter an issue description.');
      } else if (code === 'RETURN_PROOF_REQUIRED') {
        setErrorMessage('Both 1 video and at least 1 image proof are mandatory.');
      } else if (code === 'RETURN_PROOF_INVALID') {
        setErrorMessage('Proof file format or size invalid. Max 60MB per file.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-linear-to-r from-orange-50/60 via-white to-amber-50/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
              <PackageX className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base sm:text-lg font-black text-navy leading-snug tracking-tight">
                Raise Return Request
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                <span className="font-mono font-semibold text-slate-700">Order #{orderId}</span>
                {orderTitle && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium truncate max-w-[240px] sm:max-w-md">
                      {orderTitle}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">{errorMessage}</p>
                {errorCode && (
                  <p className="text-[10px] text-rose-500 font-mono mt-0.5">Code: {errorCode}</p>
                )}
              </div>
            </div>
          )}

          {/* 1. Reason Selection Dropdown (shadcn UI) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
              1. Reason for Return <span className="text-rose-500">*</span>
            </label>
            <Select
              value={reasonType}
              onValueChange={(val) => setReasonType(val as ReturnReasonType)}
            >
              <SelectTrigger className="w-full h-11 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-navy focus:border-[#A44101] focus:ring-2 focus:ring-[#A44101]/20 shadow-2xs">
                <SelectValue placeholder="Select reason for return" />
              </SelectTrigger>
              <SelectContent className="z-[100000] rounded-2xl border border-slate-200 shadow-xl p-1.5 bg-white">
                <SelectItem value="damaged" className="text-xs py-2.5 rounded-xl cursor-pointer">
                  Damaged Item (Broken, leaked, scratched, or unusable)
                </SelectItem>
                <SelectItem value="wrong_item" className="text-xs py-2.5 rounded-xl cursor-pointer">
                  Wrong Item Delivered (Incorrect item, wrong color, variant, or size)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-500 pl-1">
              {reasonType === 'damaged'
                ? 'Product arrived broken, leaked, scratched, or unusable.'
                : 'Received an incorrect item, wrong color, variant, or size.'}
            </p>
          </div>

          {/* 2. Issue Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                2. Issue Description <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  reasonMessage.length > MAX_MESSAGE_CHARS ? 'text-rose-600 font-bold' : 'text-slate-400'
                }`}
              >
                {reasonMessage.length} / {MAX_MESSAGE_CHARS}
              </span>
            </div>
            <textarea
              rows={3}
              value={reasonMessage}
              maxLength={MAX_MESSAGE_CHARS}
              onChange={(e) => setReasonMessage(e.target.value)}
              placeholder="Please describe the defect or issue in detail (e.g. package torn, missing parts, different color)..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs text-navy focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all resize-none"
            />
          </div>

          {/* 3. Open Box Video (1 video, max 60MB) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-[#A44101]" />
                <span>3. Open Box Video <span className="text-rose-500">*</span> (Open box video only, max ~60MB)</span>
              </label>
              <span className="text-[10px] text-slate-400">mp4, mov, webm, mkv</span>
            </div>

            {proofVideo && videoPreviewUrl ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                <video
                  src={videoPreviewUrl}
                  controls
                  className="w-full sm:w-44 h-28 object-cover rounded-xl bg-black shadow-2xs"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-navy truncate">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{proofVideo.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Size: {(proofVideo.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 transition-colors pt-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Video</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#A44101] rounded-2xl p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-orange-50/20 transition-all group"
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-orange-100 text-[#A44101] flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-navy">Click to upload open box video</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Open box video only • Max 60MB • MP4, MOV, WEBM, MKV</p>
              </div>
            )}
          </div>

          {/* 4. Proof Photos (1-3 images, max 60MB each) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#A44101]" />
                <span>4. Proof Photos <span className="text-rose-500">*</span> (1 to 3 images)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {proofImages.length} / 3 uploaded
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {imagePreviewUrls.map((url, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                  <img src={url} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                    {(proofImages[idx]?.size / (1024 * 1024)).toFixed(1)}MB
                  </span>
                </div>
              ))}

              {proofImages.length < 3 && (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#A44101] rounded-2xl aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer bg-slate-50/50 hover:bg-orange-50/20 transition-all group"
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    onChange={handleImagesChange}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#A44101] transition-colors mb-1" />
                  <span className="text-[11px] font-bold text-navy">Add Photo</span>
                  <span className="text-[9px] text-slate-400">JPG/PNG/WEBP</span>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <span>Submit Return Request</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReturnRequestModal;

