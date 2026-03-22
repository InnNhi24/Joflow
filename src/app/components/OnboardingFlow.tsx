/**
 * Premium Onboarding Flow - Collect User Information
 * Step-by-step form with glassmorphism design
 */

import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Check, ArrowRight, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import Button from './Button';
import { getCurrentLocation, LocationData } from '../utils/geolocation';

export interface UserProfile {
  name: string;
  phone: string;
  email?: string;
  location: { lat: number; lng: number };
  locationName: string;
}

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
  onBack?: () => void;
  existingProfile?: {
    name?: string;
    phone?: string;
    location?: { lat: number; lng: number };
    locationName?: string;
  };
}

export default function OnboardingFlow({ onComplete, onBack, existingProfile }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [formData, setFormData] = useState({
    name: existingProfile?.name || '',
    phone: existingProfile?.phone || '',
    locationName: existingProfile?.locationName || '',
    useCurrentLocation: !existingProfile?.location,
    manualLat: existingProfile?.location?.lat?.toString() || '',
    manualLng: existingProfile?.location?.lng?.toString() || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get current location when component mounts
  useEffect(() => {
    if (formData.useCurrentLocation) {
      setIsLoadingLocation(true);
      getCurrentLocation()
        .then((location) => {
          console.log('Location detected:', location);
          setCurrentLocation(location);
          setFormData(prev => ({
            ...prev,
            locationName: location.address || location.city || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
          }));
        })
        .catch((error) => {
          console.warn('Failed to get location:', error);
          // Use fallback location instead of failing
          const fallback = {
            lat: 21.0285,
            lng: 105.8542,
            address: 'Hanoi, Vietnam (Fallback)',
            city: 'Hanoi',
            country: 'Vietnam'
          };
          setCurrentLocation(fallback);
          setFormData(prev => ({
            ...prev,
            locationName: fallback.address
          }));
        })
        .finally(() => {
          setIsLoadingLocation(false);
        });
    }
  }, [formData.useCurrentLocation]);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    console.log('validateStep2 called');
    console.log('useCurrentLocation:', formData.useCurrentLocation);
    console.log('currentLocation:', currentLocation);
    console.log('isLoadingLocation:', isLoadingLocation);
    console.log('manualLat:', formData.manualLat);
    console.log('manualLng:', formData.manualLng);
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.useCurrentLocation) {
      if (!formData.manualLat || !formData.manualLng) {
        newErrors.location = 'Please provide coordinates or use current location';
      } else {
        const lat = parseFloat(formData.manualLat);
        const lng = parseFloat(formData.manualLng);
        
        if (isNaN(lat) || isNaN(lng)) {
          newErrors.location = 'Please enter valid numeric coordinates';
        } else if (lat < -90 || lat > 90) {
          newErrors.location = 'Latitude must be between -90 and 90';
        } else if (lng < -180 || lng > 180) {
          newErrors.location = 'Longitude must be between -180 and 180';
        }
      }
    } else if (formData.useCurrentLocation && !currentLocation && !isLoadingLocation) {
      // If using current location but detection failed
      console.warn('Location detection failed, will use fallback');
    }
    
    console.log('Step 2 validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    console.log('handleNext called, step:', step);
    console.log('formData:', formData);
    
    if (step === 1 && validateStep1()) {
      console.log('Step 1 validated, moving to step 2');
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      console.log('Step 2 validated, calling handleSubmit');
      handleSubmit();
    } else {
      console.log('Validation failed for step:', step);
      console.log('Errors:', errors);
    }
  };

  const handleSubmit = () => {
    console.log('handleSubmit called');
    
    // Determine final location to use
    let finalLocation: { lat: number; lng: number };
    let finalLocationName: string;

    if (formData.useCurrentLocation) {
      if (currentLocation) {
        // Use real detected location
        finalLocation = { lat: currentLocation.lat, lng: currentLocation.lng };
        finalLocationName = currentLocation.address || currentLocation.city || 'Current Location';
        console.log('Using detected location:', finalLocation, finalLocationName);
      } else {
        // Fallback to Hanoi if location detection failed
        finalLocation = { lat: 21.0285, lng: 105.8542 };
        finalLocationName = 'Hanoi, Vietnam (Fallback)';
        console.log('Using fallback location:', finalLocation, finalLocationName);
      }
    } else {
      // Use manual coordinates
      finalLocation = { 
        lat: parseFloat(formData.manualLat), 
        lng: parseFloat(formData.manualLng) 
      };
      finalLocationName = formData.locationName || `${finalLocation.lat.toFixed(4)}, ${finalLocation.lng.toFixed(4)}`;
      console.log('Using manual location:', finalLocation, finalLocationName);
    }

    const profile: UserProfile = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      location: finalLocation,
      locationName: finalLocationName
    };

    console.log('Creating user profile:', profile);
    
    try {
      onComplete(profile);
      console.log('onComplete called successfully');
    } catch (error) {
      console.error('Error calling onComplete:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20">
      {/* Back Button - Top Left */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-xl hover:bg-white/90 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg shadow-[#126DA6]/10 border border-white/60 text-gray-700 hover:text-[#126DA6]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back</span>
        </button>
      )}

      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#73C6D9]/10 rounded-full blur-2xl animate-float" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-[#2A95BF]/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-[#1261A6]/10 rounded-full blur-xl animate-float-slow" />
      </div>

      {/* Content */}
      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#1261A6] to-[#2A95BF] mb-4 shadow-lg shadow-[#1261A6]/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1261A6] to-[#126DA6] bg-clip-text text-transparent mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            {existingProfile?.name && existingProfile.name !== 'New User' 
              ? 'Update your information to continue' 
              : 'Tell us about yourself to get started'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Step {step} of 2</span>
            <span className="text-sm text-gray-500">{step === 1 ? 'Basic Info' : 'Location'}</span>
          </div>
          <div className="h-2 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden border border-white/60">
            <div 
              className="h-full bg-gradient-to-r from-[#2A95BF] to-[#126DA6] transition-all duration-500 rounded-full"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#126DA6]/10 border border-white/60">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Tell us about yourself</h2>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#126DA6] transition-colors" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#126DA6] transition-colors" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                    placeholder="+63 912 345 6789"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phone}</p>}
                <p className="mt-1 text-xs text-gray-500">For coordination and emergencies</p>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Where are you located?</h2>
              
              {/* Use Current Location */}
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-white/40">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.useCurrentLocation}
                    onChange={(e) => setFormData({ ...formData, useCurrentLocation: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-2 border-gray-300 text-[#126DA6] focus:ring-2 focus:ring-[#126DA6]/30"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isLoadingLocation ? (
                        <Loader2 className="w-5 h-5 text-[#126DA6] animate-spin" />
                      ) : (
                        <MapPin className="w-5 h-5 text-[#126DA6]" />
                      )}
                      <span className="font-semibold text-gray-900">Use current location</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {isLoadingLocation 
                        ? 'Getting your location...'
                        : currentLocation 
                          ? `✓ Found: ${currentLocation.city || currentLocation.address}`
                          : '⚠️ Location detection failed, will use fallback'
                      }
                    </p>
                  </div>
                </label>
              </div>

              {/* Manual Location */}
              {!formData.useCurrentLocation && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location Name
                    </label>
                    <input
                      type="text"
                      value={formData.locationName}
                      onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                      placeholder="e.g., District 1, Ho Chi Minh City"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.manualLat}
                        onChange={(e) => setFormData({ ...formData, manualLat: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                        placeholder="21.0285"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.manualLng}
                        onChange={(e) => setFormData({ ...formData, manualLng: e.target.value })}
                        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                        placeholder="105.8542"
                      />
                    </div>
                  </div>
                  {errors.location && <p className="text-xs text-red-500 font-medium">{errors.location}</p>}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                variant="secondary"
                onClick={() => setStep(step - 1)}
                className="flex-1"
                disabled={isLoadingLocation}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1"
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <>
                  Loading... <Loader2 className="w-5 h-5 animate-spin" />
                </>
              ) : step === 2 ? (
                <>
                  Complete <Check className="w-5 h-5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
