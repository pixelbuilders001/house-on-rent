# Supabase setup

RoomSaathi now has a Supabase schema and seed path for its prototype data. Public browsing reads properties, destinations, amenities, beds, and reviews from Supabase when credentials are configured. Without them, the existing in-code demo data remains as a local fallback.

## Connect a Supabase project

1. Create a Supabase project and copy its project URL and publishable key into `.env.local` using `.env.example` as a template.
2. Apply `supabase/migrations/20261002000000_initial_schema.sql` in the Supabase SQL editor (or with the Supabase CLI).
3. Add `SUPABASE_SECRET_KEY` to `.env.local` temporarily for the seed command. The secret key bypasses RLS, so never prefix it with `NEXT_PUBLIC_` and never expose it to browser code.
4. Run `npm run seed:supabase`, then remove the service-role key from `.env.local`.
5. Restart `npm run dev` so Next.js loads the public project settings.

The seed command is repeatable for properties, destinations, amenities, rooms, beds, reviews, and sample leads. The sample reviews and leads are prototype records. Actual user profiles are created through Supabase Auth; demo users are deliberately not inserted into `profiles`.

## Tables

- `profiles`: real authenticated users and tenant/owner/admin roles.
- `properties`: searchable property listings, prices, amenities, status, and ownership.
- `destinations`, `amenities`: editable catalog data used by search controls.
- `rooms`, `beds`: inventory linked to properties.
- `reviews`: published resident reviews.
- `leads`: renter inquiries, visible to the renter and the listing owner under row-level security.

Row-level security is enabled in the migration. Public users can browse active listings and lookup catalogs. Listing edits and private inquiries require authenticated Supabase users. The app's existing owner/admin demo screens and local-only actions still need an authentication flow before their writes can be safely enabled against these tables.
