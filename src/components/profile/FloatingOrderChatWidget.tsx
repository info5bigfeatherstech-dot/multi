import React from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  X,
  Minus,
  Headphones,
} from 'lucide-react';
import { ReturnChatView } from './ReturnChatView';

export interface FloatingOrderChatWidgetProps {
  orderId: string;
  orderStatus?: string;
  returnInfo?: any;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenReturnModal?: () => void;
}

export const FloatingOrderChatWidget: React.FC<FloatingOrderChatWidgetProps> = ({
  orderId,
  orderStatus,
  returnInfo,
  isOpen,
  onToggle,
  onClose,
  onOpenReturnModal,
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* 1. FLOATING ACTION PILL (ALWAYS VISIBLE WHEN CHATBOX IS CLOSED) */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-[9990] px-4 py-3 bg-[#A44101] hover:bg-[#8C3701] text-white rounded-full shadow-2xl flex items-center gap-2.5 font-bold text-xs cursor-pointer group hover:scale-105 active:scale-95 transition-all border-2 border-white/20 animate-fadeIn"
          title="Open direct chat with store support & admin"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <MessageSquare className="w-4 h-4 stroke-[2.4]" />
          <span>Chat with Admin</span>
        </button>
      )}

      {/* 2. FLOATING CHATBOX WINDOW */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9995] w-[94vw] sm:w-[410px] h-[540px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-5 py-3.5 bg-linear-to-r from-orange-50 via-white to-amber-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#A44101] text-white flex items-center justify-center shadow-xs">
                <Headphones className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-navy leading-tight">Store Support Desk</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  <span className="font-mono text-slate-600">Order #{orderId}</span> • Live Support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy cursor-pointer transition-colors"
                title="Minimize chatbox"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-navy cursor-pointer transition-colors"
                title="Close chatbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div className="flex-1 overflow-hidden">
            <ReturnChatView
              orderId={orderId}
              orderStatus={orderStatus}
              chatWindowDeadline={returnInfo?.chatWindowDeadline}
              isChatActive={returnInfo?.isChatActive}
              onOpenReturnModal={onOpenReturnModal}
            />
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default FloatingOrderChatWidget;

