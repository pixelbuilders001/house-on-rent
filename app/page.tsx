'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
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
  Building2,
  CheckCircle2,
  UserX,
  MessageCircle,
  FileText,
} from 'lucide-react';
import type { Property } from '@/lib/mock-data/types';
import { getProperties } from '@/lib/services/propertyService';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyCardSkeleton } from '@/components/PropertyCardSkeleton';
import { CitySelector } from '@/components/CitySelector';
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);

  // Search State with Extensible City Selection
  const [selectedCity, setSelectedCity] = useState<string>('Samastipur');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoSuggestions, setGeoSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [homeCategory, setHomeCategory] = useState<'all' | 'single' | 'shared' | 'under5k' | 'food' | 'station'>('all');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const openMobileSearch = () => {
    setIsMobileSearchOpen(true);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    getProperties()
      .then((data) => {
        if (isMounted) {
          setProperties(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load properties:', err);
        if (isMounted) {
          setLoading(false);
        }
      });
    setSaved(getStorageItem('roomsaathi_saved_properties', []));
    return () => {
      isMounted = false;
    };
  }, []);

  // Lock body scroll and auto-focus input when mobile search sheet opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 100);
      return () => {
        document.body.style.overflow = prevOverflow;
        clearTimeout(timer);
      };
    }
  }, [isMobileSearchOpen]);

  // Handle global Escape key to close search overlays
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMobileSearchOpen(false);
        setIsDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
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

  // Dynamic category counts for 1-tap tabs
  const categoryCounts = useMemo(() => {
    return {
      all: properties.length,
      single: properties.filter(
        (p) => (p.accommodation || '').toLowerCase().includes('single') || p.type === 'Room'
      ).length,
      shared: properties.filter(
        (p) =>
          (p.accommodation || '').toLowerCase().includes('shared') ||
          (p.accommodation || '').toLowerCase().includes('sharing') ||
          (p.accommodation || '').toLowerCase().includes('bed') ||
          p.type === 'Hostel'
      ).length,
      under5k: properties.filter((p) => p.rent <= 5000).length,
      food: properties.filter((p) => p.foodIncluded || p.foodAvailable).length,
      station: properties.filter(
        (p) => (p.stationDistanceKm != null && p.stationDistanceKm <= 1.5) || p.distanceKm <= 1.5
      ).length,
    };
  }, [properties]);

  // Instant filtered listings for homepage showcase
  const filteredHomeProperties = useMemo(() => {
    switch (homeCategory) {
      case 'single':
        return properties.filter(
          (p) => (p.accommodation || '').toLowerCase().includes('single') || p.type === 'Room'
        );
      case 'shared':
        return properties.filter(
          (p) =>
            (p.accommodation || '').toLowerCase().includes('shared') ||
            (p.accommodation || '').toLowerCase().includes('sharing') ||
            (p.accommodation || '').toLowerCase().includes('bed') ||
            p.type === 'Hostel'
        );
      case 'under5k':
        return properties.filter((p) => p.rent <= 5000);
      case 'food':
        return properties.filter((p) => p.foodIncluded || p.foodAvailable);
      case 'station':
        return properties.filter(
          (p) => (p.stationDistanceKm != null && p.stationDistanceKm <= 1.5) || p.distanceKm <= 1.5
        );
      default:
        return properties;
    }
  }, [properties, homeCategory]);

  const budgetProperties = useMemo(() => {
    return properties.filter((p) => p.rent <= 5000);
  }, [properties]);

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
                {/* 1. City Dropdown Selector */}
                <div className="search-bar-top-row">
                  <CitySelector
                    selectedCity={selectedCity}
                    onSelectCity={setSelectedCity}
                    availableCities={availableCities}
                    variant="desktop"
                  />
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
                    onFocus={(e) => {
                      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                        e.target.blur();
                        openMobileSearch();
                      } else {
                        setIsDropdownOpen(true);
                      }
                    }}
                    onClick={(e) => {
                      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                        e.currentTarget.blur();
                        openMobileSearch();
                      }
                    }}
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
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth <= 768 && !searchQuery.trim()) {
                      openMobileSearch();
                    } else {
                      executeSearch();
                    }
                  }}
                >
                  <Search size={16} /> Search Rooms
                </button>
              </div>

              {/* Live Autocomplete Dropdown - Placed directly below the search bar (Desktop Only) */}
              {isDropdownOpen && !isMobileSearchOpen && (
                <div
                  className="search-dropdown-desktop"
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

                {/* Section 3: Geocoded Location Results */}
                {geoSuggestions.length > 0 && (
                  <div style={{ padding: '4px 0', borderTop: '1px solid #f1f5f9' }}>
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
            {/* Dynamic Top Localities (2) & PINs (2 on desktop, 1 on mobile) */}
            {(inventory.areas.length > 0 || inventory.pincodes.length > 0) && (
              <div className="hero-quick-row">
                {/* 2 Locations for both Desktop & Mobile */}
                {inventory.areas.slice(0, 2).map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => router.push(`/search?area=${encodeURIComponent(a.name)}`)}
                    className="hero-pill"
                  >
                    📍 {a.name} ({a.count})
                  </button>
                ))}

                {/* 2 PINs on Desktop, 1 on Mobile */}
                {inventory.pincodes.slice(0, 2).map((p, idx) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => router.push(`/search?pincode=${encodeURIComponent(p.name)}`)}
                    className={`hero-pill ${idx > 0 ? 'hero-pill-desktop-only' : ''}`}
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
      {!loading && properties.length === 0 ? (
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
        <>
          {/* Main Section: Available Near You */}
          <section className="section listings-section">
            <div className="container">
              {/* Production-Grade Section Header */}
              <div className="listings-section-header">
                <div>
                  <div className="listings-eyebrow">
                    <span className="eyebrow-dot" />
                    <span>CURATED LISTINGS IN {selectedCity.toUpperCase()}</span>
                  </div>
                  <h2 className="listings-heading">
                    Available <em className="title-accent">Near You</em>
                  </h2>
                  <p className="listings-subtitle">
                    Direct Landlords · Zero Brokerage · Transparent Move-in Cost
                  </p>
                </div>

                <Link href="/search" className="view-all-link desktop-only">
                  <span>{loading ? 'Explore all rooms' : `Explore all ${properties.length} rooms`}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Interactive 1-Tap Category Filter Pills */}
              <div className="category-tabs-container">
                <button
                  type="button"
                  className={`category-tab-btn ${homeCategory === 'all' ? 'is-active' : ''}`}
                  onClick={() => setHomeCategory('all')}
                >
                  <span>All Rooms</span>
                  <span className="tab-count-badge">{loading ? '—' : categoryCounts.all}</span>
                </button>
                <button
                  type="button"
                  className={`category-tab-btn ${homeCategory === 'single' ? 'is-active' : ''}`}
                  onClick={() => setHomeCategory('single')}
                >
                  <span>Single Room</span>
                  <span className="tab-count-badge">{loading ? '—' : categoryCounts.single}</span>
                </button>
                <button
                  type="button"
                  className={`category-tab-btn ${homeCategory === 'shared' ? 'is-active' : ''}`}
                  onClick={() => setHomeCategory('shared')}
                >
                  <span>Shared Bed</span>
                  <span className="tab-count-badge">{loading ? '—' : categoryCounts.shared}</span>
                </button>
                <button
                  type="button"
                  className={`category-tab-btn ${homeCategory === 'under5k' ? 'is-active' : ''}`}
                  onClick={() => setHomeCategory('under5k')}
                >
                  <span>Under ₹5,000</span>
                  <span className="tab-count-badge">{loading ? '—' : categoryCounts.under5k}</span>
                </button>
                <button
                  type="button"
                  className={`category-tab-btn ${homeCategory === 'food' ? 'is-active' : ''}`}
                  onClick={() => setHomeCategory('food')}
                >
                  <span>Food Included</span>
                  <span className="tab-count-badge">{loading ? '—' : categoryCounts.food}</span>
                </button>
                <button
                  type="button"
                  className={`category-tab-btn ${homeCategory === 'station' ? 'is-active' : ''}`}
                  onClick={() => setHomeCategory('station')}
                >
                  <span>Near Station (&lt;1.5 km)</span>
                  <span className="tab-count-badge">{loading ? '—' : categoryCounts.station}</span>
                </button>
              </div>

              {/* Property Grid: 3 columns desktop, 2 tablet, 1 mobile */}
              {loading ? (
                <div className="property-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={`skeleton-${i}`} />
                  ))}
                </div>
              ) : filteredHomeProperties.length === 0 ? (
                <div className="empty-category-notice">
                  <p>No rooms matching this filter right now in {selectedCity}.</p>
                  <button
                    type="button"
                    className="btn outline small"
                    onClick={() => setHomeCategory('all')}
                  >
                    Show All Rooms
                  </button>
                </div>
              ) : (
                <div className="property-grid">
                  {filteredHomeProperties.slice(0, 6).map((p) => (
                    <PropertyCard
                      key={p.id}
                      property={p}
                      saved={saved.includes(p.id)}
                      onSave={() => toggleSave(p.id)}
                    />
                  ))}
                </div>
              )}

              {/* Mobile "View All" Button */}
              <div className="listings-mobile-footer">
                <Link href="/search" className="btn outline full-width-mobile">
                  <span>{loading ? `View all rooms in ${selectedCity}` : `View all ${properties.length} rooms in ${selectedCity}`}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </section>

          {/* Secondary Curated Showcase: Budget Stays under ₹5,000 */}
          {loading ? (
            <section className="section budget-showcase-section">
              <div className="container">
                <div className="listings-section-header">
                  <div>
                    <div className="listings-eyebrow">
                      <Sparkles size={13} color="#10b981" />
                      <span>STUDENT &amp; BUDGET FAVORITES</span>
                    </div>
                    <h2 className="listings-heading">
                      Budget Stays <em className="title-accent">Under ₹5,000</em>
                    </h2>
                    <p className="listings-subtitle">
                      कम बजट में बेहतरीन कमरे, बिना किसी ब्रोकरेज या छिपे हुए खर्चे के
                    </p>
                  </div>

                  <Link href="/search?maxPrice=5000" className="view-all-link desktop-only">
                    <span>View all budget rooms</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="property-grid">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PropertyCardSkeleton key={`budget-skeleton-${i}`} />
                  ))}
                </div>

                <div className="listings-mobile-footer">
                  <Link href="/search?maxPrice=5000" className="btn outline full-width-mobile">
                    <span>Explore budget rooms under ₹5,000</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </section>
          ) : budgetProperties.length > 0 ? (
            <section className="section budget-showcase-section">
              <div className="container">
                <div className="listings-section-header">
                  <div>
                    <div className="listings-eyebrow">
                      <Sparkles size={13} color="#10b981" />
                      <span>STUDENT &amp; BUDGET FAVORITES</span>
                    </div>
                    <h2 className="listings-heading">
                      Budget Stays <em className="title-accent">Under ₹5,000</em>
                    </h2>
                    <p className="listings-subtitle">
                      कम बजट में बेहतरीन कमरे, बिना किसी ब्रोकरेज या छिपे हुए खर्चे के
                    </p>
                  </div>

                  <Link href="/search?maxPrice=5000" className="view-all-link desktop-only">
                    <span>View all budget rooms</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="property-grid">
                  {budgetProperties.slice(0, 3).map((p) => (
                    <PropertyCard
                      key={`budget-${p.id}`}
                      property={p}
                      saved={saved.includes(p.id)}
                      onSave={() => toggleSave(p.id)}
                    />
                  ))}
                </div>

                <div className="listings-mobile-footer">
                  <Link href="/search?maxPrice=5000" className="btn outline full-width-mobile">
                    <span>Explore budget rooms under ₹5,000</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}

      {/* Landlord & Property Owner CTA Section */}
      <section className="section landlord-cta-section">
        <div className="container">
          <div className="landlord-card">
            {/* Ambient Background Glow Effect */}
            <div className="landlord-glow-aura" />

            <div className="landlord-content">
              <div className="landlord-eyebrow">
                <Building2 size={13} className="landlord-eyebrow-icon" />
                <span>FOR LANDLORDS · मकान मालिकों के लिए</span>
              </div>

              <h2 className="landlord-heading">
                Own a property? कमरा या PG खाली है? <br />
                <span className="landlord-heading-highlight">
                  List it for free and reach thousands of verified renters
                </span>
              </h2>

              <p className="landlord-desc">
                {selectedCity} में अपने कमरे, PG या हॉस्टल को सीधे छात्रों और कामकाजी किरायेदारों तक पहुंचाएं—0% ब्रोकरेज, सीधे कॉल और बिना किसी दलाल के।
              </p>

              <div className="landlord-perks-grid">
                <div className="landlord-perk-item">
                  <div className="landlord-perk-icon-wrap">
                    <Zap size={14} fill="#fde047" color="#fde047" />
                  </div>
                  <div>
                    <strong>100% Free Listing</strong>
                    <span>बिना किसी फीस या ब्रोकरेज के</span>
                  </div>
                </div>

                <div className="landlord-perk-item">
                  <div className="landlord-perk-icon-wrap">
                    <ShieldCheck size={14} color="#6ee7b7" />
                  </div>
                  <div>
                    <strong>Verified Renters</strong>
                    <span>कॉलेज छात्र और जॉब प्रोफेशनल्स</span>
                  </div>
                </div>

                <div className="landlord-perk-item">
                  <div className="landlord-perk-icon-wrap">
                    <CheckCircle2 size={14} color="#93c5fd" />
                  </div>
                  <div>
                    <strong>Direct Tenant Calls</strong>
                    <span>सीधे आपसे संपर्क, कोई दलाल नहीं</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="landlord-action-card">
              <div className="landlord-badge-pill">
                <Sparkles size={13} color="#10b981" />
                <span>0% ब्रोकरेज · तुरंत एक्टिवेशन</span>
              </div>

              <h3 className="landlord-card-title">2 मिनट में लिस्ट करें (Free)</h3>
              <p className="landlord-card-sub">
                कमरे की फोटो और किराया जोड़ें, और आज ही सीधे किरायेदार पाएं।
              </p>

              <Link href="/list-property" className="landlord-cta-button">
                <span>Post Your Property — Free</span>
                <ArrowRight size={17} />
              </Link>

              <div className="landlord-guarantee-note">
                <ShieldCheck size={13} />
                <span>100% Free Forever · हमेशा के लिए फ्री</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section why-choose-section">
        <div className="container">
          <div className="why-choose-header">
            <div className="listings-eyebrow">
              <span className="eyebrow-dot" />
              <span>WHY CHOOSE ROOMSAATHI · भरोसे का साथी</span>
            </div>
            <h2 className="listings-heading">
              Why Choose <em className="title-accent">Us?</em> हमें क्यों चुनें
            </h2>
            <p className="listings-subtitle">
              समस्तीपुर में कमरा ढूंढना अब आसान, सुरक्षित और 100% पारदर्शी—सीधे मकान मालिक से
            </p>
          </div>

          <div className="why-choose-grid">
            {/* Card 1: Avoid Brokers */}
            <div className="why-card">
              <div className="why-card-top">
                <div className="why-card-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <UserX size={24} />
                </div>
                <span className="why-card-badge" style={{ background: '#fef08a', color: '#854d0e' }}>
                  ⚡ 0% ब्रोकरेज
                </span>
              </div>
              <h3 className="why-card-title">Avoid Brokers</h3>
              <p className="why-card-hindi-sub">दलालों से छुटकारा, सीधे मालिक से संपर्क</p>
              <p className="why-card-desc">
                We directly connect you to verified owners to save brokerage. नो मिडिलमैन, सीधे मकान मालिक से बातचीत करें और ₹2,000 से ₹5,000 की ब्रोकरेज फीस बचाएं।
              </p>
              <div className="why-card-footer">
                <span className="why-feature-tag">✓ Direct Owner Contact</span>
                <span className="why-feature-tag">✓ Zero Hidden Commission</span>
              </div>
            </div>

            {/* Card 2: Free Listing */}
            <div className="why-card">
              <div className="why-card-top">
                <div className="why-card-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <MessageCircle size={24} />
                </div>
                <span className="why-card-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>
                  📲 WhatsApp Support
                </span>
              </div>
              <h3 className="why-card-title">Free Listing</h3>
              <p className="why-card-hindi-sub">आसान और 100% फ्री लिस्टिंग प्रोसेस</p>
              <p className="why-card-desc">
                Easy listing process. Also using WhatsApp. मकान मालिक सिर्फ 2 मिनट में वेबसाइट पर या हमारे WhatsApp नंबर पर सीधे कमरे की फोटो भेजकर फ्री में लिस्ट कर सकते हैं।
              </p>
              <div className="why-card-footer">
                <span className="why-feature-tag">✓ 2-Minute Easy Setup</span>
                <span className="why-feature-tag">✓ List via WhatsApp</span>
              </div>
            </div>

            {/* Card 3: Rental Agreement */}
            <div className="why-card">
              <div className="why-card-top">
                <div className="why-card-icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <FileText size={24} />
                </div>
                <span className="why-card-badge" style={{ background: '#ede9fe', color: '#5b21b6' }}>
                  🛡️ Legal Security
                </span>
              </div>
              <h3 className="why-card-title">Rental Agreement</h3>
              <p className="why-card-hindi-sub">एग्रीमेंट और पेपरवर्क में पूरी सहायता</p>
              <p className="why-card-desc">
                Assistance in creating Rental agreement &amp; Paper work. मकान मालिक और किरायेदार दोनों की सुरक्षा के लिए कानूनी रूप से मान्य रेंटल एग्रीमेंट बनाने में सहायता।
              </p>
              <div className="why-card-footer">
                <span className="why-feature-tag">✓ Verified Legal Format</span>
                <span className="why-feature-tag">✓ Safe &amp; Verified Stay</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Native App-Style Mobile Search Sheet Modal (Mobile Only) */}
      {isMobileSearchOpen && (
        <div className="mobile-search-sheet" role="dialog" aria-modal="true" aria-label="Search Rooms">
          {/* Top Bar with Back Arrow, City Selector & Close/Cancel */}
          <div className="mobile-search-topbar">
            <button
              type="button"
              className="mobile-search-back-btn"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Back"
            >
              <ArrowLeft size={22} color="#0f172a" />
            </button>

            {/* City Selector Pill */}
            <CitySelector
              selectedCity={selectedCity}
              onSelectCity={setSelectedCity}
              availableCities={availableCities}
              variant="mobile-pill"
            />

            <button
              type="button"
              className="mobile-search-close-icon-btn"
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Close search"
            >
              <X size={20} color="#475569" />
            </button>
          </div>

          {/* Dedicated Search Input Bar */}
          <div className="mobile-search-input-section">
            <div className="mobile-search-input-box">
              <Search size={18} color="#059669" style={{ flexShrink: 0 }} />
              <input
                ref={mobileInputRef}
                type="text"
                className="mobile-search-input-field"
                placeholder={`Search locality, area, or PIN...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsMobileSearchOpen(false);
                    executeSearch();
                  }
                }}
                autoFocus
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="mobile-search-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setGeoSuggestions([]);
                    mobileInputRef.current?.focus();
                  }}
                  aria-label="Clear query"
                >
                  <X size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  className="mobile-search-input-nearme-btn"
                  onClick={() => {
                    setIsMobileSearchOpen(false);
                    handleNearMeClick();
                  }}
                  title="Use My Current Location"
                >
                  <Crosshair size={12} color="#059669" />
                  <span>{locating ? '...' : 'Near Me'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Results & Suggestions Area */}
          <div className="mobile-search-content-scroll">

            {/* When query is empty: Show curated popular localities, landmarks, and PINs */}
            {!searchQuery.trim() && (
              <div className="mobile-search-discovery-sections">
                {/* Popular Localities */}
                {inventory.areas.length > 0 && (
                  <div className="mobile-search-group">
                    <div className="mobile-search-group-title">
                      📍 Popular Localities in {selectedCity}
                    </div>
                    <div className="mobile-search-chips-wrap">
                      {inventory.areas.slice(0, 8).map((a) => (
                        <button
                          key={a.name}
                          type="button"
                          className="mobile-search-chip"
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            router.push(`/search?area=${encodeURIComponent(a.name)}`);
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{a.name}</span>
                          <span className="mobile-search-chip-badge">{a.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                <div className="mobile-search-group">
                  <div className="mobile-search-group-title">
                    📍 Popular in {selectedCity}
                  </div>
                  <div className="mobile-search-landmarks-list">
                    {[
                      { name: 'Samastipur Junction (Station)', subtitle: 'Train Station & Commuter Hub' },
                      { name: "Women's College Samastipur", subtitle: 'Kashipur / College Area' },
                      { name: 'Samastipur College', subtitle: 'Magadh University / College Road' },
                      { name: 'Tajpur Road', subtitle: 'Commercial & Student Market' },
                      { name: 'Musrigharari', subtitle: 'Highway Intersection & Hub' },
                      { name: 'Mohanpur', subtitle: 'Peaceful Residential Locality' },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="mobile-search-landmark-item"
                        onClick={() => {
                          setIsMobileSearchOpen(false);
                          router.push(`/search?q=${encodeURIComponent(item.name)}`);
                        }}
                      >
                        <div className="mobile-search-landmark-icon">
                          <Compass size={15} color="#0284c7" />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {item.subtitle}
                          </div>
                        </div>
                        <span style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 600 }}>
                          Search →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active PIN Codes */}
                {inventory.pincodes.length > 0 && (
                  <div className="mobile-search-group">
                    <div className="mobile-search-group-title">
                      📮 PIN Codes in {selectedCity}
                    </div>
                    <div className="mobile-search-chips-wrap">
                      {inventory.pincodes.slice(0, 4).map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          className="mobile-search-chip"
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            router.push(`/search?pincode=${encodeURIComponent(p.name)}`);
                          }}
                        >
                          📮 PIN {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* When query is typed: Live results */}
            {searchQuery.trim() && (
              <div className="mobile-search-live-results">
                {/* 1. Database Room Listings */}
                {matchingPropertiesInDb.length > 0 && (
                  <div className="mobile-search-group">
                    <div className="mobile-search-group-title">
                      🏠 Available Rooms & Hostels ({matchingPropertiesInDb.length})
                    </div>
                    <div className="mobile-search-results-list">
                      {matchingPropertiesInDb.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="mobile-search-property-card"
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            router.push(`/rooms/${p.id}`);
                          }}
                        >
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                              {p.area}, {p.city} · {p.accommodation}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f766e' }}>
                              ₹{p.rent.toLocaleString('en-IN')}<span style={{ fontSize: 10, fontWeight: 500 }}>/mo</span>
                            </div>
                            <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>
                              Zero Brokerage
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Matching Localities */}
                {matchingAreas.length > 0 && (
                  <div className="mobile-search-group">
                    <div className="mobile-search-group-title">
                      📍 Matching Localities
                    </div>
                    <div className="mobile-search-chips-wrap">
                      {matchingAreas.map((a) => (
                        <button
                          key={a.name}
                          type="button"
                          className="mobile-search-chip"
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            router.push(`/search?area=${encodeURIComponent(a.name)}`);
                          }}
                        >
                          📍 {a.name} ({a.count} rooms)
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Live Geocoded Places */}
                {geoSuggestions.length > 0 && (
                  <div className="mobile-search-group">
                    <div className="mobile-search-landmarks-list">
                      {geoSuggestions.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          className="mobile-search-landmark-item"
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            handleSelectPlace(place);
                          }}
                        >
                          <div className="mobile-search-landmark-icon">
                            <Compass size={15} color="#0284c7" />
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                              {place.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {place.displayName}
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 600 }}>
                            Explore →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isSearchingPlaces && (
                  <div style={{ padding: '12px 16px', fontSize: 12.5, color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                    Searching nearby...
                  </div>
                )}

                {/* Bottom Full Search CTA Button */}
                <div style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="mobile-search-submit-btn"
                    onClick={() => {
                      setIsMobileSearchOpen(false);
                      executeSearch();
                    }}
                  >
                    <Search size={16} />
                    <span>Search all rooms for "{searchQuery}"</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
