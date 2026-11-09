'use client';

import { useEffect, useState, useTransition, createContext, useContext, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface RouteLoaderContextType {
  startLoading: (customMessage?: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
}

const RouteLoaderContext = createContext<RouteLoaderContextType>({
  startLoading: () => {},
  stopLoading: () => {},
  isLoading: false,
});

export function useRouteLoader() {
  return useContext(RouteLoaderContext);
}

function RouteLoaderInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Finding your home in Samastipur...');
  const [progress, setProgress] = useState(0);

  // Derive context message from destination URL
  const getContextMessage = (path: string) => {
    if (path.includes('/rooms/')) {
      return 'Loading verified room details & transparent pricing...';
    }
    if (path.includes('/search')) {
      return 'Searching verified rooms in Samastipur...';
    }
    if (path.includes('/saved')) {
      return 'Loading your saved rooms & favorites...';
    }
    if (path.includes('/alerts')) {
      return 'Checking rental price alerts...';
    }
    if (path.includes('/profile')) {
      return 'Loading your tenant profile...';
    }
    return 'Finding your home in Samastipur...';
  };

  const startLoading = (customMessage?: string, destinationPath?: string) => {
    const msg = customMessage || (destinationPath ? getContextMessage(destinationPath) : 'Loading...');
    setLoadingMessage(msg);
    setIsLoading(true);
    setProgress(15);
  };

  const stopLoading = () => {
    setProgress(100);
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 180);
    return () => clearTimeout(timeout);
  };

  // When pathname or searchParams change, the new page has arrived! Stop the loader.
  useEffect(() => {
    stopLoading();
  }, [pathname, searchParams]);

  // Smooth progress bar simulation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev;
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 120);

    // Failsafe auto-dismiss after 6.5s so user is never permanently locked
    const failsafe = setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 6500);

    return () => {
      clearInterval(interval);
      clearTimeout(failsafe);
    };
  }, [isLoading]);

  // Intercept all internal anchor clicks globally
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Ignore non-navigation links
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      // Ignore modified clicks (Ctrl, Cmd, Shift, Alt)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.origin);
        const currentUrl = new URL(window.location.href);

        // Check if destination is internal and different from current page
        if (
          targetUrl.origin === currentUrl.origin &&
          (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search)
        ) {
          startLoading(undefined, targetUrl.pathname);
        }
      } catch {
        // Invalid URL, continue normal navigation
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  return (
    <RouteLoaderContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {/* 1. Sleek Top Route Progress Bar */}
      {isLoading && (
        <div
          className="route-top-progress-bar"
          style={{
            transform: `scaleX(${progress / 100})`,
          }}
        />
      )}

      {/* 2. Fullscreen Modern Glass Loader Overlay */}
      {isLoading && (
        <div className="route-full-loader-overlay" role="status" aria-live="polite">
          <div className="route-loader-card">
            {/* Animated Brand Mark with Pulse Aura */}
            <div className="route-loader-icon-wrap">
              <div className="route-loader-aura" />
              <div className="route-loader-brand-icon">
                <span className="brand-house">⌂</span>
              </div>
              <div className="route-loader-spinner-ring" />
            </div>

            {/* Brand Title */}
            <div className="route-loader-title">
              Room<span className="title-accent-green">Saathi</span>
            </div>

            {/* Dynamic Context Message */}
            <p className="route-loader-message">{loadingMessage}</p>

            {/* Progress Track */}
            <div className="route-loader-progress-track">
              <div
                className="route-loader-progress-fill"
                style={{ width: `${Math.min(progress, 95)}%` }}
              />
            </div>

            {/* Trust Micro-Chips */}
            <div className="route-loader-badges">
              <span className="route-badge">
                <ShieldCheck size={12} color="#10b981" />
                <span>Verified Landlords</span>
              </span>
              <span className="route-badge">
                <Zap size={11} color="#f59e0b" fill="#f59e0b" />
                <span>Zero Brokerage</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {children}
    </RouteLoaderContext.Provider>
  );
}

export function RouteLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <RouteLoaderInner>{children}</RouteLoaderInner>
    </Suspense>
  );
}
