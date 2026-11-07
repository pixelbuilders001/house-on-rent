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
import { extractLiveLocationFacets } from '@/lib/services/dynamicLocationService';

export default function Home() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(propertiesSeed);
  const [saved, setSaved] = useState<string[]>([]);

  // Search State
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
      searchPlacesLive(q).then((places) => {
        if (alive) {
          setGeoSuggestions(places);
          setIsSearchingPlaces(false);
        }
      });
    }, 220);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // 1-Tap "Near Me" GPS Discovery
  const handleNearMeClick = async () => {
    setLocating(true);
    try {
      const coords = await getBrowserLocation();
      setLocating(false);
      setIsDropdownOpen(false);
      if (coords) {
        router.push(`/search?nearMe=true&lat=${coords.latitude}&lng=${coords.longitude}&maxDist=5`);
      } else {
        router.push(`/search?nearMe=true&lat=25.8631&lng=85.7812&maxDist=5`);
      }
    } catch {
      setLocating(false);
    }
  };

  // Submit Search
  const executeSearch = () => {
    const params = new URLSearchParams();
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
      )}&maxDist=5`
    );
  };

  const handleSelectArea = (area: string) => {
    setSearchQuery(area);
    setIsDropdownOpen(false);
    router.push(`/search?area=${encodeURIComponent(area)}`);
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

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-intro">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="hero-kicker-dot" /> LIVE DISCOVERY{' '}
                <span className="hero-kicker-divider" /> आपके शहर में, आपके बजट में
              </div>
              <h1 className="hero-title">
                <span className="hero-word word-1">अपना</span>{' '}
                <span className="hero-word word-2">कमरा,</span>
                <br />
                <span
                  className="hero-phrase-stack"
                  aria-label="अपने बजट में, कॉलेज के पास, आपकी पसंद का"
                >
                  <span className="hero-phrase"><em>अपने बजट</em> में।</span>
                  <span className="hero-phrase">कॉलेज के <em>पास</em>।</span>
                  <span className="hero-phrase">आपकी <em>पसंद का</em>।</span>
                </span>
              </h1>
              <p className="subtitle">
                किसी भी कोचिंग, कॉलेज, स्टेशन, या कॉलोनी का नाम लिखें—सीधे रियल डिस्टेंस और कुल खर्च के साथ कमरे खोजें।
              </p>
              <div className="hero-social-proof">
                <span className="hero-avatar-stack">
                  <i>R</i><i>A</i><i>V</i>
                </span>
                <span>
                  <b>कमरे ₹3,500/महीने से शुरू</b>
                  <small>Zero Brokerage · Direct Verified Landlords</small>
                </span>
              </div>
            </div>

            <div className="hero-visual" role="img" aria-label="Student accommodation preview">
              <div className="hero-photo-frame" />
              <div className="hero-float hero-float-top">
                <span className="hero-float-icon">₹</span>
                <span>
                  <b>Rooms from ₹3,500</b>
                  <small>Transparent monthly breakdown</small>
                </span>
              </div>
              <div className="hero-float hero-float-bottom">
                <MapPin size={15} />
                <span>
                  <b>Live GPS Commute</b>
                  <small>Real-time distance to your spot</small>
                </span>
                <i />
              </div>
              <div className="hero-photo-caption">
                <span className="hero-live-dot" /> Open Dynamic Search
              </div>
            </div>
          </div>

          {/* Dynamic Open Searchbox */}
          <div className="searchbox" style={{ position: 'relative' }} ref={searchContainerRef}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', flexWrap: 'wrap' }}>
              {/* Universal Live Input */}
              <div style={{ position: 'relative', flex: '1 1 320px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search
                    size={20}
                    color="#176b58"
                    style={{ position: 'absolute', left: 16, pointerEvents: 'none' }}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Search any landmark, coaching, college, area, or PIN code..."
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    style={{
                      height: 52,
                      paddingLeft: 48,
                      paddingRight: searchQuery ? 130 : 100,
                      fontSize: 15,
                      fontWeight: 500,
                      borderRadius: 14,
                      border: '1.5px solid #d5e2d9',
                    }}
                  />

                  {/* Inside-Input Actions: Clear & Near Me */}
                  <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setGeoSuggestions([]);
                        }}
                        style={{
                          background: '#e9f1ec',
                          border: 'none',
                          color: '#465f54',
                          borderRadius: '50%',
                          width: 26,
                          height: 26,
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        aria-label="Clear query"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleNearMeClick}
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#065f46',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 9,
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Crosshair size={13} color="#059669" /> {locating ? '...' : 'Near Me'}
                    </button>
                  </div>
                </div>


                {/* Live Hybrid Autocomplete Dropdown */}
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
                      boxShadow: '0 18px 40px -4px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                      zIndex: 50,
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
                          🏠 Verified Stays in Database
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

                    {/* Section 2: Active Inventory Areas from Database */}
                    {inventory.areas.length > 0 && !searchQuery && (
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
                          📍 Active Neighborhoods with Rooms
                        </div>
                        {inventory.areas.map((a) => (
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

                    {/* Section 3: Live Real-World Places from OpenStreetMap / Photon */}
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>🗺️ Live Places & Landmarks</span>
                          <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'none' }}>
                            OpenStreetMap
                          </span>
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
                              Search distance →
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isSearchingPlaces && (
                      <div style={{ padding: '8px 16px', fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                        Searching live places on OpenStreetMap...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Primary Search CTA Button */}
              <button
                type="button"
                className="btn"
                onClick={executeSearch}
                style={{
                  height: 52,
                  padding: '0 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 14,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                <Search size={17} /> Search Rooms
              </button>
            </div>

            {/* Dynamic Quick Discovery Pills Populated from Active Database Inventory */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 14,
                flexWrap: 'wrap',
                fontSize: 12,
                color: '#64748b',
              }}
            >
              <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={13} color="#0f766e" /> Quick Stays:
              </span>

              {/* Near Me */}
              <button
                type="button"
                onClick={handleNearMeClick}
                className="pill"
                style={{
                  background: '#ecfdf5',
                  borderColor: '#a7f3d0',
                  color: '#065f46',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <Crosshair size={12} /> Near Me (GPS)
              </button>

              {/* Dynamic Top Active Areas */}
              {inventory.areas.slice(0, 3).map((a) => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => router.push(`/search?area=${encodeURIComponent(a.name)}`)}
                  className="pill"
                  style={{ cursor: 'pointer' }}
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
                  className="pill"
                  style={{ cursor: 'pointer' }}
                >
                  📮 PIN {p.name}
                </button>
              ))}


              {/* Zero Brokerage */}
              <button
                type="button"
                onClick={() => router.push('/search?brokerage=true')}
                className="pill"
                style={{ cursor: 'pointer' }}
              >
                ⚡ Zero Brokerage
              </button>
            </div>
          </div>

          <div className="demo-note" style={{ marginTop: 14 }}>
            Zero hardcoded boundaries · Live OpenStreetMap geocoding & real-time inventory aggregation.
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
