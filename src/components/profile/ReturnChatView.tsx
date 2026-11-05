import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Loader2,
  RefreshCw,
  Clock,
  AlertCircle,
  Headphones,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { customerReturnsApi, ReturnChatMessage } from '../../api';

export interface ReturnChatViewProps {
  orderId: string;
  orderStatus?: string;
  initialChat?: ReturnChatMessage[];
  chatWindowDeadline?: string;
  isChatActive?: boolean;
  onOpenReturnModal?: () => void;
}

export const ReturnChatView: React.FC<ReturnChatViewProps> = ({
  orderId,
  orderStatus,
  initialChat,
  chatWindowDeadline: propDeadline,
  isChatActive: propIsActive,
  onOpenReturnModal,
}) => {
  const welcomeMessage: ReturnChatMessage & { showReturnAction?: boolean } = {
    sender: 'admin',
    message: `Hello! 👋 Welcome to Apna Bharat Support. How can we help you today with Order #${orderId}?`,
    createdAt: new Date().toISOString(),
  };

  const [messages, setMessages] = useState<Array<ReturnChatMessage & { showReturnAction?: boolean }>>(
    initialChat && initialChat.length > 0 ? initialChat : [welcomeMessage]
  );
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(!initialChat);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<string | null>(propDeadline || null);
  const [isActive, setIsActive] = useState<boolean>(propIsActive ?? true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChat = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    setErrorNotice(null);

    try {
      const res = await customerReturnsApi.getReturnChat(orderId);
      if (res?.success) {
        const msgs = Array.isArray(res.chat) ? res.chat : [];
        if (msgs.length > 0) {
          setMessages(msgs);
        }
        if (res.chatWindowDeadline) setDeadline(res.chatWindowDeadline);
        if (typeof res.isChatActive === 'boolean') setIsActive(res.isChatActive);
      }
    } catch (err: any) {
      console.warn('Failed to load return chat:', err);
      const code = err.code || err.response?.data?.code;
      if (code === 'CHAT_WINDOW_EXPIRED') {
        setErrorNotice('Chat window has expired for this return request.');
        setIsActive(false);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    if (!isActive) {
      setErrorNotice('The return support chat window is closed for this order.');
      return;
    }

    const sendingText = newMessage.trim();
    const userMsg: ReturnChatMessage = {
      sender: 'user',
      message: sendingText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessage('');
    setIsSending(true);
    setErrorNotice(null);

    try {
      const res = await customerReturnsApi.sendReturnChat(orderId, sendingText);
      if (res?.success) {
        const msgs = Array.isArray(res.chat) ? res.chat : [];
        setMessages(msgs);
        if (res.chatWindowDeadline) setDeadline(res.chatWindowDeadline);
        if (typeof res.isChatActive === 'boolean') setIsActive(res.isChatActive);
      }
    } catch (err: any) {
      const code = err.code || err.response?.data?.code;
      if (code === 'RETURN_NOT_REQUESTED') {
        // Helpful interactive response in the chat
        setMessages((prev) => [
          ...prev,
          {
            sender: 'admin',
            message: `Thank you for your message regarding Order #${orderId} (${orderStatus || 'Shipped'})! Our resolution team has noted your query. If you have received a damaged or incorrect product and want to submit photos & open box video for a return/refund, you can tap below:`,
            createdAt: new Date().toISOString(),
            showReturnAction: true,
          },
        ]);
      } else if (code === 'CHAT_WINDOW_EXPIRED') {
        setErrorNotice('Chat window has expired. Support messages can no longer be sent.');
        setIsActive(false);
      } else if (code === 'MESSAGE_REQUIRED') {
        setErrorNotice('Please type a message before sending.');
      } else {
        const msg = err.message || err.response?.data?.message || 'Failed to deliver message.';
        setErrorNotice(msg);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-[460px]">
      {/* Chat Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center">
            <Headphones className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-navy flex items-center gap-1.5 leading-tight">
              <span>Return Support Desk</span>
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </h4>
            <p className="text-[11px] text-slate-500">
              Direct conversation with merchant resolution team
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchChat(true)}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-500 text-xs transition-all cursor-pointer flex items-center gap-1"
          title="Refresh Messages"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#A44101]' : ''}`} />
          <span className="hidden sm:inline text-[11px] font-bold">Sync</span>
        </button>
      </div>

      {/* Deadline / Active Status Bar */}
      {deadline && (
        <div className="px-5 py-2 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-[11px] text-amber-900">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>Chat Window Deadline:</span>
            <strong className="font-mono">
              {new Date(deadline).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </strong>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
              isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isActive ? 'Chat Open' : 'Chat Expired'}
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-stone-50/40">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#A44101]" />
            <p className="text-xs">Connecting to support desk...</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user' || msg.senderType === 'user';
            const displayTime = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={idx}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1 animate-fadeIn`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-xs shadow-2xs ${
                    isUser
                      ? 'bg-[#A44101] text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-navy rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message || msg.text}</p>
                  {msg.showReturnAction && onOpenReturnModal && (
                    <button
                      type="button"
                      onClick={onOpenReturnModal}
                      className="mt-2.5 w-full py-2 px-3 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Attach Proofs for Return Claim</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 px-1">
                  <span>{isUser ? 'You' : 'Store Resolution Agent'}</span>
                  {displayTime && (
                    <>
                      <span>•</span>
                      <span>{displayTime}</span>
                    </>
                  )}
                  {isUser && <CheckCheck className="w-3 h-3 text-[#A44101]" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error alert if any */}
      {errorNotice && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            disabled={!isActive || isSending}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              isActive
                ? 'Type your message to store support & admin...'
                : 'Chat window is closed for this order'
            }
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#A44101] disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            type="submit"
            disabled={!isActive || isSending || !newMessage.trim()}
            className="px-4 py-2 rounded-xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-2xs"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReturnChatView;

