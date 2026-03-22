/**
 * Geolocation Utilities
 * Get user's real location with fallback to Vietnam locations
 */

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  country?: string;
}

// Vietnam major cities as fallback
const VIETNAM_LOCATIONS: LocationData[] = [
  { lat: 21.0285, lng: 105.8542, address: "Hoan Kiem, Hanoi", city: "Hanoi", country: "Vietnam" },
  { lat: 10.8231, lng: 106.6297, address: "District 1, Ho Chi Minh City", city: "Ho Chi Minh City", country: "Vietnam" },
  { lat: 16.0544, lng: 108.2022, address: "Hai Chau, Da Nang", city: "Da Nang", country: "Vietnam" },
  { lat: 10.0452, lng: 105.7469, address: "Ninh Kieu, Can Tho", city: "Can Tho", country: "Vietnam" },
  { lat: 20.8449, lng: 106.6881, address: "Hong Bang, Hai Phong", city: "Hai Phong", country: "Vietnam" },
  { lat: 21.5937, lng: 105.8481, address: "Thai Nguyen", city: "Thai Nguyen", country: "Vietnam" },
  { lat: 12.2585, lng: 109.0526, address: "Nha Trang, Khanh Hoa", city: "Nha Trang", country: "Vietnam" },
];

/**
 * Get user's current location using browser geolocation API
 */
export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported, using fallback');
      resolve(getRandomVietnamLocation());
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Raw location:', { latitude, longitude });
        
        try {
          // Try to get address from coordinates
          const address = await reverseGeocode(latitude, longitude);
          const locationData: LocationData = {
            lat: latitude,
            lng: longitude,
            address: address.display_name,
            city: address.address?.city || address.address?.town || address.address?.village || 'Unknown City',
            country: address.address?.country || 'Unknown Country'
          };
          
          console.log('Geocoded location:', locationData);
          resolve(locationData);
        } catch (error) {
          console.warn('Reverse geocoding failed, using coordinates only:', error);
          // If reverse geocoding fails, still return coordinates
          resolve({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            city: 'Current Location',
            country: 'Unknown'
          });
        }
      },
      (error) => {
        console.warn('Geolocation error:', error.message, 'Code:', error.code);
        
        // Provide more specific error handling
        let errorMessage = 'Location access failed';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        console.warn(`${errorMessage}, using fallback location`);
        // Always resolve with fallback instead of rejecting
        resolve(getRandomVietnamLocation());
      },
      options
    );
  });
}

/**
 * Reverse geocoding using OpenStreetMap Nominatim API
 */
async function reverseGeocode(lat: number, lng: number): Promise<any> {
  try {
    // Use a CORS proxy or different approach
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'JOFLOW-App/1.0'
        },
        signal: controller.signal,
        mode: 'cors'
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.error) {
      throw new Error(data?.error || 'No address found');
    }
    
    return data;
  } catch (error) {
    console.warn('Reverse geocoding failed (this is normal):', error.message);
    // Don't throw error, just return null to use fallback
    throw error;
  }
}

/**
 * Forward geocoding - Convert address to coordinates
 */
export async function geocodeAddress(address: string): Promise<LocationData | null> {
  try {
    // Clean and validate input
    const cleanAddress = address.trim();
    if (!cleanAddress) {
      throw new Error('Address cannot be empty');
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1&addressdetails=1&countrycodes=vn`,
      {
        headers: {
          'User-Agent': 'JOFLOW-App/1.0'
        },
        signal: controller.signal,
        mode: 'cors'
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('No location found for this address');
    }
    
    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Invalid coordinates returned');
    }
    
    // Check if coordinates are reasonable (not 0,0)
    if (Math.abs(lat) < 0.001 && Math.abs(lng) < 0.001) {
      throw new Error('Invalid location coordinates');
    }
    
    return {
      lat,
      lng,
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village || 'Unknown City',
      country: result.address?.country || 'Unknown Country'
    };
  } catch (error) {
    console.warn('Forward geocoding failed:', error.message);
    return null;
  }
}

/**
 * Get a random Vietnam location (for fallback)
 */
export function getRandomVietnamLocation(): LocationData {
  return VIETNAM_LOCATIONS[Math.floor(Math.random() * VIETNAM_LOCATIONS.length)];
}

/**
 * Check if coordinates are in Vietnam
 */
export function isInVietnam(lat: number, lng: number): boolean {
  // Vietnam bounding box (approximate)
  return lat >= 8.5 && lat <= 23.5 && lng >= 102.0 && lng <= 110.0;
}