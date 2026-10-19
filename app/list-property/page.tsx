'use client';

import Link from 'next/link';
import { ArrowLeft, Building2, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

const OWNER_PORTAL_URL = 'https://hosue-on-rent-owner-tenant.vercel.app?role=owner';

export default function ListProperty() {
  return (
    <div className="container section" style={{ maxWidth: 760 }}>
      <Link href="/" className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <ArrowLeft size={14} /> Back to room search
      </Link>

      <div className="eyebrow" style={{ marginTop: 20 }}>Host Listing Gateway</div>
      <h2 style={{ marginTop: 8 }}>
        List your <em className="title-accent">property</em>
      </h2>
      <p className="muted">
        Connect your PG, hostel, or rented flat to thousands of verified students and bachelors in Samastipur.
      </p>

      <div className="panel" style={{ padding: '36px 30px', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div className="dest-icon" style={{ background: '#eaf4ee', color: '#176b58' }}>
            <Building2 size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Add Property on RoomSaathi Host Portal</h3>
            <span className="muted" style={{ fontSize: 13 }}>Authenticated Cloud Sync with Google OAuth</span>
          </div>
        </div>

        <p className="muted" style={{ lineHeight: 1.6, marginBottom: 24 }}>
          To ensure verified properties and keep tenant data safe, all property listings and room configurations are managed on the dedicated RoomSaathi Host Portal with Google OAuth authentication.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#176b58' }} />
            <span><b>Automated Room & Bed Allocation</b>: Define 1, 2, or 3 sharing rooms with instant bed vacancy tracking.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#176b58' }} />
            <span><b>Transparent Pricing</b>: Configure base rent, electricity meter rate, Wi-Fi, and food costs.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} style={{ color: '#176b58' }} />
            <span><b>Verified Host Badge</b>: Get your listing verified for higher student trust and booking priority.</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            className="btn"
            href={OWNER_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '12px 26px', fontSize: 15 }}
          >
            Open Host Portal to List Property <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
