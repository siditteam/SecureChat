export default function VouchedBadge({ vouchedBy, size = 'sm' }) {
  if (!vouchedBy) return null;
  const name = typeof vouchedBy === 'object' ? vouchedBy.username : vouchedBy;
  if (!name) return null;

  if (size === 'xs') {
    return (
      <span
        title={`Vouched by @${name}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
          color: '#92400e', background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 999, padding: '2px 7px',
        }}
      >
        ✦ vouched
      </span>
    );
  }

  return (
    <span
      title={`Vouched by @${name}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
        color: '#92400e', background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.22)',
        borderRadius: 999, padding: '3px 9px',
        cursor: 'default',
      }}
    >
      ✦ vouched by @{name}
    </span>
  );
}
