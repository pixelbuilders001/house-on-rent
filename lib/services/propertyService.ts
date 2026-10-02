import { mockProperties } from '../mock-data/properties';
import type { Property } from '../mock-data/types';
import { calculateMonthlyCost } from '../pricing';
import { calculateMatchScore, type SearchPreferences } from '../matching';
import { getStorageItem } from '../storage';
import { getSupabaseBrowserClient } from '../supabase/client';

export type PropertyFilters = SearchPreferences & { type?: string; deposit?: string; brokerage?: boolean; amenities?: string[] };

type PropertyRow = Record<string, any>;
function fromRow(row: PropertyRow): Property {
  return {
    id: row.id, name: row.name, type: row.type, city: row.city, area: row.area,
    distanceKm: Number(row.distance_km), commuteMinutes: Number(row.commute_minutes),
    rating: Number(row.rating), reviewCount: row.review_count, verified: row.verified,
    verificationLevel: row.verification_level, rent: row.rent, deposit: row.deposit,
    brokerage: row.brokerage, electricity: row.electricity, wifiCost: row.wifi_cost,
    maintenance: row.maintenance, foodCost: row.food_cost, foodAvailable: row.food_available,
    foodIncluded: row.food_included, wifi: row.wifi, electricityIncluded: row.electricity_included,
    availableBeds: row.available_beds, totalBeds: row.total_beds, accommodation: row.accommodation,
    amenities: row.amenities ?? [], image: row.image ?? '', color: row.color,
    description: row.description, owner: row.owner_name, rules: row.rules ?? [],
    updated: row.updated_label, destination: row.destination_id ?? '',
  };
}

function matches(p: Property, f: PropertyFilters) {
  return (f.min == null || p.rent >= f.min) && (f.max == null || p.rent <= f.max) &&
    (f.distance == null || p.commuteMinutes <= f.distance) &&
    (!f.accommodation || f.accommodation === 'Any' || p.accommodation.toLowerCase().includes(f.accommodation.toLowerCase())) &&
    (!f.destination || p.destination === f.destination) && (!f.type || p.type === f.type) &&
    (!f.brokerage || p.brokerage === 0) && (!f.deposit || f.deposit === 'any' || (f.deposit === '0' ? p.deposit === 0 : p.deposit <= Number(f.deposit))) &&
    (!f.food || f.food === 'any' || (f.food === 'included' ? p.foodIncluded : f.food === 'available' ? p.foodAvailable : !p.foodIncluded)) &&
    (!f.amenities?.length || f.amenities.every((a) => p.amenities.some((x) => x.toLowerCase() === a.toLowerCase())));
}

function sortProperties(results: Property[], filters: PropertyFilters, sort: string) {
  if (sort === 'cost') results.sort((a, b) => calculateMonthlyCost(a) - calculateMonthlyCost(b));
  else if (sort === 'closest') results.sort((a, b) => a.distanceKm - b.distanceKm);
  else if (sort === 'movein') results.sort((a, b) => (a.rent + a.deposit + a.brokerage) - (b.rent + b.deposit + b.brokerage));
  else if (sort === 'rating') results.sort((a, b) => b.rating - a.rating);
  else if (sort === 'newest') results.sort((a, b) => Number.parseInt(a.updated) - Number.parseInt(b.updated));
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
