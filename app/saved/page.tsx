'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Heart, Search, Sparkles, CheckCircle2, LogIn, ArrowRight } from 'lucide-react';
import type { Property } from '@/lib/mock-data/types';
import { getProperties } from '@/lib/services/propertyService';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyCardSkeleton } from '@/components/PropertyCardSkeleton';
import { useAuth } from '@/context/AuthContext';

export default function SavedPage() {
  const { savedIds, toggleSave, user, openAuthModal } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

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

  const savedListings = useMemo(() => {
    return properties.filter((p) => savedIds.includes(p.id));
  }, [properties, savedIds]);

  return (
    <div className="container section" style={{ minHeight: '75vh', paddingBottom: 80 }}>
      {/* Eyebrow & Title */}
      <div className="eyebrow">आपकी पसंद की जगहें</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-1px' }}>
            Saved <span className="title-accent">Properties</span>
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            {savedListings.length} {savedListings.length === 1 ? 'room' : 'rooms'} saved · Compare move-in costs and contact owners directly.
          </p>
        </div>

        {user ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '6px 14px',
              borderRadius: 999,
              color: '#065f46',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={15} color="#059669" />
            <span>Synced to {user.email?.split('@')[0]}</span>
          </div>
        ) : null}
      </div>

      {/* Guest Sync Banner if user has saved items but is not logged in */}
      {!user && savedIds.length > 0 && (
        <div
          style={{
            marginTop: 20,
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #a7f3d0',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#10b981',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: '#065f46' }}>
                Save Permanently with Google
              </div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                These {savedIds.length} properties are saved on this browser. Sign in with Google to sync and access them on any phone or laptop.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openAuthModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
            }}
          >
            <LogIn size={14} />
            <span>Sign In to Sync</span>
          </button>
        </div>
      )}

      {/* Content: Listings or Skeleton or Empty State */}
      {loading ? (
        <div className="property-grid" style={{ marginTop: 24 }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <PropertyCardSkeleton key={idx} />
          ))}
        </div>
      ) : savedListings.length > 0 ? (
        <div className="property-grid" style={{ marginTop: 24 }}>
          {savedListings.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              saved={true}
              onSave={() => toggleSave(p.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className="empty"
          style={{
            marginTop: 32,
            padding: '56px 20px',
            background: '#ffffff',
            borderRadius: 20,
            border: '1.5px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#e11d48',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Heart size={26} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            You haven’t saved any <span className="title-accent">rooms</span> yet
          </h3>
          <p className="muted" style={{ maxWidth: 440, margin: '0 auto 20px', fontSize: 14 }}>
            Click the heart icon on any property card to bookmark rooms, compare their real monthly bills, and sync them across your devices.
          </p>
          <Link
            href="/search"
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px' }}
          >
            <Search size={16} />
            <span>Explore Rooms in Samastipur</span>
          </Link>
        </div>
      )}
    </div>
  );
}
