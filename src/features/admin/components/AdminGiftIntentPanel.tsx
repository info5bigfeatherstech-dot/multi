import React, { useState } from 'react';
import { 
  Gift, 
  User, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  MessageSquare
} from 'lucide-react';
import { AdminOrder, GiftIntentPayload, mockAdminStore } from '../mockAdminStore';

interface AdminGiftIntentPanelProps {
  order: AdminOrder;
  onUpdate?: () => void;
}

const OCCASIONS = [
  'Birthday 🎂',
  'Anniversary 💍',
  'Festival 🪔',
  'Custom 🎁'
];

export const AdminGiftIntentPanel: React.FC<AdminGiftIntentPanelProps> = ({
  order,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [recipientName, setRecipientName] = useState(
    order.giftIntent?.recipientName || ''
  );
  const [senderName, setSenderName] = useState(
    order.giftIntent?.senderName || order.customerName || ''
  );
  const [occasion, setOccasion] = useState(
    order.giftIntent?.occasion || 'Birthday 🎂'
  );
  const [giftMessage, setGiftMessage] = useState(
    order.giftIntent?.giftMessage || ''
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  const handleStartEdit = () => {
    setRecipientName(order.giftIntent?.recipientName || '');
    setSenderName(order.giftIntent?.senderName || order.customerName || '');
    setOccasion(order.giftIntent?.occasion || 'Birthday 🎂');
    setGiftMessage(order.giftIntent?.giftMessage || '');
    setIsEditing(true);
  };

  const handleStartAdd = () => {
    setRecipientName('');
    setSenderName(order.customerName || '');
    setOccasion('Birthday 🎂');
    setGiftMessage('Warm wishes & congratulations on this special day! Enjoy your gift!');
    setIsAddingGift(true);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsAddingGift(false);
  };

  const handleSave = () => {
    if (!recipientName.trim()) {
      alert('Please enter a recipient name.');
      return;
    }

    const payload: Partial<GiftIntentPayload> = {
      isGift: true,
      recipientName: recipientName.trim(),
      senderName: senderName.trim() || order.customerName,
      occasion,
      giftMessage: giftMessage.trim(),
    };

    const success = mockAdminStore.updateGiftIntent(order.id, payload);
    if (success) {
      setIsEditing(false);
      setIsAddingGift(false);
      showFeedback('Gift details updated successfully! ✓');
      if (onUpdate) onUpdate();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to remove the gift intent? This order will be reverted to a regular order.')) {
      const success = mockAdminStore.deleteGiftIntent(order.id);
      if (success) {
        setIsEditing(false);
        setIsAddingGift(false);
        showFeedback('Gift intent deleted. Order is now regular. ✓');
        if (onUpdate) onUpdate();
      }
    }
  };

  // --------------------------------------------------------------------------
  // Regular (Non-Gift) Order View
  // --------------------------------------------------------------------------
  if (!order.isGiftOrder && !isAddingGift) {
    return (
      <div className="bg-stone-50/70 border border-slate-200/90 rounded-xl p-4 sm:p-5 relative transition-all">
        {feedbackMsg && (
          <div className="absolute top-2 right-3 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fadeIn">
            {feedbackMsg}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Order Type
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  For Myself (Regular)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                This order was placed for personal delivery to <strong>{order.customerName}</strong>. No custom gift card message is attached.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-amber-300 hover:border-[#A44101] text-[#A44101] hover:bg-amber-50/50 text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            <Gift className="w-4 h-4 text-[#A44101]" />
            <span>Add Gift Intent</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Edit Form Mode
  // --------------------------------------------------------------------------
  if (isEditing) {
    return (
      <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 border-2 border-amber-300/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 relative transition-all animate-fadeIn">
        <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2 text-navy font-bold text-sm">
            <Gift className="w-4 h-4 text-[#A44101]" />
            <span>{isAddingGift ? 'Attach Gift Intent to Order' : 'Edit Gift Order Details'}</span>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Recipient Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Rohan Sharma"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:outline-none"
            />
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sender Name (From)
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:outline-none"
            />
          </div>
        </div>

        {/* Occasion Chips */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Select Occasion
          </label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((occ) => {
              const selected = occasion === occ;
              return (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccasion(occ)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    selected
                      ? 'bg-[#A44101] text-white border-[#A44101] shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {occ}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gift Message Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Gift Card Message (Included on printed insert)
            </label>
            <span className={`text-[11px] font-bold ${giftMessage.length > 950 ? 'text-rose-600' : 'text-slate-400'}`}>
              {giftMessage.length} / 1000 characters
            </span>
          </div>
          <textarea
            value={giftMessage}
            onChange={(e) => setGiftMessage(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Write the personalized message to be printed inside the package..."
            className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs sm:text-sm text-navy focus:border-[#A44101] focus:outline-none"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-amber-200/60">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#A44101] hover:bg-[#8C3701] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Gift Intent</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Active Gift View Mode (Displaying Gift Card)
  // --------------------------------------------------------------------------
  const gift = order.giftIntent;

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border-2 border-amber-200/90 rounded-xl p-4 sm:p-5 relative shadow-2xs transition-all">
      {feedbackMsg && (
        <div className="absolute top-2 right-3 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fadeIn z-10">
          {feedbackMsg}
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 pb-3 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#A44101]/10 text-[#A44101] flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#A44101]">
                Verified Gift Order
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300">
                {gift?.occasion || 'Special Gift'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Personalized blind packaging &amp; gift card included
            </p>
          </div>
        </div>

        {/* Actions Button Group */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-navy hover:text-[#A44101] hover:border-[#A44101] text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Remove gift intent"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        </div>
      </div>

      {/* Key Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5 text-xs">
        <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Recipient (Deliver To)
          </span>
          <p className="font-extrabold text-navy text-sm mt-0.5">
            {gift?.recipientName || order.customerName}
          </p>
        </div>

        <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/50">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Sender (From)
          </span>
          <p className="font-extrabold text-navy text-sm mt-0.5">
            {gift?.senderName || order.customerName}
          </p>
        </div>
      </div>

      {/* Gift Card Printed Message Box */}
      <div className="bg-white rounded-xl p-3.5 border border-amber-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
          <span className="flex items-center gap-1.5 text-[#A44101]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Gift Card Printed Message:</span>
          </span>
          <span className="text-slate-400 text-[10px]">
            {gift?.giftMessage?.length || 0} chars
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-[#A44101]">
          "{gift?.giftMessage || 'No personalized message provided.'}"
        </p>
      </div>
    </div>
  );
};

export default AdminGiftIntentPanel;
