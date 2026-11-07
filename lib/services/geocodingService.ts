/**
 * 100% Free Live Geocoding Service
 * Powered by OpenStreetMap / Photon (Komoot)
 * Zero API keys, zero credit cards, unlimited public fair use.
 */

export interface GeocodedPlace {
  id: string;
  name: string;
  displayName: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  type: string;
}

// In-memory query cache for fast typing feedback
const cache = new Map<string, GeocodedPlace[]>();

/**
 * Searches real-world places, landmarks, streets, and PIN codes live
 */
export async function searchPlacesLive(
  query: string,
  biasLat: number = 25.8631,
  biasLon: number = 85.7812
): Promise<GeocodedPlace[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const cacheKey = `${q.toLowerCase()}@${biasLat},${biasLon}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    // 1. Query Photon API (fast, search-as-you-type, location-biased)
    const encoded = encodeURIComponent(q);
    const url = `https://photon.komoot.io/api/?q=${encoded}&lat=${biasLat}&lon=${biasLon}&limit=6`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.features) && data.features.length > 0) {
        const places: GeocodedPlace[] = data.features.map((feat: any, idx: number) => {
          const props = feat.properties || {};
          const [lon, lat] = feat.geometry?.coordinates || [0, 0];
          
          const parts = [
            props.name,
            props.locality || props.district,
            props.city || props.county,
            props.state,
            props.postcode,
          ].filter(Boolean);

          return {
            id: `photon-${props.osm_id || idx}-${Date.now()}`,
            name: props.name || q,
            displayName: parts.join(', '),
            city: props.city || props.county,
            state: props.state,
            pincode: props.postcode,
            latitude: Number(lat.toFixed(5)),
            longitude: Number(lon.toFixed(5)),
            type: props.osm_value || props.type || 'place',
          };
        });

        cache.set(cacheKey, places);
        return places;
      }
    }
  } catch (err) {
    console.warn('Photon geocoding failed, trying Nominatim fallback...', err);
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&limit=5&countrycodes=in`;
    const res = await fetch(nomUrl, {
      headers: { 'User-Agent': 'RoomSaathi-Rental-App/1.0' },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const places: GeocodedPlace[] = data.map((item: any, idx: number) => ({
          id: `nom-${item.osm_id || idx}`,
          name: item.name || item.display_name.split(',')[0],
          displayName: item.display_name,
          latitude: Number(parseFloat(item.lat).toFixed(5)),
          longitude: Number(parseFloat(item.lon).toFixed(5)),
          type: item.type || 'place',
        }));

        cache.set(cacheKey, places);
        return places;
      }
    }
  } catch (err) {
    console.error('All geocoding lookups failed:', err);
  }

  return [];
}

/**
 * Calculates straight-line road-routed distance in km using Haversine formula
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // 1.25 factor for realistic Indian town road routing
  return Number((R * c * 1.25).toFixed(1));
}

/**
 * 1-Tap Browser Geolocation
 */
export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
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
      () => resolve(null),
      { timeout: 7000, enableHighAccuracy: true }
    );
  });
}
