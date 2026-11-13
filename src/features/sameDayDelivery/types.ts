/** Simple Same Day Delivery (not Shiprocket Quick). */
export type DeliveryMode = 'standard' | 'same_day';

/** @deprecated Prefer DeliveryMode — kept for gradual checkout migration. */
export type ShippingSpeed = DeliveryMode;

export interface SameDaySettings {
  enabled: boolean;
  pincodes: string[];
  pincodeCount?: number;
  ready?: boolean;
}

export interface StandardDeliverySettings {
  enabled: boolean;
  ready?: boolean;
}

export interface SameDayEligibility {
  eligible: boolean;
  enabled: boolean;
  pincode?: string | null;
  reason?: string | null;
}

export interface SameDayQuoteResult {
  quoteId: string;
  deliveryMode: 'same_day';
  isDeliverable: boolean;
  codAvailable: boolean;
  advanceAvailable: boolean;
  pincode?: string | null;
  itemCount?: number;
  itemsSubtotal?: number;
  promotionDiscount?: number;
  deliveryCharges: number;
  taxes?: number;
  amountPayable?: number;
  includesShippingAndHandling?: boolean;
  couponApplied?: boolean;
  quoteExpiresAt?: string;
  cartFingerprint?: string;
  paymentMethod?: 'online' | string;
  paymentPlan?: 'full' | string;
}

export interface SameDayConfirmResult {
  quoteId: string;
  deliveryMode: 'same_day';
  validated: boolean;
  paymentMethod?: 'online' | string;
  paymentPlan?: 'full' | string;
  totals?: {
    itemCount?: number;
    itemsSubtotal?: number;
    promotionDiscount?: number;
    deliveryCharges?: number;
    taxes?: number;
    amountPayable?: number;
  };
  next?: {
    createOrderEndpoint?: string;
    payload?: Record<string, unknown>;
  };
}

/** UI option card for checkout (derived from eligibility + quote). */
export interface SameDayOption {
  available: boolean;
  deliveryCharges: number | null;
  etaLabel: string | null;
  reason: string | null;
}

export const DEFAULT_SAME_DAY_OPTION: SameDayOption = {
  available: false,
  deliveryCharges: 0,
  etaLabel: 'Same day',
  reason: null,
};

export function normalizeDeliveryMode(value: unknown): DeliveryMode {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (raw === 'same_day' || raw === 'sameday') return 'same_day';
  return 'standard';
}

/** @deprecated Prefer normalizeDeliveryMode */
export function normalizeShippingSpeed(value: unknown): ShippingSpeed {
  return normalizeDeliveryMode(value);
}

export function isSameDayOrderRecord(order: any): boolean {
  if (!order || typeof order !== 'object') return false;
  if (order.fulfillmentMode === 'same_day' || order.enquiryType === 'same_day') return true;
  if (order.deliveryMode === 'same_day') return true;
  if (order.sameDay && typeof order.sameDay === 'object') return true;
  return false;
}
