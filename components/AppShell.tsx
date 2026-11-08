'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, House, Search, Bell, UserRound, Building2, Menu, X } from 'lucide-react';

const OWNER_PORTAL_URL = 'https://hosue-on-rent-owner-tenant.vercel.app?role=owner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  const isHome = path === '/';

  const links = [
    ['Home', '/', House],
    ['Search', '/search', Search],
    ['Saved', '/saved', Heart],
    ['Alerts', '/alerts', Bell],
    ['Profile', '/profile', UserRound]
  ] as const;
  
  const active = (href: string) => href === '/' ? path === '/' : path.startsWith(href);

  const headerClass = isHome
    ? `header header-transparent ${isScrolled ? 'is-scrolled' : ''}`
    : 'header';

  return (
    <>
      <header className={headerClass}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', width: 'min(1200px, calc(100% - 40px))' }}>
          <Link href="/" className="brand">
            <span className="brand-mark">⌂</span>RoomSaathi
          </Link>

          <nav className="navlinks">
            <Link href="/search" className={active('/search') ? 'active-link' : ''}>Find a room</Link>
            <a 
              href={OWNER_PORTAL_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <Building2 size={14} />
              Host Portal
            </a>
            <Link href="/saved" className={active('/saved') ? 'active-link' : ''}>Saved</Link>
            <Link href="/alerts" className={active('/alerts') ? 'active-link' : ''}>Alerts</Link>
            <Link href="/profile" className={active('/profile') ? 'active-link' : ''}>Profile</Link>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="brand" style={{ fontSize: 18 }}>
                <span className="brand-mark">⌂</span>RoomSaathi
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-menu-links">
              <Link
                href="/"
                className={`mobile-menu-item ${path === '/' ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <House size={18} />
                <span>Home</span>
              </Link>
              <Link
                href="/search"
                className={`mobile-menu-item ${path.startsWith('/search') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Search size={18} />
                <span>Find a Room</span>
              </Link>
              <a
                href={OWNER_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-menu-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Building2 size={18} />
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  Host Portal
                  <span style={{ fontSize: 10, background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>Host</span>
                </span>
              </a>
              <Link
                href="/saved"
                className={`mobile-menu-item ${path.startsWith('/saved') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Heart size={18} />
                <span>Saved Rooms</span>
              </Link>
              <Link
                href="/alerts"
                className={`mobile-menu-item ${path.startsWith('/alerts') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Bell size={18} />
                <span>Rental Alerts</span>
              </Link>
              <Link
                href="/profile"
                className={`mobile-menu-item ${path.startsWith('/profile') ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <UserRound size={18} />
                <span>My Profile</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <main>{children}</main>

      <footer className="footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: 15, flexWrap: 'wrap' }}>
          <span><b>RoomSaathi</b> · Verified student & bachelor rooms in Samastipur.</span>
          <span>Samastipur, Bihar · Live Listings</span>
          <span>
            <a href={OWNER_PORTAL_URL} target="_blank" rel="noopener noreferrer">Host Portal & Rent Manager</a>
          </span>
        </div>
      </footer>

      <nav className="mobile-nav">
        {links.map(([label, href, Icon]) => (
          <Link key={href} href={href} className={active(href) ? 'active-link' : ''}>
            <Icon size={19} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
