'use client';

import { Building2, Plus, ShieldCheck, Users, IndianRupee, ArrowRight, CheckCircle2 } from 'lucide-react';

const OWNER_PORTAL_URL = 'https://hosue-on-rent-owner-tenant.vercel.app?role=owner';

export default function OwnerGateway() {
  return (
    <div className="container section" style={{ maxWidth: 840 }}>
      <div className="section-head">
        <div>
          <div className="eyebrow">RoomSaathi Host Portal</div>
          <h2 style={{ marginTop: 8 }}>
            Host & Landlord <em className="title-accent">Dashboard</em>
          </h2>
          <p className="muted">
            Manage your PGs, hostels, rooms, tenant onboarding, and automated rent collection in one place.
          </p>
        </div>
        <a 
          className="btn" 
          href={OWNER_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Building2 size={16} /> Open Host Portal <ArrowRight size={14} />
        </a>
      </div>

      <div className="panel" style={{ padding: '32px 28px', marginTop: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Manage Your Listings with Google Sign-In</h3>
        <p className="muted" style={{ lineHeight: 1.6, marginBottom: 24 }}>
          To ensure verified listings and secure rent tracking, property management is hosted on the dedicated RoomSaathi Host & Resident Portal. Sign in with your Google account to list new properties, configure room types, track inquiries, and generate instant rent receipts.
        </p>

        <div className="stats" style={{ marginBottom: 28 }}>
          <div className="stat">
            <span className="muted"><Building2 size={16} /> Properties</span>
            <strong>Cloud Synced</strong>
            <span className="muted">Supabase live database</span>
          </div>
          <div className="stat">
            <span className="muted"><Users size={16} /> Tenants</span>
            <strong>Room & Bed</strong>
            <span className="muted">Real-time occupancy</span>
          </div>
          <div className="stat">
            <span className="muted"><IndianRupee size={16} /> Rent Khata</span>
            <strong>Automated</strong>
            <span className="muted">Electricity & rent billing</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#176b58' }} />
            <span>Strict Google Authentication ensures only verified owners manage property data.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#176b58' }} />
            <span>Instant inquiry sync: inquiries submitted by students appear in your live Host inbox.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#176b58' }} />
            <span>Share digital rent receipts directly to tenants on WhatsApp.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a
            className="btn"
            href={OWNER_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '12px 24px', fontSize: 15 }}
          >
            Launch Host Portal & Sign In <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
