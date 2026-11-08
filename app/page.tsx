'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  GraduationCap,
  Hospital,
  Train,
  MapPin,
  Search,
  Crosshair,
  Sparkles,
  X,
  Compass,
  ChevronDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { mockProperties as propertiesSeed } from '@/lib/mock-data/properties';
import type { Property } from '@/lib/mock-data/types';
import { getProperties } from '@/lib/services/propertyService';
import { PropertyCard } from '@/components/PropertyCard';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import {
  searchPlacesLive,
  getBrowserLocation,
  type GeocodedPlace,
} from '@/lib/services/geocodingService';
import {
  extractLiveLocationFacets,
  getAvailableCities,
  type CityConfig,
} from '@/lib/services/dynamicLocationService';

export default function Home() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(propertiesSeed);
  const [saved, setSaved] = useState<string[]>([]);

  // Search State with Extensible City Selection
  const [selectedCity, setSelectedCity] = useState<string>('Samastipur');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoSuggestions, setGeoSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProperties().then(setProperties);
    setSaved(getStorageItem('roomsaathi_saved_properties', []));
  }, []);

  // Compute available cities (starts with Samastipur + any new cities in listings)
  const availableCities = useMemo(() => getAvailableCities(properties), [properties]);
  const activeCity = useMemo(
    () => availableCities.find((c) => c.name.toLowerCase() === selectedCity.toLowerCase()) || availableCities[0],
    [availableCities, selectedCity]
  );

  // Compute live facets purely from database inventory
  const inventory = useMemo(() => extractLiveLocationFacets(properties), [properties]);

  // Close dropdown on outside click
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

  // Live OpenStreetMap / Photon Geocoder lookup (debounced)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setGeoSuggestions([]);
      return;
    }

    let alive = true;
    setIsSearchingPlaces(true);
    const timer = setTimeout(() => {
      searchPlacesLive(q, activeCity.lat, activeCity.lng)
        .then((places) => {
          if (alive) {
            setGeoSuggestions(places);
            setIsSearchingPlaces(false);
          }
        })
        .catch(() => {
          if (alive) {
            setGeoSuggestions([]);
            setIsSearchingPlaces(false);
          }
        });
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchQuery, activeCity]);

  // 1-Tap "Near Me" GPS Discovery
  const handleNearMeClick = async () => {
    setLocating(true);
    try {
      const coords = await getBrowserLocation();
      setLocating(false);
      setIsDropdownOpen(false);
      if (coords) {
        router.push(`/search?nearMe=true&lat=${coords.latitude}&lng=${coords.longitude}&maxDist=5&city=${encodeURIComponent(selectedCity)}`);
      } else {
        router.push(`/search?nearMe=true&lat=${activeCity.lat}&lng=${activeCity.lng}&maxDist=5&city=${encodeURIComponent(selectedCity)}`);
      }
    } catch {
      setLocating(false);
    }
  };

  // Submit Search
  const executeSearch = () => {
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    const q = searchQuery.trim();

    if (q) {
      if (/^\d{6}$/.test(q)) {
        params.set('pincode', q);
      } else {
        params.set('q', q);
      }
    }

    setIsDropdownOpen(false);
    router.push(params.toString() ? `/search?${params.toString()}` : '/search');
  };

  const handleSelectPlace = (place: GeocodedPlace) => {
    setSearchQuery(place.name);
    setIsDropdownOpen(false);
    router.push(
      `/search?searchLat=${place.latitude}&searchLng=${place.longitude}&searchPlace=${encodeURIComponent(
        place.name
      )}&maxDist=5${selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : ''}`
    );
  };

  const handleSelectArea = (area: string) => {
    setSearchQuery(area);
    setIsDropdownOpen(false);
    router.push(`/search?area=${encodeURIComponent(area)}${selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : ''}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const toggleSave = (id: string) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    setStorageItem('roomsaathi_saved_properties', next);
  };

  // Dynamic matching properties in DB
  const matchingPropertiesInDb = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return properties
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          (p.pincode && p.pincode.includes(q))
      )
      .slice(0, 4);
  }, [properties, searchQuery]);

  // Dynamic matching localities
  const matchingAreas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return inventory.areas.slice(0, 4);
    return inventory.areas.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 4);
  }, [inventory.areas, searchQuery]);

  return (
    <>
      {/* Hero Section - Minimalist Background Image Layout */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={13} color="#6ee7b7" />
              <span>Find your home in Samastipur</span>
            </div>

            <h1 className="hero-title-minimal">
              अपना कमरा, <span className="title-accent-light">अपने बजट में</span>
            </h1>

            <p className="hero-subtitle-minimal">
              कॉलेज, कोचिंग या स्टेशन के पास वेरिफाइड कमरे खोजें—सीधे मकान मालिक से
            </p>

            {/* Enhanced Unified Searchbox with City Dropdown */}
            <div className="searchbox" style={{ position: 'relative', overflow: 'visible' }} ref={searchContainerRef}>
            {/* Search Bar + Autocomplete Wrapper: Positions dropdown directly below search input */}
            <div style={{ position: 'relative', width: '100%', zIndex: 60 }}>
              <div className="search-bar-unified">
                {/* 1. City Dropdown Selector + Mobile Near Me Top Row */}
                <div className="search-bar-top-row">
                  <div className="search-bar-city-btn" title="Select City">
                    <div className="search-bar-city-icon-badge">
                      <MapPin size={14} color="#ffffff" />
                    </div>
                    <div className="search-bar-city-info">
                      <span className="search-bar-city-label">City</span>
                      <span className="search-bar-city-name">{selectedCity}</span>
                    </div>
                    <ChevronDown
                      size={13}
                      color="#176b58"
                      className="search-bar-city-chevron"
                    />
                    <select
                      className="search-bar-city-native-select"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      aria-label="Select City"
                    >
                      {availableCities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mobile-Only Near Me Button */}
                  <button
                    type="button"
                    className="search-bar-nearme-mobile"
                    onClick={handleNearMeClick}
                    title="Find stays near your GPS position"
                  >
                    <Crosshair size={13} color="#059669" />
                    <span>{locating ? '...' : 'Near Me'}</span>
                  </button>
                </div>

                {/* 2. Vertical Divider */}
                <div className="search-bar-divider" />

                {/* 3. Search Input Field */}
                <div className="search-bar-input-wrap">
                  <Search
                    size={18}
                    color="#94a3b8"
                    style={{ position: 'absolute', left: 4, pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    className="search-bar-input"
                    placeholder={`Search locality, landmark, college, or PIN in ${selectedCity}...`}
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                  />

                  {/* Inside-Input Actions: Clear & Desktop Near Me */}
                  <div style={{ position: 'absolute', right: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setGeoSuggestions([]);
                        }}
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
                        aria-label="Clear query"
                      >
                        <X size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="search-bar-nearme-desktop"
                      onClick={handleNearMeClick}
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        fontSize: 11.5,
                        fontWeight: 600,
                        borderRadius: 8,
                        padding: '5px 9px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        whiteSpace: 'nowrap',
                      }}
                      title="Find stays near your GPS position"
                    >
                      <Crosshair size={12} color="#059669" /> {locating ? '...' : 'Near Me'}
                    </button>
                  </div>
                </div>

                {/* 4. Primary Search CTA Button */}
                <button
                  type="button"
                  className="search-bar-btn"
                  onClick={executeSearch}
                >
                  <Search size={16} /> Search Rooms
                </button>
              </div>

              {/* Live Autocomplete Dropdown - Placed directly below the search bar */}
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
                {/* Near Me Quick Action */}
                <div style={{ padding: '0 10px 8px' }}>
                  <button
                    type="button"
                    onClick={handleNearMeClick}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
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
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: '#10b981',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Crosshair size={14} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>
                        {locating ? 'Detecting your GPS position...' : 'Use My Current Location'}
                      </div>
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 400 }}>
                        Find rooms closest to where you are standing right now
                      </div>
                    </div>
                  </button>
                </div>

                {/* Section 1: Live Matches from Database Listings */}
                {matchingPropertiesInDb.length > 0 && (
                  <div style={{ padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: '#0f766e',
                        padding: '4px 16px 6px',
                      }}
                    >
                      🏠 Available Rooms & Hostels
                    </div>
                    {matchingPropertiesInDb.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => router.push(`/rooms/${p.id}`)}
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
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {p.area}, {p.city} · {p.accommodation}
                          </div>
                        </div>
                        <span style={{ fontWeight: 700, color: '#0f766e' }}>
                          ₹{p.rent.toLocaleString('en-IN')}/mo
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Section 2: Active Localities */}
                {matchingAreas.length > 0 && (
                  <div style={{ padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: '#64748b',
                        padding: '4px 16px 6px',
                      }}
                    >
                      {searchQuery ? '📍 Matching Localities' : '📍 Popular Localities'}
                    </div>
                    {matchingAreas.map((a) => (
                      <button
                        key={a.name}
                        type="button"
                        onClick={() => handleSelectArea(a.name)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 16px',
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
                          <span style={{ fontWeight: 500 }}>{a.name}</span>
                        </div>
                        <span style={{ fontSize: 11, background: '#ecfdf5', color: '#065f46', padding: '1px 7px', borderRadius: 6, fontWeight: 600 }}>
                          {a.count} {a.count === 1 ? 'room' : 'rooms'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Section 3: Places, Colleges & Landmarks */}
                {geoSuggestions.length > 0 && (
                  <div style={{ padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: '#0369a1',
                        padding: '4px 16px 6px',
                      }}
                    >
                      <span>📍 Places, Colleges & Landmarks</span>
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
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {place.displayName}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 500 }}>
                          Explore nearby →
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {isSearchingPlaces && (
                  <div style={{ padding: '8px 16px', fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                    Searching places...
                  </div>
                )}
              </div>
            )}
            </div>

            {/* Dynamic Top Localities & PINs */}
            {(inventory.areas.length > 0 || inventory.pincodes.length > 0) && (
              <div className="hero-quick-row">
                {/* Dynamic Top Active Areas */}
                {inventory.areas.slice(0, 4).map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => router.push(`/search?area=${encodeURIComponent(a.name)}`)}
                    className="hero-pill"
                  >
                    📍 {a.name} ({a.count})
                  </button>
                ))}

                {/* Dynamic Top PIN Codes */}
                {inventory.pincodes.slice(0, 2).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => router.push(`/search?pincode=${encodeURIComponent(p.name)}`)}
                    className="hero-pill"
                  >
                    📮 PIN {p.name}
                  </button>
                ))}
              </div>
            )}

            {/* Trust Highlights at Hero Bottom */}
            <div className="hero-trust-row">
              <div className="hero-trust-item">
                <ShieldCheck size={15} color="#6ee7b7" />
                <span>Owner Verified Listings</span>
              </div>
              <span className="hero-trust-dot" aria-hidden="true">•</span>
              <div className="hero-trust-item">
                <Zap size={14} color="#6ee7b7" />
                <span>Zero Brokerage</span>
              </div>
              <span className="hero-trust-dot" aria-hidden="true">•</span>
              <div className="hero-trust-item">
                <Crosshair size={14} color="#6ee7b7" />
                <span>Live GPS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Property Listings Sections */}
      {properties.length === 0 ? (
        <section className="section">
          <div
            className="container"
            style={{
              textAlign: 'center',
              padding: '55px 20px',
              border: '1px dashed #c7d9ce',
              borderRadius: 18,
              background: '#fafbf9',
            }}
          >
            <div className="dest-icon" style={{ margin: '0 auto 14px', fontSize: 24 }}>
              ⌂
            </div>
            <h2>
              No rooms listed <em className="title-accent">yet</em>
            </h2>
            <p className="muted" style={{ maxWidth: 480, margin: '8px auto 20px' }}>
              Are you a PG owner or landlord? List your rooms with 100% transparent pricing and reach tenants directly.
            </p>
            <Link href="/list-property" className="btn">
              List your property <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      ) : (
        [
          ['Available near you', properties.slice(0, 6)],
          ['Under ₹6,000', properties.filter((p) => p.rent <= 6000).slice(0, 6)],
          [
            'Lower move-in cost',
            [...properties].sort((a, b) => a.rent + a.deposit - b.rent - b.deposit).slice(0, 6),
          ],
          ['Verified stays', properties.filter((p) => p.verified).slice(0, 6)],
        ].map(([title, items]) => (
          <section
            className="section"
            style={{ background: title === 'Under ₹6,000' ? '#fafbf9' : 'white' }}
            key={title as string}
          >
            <div className="container">
              <div className="section-head">
                <div>
                  <h2>
                    {(title as string).split(' ').slice(0, -1).join(' ')}{' '}
                    <em className="title-accent">{(title as string).split(' ').slice(-1)}</em>
                  </h2>
                  <p>
                    {title === 'Under ₹6,000'
                      ? 'कम बजट में कमरे, और महीने का पूरा खर्च साफ़-साफ़।'
                      : title === 'Lower move-in cost'
                      ? 'शिफ्ट होने से पहले शुरुआती खर्च जानें।'
                      : title === 'Verified stays'
                      ? 'Verified stays, ताकि आप बेफ़िक्र रहें।'
                      : 'आपके पास rooms, और महीने का पूरा खर्च साफ़-साफ़।'}
                  </p>
                </div>
                <Link href="/search" className="muted">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="property-grid">
                {(items as typeof properties).slice(0, 3).map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    saved={saved.includes(p.id)}
                    onSave={() => toggleSave(p.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      {/* Trust & Guarantee Banner */}
      <section className="section">
        <div
          className="container"
          style={{
            background: '#edf5ef',
            borderRadius: 20,
            padding: '28px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="eyebrow">RoomSaathi promise</div>
            <h2 style={{ marginTop: 9 }}>
              Know the full cost beyond <em className="title-accent">rent</em>
            </h2>
            <p className="subtitle" style={{ fontSize: 14, margin: 0 }}>
              कमरा देखने जाने से पहले rent, bills, deposit और शिफ्ट होने का खर्च जानें।
            </p>
          </div>
          <Link className="btn" href="/search">
            Compare rooms <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
