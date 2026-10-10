import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  MapPin, 
  Check, 
  Home, 
  Briefcase, 
  Building,
  Loader2,
  CheckCircle2,
  ChevronDown
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
  const [isCustomArea, setIsCustomArea] = useState(false);
  const [isLocalityDropdownOpen, setIsLocalityDropdownOpen] = useState(false);
  const localityDropdownRef = useRef<HTMLDivElement>(null);

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
      setIsCustomArea(false);
      setIsLocalityDropdownOpen(false);

      if (initialValues?.pincode && initialValues.pincode.length === 6) {
        fetchAndApplyPincode(initialValues.pincode);
      }
    }
  }, [isOpen, initialValues]);

  // Dismiss locality dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        localityDropdownRef.current &&
        !localityDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLocalityDropdownOpen(false);
      }
    };
    if (isLocalityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLocalityDropdownOpen]);

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
    const cleanPhone = phone.replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)';
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

    const cleanPhone = phone.replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(-10);

    const newAddress: NewAddressData = {
      id: `addr-${Date.now()}`,
      name: fullName.trim(),
      phone: cleanPhone,
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
                  Mobile Number <span className="text-[#A44101]">*</span>
                </label>
                <div className={`flex items-center px-4 py-2.5 rounded-2xl border text-sm text-navy bg-white focus-within:ring-1 focus-within:ring-[#A44101] transition-all ${
                  errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus-within:border-[#A44101]'
                }`}>
                  <span className="text-xs font-bold text-slate-500 mr-2 shrink-0 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone.replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(0, 10)}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/^(\+91|91)/, '').replace(/\D/g, '').slice(0, 10);
                      setPhone(cleaned);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                    placeholder="9876543210"
                    className="w-full bg-transparent outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
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
                  {availableLocalities.length > 0 ? (
                    <div className="space-y-2 relative" ref={localityDropdownRef}>
                      {/* Custom Dropdown Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsLocalityDropdownOpen((prev) => !prev)}
                        className={`w-full pl-9 pr-9 py-2.5 rounded-2xl border text-xs sm:text-sm text-left transition-all bg-white flex items-center justify-between cursor-pointer relative ${
                          isLocalityDropdownOpen
                            ? 'border-[#A44101] ring-2 ring-[#A44101]/15 shadow-sm'
                            : errors.areaLocality
                            ? 'border-rose-400 bg-rose-50/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-[#A44101] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <span className={`truncate font-medium ${areaLocality ? 'text-navy' : 'text-slate-400'}`}>
                          {areaLocality || '-- Select Area / Locality --'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform duration-200 pointer-events-none ${
                            isLocalityDropdownOpen ? 'rotate-180 text-[#A44101]' : ''
                          }`}
                        />
                      </button>

                      {/* Custom Floating Dropdown Menu */}
                      <AnimatePresence>
                        {isLocalityDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden"
                          >
                            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <span>Postal API Localities</span>
                              <span className="text-emerald-700 font-semibold">{availableLocalities.length} found</span>
                            </div>

                            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100/60 p-1">
                              {availableLocalities.map((loc) => {
                                const isSelected = areaLocality.toLowerCase() === loc.toLowerCase();
                                return (
                                  <button
                                    key={loc}
                                    type="button"
                                    onClick={() => {
                                      setAreaLocality(loc);
                                      setIsCustomArea(false);
                                      setIsLocalityDropdownOpen(false);
                                      if (errors.areaLocality) setErrors((prev) => ({ ...prev, areaLocality: '' }));
                                    }}
                                    className={`w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#A44101]/10 text-[#A44101] font-bold'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-navy font-medium'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-[#A44101]' : 'bg-slate-300'}`} />
                                      <span className="truncate">{loc}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-[#A44101] shrink-0 stroke-[2.5]" />}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Option for custom / manual typing */}
                            <div className="p-1 border-t border-slate-100 bg-stone-50/50">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomArea(true);
                                  setIsLocalityDropdownOpen(false);
                                }}
                                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#A44101] hover:bg-[#A44101]/10 transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <span>✏️</span>
                                <span>Enter custom area / locality manually</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Manual input if user chose custom area */}
                      {(isCustomArea || (!availableLocalities.includes(areaLocality) && areaLocality)) && (
                        <div className="relative animate-in fade-in duration-150 pt-1">
                          <input
                            type="text"
                            value={areaLocality}
                            onChange={(e) => {
                              setAreaLocality(e.target.value);
                              if (errors.areaLocality) setErrors((prev) => ({ ...prev, areaLocality: '' }));
                            }}
                            placeholder="Enter specific colony, sector or area"
                            className={`w-full px-4 py-2 rounded-xl border text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#A44101] transition-all bg-stone-50/60 ${
                              errors.areaLocality ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-[#A44101]'
                            }`}
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  ) : (
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
