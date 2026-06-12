import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TaglineBanner from '../components/assets/TaglineBanner.jsx';

// ── Design tokens (use CSS variables for theming) ─────────────────────────────
const F = "'Space Grotesk', sans-serif";

const BG   = { deep: 'var(--bg-deep)', mid: 'var(--bg-muted)', surface: 'var(--bg-surface)' };
const CARD  = { base: 'var(--card-base)', raised: 'var(--bg-surface)' };
const METAL = 'var(--accent-warm)';
const ACCENT = 'var(--accent)';

const T = {
  primary:   'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  muted:     'rgba(71,85,105,0.65)',
  dim:       'rgba(71,85,105,0.4)',
};
const BORDER = {
  soft:        'var(--card-border)',
  accent:      'rgba(10,163,163,0.12)',
  accentHover: 'rgba(10,163,163,0.22)',
  metal:       'rgba(246,200,95,0.14)',
};

// ── Responsive ─────────────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, [breakpoint]);
  return mobile;
}

// ── Scroll-reveal ──────────────────────────────────────────────────────────────
function useReveal(threshold = 0.11) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, on];
}

function Reveal({ children, delay = 0, style = {}, className = '' }) {
  const [ref, on] = useReveal();
  return (
    <div ref={ref} className={className} style={{
      opacity:    on ? 1 : 0,
      transform:  on ? 'translateY(0)' : 'translateY(26px)',
      transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Primitives ─────────────────────────────────────────────────────────────────
const tag = { color: ACCENT, fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', display: 'block', marginBottom: 20 };

function MetalLine() {
  return <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${METAL}55, transparent)`, margin: '0 auto', maxWidth: 320 }} />;
}

function SectionDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ flex: 1, height: 1, background: `rgba(15,23,36,0.08)` }} />
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: METAL, opacity: 0.6, margin: '0 16px', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 1, background: `rgba(15,23,36,0.08)` }} />
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      {showModal && <InviteModal onClose={() => setShowModal(false)} />}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.35s ease',
        background:    scrolled ? 'rgba(247,251,255,0.92)'           : 'transparent',
        backdropFilter:scrolled ? 'blur(16px) saturate(1.5)'        : 'none',
        borderBottom:  scrolled ? `1px solid rgba(15,23,36,0.08)`  : '1px solid transparent',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: '#07050B', letterSpacing: '-0.03em' }}>U</span>
            </div>
            <span style={{ fontFamily: F, fontWeight: 700, fontSize: 18, color: ACCENT, letterSpacing: '-0.02em' }}>UNDDR</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/apply" style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: T.secondary, textDecoration: 'none', padding: '10px 14px', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = ACCENT}
              onMouseLeave={e => e.currentTarget.style.color = T.secondary}
            >Apply</Link>
            <button
              onClick={() => setShowModal(true)}
              style={{
                fontFamily: F, fontWeight: 600, fontSize: 13,
                border: `1px solid ${BORDER.soft}`, color: T.secondary,
                padding: '9px 16px', borderRadius: 99,
                background: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER.soft; e.currentTarget.style.color = T.secondary; }}
            >
              I have an invite
            </button>
            <Link to="/login" style={{
              fontFamily: F, fontWeight: 700, fontSize: 13,
              background: ACCENT, color: '#ffffff',
              padding: '10px 20px', borderRadius: 99,
              textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-strong)'}
              onMouseLeave={e => e.currentTarget.style.background = ACCENT}
            >
              Open UNDDR →
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}

// ── 1. Hero ────────────────────────────────────────────────────────────────────
function Hero() {
  const [ready, setReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const mobile = useIsMobile();
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  return (
    <section style={{ background: BG.deep, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: mobile ? '72px 20px 48px' : '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* Radial glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(10,163,163,0.06) 0%, transparent 66%)' }} />

      {/* Grain */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.038,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '220px',
      }} />

      <div style={{
        position: 'relative', maxWidth: 740, margin: '0 auto', fontFamily: F,
        opacity:    ready ? 1 : 0,
        transform:  ready ? 'none' : 'translateY(22px)',
        transition: 'opacity 1.1s ease, transform 1.1s ease',
      }}>
        {/* Hero wordmark — inline so it can never be cut off by viewport */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <span style={{ fontFamily: F, fontWeight: 800, fontSize: 'clamp(72px, 18vw, 140px)', color: ACCENT, letterSpacing: '-0.055em', lineHeight: 0.92, display: 'block' }}>UNDDR</span>
        </div>

        {/* Tagline eyebrow */}
        <p style={{ ...tag, fontSize: 11, letterSpacing: '0.28em', marginBottom: 28 }}>
          Invite-only · Underground · Encrypted
        </p>

        {/* Headline */}
        <h1 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(44px, 8vw, 76px)', lineHeight: 1.03, letterSpacing: '-0.035em', color: T.primary, margin: '0 0 24px' }}>
          A private room<br />
          <span style={{ color: ACCENT }}>beneath the noise.</span>
        </h1>

        {/* Description */}
        <p style={{ fontSize: mobile ? 16 : 19, lineHeight: 1.65, color: T.secondary, maxWidth: 540, margin: '0 auto 10px' }}>
          A private encrypted messaging app for people who were invited on purpose.
        </p>

        {/* Trust line */}
        <p style={{ fontSize: 13, color: T.dim, fontWeight: 500, marginBottom: 48 }}>
          No feed. No followers. No algorithm.
        </p>

        {showModal && <InviteModal onClose={() => setShowModal(false)} />}

        {/* CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              fontFamily: F, fontWeight: 700, fontSize: 15,
              background: ACCENT, color: '#ffffff',
              padding: '14px 34px', borderRadius: 99,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-strong)'}
            onMouseLeave={e => e.currentTarget.style.background = ACCENT}
          >
            I have an invite →
          </button>
          <Link to="/login" style={{
            fontFamily: F, fontWeight: 600, fontSize: 15,
            border: `1px solid ${BORDER.soft}`, color: T.secondary,
            padding: '14px 34px', borderRadius: 99,
            textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(15,23,36,0.22)'; e.currentTarget.style.color = T.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER.soft; e.currentTarget.style.color = T.secondary; }}
          >
            Open UNDDR
          </Link>
        </div>

        {/* Apply nudge */}
        <div style={{ marginTop: 18 }}>
          <Link to="/apply" style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T.muted, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = ACCENT}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >
            Don't have an invite? Apply for access →
          </Link>
        </div>

        {/* Badges (responsive) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: mobile ? 10 : 18, marginTop: 28, flexWrap: 'wrap' }}>
          <img src="/assets/pngs/invite-only-light-256.png" alt="Invite-only" style={{ width: 220, maxWidth: '100%', height: 'auto' }} />
          <img src="/assets/pngs/encrypted-light-256.png" alt="Encrypted" style={{ width: 220, maxWidth: '100%', height: 'auto' }} />
          <img src="/assets/pngs/vouched-light-256.png" alt="Vouched" style={{ width: 220, maxWidth: '100%', height: 'auto' }} />
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', opacity: 0.2 }}>
        <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, transparent, ${T.primary})` }} />
      </div>
    </section>
  );
}

// ── 2. The Quiet Room ──────────────────────────────────────────────────────────
function TheQuietRoom() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.mid }}>
      <SectionDivider />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 80, alignItems: 'center' }}>

          <Reveal>
            <span style={tag}>What Unddr is</span>
            <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 24 }}>
              Not a feed.<br />Not a stage.<br />Not a place to<br />collect strangers.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: T.secondary }}>
              Unddr is a private room for people who know each other well enough to speak honestly.
              Built around fewer people, stronger trust, and quieter communication.
            </p>
          </Reveal>

          <Reveal delay={110}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['No public feed',     'Nothing is broadcast. Everything is direct.'],
                ['No followers',       'You add people. You are not collected by them.'],
                ['No algorithm',      'Nothing is curated for engagement or to keep you scrolling.'],
                ['No performance',    'There is no audience. No scoreboard. Just conversation.'],
              ].map(([label, desc]) => (
                <div key={label} style={{ padding: '16px 20px', background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 14, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, flexShrink: 0, marginTop: 8 }} />
                  <div>
                    <p style={{ fontFamily: F, fontWeight: 600, fontSize: 14, color: T.primary, marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}

// ── 3. How You Get In ──────────────────────────────────────────────────────────
function HowYouGetIn() {
  const mobile = useIsMobile();
  const steps = [
    { n: '01', title: 'Someone trusts you.',          desc: 'An existing member decides you belong here. Not an algorithm. A person.' },
    { n: '02', title: 'They send one private invite.', desc: 'Each member gets 2 lifetime invites. One-time use. Expires in 30 days.' },
    { n: '03', title: 'You enter quietly.',            desc: 'No application. No profile review. You were personally vouched for.' },
    { n: '04', title: 'You settle in for 7 days.',     desc: "Full access from day one. The app works normally. You just can't generate invites yet." },
    { n: '05', title: 'You receive two vouches.',      desc: 'After your settling period, 2 invite tokens of your own appear. Now it is your turn.' },
    { n: '06', title: 'The circle grows carefully.',   desc: 'Slowly. Intentionally. One real person at a time.' },
  ];

  return (
    <section style={{ background: BG.deep }}>
      <SectionDivider />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>

        <Reveal>
          <span style={tag}>How you get in</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 64 }}>
            <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, margin: 0 }}>
              The invite system<br />
              is not a growth hack.<br />
              <span style={{ color: ACCENT }}>It is the product.</span>
            </h2>
            <p style={{ fontSize: 13, color: T.muted, maxWidth: mobile ? '100%' : 220, lineHeight: 1.7, textAlign: mobile ? 'left' : 'right' }}>
              You do not apply. Someone inside personally decides you belong here.
            </p>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 55}>
              <div style={{ background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 16, padding: '28px 24px', height: '100%', boxSizing: 'border-box' }}>
                <p style={{ fontFamily: F, fontWeight: 700, fontSize: 11, color: ACCENT, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>{s.n}</p>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: 15, color: T.primary, lineHeight: 1.4, marginBottom: 10 }}>{s.title}</p>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 980 }}>
              <TaglineBanner responsive={true} width={980} ariaLabel="The network grows at the speed of trust banner" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── 4. The Trust Layer ─────────────────────────────────────────────────────────
function TrustLayer() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.surface, borderTop: `1px solid ${BORDER.metal}`, borderBottom: `1px solid ${BORDER.metal}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>
        <Reveal>
          <span style={tag}>The trust layer</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(42px, 6vw, 68px)', lineHeight: 1.04, letterSpacing: '-0.035em', color: T.primary, margin: '0 0 72px', maxWidth: 700 }}>
            Access is not open.<br />
            <span style={{ color: ACCENT }}>It is vouched.</span>
          </h2>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
          {[
            { label: '2 lifetime tokens.',     body: 'Every member receives two invites. Not per year. Not per month. Ever. Choose with the weight that deserves.' },
            { label: 'One-time use.',           body: 'Each invite link works once. It cannot be forwarded, mass-shared, or used to flood the network.' },
            { label: 'Expires in 30 days.',     body: 'An unused invite is not indefinite. If it sits too long, it lapses. Intention should be immediate.' },
            { label: 'Your name travels with it.', body: "When someone causes harm, the chain of trust matters. Who vouched for whom is part of the picture." },
          ].map((item, i) => (
            <Reveal key={item.label} delay={i * 60}>
              <div style={{ borderLeft: `2px solid ${METAL}60`, paddingLeft: 24 }}>
                <p style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: ACCENT, marginBottom: 10 }}>{item.label}</p>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 5. Features ────────────────────────────────────────────────────────────────
const FEATURES = [
  { p: 'M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z', title: 'End-to-end encrypted', desc: 'RSA-OAEP 2048-bit + AES-GCM-256 per message. Your private key never leaves this device.' },
  { p: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', title: 'Disappearing messages', desc: 'Set conversations to auto-delete. Nothing lasts longer than you want it to.' },
  { p: 'm18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13', title: 'Encrypted media', desc: 'Photos, video, audio, and files — all encrypted before they leave your device.' },
  { p: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0', title: 'Push notifications', desc: 'Get notified when it matters. On mobile and desktop, without compromise.' },
  { p: 'M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3', title: 'Installable on any device', desc: 'No App Store. Open unddrground.com in Safari or Chrome and add it to your home screen.' },
  { p: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z', title: 'Friends, not followers', desc: 'Every relationship is mutual. You add people. There are no follower counts.' },
  { p: 'M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636', title: 'No ads. No tracking.', desc: 'No analytics on message content. No profiling. Nothing is read except by the people you sent it to.' },
  { p: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25z', title: 'Invite-only access', desc: 'You cannot stumble in. Every member was personally chosen by someone already inside.' },
];

function FeaturesGrid() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.mid }}>
      <SectionDivider />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>
        <Reveal>
          <span style={tag}>Designed for private conversation</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 64 }}>
            Designed to keep what<br />you share{' '}
            <span style={{ color: ACCENT }}>quiet.</span>
          </h2>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 40}>
              <div
                style={{ background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 14, padding: '22px 20px', height: '100%', boxSizing: 'border-box', transition: 'border-color 0.25s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = BORDER.accentHover}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER.soft}
              >
                <span style={{ color: ACCENT, display: 'block', marginBottom: 14 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.p} />
                  </svg>
                </span>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: T.primary, marginBottom: 6 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 6. The One Rule ────────────────────────────────────────────────────────────
function TheOneRule() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.deep, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 65% 60% at 50% 50%, rgba(10,163,163,0.06) 0%, transparent 66%)' }} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: mobile ? '64px 20px' : '128px 24px', textAlign: 'center', position: 'relative' }}>
        <Reveal>
          <span style={tag}>The one rule</span>

          <div style={{ background: 'rgba(10,163,163,0.04)', border: `1px solid ${BORDER.accent}`, borderRadius: 20, padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 64px)', margin: '8px 0 44px' }}>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 6vw, 62px)', lineHeight: 1.04, letterSpacing: '-0.03em', color: ACCENT }}>
              "Say anything.
            </p>
            <p style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 6vw, 62px)', lineHeight: 1.04, letterSpacing: '-0.03em', color: T.primary, marginTop: 4 }}>
              Just don't try<br />to wound."
            </p>
          </div>

          <p style={{ fontSize: 17, lineHeight: 1.7, color: T.secondary, marginBottom: 16 }}>
            Talk about religion, politics, money, sex, failure, addiction,<br className="hidden sm:block" />
            doubt, ambition, strange thoughts, or difficult truths.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: T.secondary, marginBottom: 36 }}>
            Unddr is not built to protect people from disagreement.<br />
            It is built to protect conversation from contempt.
          </p>

          <MetalLine />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.dim, marginTop: 28 }}>
            Disagreement is allowed. Contempt is not.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── 7. Welcome / Not Welcome ───────────────────────────────────────────────────
function WelcomeNotWelcome() {
  const mobile = useIsMobile();
  const welcomed = ['Disagreement', 'Honesty', 'Vulnerability', 'Unpopular opinions', 'Difficult conversations', 'Direct truth', 'Changing your mind'];
  const refused  = ['Deliberate humiliation', 'Threats', 'Doxxing', 'Harassment', 'Impersonation', 'Using private information as a weapon', 'Repeated targeted harm'];

  const pairs = [
    {
      yes: { text: '"I think that policy actively harms people."', label: 'Disagreement.' },
      no:  { text: '"You\'re an idiot for believing that."',       label: 'Contempt.' },
    },
    {
      yes: { text: '"I struggle with this, and it makes me pull away."', label: 'Honesty.' },
      no:  { text: '"You\'re clearly broken. Get help."',                label: 'Attack.' },
    },
  ];

  return (
    <section style={{ background: BG.mid }}>
      <SectionDivider />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>

        <Reveal>
          <span style={tag}>The line</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 52 }}>
            Clear, not complicated.
          </h2>
        </Reveal>

        {/* Lists */}
        <Reveal delay={60}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 32 }}>
            <div style={{ background: CARD.base, border: `1px solid rgba(52,211,153,0.16)`, borderRadius: 16, padding: '24px 28px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.75)', marginBottom: 20 }}>Welcome here</p>
              {welcomed.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ color: 'rgba(52,211,153,0.55)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 13, color: T.secondary, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: CARD.base, border: `1px solid rgba(248,113,113,0.14)`, borderRadius: 16, padding: '24px 28px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.70)', marginBottom: 20 }}>Not welcome</p>
              {refused.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ color: 'rgba(248,113,113,0.50)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Comparison examples */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pairs.map((p, i) => (
            <Reveal key={i} delay={i * 80}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                <div style={{ background: 'rgba(16,185,129,0.05)', border: `1px solid rgba(16,185,129,0.18)`, borderRadius: 14, padding: '22px 24px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.75)', marginBottom: 14 }}>✓ Welcome</p>
                  <p style={{ fontFamily: F, fontWeight: 500, fontSize: 15, color: T.primary, lineHeight: 1.6, marginBottom: 8 }}>{p.yes.text}</p>
                  <p style={{ fontSize: 12, color: T.muted }}>{p.yes.label}</p>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.04)', border: `1px solid rgba(239,68,68,0.16)`, borderRadius: 14, padding: '22px 24px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(248,113,113,0.70)', marginBottom: 14 }}>✗ Not welcome</p>
                  <p style={{ fontFamily: F, fontWeight: 500, fontSize: 15, color: T.secondary, lineHeight: 1.6, marginBottom: 8 }}>{p.no.text}</p>
                  <p style={{ fontSize: 12, color: T.muted }}>{p.no.label}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 8. Five Principles ─────────────────────────────────────────────────────────
const PRINCIPLES = [
  { n: '1', title: 'Warmth first.',                   body: 'Assume the person on the other side is human before you assume they are hostile. Give people a breath before you escalate.' },
  { n: '2', title: 'No performance.',                  body: 'There is no public scoreboard here. No followers. No feed. No audience. Drop the persona and speak plainly.' },
  { n: '3', title: 'You can always leave.',            body: 'Mute, block, step away, or close the room. Walking away is strength when things start heating up.' },
  { n: '4', title: 'Speak like there is a record.',   body: 'Private does not mean careless. Say things you would stand behind later.' },
  { n: '5', title: 'Your invite reflects on you.',    body: 'You get two vouches. When you bring someone in, your name travels with that choice. Choose carefully.' },
];

function FivePrinciples() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.deep }}>
      <SectionDivider />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>

        <Reveal>
          <span style={tag}>Five principles</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 52 }}>
            House rules.
          </h2>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.n} delay={i * 65}>
              <div
                style={{ background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 14, padding: '22px 24px', display: 'flex', gap: 20, alignItems: 'flex-start', transition: 'border-color 0.25s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = BORDER.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER.soft}
              >
                <span style={{ width: 36, height: 36, borderRadius: '50%', background: ACCENT, color: '#07050B', fontFamily: F, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {p.n}
                </span>
                <div>
                  <p style={{ fontFamily: F, fontWeight: 700, fontSize: 15, color: T.primary, marginBottom: 6 }}>{p.title}</p>
                  <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 9. Install Unddr ───────────────────────────────────────────────────────────
// Visual phone mockup helpers
function PhoneMockup({ children }) {
  return (
    <div style={{ background: '#f1f5f9', borderRadius: 16, padding: 10, border: '1px solid rgba(15,23,36,0.07)', marginBottom: 20 }}>
      {children}
    </div>
  );
}
function BrowserBar({ children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, boxShadow: '0 1px 3px rgba(15,23,36,0.07)' }}>
      {children}
    </div>
  );
}
function HighlightBadge({ label }) {
  return (
    <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', background: ACCENT, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
      {label}
    </div>
  );
}

function InstallUnddr() {
  const mobile = useIsMobile();
  const stepStyle = (n) => ({
    width: 22, height: 22, borderRadius: '50%', background: 'rgba(10,163,163,0.08)',
    border: '1px solid rgba(10,163,163,0.18)', color: ACCENT, fontFamily: F,
    fontWeight: 700, fontSize: 9, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, marginTop: 2, letterSpacing: '0.05em',
  });

  return (
    <section style={{ background: BG.surface, borderTop: `1px solid ${BORDER.metal}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '56px 20px' : '88px 24px' }}>

        <Reveal>
          <span style={tag}>Get the app</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
            <div>
              <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 12 }}>
                No App Store.<br />Add it in 3 taps.
              </h2>
              <p style={{ fontSize: 16, color: T.secondary, lineHeight: 1.65, maxWidth: 420 }}>
                Works on any phone. No download. Open unddrground.com in your browser and follow the steps below.
              </p>
            </div>
            <Link to="/login" style={{
              fontFamily: F, fontWeight: 700, fontSize: 14,
              border: `1px solid ${BORDER.soft}`, color: T.secondary,
              padding: '11px 22px', borderRadius: 99, textDecoration: 'none',
              transition: 'all 0.2s', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER.soft; e.currentTarget.style.color = T.secondary; }}
            >
              Skip install, open in browser →
            </Link>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

          {/* ── iPhone · Safari ── */}
          <Reveal delay={60}>
            <div style={{ background: CARD.raised, border: `1px solid ${BORDER.soft}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '22px 22px 0', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: T.muted }} fill="currentColor">
                  <path d="M17 2H7a3 3 0 00-3 3v14a3 3 0 003 3h10a3 3 0 003-3V5a3 3 0 00-3-3zm-5 17a1 1 0 110-2 1 1 0 010 2zm4-4H8V6h8v9z"/>
                </svg>
                <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: T.primary }}>iPhone · Safari</span>
              </div>

              <div style={{ padding: '0 16px' }}>
                <PhoneMockup>
                  {/* Safari top bar */}
                  <BrowserBar>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, fontSize: 8, color: '#94a3b8', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>unddrground.com</div>
                  </BrowserBar>
                  {/* Page preview */}
                  <div style={{ background: '#fff', borderRadius: 6, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: F, fontWeight: 800, fontSize: 11, color: ACCENT, letterSpacing: '-0.01em' }}>UNDDR</span>
                  </div>
                  {/* Safari bottom toolbar */}
                  <div style={{ background: '#fff', borderRadius: 8, padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: '#cbd5e1' }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg>
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: '#cbd5e1' }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg>
                    {/* HIGHLIGHTED: Share button */}
                    <div style={{ position: 'relative' }}>
                      <HighlightBadge label="TAP HERE" />
                      <div style={{ background: 'rgba(10,163,163,0.12)', border: '2px solid #0AA3A3', borderRadius: 7, padding: '4px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: ACCENT }} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3v13M8 7l4-4 4 4"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>
                        </svg>
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: '#cbd5e1' }} fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                    <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, color: '#cbd5e1' }} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>
                  </div>
                  {/* Sheet popup hint */}
                  <div style={{ background: '#fff', borderRadius: 8, padding: '7px 10px', marginTop: 4, border: '1px solid rgba(15,23,36,0.07)' }}>
                    {['AirDrop', 'Copy', 'Safari Reader'].map(item => (
                      <div key={item} style={{ fontSize: 9, color: '#94a3b8', padding: '3px 0' }}>{item}</div>
                    ))}
                    <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, background: 'rgba(10,163,163,0.08)', borderRadius: 4, padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 4, border: '1px solid rgba(10,163,163,0.18)' }}>
                      <svg viewBox="0 0 24 24" style={{ width: 9, height: 9 }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                      Add to Home Screen ← tap this
                    </div>
                  </div>
                </PhoneMockup>
              </div>

              <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['01', 'Tap the Share button', 'The box-with-arrow icon in Safari\'s bottom bar. It\'s highlighted in teal above.'],
                  ['02', 'Tap "Add to Home Screen"', 'Scroll the share sheet — it\'s in the list of actions. Tap it.'],
                  ['03', 'Tap Add in the top-right', 'A name and icon preview appears. Tap Add. Done.'],
                ].map(([n, title, desc]) => (
                  <div key={n} style={{ display: 'flex', gap: 11 }}>
                    <span style={stepStyle(n)}>{n}</span>
                    <div>
                      <p style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: T.primary, marginBottom: 2 }}>{title}</p>
                      <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Android · Chrome ── */}
          <Reveal delay={130}>
            <div style={{ background: CARD.raised, border: `1px solid ${BORDER.soft}`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '22px 22px 0', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, color: T.muted }} fill="currentColor">
                  <path d="M17 2H7a3 3 0 00-3 3v14a3 3 0 003 3h10a3 3 0 003-3V5a3 3 0 00-3-3zm-5 17a1 1 0 110-2 1 1 0 010 2zm4-4H8V6h8v9z"/>
                </svg>
                <span style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: T.primary }}>Android · Chrome</span>
              </div>

              <div style={{ padding: '0 16px' }}>
                <PhoneMockup>
                  {/* Chrome top bar with highlighted 3-dot */}
                  <BrowserBar>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, fontSize: 8, color: '#94a3b8', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>unddrground.com</div>
                    <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                      <svg viewBox="0 0 24 24" style={{ width: 11, height: 11, color: '#94a3b8' }} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
                    </div>
                    {/* HIGHLIGHTED: 3-dot menu */}
                    <div style={{ position: 'relative', marginLeft: 2 }}>
                      <HighlightBadge label="TAP HERE" />
                      <div style={{ background: 'rgba(10,163,163,0.12)', border: '2px solid #0AA3A3', borderRadius: 5, padding: '4px 4px', display: 'flex', gap: '2px', alignItems: 'center' }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: ACCENT }} />)}
                      </div>
                    </div>
                  </BrowserBar>

                  {/* Dropdown menu */}
                  <div style={{ background: '#fff', borderRadius: 8, padding: '5px 4px', marginBottom: 6, boxShadow: '0 2px 8px rgba(15,23,36,0.10)', border: '1px solid rgba(15,23,36,0.06)' }}>
                    {['New tab', 'Bookmarks', 'History', 'Downloads'].map(item => (
                      <div key={item} style={{ padding: '5px 10px', fontSize: 9, color: '#94a3b8' }}>{item}</div>
                    ))}
                    {/* HIGHLIGHTED menu item */}
                    <div style={{ padding: '5px 10px', fontSize: 9, fontWeight: 700, color: ACCENT, background: 'rgba(10,163,163,0.08)', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 5, border: '1px solid rgba(10,163,163,0.18)', margin: '2px 3px' }}>
                      <svg viewBox="0 0 24 24" style={{ width: 9, height: 9 }} fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                      Add to Home Screen ← tap this
                    </div>
                    {['Settings', 'Help'].map(item => (
                      <div key={item} style={{ padding: '5px 10px', fontSize: 9, color: '#94a3b8' }}>{item}</div>
                    ))}
                  </div>

                  {/* Page preview */}
                  <div style={{ background: '#fff', borderRadius: 6, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: F, fontWeight: 800, fontSize: 11, color: ACCENT, letterSpacing: '-0.01em' }}>UNDDR</span>
                  </div>
                </PhoneMockup>
              </div>

              <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['01', 'Tap the ⋮ menu', 'The three-dot icon in the top-right corner of Chrome — highlighted in teal above.'],
                  ['02', 'Tap "Add to Home Screen"', 'It may also appear as "Install app" if Chrome auto-detects the PWA banner.'],
                  ['03', 'Tap Install or Add', 'The icon appears on your home screen immediately.'],
                ].map(([n, title, desc]) => (
                  <div key={n} style={{ display: 'flex', gap: 11 }}>
                    <span style={stepStyle(n)}>{n}</span>
                    <div>
                      <p style={{ fontFamily: F, fontWeight: 600, fontSize: 13, color: T.primary, marginBottom: 2 }}>{title}</p>
                      <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── 10. Moderation ─────────────────────────────────────────────────────────────
function Moderation() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.mid }}>
      <SectionDivider />
      <div style={{ maxWidth: 740, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px', textAlign: 'center' }}>
        <Reveal>
          <span style={tag}>Moderation</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(30px, 4vw, 44px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: T.primary, marginBottom: 20 }}>
            Private. Human. Rare.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: T.secondary, marginBottom: 52 }}>
            Moderation exists to protect the room, not to police disagreement.
            If a member is repeatedly flagged, the case receives a private human review — not an automated decision.
          </p>
        </Reveal>

        <Reveal delay={60}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 36 }}>
            <div style={{ background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 14, padding: '22px 24px', textAlign: 'left' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.dim, marginBottom: 16 }}>Grounds for removal</p>
              {['Deliberate repeated harm', 'Doxxing', 'Coordinating real-world harm', 'Abusing the invite system', 'Impersonation or threats', 'Harassment'].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(248,113,113,0.50)', fontSize: 13, marginTop: 1, flexShrink: 0 }}>—</span>
                  <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 14, padding: '22px 24px', textAlign: 'left' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.dim, marginBottom: 16 }}>Not grounds for removal</p>
              {['Being wrong', 'Being controversial', 'Being difficult to agree with', 'Holding unpopular opinions', 'Disagreeing strongly', 'Changing your mind'].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(52,211,153,0.50)', fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <p style={{ fontSize: 13, color: T.dim, lineHeight: 1.7 }}>
            If removed, you get one appeal — read by a human. Write it plainly. We take it seriously.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── NEW: Why UNDDR is different ────────────────────────────────────────────────
function WhyDifferent() {
  const mobile = useIsMobile();
  const diffs = [
    {
      feature: 'Invite-only access',
      unddr: 'You cannot sign up without a personal invite. Every member was chosen by someone inside.',
      them:  'WhatsApp, Signal, Telegram — anyone can register with just a phone number.',
    },
    {
      feature: 'No public profiles',
      unddr: 'No profile page, no follower count, no way for strangers to find or add you.',
      them:  'Every other platform exposes you to searches, profile browsing, and unsolicited adds.',
    },
    {
      feature: 'Genuine end-to-end encryption',
      unddr: 'RSA-OAEP + AES-GCM per message. Keys are generated on your device and never leave it.',
      them:  'Signal: genuinely E2EE. WhatsApp: E2EE but metadata-collected by Meta. Telegram: not E2EE by default.',
    },
    {
      feature: 'No algorithm. No feed.',
      unddr: 'Only direct messages. No suggestion engine. Nothing is optimised to keep you scrolling.',
      them:  'Telegram has channels and recommendations. WhatsApp has Status. No major app is fully free of it.',
    },
    {
      feature: 'Vouched accountability',
      unddr: 'Your name is attached to every invite you give. Harm traces back to its origin.',
      them:  'Open registration means no accountability chain — anyone can join with no consequence.',
    },
    {
      feature: 'No App Store required',
      unddr: 'Install as a PWA directly from your browser. No Apple review. No Play Store gating.',
      them:  'App Store and Play Store gate access, delay updates, and take platform fees.',
    },
  ];

  return (
    <section style={{ background: BG.surface }}>
      <SectionDivider />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>

        <Reveal>
          <span style={tag}>Why UNDDR is different</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 16 }}>
            A different kind of<br />
            <span style={{ color: ACCENT }}>private messaging.</span>
          </h2>
          <p style={{ fontSize: 17, color: T.secondary, lineHeight: 1.7, marginBottom: 56, maxWidth: 540 }}>
            Signal protects your messages. WhatsApp holds your social graph. Telegram builds audiences.
            UNDDR does something none of them do: limits who can be there in the first place.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {diffs.map((d, i) => (
            <Reveal key={d.feature} delay={i * 45}>
              <div
                style={{ background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 16, padding: '24px 22px', height: '100%', boxSizing: 'border-box', transition: 'border-color 0.25s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = BORDER.accentHover}
                onMouseLeave={e => e.currentTarget.style.borderColor = BORDER.soft}
              >
                <p style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: ACCENT, marginBottom: 14 }}>{d.feature}</p>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(10,163,163,0.1)', border: '1px solid rgba(10,163,163,0.2)', color: ACCENT, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>✓</span>
                  <p style={{ fontSize: 13, color: T.secondary, lineHeight: 1.6 }}>{d.unddr}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(71,85,105,0.06)', border: '1px solid rgba(71,85,105,0.12)', color: T.muted, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>≠</span>
                  <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{d.them}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── NEW: Onboarding Guide ──────────────────────────────────────────────────────
function OnboardingGuide() {
  const mobile = useIsMobile();
  const steps = [
    { n: '01', icon: 'M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25z', title: 'Receive an invite link', desc: 'A current member sends you a private URL. It works once and expires in 30 days. No one can sign up without one.' },
    { n: '02', icon: 'M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3', title: 'Click the link', desc: "It takes you directly to registration. You're already pre-authorized — the link is your door in." },
    { n: '03', icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z', title: 'Verify your phone', desc: 'Enter your phone number and receive an SMS code. This confirms you are a real person, not a bot.' },
    { n: '04', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z', title: 'Choose a username', desc: '3 to 20 characters, letters and numbers only. This is how you appear to other members inside UNDDR.' },
    { n: '05', icon: 'M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z', title: 'Start messaging', desc: "You're in. The friend who invited you is already in your contacts. Your messages are end-to-end encrypted from the first word." },
    { n: '06', icon: 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44z', title: 'Install as an app', desc: 'Open unddrground.com in Safari or Chrome and tap "Add to Home Screen". No app store. Takes ten seconds.' },
  ];

  return (
    <section style={{ background: BG.mid }}>
      <SectionDivider />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px' }}>

        <Reveal>
          <span style={tag}>Getting started</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 16 }}>
            Six steps from<br />
            <span style={{ color: ACCENT }}>invite to app.</span>
          </h2>
          <p style={{ fontSize: 17, color: T.secondary, lineHeight: 1.7, marginBottom: 56, maxWidth: 500 }}>
            Once you have an invite link, the whole setup takes under two minutes.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 50}>
              <div style={{ background: CARD.base, border: `1px solid ${BORDER.soft}`, borderRadius: 16, padding: '24px 22px', height: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(10,163,163,0.08)', border: '1px solid rgba(10,163,163,0.18)', color: ACCENT, fontFamily: F, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.n}
                  </span>
                  <svg style={{ width: 16, height: 16, color: ACCENT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
                  </svg>
                </div>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: 14, color: T.primary, marginBottom: 8, lineHeight: 1.4 }}>{s.title}</p>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── NEW: Why This Matters ──────────────────────────────────────────────────────
function WhyItMatters() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.deep, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(10,163,163,0.05) 0%, transparent 66%)' }} />
      <SectionDivider />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px', textAlign: 'center', position: 'relative' }}>
        <Reveal>
          <span style={tag}>Why this exists</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 24 }}>
            Most conversation<br />
            <span style={{ color: ACCENT }}>happens in public.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: T.secondary, marginBottom: 20 }}>
            Social media trained people to perform. Every message is a post. Every reply is on record.
            Disagreement became dangerous. Honesty became risky. Real conversation retreated.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: T.secondary, marginBottom: 20 }}>
            UNDDR is a room where that logic doesn't apply. No audience. No algorithm.
            No stranger watching from the search results. Just the people you trust,
            saying the things they'd only say in private.
          </p>
          <p style={{ fontSize: 17, lineHeight: 1.75, color: T.secondary, marginBottom: 48 }}>
            It is not anti-social media. It is pre-social media: the kind of conversation
            you had before everything became content.
          </p>
          <MetalLine />
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.dim, marginTop: 28 }}>
            Private. Intentional. Human.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── NEW: Apply Section ─────────────────────────────────────────────────────────
function ApplySection() {
  const mobile = useIsMobile();
  return (
    <section style={{ background: BG.surface, borderTop: `1px solid ${BORDER.metal}`, borderBottom: `1px solid ${BORDER.metal}` }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: mobile ? '64px 20px' : '112px 24px', textAlign: 'center' }}>
        <Reveal>
          <span style={tag}>Don't know anyone inside?</span>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.07, letterSpacing: '-0.03em', color: T.primary, marginBottom: 20 }}>
            Apply for<br />
            <span style={{ color: ACCENT }}>an invite.</span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: T.secondary, marginBottom: 12, maxWidth: 480, margin: '0 auto 12px' }}>
            Share your Instagram or Facebook handle, your contact info, and a brief note about who you are.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: T.muted, marginBottom: 40 }}>
            Applications are reviewed personally — not by an algorithm.
            Approved applicants receive a private invite link.
          </p>
          <Link to="/apply" style={{
            display: 'inline-block', fontFamily: F, fontWeight: 700, fontSize: 15,
            background: ACCENT, color: '#fff',
            padding: '14px 40px', borderRadius: 99, textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-strong)'}
            onMouseLeave={e => e.currentTarget.style.background = ACCENT}
          >
            Apply for access →
          </Link>
          <p style={{ fontSize: 12, color: T.dim, marginTop: 20 }}>Usually reviewed within a few days.</p>
        </Reveal>
      </div>
    </section>
  );
}

// ── Invite code entry modal ────────────────────────────────────────────────────
function InviteModal({ onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const go = (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) { setError('Paste or type your invite code.'); return; }
    // Handles full URL (e.g. https://unddrground.com/invite/abc123) or bare code
    const match = trimmed.match(/\/invite\/([^/?#]+)/);
    const resolved = match ? match[1] : trimmed;
    navigate(`/invite/${encodeURIComponent(resolved)}`);
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,36,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 20, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 16px 64px rgba(15,23,36,0.18)', fontFamily: F }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(10,163,163,0.08)', border: '1.5px solid rgba(10,163,163,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontWeight: 800, fontSize: 20, color: ACCENT, fontFamily: F }}>U</span>
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: T.primary, margin: '0 0 8px' }}>Enter your invite</h2>
          <p style={{ fontSize: 14, color: T.secondary, lineHeight: 1.6, margin: 0 }}>
            Paste the invite link or code you received from a member.
          </p>
        </div>

        <form onSubmit={go} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            placeholder="Paste invite link or code"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-muted)', border: `1.5px solid ${error ? 'rgba(239,68,68,0.4)' : 'var(--card-border)'}`,
              borderRadius: 12, padding: '12px 14px', fontSize: 14,
              color: T.primary, outline: 'none', fontFamily: F,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { if (!error) e.target.style.borderColor = ACCENT; }}
            onBlur={(e) => { e.target.style.borderColor = error ? 'rgba(239,68,68,0.4)' : 'var(--card-border)'; }}
          />
          {error && <p style={{ fontSize: 12, color: 'rgba(220,38,38,0.85)', margin: 0 }}>{error}</p>}
          <button
            type="submit"
            style={{ width: '100%', background: ACCENT, color: '#fff', fontFamily: F, fontWeight: 700, fontSize: 15, padding: '13px 0', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'opacity 0.15s' }}
          >
            Continue →
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '100%', background: 'transparent', border: 'none', color: T.secondary, fontSize: 13, fontFamily: F, cursor: 'pointer', padding: '6px 0' }}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

// ── 11. Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  const mobile = useIsMobile();
  const [showInviteModal, setShowInviteModal] = useState(false);
  return (
    <section style={{ background: BG.deep, position: 'relative', overflow: 'hidden' }}>
      {showInviteModal && <InviteModal onClose={() => setShowInviteModal(false)} />}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 60% 58% at 50% 62%, rgba(10,163,163,0.06) 0%, transparent 64%)' }} />
      <SectionDivider />
      <div style={{ maxWidth: 740, margin: '0 auto', padding: mobile ? '72px 20px' : '128px 24px', textAlign: 'center', position: 'relative' }}>
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: T.dim, marginBottom: 36 }}>A quieter place to talk</p>
          <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(40px, 7vw, 68px)', lineHeight: 1.04, letterSpacing: '-0.035em', color: T.primary, marginBottom: 18 }}>
            The room is<br />already open.
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: T.secondary, marginBottom: 48 }}>
            You just need someone inside to send the door.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  fontFamily: F, fontWeight: 700, fontSize: 15,
                  background: ACCENT, color: '#ffffff',
                  padding: '14px 36px', borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-strong)'}
                onMouseLeave={e => e.currentTarget.style.background = ACCENT}
              >
                I have an invite →
              </button>
              <Link to="/apply" style={{
                fontFamily: F, fontWeight: 600, fontSize: 15,
                border: `1px solid ${BORDER.soft}`, color: T.secondary,
                padding: '14px 36px', borderRadius: 99, textDecoration: 'none', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER.accentHover; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER.soft; e.currentTarget.style.color = T.secondary; }}
              >
                Apply for access
              </Link>
            </div>
            <Link to="/manual" style={{ fontFamily: F, fontSize: 13, color: T.dim, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = T.muted}
              onMouseLeave={e => e.currentTarget.style.color = T.dim}
            >
              Read the Manual →
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── 12. Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: BG.mid, borderTop: `1px solid rgba(15,23,36,0.08)`, padding: '36px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: ACCENT, opacity: 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: F, fontWeight: 800, fontSize: 11, color: '#07050B', letterSpacing: '-0.02em' }}>U</span>
          </div>
          <span style={{ fontFamily: F, fontWeight: 700, fontSize: 14, color: T.muted, letterSpacing: '-0.01em' }}>UNDDR</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
          {[{ label: 'Open UNDDR', to: '/login' }, { label: 'The Manual', to: '/manual' }, { label: 'Apply', to: '/apply' }].map(({ label, to }) => (
            <Link key={label} to={to} style={{ fontFamily: F, fontSize: 13, color: T.muted, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = T.secondary}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}
            >
              {label}
            </Link>
          ))}
        </div>

        <p style={{ fontFamily: F, fontSize: 11, color: T.dim, lineHeight: 1.8, textAlign: 'right' }}>
          Invite-only · Underground · Encrypted<br />
          <span style={{ opacity: 0.65 }}>No ads. No feed. No algorithm.</span>
        </p>

      </div>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: BG.deep, color: T.primary, fontFamily: F, overflowX: 'hidden' }}>
      <Nav />
      <Hero />
      <InstallUnddr />
      <WhyDifferent />
      <TheQuietRoom />
      <HowYouGetIn />
      <OnboardingGuide />
      <TrustLayer />
      <FeaturesGrid />
      <WhyItMatters />
      <TheOneRule />
      <WelcomeNotWelcome />
      <FivePrinciples />
      <Moderation />
      <ApplySection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
