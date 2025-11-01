import { keccak } from './crypto';

/**
 * Round coordinates to reduce precision (privacy-preserving)
 */
export function roundCoordinates(latitude: number, longitude: number, precision: number = 2): {
  lat: number;
  lng: number;
} {
  const factor = Math.pow(10, precision);
  return {
    lat: Math.round(latitude * factor) / factor,
    lng: Math.round(longitude * factor) / factor,
  };
}

/**
 * Compute geo hash from coordinates
 */
export function computeGeoHash(latitude: number, longitude: number): string {
  const rounded = roundCoordinates(latitude, longitude, 2);
  const geoString = `${rounded.lat.toFixed(2)},${rounded.lng.toFixed(2)}`;
  return keccak(geoString);
}

/**
 * Get UTC timestamp hash
 */
export function computeUTCHash(timestamp: number): string {
  // Round to nearest hour for privacy
  const roundedTimestamp = Math.floor(timestamp / 3600000) * 3600000;
  return keccak(roundedTimestamp.toString());
}

/**
 * Get current UTC hash
 */
export function getCurrentUTCHash(): string {
  return computeUTCHash(Date.now());
}

