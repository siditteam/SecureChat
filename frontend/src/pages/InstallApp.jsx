import { Link } from 'react-router-dom';

const F = "'Space Grotesk', sans-serif";
const ACCENT = 'var(--accent)';
const T = { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', muted: 'rgba(71,85,105,0.65)' };
const BG = { deep: 'var(--bg-deep)', surface: 'var(--bg-surface)', muted: 'var(--bg-muted)' };
const BORDER = { soft: 'var(--card-border)' };

function Step({ n, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(10,163,163,0.08)', border: '1px solid rgba(10,163,163,0.2)', color: ACCENT, fontFamily: F, fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        {n}
      </span>
      <div>
        <p style={{ fontFamily: F, fontWeight: 600, fontSize: 14, color: T.primary, marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

function HighlightPill({ label }) {
  return (
    <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', background: ACCENT, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: '0.07em', zIndex: 10 }}>
      {label}
    </div>
  );
}

function SafariMockup() {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 20, padding: 14, border: '1px solid rgba(15,23,36,0.07)' }}>
      {/* Address bar */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, boxShadow: '0 1px 3px rgba(15,23,36,0.06)' }}>
        <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, color: '#94a3b8', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span style={{ flex: 1, fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>unddrground.com</span>
      </div>

      {/* Page content preview */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '16px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: F, fontWeight: 800, fontSize: 18, color: ACCENT, letterSpacing: '-0.02em' }}>UNDDR</span>
      </div>

      {/* Safari bottom toolbar */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(15,23,36,0.06)' }}>
        {/* Back */}
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#94a3b8' }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg>
        {/* Forward */}
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#cbd5e1' }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg>

        {/* HIGHLIGHTED: Share button */}
        <div style={{ position: 'relative' }}>
          <HighlightPill label="TAP HERE â€” STEP 1" />
          <div style={{ background: 'rgba(10,163,163,0.12)', border: '2.5px solid #0AA3A3', borderRadius: 9, padding: '6px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: ACCENT }} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13M8 7l4-4 4 4"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>
            </svg>
          </div>
        </div>

        {/* Tabs */}
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#94a3b8' }} fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        {/* More */}
        <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#94a3b8' }} fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
      </div>

      {/* Share sheet */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '8px 4px', marginTop: 8, border: '1px solid rgba(15,23,36,0.08)', boxShadow: '0 4px 12px rgba(15,23,36,0.08)' }}>
        <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', padding: '4px 0 8px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>Share</div>
        {['AirDrop', 'Copy Link', 'Safari Reader'].map(item => (
          <div key={item} style={{ padding: '5px 12px', fontSize: 11, color: '#94a3b8' }}>{item}</div>
        ))}
        {/* HIGHLIGHTED item */}
        <div style={{ padding: '7px 12px', fontSize: 12, fontWeight: 700, color: ACCENT, background: 'rgba(10,163,163,0.07)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(10,163,163,0.18)', margin: '3px 6px' }}>
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Add to Home Screen â† STEP 2
        </div>
        {['Mail', 'Messages'].map(item => (
          <div key={item} style={{ padding: '5px 12px', fontSize: 11, color: '#94a3b8' }}>{item}</div>
        ))}
      </div>
    </div>
  );
}

function ChromeMockup() {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 20, padding: 14, border: '1px solid rgba(15,23,36,0.07)' }}>
      {/* Chrome address bar */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, boxShadow: '0 1px 3px rgba(15,23,36,0.06)' }}>
        <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, color: '#94a3b8', flexShrink: 0 }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span style={{ flex: 1, fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>unddrground.com</span>
        <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, color: '#94a3b8' }} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
        {/* HIGHLIGHTED: 3-dot */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <HighlightPill label="TAP HERE â€” STEP 1" />
          <div style={{ background: 'rgba(10,163,163,0.12)', border: '2.5px solid #0AA3A3', borderRadius: 7, padding: '5px 5px', display: 'flex', gap: 3, alignItems: 'center' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT }} />)}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '16px', height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: F, fontWeight: 800, fontSize: 18, color: ACCENT, letterSpacing: '-0.02em' }}>UNDDR</span>
      </div>

      {/* Dropdown menu */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '6px 4px', boxShadow: '0 4px 12px rgba(15,23,36,0.10)', border: '1px solid rgba(15,23,36,0.07)' }}>
        {['New tab', 'New incognito tab', 'Bookmarks', 'History', 'Downloads'].map(item => (
          <div key={item} style={{ padding: '6px 14px', fontSize: 11, color: '#94a3b8' }}>{item}</div>
        ))}
        {/* HIGHLIGHTED: Add to Home Screen */}
        <div style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: ACCENT, background: 'rgba(10,163,163,0.07)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(10,163,163,0.18)', margin: '3px 5px' }}>
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Add to Home Screen â† STEP 2
        </div>
        {['Settings', 'Help & feedback'].map(item => (
          <div key={item} style={{ padding: '6px 14px', fontSize: 11, color: '#94a3b8' }}>{item}</div>
        ))}
      </div>
    </div>
  );
}

export default function InstallApp() {
  return (
    <div style={{ minHeight: '100vh', background: BG.deep, fontFamily: F }}>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(247,251,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${BORDER.soft}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src="/assets/logo-unddr-teal-icon.svg" alt="Unddr" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 18, color: ACCENT, letterSpacing: '-0.02em' }}>UNDDR</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: T.secondary, padding: '10px 16px', borderRadius: 99, textDecoration: 'none', border: `1px solid ${BORDER.soft}` }}>
              Open in browser
            </Link>
            <Link to="/login" style={{ fontFamily: F, fontWeight: 700, fontSize: 13, background: ACCENT, color: '#fff', padding: '10px 20px', borderRadius: 99, textDecoration: 'none' }}>
              Open UNDDR â†’
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '96px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 16 }}>Install UNDDR</p>
          <h1 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 6vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: T.primary, marginBottom: 16 }}>
            Add it to your home screen.<br />
            <span style={{ color: ACCENT }}>Takes 30 seconds.</span>
          </h1>
          <p style={{ fontSize: 17, color: T.secondary, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
            No App Store. No Play Store. UNDDR is a PWA â€” open it in your browser and follow the steps for your phone.
          </p>
          <Link to="/login" style={{ fontFamily: F, fontWeight: 600, fontSize: 14, color: T.secondary, textDecoration: 'none', borderBottom: `1px solid ${BORDER.soft}` }}>
            Skip this â€” just open in browser â†’
          </Link>
        </div>

        {/* Platform cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

          {/* iPhone */}
          <div style={{ background: BG.surface, border: `1px solid ${BORDER.soft}`, borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ padding: '28px 28px 0', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, color: T.secondary }} fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 18, color: T.primary }}>iPhone Â· Safari</h2>
              </div>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Must use <strong style={{ color: T.secondary }}>Safari</strong> â€” the share button doesn't appear in Chrome on iOS.
              </p>
            </div>

            <div style={{ padding: '0 20px', marginBottom: 24 }}>
              <SafariMockup />
            </div>

            <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Step n="1" title='Tap the Share button (â†‘)' desc="The box-with-arrow icon at the bottom of Safari â€” highlighted in teal in the mockup above." />
              <Step n="2" title='Tap "Add to Home Screen"' desc="Scroll down the share sheet that pops up from the bottom. Tap it." />
              <Step n="3" title="Tap Add in the top-right" desc="A name and icon preview appears. Tap Add. The UNDDR icon appears on your home screen." />
            </div>
          </div>

          {/* Android */}
          <div style={{ background: BG.surface, border: `1px solid ${BORDER.soft}`, borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ padding: '28px 28px 0', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, color: T.secondary }} fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 18, color: T.primary }}>Android Â· Chrome</h2>
              </div>
              <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                Use <strong style={{ color: T.secondary }}>Chrome</strong>. Chrome may also show an automatic install banner at the bottom â€” tap it to skip the menu.
              </p>
            </div>

            <div style={{ padding: '0 20px', marginBottom: 24 }}>
              <ChromeMockup />
            </div>

            <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Step n="1" title="Tap the â‹® menu (three dots)" desc="Top-right corner of Chrome â€” highlighted in teal in the mockup above." />
              <Step n="2" title='Tap "Add to Home Screen"' desc='It may also say "Install app" â€” Chrome auto-detects PWAs. Both do the same thing.' />
              <Step n="3" title="Tap Install or Add" desc="The UNDDR icon appears on your home screen. Open it just like any app." />
            </div>
          </div>
        </div>

        {/* Desktop note */}
        <div style={{ marginTop: 32, padding: '20px 28px', background: BG.surface, border: `1px solid ${BORDER.soft}`, borderRadius: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, color: ACCENT, flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/></svg>
          <div>
            <p style={{ fontFamily: F, fontWeight: 600, fontSize: 14, color: T.primary, marginBottom: 4 }}>On desktop?</p>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>
              Chrome on desktop also supports installing as an app â€” look for the install icon (âŠ•) in the address bar.
              Or just bookmark unddrground.com and open it in any browser â€” it works perfectly without installing.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/login" style={{ fontFamily: F, fontWeight: 700, fontSize: 15, background: ACCENT, color: '#fff', padding: '14px 40px', borderRadius: 99, textDecoration: 'none' }}>
            Open UNDDR now â†’
          </Link>
        </div>
      </div>
    </div>
  );
}
