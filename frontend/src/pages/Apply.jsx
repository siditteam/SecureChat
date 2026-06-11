import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const F = "'Space Grotesk', sans-serif";
const ACCENT = 'var(--accent)';
const T = {
  primary:   'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  muted:     'rgba(71,85,105,0.65)',
};
const BG = { deep: 'var(--bg-deep)', surface: 'var(--bg-surface)', muted: 'var(--bg-muted)' };
const BORDER = { soft: 'var(--card-border)' };

const INPUT = {
  width: '100%',
  background: 'var(--bg-muted)',
  border: '1px solid var(--card-border)',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: F,
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const LABEL = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: T.muted,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

export default function Apply() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', social: '', platform: 'instagram', why: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/apply`, form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG.deep, fontFamily: F }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(247,251,255,0.92)', backdropFilter: 'blur(16px) saturate(1.5)',
        borderBottom: `1px solid ${BORDER.soft}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <img src="/assets/logo-unddr-teal-icon.svg" alt="Unddr" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 18, color: ACCENT, letterSpacing: '-0.02em' }}>UNDDR</span>
          </Link>
          <Link to="/login" style={{
            fontFamily: F, fontWeight: 700, fontSize: 13,
            background: ACCENT, color: '#fff',
            padding: '10px 20px', borderRadius: 99, textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-strong)'}
            onMouseLeave={e => e.currentTarget.style.background = ACCENT}
          >
            Open Unddr →
          </Link>
        </div>
      </nav>

      {/* Page */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '100px 24px 80px' }}>

        {!done ? (
          <>
            {/* Header */}
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: ACCENT, marginBottom: 16 }}>
              Invite Applications
            </p>
            <h1 style={{ fontFamily: F, fontWeight: 700, fontSize: 'clamp(32px, 6vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: T.primary, marginBottom: 16 }}>
              Apply for<br />
              <span style={{ color: ACCENT }}>access.</span>
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: T.secondary, marginBottom: 10 }}>
              UNDDR is invite-only. If you don't know anyone inside, you can apply here.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T.muted, marginBottom: 40 }}>
              Every application is reviewed personally — not by an algorithm. Your social handle helps us
              confirm you're a real person. Approved applicants receive a private invite link by email.
            </p>

            {/* Form */}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div>
                <label style={LABEL}>Full name</label>
                <input
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your real name"
                  style={INPUT}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                />
              </div>

              <div>
                <label style={LABEL}>Email address</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  style={INPUT}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                />
              </div>

              <div>
                <label style={LABEL}>Phone number</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+1 415 555 1234"
                  style={INPUT}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                />
              </div>

              <div>
                <label style={LABEL}>Social handle</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={form.platform}
                    onChange={set('platform')}
                    style={{ ...INPUT, width: 'auto', flexShrink: 0, paddingRight: 10, cursor: 'pointer', appearance: 'none' }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="twitter">X / Twitter</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    required
                    value={form.social}
                    onChange={set('social')}
                    placeholder="@yourhandle"
                    style={{ ...INPUT, flex: 1 }}
                    onFocus={e => e.target.style.borderColor = ACCENT}
                    onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                  />
                </div>
                <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                  Used to verify you're a real person. We won't follow or message you there.
                </p>
              </div>

              <div>
                <label style={LABEL}>
                  Why do you want to join?{' '}
                  <span style={{ opacity: 0.55, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea
                  value={form.why}
                  onChange={set('why')}
                  placeholder="A sentence or two is enough."
                  rows={3}
                  style={{ ...INPUT, resize: 'vertical', lineHeight: 1.65 }}
                  onFocus={e => e.target.style.borderColor = ACCENT}
                  onBlur={e => e.target.style.borderColor = 'var(--card-border)'}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, color: 'rgba(220,38,38,0.9)',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: ACCENT, color: '#fff',
                  fontFamily: F, fontWeight: 700, fontSize: 15,
                  padding: '14px 0', borderRadius: 12, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s',
                  marginTop: 4,
                }}
              >
                {loading ? 'Submitting…' : 'Submit application →'}
              </button>
            </form>

            <p style={{ fontSize: 12, color: T.muted, marginTop: 24, lineHeight: 1.7, textAlign: 'center' }}>
              Your information is only used to review your application and contact you if approved.
              We do not share it or use it for marketing.
            </p>
          </>
        ) : (
          /* Success state */
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(10,163,163,0.08)', border: '2px solid rgba(10,163,163,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
            }}>
              <svg style={{ width: 28, height: 28, color: ACCENT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', color: T.primary, marginBottom: 14 }}>
              Application received.
            </h2>
            <p style={{ fontSize: 16, color: T.secondary, lineHeight: 1.75, marginBottom: 36 }}>
              We'll review it personally. If accepted, you'll receive a private invite link
              at the email address you provided.
            </p>
            <Link to="/" style={{
              color: ACCENT, fontSize: 14, fontWeight: 600, textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ← Back to unddrground.com
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
