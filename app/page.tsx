'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  GraduationCap,
  Hospital,
  Train,
  Bus,
  MapPin,
  SlidersHorizontal,
  Search,
  Navigation,
  Crosshair,
  Sparkles,
  ShieldCheck,
  X,
  ChevronRight,
} from 'lucide-react';
import { mockProperties as propertiesSeed } from '@/lib/mock-data/properties';
import type { Property } from '@/lib/mock-data/types';
import { getProperties } from '@/lib/services/propertyService';
import { mockDestinations } from '@/lib/mock-data/destinations';
import { getDestinations, type Destination } from '@/lib/services/catalogService';
import { PropertyCard } from '@/components/PropertyCard';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import {
  SAMASTIPUR_LANDMARKS,
  PINCODE_CLUSTERS,
  getLiveDeviceCoordinates,
} from '@/lib/locationData';

export default function Home() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(propertiesSeed);
  const [destinations, setDestinations] = useState<Destination[]>(mockDestinations);
  const [saved, setSaved] = useState<string[]>([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPincode, setSelectedPincode] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState('');
  const [maxBudget, setMaxBudget] = useState(7000);
  const [accommodation, setAccommodation] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProperties().then(setProperties);
    getDestinations().then(setDestinations);
    setSaved(getStorageItem('roomsaathi_saved_properties', []));
  }, []);

  // Close dropdown when clicking outside
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

  // 1-Tap "Near Me" GPS Discovery
  const handleNearMeClick = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await getLiveDeviceCoordinates();
      if (coords) {
        setLocating(false);
        setIsDropdownOpen(false);
        router.push(
          `/search?nearMe=true&lat=${coords.latitude}&lng=${coords.longitude}&maxDist=5`
        );
      } else {
        setLocating(false);
        // Fallback to central Samastipur
        router.push(
          `/search?nearMe=true&lat=25.8631&lng=85.7812&maxDist=5&fallback=1`
        );
      }
    } catch {
      setLocating(false);
      setLocationError('Location access was denied or timed out.');
    }
  };

  // Select Landmark Suggestion
  const handleSelectLandmark = (landmarkId: string, landmarkName: string) => {
    setSelectedLandmark(landmarkId);
    setSelectedPincode('');
    setSearchQuery(landmarkName);
    setIsDropdownOpen(false);
  };

  // Select PIN Code Suggestion
  const handleSelectPincode = (pincode: string) => {
    setSelectedPincode(pincode);
    setSelectedLandmark('');
    setSearchQuery(pincode);
    setIsDropdownOpen(false);
  };

  // Select Sub-area Suggestion
  const handleSelectSubArea = (area: string, pincode?: string) => {
    if (pincode) setSelectedPincode(pincode);
    setSelectedLandmark('');
    setSearchQuery(area);
    setIsDropdownOpen(false);
  };

  // Submit Search
  const executeSearch = () => {
    const params = new URLSearchParams();

    if (selectedPincode) {
      params.set('pincode', selectedPincode);
    } else if (selectedLandmark) {
      params.set('landmark', selectedLandmark);
    } else if (searchQuery.trim()) {
      const q = searchQuery.trim();
      // Check if it's a 6-digit PIN code
      if (/^\d{6}$/.test(q)) {
        params.set('pincode', q);
      } else {
        params.set('q', q);
      }
    }

    if (maxBudget) {
      params.set('max', String(maxBudget));
      setStorageItem('roomsaathi_search', { max: maxBudget });
    }
    if (accommodation) {
      params.set('accommodation', accommodation);
    }

    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsDropdownOpen(false);
      executeSearch();
    }
  };

  const toggleSave = (id: string) => {
    const next = saved.includes(id) ? saved.filter((x) => x !== id) : [...saved, id];
    setSaved(next);
    setStorageItem('roomsaathi_saved_properties', next);
  };

  // Filter autocomplete suggestions based on query
  const qClean = searchQuery.toLowerCase().trim();

  const matchingLandmarks = SAMASTIPUR_LANDMARKS.filter(
    (l) =>
      !qClean ||
      l.name.toLowerCase().includes(qClean) ||
      l.shortName.toLowerCase().includes(qClean) ||
      l.description.toLowerCase().includes(qClean)
  );

  const matchingPincodes = Object.values(PINCODE_CLUSTERS).filter(
    (p) =>
      !qClean ||
      p.pincode.includes(qClean) ||
      p.regionName.toLowerCase().includes(qClean) ||
      p.subAreas.some((sa) => sa.toLowerCase().includes(qClean))
  );

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-intro">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="hero-kicker-dot" /> SAMASTIPUR, BIHAR{' '}
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
                PIN code, landmark (स्टेशन, कॉलेज) या GPS “Near Me” से rooms और PGs खोजें।
                किराया, bills और कुल शिफ्टिंग खर्च—सब पारदर्शी।
              </p>
              <div className="hero-social-proof">
                <span className="hero-avatar-stack">
                  <i>R</i><i>A</i><i>V</i>
                </span>
                <span>
                  <b>समस्तीपुर में कमरे सीधे खोजें</b>
                  <small>कमरे ₹3,500/महीने से · Zero Brokerage verified</small>
                </span>
              </div>
            </div>

            <div className="hero-visual" role="img" aria-label="Student accommodation preview">
              <div className="hero-photo-frame" />
              <div className="hero-float hero-float-top">
                <span className="hero-float-icon">₹</span>
                <span>
                  <b>Rooms from ₹3,500</b>
                  <small>Full monthly breakdown</small>
                </span>
              </div>
              <div className="hero-float hero-float-bottom">
                <MapPin size={15} />
                <span>
                  <b>8 min to ABC College</b>
                  <small>Sample commute estimate</small>
                </span>
                <i />
              </div>
              <div className="hero-photo-caption">
                <span className="hero-live-dot" /> Verified Neighborhoods
              </div>
            </div>
          </div>

          {/* 3-Pillar Smart Hero Searchbox */}
          <div className="searchbox" style={{ position: 'relative' }} ref={searchContainerRef}>
            <div className="search-grid" style={{ alignItems: 'flex-start' }}>
              {/* Omni Search with Autocomplete */}
              <div className="field destination-field" style={{ position: 'relative', flex: '1.4' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Location, PIN or Landmark</span>
                  <button
                    type="button"
                    onClick={handleNearMeClick}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#059669',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                    }}
                  >
                    <Crosshair size={12} /> {locating ? 'Locating...' : '📍 Near Me'}
                  </button>
                </label>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 848101, Station Rd, Kashipur, ABC College"
                    value={searchQuery}
                    onFocus={() => setIsDropdownOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedPincode('');
                      setSelectedLandmark('');
                      setIsDropdownOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    style={{
                      paddingRight: searchQuery ? 32 : 12,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedPincode('');
                        setSelectedLandmark('');
                      }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: 4,
                      }}
                      aria-label="Clear query"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Grouped Autocomplete Suggestions Dropdown */}
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
                          padding: '10px 12px',
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
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#10b981',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Crosshair size={15} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#064e3b' }}>
                            {locating ? 'Detecting your GPS location...' : 'Use My Current Location'}
                          </div>
                          <div style={{ fontSize: 11, color: '#059669', fontWeight: 400 }}>
                            Instant distance calculation to all rooms
                          </div>
                        </div>
                        <span style={{ fontSize: 11, background: '#d1fae5', padding: '2px 8px', borderRadius: 6 }}>
                          📍 GPS
                        </span>
                      </button>
                    </div>

                    {/* Section: Major Landmarks & Transit */}
                    {matchingLandmarks.length > 0 && (
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
                          🏛️ Popular Landmarks & Stations
                        </div>
                        {matchingLandmarks.map((lm) => (
                          <button
                            key={lm.id}
                            type="button"
                            onClick={() => handleSelectLandmark(lm.id, lm.name)}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ color: '#0f766e', fontSize: 15 }}>
                                {lm.category === 'transit' ? '🚉' : lm.category === 'college' ? '🎓' : '🏥'}
                              </span>
                              <div>
                                <div style={{ fontWeight: 600 }}>{lm.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{lm.description}</div>
                              </div>
                            </div>
                            <span style={{ fontSize: 11, color: '#0f766e', fontWeight: 500 }}>
                              {lm.shortName}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Section: PIN Code Clusters */}
                    {matchingPincodes.length > 0 && (
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
                          📮 PIN Codes & Neighborhood Clusters
                        </div>
                        {matchingPincodes.map((cluster) => (
                          <div key={cluster.pincode}>
                            <button
                              type="button"
                              onClick={() => handleSelectPincode(cluster.pincode)}
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: '#0284c7', fontSize: 14 }}>📮</span>
                                <div>
                                  <span style={{ fontWeight: 700, color: '#0284c7' }}>PIN {cluster.pincode}</span>
                                  <span style={{ marginLeft: 6, color: '#475569' }}>· {cluster.regionName}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4 }}>
                                Cluster
                              </span>
                            </button>
                            {/* Sub-areas under this pincode */}
                            <div style={{ padding: '2px 16px 8px 40px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {cluster.subAreas.slice(0, 5).map((sub) => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectSubArea(sub, cluster.pincode);
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
                                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
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

              {/* Monthly Budget */}
              <div className="field">
                <label>Monthly budget up to</label>
                <input
                  aria-label="Maximum monthly budget"
                  className="input"
                  type="number"
                  min={0}
                  step={500}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                />
              </div>

              {/* Accommodation Type */}
              <div className="field">
                <label>Looking for</label>
                <select
                  className="select"
                  value={accommodation}
                  onChange={(e) => setAccommodation(e.target.value)}
                >
                  <option value="">Any room type</option>
                  <option value="Private room">Private room</option>
                  <option value="2 Sharing">2 Sharing</option>
                  <option value="3 Sharing">3 Sharing</option>
                  <option value="4 Sharing">4 Sharing</option>
                  <option value="Bed">Bed only</option>
                </select>
              </div>

              {/* Search CTA Button */}
              <button
                type="button"
                className="btn"
                onClick={executeSearch}
                style={{ height: 44, alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Search size={16} /> Find Rooms
              </button>
            </div>

            {/* Quick 3-Pillar Discovery Pills */}
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
                <Sparkles size={13} color="#0f766e" /> Quick Search:
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

              {/* Station Proximity */}
              <button
                type="button"
                onClick={() => router.push('/search?landmark=samastipur-jn&stationMaxKm=2')}
                className="pill"
                style={{ cursor: 'pointer' }}
              >
                🚉 Near Station (&lt;2km)
              </button>

              {/* College Hub */}
              <button
                type="button"
                onClick={() => router.push('/search?landmark=samastipur-college')}
                className="pill"
                style={{ cursor: 'pointer' }}
              >
                🎓 Colleges
              </button>

              {/* PIN 848101 */}
              <button
                type="button"
                onClick={() => router.push('/search?pincode=848101')}
                className="pill"
                style={{ cursor: 'pointer' }}
              >
                📮 PIN 848101
              </button>

              {/* Budget Under 5K */}
              <button
                type="button"
                onClick={() => router.push('/search?max=5000')}
                className="pill"
                style={{ cursor: 'pointer' }}
              >
                💰 Under ₹5,000
              </button>

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
            Prototype preview · Transparent room discovery with verified rent, bills, and distance.
          </div>
        </div>
      </section>

      {/* College & Landmark Corridor Section */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Explore rooms by <em className="title-accent">landmark</em></h2>
              <p>कॉलेज, रेलवे स्टेशन या मुख्य बाज़ार के पास कमरे और PGs खोजें।</p>
            </div>
            <Link href="/search" className="muted">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="destinations">
            {SAMASTIPUR_LANDMARKS.map((lm) => {
              const Icon =
                lm.category === 'transit'
                  ? Train
                  : lm.category === 'college'
                  ? GraduationCap
                  : Hospital;
              return (
                <button
                  key={lm.id}
                  className="destination"
                  onClick={() => router.push(`/search?landmark=${lm.id}`)}
                >
                  <div className="dest-icon">
                    <Icon size={18} />
                  </div>
                  <div className="dest-type">
                    {lm.category === 'transit' ? 'Transit Hub' : lm.category === 'college' ? 'Academic Hub' : 'Healthcare'}
                  </div>
                  <div className="dest-name">{lm.shortName}</div>
                </button>
              );
            })}
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
              No rooms listed in Samastipur <em className="title-accent">yet</em>
            </h2>
            <p className="muted" style={{ maxWidth: 480, margin: '8px auto 20px' }}>
              Are you a PG owner or landlord? Be the first to list your rooms with 100% transparent pricing and manage inquiries directly.
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
