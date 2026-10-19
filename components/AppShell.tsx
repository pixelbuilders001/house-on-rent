'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, House, Search, Bell, UserRound, Building2 } from 'lucide-react';

const OWNER_PORTAL_URL = 'https://hosue-on-rent-owner-tenant.vercel.app?role=owner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const links = [
    ['Home', '/', House],
    ['Search', '/search', Search],
    ['Saved', '/saved', Heart],
    ['Alerts', '/alerts', Bell],
    ['Profile', '/profile', UserRound]
  ] as const;
  
  const active = (href: string) => href === '/' ? path === '/' : path.startsWith(href);

  return (
    <>
      <header className="header">
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
        </div>
      </header>

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
