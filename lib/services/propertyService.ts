import { mockProperties } from '../mock-data/properties';
import type { Property } from '../mock-data/types';
import { calculateMonthlyCost } from '../pricing';
import { calculateMatchScore, type SearchPreferences } from '../matching';
import { getStorageItem } from '../storage';
import { getSupabaseBrowserClient } from '../supabase/client';

export type PropertyFilters = SearchPreferences & {
  q?: string;
  type?: string;
  deposit?: string;
  brokerage?: boolean;
  amenities?: string[];
  verifiedOnly?: boolean;
};

type PropertyRow = Record<string, any>;
function fromRow(row: PropertyRow): Property {
  return {
    id: row.id, name: row.name, type: row.type, city: row.city, area: row.area,
    distanceKm: Number(row.distance_km || 0), commuteMinutes: Number(row.commute_minutes || 0),
    rating: Number(row.rating || 4.8), reviewCount: row.review_count || 12, verified: row.verified ?? true,
    verificationLevel: row.verification_level || 'Direct Owner', rent: Number(row.rent || 0), deposit: Number(row.deposit || 0),
    brokerage: Number(row.brokerage || 0), electricity: Number(row.electricity || 400), wifiCost: Number(row.wifi_cost || 0),
    maintenance: Number(row.maintenance || 200), foodCost: Number(row.food_cost || 0), foodAvailable: Boolean(row.food_available),
    foodIncluded: Boolean(row.food_included), wifi: Boolean(row.wifi ?? true), electricityIncluded: Boolean(row.electricity_included),
    availableBeds: Number(row.available_beds || 1), totalBeds: Number(row.total_beds || 4), accommodation: row.accommodation || 'Sharing Room',
    amenities: Array.isArray(row.amenities) ? row.amenities : [], image: row.image ?? '',
    images: Array.isArray(row.images) && row.images.length > 0 ? row.images : (row.image ? [row.image] : []),
    color: row.color ?? '#0f766e',
    description: row.description || '', owner: row.owner_name || 'Verified Host', rules: Array.isArray(row.rules) ? row.rules : [],
    updated: row.updated_label || 'Today', destination: row.destination_id ?? '',
    stationDistanceKm: row.station_distance_km != null ? Number(row.station_distance_km) : undefined,
    busStandDistanceKm: row.bus_stand_distance_km != null ? Number(row.bus_stand_distance_km) : undefined,
    pincode: row.pincode,
  };
}

function matches(p: Property, f: PropertyFilters) {
  // 1. Text Search Query (Name, Area, City, Pin, Amenities, Accommodation)
  if (f.q && f.q.trim()) {
    const tokens = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const corpus = `${p.name} ${p.area} ${p.city} ${p.pincode ?? ''} ${p.type} ${p.accommodation} ${p.description} ${p.amenities.join(' ')}`.toLowerCase();
    const hasAllTokens = tokens.every((token) => corpus.includes(token));
    if (!hasAllTokens) return false;
  }

  // 2. Monthly Budget Min & Max
  if (f.min != null && p.rent < f.min) return false;
  if (f.max != null && f.max > 0 && p.rent > f.max) return false;

  // 3. Travel Time (Only apply when user explicitly constrains it)
  if (f.distance != null && f.distance > 0 && f.distance < 60) {
    if (p.commuteMinutes > f.distance && p.distanceKm > (f.distance / 2)) return false;
  }

  // 4. Accommodation Type (Fuzzy Sharing/Room Matching)
  if (f.accommodation && f.accommodation !== 'Any' && f.accommodation !== '') {
    const target = f.accommodation.toLowerCase();
    const current = (p.accommodation || '').toLowerCase();
    const isMatch = current.includes(target) || target.includes(current) ||
      (target.includes('private') && (current.includes('single') || current.includes('1 bhk') || current.includes('private'))) ||
      (target.includes('2') && (current.includes('2') || current.includes('double'))) ||
      (target.includes('3') && (current.includes('3') || current.includes('triple'))) ||
      (target.includes('4') && (current.includes('4') || current.includes('four'))) ||
      (target.includes('bed') && (current.includes('bed') || current.includes('sharing')));
    if (!isMatch) return false;
  }

  // 5. Destination (Area / College Landmark)
  if (f.destination && f.destination !== 'any' && f.destination !== '') {
    if (p.destination) {
      if (p.destination !== f.destination && !p.area.toLowerCase().includes(f.destination.toLowerCase())) {
        return false;
      }
    }
  }

  // 6. Property Type (PG, Hostel, Room, Flat)
  if (f.type && f.type !== 'any' && f.type !== '') {
    if (p.type.toLowerCase() !== f.type.toLowerCase()) return false;
  }

  // 7. Brokerage
  if (f.brokerage && p.brokerage > 0) return false;

  // 8. Security Deposit
  if (f.deposit && f.deposit !== 'any' && f.deposit !== '') {
    const maxDep = Number(f.deposit);
    if (!isNaN(maxDep) && p.deposit > maxDep) return false;
  }

  // 9. Food Options
  if (f.food && f.food !== 'any' && f.food !== '') {
    if (f.food === 'included' && !p.foodIncluded) return false;
    if (f.food === 'available' && (!p.foodAvailable && !p.foodIncluded)) return false;
    if (f.food === 'none' && p.foodIncluded) return false;
  }

  // 10. Amenities (Fuzzy Match & Synonyms)
  if (f.amenities && f.amenities.length > 0) {
    const propAmenities = p.amenities.map((a) => a.toLowerCase());
    const hasAll = f.amenities.every((required) => {
      const req = required.toLowerCase();
      if (req.includes('wifi') || req.includes('wi-fi')) {
        return propAmenities.some((a) => a.includes('wifi') || a.includes('wi-fi') || a.includes('internet'));
      }
      if (req.includes('food') || req.includes('meal')) {
        return propAmenities.some((a) => a.includes('food') || a.includes('meal') || a.includes('mess') || a.includes('kitchen') || p.foodIncluded || p.foodAvailable);
      }
      if (req.includes('laundry') || req.includes('wash')) {
        return propAmenities.some((a) => a.includes('wash') || a.includes('laundry'));
      }
      if (req.includes('park')) {
        return propAmenities.some((a) => a.includes('park') || a.includes('bike') || a.includes('car'));
      }
      if (req.includes('power') || req.includes('backup')) {
        return propAmenities.some((a) => a.includes('power') || a.includes('backup') || a.includes('inverter') || a.includes('generator'));
      }
      if (req.includes('water') || req.includes('ro')) {
        return propAmenities.some((a) => a.includes('water') || a.includes('ro'));
      }
      if (req.includes('cctv') || req.includes('security')) {
        return propAmenities.some((a) => a.includes('cctv') || a.includes('security') || a.includes('guard'));
      }
      return propAmenities.some((a) => a.includes(req) || req.includes(a));
    });
    if (!hasAll) return false;
  }

  // 11. Verified Only
  if (f.verifiedOnly && !p.verified) return false;

  return true;
}

function sortProperties(results: Property[], filters: PropertyFilters, sort: string) {
  if (sort === 'cost' || sort === 'price-asc') results.sort((a, b) => a.rent - b.rent);
  else if (sort === 'price-desc') results.sort((a, b) => b.rent - a.rent);
  else if (sort === 'closest') results.sort((a, b) => (a.stationDistanceKm ?? a.distanceKm) - (b.stationDistanceKm ?? b.distanceKm));
  else if (sort === 'movein') results.sort((a, b) => (a.rent + a.deposit + a.brokerage) - (b.rent + b.deposit + b.brokerage));
  else if (sort === 'rating') results.sort((a, b) => b.rating - a.rating);
  else if (sort === 'newest') results.sort((a, b) => Number.parseInt(a.updated || '0') - Number.parseInt(b.updated || '0'));
  else results.sort((a, b) => calculateMatchScore(b, filters) - calculateMatchScore(a, filters));
  return results;
}

export async function getProperties(filters: PropertyFilters = {}, sort = 'best'): Promise<Property[]> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase.from('properties').select('*').eq('is_active', true);
    if (error) console.error('Supabase properties query failed; using prototype data.', error.message);
    else return sortProperties((data ?? []).map(fromRow).filter((p) => matches(p, filters)), filters, sort);
  }
  const all = [...mockProperties, ...getStorageItem<Property[]>('roomsaathi_owner_created', [])];
  return sortProperties(all.filter((p) => matches(p, filters)), filters, sort);
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).eq('is_active', true).maybeSingle();
    if (error) console.error('Supabase property query failed; using prototype data.', error.message);
    else if (data) return fromRow(data);
    else return undefined;
  }
  return [...mockProperties, ...getStorageItem<Property[]>('roomsaathi_owner_created', [])].find((p) => p.id === id);
}

export async function getAvailableBeds(id: string) {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const { data, error } = await supabase.from('beds').select('id, bed_label, status, rooms!inner(property_id, room_number)').eq('rooms.property_id', id);
    if (error) console.error('Supabase beds query failed; using prototype data.', error.message);
    else return (data ?? []).map((bed: any) => ({ id: bed.id, room: `Room ${bed.rooms.room_number}`, bed: bed.bed_label, status: bed.status === 'available' ? 'Available' : 'Occupied' }));
  }
  const p = [...mockProperties, ...getStorageItem<Property[]>('roomsaathi_owner_created', [])].find((x) => x.id === id);
  if (!p || p.availableBeds === 0) return [];
  return Array.from({ length: 3 }, (_, i) => ({ id: `${id}-bed-${i + 1}`, room: 'Room 201', bed: `Bed ${i + 1}`, status: i < Math.min(p.availableBeds, 2) ? 'Available' : 'Occupied' }));
}
