export default function RoomDetailLoading() {
  return (
    <div className="detail-v2-container">
      {/* Breadcrumb Skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <div className="skeleton-pulse" style={{ width: 120, height: 16, borderRadius: 6 }} />
        <span style={{ color: '#cbd5e1' }}>/</span>
        <div className="skeleton-pulse" style={{ width: 160, height: 16, borderRadius: 6 }} />
      </div>

      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div className="skeleton-pulse" style={{ width: '65%', height: 32, borderRadius: 8, marginBottom: 10 }} />
          <div className="skeleton-pulse" style={{ width: '40%', height: 18, borderRadius: 6 }} />
        </div>
        <div className="skeleton-pulse" style={{ width: 140, height: 44, borderRadius: 12 }} />
      </div>

      {/* Gallery Grid Skeleton */}
      <div className="detail-skeleton-gallery">
        <div className="skeleton-pulse main-photo-skeleton" />
        <div className="side-photos-skeleton">
          <div className="skeleton-pulse side-photo" />
          <div className="skeleton-pulse side-photo" />
        </div>
      </div>

      {/* Body Skeleton */}
      <div className="detail-skeleton-grid">
        <div>
          <div className="skeleton-pulse" style={{ height: 110, borderRadius: 16, marginBottom: 18 }} />
          <div className="skeleton-pulse" style={{ height: 160, borderRadius: 16, marginBottom: 18 }} />
          <div className="skeleton-pulse" style={{ height: 120, borderRadius: 16 }} />
        </div>
        <div>
          <div className="skeleton-pulse" style={{ height: 320, borderRadius: 20 }} />
        </div>
      </div>
    </div>
  );
}
