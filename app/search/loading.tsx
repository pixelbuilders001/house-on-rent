export default function SearchLoading() {
  return (
    <div className="container section" style={{ padding: '30px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="skeleton-pulse" style={{ width: 220, height: 28, borderRadius: 8 }} />
        <div className="skeleton-pulse" style={{ width: 140, height: 38, borderRadius: 10 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 3fr', gap: 24 }}>
        {/* Filter Sidebar Skeleton */}
        <div className="desktop-only" style={{ background: '#f8fafc', padding: 20, borderRadius: 18, border: '1px solid #e2e8f0', height: 480 }}>
          <div className="skeleton-pulse" style={{ width: 120, height: 20, borderRadius: 6, marginBottom: 20 }} />
          <div className="skeleton-pulse" style={{ width: '100%', height: 42, borderRadius: 10, marginBottom: 16 }} />
          <div className="skeleton-pulse" style={{ width: '100%', height: 42, borderRadius: 10, marginBottom: 16 }} />
          <div className="skeleton-pulse" style={{ width: '100%', height: 42, borderRadius: 10 }} />
        </div>

        {/* Results Grid Skeleton */}
        <div className="property-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          {[1, 2, 3, 4].map((x) => (
            <div className="property-card-modern" key={x} style={{ border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden' }}>
              <div className="skeleton-pulse" style={{ width: '100%', aspectRatio: '16 / 10' }} />
              <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton-pulse" style={{ width: '75%', height: 20, borderRadius: 6 }} />
                <div className="skeleton-pulse" style={{ width: '50%', height: 16, borderRadius: 6 }} />
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton-pulse" style={{ width: 90, height: 18, borderRadius: 6 }} />
                  <div className="skeleton-pulse" style={{ width: 70, height: 26, borderRadius: 8 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
