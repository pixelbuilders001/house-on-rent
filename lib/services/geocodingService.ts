/**
 * 100% Free Live Geocoding Service
 * Powered by OpenStreetMap / Photon (Komoot) + Nominatim + Local City Gazetteers
 * Zero API keys, zero credit cards, unlimited public fair use.
 */

import { searchLocalGazetteer } from './localGazetteer';

export interface GeocodedPlace {
  id: string;
  name: string;
  displayName: string;
  subtitle?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  type: string;
  categoryLabel?: string;
  distanceKm?: number;
  isLocalGazetteer?: boolean;
}

export interface CityGeocodingContext {
  name: string;
  lat: number;
  lng: number;
  bbox?: string;
}

// In-memory query cache for fast typing feedback
const cache = new Map<string, GeocodedPlace[]>();

// Strict India boundary box [minLon, minLat, maxLon, maxLat]
const INDIA_BBOX = '68.1,6.7,97.4,37.1';

/**
 * Normalizes OpenStreetMap tags to human-friendly categories
 */
function getCategoryLabel(osmKey?: string, osmValue?: string, type?: string): string {
  const k = (osmKey || '').toLowerCase();
  const v = (osmValue || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (k === 'highway' || v === 'residential' || v.includes('road') || v.includes('street')) return 'Road / Street';
  if (k === 'amenity' && (v.includes('college') || v.includes('school') || v.includes('university'))) return 'College / Campus';
  if (k === 'amenity' && (v.includes('hospital') || v.includes('clinic') || v.includes('pharmacy'))) return 'Hospital / Clinic';
  if (k === 'railway' || v.includes('station') || v.includes('terminal') || v.includes('bus')) return 'Transit / Station';
  if (v === 'village' || v === 'hamlet') return 'Village / Block';
  if (v === 'suburb' || v === 'neighbourhood' || v === 'quarter' || t === 'district') return 'Colony / Locality';
  if (k === 'shop' || k === 'commercial' || v.includes('market')) return 'Market / Commercial';
  if (v === 'town' || v === 'city') return 'City Area';
  return 'Landmark';
}

/**
 * Searches real-world places, landmarks, streets, and PIN codes live.
 * Intelligently scopes to the selected city (Samastipur, Patna, Darbhanga, etc.)
 * and merges with instant local gazetteers for Google-autocomplete style suggestions.
 */
export async function searchPlacesLive(
  query: string,
  cityContext?: CityGeocodingContext | number,
  fallbackLon?: number
): Promise<GeocodedPlace[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  // Parse city context
  let cityName = 'Samastipur';
  let biasLat = 25.8631;
  let biasLon = 85.7812;
  let cityBbox: string | undefined;

  if (typeof cityContext === 'object' && cityContext !== null) {
    cityName = cityContext.name || 'Samastipur';
    biasLat = cityContext.lat || 25.8631;
    biasLon = cityContext.lng || 85.7812;
    cityBbox = cityContext.bbox;
  } else if (typeof cityContext === 'number') {
    biasLat = cityContext;
    biasLon = fallbackLon || 85.7812;
  }

  // If no custom bbox provided, calculate a tight ~25km bounding box around the city
  if (!cityBbox) {
    const delta = 0.22;
    cityBbox = `${(biasLon - delta).toFixed(4)},${(biasLat - delta).toFixed(4)},${(biasLon + delta).toFixed(4)},${(biasLat + delta).toFixed(4)}`;
  }

  const cacheKey = `${cityName.toLowerCase()}:${q.toLowerCase()}@${biasLat.toFixed(2)},${biasLon.toFixed(2)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const places: GeocodedPlace[] = [];
  const seenKeys = new Set<string>();

  // 1. Instant Match from Local Gazetteer for current city
  const localMatches = searchLocalGazetteer(q, cityName);
  for (const item of localMatches) {
    const dedupKey = item.name.toLowerCase();
    if (!seenKeys.has(dedupKey)) {
      seenKeys.add(dedupKey);
      const dist = calculateHaversineKm(biasLat, biasLon, item.latitude, item.longitude);
      places.push({
        id: item.id,
        name: item.name,
        displayName: item.displayName,
        subtitle: item.subtitle,
        city: item.city,
        state: item.state,
        pincode: item.pincode,
        latitude: item.latitude,
        longitude: item.longitude,
        type: item.type,
        categoryLabel: item.type === 'college' ? 'Education Hub' : item.type === 'transit' ? 'Transit Station' : item.type === 'road' ? 'Road' : 'Chowk / Area',
        distanceKm: dist,
        isLocalGazetteer: true,
      });
    }
  }

  // 2. Query Photon API (biased and bounded to the active city)
  try {
    const encoded = encodeURIComponent(q);
    // Bounded strictly to active city BBOX first for maximum local precision
    const url = `https://photon.komoot.io/api/?q=${encoded}&lat=${biasLat}&lon=${biasLon}&bbox=${cityBbox}&limit=8`;
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
            if (code && code !== 'IN' && country && country !== 'india') continue;

            const [lon, lat] = feat.geometry?.coordinates || [0, 0];
            const cleanName = (props.name || props.street || q).replace(/\s*\(\d+\)/g, '').trim();
            const street = props.street || '';
            const suburb = props.suburb || props.neighbourhood || '';
            const district = props.locality || props.district || props.city || props.county || cityName;
            const state = props.state || 'Bihar';
            const postcode = props.postcode ? `PIN ${props.postcode}` : '';

            const dedupKey = cleanName.toLowerCase();
            if (seenKeys.has(dedupKey)) continue;
            seenKeys.add(dedupKey);

            // Construct descriptive Google-style secondary subtitle
            const subtitleParts = [
              street && street !== cleanName ? street : undefined,
              suburb && suburb !== cleanName ? suburb : undefined,
              district && district !== cleanName ? district : cityName,
              state,
              postcode,
            ].filter(Boolean);

            const dist = calculateHaversineKm(biasLat, biasLon, lat, lon);
            const category = getCategoryLabel(props.osm_key, props.osm_value, props.type);

            places.push({
              id: `ph-${props.osm_id || places.length}-${Date.now()}`,
              name: cleanName,
              displayName: `${cleanName}, ${district}`,
              subtitle: subtitleParts.join(', '),
              city: props.city || district || cityName,
              state,
              pincode: props.postcode,
              latitude: Number(lat.toFixed(5)),
              longitude: Number(lon.toFixed(5)),
              type: props.osm_value || props.type || 'place',
              categoryLabel: category,
              distanceKm: dist,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('City-bounded Photon lookup failed, trying backup...', err);
  }

  // 3. Fallback / Complement with Nominatim bounded to city
  if (places.length < 4) {
    try {
      const nomQuery = `${q}, ${cityName}`;
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        nomQuery
      )}&format=json&addressdetails=1&limit=5&countrycodes=in`;
      const nomHeaders: HeadersInit =
        typeof window === 'undefined' ? { 'User-Agent': 'RoomSaathi-App/1.0' } : {};

      const res = await fetch(nomUrl, { headers: nomHeaders });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              const addr = item.address || {};
              const shortName = item.name || addr.road || addr.suburb || addr.village || addr.county || q;
              const dedupKey = shortName.toLowerCase();
              if (seenKeys.has(dedupKey)) continue;
              seenKeys.add(dedupKey);

              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              const dist = calculateHaversineKm(biasLat, biasLon, lat, lon);

              const subParts = [
                addr.road && addr.road !== shortName ? addr.road : undefined,
                addr.suburb && addr.suburb !== shortName ? addr.suburb : undefined,
                addr.state_district || addr.county || cityName,
                addr.state || 'Bihar',
                addr.postcode ? `PIN ${addr.postcode}` : undefined,
              ].filter(Boolean);

              places.push({
                id: `nom-${item.osm_id || places.length}`,
                name: shortName,
                displayName: `${shortName}, ${cityName}`,
                subtitle: subParts.join(', '),
                city: cityName,
                state: addr.state || 'Bihar',
                pincode: addr.postcode,
                latitude: Number(lat.toFixed(5)),
                longitude: Number(lon.toFixed(5)),
                type: item.type || 'place',
                categoryLabel: getCategoryLabel(item.class, item.type, item.addresstype),
                distanceKm: dist,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Nominatim fallback lookup encountered error:', err);
    }
  }

  // Sort: prioritize local gazetteer and closer distance within the active city
  places.sort((a, b) => {
    if (a.isLocalGazetteer && !b.isLocalGazetteer) return -1;
    if (!a.isLocalGazetteer && b.isLocalGazetteer) return 1;
    return (a.distanceKm || 0) - (b.distanceKm || 0);
  });

  const finalResults = places.slice(0, 7);
  cache.set(cacheKey, finalResults);
  return finalResults;
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
      (err) => {
        console.warn('Browser geolocation failed or declined:', err.message);
        resolve(null);
      },
      { timeout: 7000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  });
}
