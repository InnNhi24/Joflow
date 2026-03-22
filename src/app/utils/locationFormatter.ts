/**
 * Location Formatting Utilities
 * Format location names to be more user-friendly
 */

/**
 * Format location name to be more readable
 * Examples:
 * "Hoan Kiem, Hanoi, Vietnam" -> "Hoan Kiem, Hanoi"
 * "District 1, Ho Chi Minh City, Vietnam" -> "District 1, HCMC"
 * "Sydney, New South Wales, Australia" -> "Sydney, NSW"
 */
export function formatLocationName(locationName: string | null | undefined): string {
  if (!locationName) {
    return 'Current Location';
  }

  // Remove common suffixes and clean up
  let formatted = locationName
    .replace(/, Vietnam$/, '')
    .replace(/, Australia$/, '')
    .replace(/, United States$/, '')
    .replace(/, United Kingdom$/, '')
    .replace(/, Singapore$/, '');

  // Shorten common long names
  formatted = formatted
    .replace('Ho Chi Minh City', 'HCMC')
    .replace('New South Wales', 'NSW')
    .replace('Queensland', 'QLD')
    .replace('Victoria', 'VIC')
    .replace('Western Australia', 'WA')
    .replace('South Australia', 'SA')
    .replace('Northern Territory', 'NT')
    .replace('Australian Capital Territory', 'ACT')
    .replace('Tasmania', 'TAS');

  // Limit to 2 parts (e.g., "District, City")
  const parts = formatted.split(', ');
  if (parts.length > 2) {
    return `${parts[0]}, ${parts[1]}`;
  }

  return formatted;
}

/**
 * Get short city name from full location
 * Examples:
 * "Hoan Kiem, Hanoi, Vietnam" -> "Hanoi"
 * "District 1, Ho Chi Minh City, Vietnam" -> "HCMC"
 */
export function getCityName(locationName: string | null | undefined): string {
  if (!locationName) {
    return 'Unknown City';
  }

  const parts = locationName.split(', ');
  
  // Usually city is the second part
  if (parts.length >= 2) {
    let city = parts[1];
    
    // Shorten common long city names
    city = city
      .replace('Ho Chi Minh City', 'HCMC')
      .replace('Sydney', 'Sydney')
      .replace('Melbourne', 'Melbourne')
      .replace('Brisbane', 'Brisbane');
    
    return city;
  }
  
  // If only one part, return it
  return parts[0] || 'Unknown City';
}

/**
 * Format distance with appropriate units
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
}