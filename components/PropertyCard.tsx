'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Heart,
  MapPin,
  Star,
  Utensils,
  Wifi,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Camera,
  Check,
  Building2,
} from 'lucide-react';
import type { Property } from '@/lib/mock-data/types';
import { calculateMonthlyCost, calculateMoveInCost } from '@/lib/pricing';
export { PropertyCardSkeleton } from './PropertyCardSkeleton';

export function PropertyCard({
  property,
  saved = false,
  onSave
}: {
  property: Property;
  saved?: boolean;
  onSave?: () => void;
}) {
  const rawImages = (property?.images && property.images.length > 0)
    ? property.images.filter((img): img is string => typeof img === 'string' && img.trim() !== '')
    : (property?.image && property.image.trim() !== '' ? [property.image] : []);

  const [activeSlide, setActiveSlide] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasPhotos = rawImages.length > 0;
  const hasMultiplePhotos = rawImages.length > 1;
  const currentPhoto = hasPhotos ? (rawImages[activeSlide] || rawImages[0]) : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgLoaded(false);
    setActiveSlide((prev) => (prev === 0 ? rawImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgLoaded(false);
    setActiveSlide((prev) => (prev === rawImages.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (index !== activeSlide) {
      setImgLoaded(false);
      setActiveSlide(index);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveSlide((prev) => (prev === rawImages.length - 1 ? 0 : prev + 1));
      } else {
        setActiveSlide((prev) => (prev === 0 ? rawImages.length - 1 : prev - 1));
      }
    }
    touchStartX.current = null;
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) onSave();
  };

  const moveInCost = calculateMoveInCost(property);
  const monthlyCost = calculateMonthlyCost(property);

  return (
    <article className="property-card-modern">
      {/* 1. Photo Container with Carousel & Floating Badges */}
      <div
        className="card-photo-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Link href={`/rooms/${property.id}`} className="photo-link-wrapper" tabIndex={-1}>
          {hasPhotos && currentPhoto ? (
            <>
              {!imgLoaded && (
                <div
                  className="skeleton-pulse"
                  style={{ position: 'absolute', inset: 0, zIndex: 1 }}
                />
              )}
              <img
                src={currentPhoto}
                alt={property.name}
                className="card-photo-img"
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                style={{
                  opacity: imgLoaded ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                }}
              />
            </>
          ) : (
            <div className="card-no-photo-placeholder">
              <Building2 size={34} color="#94a3b8" strokeWidth={1.5} />
              <span className="no-photo-text">Photos Coming Soon</span>
              <span className="no-photo-sub">तस्वीरें जल्द उपलब्ध होंगी</span>
            </div>
          )}
        </Link>

        {/* Floating Badges (Top Left) */}
        <div className="card-floating-badges">
          {property.verified && (
            <span className="badge-verified">
              <ShieldCheck size={13} strokeWidth={2.5} />
              <span>Verified Landlord</span>
            </span>
          )}
          {property.brokerage === 0 && (
            <span className="badge-zero-brokerage">
              <Zap size={11} fill="currentColor" />
              <span>Zero Brokerage</span>
            </span>
          )}
        </div>

        {/* Frosted Wishlist Heart Button (Top Right) */}
        <button
          type="button"
          className={`card-heart-btn ${saved ? 'is-saved' : ''}`}
          aria-label={saved ? 'Unsave property' : 'Save property'}
          onClick={handleHeartClick}
        >
          <Heart size={17} fill={saved ? '#ef4444' : 'none'} color={saved ? '#ef4444' : '#1e293b'} strokeWidth={2} />
        </button>

        {/* Photo Counter Pill (Bottom Right) */}
        {hasMultiplePhotos && (
          <div className="card-photo-counter">
            <Camera size={11} />
            <span>{activeSlide + 1}/{rawImages.length}</span>
          </div>
        )}

        {/* Carousel Prev/Next Buttons (Visible on desktop hover) */}
        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              className="carousel-ctrl-btn prev"
              onClick={handlePrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="carousel-ctrl-btn next"
              onClick={handleNext}
              aria-label="Next photo"
            >
              <ChevronRight size={16} />
            </button>

            {/* Slider Dots Indicator (Bottom Center) */}
            <div className="carousel-dots-wrap">
              {rawImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleDotClick(e, idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`carousel-dot ${activeSlide === idx ? 'active' : ''}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. Card Content Body */}
      <div className="card-content-body">
        {/* Row 1: Accommodation Pill + Rent */}
        <div className="card-price-row">
          <div className="card-main-price">
            <span className="currency-symbol">₹</span>
            <span className="price-amount">{Number(property?.rent || 0).toLocaleString('en-IN')}</span>
            <span className="price-period">/month</span>
          </div>
          <span className="accommodation-pill">
            {property.accommodation || property.type || 'Room'}
          </span>
        </div>

        {/* Row 2: Property Title & Rating */}
        <div className="card-title-row">
          <Link href={`/rooms/${property.id}`} className="card-title-link">
            <h3 className="card-heading">{property.name}</h3>
          </Link>
          <div className="card-rating-pill">
            <Star size={13} fill="#eab308" color="#eab308" />
            <span className="rating-score">{property.rating || 4.7}</span>
            <span className="rating-count">({property.reviewCount || 18})</span>
          </div>
        </div>

        {/* Row 3: Location, Station Proximity & PIN code */}
        <div className="card-location-row">
          <span className="location-area">
            <MapPin size={13} className="loc-pin-icon" />
            <span>{property.area}, {property.city || 'Samastipur'}</span>
          </span>
          <span className="location-divider">•</span>
          {property.userDistanceKm != null ? (
            <span className="proximity-tag near" title="Distance from searched spot">
              📍 {property.userDistanceKm} km away
            </span>
          ) : property.stationDistanceKm != null ? (
            <span className="proximity-tag station" title="Distance from Samastipur Jn Railway Station">
              🚉 {property.stationDistanceKm} km Stn
            </span>
          ) : (
            <span className="proximity-tag general">
              {property.distanceKm} km away
            </span>
          )}
          {property.pincode && (
            <span className="pincode-pill">
              📮 {property.pincode}
            </span>
          )}
        </div>

        {/* Row 4: Amenity Highlights Micro-Chips */}
        <div className="card-amenities-row">
          {property.foodAvailable && (
            <span className="amenity-chip">
              <Utensils size={12} className="amenity-chip-icon" />
              <span>{property.foodIncluded ? 'Food included' : 'Mess available'}</span>
            </span>
          )}
          {property.wifi && (
            <span className="amenity-chip">
              <Wifi size={12} className="amenity-chip-icon" />
              <span>Free Wi-Fi</span>
            </span>
          )}
          {property.electricityIncluded && (
            <span className="amenity-chip">
              <Zap size={11} className="amenity-chip-icon" />
              <span>Electricity incl.</span>
            </span>
          )}
          {property.availableBeds != null && property.availableBeds > 0 && (
            <span className="amenity-chip beds">
              <span>{property.availableBeds} {property.availableBeds === 1 ? 'bed left' : 'beds left'}</span>
            </span>
          )}
        </div>

        {/* Row 5: Transparent Move-In Strip & View CTA */}
        <div className="card-footer-strip">
          <div className="move-in-box">
            <div className="move-in-label">Move-in cost (Rent + Dep.)</div>
            <div className="move-in-value">
              ₹{moveInCost.toLocaleString('en-IN')}
              <span className="deposit-note"> (Dep: ₹{Number(property.deposit || 0).toLocaleString('en-IN')})</span>
            </div>
          </div>

          <Link href={`/rooms/${property.id}`} className="card-action-btn">
            <span>View Room</span>
            <ArrowRight size={14} className="action-arrow" />
          </Link>
        </div>
      </div>
    </article>
  );
}
