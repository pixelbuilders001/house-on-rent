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
  MapPin,
  ChevronRight,
  MessageCircle,
  PhoneCall,
  CheckCircle2,
  LogIn,
  Home,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const OWNER_PORTAL_URL = 'https://hosue-on-rent-owner-tenant.vercel.app?role=owner';

export default function Profile() {
  const { user, profile, savedIds, signOut, openAuthModal } = useAuth();

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    'RoomSaathi Resident';
  const email = user?.email || profile?.email || '';
  const avatarUrl =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;
  const userInitial = displayName.charAt(0).toUpperCase() || 'R';

  return (
    <div className="container section" style={{ maxWidth: 840, minHeight: '75vh', paddingBottom: 80 }}>
      {/* Header Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div className="eyebrow" style={{ margin: 0 }}>
          मेरा अकाउंट · MY ACCOUNT
        </div>
      </div>

      <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-1.2px' }}>
        Profile & Services <span className="title-accent">· प्रोफ़ाइल और सेवाएँ</span>
      </h1>
      <p className="muted" style={{ margin: '0 0 24px', fontSize: 14.5, lineHeight: 1.5 }}>
        Manage your shortlisted rooms, cost calculations, and tenant assistance in Samastipur.
        <span style={{ display: 'block', color: '#64748b', fontSize: 13, marginTop: 2 }}>
          अपनी पसंदीदा जगहें, खर्च कैलकुलेशन और रूममेट खोज को एक ही जगह से मैनेज करें।
        </span>
      </p>

      {/* Main Account Card */}
      {user ? (
        <div
          style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: 22,
            border: '1px solid #e2e8f0',
            padding: '26px 24px',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)',
            marginBottom: 28,
          }}
        >
          {/* Top Row: Avatar + Info + Sign Out */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #10b981',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 26,
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  }}
                >
                  {userInitial}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0f172a' }}>
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
                    <span>Verified Member · सदस्य</span>
                  </span>
                </div>

                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  {email}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#0f766e', marginTop: 4, fontWeight: 600 }}>
                  <MapPin size={13} />
                  <span>Samastipur, Bihar · समस्तीपुर</span>
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
                padding: '9px 16px',
                borderRadius: 12,
                background: '#fff1f2',
                color: '#dc2626',
                border: '1px solid #fecdd3',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={15} />
              <span>Log Out · बाहर निकलें</span>
            </button>
          </div>

          {/* Quick Highlight Stats Row */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Link
              href="/saved"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#fff1f2',
                  color: '#e11d48',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Heart size={18} fill="#f43f5e" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Wishlist · पसंदीदा
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  {savedIds.length} {savedIds.length === 1 ? 'Room' : 'Rooms'}
                </div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </Link>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#f0fdf4',
                  color: '#16a34a',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Brokerage · दलाली
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>
                  ₹0 Zero Always
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#eff6ff',
                  color: '#2563eb',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                  Verification · सुरक्षा
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                  100% Direct Owners
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Logged Out Welcome Card */
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            borderRadius: 22,
            border: '1.5px solid #a7f3d0',
            padding: '32px 24px',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.08)',
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: '#10b981',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 26,
              fontWeight: 800,
              margin: '0 auto 14px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.28)',
            }}
          >
            ⌂
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#065f46', margin: '0 0 6px' }}>
            Welcome to RoomSaathi <span style={{ fontWeight: 700 }}>· रूमसाथी में आपका स्वागत है</span>
          </h2>

          <p style={{ fontSize: 14, color: '#047857', maxWidth: 480, margin: '0 auto 18px', lineHeight: 1.5 }}>
            Sign in to access your shortlisted rooms, contact verified homeowners, and connect with fellow residents in Samastipur.
            <span style={{ display: 'block', color: '#065f46', fontSize: 12.5, marginTop: 4 }}>
              कमरे और पीजी सुरक्षित रखने, सीधे मकान मालिकों से संपर्क करने और रूममेट खोजने के लिए साइन इन करें।
            </span>
          </p>

          <button
            type="button"
            onClick={openAuthModal}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              fontSize: 14.5,
              borderRadius: 14,
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
            }}
          >
            <LogIn size={16} />
            <span>Sign In / Continue · साइन इन करें</span>
          </button>

          {/* Quick Perks Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#065f46', background: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: 999 }}>
              ✓ 100% Zero Brokerage · ₹0 दलाली
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#065f46', background: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: 999 }}>
              ✓ Verified Rooms & PGs · सत्यापित जगहें
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#065f46', background: 'rgba(255,255,255,0.7)', padding: '4px 12px', borderRadius: 999 }}>
              ✓ Direct Owner Contact · सीधी बात
            </span>
          </div>
        </div>
      )}

      {/* Services & Quick Links Hub */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
          Tenant Services & Tools · सेवाएँ और टूल्स
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {/* 1. Saved Rooms */}
          <Link
            href="/saved"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              padding: '18px 20px',
              background: '#ffffff',
              borderRadius: 18,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.18s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#fff1f2',
                  color: '#e11d48',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Heart size={22} fill="#f43f5e" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a' }}>
                  Saved Rooms · पसंदीदा कमरे
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {savedIds.length} {savedIds.length === 1 ? 'room' : 'rooms'} shortlisted for comparison
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </Link>

          {/* 2. Rent Calculator */}
          <Link
            href="/calculator"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              padding: '18px 20px',
              background: '#ffffff',
              borderRadius: 18,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.18s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Calculator size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a' }}>
                  Rent Calculator · खर्च कैलकुलेटर
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Calculate electricity, food & move-in costs
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </Link>

          {/* 3. Roommates */}
          <Link
            href="/roommates"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              padding: '18px 20px',
              background: '#ffffff',
              borderRadius: 18,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.18s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#f5f3ff',
                  color: '#7c3aed',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a' }}>
                  Find Roommates · रूममेट खोजें
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Connect with students & working professionals
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </Link>

          {/* 4. Vacancy Alerts */}
          <Link
            href="/alerts"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              padding: '18px 20px',
              background: '#ffffff',
              borderRadius: 18,
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.18s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#fffbeb',
                  color: '#d97706',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Bell size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a' }}>
                  Room Alerts · कमरों के अलर्ट
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Get notified when price drops or rooms open
                </div>
              </div>
            </div>
            <ChevronRight size={18} color="#94a3b8" />
          </Link>

          {/* 5. Host & Landlord Portal */}
          <a
            href={OWNER_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              padding: '18px 20px',
              background: '#f0f9ff',
              borderRadius: 18,
              border: '1.5px solid #bae6fd',
              boxShadow: '0 2px 10px rgba(14, 165, 233, 0.06)',
              transition: 'all 0.18s ease',
              gridColumn: '1 / -1',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: '#0284c7',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Property Owner & Host Portal · मकान मालिक पोर्टल</span>
                  <span style={{ fontSize: 11, background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    List Room
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: '#0284c7', marginTop: 2 }}>
                  Are you a landlord or PG host? List rooms, verify tenants & manage rent khata.
                </div>
              </div>
            </div>
            <ExternalLink size={18} color="#0284c7" />
          </a>
        </div>
      </div>

      {/* Samastipur Resident Helpdesk Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          padding: '22px 24px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: '#e0f2fe',
              color: '#0369a1',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <PhoneCall size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
              Need Help Finding a Room? · कमरा खोजने में मदद चाहिए?
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
              Our local Samastipur team is ready to assist you (10 AM - 8 PM). Zero brokerage fees.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="https://wa.me/917461824651?text=Hi%20RoomSaathi,%20I%20need%20help%20finding%20a%20room%20in%20Samastipur"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 12,
              background: '#25D366',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
            }}
          >
            <MessageCircle size={15} />
            <span>WhatsApp · सहायता</span>
          </a>

          <a
            href="tel:7461824651"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 12,
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <PhoneCall size={15} />
            <span>Call Helpdesk</span>
          </a>
        </div>
      </div>
    </div>
  );
}

