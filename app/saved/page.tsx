'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Heart,
  Search,
  Sparkles,
  ShieldCheck,
  LogIn,
  ArrowRight,
  Trash2,
  Table,
  Check,
  MapPin,
  IndianRupee,
  Share2,
  X,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import type { Property } from '@/lib/mock-data/types';
import { getProperties } from '@/lib/services/propertyService';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyCardSkeleton } from '@/components/PropertyCardSkeleton';
import { useAuth } from '@/context/AuthContext';
import { calculateMonthlyCost, calculateMoveInCost } from '@/lib/pricing';

type CategoryFilter = 'all' | 'room' | 'pg' | 'flat';
type SortOption = 'default' | 'rent-asc' | 'rent-desc';

export default function SavedPage() {
  const { savedIds, toggleSave, clearAllSaved, user, openAuthModal } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [showCompareTable, setShowCompareTable] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getProperties()
      .then((data) => {
        if (alive) {
          setProperties(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load properties for saved page:', err);
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  // Filter properties that are in savedIds
  const savedListings = useMemo(() => {
    return properties.filter((p) => savedIds.includes(p.id));
  }, [properties, savedIds]);

  // Category counts
  const counts = useMemo(() => {
    const singleRooms = savedListings.filter((p) => {
      const type = (p.type || '').toLowerCase();
      const acc = (p.accommodation || '').toLowerCase();
      return type.includes('room') || acc.includes('single') || type.includes('single');
    }).length;

    const pgs = savedListings.filter((p) => {
      const type = (p.type || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return type.includes('pg') || type.includes('hostel') || name.includes('pg') || name.includes('hostel');
    }).length;

    const flats = savedListings.filter((p) => {
      const type = (p.type || '').toLowerCase();
      return type.includes('bhk') || type.includes('flat') || type.includes('1rk') || type.includes('apartment');
    }).length;

    return {
      all: savedListings.length,
      room: singleRooms,
      pg: pgs,
      flat: flats,
    };
  }, [savedListings]);

  // Filtered and sorted listings
  const filteredListings = useMemo(() => {
    let list = [...savedListings];

    if (activeCategory === 'room') {
      list = list.filter((p) => {
        const type = (p.type || '').toLowerCase();
        const acc = (p.accommodation || '').toLowerCase();
        return type.includes('room') || acc.includes('single') || type.includes('single');
      });
    } else if (activeCategory === 'pg') {
      list = list.filter((p) => {
        const type = (p.type || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return type.includes('pg') || type.includes('hostel') || name.includes('pg') || name.includes('hostel');
      });
    } else if (activeCategory === 'flat') {
      list = list.filter((p) => {
        const type = (p.type || '').toLowerCase();
        return type.includes('bhk') || type.includes('flat') || type.includes('1rk') || type.includes('apartment');
      });
    }

    if (sortBy === 'rent-asc') {
      list.sort((a, b) => Number(a.rent || 0) - Number(b.rent || 0));
    } else if (sortBy === 'rent-desc') {
      list.sort((a, b) => Number(b.rent || 0) - Number(a.rent || 0));
    }

    return list;
  }, [savedListings, activeCategory, sortBy]);

  // Minimum rent among saved
  const minRent = useMemo(() => {
    if (savedListings.length === 0) return 0;
    return Math.min(...savedListings.map((p) => Number(p.rent || 0)));
  }, [savedListings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareWishlist = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard! · लिंक कॉपी हो गया!');
      } catch (_) {
        showToast('Link ready to share · लिंक शेयर करने के लिए तैयार है');
      }
    }
  };

  return (
    <div className="container section" style={{ minHeight: '75vh', paddingBottom: 80 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Check size={16} color="#34d399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Eyebrow & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div className="eyebrow" style={{ margin: 0 }}>
          पसंदीदा कमरे और पीजी · Shortlisted Wishlist
        </div>

        {/* User Account Status (Clean & Non-Technical) */}
        {user ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '5px 12px',
              borderRadius: 999,
              color: '#065f46',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={14} color="#059669" />
            <span>Shortlist Saved · सहेजी गई लिस्ट</span>
          </div>
        ) : null}
      </div>

      {/* Primary Page Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-1.2px' }}>
            Saved Rooms & PGs <span className="title-accent">· सहेजे गए कमरे</span>
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, maxWidth: 640 }}>
            Compare monthly rent, security deposit & amenities in one place.
            <span style={{ display: 'block', color: '#64748b', fontSize: 13, marginTop: 2 }}>
              कमरे का किराया, सिक्यूरिटी डिपॉजिट और सुविधाओं की तुलना एक ही जगह करें और सीधे मकान मालिक से संपर्क करें।
            </span>
          </p>
        </div>

        {/* Action Buttons (when listings exist) */}
        {savedListings.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowCompareTable((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 14px',
                borderRadius: 12,
                background: showCompareTable ? '#176b58' : '#ffffff',
                color: showCompareTable ? '#ffffff' : '#176b58',
                border: '1.5px solid #176b58',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              <Table size={15} />
              <span>{showCompareTable ? 'Hide Comparison · तुलना छिपाएं' : 'Compare Costs · खर्च तुलना'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWishlist}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 12,
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Share Wishlist"
            >
              <Share2 size={15} />
              <span>Share · शेयर</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 12px',
                borderRadius: 12,
                background: '#fff1f2',
                color: '#e11d48',
                border: '1px solid #fecdd3',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Remove All"
            >
              <Trash2 size={15} />
              <span>Clear All · हटाएं</span>
            </button>
          </div>
        )}
      </div>

      {/* Guest Safety Banner (Only when not logged in & has saved items) */}
      {!user && savedListings.length > 0 && (
        <div
          style={{
            marginTop: 22,
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #a7f3d0',
            borderRadius: 18,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            flexWrap: 'wrap',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#10b981',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
              }}
            >
              <Heart size={22} fill="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14.5, color: '#065f46' }}>
                Keep your saved rooms safe · अपनी पसंद की लिस्ट सुरक्षित रखें
              </div>
              <div style={{ fontSize: 12.5, color: '#047857', marginTop: 3, lineHeight: 1.4 }}>
                These {savedListings.length} rooms are saved on this device. Sign in so your shortlist is always accessible whenever you visit.
                <span style={{ display: 'block', color: '#065f46', fontSize: 11.5, marginTop: 1, opacity: 0.9 }}>
                  अपनी पसंदीदा लिस्ट को हमेशा सुरक्षित रखने और आसानी से देखने के लिए साइन इन करें।
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAuthModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 12,
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <LogIn size={15} />
            <span>Sign In · साइन इन करें</span>
          </button>
        </div>
      )}

      {/* Filter Chips & Stats Bar */}
      {savedListings.length > 0 && (
        <div
          style={{
            marginTop: 24,
            padding: '14px 16px',
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`pill ${activeCategory === 'all' ? 'selected' : ''}`}
              style={{ fontWeight: 700 }}
            >
              All · सभी ({counts.all})
            </button>

            {counts.room > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('room')}
                className={`pill ${activeCategory === 'room' ? 'selected' : ''}`}
                style={{ fontWeight: 700 }}
              >
                Single Rooms · कमरे ({counts.room})
              </button>
            )}

            {counts.pg > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('pg')}
                className={`pill ${activeCategory === 'pg' ? 'selected' : ''}`}
                style={{ fontWeight: 700 }}
              >
                PG & Hostels · पीजी ({counts.pg})
              </button>
            )}

            {counts.flat > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategory('flat')}
                className={`pill ${activeCategory === 'flat' ? 'selected' : ''}`}
                style={{ fontWeight: 700 }}
              >
                1BHK & Flats · फ्लैट ({counts.flat})
              </button>
            )}
          </div>

          {/* Quick Summary Pill & Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {minRent > 0 && (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f766e', background: '#ccfbf1', padding: '5px 10px', borderRadius: 8 }}>
                Rent from ₹{minRent.toLocaleString('en-IN')}/mo · न्यूनतम किराया
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
              <span style={{ fontWeight: 600 }}>Sort · क्रम:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="default">Default · सामान्य</option>
                <option value="rent-asc">Rent: Low to High · कम से ज्यादा किराया</option>
                <option value="rent-desc">Rent: High to Low · ज्यादा से कम किराया</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Side-by-Side Cost Comparison Table */}
      {showCompareTable && savedListings.length > 0 && (
        <div
          style={{
            marginTop: 20,
            background: '#ffffff',
            borderRadius: 18,
            border: '1.5px solid #94a3b8',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                Cost & Facility Comparison · किराया व सुविधा तुलना
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Compare monthly recurring bills vs. first month move-in costs with 100% Zero Brokerage.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCompareTable(false)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Property / कमरा</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Area / इलाका</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Rent / किराया</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Deposit / डिपॉजिट</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Brokerage / दलाली</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Food / भोजन</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Move-in Total / कुल</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((p, idx) => {
                  const moveIn = calculateMoveInCost(p);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 750, color: '#0f172a' }}>
                        <Link href={`/rooms/${p.id}`} style={{ color: '#176b58', textDecoration: 'underline' }}>
                          {p.name}
                        </Link>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                          {p.type} · {p.accommodation}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {p.area}, {p.city}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 750, color: '#0f172a' }}>
                        ₹{Number(p.rent || 0).toLocaleString('en-IN')}/mo
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        ₹{Number(p.deposit || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                          ₹0 Zero
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        {p.foodAvailable ? (p.foodIncluded ? 'Included (शामिल)' : `+₹${p.foodCost || 0}/mo`) : 'Self Cook (खुद बनाएं)'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#176b58' }}>
                        ₹{moveIn.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Link
                          href={`/rooms/${p.id}`}
                          className="btn small"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                        >
                          View · देखें
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Listings Grid or Loading Skeleton */}
      {loading ? (
        <div className="property-grid" style={{ marginTop: 24 }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <PropertyCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="property-grid" style={{ marginTop: 24 }}>
          {filteredListings.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              saved={true}
              onSave={() => toggleSave(p.id)}
            />
          ))}
        </div>
      ) : savedListings.length > 0 ? (
        // When category filter returns no matches
        <div
          className="empty"
          style={{
            marginTop: 24,
            padding: '40px 20px',
            background: '#ffffff',
            borderRadius: 16,
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', margin: '0 0 12px' }}>
            No saved listings in this category · इस श्रेणी में कोई सहेजा गया कमरा नहीं है
          </p>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className="btn small"
          >
            Show All Saved ({counts.all}) · सभी दिखाएं
          </button>
        </div>
      ) : (
        /* Empty State (When 0 saved items) */
        <div
          className="empty"
          style={{
            marginTop: 32,
            padding: '60px 24px',
            background: '#ffffff',
            borderRadius: 24,
            border: '1.5px dashed #cbd5e1',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fff1f2',
              color: '#e11d48',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 20px rgba(225, 29, 72, 0.15)',
            }}
          >
            <Heart size={30} fill="#f43f5e" color="#e11d48" />
          </div>

          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 26px)', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            No saved rooms yet · <span className="title-accent">अभी कोई कमरा नहीं सहेजा गया</span>
          </h2>

          <p className="muted" style={{ maxWidth: 520, margin: '0 auto 8px', fontSize: 14.5, lineHeight: 1.6 }}>
            Browse verified single rooms, PGs, and hostels in Samastipur. Tap the heart (❤️) icon on any listing to bookmark your favorites here.
          </p>
          <p style={{ maxWidth: 520, margin: '0 auto 24px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            समस्तीपुर में कमरे और पीजी देखें और अपनी पसंद की जगह को सहेजने के लिए दिल (❤️) आइकन दबाएं ताकि आप बाद में उनकी तुलना कर सकें।
          </p>

          <Link
            href="/search"
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 26px',
              fontSize: 15,
              borderRadius: 14,
              boxShadow: '0 4px 14px rgba(23, 107, 88, 0.25)',
            }}
          >
            <Search size={17} />
            <span>Explore Rooms in Samastipur · कमरे खोजें</span>
          </Link>

          {/* Quick Area Suggestions */}
          <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 12 }}>
              Popular areas to start searching · समस्तीपुर के प्रमुख इलाके:
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Link href="/search?query=Tajpur" className="pill" style={{ fontSize: 12 }}>
                📍 Tajpur Road · ताजपुर रोड
              </Link>
              <Link href="/search?query=Station" className="pill" style={{ fontSize: 12 }}>
                📍 Station Road · स्टेशन रोड
              </Link>
              <Link href="/search?query=Kashipur" className="pill" style={{ fontSize: 12 }}>
                📍 Kashipur · काशीपुर
              </Link>
              <Link href="/search?query=Mohanpur" className="pill" style={{ fontSize: 12 }}>
                📍 Mohanpur · मोहनपुर
              </Link>
              <Link href="/search?type=pg" className="pill" style={{ fontSize: 12 }}>
                🍲 PG with Food · खाना सहित पीजी
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div
          className="modal-backdrop"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="modal"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center' }}>
                  <Trash2 size={18} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Clear Shortlist? · सूची हटाएं?
                </h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to remove all {savedListings.length} saved rooms from your shortlist?
              <span style={{ display: 'block', color: '#64748b', fontSize: 12.5, marginTop: 4 }}>
                क्या आप वाकई सभी {savedListings.length} सहेजे गए कमरों को अपनी सूची से हटाना चाहते हैं?
              </span>
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn outline small"
                onClick={() => setShowClearConfirm(false)}
                style={{ padding: '10px 16px' }}
              >
                Cancel · रद्द करें
              </button>
              <button
                type="button"
                className="btn small"
                onClick={async () => {
                  await clearAllSaved();
                  setShowClearConfirm(false);
                  showToast('All saved rooms removed · सभी कमरे हटा दिए गए');
                }}
                style={{ background: '#dc2626', color: '#ffffff', padding: '10px 16px' }}
              >
                Yes, Clear All · हाँ, हटाएं
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

