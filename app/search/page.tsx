'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Filter,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
  Sparkles,
  RotateCcw,
  Compass,
  ChevronDown,
} from 'lucide-react';
import { getProperties, type PropertyFilters } from '@/lib/services/propertyService';
import type { Property } from '@/lib/mock-data/types';
import { mockAmenities } from '@/lib/mock-data/amenities';
import { getAmenities } from '@/lib/services/catalogService';
import { PropertyCard, PropertyCardSkeleton } from '@/components/PropertyCard';
import { Modal } from '@/components/Modal';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import {
  extractLiveLocationFacets,
  getLiveSubAreasForPin,
} from '@/lib/services/dynamicLocationService';

const defaultFilters: PropertyFilters = {
  q: '',
  area: '',
  pincode: '',
  searchLat: undefined,
  searchLng: undefined,
  searchPlaceName: undefined,
  maxRadiusKm: undefined,
  nearMe: false,
  userLat: undefined,
  userLng: undefined,
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
  const { savedIds: saved, toggleSave } = useAuth();
  const [amenityOptions, setAmenityOptions] = useState<string[]>(mockAmenities);
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);
  const [selectedCity, setSelectedCity] = useState<string>('Samastipur');
  const [sort, setSort] = useState('best');
  const [properties, setProperties] = useState<Property[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [busy, setBusy] = useState(true);

  const router = useRouter();

  // Load initial catalog data & URL params
  useEffect(() => {
    getAmenities().then(setAmenityOptions);

    const p = new URLSearchParams(window.location.search);
    const initialCity = p.get('city') || 'Samastipur';
    setSelectedCity(initialCity);
    const initialQuery = p.get('q') || '';
    const initialArea = p.get('area') || '';
    const initialPin = p.get('pincode') || '';
    const searchPlace = p.get('searchPlace') || undefined;
    const searchLat = p.get('searchLat') ? Number(p.get('searchLat')) : undefined;
    const searchLng = p.get('searchLng') ? Number(p.get('searchLng')) : undefined;
    const maxRadius = p.get('maxDist') ? Number(p.get('maxDist')) : undefined;
    const isNearMe = p.get('nearMe') === 'true';

    setFilters({
      ...defaultFilters,
      q: initialQuery,
      area: initialArea,
      pincode: initialPin,
      searchPlaceName: searchPlace,
      searchLat,
      searchLng,
      maxRadiusKm: maxRadius,
      nearMe: isNearMe,
      userLat: p.get('lat') ? Number(p.get('lat')) : undefined,
      userLng: p.get('lng') ? Number(p.get('lng')) : undefined,
      min: p.get('min') ? Number(p.get('min')) : 0,
      max: p.get('max') ? Number(p.get('max')) : 12000,
      accommodation: p.get('accommodation') || '',
      type: p.get('type') || '',
      food: p.get('food') || 'any',
      deposit: p.get('deposit') || 'any',
      brokerage: p.get('brokerage') === 'true',
      verifiedOnly: p.get('verifiedOnly') === 'true',
      amenities: p.get('amenities') ? p.get('amenities')!.split(',').filter(Boolean) : [],
    });

    setCompare(getStorageItem('roomsaathi_compare', []));
  }, []);

  // Fetch properties with debounce
  useEffect(() => {
    let alive = true;
    setBusy(true);
    const timer = setTimeout(() => {
      getProperties(filters, sort)
        .then((data) => {
          if (alive) {
            setProperties(Array.isArray(data) ? data : []);
            setBusy(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load properties:', err);
          if (alive) {
            setProperties([]);
            setBusy(false);
          }
        });
    }, 200);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filters, sort]);

  // Compute live facets from loaded properties
  const inventory = useMemo(() => extractLiveLocationFacets(properties || []), [properties]);

  // Sub-areas under active PIN code
  const activePinSubAreas = useMemo(() => {
    if (!filters.pincode) return [];
    return getLiveSubAreasForPin(String(filters.pincode), properties || []);
  }, [filters.pincode, properties]);

  // Sync state to URL
  const syncToUrl = (nextFilters: PropertyFilters) => {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([k, v]) => {
      if (
        v !== undefined &&
        v !== '' &&
        v !== 'any' &&
        v !== false &&
        !(k === 'min' && v === 0) &&
        !(k === 'max' && v === 12000) &&
        !(Array.isArray(v) && !v.length)
      ) {
        if (k === 'searchPlaceName') params.set('searchPlace', String(v));
        else if (k === 'maxRadiusKm') params.set('maxDist', String(v));
        else if (k === 'userLat') params.set('lat', String(v));
        else if (k === 'userLng') params.set('lng', String(v));
        else params.set(k, Array.isArray(v) ? v.join(',') : String(v));
      }
    });

    const queryString = params.toString();
    router.replace(`/search${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    syncToUrl(next);
  };

  const updateMultipleFilters = (updates: Partial<PropertyFilters>) => {
    const next = { ...filters, ...updates };
    setFilters(next);
    syncToUrl(next);
  };

  const resetAllFilters = () => {
    setFilters(defaultFilters);
    router.replace('/search');
  };

  const toggleCompare = (id: string) => {
    const next = compare.includes(id)
      ? compare.filter((x) => x !== id)
      : compare.length < 3
      ? [...compare, id]
      : compare;
    setCompare(next);
    setStorageItem('roomsaathi_compare', next);
  };

  // Active filter tags
  const activeFilterList = useMemo(() => {
    const list: { key: keyof PropertyFilters; label: string; clearVal: any }[] = [];
    if (filters.searchPlaceName) {
      list.push({
        key: 'searchPlaceName',
        label: `📍 Near "${filters.searchPlaceName}"`,
        clearVal: undefined,
      });
    }
    if (filters.nearMe) {
      list.push({
        key: 'nearMe',
        label: `📍 GPS Near Me (<${filters.maxRadiusKm || 5}km)`,
        clearVal: false,
      });
    }
    if (filters.area) {
      list.push({ key: 'area', label: `📍 ${filters.area}`, clearVal: '' });
    }
    if (filters.pincode) {
      list.push({ key: 'pincode', label: `📮 PIN ${filters.pincode}`, clearVal: '' });
    }
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

  // Sidebar Controls
  const filterControls = (
    <>
      {/* 1. Distance Radius if place or Near Me active */}
      {(filters.searchLat || filters.nearMe) && (
        <div className="filter-group">
          <div className="filter-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Search Distance Radius</span>
            <Compass size={14} color="#059669" />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[3, 5, 10, 20].map((km) => (
              <button
                key={km}
                type="button"
                className={`pill small ${filters.maxRadiusKm === km ? 'selected' : ''}`}
                style={{ padding: '4px 9px', fontSize: 11.5 }}
                onClick={() => updateFilter('maxRadiusKm', filters.maxRadiusKm === km ? undefined : km)}
              >
                &lt; {km} km
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Dynamic Active Neighborhoods in DB */}
      {inventory.areas.length > 0 && (
        <div className="filter-group">
          <div className="filter-title">Popular Localities</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {inventory.areas.map((a) => {
              const isSelected = (filters.area || '').toLowerCase() === a.name.toLowerCase();
              return (
                <button
                  key={a.name}
                  type="button"
                  className={`pill small ${isSelected ? 'selected' : ''}`}
                  style={{ padding: '4px 9px', fontSize: 11.5 }}
                  onClick={() => updateFilter('area', isSelected ? '' : a.name)}
                >
                  {a.name} ({a.count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Monthly Budget */}
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

      {/* 4. Room Sharing */}
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

      {/* 5. Property Category */}
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

      {/* 6. Trust & Savings */}
      <div className="filter-group">
        <div className="filter-title">Trust & Savings</div>
        <label className="check" style={{ cursor: 'pointer', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={!!filters.brokerage}
            onChange={(e) => updateFilter('brokerage', e.target.checked)}
          />
          <span style={{ fontWeight: 600, color: '#166534' }}>⚡ Zero Brokerage</span>
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

      {/* 7. Food / Meals */}
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

      {/* 8. Amenities */}
      <div className="filter-group">
        <div className="filter-title">Amenities</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['Wi-Fi', 'Food', '24x7 Power Backup', 'RO Drinking Water', 'CCTV Security', 'Washing Machine', 'Bike Parking', 'Attached bathroom'].map((a) => {
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
      {/* Top Header */}
      <div style={{ padding: '28px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#687b73', marginBottom: 8 }}>
          <MapPin size={15} color="#176b58" />
          <span>Verified Rooms & PGs Across {selectedCity || 'Town'}</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1.5px', color: 'var(--ink)' }}>
          Find Rooms & PGs <em className="title-accent">Near You</em>
        </h1>

        {/* Live Active Spot / GPS Mode Alert */}
        {(filters.searchPlaceName || filters.nearMe) && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Compass size={16} />
              </div>
              <div>
                <b style={{ color: '#064e3b', fontSize: 13.5 }}>
                  {filters.searchPlaceName
                    ? `Showing stays within distance of "${filters.searchPlaceName}"`
                    : 'GPS Near Me Discovery Active'}
                </b>
                <div style={{ color: '#059669', fontSize: 12 }}>
                  Sorted by actual straight-line road distance
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>Radius:</span>
              {[3, 5, 10, 20].map((km) => (
                <button
                  key={km}
                  type="button"
                  className={`pill small ${filters.maxRadiusKm === km ? 'selected' : ''}`}
                  style={{ padding: '3px 9px', fontSize: 11 }}
                  onClick={() => updateFilter('maxRadiusKm', filters.maxRadiusKm === km ? undefined : km)}
                >
                  &lt; {km} km
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateMultipleFilters({
                    searchLat: undefined,
                    searchLng: undefined,
                    searchPlaceName: undefined,
                    nearMe: false,
                    maxRadiusKm: undefined,
                  })
                }
                style={{
                  border: 'none',
                  background: '#fee2e2',
                  color: '#b91c1c',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 4,
                }}
              >
                Clear Spot
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Sub-Area Ribbon for Active PIN */}
        {filters.pincode && activePinSubAreas.length > 0 && (
          <div
            style={{
              background: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>
              📮 Active Areas in PIN {filters.pincode}:
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              <button
                type="button"
                className={`pill ${!filters.area ? 'selected' : ''}`}
                style={{ fontSize: 12, padding: '5px 12px' }}
                onClick={() => updateFilter('area', '')}
              >
                All in PIN {filters.pincode}
              </button>
              {activePinSubAreas.map((sa) => {
                const isSelected = (filters.area || '').toLowerCase() === sa.name.toLowerCase();
                return (
                  <button
                    key={sa.name}
                    type="button"
                    className={`pill ${isSelected ? 'selected' : ''}`}
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => updateFilter('area', isSelected ? '' : sa.name)}
                  >
                    {sa.name} ({sa.count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Filter Pill Buttons */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, flexWrap: 'wrap' }}>
          <button
            className={`pill ${!filters.q && !filters.area && !filters.pincode && !filters.searchLat && !filters.nearMe && !filters.accommodation && !filters.brokerage && filters.max === 12000 ? 'selected' : ''}`}
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

      {/* 2-Column Search Layout */}
      <div className="search-layout">
        <aside className="filters" style={{ width: 280, borderRadius: 18, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <b style={{ fontSize: 16 }}>Filters & Preferences</b>
            <SlidersHorizontal size={17} color="var(--green)" />
          </div>
          {filterControls}
        </aside>

        {/* Results Stream */}
        <section style={{ minWidth: 0 }}>
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
                {filters.searchPlaceName
                  ? `Showing properties sorted by distance to "${filters.searchPlaceName}"`
                  : filters.nearMe
                  ? 'Sorted by distance from your current location'
                  : filters.area
                  ? `Showing listings in ${filters.area}`
                  : filters.q
                  ? `Matching "${filters.q}"`
                  : 'All prices include estimated monthly utility breakdown'}
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
                <option value="closest">Closest distance</option>
                <option value="cost">Rent: Low to High</option>
                <option value="price-desc">Rent: High to Low</option>
                <option value="movein">Lowest move-in cost</option>
                <option value="rating">Highest rated</option>
                <option value="newest">Recently updated</option>
              </select>
            </div>
          </div>

          {/* Mobile Filter Trigger */}
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

          {/* Cards Grid */}
          <div className="property-grid">
            {busy
              ? [1, 2, 3, 4, 5, 6].map((n) => (
                  <PropertyCardSkeleton key={n} />
                ))
              : (properties || []).map((p) => (
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
                {filters.searchPlaceName
                  ? `No verified listings found within ${filters.maxRadiusKm || 5} km of "${filters.searchPlaceName}". Try increasing search radius.`
                  : filters.area
                  ? `No verified listings currently in ${filters.area}.`
                  : filters.q
                  ? `No listings matching "${filters.q}".`
                  : 'Try broadening your budget or clearing filters.'}
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn" onClick={resetAllFilters}>
                  <RotateCcw size={16} /> Clear All Filters
                </button>
                <Link href="/list-property" className="btn outline">
                  + List a Property Here
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {compare.length > 0 && (
        <button className="compare-float" onClick={() => router.push('/compare')}>
          Compare {compare.length} room{compare.length > 1 ? 's' : ''} →
        </button>
      )}

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
