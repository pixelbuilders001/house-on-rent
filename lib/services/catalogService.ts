import { mockAmenities } from '../mock-data/amenities';
import { mockDestinations } from '../mock-data/destinations';
import { getSupabaseBrowserClient } from '../supabase/client';
import { mockReviews } from '../mock-data/reviews';

export type Destination = (typeof mockDestinations)[number];

export async function getDestinations(): Promise<Destination[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return mockDestinations;
  const { data, error } = await supabase.from('destinations').select('id,name,type,area,city').order('name');
  if (error) {
    console.error('Supabase destinations query failed; using prototype data.', error.message);
    return mockDestinations;
  }
  return (data ?? []).map((item) => ({ id: item.id, name: item.name, type: item.type, area: item.area, distance: item.city }));
}

export async function getAmenities(): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return mockAmenities;
  const { data, error } = await supabase.from('amenities').select('name').order('name');
  if (error) {
    console.error('Supabase amenities query failed; using prototype data.', error.message);
    return mockAmenities;
  }
  return (data ?? []).map((item) => item.name);
}

export type PropertyReview = { id: string; name: string; rating: number; text: string };

export async function getPropertyReviews(propertyId: string): Promise<PropertyReview[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return mockReviews.map((review, i) => ({ id: `demo-${i}`, ...review }));
  const { data, error } = await supabase.from('reviews').select('id,reviewer_name,rating,body').eq('property_id', propertyId).eq('is_published', true).order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase reviews query failed; using prototype data.', error.message);
    return mockReviews.map((review, i) => ({ id: `demo-${i}`, ...review }));
  }
  return (data ?? []).map((review) => ({ id: review.id, name: review.reviewer_name, rating: review.rating, text: review.body }));
}
