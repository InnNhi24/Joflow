/**
 * Minimalist Post Modal
 */

import { useState, useEffect } from 'react';
import { X, MapPin, Search, Loader2 } from 'lucide-react';
import { ItemCategory, TimeNeeded, UserRole } from '../types';
import { geocodeAddress } from '../utils/geolocation';
import { analyzeUrgencyWithNLP } from '../utils/aiMatchingEngine';
import { comprehensiveAIAnalysis, loadAIConfigs } from '../utils/externalAI';
import Button from './Button';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: {
    category: ItemCategory;
    item: string;
    quantity: number;
    timeNeeded: TimeNeeded;
    notes: string;
    useCurrentLocation: boolean;
    manualLocation?: { lat: number; lng: number };
  }) => void;
  userRole: UserRole;
}

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'rice', label: 'Rice' },
  { value: 'water', label: 'Water' },
  { value: 'noodles', label: 'Noodles' },
  { value: 'books', label: 'Books' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'other', label: 'Other' }
];

const TIME_OPTIONS: { value: TimeNeeded; label: string }[] = [
  { value: '1hour', label: 'Within 1 hour ⚡ (Critical)' },
  { value: '6hours', label: 'Within 6 hours 🔥 (High)' },
  { value: '24hours', label: 'Within 24 hours ⏰ (Moderate)' },
  { value: '3days', label: 'Within 3 days 📅 (Low)' },
  { value: '1week', label: 'Within 1 week 📆 (Minimal)' }
];

export default function PostModal({ isOpen, onClose, onSubmit, userRole }: PostModalProps) {
  const [category, setCategory] = useState<ItemCategory>('rice');
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [timeNeeded, setTimeNeeded] = useState<TimeNeeded>('24hours');
  const [notes, setNotes] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualAddress, setManualAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [geocodedLocation, setGeocodedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiUrgencyScore, setAiUrgencyScore] = useState<number | null>(null);
  const [aiAnalysisDetails, setAiAnalysisDetails] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // AI-powered urgency analysis with external APIs
  useEffect(() => {
    if (notes.trim().length > 10 && userRole === 'receiver') {
      setIsAnalyzing(true);
      
      // Debounce AI analysis to avoid too many API calls
      const timeoutId = setTimeout(async () => {
        try {
          const aiConfigs = loadAIConfigs();
          const analysis = await comprehensiveAIAnalysis(notes, aiConfigs);
          
          setAiUrgencyScore(analysis.finalScore);
          setAiAnalysisDetails(analysis);
        } catch (error) {
          console.error('AI analysis error:', error);
          // Fallback to local AI
          const localUrgency = analyzeUrgencyWithNLP(notes, timeNeeded);
          setAiUrgencyScore(localUrgency);
          setAiAnalysisDetails({
            localAI: { urgencyScore: localUrgency },
            finalScore: localUrgency,
            confidence: 0.7,
            reasoning: 'Local AI only (external APIs unavailable)'
          });
        } finally {
          setIsAnalyzing(false);
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    } else {
      setAiUrgencyScore(null);
      setAiAnalysisDetails(null);
      setIsAnalyzing(false);
    }
  }, [notes, timeNeeded, userRole]);

  if (!isOpen) return null;

  // Input validation function
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Item validation
    if (!item.trim()) {
      newErrors.item = 'Item name is required';
    } else if (item.trim().length < 2) {
      newErrors.item = 'Item name must be at least 2 characters';
    } else if (item.trim().length > 100) {
      newErrors.item = 'Item name must be less than 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-.,()]+$/.test(item.trim())) {
      newErrors.item = 'Item name contains invalid characters';
    }

    // Quantity validation
    if (quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    } else if (quantity > 10000) {
      newErrors.quantity = 'Quantity must be less than 10,000';
    }

    // Notes validation
    if (notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }

    // Location validation
    if (!useCurrentLocation && !geocodedLocation) {
      newErrors.location = 'Please search for an address first';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGeocodeAddress = async () => {
    if (!manualAddress.trim()) {
      setGeocodingError('Please enter an address');
      return;
    }

    setIsGeocoding(true);
    setGeocodingError('');
    
    try {
      const result = await geocodeAddress(manualAddress);
      
      if (result) {
        // Validate coordinates are reasonable (not 0,0 or extreme values)
        if (Math.abs(result.lat) < 0.001 && Math.abs(result.lng) < 0.001) {
          setGeocodingError('Invalid coordinates returned. Please try a more specific address.');
          setGeocodedLocation(null);
          return;
        }
        
        setGeocodedLocation({ lat: result.lat, lng: result.lng });
        setGeocodingError('');
      } else {
        setGeocodingError('Address not found. Please try a more specific address.');
        setGeocodedLocation(null);
      }
    } catch (error) {
      setGeocodingError('Failed to find address. Please check your internet connection.');
      setGeocodedLocation(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      onSubmit({
        category,
        item: item.trim(),
        quantity,
        // Giver always has lowest urgency (1week), Receiver uses selected timeNeeded
        timeNeeded: userRole === 'giver' ? '1week' : timeNeeded,
        notes: notes.trim(),
        useCurrentLocation,
        manualLocation: !useCurrentLocation && geocodedLocation
          ? geocodedLocation
          : undefined
      });

      // Reset form
      setItem('');
      setQuantity(1);
      setTimeNeeded('24hours');
      setNotes('');
      setManualAddress('');
      setGeocodedLocation(null);
      setGeocodingError('');
      setErrors({});
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-88px)]">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Item */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
            <input
              type="text"
              value={item}
              onChange={(e) => {
                setItem(e.target.value);
                if (errors.item) setErrors(prev => ({...prev, item: ''}));
              }}
              placeholder="e.g., Jasmine Rice, Bottled Water..."
              required
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent ${
                errors.item ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.item && <p className="text-sm text-red-600 mt-1">{errors.item}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(parseInt(e.target.value) || 1);
                if (errors.quantity) setErrors(prev => ({...prev, quantity: ''}));
              }}
              min="1"
              max="10000"
              required
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent ${
                errors.quantity ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
          </div>

          {/* Time Needed - Only for Receivers */}
          {userRole === 'receiver' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Needed</label>
              <select
                value={timeNeeded}
                onChange={(e) => setTimeNeeded(e.target.value as TimeNeeded)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent"
              >
                {TIME_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location */}
          <div className="border border-gray-200 rounded-xl p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCurrentLocation}
                onChange={(e) => setUseCurrentLocation(e.target.checked)}
                className="w-4 h-4 accent-[#1261A6]"
              />
              <MapPin className="w-4 h-4 text-[#1261A6]" />
              <span className="text-sm font-medium text-gray-700">Use current location</span>
            </label>
          </div>

          {!useCurrentLocation && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => {
                      setManualAddress(e.target.value);
                      setGeocodingError('');
                      setGeocodedLocation(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGeocodeAddress();
                      }
                    }}
                    placeholder="e.g., 123 Nguyen Hue Street, District 1, Ho Chi Minh City"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={isGeocoding || !manualAddress.trim()}
                    className="px-4 py-3 bg-[#1261A6] text-white rounded-xl hover:bg-[#0f4f85] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isGeocoding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {isGeocoding ? 'Searching...' : 'Search'}
                  </button>
                </div>
                
                {/* Error Message */}
                {geocodingError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    ⚠️ {geocodingError}
                  </p>
                )}
                
                {/* Success Message */}
                {geocodedLocation && !geocodingError && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                      ✅ Address found successfully!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Coordinates: {geocodedLocation.lat.toFixed(4)}, {geocodedLocation.lng.toFixed(4)}
                    </p>
                  </div>
                )}
                
                {/* Helper Text */}
                <p className="text-xs text-gray-500 mt-1">
                  💡 Try to be specific: include street number, district, and city for best results
                </p>
              </div>
            </div>
          )}

          {/* Notes with AI Urgency Analysis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional) 
              <span className="text-xs text-gray-500">({notes.length}/500)</span>
              {userRole === 'receiver' && (
                <span className="ml-2 text-xs text-blue-600">🤖 AI analyzes urgency</span>
              )}
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setNotes(e.target.value);
                  if (errors.notes) setErrors(prev => ({...prev, notes: ''}));
                }
              }}
              placeholder={userRole === 'receiver' 
                ? "Describe your situation... AI will analyze urgency from your words"
                : "Additional details about what you're offering..."
              }
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent resize-none ${
                errors.notes ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.notes && <p className="text-sm text-red-600 mt-1">{errors.notes}</p>}
            
            {/* Enhanced AI Urgency Analysis Display */}
            {(aiUrgencyScore !== null || isAnalyzing) && userRole === 'receiver' && (
              <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-blue-700">
                    🤖 {isAnalyzing ? 'AI Analyzing...' : 'AI Urgency Analysis'}
                  </span>
                  {isAnalyzing && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                
                {!isAnalyzing && aiUrgencyScore !== null && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            aiUrgencyScore >= 4.5 ? 'bg-red-500' :
                            aiUrgencyScore >= 3.5 ? 'bg-orange-500' :
                            aiUrgencyScore >= 2.5 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(aiUrgencyScore / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-600">
                        {aiUrgencyScore.toFixed(1)}/5.0
                      </span>
                    </div>
                    
                    <p className="text-xs text-blue-600 mb-2">
                      {aiUrgencyScore >= 4.5 ? '🚨 Critical urgency detected - your request will be prioritized' :
                       aiUrgencyScore >= 3.5 ? '⚡ High urgency detected - good priority matching' :
                       aiUrgencyScore >= 2.5 ? '⏰ Moderate urgency - normal matching' :
                       '📅 Low urgency - flexible timing'}
                    </p>
                    
                    {aiAnalysisDetails && (
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Confidence:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div 
                              className="h-1 bg-blue-500 rounded-full"
                              style={{ width: `${(aiAnalysisDetails.confidence || 0.7) * 100}%` }}
                            ></div>
                          </div>
                          <span>{Math.round((aiAnalysisDetails.confidence || 0.7) * 100)}%</span>
                        </div>
                        
                        <p><span className="font-medium">Analysis:</span> {aiAnalysisDetails.reasoning}</p>
                        
                        {aiAnalysisDetails.openaiAnalysis && (
                          <p><span className="font-medium">GPT Insight:</span> {aiAnalysisDetails.openaiAnalysis.reasoning}</p>
                        )}
                        
                        {aiAnalysisDetails.localAI?.keywords?.length > 0 && (
                          <p><span className="font-medium">Keywords:</span> {aiAnalysisDetails.localAI.keywords.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </>
                )}
                
                {isAnalyzing && (
                  <p className="text-xs text-blue-600">
                    🔍 Running comprehensive AI analysis (local + external APIs)...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Location Error */}
          {errors.location && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.location}</p>
            </div>
          )}

          {/* Submit */}
          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            fullWidth
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </form>
      </div>
    </div>
  );
}