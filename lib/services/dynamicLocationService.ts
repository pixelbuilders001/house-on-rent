import type { Property } from '../mock-data/types';
import { calculateHaversineKm } from './geocodingService';

export interface LocationFacet {
  name: string;
  count: number;
}

export interface InventoryStats {
  areas: LocationFacet[];
  pincodes: LocationFacet[];
  topLocations: string[];
}

/**
 * Extracts live distinct areas, pincodes, and room counts from whatever
 * properties currently exist in the database. Zero hardcoding!
 */
export function extractLiveLocationFacets(properties: Property[]): InventoryStats {
  const areaCounts = new Map<string, number>();
  const pincodeCounts = new Map<string, number>();

  properties.forEach((p) => {
    if (p.area && p.area.trim()) {
      const a = p.area.trim();
      areaCounts.set(a, (areaCounts.get(a) || 0) + 1);
    }
    if (p.pincode && p.pincode.trim()) {
      const pin = p.pincode.trim();
      pincodeCounts.set(pin, (pincodeCounts.get(pin) || 0) + 1);
    }
  });

  const areas: LocationFacet[] = Array.from(areaCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const pincodes: LocationFacet[] = Array.from(pincodeCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Top active locations for quick tags
  const topLocations = areas.slice(0, 5).map((a) => a.name);

  return { areas, pincodes, topLocations };
}

/**
 * Dynamically gets sub-areas for an active PIN code purely from live listings
 */
export function getLiveSubAreasForPin(
  pincode: string,
  properties: Property[]
): LocationFacet[] {
  const cleanPin = pincode.trim();
  const matching = properties.filter((p) => (p.pincode || '').trim() === cleanPin);

  const counts = new Map<string, number>();
  matching.forEach((p) => {
    if (p.area && p.area.trim()) {
      const a = p.area.trim();
      counts.set(a, (counts.get(a) || 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Resolves coordinate for a property.
 * If property has latitude & longitude, uses them.
 * Otherwise uses default town center (25.8631, 85.7812).
 */
export function getPropertyCoordinates(property: Property): { latitude: number; longitude: number } {
  // If property row contains coordinates
  const pAny = property as any;
  if (pAny.latitude && pAny.longitude && pAny.latitude !== 0) {
    return { latitude: Number(pAny.latitude), longitude: Number(pAny.longitude) };
  }
  return { latitude: 25.8631, longitude: 85.7812 };
}

/**
 * Computes distance from a reference spot to a property in km
 */
export function getDistanceToSpot(
  spotLat: number,
  spotLng: number,
  property: Property
): number {
  const coords = getPropertyCoordinates(property);
  return calculateHaversineKm(spotLat, spotLng, coords.latitude, coords.longitude);
}
