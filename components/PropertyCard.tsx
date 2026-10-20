'use client';
import Link from 'next/link';
import { Heart, MapPin, Clock, Star, Utensils, Wifi, ShieldCheck, ArrowUpRight } from 'lucide-react';
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
  
  const hasCustomImage = Boolean(property.image && property.image.trim() !== '' && !property.image.includes('roomsaathi-property-gallery.png'));
  const imageBg = hasCustomImage ? `url(${property.image})` : 'url(/mock/roomsaathi-property-gallery.png)';
  const bgSize = hasCustomImage ? 'cover' : undefined;
  const bgPos = hasCustomImage ? 'center' : position;

  return (
    <article className="property-card">
      <div
        className="property-image has-photo"
        style={{
          backgroundImage: imageBg,
          backgroundSize: bgSize,
          backgroundPosition: bgPos
        }}
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
