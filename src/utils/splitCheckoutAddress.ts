/** Mirrors backend addressValidation house / line / courier combined caps. */
export const CHECKOUT_HOUSE_MAX = 80;
export const CHECKOUT_LINE1_MIN = 10;
export const CHECKOUT_LINE1_MAX = 200;
export const CHECKOUT_AREA_MAX = 120;
export const CHECKOUT_BUILDING_MAX = 150;
export const CHECKOUT_FLOOR_MAX = 80;
export const CHECKOUT_LANDMARK_MAX = 150;
export const CHECKOUT_COMBINED_STREET_MAX = 190;

const PIN_ZONE_STATE: Record<string, string> = {
  '1': 'Delhi',
  '2': 'Uttar Pradesh',
  '3': 'Rajasthan',
  '4': 'Maharashtra',
  '5': 'Karnataka',
  '6': 'Tamil Nadu',
  '7': 'West Bengal',
  '8': 'Bihar',
};

const CITY_STATE: Record<string, string> = {
  thane: 'Maharashtra',
  mumbai: 'Maharashtra',
  pune: 'Maharashtra',
  navi: 'Maharashtra',
  kalyan: 'Maharashtra',
  dombivli: 'Maharashtra',
  ambernath: 'Maharashtra',
  nashik: 'Maharashtra',
  nagpur: 'Maharashtra',
  delhi: 'Delhi',
  new: 'Delhi',
  gurgaon: 'Haryana',
  gurugram: 'Haryana',
  noida: 'Uttar Pradesh',
  bengaluru: 'Karnataka',
  bangalore: 'Karnataka',
};

function trimStr(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function clamp(value: string, max: number): string {
  if (!value) return '';
  if (value.length <= max) return value;
  return value.slice(0, max).trim();
}

export function inferIndianState(state: unknown, city: unknown, blob: unknown, pin: unknown): string {
  const explicit = trimStr(state);
  if (explicit) return explicit;
  const hay = `${trimStr(city)} ${trimStr(blob)}`.toLowerCase();
  if (/\bmaharashtra\b|\bmh\b/.test(hay)) return 'Maharashtra';
  if (/\bdelhi\b|\bncr\b/.test(hay)) return 'Delhi';
  if (/\bkarnataka\b/.test(hay)) return 'Karnataka';
  if (/\btamil\s*nadu\b/.test(hay)) return 'Tamil Nadu';
  if (/\bwest\s*bengal\b/.test(hay)) return 'West Bengal';
  if (/\bharyana\b/.test(hay)) return 'Haryana';
  if (/\bgujarat\b/.test(hay)) return 'Gujarat';
  const cityKey = trimStr(city).toLowerCase().split(/[\s,]+/)[0] || '';
  if (cityKey && CITY_STATE[cityKey]) return CITY_STATE[cityKey];
  const pinDigit = String(pin || '').replace(/\D/g, '').charAt(0);
  return PIN_ZONE_STATE[pinDigit] || '';
}

export interface CheckoutAddressDraft {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  pincode?: string;
  type?: string;
  houseNumber?: string;
  houseFlat?: string;
  area?: string;
  areaLocality?: string;
  addressLine1?: string;
  streetLine1?: string;
  addressLine2?: string;
  streetLine2?: string;
  building?: string;
  buildingNo?: string;
  floor?: string;
  floorNo?: string;
  landmark?: string;
  state?: string;
}

export interface CheckoutAddressApiPayload {
  fullName: string;
  phone: string;
  houseNumber: string;
  building: string;
  floor: string;
  area: string;
  landmark: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  state: string;
  type: 'Home' | 'Work' | 'Other';
  addressType: 'home' | 'work' | 'other';
  isDefault: boolean;
}

function composedStreetLength(p: {
  houseNumber: string;
  building: string;
  floor: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  landmark: string;
}): number {
  const line1 = [p.houseNumber, p.building, p.floor, p.addressLine1].filter(Boolean).join(', ');
  const line2 = [p.addressLine2, p.area, p.landmark].filter(Boolean).join(', ');
  return line1.length + line2.length;
}

function shrinkToCourierCap(p: {
  houseNumber: string;
  building: string;
  floor: string;
  addressLine1: string;
  addressLine2: string;
  area: string;
  landmark: string;
}) {
  const next = { ...p };
  const trimField = (key: keyof typeof next, minKeep = 0) => {
    if (composedStreetLength(next) <= CHECKOUT_COMBINED_STREET_MAX) return;
    if (!next[key] || next[key].length <= minKeep) return;
    const overflow = composedStreetLength(next) - CHECKOUT_COMBINED_STREET_MAX;
    const allow = Math.max(minKeep, next[key].length - overflow);
    next[key] = clamp(next[key], allow);
  };
  trimField('addressLine2');
  trimField('landmark');
  trimField('building');
  trimField('floor');
  trimField('addressLine1', CHECKOUT_LINE1_MIN);
  return next;
}

/**
 * Split a checkout/localStorage address into courier-safe API fields.
 * Never dumps the full street blob into houseNumber.
 */
export function buildAddressCreatePayload(addr: CheckoutAddressDraft): CheckoutAddressApiPayload {
  const blob = trimStr(addr.address);
  const city = trimStr(addr.city);
  const postalCode = String(addr.pincode || '').replace(/\D/g, '').slice(0, 6);
  const structuredHouse = trimStr(addr.houseNumber || addr.houseFlat);
  const structuredLine1 = trimStr(addr.addressLine1 || addr.streetLine1);
  const structuredLine2 = trimStr(addr.addressLine2 || addr.streetLine2);
  const structuredArea = trimStr(addr.area || addr.areaLocality);
  const structuredBuilding = trimStr(addr.building || addr.buildingNo);
  const structuredFloor = trimStr(addr.floor || addr.floorNo);
  const structuredLandmark = trimStr(addr.landmark);

  let houseNumber = structuredHouse;
  let addressLine1 = structuredLine1;

  if (!houseNumber || houseNumber.length > CHECKOUT_HOUSE_MAX) {
    const parts = blob.split(',').map((p) => p.trim()).filter(Boolean);
    const first = parts[0] || '';
    if (first && first.length <= CHECKOUT_HOUSE_MAX) {
      houseNumber = first;
      if (!addressLine1) {
        addressLine1 = parts.slice(1).join(', ') || first;
      }
    } else {
      houseNumber = clamp(first || blob || 'House', CHECKOUT_HOUSE_MAX) || 'House';
      if (!addressLine1) {
        addressLine1 = blob || first;
      }
    }
  }

  if (!addressLine1) {
    addressLine1 = blob || houseNumber;
  }
  if (addressLine1.length < CHECKOUT_LINE1_MIN && blob.length >= CHECKOUT_LINE1_MIN) {
    addressLine1 = blob;
  }
  if (addressLine1.length < CHECKOUT_LINE1_MIN) {
    addressLine1 = clamp([houseNumber, city].filter(Boolean).join(', '), CHECKOUT_LINE1_MAX);
  }

  const shrunk = shrinkToCourierCap({
    houseNumber: clamp(houseNumber || 'House', CHECKOUT_HOUSE_MAX),
    building: clamp(structuredBuilding, CHECKOUT_BUILDING_MAX),
    floor: clamp(structuredFloor, CHECKOUT_FLOOR_MAX),
    addressLine1: clamp(addressLine1, CHECKOUT_LINE1_MAX),
    addressLine2: clamp(structuredLine2, CHECKOUT_LINE1_MAX),
    area: clamp(structuredArea || city || 'Locality', CHECKOUT_AREA_MAX),
    landmark: clamp(structuredLandmark, CHECKOUT_LANDMARK_MAX),
  });

  const state = inferIndianState(addr.state, city, blob, postalCode);
  const typeRaw = String(addr.type || 'Home').trim().toLowerCase();
  const type: 'Home' | 'Work' | 'Other' =
    typeRaw === 'work' ? 'Work' : typeRaw === 'other' ? 'Other' : 'Home';
  const addressType = type.toLowerCase() as 'home' | 'work' | 'other';

  const phone = String(addr.phone || '')
    .trim()
    .replace(/^(\+91|91)/, '')
    .replace(/\D/g, '')
    .slice(-10);

  return {
    fullName: clamp(trimStr(addr.name) || 'Customer', 50),
    phone,
    houseNumber: shrunk.houseNumber,
    building: shrunk.building,
    floor: shrunk.floor,
    area: shrunk.area,
    landmark: shrunk.landmark,
    addressLine1: shrunk.addressLine1,
    addressLine2: shrunk.addressLine2,
    postalCode,
    city,
    state,
    type,
    addressType,
    isDefault: true,
  };
}
