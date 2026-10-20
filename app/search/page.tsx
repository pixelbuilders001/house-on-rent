'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowUpDown,
  Filter,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  Home,
  RotateCcw
} from 'lucide-react';
import { getProperties, type PropertyFilters } from '@/lib/services/propertyService';
import type { Property } from '@/lib/mock-data/types';
import { mockDestinations } from '@/lib/mock-data/destinations';
import { mockAmenities } from '@/lib/mock-data/amenities';
import { getDestinations, getAmenities, type Destination } from '@/lib/services/catalogService';
import { PropertyCard } from '@/components/PropertyCard';
import { Modal } from '@/components/Modal';
import { getStorageItem, setStorageItem } from '@/lib/storage';

const defaultFilters: PropertyFilters = {
  q: '',
  min: 0,
  max: 12000,
  distance: 60,
  accommodation: '',
  type: '',
  food: 'any',
  deposit: 'any',
  brokerage: false,
  verifiedOnly: false,
  amenities: [],
};

export default function SearchPage() {
  const [destinations, setDestinations] = useState<Destination[]>(mockDestinations);
  const [amenityOptions, setAmenityOptions] = useState<string[]>(mockAmenities);
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('best');
  const [properties, setProperties] = useState<Property[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [busy, setBusy] = useState(true);

  const router = useRouter();

  // Load initial catalog data & URL params
  useEffect(() => {
    getDestinations().then(setDestinations);
    getAmenities().then(setAmenityOptions);

    const p = new URLSearchParams(window.location.search);
    const initialQuery = p.get('q') || '';
    setSearchInput(initialQuery);

    setFilters({
      ...defaultFilters,
      q: initialQuery,
      min: p.get('min') ? Number(p.get('min')) : 0,
      max: p.get('max') ? Number(p.get('max')) : 12000,
      distance: p.get('distance') ? Number(p.get('distance')) : 60,
      destination: p.get('destination') || undefined,
      accommodation: p.get('accommodation') || '',
      type: p.get('type') || '',
      food: p.get('food') || 'any',
      deposit: p.get('deposit') || 'any',
      brokerage: p.get('brokerage') === 'true',
      verifiedOnly: p.get('verifiedOnly') === 'true',
      amenities: p.get('amenities') ? p.get('amenities')!.split(',').filter(Boolean) : [],
    });

    setSaved(getStorageItem('roomsaathi_saved_properties', []));
    setCompare(getStorageItem('roomsaathi_compare', []));
  }, []);

  // Fetch properties with debounce
  useEffect(() => {
    let alive = true;
    setBusy(true);
    const timer = setTimeout(() => {
      getProperties(filters, sort).then((data) => {
        if (alive) {
          setProperties(data);
          setBusy(false);
        }
      });
    }, 250);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filters, sort]);

  // Update specific filter property and push to URL
  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    const next = { ...filters, [key]: value };
    setFilters(next);

    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (
        v !== undefined &&
        v !== '' &&
        v !== 'any' &&
        v !== false &&
        !(k === 'min' && v === 0) &&
        !(k === 'max' && v === 12000) &&
        !(k === 'distance' && v === 60) &&
        !(Array.isArray(v) && !v.length)
      ) {
        params.set(k, Array.isArray(v) ? v.join(',') : String(v));
      }
    });

    const queryString = params.toString();
    router.replace(`/search${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateFilter('q', searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateFilter('q', '');
  };

  const resetAllFilters = () => {
    setSearchInput('');
    setFilters(defaultFilters);
    router.replace('/search');
  };

  const toggleSave = (id: string) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    setStorageItem('roomsaathi_saved_properties', next);
  };

  const toggleCompare = (id: string) => {
    const next = compare.includes(id) ? compare.filter((x) => x !== id) : compare.length < 3 ? [...compare, id] : compare;
    setCompare(next);
    setStorageItem('roomsaathi_compare', next);
  };

  // Active filters count and list for quick removal tags
  const activeFilterList = useMemo(() => {
    const list: { key: keyof PropertyFilters; label: string; clearVal: any }[] = [];
    if (filters.q) list.push({ key: 'q', label: `"${filters.q}"`, clearVal: '' });
    if (filters.max && filters.max < 12000) list.push({ key: 'max', label: `Up to ₹${filters.max.toLocaleString()}`, clearVal: 12000 });
    if (filters.min && filters.min > 0) list.push({ key: 'min', label: `Min ₹${filters.min.toLocaleString()}`, clearVal: 0 });
    if (filters.accommodation) list.push({ key: 'accommodation', label: filters.accommodation, clearVal: '' });
    if (filters.type) list.push({ key: 'type', label: filters.type, clearVal: '' });
    if (filters.brokerage) list.push({ key: 'brokerage', label: 'Zero Brokerage', clearVal: false });
    if (filters.verifiedOnly) list.push({ key: 'verifiedOnly', label: 'Verified Only', clearVal: false });
    if (filters.food && filters.food !== 'any') {
      list.push({ key: 'food', label: filters.food === 'included' ? 'Food Included' : 'Food Available', clearVal: 'any' });
    }
    if (filters.amenities && filters.amenities.length > 0) {
      filters.amenities.forEach((a) => {
        list.push({
          key: 'amenities',
          label: a,
          clearVal: (filters.amenities || []).filter((x) => x !== a),
        });
      });
    }
    return list;
  }, [filters]);

  // Sidebar Controls JSX
  const filterControls = (
    <>
      {/* 1. Monthly Budget */}
      <div className="filter-group">
        <div className="filter-title">Monthly Budget</div>
        <div className="range-row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: '#78857f' }}>Min ₹</span>
            <input
              className="input"
              type="number"
              min={0}
              step={500}
              value={filters.min ?? 0}
              onChange={(e) => updateFilter('min', Number(e.target.value))}
            />
          </div>
          <span style={{ color: '#94a39d', marginTop: 14 }}>–</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, color: '#78857f' }}>Max ₹</span>
            <input
              className="input"
              type="number"
              min={0}
              step={500}
              value={filters.max ?? 12000}
              onChange={(e) => updateFilter('max', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Quick Budget Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {[4000, 6000, 8000, 10000].map((amt) => (
            <button
              key={amt}
              className={`pill small ${filters.max === amt ? 'selected' : ''}`}
              style={{ padding: '4px 9px', fontSize: 11.5 }}
              onClick={() => updateFilter('max', filters.max === amt ? 12000 : amt)}
            >
              Under ₹{amt / 1000}K
            </button>
          ))}
        </div>
      </div>

      {/* 2. Room Sharing / Accommodation */}
      <div className="filter-group">
        <div className="filter-title">Sharing & Room Type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Private room', '2 Sharing', '3 Sharing', '4 Sharing', 'Bed'].map((item) => (
            <label className="check" key={item} style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="accommodation"
                checked={filters.accommodation === item}
                onChange={() => updateFilter('accommodation', filters.accommodation === item ? '' : item)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Property Category */}
      <div className="filter-group">
        <div className="filter-title">Property Category</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['PG', 'Hostel', 'Room', 'Flat'].map((t) => (
            <button
              key={t}
              type="button"
              className={`pill ${filters.type === t ? 'selected' : ''}`}
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => updateFilter('type', filters.type === t ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Brokerage & Trust */}
      <div className="filter-group">
        <div className="filter-title">Trust & Savings</div>
        <label className="check" style={{ cursor: 'pointer', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={!!filters.brokerage}
            onChange={(e) => updateFilter('brokerage', e.target.checked)}
          />
          <span style={{ fontWeight: 600, color: '#166534' }}>⚡ Zero Brokerage (Direct Host)</span>
        </label>
        <label className="check" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!filters.verifiedOnly}
            onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
          />
          <span style={{ fontWeight: 600, color: '#166534' }}>✓ Verified Properties Only</span>
        </label>
      </div>

      {/* 5. Food / Mess Option */}
      <div className="filter-group">
        <div className="filter-title">Food & Meals</div>
        <select
          className="select"
          value={filters.food ?? 'any'}
          onChange={(e) => updateFilter('food', e.target.value)}
        >
          <option value="any">Any food option</option>
          <option value="included">Food included in rent</option>
          <option value="available">Food / Mess available</option>
          <option value="none">Room only (no food)</option>
        </select>
      </div>

      {/* 6. Security Deposit */}
      <div className="filter-group">
        <div className="filter-title">Max Security Deposit</div>
        <select
          className="select"
          value={filters.deposit ?? 'any'}
          onChange={(e) => updateFilter('deposit', e.target.value)}
        >
          <option value="any">Any deposit amount</option>
          <option value="0">Zero deposit (₹0)</option>
          <option value="3000">Under ₹3,000</option>
          <option value="5000">Under ₹5,000</option>
          <option value="10000">Under ₹10,000</option>
        </select>
      </div>

      {/* 7. Key Amenities */}
      <div className="filter-group">
        <div className="filter-title">Popular Amenities</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            'Wi-Fi',
            'Food',
            '24x7 Power Backup',
            'RO Drinking Water',
            'CCTV Security',
            'Washing Machine',
            'Bike Parking',
            'Attached bathroom',
          ].map((a) => {
            const isChecked = filters.amenities?.some((item) => item.toLowerCase() === a.toLowerCase()) ?? false;
            return (
              <label className="check" key={a} style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    const current = filters.amenities ?? [];
                    const next = e.target.checked
                      ? [...current, a]
                      : current.filter((item) => item.toLowerCase() !== a.toLowerCase());
                    updateFilter('amenities', next);
                  }}
                />
                <span>{a}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Reset Button */}
      <button
        className="btn outline small"
        style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        onClick={resetAllFilters}
      >
        <RotateCcw size={14} /> Reset all filters
      </button>
    </>
  );

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      {/* =======================================================
          TOP SEARCH & DISCOVERY HERO
          ======================================================= */}
      <div style={{ padding: '28px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#687b73', marginBottom: 8 }}>
          <MapPin size={15} color="#176b58" />
          <span>Samastipur, Bihar · Live Verified Listings</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1.5px', color: 'var(--ink)' }}>
          Find Rooms & PGs in <em className="title-accent">Samastipur</em>
        </h1>

        {/* Global Live Search Bar */}
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', maxWidth: 740, marginBottom: 16 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <SearchIcon
              size={20}
              color="#176b58"
              style={{ position: 'absolute', left: 16, pointerEvents: 'none' }}
            />
            <input
              type="text"
              className="input"
              style={{
                height: 52,
                paddingLeft: 48,
                paddingRight: searchInput ? 80 : 20,
                fontSize: 16,
                borderRadius: 16,
                border: '1.5px solid #d5e2d9',
                boxShadow: '0 6px 20px rgba(24, 51, 45, 0.05)',
              }}
              placeholder="Search by area, PG name, or landmark (e.g. Musrigharari, Station)..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                updateFilter('q', e.target.value);
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: 14,
                  border: 0,
                  background: '#e9f1ec',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#465f54',
                  cursor: 'pointer',
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </form>

        {/* Quick Filter Pill Buttons */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, flexWrap: 'wrap' }}>
          <button
            className={`pill ${!filters.q && !filters.accommodation && !filters.brokerage && filters.max === 12000 ? 'selected' : ''}`}
            onClick={resetAllFilters}
          >
            All Stays
          </button>
          <button
            className={`pill ${filters.brokerage ? 'selected' : ''}`}
            onClick={() => updateFilter('brokerage', !filters.brokerage)}
          >
            ⚡ Zero Brokerage
          </button>
          <button
            className={`pill ${filters.max === 4000 ? 'selected' : ''}`}
            onClick={() => updateFilter('max', filters.max === 4000 ? 12000 : 4000)}
          >
            Under ₹4,000
          </button>
          <button
            className={`pill ${filters.max === 6000 ? 'selected' : ''}`}
            onClick={() => updateFilter('max', filters.max === 6000 ? 12000 : 6000)}
          >
            Under ₹6,000
          </button>
          <button
            className={`pill ${filters.accommodation === '2 Sharing' ? 'selected' : ''}`}
            onClick={() => updateFilter('accommodation', filters.accommodation === '2 Sharing' ? '' : '2 Sharing')}
          >
            👥 2 Sharing
          </button>
          <button
            className={`pill ${filters.accommodation === 'Private room' ? 'selected' : ''}`}
            onClick={() => updateFilter('accommodation', filters.accommodation === 'Private room' ? '' : 'Private room')}
          >
            🛏️ Private Room
          </button>
          <button
            className={`pill ${filters.food === 'included' ? 'selected' : ''}`}
            onClick={() => updateFilter('food', filters.food === 'included' ? 'any' : 'included')}
          >
            🍽️ Meals Included
          </button>
        </div>

        {/* Active Filter Removable Tags Strip */}
        {activeFilterList.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e8ece8' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#687c73' }}>
              Active filters ({activeFilterList.length}):
            </span>
            {activeFilterList.map((f, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: '#eaf4ee',
                  color: '#166534',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid #bbf7d0',
                }}
              >
                {f.label}
                <button
                  type="button"
                  onClick={() => updateFilter(f.key, f.clearVal)}
                  style={{ border: 0, background: 'transparent', color: '#166534', cursor: 'pointer', padding: 0 }}
                  title="Remove filter"
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              onClick={resetAllFilters}
              style={{
                border: 0,
                background: 'transparent',
                color: '#dc2626',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                marginLeft: 4,
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* =======================================================
          MAIN 2-COLUMN SEARCH LAYOUT
          ======================================================= */}
      <div className="search-layout">
        {/* Desktop Sticky Sidebar */}
        <aside className="filters" style={{ width: 280, borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <b style={{ fontSize: 16 }}>Filters & Preferences</b>
            <SlidersHorizontal size={17} color="var(--green)" />
          </div>
          {filterControls}
        </aside>

        {/* Results Stream */}
        <section style={{ minWidth: 0 }}>
          {/* Results Header: Count & Sort */}
          <div className="results-head" style={{ marginBottom: 20 }}>
            <div>
              <b style={{ fontSize: 18, color: 'var(--ink)' }}>
                {busy
                  ? 'Searching properties…'
                  : properties.length === 1
                  ? '1 verified room found'
                  : `${properties.length} verified rooms found`}
              </b>
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                {filters.q ? `Matching "${filters.q}" across Samastipur` : 'All prices include estimated monthly utility breakdown'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                Sort by:
              </span>
              <select
                className="select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ width: 175, height: 42, fontSize: 13.5, fontWeight: 600, borderRadius: 10 }}
              >
                <option value="best">Best match</option>
                <option value="cost">Rent: Low to High</option>
                <option value="price-desc">Rent: High to Low</option>
                <option value="closest">Closest to Station</option>
                <option value="movein">Lowest move-in cost</option>
                <option value="rating">Highest rated</option>
                <option value="newest">Recently updated</option>
              </select>
            </div>
          </div>

          {/* Mobile Filter Trigger Bar */}
          <div className="mobile-filterbar" style={{ display: 'none' }}>
            <button
              className="btn outline small"
              onClick={() => setMobileFilters(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Filter size={15} /> Filters {activeFilterList.length > 0 && `(${activeFilterList.length})`}
            </button>
            <span className="muted" style={{ marginLeft: 'auto', fontSize: 13 }}>
              {properties.length} rooms
            </span>
          </div>

          {/* Property Cards Grid */}
          <div className="property-grid">
            {busy
              ? [1, 2, 3].map((n) => (
                  <div className="property-card" key={n} style={{ borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ height: 200, background: '#eef2ee' }} />
                    <div className="property-body" style={{ padding: 18 }}>
                      <div style={{ height: 18, width: '60%', background: '#eef2ee', borderRadius: 6 }} />
                      <div style={{ height: 14, width: '40%', marginTop: 12, background: '#f4f6f4', borderRadius: 6 }} />
                      <div style={{ height: 24, width: '30%', marginTop: 20, background: '#eef2ee', borderRadius: 6 }} />
                    </div>
                  </div>
                ))
              : properties.map((p) => (
                  <div key={p.id}>
                    <PropertyCard
                      property={p}
                      saved={saved.includes(p.id)}
                      onSave={() => toggleSave(p.id)}
                    />
                    <button
                      className={`pill ${compare.includes(p.id) ? 'selected' : ''}`}
                      style={{ marginTop: 8, width: '100%', fontSize: 12, padding: '6px 12px' }}
                      onClick={() => toggleCompare(p.id)}
                    >
                      {compare.includes(p.id) ? '✓ Added to compare' : '＋ Compare'}
                    </button>
                  </div>
                ))}
          </div>

          {/* Empty State */}
          {!busy && properties.length === 0 && (
            <div
              className="empty"
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                background: '#fafbf9',
                border: '1.5px dashed #cddad2',
                borderRadius: 20,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#eaf4ee',
                  color: '#166534',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <SearchIcon size={26} />
              </div>

              <h3 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
                No rooms found matching your search.
              </h3>
              <p className="muted" style={{ maxWidth: 460, margin: '0 auto 20px', fontSize: 14 }}>
                We couldn&apos;t find any properties matching your current filters or query{' '}
                {filters.q ? <b>&quot;{filters.q}&quot;</b> : ''}. Try broadening your search or resetting filters.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn" onClick={resetAllFilters}>
                  <RotateCcw size={16} /> Clear All Filters
                </button>
                <Link href="/list-property" className="btn outline">
                  + List a Property in Samastipur
                </Link>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e7efe9' }}>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  Quick adjustments:
                </span>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                  <button className="pill small" onClick={() => updateFilter('max', 12000)}>
                    Any budget
                  </button>
                  <button className="pill small" onClick={() => updateFilter('accommodation', '')}>
                    Any room type
                  </button>
                  <button className="pill small" onClick={() => updateFilter('amenities', [])}>
                    Clear amenity filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Floating Compare Bar */}
      {compare.length > 0 && (
        <button className="compare-float" onClick={() => router.push('/compare')}>
          Compare {compare.length} room{compare.length > 1 ? 's' : ''} →
        </button>
      )}

      {/* Mobile Filters Modal Bottom Sheet */}
      {mobileFilters && (
        <Modal title="Filters & Preferences" onClose={() => setMobileFilters(false)}>
          <div className="mobile-modal-filters" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: 4 }}>
            {filterControls}
            <button
              className="btn"
              style={{ width: '100%', marginTop: 20, height: 46 }}
              onClick={() => setMobileFilters(false)}
            >
              Show {properties.length} Rooms
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
