export interface TravelInfo {
  distance: number; // in kilometers
  durationByCar: number; // in minutes
  durationByBus: number; // in minutes
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate travel information between two points
 * @param fromLat Starting latitude
 * @param fromLon Starting longitude
 * @param toLat Destination latitude
 * @param toLon Destination longitude
 * @returns Travel information including distance and estimated duration
 */
export function calculateTravelInfo(
  fromLat: number, 
  fromLon: number, 
  toLat: number, 
  toLon: number
): TravelInfo {
  const distance = calculateDistance(fromLat, fromLon, toLat, toLon);
  
  // Average speeds in Cambodia (km/h)
  const averageCarSpeed = 50; // Considering road conditions
  const averageBusSpeed = 35; // Slower due to stops and road conditions
  
  // Calculate duration in minutes
  const durationByCar = Math.round((distance / averageCarSpeed) * 60);
  const durationByBus = Math.round((distance / averageBusSpeed) * 60);
  
  return {
    distance,
    durationByCar,
    durationByBus
  };
}

/**
 * Format duration from minutes to hours and minutes
 * @param minutes Duration in minutes
 * @returns Formatted string in Khmer
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} នាទី`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ម៉ោង`;
  }
  
  return `${hours} ម៉ោង ${remainingMinutes} នាទី`;
}

/**
 * Format distance in kilometers
 * @param distance Distance in kilometers
 * @returns Formatted string in Khmer
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} ម៉ែត្រ`;
  }
  return `${distance} គីឡូម៉ែត្រ`;
}