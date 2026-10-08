/**
 * Postal Pincode API Service
 * Fetches locality, district, city, and state information from https://api.postalpincode.in/pincode/{pincode}
 */

export interface PincodeDetails {
  pincode: string;
  city: string;
  district: string;
  state: string;
  locality: string;
  localities: string[];
}

/**
 * Fallback static dictionary for common cities in case of network offline
 */
const fallbackPincodePrefixes: { [prefix: string]: { city: string; state: string; locality: string } } = {
  '110': { city: 'South West Delhi', state: 'Delhi', locality: 'Dabri' },
  '400': { city: 'Mumbai', state: 'Maharashtra', locality: 'Dadar West' },
  '560': { city: 'Bengaluru', state: 'Karnataka', locality: 'Whitefield' },
  '500': { city: 'Hyderabad', state: 'Telangana', locality: 'Hitec City' },
  '600': { city: 'Chennai', state: 'Tamil Nadu', locality: 'T. Nagar' },
  '700': { city: 'Kolkata', state: 'West Bengal', locality: 'Salt Lake' },
  '395': { city: 'Surat', state: 'Gujarat', locality: 'Athwa' },
  '411': { city: 'Pune', state: 'Maharashtra', locality: 'Kothrud' },
  '302': { city: 'Jaipur', state: 'Rajasthan', locality: 'Mansarovar' },
  '380': { city: 'Ahmedabad', state: 'Gujarat', locality: 'Navrangpura' },
  '201': { city: 'Noida', state: 'Uttar Pradesh', locality: 'Sector 62' },
  '122': { city: 'Gurugram', state: 'Haryana', locality: 'Cyber City' },
};

/**
 * Fetches locality and city details for an Indian 6-digit Pincode
 * Hits https://api.postalpincode.in/pincode/{pincode}
 */
export async function fetchPincodeDetailsFromApi(pincode: string): Promise<PincodeDetails | null> {
  const pin = pincode.replace(/\D/g, '').slice(0, 6);
  if (pin.length !== 6) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0].PostOffice) && data[0].PostOffice.length > 0) {
        const postOffices = data[0].PostOffice;
        const first = postOffices[0];
        const rawLocalities = postOffices.map((po: { Name: string }) => po.Name).filter(Boolean);
        const uniqueLocalities: string[] = Array.from(new Set(rawLocalities));

        return {
          pincode: pin,
          city: first.District || first.Division || first.Circle || '',
          district: first.District || '',
          state: first.State || '',
          locality: first.Name || '',
          localities: uniqueLocalities,
        };
      }
    }
  } catch (error) {
    console.warn('Postal pincode API fetch error, checking fallback', error);
  }

  // Fallback heuristic for known prefixes
  const prefix3 = pin.slice(0, 3);
  if (fallbackPincodePrefixes[prefix3]) {
    const fb = fallbackPincodePrefixes[prefix3];
    return {
      pincode: pin,
      city: fb.city,
      district: fb.city,
      state: fb.state,
      locality: fb.locality,
      localities: [fb.locality],
    };
  }

  return null;
}
