'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import type { CityConfig } from '@/lib/services/dynamicLocationService';

interface CitySelectorProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  availableCities: CityConfig[];
  variant?: 'desktop' | 'mobile-pill';
}

export function CitySelector({
  selectedCity,
  onSelectCity,
  availableCities,
  variant = 'desktop',
}: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleCityClick = (city: CityConfig) => {
    if (city.isAvailable === false) {
      return; // Do nothing if Coming Soon! Not clickable/selectable.
    }
    onSelectCity(city.name);
    setIsOpen(false);
  };

  if (variant === 'mobile-pill') {
    return (
      <div className="city-selector-wrapper mobile-pill-wrapper" ref={containerRef}>
        <button
          type="button"
          className={`mobile-search-city-pill custom-pill ${isOpen ? 'is-open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          title="Select City"
        >
          <MapPin size={13} color="#059669" />
          <span className="mobile-search-city-text">{selectedCity}</span>
          <ChevronDown
            size={13}
            color="#059669"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="city-dropdown-menu mobile-dropdown" role="listbox">
            <div className="city-dropdown-list">
              {availableCities.map((city) => {
                const isSelected = city.name.toLowerCase() === selectedCity.toLowerCase();
                const isAvailable = city.isAvailable !== false;

                return (
                  <div
                    key={city.name}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={!isAvailable}
                    className={`city-dropdown-item ${isSelected ? 'is-selected' : ''} ${
                      !isAvailable ? 'is-coming-soon' : 'is-active'
                    }`}
                    onClick={() => handleCityClick(city)}
                  >
                    <span className="city-item-name">{city.name}</span>

                    <div className="city-item-right">
                      {isAvailable ? (
                        isSelected && <Check size={15} className="city-check-icon" />
                      ) : (
                        <span className="city-coming-soon-badge">Coming Soon</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Search Bar Variant
  return (
    <div className="city-selector-wrapper desktop-wrapper" ref={containerRef}>
      <button
        type="button"
        className={`search-bar-city-btn custom-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Select City"
      >
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
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="city-dropdown-menu desktop-dropdown" role="listbox">
          <div className="city-dropdown-list">
            {availableCities.map((city) => {
              const isSelected = city.name.toLowerCase() === selectedCity.toLowerCase();
              const isAvailable = city.isAvailable !== false;

              return (
                <div
                  key={city.name}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={!isAvailable}
                  className={`city-dropdown-item ${isSelected ? 'is-selected' : ''} ${
                    !isAvailable ? 'is-coming-soon' : 'is-active'
                  }`}
                  onClick={() => handleCityClick(city)}
                >
                  <span className="city-item-name">{city.name}</span>

                  <div className="city-item-right">
                    {isAvailable ? (
                      isSelected && <Check size={16} className="city-check-icon" />
                    ) : (
                      <span className="city-coming-soon-badge">Coming Soon</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
