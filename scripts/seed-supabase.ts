import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import { mockAmenities } from '../lib/mock-data/amenities';
import { mockDestinations } from '../lib/mock-data/destinations';
import { mockLeads } from '../lib/mock-data/leads';
import { mockProperties } from '../lib/mock-data/properties';
import { mockReviews } from '../lib/mock-data/reviews';
import { mockRooms } from '../lib/mock-data/rooms';

loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.');
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const destinations = mockDestinations.map(({ id, name, type, area, distance }) => ({ id, name, type, area, city: distance }));
const properties = mockProperties.map((p) => ({
  id: p.id, name: p.name, type: p.type, city: p.city, area: p.area,
  distance_km: p.distanceKm, commute_minutes: p.commuteMinutes, rating: p.rating,
  review_count: p.reviewCount, verified: p.verified, verification_level: p.verificationLevel,
  rent: p.rent, deposit: p.deposit, brokerage: p.brokerage, electricity: p.electricity,
  wifi_cost: p.wifiCost, maintenance: p.maintenance, food_cost: p.foodCost,
  food_available: p.foodAvailable, food_included: p.foodIncluded, wifi: p.wifi,
  electricity_included: p.electricityIncluded, available_beds: p.availableBeds,
  total_beds: p.totalBeds, accommodation: p.accommodation, amenities: p.amenities,
  image: p.image, color: p.color, description: p.description, owner_name: p.owner,
  rules: p.rules, updated_label: p.updated, destination_id: p.destination, is_active: true,
}));
const rooms = mockRooms.map((r) => ({ id: r.id, property_id: r.propertyId, room_number: r.room, accommodation: r.accommodation, rent: r.rent }));
const beds = mockRooms.flatMap((r) => Array.from({ length: 3 }, (_, i) => ({
  id: `${r.id}-bed-${i + 1}`, room_id: r.id, bed_label: `Bed ${i + 1}`,
  status: r.status === 'available' && i < 2 ? 'available' : 'occupied',
})));

async function seed() {
  const jobs = [
    ['destinations', () => supabase.from('destinations').upsert(destinations)],
    ['amenities', () => supabase.from('amenities').upsert(mockAmenities.map((name) => ({ id: name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'), name })))],
    ['properties', () => supabase.from('properties').upsert(properties)],
    ['rooms', () => supabase.from('rooms').upsert(rooms)],
    ['beds', () => supabase.from('beds').upsert(beds)],
    ['reviews', () => supabase.from('reviews').upsert(mockReviews.map((r, i) => ({
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
      property_id: mockProperties[i].id, reviewer_name: r.name, rating: r.rating,
      body: r.text, is_published: true,
    })))],
    // These are clearly labelled prototype inquiries, not real customer records.
    ['leads', () => supabase.from('leads').upsert(mockLeads.map((l, i) => ({
      id: `00000000-0000-4000-8001-${String(i + 1).padStart(12, '0')}`,
      property_id: mockProperties[i].id, renter_name: l.name, budget: l.budget,
      looking_for: l.lookingFor, destination: l.destination,
      status: l.status === 'Contacted' ? 'contacted' : 'new',
    })))],
  ] as const;

  for (const [name, run] of jobs) {
    const { error } = await run();
    if (error) throw new Error(`Could not seed ${name}: ${error.message}`);
    console.log(`Seeded ${name}`);
  }
}

seed().catch((error) => { console.error(error); process.exitCode = 1; });
