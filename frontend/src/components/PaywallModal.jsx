export default function PaywallModal({ feature = 'this feature', onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '32px 28px', maxWidth: 360, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.3)', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(254,238,5,0.12)', border: '1.5px solid rgba(254,238,5,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
          ✦
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Unddr Paid
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 22px', lineHeight: 1.55 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{feature}</strong> is a paid feature.
          Paid accounts unlock Teams, vanity handles, and priority support — coming soon.
        </p>

        <div style={{ background: 'var(--bg-muted)', borderRadius: 12, padding: '14px 16px', marginBottom: 22, textAlign: 'left' }}>
          {['Teams & group spaces', 'Vanity @handle', 'Priority support', 'Early feature access'].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
              {item}
            </div>
          ))}
        </div>

        <button
          style={{ width: '100%', background: 'var(--accent)', color: '#fff', fontWeight: 700, borderRadius: 12, padding: '12px 0', border: 'none', fontSize: 15, cursor: 'not-allowed', opacity: 0.6, marginBottom: 10 }}
          disabled
        >
          Join waitlist — coming soon
        </button>
        <button
          onClick={onClose}
          style={{ width: '100%', background: 'transparent', color: 'var(--text-secondary)', border: 'none', fontSize: 13, cursor: 'pointer', padding: '8px 0' }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
