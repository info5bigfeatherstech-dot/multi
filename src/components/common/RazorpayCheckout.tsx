import { loadRazorpayScript } from '../../api';

export interface RazorpayPaymentOptions {
  key: string;
  amount: number; // in paise
  currency?: string;
  name?: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
}

export async function openRazorpayCheckout(options: RazorpayPaymentOptions): Promise<boolean> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || typeof (window as any).Razorpay === 'undefined') {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  const rzpOptions = {
    key: options.key,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: options.name || 'Apna Bharat Bazaar Dropship',
    description: options.description || 'Prepaid Order Payment',
    order_id: options.order_id,
    prefill: options.prefill || {},
    notes: options.notes || {},
    theme: {
      color: options.theme?.color || '#A44101',
    },
    handler: options.handler,
    modal: {
      ondismiss: () => {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    },
  };

  const rzpInstance = new (window as any).Razorpay(rzpOptions);
  rzpInstance.open();
  return true;
}

