'use client';

export function PropertyCardSkeleton() {
  return (
    <article className="property-card-modern property-card-skeleton" aria-hidden="true">
      {/* 1. Photo Shimmer Container */}
      <div className="card-photo-container">
        <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }} />
        {/* Floating badge skeleton placeholder */}
        <div className="card-floating-badges">
          <div className="skeleton-pulse" style={{ width: 105, height: 22, borderRadius: 999 }} />
        </div>
        {/* Heart icon skeleton placeholder */}
        <div
          className="skeleton-pulse"
          style={{
            position: 'absolute',
            top: 11,
            right: 11,
            width: 35,
            height: 35,
            borderRadius: '50%',
          }}
        />
      </div>

      {/* 2. Content Body Skeleton */}
      <div className="card-content-body">
        {/* Row 1: Rent Price + Accommodation Pill */}
        <div className="card-price-row">
          <div className="skeleton-pulse" style={{ width: 110, height: 26, borderRadius: 6 }} />
          <div className="skeleton-pulse" style={{ width: 85, height: 22, borderRadius: 999 }} />
        </div>

        {/* Row 2: Title & Rating */}
        <div className="card-title-row" style={{ marginTop: 2 }}>
          <div className="skeleton-pulse" style={{ width: '70%', height: 20, borderRadius: 6 }} />
          <div className="skeleton-pulse" style={{ width: 55, height: 20, borderRadius: 999 }} />
        </div>

        {/* Row 3: Location & Distance */}
        <div className="card-location-row" style={{ marginTop: 2 }}>
          <div className="skeleton-pulse" style={{ width: '50%', height: 16, borderRadius: 6 }} />
          <div className="skeleton-pulse" style={{ width: 70, height: 16, borderRadius: 6 }} />
        </div>

        {/* Row 4: Amenity Chips */}
        <div className="card-amenities-row" style={{ marginTop: 4 }}>
          <div className="skeleton-pulse" style={{ width: 85, height: 22, borderRadius: 999 }} />
          <div className="skeleton-pulse" style={{ width: 75, height: 22, borderRadius: 999 }} />
          <div className="skeleton-pulse" style={{ width: 68, height: 22, borderRadius: 999 }} />
        </div>

        {/* Row 5: Footer Strip (Move-in Cost + View CTA Button) */}
        <div className="card-footer-strip">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div className="skeleton-pulse" style={{ width: 95, height: 11, borderRadius: 4 }} />
            <div className="skeleton-pulse" style={{ width: 125, height: 16, borderRadius: 4 }} />
          </div>
          <div className="skeleton-pulse" style={{ width: 100, height: 35, borderRadius: 10 }} />
        </div>
      </div>
    </article>
  );
}
