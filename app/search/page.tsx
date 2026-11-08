'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
  Crosshair,
  Compass,
  ChevronDown,
} from 'lucide-react';
import { getProperties, type PropertyFilters } from '@/lib/services/propertyService';
import type { Property } from '@/lib/mock-data/types';
import { mockAmenities } from '@/lib/mock-data/amenities';
import { getAmenities } from '@/lib/services/catalogService';
import { PropertyCard } from '@/components/PropertyCard';
import { Modal } from '@/components/Modal';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import {
  searchPlacesLive,
  getBrowserLocation,
  type GeocodedPlace,
} from '@/lib/services/geocodingService';
import {
  extractLiveLocationFacets,
  getLiveSubAreasForPin,
  getAvailableCities,
  type CityConfig,
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
  const [amenityOptions, setAmenityOptions] = useState<string[]>(mockAmenities);
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);
  const [selectedCity, setSelectedCity] = useState<string>('Samastipur');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('best');
  const [properties, setProperties] = useState<Property[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [busy, setBusy] = useState(true);

  // Available Cities
  const availableCities = useMemo(() => getAvailableCities(properties), [properties]);
  const activeCity = useMemo(
    () => availableCities.find((c) => c.name.toLowerCase() === selectedCity.toLowerCase()) || availableCities[0],
    [availableCities, selectedCity]
  );

  // Live Geocoding State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [geoSuggestions, setGeoSuggestions] = useState<GeocodedPlace[]>([]);
  const [locating, setLocating] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

    setSearchInput(searchPlace || initialArea || initialPin || initialQuery);

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

    setSaved(getStorageItem('roomsaathi_saved_properties', []));
    setCompare(getStorageItem('roomsaathi_compare', []));
  }, []);

  // Close dropdown on click outside
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

  // Live Geocoding Suggestions
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) {
      setGeoSuggestions([]);
      return;
    }

    let alive = true;
    const timer = setTimeout(() => {
      searchPlacesLive(q, activeCity.lat, activeCity.lng).then((places) => {
        if (alive) setGeoSuggestions(places || []);
      }).catch(() => {
        if (alive) setGeoSuggestions([]);
      });
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchInput, activeCity]);

  // Compute live facets from loaded properties
  const inventory = useMemo(() => extractLiveLocationFacets(properties || []), [properties]);

  // Dynamic matching localities
  const matchingAreas = useMemo(() => {
    const q = searchInput.toLowerCase().trim();
    if (!q) return inventory.areas.slice(0, 4);
    return inventory.areas.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 4);
  }, [inventory.areas, searchInput]);

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

  // Near Me Trigger
  const handleNearMeTrigger = async () => {
    setLocating(true);
    try {
      const coords = await getBrowserLocation();
      setLocating(false);
      setIsDropdownOpen(false);
      if (coords) {
        updateMultipleFilters({
          nearMe: true,
          userLat: coords.latitude,
          userLng: coords.longitude,
          searchLat: undefined,
          searchLng: undefined,
          searchPlaceName: undefined,
          maxRadiusKm: 5,
        });
      } else {
        updateMultipleFilters({
          nearMe: true,
          userLat: 25.8631,
          userLng: 85.7812,
          maxRadiusKm: 5,
        });
      }
    } catch {
      setLocating(false);
    }
  };

  // Select Geocoded Place
  const handleSelectPlace = (place: GeocodedPlace) => {
    setSearchInput(place.name);
    setIsDropdownOpen(false);
    updateMultipleFilters({
      searchPlaceName: place.name,
      searchLat: place.latitude,
      searchLng: place.longitude,
      maxRadiusKm: 5,
      area: '',
      pincode: '',
      q: '',
      nearMe: false,
    });
  };

  // Form submit
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDropdownOpen(false);
    const q = searchInput.trim();

    if (/^\d{6}$/.test(q)) {
      updateMultipleFilters({ pincode: q, area: '', searchLat: undefined, searchLng: undefined, q: '' });
    } else {
      updateFilter('q', q);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    updateMultipleFilters({
      q: '',
      area: '',
      pincode: '',
      searchLat: undefined,
      searchLng: undefined,
      searchPlaceName: undefined,
      nearMe: false,
      maxRadiusKm: undefined,
    });
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
          <span>Verified Rooms & PGs Across Town</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-1.5px', color: 'var(--ink)' }}>
          Find Rooms & PGs <em className="title-accent">Near You</em>
        </h1>

        {/* Unified City + Search Bar */}
        <div style={{ position: 'relative', maxWidth: 780, marginBottom: 16, zIndex: 60 }} ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="search-bar-unified">
            {/* 1. City Dropdown Selector */}
            <div className="search-bar-city-btn" title="Select City">
              <MapPin size={17} color="#0f766e" style={{ flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', lineHeight: 1.1 }}>
                  City
                </span>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <select
                    className="search-bar-city-select"
                    value={selectedCity}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setSelectedCity(newCity);
                    }}
                    aria-label="Select City"
                  >
                    {availableCities.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={12}
                    color="#64748b"
                    style={{ position: 'absolute', right: 0, pointerEvents: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Vertical Divider */}
            <div className="search-bar-divider" />

            {/* 3. Search Input Field */}
            <div className="search-bar-input-wrap">
              <SearchIcon
                size={18}
                color="#94a3b8"
                style={{ position: 'absolute', left: 4, pointerEvents: 'none' }}
              />
              <input
                type="text"
                className="search-bar-input"
                placeholder={`Search landmark, college, street, or PIN in ${selectedCity}...`}
                value={searchInput}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setIsDropdownOpen(true);
                }}
              />

              {/* Inside Input Actions: Clear & Near Me */}
              <div style={{ position: 'absolute', right: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      color: '#64748b',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNearMeTrigger}
                  style={{
                    background: filters.nearMe ? '#ecfdf5' : '#f1f5f9',
                    border: `1px solid ${filters.nearMe ? '#a7f3d0' : '#cbd5e1'}`,
                    borderRadius: 8,
                    padding: '5px 9px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: filters.nearMe ? '#065f46' : '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    whiteSpace: 'nowrap',
                  }}
                  title="Discover rooms near your location"
                >
                  <Crosshair size={12} color="#059669" /> {locating ? '...' : 'Near Me'}
                </button>
              </div>
            </div>

            {/* 4. Search CTA Button */}
            <button
              type="submit"
              className="search-bar-btn"
            >
              <SearchIcon size={16} /> Search
            </button>
          </form>

          {/* Autocomplete Dropdown - Positioned directly below the search bar */}
          {isDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: '#ffffff',
                borderRadius: 14,
                boxShadow: '0 20px 45px -4px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                zIndex: 100,
                maxHeight: 380,
                overflowY: 'auto',
                padding: '10px 0',
              }}
            >
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
                  <span>{locating ? 'Detecting your GPS position...' : 'Use My Current Location (Near Me)'}</span>
                </button>
              </div>

              {/* Dynamic Database Neighborhoods */}
              {matchingAreas.length > 0 && (
                <div style={{ padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0f766e', padding: '4px 16px 6px' }}>
                    {searchInput ? '📍 Matching Localities' : '🏠 Popular Localities'}
                  </div>
                  {matchingAreas.map((a) => (
                    <button
                      key={a.name}
                      type="button"
                      onClick={() => {
                        updateMultipleFilters({ area: a.name, searchLat: undefined, searchLng: undefined, searchPlaceName: undefined, q: '' });
                        setSearchInput(a.name);
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
                        <MapPin size={14} color="#059669" />
                        <span style={{ fontWeight: 600 }}>{a.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: '#065f46', fontWeight: 600 }}>
                        {a.count} rooms
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Places & Landmarks */}
              {geoSuggestions.length > 0 && (
                <div style={{ padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#0369a1', padding: '4px 16px 6px' }}>
                    📍 Places, Colleges & Landmarks
                  </div>
                  {geoSuggestions.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
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
                        <Compass size={14} color="#0284c7" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{place.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{place.displayName}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#0284c7' }}>Explore nearby →</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
