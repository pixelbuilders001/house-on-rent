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

// Strict India boundary box [minLon, minLat, maxLon, maxLat]
const INDIA_BBOX = '68.1,6.7,97.4,37.1';

/**
 * Searches real-world places, landmarks, streets, and PIN codes live strictly within India.
 * International results are completely excluded.
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

  const places: GeocodedPlace[] = [];
  const seenKeys = new Set<string>();

  try {
    // 1. Query Photon API (biased to regional coordinates + bounded strictly to India)
    const encoded = encodeURIComponent(q);
    const url = `https://photon.komoot.io/api/?q=${encoded}&lat=${biasLat}&lon=${biasLon}&bbox=${INDIA_BBOX}&limit=12`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data?.features) && data.features.length > 0) {
          for (const feat of data.features) {
            const props = feat.properties || {};
            const code = (props.countrycode || '').toUpperCase();
            const country = (props.country || '').toLowerCase();

            // Strict India check — reject anything outside India
            if (code !== 'IN' && country !== 'india') continue;

            const [lon, lat] = feat.geometry?.coordinates || [0, 0];
            const cleanName = (props.name || q).replace(/\s*\(\d+\)/g, '').trim();
            const state = props.state || '';
            const district = props.locality || props.district || props.city || props.county || '';
            const postcode = props.postcode ? `PIN ${props.postcode}` : '';

            // Unique deduplication key so duplicate identical localities aren't repeated
            const dedupKey = `${cleanName.toLowerCase()}|${district.toLowerCase()}|${state.toLowerCase()}`;
            if (seenKeys.has(dedupKey)) continue;
            seenKeys.add(dedupKey);

            const displayParts = [
              cleanName,
              district && district !== cleanName ? district : undefined,
              state,
              postcode,
            ].filter(Boolean);

            const isLocalState = state.toLowerCase().includes('bihar');

            places.push({
              id: `in-${props.osm_id || places.length}-${Date.now()}`,
              name: cleanName,
              displayName: displayParts.join(', '),
              city: props.city || props.county || district,
              state,
              pincode: props.postcode,
              latitude: Number(lat.toFixed(5)),
              longitude: Number(lon.toFixed(5)),
              type: props.osm_value || props.type || 'place',
              ...(isLocalState ? { _isLocal: 1 } : { _isLocal: 0 }) as any,
            });
          }

          if (places.length > 0) {
            // Prioritize local state (Bihar / near user) first
            places.sort((a: any, b: any) => (b._isLocal || 0) - (a._isLocal || 0));
            const finalResults = places.slice(0, 6);
            cache.set(cacheKey, finalResults);
            return finalResults;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Primary geocoding lookup failed, trying backup...', err);
  }

  // 2. Fallback to OpenStreetMap Nominatim restricted strictly to India
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q
    )}&format=json&limit=6&countrycodes=in`;
    const res = await fetch(nomUrl, {
      headers: { 'User-Agent': 'RoomSaathi-App/1.0' },
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const fallbackPlaces: GeocodedPlace[] = [];
          for (const item of data) {
            const rawDisplay = item.display_name || '';
            // Ensure India is in the display name
            if (!rawDisplay.toLowerCase().includes('india')) continue;

            const parts = rawDisplay.split(',').map((s: string) => s.trim());
            const shortName = item.name || parts[0];
            const dedupKey = shortName.toLowerCase();
            if (seenKeys.has(dedupKey)) continue;
            seenKeys.add(dedupKey);

            // Keep display name concise (top 3 parts: Landmark, District, State)
            const cleanDisplay = parts.slice(0, 3).join(', ');

            fallbackPlaces.push({
              id: `nom-${item.osm_id || fallbackPlaces.length}`,
              name: shortName,
              displayName: cleanDisplay,
              latitude: Number(parseFloat(item.lat).toFixed(5)),
              longitude: Number(parseFloat(item.lon).toFixed(5)),
              type: item.type || 'place',
            });
          }

          if (fallbackPlaces.length > 0) {
            const finalResults = fallbackPlaces.slice(0, 6);
            cache.set(cacheKey, finalResults);
            return finalResults;
          }
        }
      }
    }
  } catch (err) {
    console.error('All location lookups failed:', err);
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
