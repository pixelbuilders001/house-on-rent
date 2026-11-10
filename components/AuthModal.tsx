'use client';

import React, { useEffect, useState } from 'react';
import { X, Sparkles, ShieldCheck, Heart, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signInWithGoogle, user } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAuthModal();
    }
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen || user) return null;

  const handleGoogleClick = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in error:', err);
      setSigningIn(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
      onClick={closeAuthModal}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '28px 24px',
          width: 'min(440px, 100%)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          animation: 'hero-arrive 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#f1f5f9',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            color: '#64748b',
            cursor: 'pointer',
          }}
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 26,
              fontWeight: 800,
              margin: '0 auto 12px',
              boxShadow: '0 8px 18px rgba(16, 185, 129, 0.3)',
            }}
          >
            ⌂
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#ecfdf5',
              color: '#065f46',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              marginBottom: 8,
            }}
          >
            <Sparkles size={12} color="#10b981" />
            <span>RoomSaathi Account</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>
            Sign in to RoomSaathi
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.45 }}>
            Access your saved rooms, send visit requests, and connect directly with verified owners.
          </p>
        </div>

        {/* Value Highlights */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '12px 14px',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#ecfdf5',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Heart size={14} color="#059669" />
            </div>
            <div style={{ fontSize: 12.5, color: '#334155' }}>
              <strong>Shortlisted Rooms</strong> — Keep your favorite rooms saved whenever you return.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#eff6ff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={14} color="#2563eb" />
            </div>
            <div style={{ fontSize: 12.5, color: '#334155' }}>
              <strong>Zero Brokerage</strong> — Direct connection to verified local property owners.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#f0fdf4',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={14} color="#16a34a" />
            </div>
            <div style={{ fontSize: 12.5, color: '#334155' }}>
              <strong>100% Free & Verified</strong> — Fast, secure 1-tap resident login.
            </div>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={signingIn}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '12px 18px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
            cursor: signingIn ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)',
            transition: 'all 0.15s ease',
            opacity: signingIn ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!signingIn) e.currentTarget.style.backgroundColor = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            if (!signingIn) e.currentTarget.style.backgroundColor = '#ffffff';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
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
          <span>{signingIn ? 'Connecting with Google...' : 'Continue with Google'}</span>
        </button>

        <p
          style={{
            fontSize: 11,
            color: '#94a3b8',
            textAlign: 'center',
            marginTop: 14,
            marginBottom: 0,
          }}
        >
          By signing in, you agree to RoomSaathi's Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
