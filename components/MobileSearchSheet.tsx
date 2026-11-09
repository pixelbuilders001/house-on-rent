'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Search, Crosshair, Compass } from 'lucide-react';
import { useSearchSheet } from '@/context/SearchSheetContext';
import { CitySelector } from '@/components/CitySelector';
import { getProperties } from '@/lib/services/propertyService';
import type { Property } from '@/lib/mock-data/types';
import {
  searchPlacesLive,
  getBrowserLocation,
  type GeocodedPlace,
} from '@/lib/services/geocodingService';
import {
  extractLiveLocationFacets,
  getAvailableCities,
} from '@/lib/services/dynamicLocationService';

export function MobileSearchSheet() {
  const router = useRouter();
  const { isSearchSheetOpen, closeSearchSheet } = useSearchSheet();

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('Samastipur');
  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [geoSuggestions, setGeoSuggestions] = useState<GeocodedPlace[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Load properties on mount
  useEffect(() => {
    let alive = true;
    getProperties()
      .then((data) => {
        if (alive) setProperties(data || []);
      })
      .catch((err) => console.error('Failed to load listings for search sheet:', err));
    return () => {
      alive = false;
    };
  }, []);

  // Lock body scroll and auto-focus when sheet is opened
  useEffect(() => {
    if (isSearchSheetOpen) {
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
  }, [isSearchSheetOpen]);

  // Handle global Escape key to close search sheet
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeSearchSheet();
      }
    }
    if (isSearchSheetOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSearchSheetOpen, closeSearchSheet]);

  // Compute available cities & inventory
  const availableCities = useMemo(() => getAvailableCities(properties), [properties]);
  const activeCity = useMemo(
    () => availableCities.find((c) => c.name.toLowerCase() === selectedCity.toLowerCase()) || availableCities[0],
    [availableCities, selectedCity]
  );
  const inventory = useMemo(() => extractLiveLocationFacets(properties), [properties]);

  // Debounced geocoding search
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
      closeSearchSheet();
      if (coords) {
        router.push(
          `/search?nearMe=true&lat=${coords.latitude}&lng=${coords.longitude}&maxDist=5&city=${encodeURIComponent(
            selectedCity
          )}`
        );
      } else {
        router.push(
          `/search?nearMe=true&lat=${activeCity.lat}&lng=${activeCity.lng}&maxDist=5&city=${encodeURIComponent(
            selectedCity
          )}`
        );
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

    closeSearchSheet();
    router.push(params.toString() ? `/search?${params.toString()}` : '/search');
  };

  const handleSelectPlace = (place: GeocodedPlace) => {
    setSearchQuery(place.name);
    closeSearchSheet();
    router.push(
      `/search?searchLat=${place.latitude}&searchLng=${place.longitude}&searchPlace=${encodeURIComponent(
        place.name
      )}&maxDist=5${selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : ''}`
    );
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

  if (!isSearchSheetOpen) return null;

  return (
    <div className="mobile-search-sheet" role="dialog" aria-modal="true" aria-label="Search Rooms">
      {/* Top Bar with Back Arrow, City Selector & Close */}
      <div className="mobile-search-topbar">
        <button
          type="button"
          className="mobile-search-back-btn"
          onClick={closeSearchSheet}
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
          onClick={closeSearchSheet}
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
            placeholder={`Search locality, area, or PIN in ${selectedCity}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
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
              onClick={handleNearMeClick}
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
                        closeSearchSheet();
                        router.push(`/search?area=${encodeURIComponent(a.name)}&city=${encodeURIComponent(selectedCity)}`);
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{a.name}</span>
                      <span className="mobile-search-chip-badge">{a.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches / Landmarks */}
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
                      closeSearchSheet();
                      router.push(`/search?q=${encodeURIComponent(item.name)}&city=${encodeURIComponent(selectedCity)}`);
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
                        closeSearchSheet();
                        router.push(`/search?pincode=${encodeURIComponent(p.name)}&city=${encodeURIComponent(selectedCity)}`);
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
                        closeSearchSheet();
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
                        closeSearchSheet();
                        router.push(`/search?area=${encodeURIComponent(a.name)}&city=${encodeURIComponent(selectedCity)}`);
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
                        closeSearchSheet();
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
                onClick={executeSearch}
              >
                <Search size={16} />
                <span>Search all rooms for "{searchQuery}"</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
