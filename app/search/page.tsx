'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
  RotateCcw,
  Crosshair,
  Train,
  Bus,
  GraduationCap,
  Hospital,
  ChevronRight,
} from 'lucide-react';
import { getProperties, type PropertyFilters } from '@/lib/services/propertyService';
import type { Property } from '@/lib/mock-data/types';
import { mockDestinations } from '@/lib/mock-data/destinations';
import { mockAmenities } from '@/lib/mock-data/amenities';
import { getDestinations, getAmenities, type Destination } from '@/lib/services/catalogService';
import { PropertyCard } from '@/components/PropertyCard';
import { Modal } from '@/components/Modal';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import {
  SAMASTIPUR_LANDMARKS,
  PINCODE_CLUSTERS,
  getSubAreasForPincode,
  getLiveDeviceCoordinates,
} from '@/lib/locationData';

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
  pincode: undefined,
  subArea: undefined,
  landmarkId: undefined,
  nearMe: false,
  userLat: undefined,
  userLng: undefined,
  maxDistanceKm: undefined,
  stationMaxKm: undefined,
  busStandMaxKm: undefined,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locating, setLocating] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load initial catalog data & URL params
  useEffect(() => {
    getDestinations().then(setDestinations);
    getAmenities().then(setAmenityOptions);

    const p = new URLSearchParams(window.location.search);
    const initialQuery = p.get('q') || '';
    const initialPin = p.get('pincode') || undefined;
    const initialSubArea = p.get('subArea') || undefined;
    const initialLandmark = p.get('landmark') || undefined;
    const isNearMe = p.get('nearMe') === 'true';

    setSearchInput(initialQuery || initialPin || initialSubArea || '');

    setFilters({
      ...defaultFilters,
      q: initialQuery,
      pincode: initialPin,
      subArea: initialSubArea,
      landmarkId: initialLandmark,
      nearMe: isNearMe,
      userLat: p.get('lat') ? Number(p.get('lat')) : undefined,
      userLng: p.get('lng') ? Number(p.get('lng')) : undefined,
      maxDistanceKm: p.get('maxDist') ? Number(p.get('maxDist')) : undefined,
      stationMaxKm: p.get('stationMaxKm') ? Number(p.get('stationMaxKm')) : undefined,
      busStandMaxKm: p.get('busStandMaxKm') ? Number(p.get('busStandMaxKm')) : undefined,
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

  // Close autocomplete dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    }, 200);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filters, sort]);

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
        !(k === 'distance' && v === 60) &&
        !(Array.isArray(v) && !v.length)
      ) {
        if (k === 'landmarkId') params.set('landmark', String(v));
        else if (k === 'userLat') params.set('lat', String(v));
        else if (k === 'userLng') params.set('lng', String(v));
        else if (k === 'maxDistanceKm') params.set('maxDist', String(v));
        else params.set(k, Array.isArray(v) ? v.join(',') : String(v));
      }
    });

    const queryString = params.toString();
    router.replace(`/search${queryString ? `?${queryString}` : ''}`, { scroll: false });
  };

  // Update specific filter property
  const updateFilter = (key: keyof PropertyFilters, value: any) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    syncToUrl(next);
  };

  // Update multiple filters atomically
  const updateMultipleFilters = (updates: Partial<PropertyFilters>) => {
    const next = { ...filters, ...updates };
    setFilters(next);
    syncToUrl(next);
  };

  // Trigger Near Me GPS
  const handleNearMeTrigger = async () => {
    setLocating(true);
    try {
      const coords = await getLiveDeviceCoordinates();
      setLocating(false);
      setIsDropdownOpen(false);
      if (coords) {
        updateMultipleFilters({
          nearMe: true,
          userLat: coords.latitude,
          userLng: coords.longitude,
          maxDistanceKm: 5,
        });
      } else {
        // Fallback coordinates for Central Samastipur
        updateMultipleFilters({
          nearMe: true,
          userLat: 25.8631,
          userLng: 85.7812,
          maxDistanceKm: 5,
        });
      }
    } catch {
      setLocating(false);
    }
  };

  // Form submit
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    const q = searchInput.trim();

    if (/^\d{6}$/.test(q)) {
      updateMultipleFilters({ pincode: q, subArea: undefined, q: '' });
    } else {
      updateFilter('q', q);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateMultipleFilters({ q: '', pincode: undefined, subArea: undefined, landmarkId: undefined });
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
    const next = compare.includes(id)
      ? compare.filter((x) => x !== id)
      : compare.length < 3
      ? [...compare, id]
      : compare;
    setCompare(next);
    setStorageItem('roomsaathi_compare', next);
  };

  // Identify active PIN code from either filters or search input
  const activePincode = useMemo(() => {
    if (filters.pincode) return filters.pincode;
    const match = searchInput.trim().match(/\b(848\d{3})\b/);
    if (match) return match[1];
    return null;
  }, [filters.pincode, searchInput]);

  // Compute sub-areas for active PIN code
  const subAreasForPincode = useMemo(() => {
    if (!activePincode) return [];
    return getSubAreasForPincode(activePincode, properties);
  }, [activePincode, properties]);

  // Autocomplete matching lists
  const qClean = searchInput.toLowerCase().trim();
  const matchingLandmarks = SAMASTIPUR_LANDMARKS.filter(
    (l) =>
      !qClean ||
      l.name.toLowerCase().includes(qClean) ||
      l.shortName.toLowerCase().includes(qClean)
  );
  const matchingPincodes = Object.values(PINCODE_CLUSTERS).filter(
    (p) =>
      !qClean ||
      p.pincode.includes(qClean) ||
      p.regionName.toLowerCase().includes(qClean) ||
      p.subAreas.some((sa) => sa.toLowerCase().includes(qClean))
  );

  // Active filters list for removable tags
  const activeFilterList = useMemo(() => {
    const list: { key: keyof PropertyFilters; label: string; clearVal: any }[] = [];
    if (filters.pincode) {
      list.push({ key: 'pincode', label: `📮 PIN ${filters.pincode}`, clearVal: undefined });
    }
    if (filters.subArea) {
      list.push({ key: 'subArea', label: `📍 Area: ${filters.subArea}`, clearVal: undefined });
    }
    if (filters.nearMe) {
      list.push({
        key: 'nearMe',
        label: `📍 Near Me ${filters.maxDistanceKm ? `(<${filters.maxDistanceKm}km)` : ''}`,
        clearVal: false,
      });
    }
    if (filters.landmarkId) {
      const lm = SAMASTIPUR_LANDMARKS.find((l) => l.id === filters.landmarkId);
      list.push({ key: 'landmarkId', label: `🏛️ ${lm ? lm.shortName : filters.landmarkId}`, clearVal: undefined });
    }
    if (filters.stationMaxKm) {
      list.push({ key: 'stationMaxKm', label: `🚉 Station < ${filters.stationMaxKm} km`, clearVal: undefined });
    }
    if (filters.busStandMaxKm) {
      list.push({ key: 'busStandMaxKm', label: `🚌 Bus Stand < ${filters.busStandMaxKm} km`, clearVal: undefined });
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

  // Sidebar Controls JSX
  const filterControls = (
    <>
      {/* 1. Pillar 2: GPS Distance (Near Me) */}
      <div className="filter-group">
        <div className="filter-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>GPS &quot;Near Me&quot; Distance</span>
          <Crosshair size={14} color="#059669" />
        </div>
        <button
          type="button"
          onClick={handleNearMeTrigger}
          className="btn outline small"
          style={{
            width: '100%',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: filters.nearMe ? '#ecfdf5' : '#ffffff',
            borderColor: filters.nearMe ? '#10b981' : '#cbd5e1',
            color: filters.nearMe ? '#065f46' : '#334155',
            fontWeight: 600,
          }}
        >
          <Crosshair size={14} /> {locating ? 'Locating...' : filters.nearMe ? '✓ GPS Near Me Active' : '📍 Detect My Location'}
        </button>

        {filters.nearMe && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[3, 5, 10, 15].map((km) => (
              <button
                key={km}
                type="button"
                className={`pill small ${filters.maxDistanceKm === km ? 'selected' : ''}`}
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => updateFilter('maxDistanceKm', filters.maxDistanceKm === km ? undefined : km)}
              >
                &lt; {km} km
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Pillar 1: Transit & Station Proximity */}
      <div className="filter-group">
        <div className="filter-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Transit Proximity</span>
          <Train size={14} color="#0f766e" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 5 }}>
            Distance to Samastipur Jn Station:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((km) => (
              <button
                key={km}
                type="button"
                className={`pill small ${filters.stationMaxKm === km ? 'selected' : ''}`}
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => updateFilter('stationMaxKm', filters.stationMaxKm === km ? undefined : km)}
              >
                &lt; {km} km
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 5 }}>
            Distance to Govt Bus Stand:
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((km) => (
              <button
                key={km}
                type="button"
                className={`pill small ${filters.busStandMaxKm === km ? 'selected' : ''}`}
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => updateFilter('busStandMaxKm', filters.busStandMaxKm === km ? undefined : km)}
              >
                &lt; {km} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Landmark Hub Select */}
      <div className="filter-group">
        <div className="filter-title">Primary Landmark Hub</div>
        <select
          className="select"
          value={filters.landmarkId ?? 'any'}
          onChange={(e) => updateFilter('landmarkId', e.target.value === 'any' ? undefined : e.target.value)}
        >
          <option value="any">Any landmark</option>
          {SAMASTIPUR_LANDMARKS.map((lm) => (
            <option key={lm.id} value={lm.id}>
              {lm.name}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Monthly Budget */}
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

      {/* 5. Room Sharing / Accommodation */}
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

      {/* 6. Property Category */}
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

      {/* 7. Brokerage & Trust */}
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

      {/* 8. Food / Mess Option */}
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

      {/* 9. Security Deposit */}
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

      {/* 10. Key Amenities */}
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
      {/* Top Header */}
      <div style={{ padding: '28px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#687b73', marginBottom: 8 }}>
          <MapPin size={15} color="#176b58" />
          <span>Samastipur, Bihar · 3-Pillar Room Discovery</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1.5px', color: 'var(--ink)' }}>
          Rooms & PGs in <em className="title-accent">Samastipur</em>
        </h1>

        {/* Global Live Omni-Search Bar with Grouped Autocomplete */}
        <div style={{ position: 'relative', maxWidth: 740, marginBottom: 16 }} ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
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
                paddingRight: searchInput ? 130 : 100,
                fontSize: 15,
                borderRadius: 16,
                border: '1.5px solid #d5e2d9',
                boxShadow: '0 6px 20px rgba(24, 51, 45, 0.05)',
              }}
              placeholder="Search PIN (848101), landmark (Station, College), or area..."
              value={searchInput}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setIsDropdownOpen(true);
              }}
            />

            {/* In-bar 1-Tap Near Me & Clear */}
            <div style={{ position: 'absolute', right: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    border: 0,
                    background: '#e9f1ec',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#465f54',
                    cursor: 'pointer',
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={handleNearMeTrigger}
                style={{
                  background: filters.nearMe ? '#ecfdf5' : '#f1f5f9',
                  border: `1px solid ${filters.nearMe ? '#a7f3d0' : '#cbd5e1'}`,
                  borderRadius: 10,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: filters.nearMe ? '#065f46' : '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Crosshair size={13} color="#059669" /> {locating ? '...' : 'Near Me'}
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown in Search Page */}
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 6,
                background: '#ffffff',
                borderRadius: 14,
                boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                zIndex: 50,
                maxHeight: 380,
                overflowY: 'auto',
                padding: '10px 0',
              }}
            >
              {/* Near Me Row */}
              <div style={{ padding: '0 10px 8px' }}>
                <button
                  type="button"
                  onClick={handleNearMeTrigger}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: 10,
                    color: '#065f46',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Crosshair size={16} />
                  <span>{locating ? 'Detecting your GPS location...' : 'Use My Current GPS Location (Near Me)'}</span>
                </button>
              </div>

              {/* Landmarks */}
              {matchingLandmarks.length > 0 && (
                <div style={{ padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', padding: '4px 16px 6px' }}>
                    🏛️ Landmarks & Stations
                  </div>
                  {matchingLandmarks.map((lm) => (
                    <button
                      key={lm.id}
                      type="button"
                      onClick={() => {
                        updateMultipleFilters({ landmarkId: lm.id, pincode: undefined, subArea: undefined, q: '' });
                        setSearchInput(lm.name);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        color: '#1e293b',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{lm.category === 'transit' ? '🚉' : lm.category === 'college' ? '🎓' : '🏥'}</span>
                        <span style={{ fontWeight: 600 }}>{lm.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#0f766e' }}>{lm.shortName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* PIN Code Clusters */}
              {matchingPincodes.length > 0 && (
                <div style={{ padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', padding: '4px 16px 6px' }}>
                    📮 PIN Codes & Mohallahs
                  </div>
                  {matchingPincodes.map((cluster) => (
                    <div key={cluster.pincode}>
                      <button
                        type="button"
                        onClick={() => {
                          updateMultipleFilters({ pincode: cluster.pincode, subArea: undefined, landmarkId: undefined, q: '' });
                          setSearchInput(`PIN ${cluster.pincode}`);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 16px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: 13,
                          color: '#1e293b',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📮</span>
                          <span style={{ fontWeight: 700, color: '#0284c7' }}>PIN {cluster.pincode}</span>
                          <span style={{ color: '#475569' }}>· {cluster.regionName}</span>
                        </div>
                        <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4 }}>
                          Cluster
                        </span>
                      </button>
                      <div style={{ padding: '2px 16px 8px 36px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {cluster.subAreas.slice(0, 5).map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateMultipleFilters({ pincode: cluster.pincode, subArea: sub, landmarkId: undefined, q: '' });
                              setSearchInput(sub);
                              setIsDropdownOpen(false);
                            }}
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              color: '#334155',
                              cursor: 'pointer',
                            }}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* =======================================================
            PILLAR 3: SUB-AREA PROGRESSIVE CHIP RIBBON
            Shown whenever a PIN code is searched or active!
            ======================================================= */}
        {activePincode && (
          <div
            style={{
              background: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 16,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15 }}>📮</span>
                <b style={{ color: '#0369a1', fontSize: 13.5 }}>
                  Sub-Areas in PIN {activePincode}{' '}
                  {PINCODE_CLUSTERS[activePincode] ? `(${PINCODE_CLUSTERS[activePincode].regionName})` : ''}:
                </b>
              </div>
              <span style={{ fontSize: 11.5, color: '#0284c7' }}>
                Tap a neighborhood chip to narrow down
              </span>
            </div>

            {/* Scrollable Sub-Area Chip Ribbon */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'thin',
              }}
            >
              {/* All in this PIN */}
              <button
                type="button"
                className={`pill ${!filters.subArea ? 'selected' : ''}`}
                style={{
                  fontSize: 12,
                  padding: '5px 12px',
                  fontWeight: !filters.subArea ? 700 : 500,
                  whiteSpace: 'nowrap',
                }}
                onClick={() => updateFilter('subArea', undefined)}
              >
                All in {activePincode} ({properties.filter((p) => (p.pincode || '').trim() === activePincode).length})
              </button>

              {/* Sub-area chips */}
              {subAreasForPincode.map(({ name, count }) => {
                const isSelected = (filters.subArea || '').toLowerCase() === name.toLowerCase();
                return (
                  <button
                    key={name}
                    type="button"
                    className={`pill ${isSelected ? 'selected' : ''}`}
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() => updateFilter('subArea', isSelected ? undefined : name)}
                  >
                    {name} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =======================================================
            PILLAR 2: NEAR ME GPS ACTIVE RIBBON
            ======================================================= */}
        {filters.nearMe && (
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Crosshair size={16} />
              </div>
              <div>
                <b style={{ color: '#064e3b', fontSize: 13.5 }}>GPS &quot;Near Me&quot; Discovery Active</b>
                <div style={{ color: '#059669', fontSize: 12 }}>
                  Showing properties sorted by radial distance from your current position
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>Max radius:</span>
              {[3, 5, 10, 20].map((km) => (
                <button
                  key={km}
                  type="button"
                  className={`pill small ${filters.maxDistanceKm === km ? 'selected' : ''}`}
                  style={{ padding: '3px 9px', fontSize: 11 }}
                  onClick={() => updateFilter('maxDistanceKm', filters.maxDistanceKm === km ? undefined : km)}
                >
                  &lt; {km} km
                </button>
              ))}
              <button
                type="button"
                onClick={() => updateMultipleFilters({ nearMe: false, userLat: undefined, userLng: undefined, maxDistanceKm: undefined })}
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
                Exit GPS Mode
              </button>
            </div>
          </div>
        )}

        {/* Quick Filter Pill Buttons */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, flexWrap: 'wrap' }}>
          <button
            className={`pill ${!filters.q && !filters.pincode && !filters.landmarkId && !filters.nearMe && !filters.accommodation && !filters.brokerage && filters.max === 12000 ? 'selected' : ''}`}
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
            className={`pill ${filters.stationMaxKm === 2 ? 'selected' : ''}`}
            onClick={() => updateFilter('stationMaxKm', filters.stationMaxKm === 2 ? undefined : 2)}
          >
            🚉 &lt; 2km to Station
          </button>
          <button
            className={`pill ${filters.pincode === '848101' ? 'selected' : ''}`}
            onClick={() => updateFilter('pincode', filters.pincode === '848101' ? undefined : '848101')}
          >
            📮 PIN 848101
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
                {filters.pincode
                  ? `Showing stays in PIN ${filters.pincode} (${PINCODE_CLUSTERS[filters.pincode]?.regionName || 'Samastipur'})`
                  : filters.nearMe
                  ? 'Sorted by radial distance from your current location'
                  : filters.q
                  ? `Matching "${filters.q}" across Samastipur`
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
                No rooms found matching your criteria.
              </h3>
              <p className="muted" style={{ maxWidth: 460, margin: '0 auto 20px', fontSize: 14 }}>
                {filters.pincode
                  ? `No verified rooms found in PIN ${filters.pincode} ${filters.subArea ? `(${filters.subArea})` : ''} yet.`
                  : filters.nearMe
                  ? 'No rooms found within this distance from your location.'
                  : filters.q
                  ? `No properties matching "${filters.q}".`
                  : 'Try broadening your budget or clearing filters.'}
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
                  Quick suggestions:
                </span>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                  <button className="pill small" onClick={() => updateMultipleFilters({ subArea: undefined, maxDistanceKm: undefined })}>
                    Expand to all in PIN
                  </button>
                  <button className="pill small" onClick={() => updateFilter('max', 12000)}>
                    Any budget
                  </button>
                  <button className="pill small" onClick={() => updateFilter('accommodation', '')}>
                    Any room type
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
