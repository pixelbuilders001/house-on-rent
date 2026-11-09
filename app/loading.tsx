export default function Loading() {
  return (
    <div className="container section" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div className="skeleton-pulse" style={{ width: 140, height: 16, borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton-pulse" style={{ width: 260, height: 32, borderRadius: 8 }} />
        </div>
        <div className="skeleton-pulse" style={{ width: 120, height: 36, borderRadius: 10 }} />
      </div>

      <div className="property-grid">
        {[1, 2, 3, 4, 5, 6].map((x) => (
          <div className="property-card-modern" key={x} style={{ border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden' }}>
            <div className="skeleton-pulse" style={{ width: '100%', aspectRatio: '16 / 10' }} />
            <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-pulse" style={{ width: 90, height: 22, borderRadius: 6 }} />
                <div className="skeleton-pulse" style={{ width: 70, height: 18, borderRadius: 6 }} />
              </div>
              <div className="skeleton-pulse" style={{ width: '80%', height: 20, borderRadius: 6 }} />
              <div className="skeleton-pulse" style={{ width: '55%', height: 16, borderRadius: 6 }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <div className="skeleton-pulse" style={{ width: 75, height: 20, borderRadius: 6 }} />
                <div className="skeleton-pulse" style={{ width: 65, height: 20, borderRadius: 6 }} />
              </div>
              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-pulse" style={{ width: 100, height: 16, borderRadius: 6 }} />
                <div className="skeleton-pulse" style={{ width: 80, height: 28, borderRadius: 8 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
