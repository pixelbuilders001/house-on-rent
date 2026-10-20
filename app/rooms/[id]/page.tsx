'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Sparkles,
  Utensils,
  Wifi,
  Zap,
  Droplets,
  Layers,
  Bed,
  Car,
  X,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { getPropertyById, getAvailableBeds } from '@/lib/services/propertyService';
import type { Property } from '@/lib/mock-data/types';
import { mockReviews } from '@/lib/mock-data/reviews';
import { getPropertyReviews, type PropertyReview } from '@/lib/services/catalogService';
import { calculateMonthlyCost, calculateMoveInCost } from '@/lib/pricing';
import { Modal } from '@/components/Modal';
import { getStorageItem, setStorageItem } from '@/lib/storage';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function Detail({ params }: { params: { id: string } }) {
  const [p, setP] = useState<Property>();
  const [reviews, setReviews] = useState<PropertyReview[]>(
    mockReviews.map((review, i) => ({ id: 'demo-' + i, ...review }))
  );
  const [beds, setBeds] = useState<any[]>([]);
  const [modal, setModal] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [chosen, setChosen] = useState<any>();
  const [pricingTab, setPricingTab] = useState<'monthly' | 'movein'>('monthly');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gallery & Lightbox states
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Visit form state
  const [visitDate, setVisitDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [visitSlot, setVisitSlot] = useState('Morning (10:00 AM - 1:00 PM)');
  const [contactName, setContactName] = useState('Rahul Sharma');
  const [contactPhone, setContactPhone] = useState('');

  const router = useRouter();

  useEffect(() => {
    getPropertyReviews(params.id).then(setReviews);
    getPropertyById(params.id).then(async (x) => {
      if (x) {
        setP(x);
        setBeds(await getAvailableBeds(x.id));
      }
    });
    setSaved(getStorageItem<string[]>('roomsaathi_saved_properties', []).includes(params.id));
  }, [params.id]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  const handleShare = async () => {
    if (!p) return;
    const shareData = {
      title: `${p.name} - Room in ${p.area}, Samastipur`,
      text: `Check out ${p.name} in ${p.area}, Samastipur. Rent: ₹${p.rent.toLocaleString()}/mo with Zero Brokerage!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // User cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard! Share it with your friends.');
    } catch {
      showToast(`Share URL: ${window.location.href}`);
    }
  };

  const handleSaveToggle = () => {
    if (!p) return;
    const arr = getStorageItem<string[]>('roomsaathi_saved_properties', []);
    const next = saved ? arr.filter((x) => x !== p.id) : [...arr, p.id];
    setStorageItem('roomsaathi_saved_properties', next);
    setSaved(!saved);
    showToast(!saved ? 'Saved to your favorites!' : 'Removed from saved properties');
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null || !p) return;
      const imagesList = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : ['/mock/roomsaathi-property-gallery.png']);
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev! + 1) % imagesList.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev! - 1 + imagesList.length) % imagesList.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, p]);

  function finish(text: string, key: string, payload: any) {
    setStorageItem(key, [
      ...getStorageItem<any[]>(key, []),
      { ...payload, propertyId: p?.id, createdAt: new Date().toISOString() },
    ]);
    const supabase = getSupabaseBrowserClient();
    if (supabase && p) {
      const renterName = payload.name || payload.renterName || 'Website Visitor';
      const renterPhone = payload.phone || payload.renterPhone || '+91 98000 00000';
      const lookingFor = payload.bed?.bed ? `${payload.bed.room} - ${payload.bed.bed}` : p.accommodation;
      supabase
        .from('leads')
        .insert({
          property_id: p.id,
          renter_name: renterName,
          renter_phone: renterPhone,
          budget: p.rent,
          looking_for: lookingFor,
          destination: p.area || 'Samastipur',
          status: 'new',
          visit_date: payload.date || visitDate,
          visit_time: payload.time || visitSlot,
          notes: payload.kind ? `Inquiry via ${payload.kind}` : 'Scheduled property visit from details page',
        })
        .then(({ error }) => {
          if (error) console.error('Failed to sync lead to Supabase', error);
        });
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from('profiles').update({ role: 'tenant' }).eq('id', user.id).then();
        }
      });
    }
    setMessage(text);
    setModal('success');
  }

  if (!p) {
    return (
      <div className="container section" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <Link href="/search" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <ArrowLeft size={16} /> Back to room search
          </Link>
          <h2>Room <em className="title-accent">not found</em></h2>
          <p className="muted" style={{ maxWidth: 460, margin: '10px auto 20px' }}>
            This property listing might be inactive or no longer available. Explore other verified rooms across Samastipur.
          </p>
          <Link className="btn" href="/search">
            Browse all verified rooms
          </Link>
        </div>
      </div>
    );
  }

  // Prepared photos array
  const rawImages = (p.images && p.images.length > 0)
    ? p.images
    : (p.image && p.image.trim() !== '' && !p.image.includes('roomsaathi-property-gallery.png') ? [p.image] : []);
  
  const displayPhotos = rawImages.length > 0 ? rawImages : ['/mock/roomsaathi-property-gallery.png'];
  const photo1 = displayPhotos[0] || '/mock/roomsaathi-property-gallery.png';
  const photo2 = displayPhotos[1] || displayPhotos[0] || '/mock/roomsaathi-property-gallery.png';
  const photo3 = displayPhotos[2] || displayPhotos[0] || '/mock/roomsaathi-property-gallery.png';

  const monthlyCost = calculateMonthlyCost(p);
  const moveInCost = calculateMoveInCost(p);

  // Map amenities to icons
  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi') || lower.includes('wi-fi')) return <Wifi size={17} />;
    if (lower.includes('food') || lower.includes('meal')) return <Utensils size={17} />;
    if (lower.includes('water') || lower.includes('ro')) return <Droplets size={17} />;
    if (lower.includes('power') || lower.includes('backup') || lower.includes('inverter')) return <Zap size={17} />;
    if (lower.includes('cctv') || lower.includes('security')) return <ShieldCheck size={17} />;
    if (lower.includes('bed') || lower.includes('room') || lower.includes('furniture')) return <Bed size={17} />;
    if (lower.includes('clean') || lower.includes('housekeep')) return <Sparkles size={17} />;
    if (lower.includes('park') || lower.includes('bike')) return <Car size={17} />;
    if (lower.includes('wash') || lower.includes('laundry')) return <Layers size={17} />;
    return <Check size={17} />;
  };

  const nameParts = p.name.split(' ');
  const titlePrefix = nameParts.slice(0, -1).join(' ') || nameParts[0];
  const titleAccent = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${p.name} ${p.area} Samastipur ${p.pincode || ''} Bihar`
  )}`;

  return (
    <div className="detail-v2-container">
      {/* Toast Notification */}
      {toastMessage && <div className="toast">{toastMessage}</div>}

      {/* Breadcrumb Hierarchy */}
      <nav className="detail-v2-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>›</span>
        <Link href="/search">Rooms in Samastipur</Link>
        <span>›</span>
        <Link href={`/search?q=${encodeURIComponent(p.area)}`}>{p.area}</Link>
        <span>›</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{p.name}</span>
      </nav>

      {/* Header & Quick Action Row */}
      <div className="detail-v2-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span className="tag" style={{ background: '#eaf5ef', color: '#176b58', fontWeight: 700, padding: '4px 10px' }}>
              {p.type || 'Verified Room'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              <ShieldCheck size={14} color="#16a34a" /> Verified Listing
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '3px 9px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              ⚡ Zero Brokerage
            </span>
          </div>
          
          <h1 className="detail-v2-title">
            {titlePrefix} {titleAccent && <em className="title-accent">{titleAccent}</em>}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', color: '#5e7068', fontSize: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={16} color="#176b58" />
              <b>{p.area}</b>, Samastipur {p.pincode ? `· PIN ${p.pincode}` : ''}
            </span>
            <span>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Star size={15} fill="#f59e0b" color="#f59e0b" />
              <b style={{ color: 'var(--ink)' }}>{p.rating || 4.8}</b>
              <span className="muted">({p.reviewCount || 12} reviews)</span>
            </span>
            <span>·</span>
            <span style={{ color: '#047857', fontWeight: 600 }}>
              {p.availableBeds > 0 ? `🟢 ${p.availableBeds} beds available` : '🟡 Few beds left'}
            </span>
          </div>
        </div>

        {/* Share & Save Buttons */}
        <div className="detail-v2-actions">
          <button className="detail-action-btn" onClick={handleShare} title="Share room">
            <Share2 size={16} /> Share
          </button>
          <button className={`detail-action-btn ${saved ? 'saved' : ''}`} onClick={handleSaveToggle} title="Save to favorites">
            <Heart size={16} fill={saved ? '#dc2626' : 'none'} color={saved ? '#dc2626' : 'currentColor'} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* =======================================================
          HERO PHOTO SHOWCASE (Desktop Asymmetric + Mobile Slider)
          ======================================================= */}
      {/* Desktop Magazine Gallery */}
      <div className="detail-showcase-desktop">
        <div
          className="primary-photo"
          style={{ backgroundImage: `url(${photo1})` }}
          onClick={() => setLightboxIndex(0)}
        >
          <span className="image-label" style={{ position: 'absolute', bottom: 18, left: 18 }}>
            Cover photo
          </span>
        </div>
        <div className="secondary-photos">
          <div
            className="secondary-photo"
            style={{ backgroundImage: `url(${photo2})` }}
            onClick={() => setLightboxIndex(1 % displayPhotos.length)}
          >
            <span className="image-label" style={{ position: 'absolute', bottom: 12, left: 12 }}>
              Room & Interior
            </span>
          </div>
          <div
            className="secondary-photo"
            style={{ backgroundImage: `url(${photo3})` }}
            onClick={() => setLightboxIndex(2 % displayPhotos.length)}
          >
            <span className="image-label" style={{ position: 'absolute', bottom: 12, left: 12 }}>
              Washroom & Common
            </span>
          </div>
        </div>

        <button className="view-photos-badge" onClick={() => setLightboxIndex(0)}>
          📷 View all {displayPhotos.length} photos
        </button>
      </div>

      {/* Mobile Touch-Swipeable Gallery Slider */}
      <div
        className="detail-showcase-mobile"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              setActiveMobileSlide((prev) => (prev === displayPhotos.length - 1 ? 0 : prev + 1));
            } else {
              setActiveMobileSlide((prev) => (prev === 0 ? displayPhotos.length - 1 : prev - 1));
            }
          }
          touchStartX.current = null;
        }}
      >
        <div
          className="detail-mobile-slide"
          style={{ backgroundImage: `url(${displayPhotos[activeMobileSlide]})` }}
          onClick={() => setLightboxIndex(activeMobileSlide)}
        />
        
        {/* Navigation Arrows */}
        {displayPhotos.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMobileSlide((prev) => (prev === 0 ? displayPhotos.length - 1 : prev - 1));
              }}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 0,
                display: 'grid',
                placeItems: 'center',
                zIndex: 4
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMobileSlide((prev) => (prev === displayPhotos.length - 1 ? 0 : prev + 1));
              }}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                border: 0,
                display: 'grid',
                placeItems: 'center',
                zIndex: 4
              }}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div className="detail-mobile-dots">
          {displayPhotos.map((_, i) => (
            <span key={i} className={`detail-mobile-dot ${i === activeMobileSlide ? 'active' : ''}`} />
          ))}
        </div>

        <div className="detail-mobile-counter">
          📷 {activeMobileSlide + 1} / {displayPhotos.length}
        </div>
      </div>

      {/* =======================================================
          MAIN CONTENT & STICKY BOOKING SIDEBAR GRID
          ======================================================= */}
      <div className="detail-v2-grid">
        {/* Left Column: Flow of Details */}
        <div className="detail-main-flow">
          {/* 1. At-a-Glance Spec Ribbon */}
          <div className="detail-spec-ribbon">
            <div className="spec-ribbon-item">
              <div className="spec-icon-box">🛏️</div>
              <div>
                <div className="spec-text-label">Room Type</div>
                <div className="spec-text-val">{p.type || 'Single/Shared'}</div>
              </div>
            </div>
            <div className="spec-ribbon-item">
              <div className="spec-icon-box">👥</div>
              <div>
                <div className="spec-text-label">Sharing</div>
                <div className="spec-text-val">{p.accommodation || 'Double Sharing'}</div>
              </div>
            </div>
            <div className="spec-ribbon-item">
              <div className="spec-icon-box">🛋️</div>
              <div>
                <div className="spec-text-label">Furnishing</div>
                <div className="spec-text-val">Fully Furnished</div>
              </div>
            </div>
            <div className="spec-ribbon-item">
              <div className="spec-icon-box">🛡️</div>
              <div>
                <div className="spec-text-label">Security</div>
                <div className="spec-text-val">1 Mo. Deposit</div>
              </div>
            </div>
          </div>

          {/* 2. Interactive Bed Selection */}
          <section className="detail-section-card">
            <div className="detail-section-title">
              <span>Available Beds & Layouts</span>
              <span className="tag" style={{ marginLeft: 'auto', fontSize: 12 }}>
                {beds.length} Total Options
              </span>
            </div>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: 14 }}>
              Choose your preferred room and bed. You can inspect it during your scheduled visit.
            </p>
            <div className="room-grid">
              {(beds.length
                ? beds
                : [
                    { id: 'b1', room: 'Room 101', bed: 'Bed A (Window Side)', status: 'Available' },
                    { id: 'b2', room: 'Room 101', bed: 'Bed B (Balcony View)', status: 'Available' },
                    { id: 'b3', room: 'Room 102', bed: 'Bed A', status: 'Occupied' },
                  ]
              ).map((b) => (
                <div
                  key={b.id}
                  className="room"
                  style={{
                    borderRadius: 14,
                    borderColor: chosen?.id === b.id ? 'var(--green)' : 'var(--line)',
                    background: chosen?.id === b.id ? '#f3faf6' : 'white',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <b style={{ fontSize: 15 }}>{b.room}</b>
                    <span
                      className={`tag ${b.status === 'Available' ? '' : 'pending'}`}
                      style={{ fontSize: 11 }}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="muted" style={{ margin: '6px 0 12px', fontSize: 13 }}>
                    {b.bed}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>
                      ₹{p.rent.toLocaleString()}
                      <small className="muted" style={{ fontWeight: 500, fontSize: 12 }}>
                        /mo
                      </small>
                    </span>
                    <button
                      className={`btn small ${chosen?.id === b.id ? '' : 'outline'}`}
                      disabled={b.status === 'Occupied'}
                      onClick={() => {
                        setChosen(b);
                        setModal('visit');
                      }}
                    >
                      {b.status === 'Occupied' ? 'Occupied' : chosen?.id === b.id ? 'Selected' : 'Request Bed'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Transparent Cost Breakdown */}
          <section className="detail-section-card">
            <div className="detail-section-title">
              <span>Financial Transparency</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: 999 }}>
                ✓ No Hidden Fees
              </span>
            </div>

            <div className="pricing-tabs">
              <button
                className={`pricing-tab-btn ${pricingTab === 'monthly' ? 'active' : ''}`}
                onClick={() => setPricingTab('monthly')}
              >
                Monthly Living Cost (₹{monthlyCost.toLocaleString()}/mo)
              </button>
              <button
                className={`pricing-tab-btn ${pricingTab === 'movein' ? 'active' : ''}`}
                onClick={() => setPricingTab('movein')}
              >
                Move-in Cost (₹{moveInCost.toLocaleString()})
              </button>
            </div>

            {pricingTab === 'monthly' ? (
              <div>
                <div className="breakdown-row">
                  <span>Base room rent</span>
                  <b>₹{p.rent.toLocaleString()}</b>
                </div>
                <div className="breakdown-row">
                  <span>Electricity estimation</span>
                  <b>₹{p.electricity.toLocaleString()}</b>
                </div>
                <div className="breakdown-row">
                  <span>High-speed Wi-Fi</span>
                  <b>{p.wifiCost > 0 ? `₹${p.wifiCost.toLocaleString()}` : 'Free Included'}</b>
                </div>
                <div className="breakdown-row">
                  <span>Water & maintenance</span>
                  <b>₹{p.maintenance.toLocaleString()}</b>
                </div>
                <div className="breakdown-row">
                  <span>Food {p.foodIncluded ? '(Included in rent)' : '(Optional meal plan)'}</span>
                  <b>₹{p.foodCost.toLocaleString()}</b>
                </div>
                <div className="breakdown-row total" style={{ marginTop: 8 }}>
                  <span>Estimated Total Monthly Living</span>
                  <span style={{ color: 'var(--green)', fontSize: 18 }}>₹{monthlyCost.toLocaleString()}</span>
                </div>
                <p className="muted" style={{ margin: '12px 0 0', fontSize: 12 }}>
                  ⓘ All utility charges are transparent. Actual electricity is billed as per government sub-meter readings.
                </p>
              </div>
            ) : (
              <div>
                <div className="breakdown-row">
                  <span>First month room rent</span>
                  <b>₹{p.rent.toLocaleString()}</b>
                </div>
                <div className="breakdown-row">
                  <span>Security deposit (100% Refundable)</span>
                  <b>₹{p.deposit.toLocaleString()}</b>
                </div>
                <div className="breakdown-row">
                  <span>Brokerage fee</span>
                  <b style={{ color: '#16a34a' }}>₹0 (Zero Brokerage)</b>
                </div>
                <div className="breakdown-row total" style={{ marginTop: 8 }}>
                  <span>Total One-time Move-in Amount</span>
                  <span style={{ color: 'var(--green)', fontSize: 18 }}>₹{moveInCost.toLocaleString()}</span>
                </div>
                <p className="muted" style={{ margin: '12px 0 0', fontSize: 12 }}>
                  🛡️ Security deposit is securely managed and fully returned at checkout as per standard rental notice policy.
                </p>
              </div>
            )}
          </section>

          {/* 4. Amenities Grid */}
          <section className="detail-section-card">
            <h3 className="detail-section-title">Amenities & Facilities</h3>
            <div className="detail-amenities-grid">
              {p.amenities.map((item) => (
                <div key={item} className="detail-amenity-card">
                  <div className="detail-amenity-icon">{getAmenityIcon(item)}</div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. Locality & Commute Matrix */}
          <section className="detail-section-card">
            <div className="detail-section-title">
              <Compass size={20} color="var(--green)" />
              <span>Location & Transit Hubs</span>
            </div>

            <div className="detail-transit-banner">
              <div>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85 }}>
                  Neighborhood
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                  {p.area}, Samastipur
                </div>
                <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                  Pin Code: {p.pincode || '848101'} · Safe student & family residential hub
                </div>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn small"
                style={{ background: 'white', color: '#183d33', border: 0, fontWeight: 700 }}
              >
                <ExternalLink size={14} /> Open in Google Maps
              </a>
            </div>

            <div className="transit-pills-row">
              <div className="transit-pill-item">
                <div style={{ fontSize: 24 }}>🚉</div>
                <div>
                  <b style={{ fontSize: 14 }}>Samastipur Jn Railway Station</b>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    <b>{p.stationDistanceKm != null ? `${p.stationDistanceKm} km` : '2.1 km'}</b> away · ~
                    {p.stationDistanceKm != null ? Math.round(p.stationDistanceKm * 3.5) : 8} min by e-rickshaw
                  </p>
                </div>
              </div>

              <div className="transit-pill-item">
                <div style={{ fontSize: 24 }}>🚌</div>
                <div>
                  <b style={{ fontSize: 14 }}>Govt Bus Stand</b>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    <b>{p.busStandDistanceKm != null ? `${p.busStandDistanceKm} km` : '1.8 km'}</b> away · ~
                    {p.busStandDistanceKm != null ? Math.round(p.busStandDistanceKm * 3.5) : 6} min commute
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, padding: '12px 14px', background: '#f5faf7', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#335044' }}>
              <Clock size={16} color="var(--green)" />
              <span>
                Daily commute to major colleges and coaching centers: <b>{p.commuteMinutes || 12} mins average</b>.
              </span>
            </div>
          </section>

          {/* 6. About & Verified Host Card */}
          <section className="detail-section-card">
            <h3 className="detail-section-title">About this Property</h3>
            <p style={{ lineHeight: 1.75, color: '#4a5d54', fontSize: 14.5 }}>
              {p.description ||
                `${p.name} provides clean, secure, and student-friendly rooms in ${p.area}, Samastipur. Designed for hassle-free living with peaceful environment, high-speed Wi-Fi, and convenient access to local markets and transit hubs.`}
            </p>

            <div style={{ marginTop: 24 }}>
              <div className="detail-host-card">
                <div className="host-avatar">
                  {(p.owner || 'Host').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 16 }}>{p.owner || 'Verified RoomSaathi Host'}</b>
                    <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: 99, fontWeight: 700 }}>
                      ✓ Verified Host
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Property Owner · Usually responds within 30 minutes · Hindi & English
                  </div>
                </div>
                <button
                  className="btn small outline"
                  onClick={() => setModal('contact')}
                >
                  <MessageCircle size={15} /> Contact Host
                </button>
              </div>
            </div>
          </section>

          {/* 7. House Rules & Safety */}
          <section className="detail-section-card">
            <h3 className="detail-section-title">House Rules & Safety Policies</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {(p.rules && p.rules.length > 0
                ? p.rules
                : [
                    'Gate closing time: 10:00 PM',
                    'Visitors allowed in common area with prior notice',
                    'Quiet study hours from 10:30 PM to 6:00 AM',
                    'Non-smoking & alcohol-free premises',
                    'Subletting strictly prohibited',
                  ]
              ).map((rule) => (
                <div
                  key={rule}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#f9fbf9',
                    border: '1px solid #e8efe9',
                    fontSize: 13.5,
                    color: '#42584e',
                  }}
                >
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 8. Resident Reviews */}
          <section className="detail-section-card">
            <div className="detail-section-title">
              <Star size={20} fill="#f59e0b" color="#f59e0b" />
              <span>Resident Reviews ({reviews.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '16px',
                    borderRadius: 14,
                    background: '#fcfdfc',
                    border: '1px solid #eaf0eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#e0eee5',
                          color: '#1b5e48',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <b style={{ fontSize: 14 }}>{r.name}</b>
                        <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
                          Verified Resident
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < r.rating ? '#f59e0b' : '#e5e7eb'}
                          color={i < r.rating ? '#f59e0b' : '#e5e7eb'}
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, color: '#586b62', lineHeight: 1.6 }}>
                    {r.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Booking Widget (Desktop) */}
        <aside className="detail-booking-sidebar">
          <div className="booking-price-header">
            <div>
              <span className="booking-price-amount">₹{p.rent.toLocaleString()}</span>
              <span className="muted" style={{ fontSize: 13 }}>
                {' '}
                / month
              </span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: 99 }}>
              Zero Brokerage
            </span>
          </div>

          <div style={{ background: '#f8faf8', padding: '10px 14px', borderRadius: 12, margin: '14px 0 20px', fontSize: 13, color: '#4d6157', border: '1px solid #e5ede7' }}>
            <span>Estimated all-inclusive living: </span>
            <b style={{ color: 'var(--ink)' }}>₹{monthlyCost.toLocaleString()}/mo</b>
          </div>

          {chosen && (
            <div style={{ background: '#edf7f1', padding: '9px 12px', borderRadius: 10, marginBottom: 14, fontSize: 12, color: '#14532d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Selected: <b>{chosen.room} ({chosen.bed})</b></span>
              <button onClick={() => setChosen(null)} style={{ border: 0, background: 'transparent', color: '#14532d', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
          )}

          <div className="stack" style={{ gap: 10 }}>
            <button
              className="btn"
              style={{ width: '100%', height: 48, fontSize: 15 }}
              onClick={() => setModal('visit')}
            >
              <CalendarDays size={18} /> Schedule a Free Visit
            </button>

            <button
              className="btn outline"
              style={{ width: '100%', height: 44, fontSize: 14 }}
              onClick={() => setModal('contact')}
            >
              <MessageCircle size={17} color="#25D366" /> Chat on WhatsApp
            </button>
          </div>

          <div className="booking-guarantee-list">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>Free instant property visit scheduling</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>100% Refundable security deposit</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>Direct owner rental agreement · No brokerage</span>
            </div>
          </div>
        </aside>
      </div>

      {/* =======================================================
          MOBILE DOCKED BOTTOM ACTION BAR (Screens <= 850px)
          ======================================================= */}
      <div className="detail-mobile-dock">
        <div className="detail-mobile-dock-inner">
          <div>
            <div style={{ fontSize: 18, fontWeight: 850, color: 'var(--ink)', lineHeight: 1.1 }}>
              ₹{p.rent.toLocaleString()}
              <small className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
                /mo
              </small>
            </div>
            <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>
              Zero Brokerage · Free Visit
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn outline"
              style={{ padding: '9px 12px', minHeight: 42, borderRadius: 10 }}
              onClick={() => setModal('contact')}
              title="Chat on WhatsApp"
            >
              <MessageCircle size={18} color="#25D366" />
            </button>
            <button
              className="btn"
              style={{ padding: '9px 18px', minHeight: 42, fontSize: 14, borderRadius: 10 }}
              onClick={() => setModal('visit')}
            >
              <CalendarDays size={16} /> Schedule Visit
            </button>
          </div>
        </div>
      </div>

      {/* =======================================================
          FULLSCREEN HIGH-RES LIGHTBOX MODAL
          ======================================================= */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <div className="lightbox-topbar" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <b>{p.name}</b>
              <span style={{ opacity: 0.7, fontSize: 13 }}>
                Photo {lightboxIndex + 1} of {displayPhotos.length}
              </span>
            </div>
            <button
              onClick={() => setLightboxIndex(null)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 0,
                color: 'white',
                borderRadius: '50%',
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {displayPhotos.length > 1 && (
              <button
                className="lightbox-nav-btn"
                style={{ left: 24 }}
                onClick={() =>
                  setLightboxIndex((prev) => (prev! === 0 ? displayPhotos.length - 1 : prev! - 1))
                }
                aria-label="Previous photo"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <div className="lightbox-img-wrap">
              <img
                src={displayPhotos[lightboxIndex]}
                alt={`${p.name} - Photo ${lightboxIndex + 1}`}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {displayPhotos.length > 1 && (
              <button
                className="lightbox-nav-btn"
                style={{ right: 24 }}
                onClick={() =>
                  setLightboxIndex((prev) => (prev! === displayPhotos.length - 1 ? 0 : prev! + 1))
                }
                aria-label="Next photo"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Thumbnail Track */}
          <div className="lightbox-thumbnails" onClick={(e) => e.stopPropagation()}>
            {displayPhotos.map((photo, i) => (
              <div
                key={i}
                className={`lightbox-thumb ${i === lightboxIndex ? 'active' : ''}`}
                style={{ backgroundImage: `url(${photo})` }}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* =======================================================
          SCHEDULE VISIT MODAL
          ======================================================= */}
      {modal === 'visit' && (
        <Modal title={`Schedule a Free Visit - ${p.name}`} onClose={() => setModal('')}>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 13.5 }}>
            Pick a date and convenient time. The property manager will welcome you and show the available rooms.
          </p>

          {chosen && (
            <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 14, fontSize: 13, color: '#166534' }}>
              ✓ Preferred unit: <b>{chosen.room} ({chosen.bed})</b>
            </div>
          )}

          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              finish(
                `Your visit for ${p.name} on ${visitDate} (${visitSlot}) has been scheduled! The owner has received your request.`,
                'roomsaathi_lead_requests',
                {
                  name: contactName,
                  phone: contactPhone,
                  date: visitDate,
                  time: visitSlot,
                  bed: chosen,
                  kind: 'Scheduled Visit',
                }
              );
            }}
          >
            <div className="field">
              <label>Your Full Name</label>
              <input
                className="input"
                name="name"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </div>

            <div className="field">
              <label>Phone / WhatsApp Number</label>
              <input
                className="input"
                name="phone"
                type="tel"
                required
                placeholder="10-digit mobile number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div className="two-col">
              <div className="field">
                <label>Preferred Visit Date</label>
                <input
                  className="input"
                  name="date"
                  type="date"
                  required
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="field">
                <label>Preferred Time Slot</label>
                <select
                  className="select"
                  name="time"
                  value={visitSlot}
                  onChange={(e) => setVisitSlot(e.target.value)}
                >
                  <option>Morning (10:00 AM - 1:00 PM)</option>
                  <option>Afternoon (1:00 PM - 4:00 PM)</option>
                  <option>Evening (4:00 PM - 7:30 PM)</option>
                </select>
              </div>
            </div>

            <div style={{ background: '#f8faf8', padding: '10px 12px', borderRadius: 10, fontSize: 12, color: '#596e64' }}>
              🛡️ No advance booking payment is required. Physical verification and keys handover happen directly at the property.
            </div>

            <button className="btn" style={{ width: '100%', height: 46 }}>
              Confirm Free Visit Request
            </button>
          </form>
        </Modal>
      )}

      {/* =======================================================
          CONTACT OWNER / WHATSAPP MODAL
          ======================================================= */}
      {modal === 'contact' && (
        <Modal title={`Connect with ${p.owner || 'Host'}`} onClose={() => setModal('')}>
          <p className="muted" style={{ margin: '0 0 16px', fontSize: 14 }}>
            Direct connection with verified host for <b>{p.name}</b> in {p.area}, Samastipur.
          </p>

          <div className="stack" style={{ gap: 12 }}>
            <button
              className="btn"
              style={{ background: '#25D366', color: 'white', border: 0 }}
              onClick={() => {
                const text = encodeURIComponent(
                  `Hi, I am interested in visiting ${p.name} (${p.accommodation}, Rent: ₹${p.rent}/mo) in ${p.area}, Samastipur found on RoomSaathi.`
                );
                window.open(`https://wa.me/919800000000?text=${text}`, '_blank');
                finish('WhatsApp chat initiated. The owner has been notified.', 'roomsaathi_lead_requests', {
                  kind: 'WhatsApp Direct',
                });
              }}
            >
              <MessageCircle size={18} /> Open WhatsApp Chat
            </button>

            <button
              className="btn outline"
              onClick={() =>
                finish('Call back request registered. Host will reach out shortly.', 'roomsaathi_lead_requests', {
                  kind: 'Phone Call',
                })
              }
            >
              <Phone size={18} /> Request Instant Call Back
            </button>

            <button
              className="btn soft"
              onClick={() => setModal('visit')}
            >
              <CalendarDays size={18} /> Schedule In-Person Visit Instead
            </button>
          </div>
        </Modal>
      )}

      {/* =======================================================
          CONFIRMATION SUCCESS MODAL
          ======================================================= */}
      {modal === 'success' && (
        <Modal title="Request Received!" onClose={() => setModal('')}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Check size={32} />
            </div>
            <h3 style={{ fontSize: 20, margin: '0 0 8px' }}>Thank you!</h3>
            <p style={{ color: '#4a5d54', fontSize: 14, margin: '0 0 14px' }}>{message}</p>
            <div style={{ background: '#f5faf7', padding: '12px', borderRadius: 12, fontSize: 12, color: '#3f594e', textAlign: 'left', marginBottom: 20 }}>
              ✓ Saved to your lead inquiries<br />
              ✓ Host contact details: +91 98000 00000<br />
              ✓ Location: {p.area}, Samastipur {p.pincode ? `(${p.pincode})` : ''}
            </div>
            <button className="btn" style={{ width: '100%' }} onClick={() => setModal('')}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
