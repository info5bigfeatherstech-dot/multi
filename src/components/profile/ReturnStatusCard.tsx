import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  MessageSquare,
  Copy,
  Check,
  Video,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ReturnChatView } from './ReturnChatView';

export interface ReturnStatusCardProps {
  orderId: string;
  returnInfo: any;
  onRefresh?: () => void;
}

export const ReturnStatusCard: React.FC<ReturnStatusCardProps> = ({
  orderId,
  returnInfo,
  onRefresh,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<{ kind: 'image' | 'video'; url: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!returnInfo) return null;

  const status = String(returnInfo.status || 'requested').toLowerCase();
  const reasonType = returnInfo.reasonType || 'damaged';
  const reasonMessage = returnInfo.reasonMessage || returnInfo.refundContext || '';
  const requestedAt = returnInfo.requestedAt || returnInfo.createdAt;
  const decisionReason = returnInfo.decisionReason;
  const reverseAwb = returnInfo.reverseAwb || returnInfo.reverseTrackingNumber || returnInfo.awb;
  const reverseCarrier = returnInfo.reverseCarrier || returnInfo.carrier || 'Logistics Partner';
  const chatWindowDeadline = returnInfo.chatWindowDeadline;
  const isChatActive = returnInfo.isChatActive;

  // Extract Proofs
  const proofs: Array<{ kind: 'image' | 'video'; url: string }> = [];
  if (returnInfo.proofVideo) {
    proofs.push({
      kind: 'video',
      url: typeof returnInfo.proofVideo === 'string' ? returnInfo.proofVideo : returnInfo.proofVideo.url,
    });
  }
  if (Array.isArray(returnInfo.proofImages)) {
    returnInfo.proofImages.forEach((img: any) => {
      proofs.push({
        kind: 'image',
        url: typeof img === 'string' ? img : img.url,
      });
    });
  }
  if (Array.isArray(returnInfo.proofs)) {
    returnInfo.proofs.forEach((p: any) => {
      if (typeof p === 'string') {
        const isVid = p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.mov') || p.endsWith('.mkv') || p.includes('/video/');
        proofs.push({ kind: isVid ? 'video' : 'image', url: p });
      } else if (p && typeof p === 'object') {
        proofs.push({ kind: p.kind === 'video' ? 'video' : 'image', url: p.url });
      }
    });
  }

  // Handle Copy
  const handleCopy = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // fallback
    }
  };

  // Status Styling Configuration
  let statusBadge = {
    label: 'Return Requested',
    desc: 'Your request is under merchant evaluation. We typically review within 24-48 hours.',
    style: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: <Clock className="w-5 h-5 text-amber-600" />,
  };

  if (status === 'approved') {
    statusBadge = {
      label: 'Return Approved',
      desc: 'Return approved! A doorstep reverse pickup has been scheduled.',
      style: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: <CheckCircle2 className="w-5 h-5 text-indigo-600" />,
    };
  } else if (status === 'refunded') {
    statusBadge = {
      label: 'Refund Completed',
      desc: 'Product inspected & refund has been successfully credited to your source account.',
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    };
  } else if (status === 'rejected') {
    statusBadge = {
      label: 'Return Rejected',
      desc: 'The merchant has rejected this return request after inspection of submitted proofs.',
      style: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-600" />,
    };
  } else if (status === 'approval_failed') {
    statusBadge = {
      label: 'Approval Processing',
      desc: 'Merchant accepted return. Courier reverse pickup assignment is underway.',
      style: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    };
  } else if (status.includes('transit') || status.includes('pickup')) {
    statusBadge = {
      label: 'Reverse Pickup In Motion',
      desc: 'Courier executive assigned. Package is on its way to the warehouse.',
      style: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: <Truck className="w-5 h-5 text-blue-600" />,
    };
  } else if (status === 'received' || status === 'qc_passed') {
    statusBadge = {
      label: 'Package Received at Warehouse',
      desc: 'Undergoing quality check before automated refund initiation.',
      style: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: <CheckCircle2 className="w-5 h-5 text-teal-600" />,
    };
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-100/70 text-[#A44101] shrink-0">
            <RotateCcw className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#A44101]">
                Product Return Status
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.style}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{statusBadge.desc}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Refresh Return Status"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#A44101]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowChat((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              showChat
                ? 'bg-[#A44101] text-white shadow-xs'
                : 'border border-slate-200 bg-white hover:bg-slate-50 text-navy'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{showChat ? 'Hide Support Chat' : 'Return Support Chat'}</span>
            {showChat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Return Claim Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Column: Reason and Description */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Claim Reason:</span>
            <span className="font-bold text-navy capitalize bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
              {reasonType.replace('_', ' ')}
            </span>
          </div>

          {requestedAt && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Requested On:</span>
              <span className="font-mono text-slate-700">
                {new Date(requestedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}

          {reasonMessage && (
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium block mb-1">Issue Description:</span>
              <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200/70 text-[11px] leading-relaxed">
                "{reasonMessage}"
              </p>
            </div>
          )}

          {decisionReason && (
            <div className="pt-2 border-t border-rose-100">
              <span className="text-rose-600 font-bold block mb-1">Merchant Decision Note:</span>
              <p className="text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-[11px] leading-relaxed">
                {decisionReason}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Reverse Logistics Tracking if Approved */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#A44101]" />
              <span>Reverse Pickup:</span>
            </span>
            <span className="font-bold text-navy capitalize">{status}</span>
          </div>

          {reverseAwb ? (
            <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Reverse Courier:</span>
                <span className="font-bold text-navy">{reverseCarrier}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Pickup AWB:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-800">
                  <span>{reverseAwb}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(reverseAwb, 'reverse-awb')}
                    className="p-0.5 hover:text-[#A44101] cursor-pointer"
                    title="Copy reverse tracking number"
                  >
                    {copiedKey === 'reverse-awb' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/70">
              {status === 'requested'
                ? 'AWB & pickup executive details will appear here once the return is approved by the merchant team.'
                : status === 'rejected'
                ? 'No reverse pickup generated.'
                : 'Awaiting reverse courier allocation.'}
            </div>
          )}

          {/* Attached Proofs Thumbnails */}
          {proofs.length > 0 && (
            <div className="pt-2 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium block mb-1.5">Submitted Proofs ({proofs.length}):</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {proofs.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveMediaModal(p)}
                    className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:border-[#A44101] transition-all group shadow-2xs"
                    title="Click to view full preview"
                  >
                    {p.kind === 'video' ? (
                      <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center">
                        <Video className="w-5 h-5 text-amber-400" />
                      </div>
                    ) : (
                      <img src={p.url} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center uppercase py-0.5 font-bold">
                      {p.kind}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Expandable Return Support Chat */}
      {showChat && (
        <div className="pt-2 animate-fadeIn">
          <ReturnChatView
            orderId={orderId}
            chatWindowDeadline={chatWindowDeadline}
            isChatActive={isChatActive}
          />
        </div>
      )}

      {/* 4. Fullscreen Media Modal */}
      {activeMediaModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="relative max-w-3xl w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveMediaModal(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-white/20 hover:bg-white/40 text-white rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 flex items-center justify-center min-h-[300px]">
              {activeMediaModal.kind === 'video' ? (
                <video src={activeMediaModal.url} controls autoPlay className="max-h-[70vh] w-full rounded-2xl" />
              ) : (
                <img src={activeMediaModal.url} alt="Proof Fullscreen" className="max-h-[70vh] w-auto object-contain rounded-2xl" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReturnStatusCard;
