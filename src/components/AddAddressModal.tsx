import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  MapPin, 
  Check, 
  Home, 
  Briefcase, 
  Building,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { fetchPincodeDetailsFromApi } from '../utils/pincodeApi';

export interface NewAddressData {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  houseFlat: string;
  floorNo?: string;
  buildingNo?: string;
  areaLocality: string;
  landmark?: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state?: string;
  type: 'Home' | 'Work' | 'Other';
  fullAddressString: string;
  isDefault?: boolean;
}

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAddress: (address: NewAddressData) => void;
  initialValues?: Partial<NewAddressData>;
}

export const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isOpen,
  onClose,
  onSaveAddress,
  initialValues,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Contact details (no default dummy address)
  const [fullName, setFullName] = useState(initialValues?.name || '');
  const [phone, setPhone] = useState(initialValues?.phone || '');
  const [pincode, setPincode] = useState(initialValues?.pincode || '');

  // Step 2: Location details (strictly empty until entered or fetched via postal API)
  const [houseFlat, setHouseFlat] = useState(initialValues?.houseFlat || '');
  const [floorNo, setFloorNo] = useState(initialValues?.floorNo || '');
  const [buildingNo, setBuildingNo] = useState(initialValues?.buildingNo || '');
  const [areaLocality, setAreaLocality] = useState(initialValues?.areaLocality || '');
  const [landmark, setLandmark] = useState(initialValues?.landmark || '');
  const [streetLine1, setStreetLine1] = useState(initialValues?.streetLine1 || '');
  const [streetLine2, setStreetLine2] = useState(initialValues?.streetLine2 || '');
  const [city, setCity] = useState(initialValues?.city || '');
  const [stateName, setStateName] = useState(initialValues?.state || '');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>(initialValues?.type || 'Home');

  // API Pincode fetch states
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState('');
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const fetchAndApplyPincode = async (pin: string) => {
    if (pin.length !== 6) return;
    setIsFetchingPincode(true);
    setPincodeSuccessMsg('');

    try {
      const details = await fetchPincodeDetailsFromApi(pin);
      if (details) {
        if (details.city) setCity(details.city);
        if (details.state) setStateName(details.state);
        if (details.localities && details.localities.length > 0) {
          setAvailableLocalities(details.localities);
          if (!areaLocality || areaLocality.trim() === '') {
            setAreaLocality(details.locality || details.localities[0]);
          }
        }
        const summary = `${details.locality || details.localities[0] || ''}, ${details.city} ${details.state ? `(${details.state})` : ''}`.trim();
        setPincodeSuccessMsg(summary);
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsFetchingPincode(false);
    }
  };

  // Reset or initialize on modal open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setFullName(initialValues?.name || '');
      setPhone(initialValues?.phone || '');
      setPincode(initialValues?.pincode || '');
      setHouseFlat(initialValues?.houseFlat || '');
      setFloorNo(initialValues?.floorNo || '');
      setBuildingNo(initialValues?.buildingNo || '');
      setAreaLocality(initialValues?.areaLocality || '');
      setLandmark(initialValues?.landmark || '');
      setStreetLine1(initialValues?.streetLine1 || '');
      setStreetLine2(initialValues?.streetLine2 || '');
      setCity(initialValues?.city || '');
      setStateName(initialValues?.state || '');
      setAddressType(initialValues?.type || 'Home');
      setPincodeSuccessMsg('');
      setAvailableLocalities([]);

      if (initialValues?.pincode && initialValues.pincode.length === 6) {
        fetchAndApplyPincode(initialValues.pincode);
      }
    }
  }, [isOpen, initialValues]);

  // Update city / locality hint when pincode changes
  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setPincode(cleaned);
    setPincodeSuccessMsg('');
    if (cleaned.length === 6) {
      fetchAndApplyPincode(cleaned);
    }
  };

  const handleContinueToStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) newErrors.fullName = 'Please enter your full name';
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!pincode.trim() || pincode.trim().length !== 6) {
      newErrors.pincode = 'Please enter a valid 6-digit Pincode';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    if (!city || !areaLocality) {
      await fetchAndApplyPincode(pincode.trim());
    }
    setCurrentStep(2);
  };

  const handleFinalSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!houseFlat.trim()) newErrors.houseFlat = 'House / Flat No. is required';
    if (!areaLocality.trim()) newErrors.areaLocality = 'Area / Locality is required';
    if (!streetLine1.trim()) newErrors.streetLine1 = 'Street Address (Line 1) is required';
    if (!city.trim()) newErrors.city = 'City is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build human-friendly composite address
    const parts = [
      houseFlat.trim(),
      floorNo.trim() ? `${floorNo.trim()} Floor` : '',
      buildingNo.trim(),
      streetLine1.trim(),
      streetLine2.trim(),
      areaLocality.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      city.trim(),
    ].filter(Boolean);

    const fullString = parts.join(', ');

    const newAddress: NewAddressData = {
      id: `addr-${Date.now()}`,
      name: fullName.trim(),
      phone: phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.trim()}`,
      pincode: pincode.trim(),
      houseFlat: houseFlat.trim(),
      floorNo: floorNo.trim(),
      buildingNo: buildingNo.trim(),
      areaLocality: areaLocality.trim(),
      landmark: landmark.trim(),
      streetLine1: streetLine1.trim(),
      streetLine2: streetLine2.trim(),
      city: city.trim(),
      state: stateName.trim() || undefined,
      type: addressType,
      fullAddressString: fullString,
      isDefault: false,
    };

    onSaveAddress(newAddress);
    onClose();
  };

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Dim Full-Screen Backdrop (Covers the ENTIRE screen including navbar, header, and page) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-[540px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-6 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 sm:px-7 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-navy font-roboto">
            New Address
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-navy flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="px-6 sm:px-7 py-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Stepper Tabs Bar */}
          <div className="flex items-center gap-3">
            
            {/* Step 1 Pill: Contact */}
            <div
              className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all ${
                currentStep === 1
                  ? 'bg-[#A44101]/10 border-[#A44101]/30 text-navy font-bold'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-800 font-semibold'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  currentStep === 1
                    ? 'bg-[#A44101] text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm">Contact</span>
            </div>

            {/* Step 2 Pill: Location */}
            <div
              className={`flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all ${
                currentStep === 2
                  ? 'bg-[#A44101]/10 border-[#A44101]/30 text-navy font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  currentStep === 2
                    ? 'bg-[#A44101] text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <span className="text-xs sm:text-sm">Location</span>
            </div>

          </div>

          {/* STEP 1: CONTACT VIEW */}
          {currentStep === 1 && (
            <form onSubmit={handleContinueToStep2} className="space-y-4 pt-1">
              <p className="text-xs text-slate-500">
                Name and phone for delivery updates.
              </p>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-[#A44101]">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="Enter full name"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-white ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone <span className="text-[#A44101]">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  placeholder="10-digit mobile number"
                  className={`w-full px-4 py-3 rounded-2xl border text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-white ${
                    errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                  }`}
                />
                {errors.phone && (
                  <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Pincode */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Pincode <span className="text-[#A44101]">*</span>
                  </label>
                  {isFetchingPincode && (
                    <span className="text-[11px] font-bold text-[#A44101] flex items-center gap-1.5 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A44101]" />
                      <span>Fetching locality &amp; city...</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => {
                      handlePincodeChange(e.target.value);
                      if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                    }}
                    placeholder="6-digit Pincode"
                    maxLength={6}
                    className={`w-full px-4 py-3 rounded-2xl border text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-white font-medium ${
                      errors.pincode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                    }`}
                  />
                  {pincodeSuccessMsg && !isFetchingPincode && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold pointer-events-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    </div>
                  )}
                </div>
                {errors.pincode && (
                  <p className="text-rose-500 text-[11px] font-medium mt-1">{errors.pincode}</p>
                )}
                {pincodeSuccessMsg && !isFetchingPincode && (
                  <div className="text-emerald-700 text-[11px] font-semibold mt-1.5 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto-detected: <strong>{pincodeSuccessMsg}</strong></span>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-navy transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: LOCATION VIEW */}
          {currentStep === 2 && (
            <form onSubmit={handleFinalSave} className="space-y-4 pt-1">
              <p className="text-xs text-slate-500">
                Where the courier should arrive.
              </p>

              {/* Row 1: House / Flat No & Floor No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    House / Flat No. <span className="text-[#A44101]">*</span>
                  </label>
                  <input
                    type="text"
                    value={houseFlat}
                    onChange={(e) => {
                      setHouseFlat(e.target.value);
                      if (errors.houseFlat) setErrors((prev) => ({ ...prev, houseFlat: '' }));
                    }}
                    placeholder="e.g. 42B"
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-white ${
                      errors.houseFlat ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                    }`}
                  />
                  {errors.houseFlat && (
                    <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.houseFlat}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Floor No.
                  </label>
                  <input
                    type="text"
                    value={floorNo}
                    onChange={(e) => setFloorNo(e.target.value)}
                    placeholder="e.g. 4th Floor"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all bg-white"
                  />
                </div>
              </div>

              {/* Row 2: Building No & Area / Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Building No.
                  </label>
                  <input
                    type="text"
                    value={buildingNo}
                    onChange={(e) => setBuildingNo(e.target.value)}
                    placeholder="e.g. Sunrise Apartments"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Area / Locality <span className="text-[#A44101]">*</span>
                    </label>
                    {availableLocalities.length > 0 && (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                        Postal API Detected
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#A44101] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={areaLocality}
                      onChange={(e) => {
                        setAreaLocality(e.target.value);
                        if (errors.areaLocality) setErrors((prev) => ({ ...prev, areaLocality: '' }));
                      }}
                      placeholder="Colony, Sector, or Locality"
                      className={`w-full pl-9 pr-4 py-2.5 rounded-2xl border text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-white ${
                        errors.areaLocality ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                      }`}
                    />
                  </div>
                  {/* Suggestion pills if pincode maps to multiple localities */}
                  {availableLocalities.length > 1 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold">Pick Area:</span>
                      {availableLocalities.slice(0, 6).map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            setAreaLocality(loc);
                            if (errors.areaLocality) setErrors((prev) => ({ ...prev, areaLocality: '' }));
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            areaLocality.toLowerCase() === loc.toLowerCase()
                              ? 'bg-[#A44101] text-white border-[#A44101] font-bold shadow-2xs'
                              : 'bg-stone-50 text-slate-700 border-slate-200 hover:border-[#A44101]'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.areaLocality && (
                    <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.areaLocality}</p>
                  )}
                </div>
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near City Mall (optional)"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all bg-white"
                />
              </div>

              {/* Street Address Line 1 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Street Address (Line 1) <span className="text-[#A44101]">*</span>
                </label>
                <input
                  type="text"
                  value={streetLine1}
                  onChange={(e) => {
                    setStreetLine1(e.target.value);
                    if (errors.streetLine1) setErrors((prev) => ({ ...prev, streetLine1: '' }));
                  }}
                  placeholder="Street and road details"
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-white ${
                    errors.streetLine1 ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                  }`}
                />
                {errors.streetLine1 && (
                  <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.streetLine1}</p>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={streetLine2}
                  onChange={(e) => setStreetLine2(e.target.value)}
                  placeholder="Wing and apartment details"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:border-[#A44101] focus:ring-1 focus:ring-[#A44101] transition-all bg-white"
                />
              </div>

              {/* City & Pin Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / District <span className="text-[#A44101]">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    placeholder="Enter city or district"
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs sm:text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-white ${
                      errors.city ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-rose-500 text-[10px] font-medium mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Pin Code <span className="text-[#A44101]">*</span>
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-navy bg-slate-50 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Verified Pincode Callout Chip */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>{city || 'Verified City'}</strong>{stateName ? ` (${stateName})` : ''} • Pincode: <strong>{pincode}</strong>{areaLocality ? ` • Locality: ${areaLocality}` : ''}
                </span>
              </div>

              {/* Address Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'Home', label: 'Home', icon: Home },
                      { id: 'Work', label: 'Work', icon: Briefcase },
                      { id: 'Other', label: 'Other', icon: Building },
                    ] as const
                  ).map((item) => {
                    const isSelected = addressType === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAddressType(item.id)}
                        className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-2 border-[#A44101] bg-[#A44101]/10 text-[#A44101] shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-navy transition-colors cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="px-7 py-3 rounded-2xl bg-[#A44101] hover:bg-[#8C3701] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default AddAddressModal;
