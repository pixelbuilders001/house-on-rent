import type { Property } from './mock-data/types';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LandmarkAnchor {
  id: string;
  name: string;
  shortName: string;
  category: 'transit' | 'college' | 'hospital' | 'hub';
  icon: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface PincodeCluster {
  pincode: string;
  regionName: string;
  latitude: number;
  longitude: number;
  subAreas: string[];
}

// Major Transit & Educational Hubs in Samastipur
export const SAMASTIPUR_LANDMARKS: LandmarkAnchor[] = [
  {
    id: 'samastipur-jn',
    name: 'Samastipur Junction Railway Station',
    shortName: 'Railway Station',
    category: 'transit',
    icon: 'Train',
    latitude: 25.8631,
    longitude: 85.7812,
    description: 'Central rail connectivity hub for students & working professionals',
  },
  {
    id: 'samastipur-college',
    name: 'Samastipur College / ABC College',
    shortName: 'Samastipur College',
    category: 'college',
    icon: 'GraduationCap',
    latitude: 25.8570,
    longitude: 85.7760,
    description: 'College Road academic hub with high student density',
  },
  {
    id: 'bus-stand',
    name: 'Govt Bus Stand (Sadar)',
    shortName: 'Bus Stand',
    category: 'transit',
    icon: 'Bus',
    latitude: 25.8590,
    longitude: 85.7870,
    description: 'District bus depot connecting Darbhanga, Patna & Muzaffarpur',
  },
  {
    id: 'sadar-hospital',
    name: 'Sadar Hospital / Hospital Road',
    shortName: 'Sadar Hospital',
    category: 'hospital',
    icon: 'Hospital',
    latitude: 25.8610,
    longitude: 85.7840,
    description: 'Healthcare staff, interns and medical students cluster',
  },
  {
    id: 'womens-college',
    name: "Women's College (Kashipur)",
    shortName: "Women's College",
    category: 'college',
    icon: 'GraduationCap',
    latitude: 25.8600,
    longitude: 85.7720,
    description: 'Girls PG and safe hostel corridor in Kashipur',
  },
];

// Samastipur PIN code clusters with authentic sub-areas
export const PINCODE_CLUSTERS: Record<string, PincodeCluster> = {
  '848101': {
    pincode: '848101',
    regionName: 'Central Samastipur',
    latitude: 25.8631,
    longitude: 85.7812,
    subAreas: ['Kashipur', 'Mohanpur', 'Station Road', 'Gudri Bazaar', 'Magardahi Ghat', 'Dharampur', 'Gol Bazar'],
  },
  '848102': {
    pincode: '848102',
    regionName: 'Magadh Colony & College Rd',
    latitude: 25.8560,
    longitude: 85.7740,
    subAreas: ['Magadh Colony', 'Patel Chowk', 'College Road', 'Panchpadi', 'Tajpur Road'],
  },
  '848134': {
    pincode: '848134',
    regionName: 'Muktapur & Musrigharari',
    latitude: 25.8820,
    longitude: 85.7980,
    subAreas: ['Muktapur', 'Sugar Mill Area', 'Musrigharari', 'NH-28 Bypass'],
  },
  '848125': {
    pincode: '848125',
    regionName: 'Pusa (RPCAU Campus)',
    latitude: 25.9800,
    longitude: 85.6700,
    subAreas: ['RPCAU Campus', 'Dholi Road', 'Pusa Bazar'],
  },
  '848114': {
    pincode: '848114',
    regionName: 'Dalsinghsarai',
    latitude: 25.6660,
    longitude: 85.8340,
    subAreas: ['Station Road', 'Ganj Bazar', 'Subhash Chowk'],
  },
};

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 * with a 1.25 road-network routing factor for realistic Indian town transit.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number((distance * 1.25).toFixed(1));
}

/**
 * Derives coordinates for a property based on its lat/lng, pincode, or area
 */
export function getCoordinatesForProperty(p: Property): LocationCoordinates {
  const pin = p.pincode?.trim();
  if (pin && PINCODE_CLUSTERS[pin]) {
    const cluster = PINCODE_CLUSTERS[pin];
    return { latitude: cluster.latitude, longitude: cluster.longitude };
  }

  const areaLower = (p.area || '').toLowerCase();
  for (const cluster of Object.values(PINCODE_CLUSTERS)) {
    for (const sub of cluster.subAreas) {
      if (areaLower.includes(sub.toLowerCase())) {
        return { latitude: cluster.latitude, longitude: cluster.longitude };
      }
    }
  }

  return { latitude: 25.8631, longitude: 85.7812 };
}

/**
 * Computes distance between user location and a property
 */
export function getDistanceToProperty(
  userLat: number,
  userLng: number,
  property: Property
): number {
  const coords = getCoordinatesForProperty(property);
  return calculateHaversineDistance(userLat, userLng, coords.latitude, coords.longitude);
}

/**
 * Returns dynamic sub-areas for a given PIN code along with property counts
 */
export function getSubAreasForPincode(
  pincode: string,
  properties: Property[] = []
): { name: string; count: number }[] {
  const cleanPin = pincode.trim();
  const cluster = PINCODE_CLUSTERS[cleanPin];
  const definedSubAreas = cluster ? cluster.subAreas : [];

  const pinProperties = properties.filter((p) => (p.pincode || '').trim() === cleanPin);

  const areaSet = new Set<string>(definedSubAreas);
  pinProperties.forEach((p) => {
    if (p.area) areaSet.add(p.area.trim());
  });

  const result: { name: string; count: number }[] = [];
  Array.from(areaSet).forEach((subArea) => {
    const count = pinProperties.filter((p) =>
      p.area.toLowerCase().includes(subArea.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(subArea.toLowerCase()))
    ).length;
    result.push({ name: subArea, count });
  });

  return result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Live browser geolocation helper with timeout
 */
export async function getLiveDeviceCoordinates(): Promise<LocationCoordinates | null> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        });
      },
      () => {
        resolve(null);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });
}
