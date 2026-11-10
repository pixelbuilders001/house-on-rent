'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserRound,
  ShieldCheck,
  LogOut,
  Calculator,
  Users,
  Heart,
  Bell,
  Sparkles,
  ExternalLink,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const OWNER_PORTAL_URL = 'https://hosue-on-rent-owner-tenant.vercel.app?role=owner';

export default function Profile() {
  const { user, profile, savedIds, signOut, openAuthModal, signInWithGoogle, isLoading } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'RoomSaathi User';
  const email = user?.email || profile?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userInitial = displayName.charAt(0).toUpperCase() || 'U';

  return (
    <div className="container section" style={{ maxWidth: 780, minHeight: '75vh', paddingBottom: 80 }}>
      {/* Header Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div className="eyebrow" style={{ margin: 0 }}>
          आपका RoomSaathi
        </div>
      </div>

      <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-1px' }}>
        Your <span className="title-accent">Profile</span>
      </h1>
      <p className="muted" style={{ margin: '0 0 24px', fontSize: 14 }}>
        {user
          ? 'Manage your account session, synced saved properties, and tenant preferences.'
          : 'Sign in with Google to sync saved properties across devices and connect with verified hosts.'}
      </p>

      {/* Profile Card / Sign In Card */}
      {user ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: '24px 22px',
            boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
            marginBottom: 24,
          }}
        >
          {/* User Info Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #10b981',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  {userInitial}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                    {displayName}
                  </h2>
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ShieldCheck size={12} color="#059669" />
                    <span>Verified Member · सत्यापित सदस्य</span>
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                  {email}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => signOut()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 10,
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <LogOut size={14} />
              <span>Sign Out · बाहर निकलें</span>
            </button>
          </div>

          {/* Sync Status Banner */}
          <div
            style={{
              marginTop: 18,
              padding: '12px 14px',
              background: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Heart size={16} color="#e11d48" />
              <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                {savedIds.length} {savedIds.length === 1 ? 'room' : 'rooms'} saved in your wishlist · {savedIds.length} कमरे आपकी पसंद में
              </span>
            </div>
            <Link
              href="/saved"
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: '#059669',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>View Saved Rooms · पसंदीदा देखें</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: '28px 24px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 24,
              fontWeight: 800,
              margin: '0 auto 12px',
              boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)',
            }}
          >
            ⌂
          </div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            Sign In with Google
          </h3>
          <p style={{ fontSize: 13.5, color: '#64748b', maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.5 }}>
            {savedIds.length > 0
              ? `You currently have ${savedIds.length} property bookmarked on this device. Sign in with Google to permanently save and merge them into your profile.`
              : 'Save rooms, track rent calculations, and access direct owner chat across all your devices.'}
          </p>

          <button
            type="button"
            onClick={openAuthModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 24px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      )}

      {/* Useful Shortcuts Grid */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Quick Shortcuts
        </h3>
        <div className="sidebar-links">
          <Link href="/saved">
            <Heart size={15} color="#e11d48" />
            <span>Saved properties ({savedIds.length})</span>
          </Link>
          <Link href="/calculator">
            <Calculator size={15} color="#059669" />
            <span>Rent & Monthly Cost Calculator</span>
          </Link>
          <Link href="/alerts">
            <Bell size={15} color="#d97706" />
            <span>Vacancy & Price Drop Alerts</span>
          </Link>
          <Link href="/roommates">
            <Users size={15} color="#7c3aed" />
            <span>Find a Roommate</span>
          </Link>
          <a href={OWNER_PORTAL_URL} target="_blank" rel="noopener noreferrer">
            <Building2 size={15} color="#0284c7" />
            <span>Property Owner / Host Portal</span>
            <ExternalLink size={12} style={{ marginLeft: 4 }} />
          </a>
        </div>
      </div>
    </div>
  );
}
