export type ShippingSpeed = 'standard' | 'same_day';

export interface SameDayOption {
  available: boolean;
  deliveryCharges: number | null;
  etaLabel: string | null;
  openHour: number | null;
  cutoffHour: number | null;
  courierName: string | null;
  reason: string | null;
}

export interface StandardDeliverySettings {
  enabled: boolean;
  ready?: boolean;
}

export interface SameDaySettings {
  enabled: boolean;
  pincodes: string[];
  openHour: number;
  cutoffHour: number;
  floorFeeInr: number;
  feeBuffer: number;
  warehouseLat: number | null;
  warehouseLng: number | null;
  pincodeCount?: number;
  pincodeRestricted?: boolean;
  ready?: boolean;
}

export const DEFAULT_SAME_DAY_OPTION: SameDayOption = {
  available: false,
  deliveryCharges: null,
  etaLabel: null,
  openHour: 9,
  cutoffHour: 14,
  courierName: null,
  reason: null,
};

export function normalizeShippingSpeed(value: unknown): ShippingSpeed {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (raw === 'same_day' || raw === 'sameday' || raw === 'quick') return 'same_day';
  return 'standard';
}

export function formatCutoffLabel(hour: number | null | undefined): string {
  const h = Number(hour);
  if (!Number.isFinite(h) || h < 0 || h > 23) return '14:00';
  return `${String(Math.trunc(h)).padStart(2, '0')}:00`;
}

export function formatHourLabel(hour: number | null | undefined, fallback = 9): string {
  const n = Number(hour);
  const h = Number.isFinite(n) && n >= 0 && n <= 23 ? Math.trunc(n) : fallback;
  return `${String(h).padStart(2, '0')}:00`;
}
