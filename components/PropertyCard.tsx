'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Clock, Star, Utensils, Wifi, ShieldCheck, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Property } from '@/lib/mock-data/types';
import { calculateMonthlyCost, calculateMoveInCost } from '@/lib/pricing';

export function PropertyCard({
  property,
  saved = false,
  onSave
}: {
  property: Property;
  saved?: boolean;
  onSave?: () => void;
}) {
  const crop = Number(property.id.slice(-1)) % 4;
  const position = ['0% 0%', '100% 0%', '0% 100%', '100% 100%'][crop];
  
  const rawImages = (property.images && property.images.length > 0)
    ? property.images
    : (property.image && property.image.trim() !== '' ? [property.image] : []);

  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const hasMultiplePhotos = rawImages.length > 1;
  const currentPhoto = rawImages[activeSlide] || rawImages[0] || '';
  const hasCustomImage = Boolean(currentPhoto && !currentPhoto.includes('roomsaathi-property-gallery.png'));
  const imageBg = hasCustomImage ? `url(${currentPhoto})` : 'url(/mock/roomsaathi-property-gallery.png)';
  const bgSize = hasCustomImage ? 'cover' : undefined;
  const bgPos = hasCustomImage ? 'center' : position;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide(prev => (prev === 0 ? rawImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide(prev => (prev === rawImages.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveSlide(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setActiveSlide(prev => (prev === rawImages.length - 1 ? 0 : prev + 1));
      } else {
        setActiveSlide(prev => (prev === 0 ? rawImages.length - 1 : prev - 1));
      }
    }
    touchStartX.current = null;
  };

  return (
    <article className="property-card">
      <div
        className="property-image has-photo"
        style={{
          backgroundImage: imageBg,
          backgroundSize: bgSize,
          backgroundPosition: bgPos,
          position: 'relative'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className="image-label">
          {property.verified ? (
            <>
              <ShieldCheck size={13} style={{ verticalAlign: 'middle' }} /> Demo verified
            </>
          ) : (
            'Owner verified'
          )}
        </span>

        {/* Multi-Photo Carousel Slider Controls */}
        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.7)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.7)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 4,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
            >
              <ChevronRight size={16} />
            </button>

            {/* Slider Dots */}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                zIndex: 4
              }}
            >
              {rawImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => handleDotClick(e, idx)}
                  aria-label={`Go to photo ${idx + 1}`}
                  style={{
                    width: activeSlide === idx ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: activeSlide === idx ? '#10b981' : 'rgba(255, 255, 255, 0.75)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </>
        )}

        <button
          className={`heart ${saved ? 'is-saved' : ''}`}
          aria-label={saved ? 'Unsave property' : 'Save property'}
          onClick={onSave}
        >
          <Heart size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="property-body">
        <div className="card-top">
          <div>
            <div className="card-title">{property.name}</div>
            <div className="muted">{property.area}, Samastipur</div>
          </div>
          <span className="rating">
            <Star size={13} fill="#e7b74d" color="#e7b74d" /> {property.rating || 4.5}{' '}
            <span className="muted">({property.reviewCount || 0})</span>
          </span>
        </div>

        <div className="price">
          ₹{property.rent.toLocaleString('en-IN')}
          <small>/month rent</small>
        </div>

        <div className="card-meta">
          <span>
            {property.accommodation} · {property.availableBeds} {property.availableBeds === 1 ? 'bed' : 'beds'} left
          </span>
          {property.stationDistanceKm != null ? (
            <span title="Distance from Samastipur Jn Railway Station">
              🚉 {property.stationDistanceKm} km Stn
            </span>
          ) : (
            <span>
              <MapPin size={13} /> {property.distanceKm} km
            </span>
          )}
          {property.busStandDistanceKm != null ? (
            <span title="Distance from Govt Bus Stand">
              🚌 {property.busStandDistanceKm} km Bus
            </span>
          ) : (
            <span>
              <Clock size={13} /> {property.commuteMinutes} min
            </span>
          )}
        </div>

        <div className="amenity-row">
          {property.foodAvailable && (
            <span className="amenity">
              <Utensils size={12} /> {property.foodIncluded ? 'Food included' : 'Food available'}
            </span>
          )}
          {property.wifi && (
            <span className="amenity">
              <Wifi size={12} /> Wi-Fi
            </span>
          )}
          {property.electricityIncluded && (
            <span className="amenity">⚡ Electricity included</span>
          )}
        </div>

        <div className="cost-row">
          <span>
            Est. monthly <strong>₹{calculateMonthlyCost(property).toLocaleString('en-IN')}</strong>
          </span>
          <span>
            Move-in <strong>₹{calculateMoveInCost(property).toLocaleString('en-IN')}</strong>
          </span>
        </div>

        <Link className="btn outline small card-action" href={`/rooms/${property.id}`}>
          View details <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
