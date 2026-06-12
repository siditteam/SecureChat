import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../context/AuthContext';
import OtpInput from '../components/OtpInput';

const RESEND_SECONDS = 30;
const SAVED_PHONE_KEY = 'unddr:saved_phone';

function Steps({ current, labels }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
      {labels.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              background: i < current ? '#16A34A' : i === current ? 'var(--accent)' : 'rgba(15,23,36,0.07)',
              color: '#fff',
              opacity: i > current ? 0.4 : 1,
              boxShadow: i === current ? '0 0 0 4px rgba(10,163,163,0.14)' : 'none',
              transition: 'all 0.2s',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: i === current ? 'var(--text-primary)' : 'var(--text-secondary)',
              opacity: i === current ? 1 : 0.55,
            }}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && <div style={{ width: 28, height: 1, background: 'var(--card-border)' }} />}
        </div>
      ))}
    </div>
  );
}

const CARD = {
  background: 'var(--bg-surface)',
  borderRadius: 24,
  padding: '32px',
  border: '1px solid var(--card-border)',
  boxShadow: '0 4px 40px rgba(15,23,36,0.08)',
};

const primaryBtn = (disabled) => ({
  width: '100%', background: 'var(--accent)', color: '#fff',
  fontWeight: 700, borderRadius: 12, padding: '13px 0',
  border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 15, opacity: disabled ? 0.5 : 1, transition: 'opacity 0.2s',
});

const Spinner = () => (
  <span style={{
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
    borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite',
  }} />
);

export default function Login() {
  const { sendOtp, verifyOtp, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';
  const alreadyRegistered = location.state?.alreadyRegistered;
  const prefilledPhone = location.state?.phone || '';

  const [savedPhone] = useState(() => {
    try { return localStorage.getItem(SAVED_PHONE_KEY) || ''; } catch { return ''; }
  });
  const [showPhoneInput, setShowPhoneInput] = useState(!savedPhone || !!prefilledPhone);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState(prefilledPhone || savedPhone);
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(0);
  const [otpReset, setOtpReset] = useState(0);

  useEffect(() => {
    if (resend <= 0) return;
    const t = setTimeout(() => setResend((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resend]);

  const doSendOtp = useCallback(async () => {
    if (!phone || !isValidPhoneNumber(phone)) { setError('Enter a valid phone number.'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await sendOtp(phone);
      setDevOtp(data.devOtp || null);
      setResend(RESEND_SECONDS);
      setOtpReset((n) => n + 1);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code.');
    } finally { setLoading(false); }
  }, [phone, sendOtp]);

  const doVerify = useCallback(async (otp) => {
    setError('');
    setLoading(true);
    try {
      const { verifiedToken: token, isRegistered } = await verifyOtp(phone, otp);
      if (!isRegistered) {
        setError('No account found for this number. Please register first.');
        setLoading(false);
        return;
      }
      await login(phone, token);
      try { localStorage.setItem(SAVED_PHONE_KEY, phone); } catch {}
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
      setLoading(false);
    }
  }, [phone, verifyOtp, login, navigate, redirectTo]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, var(--bg-deep) 0%, var(--bg-muted) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, marginBottom: 12,
            background: 'rgba(10,163,163,0.08)', border: '1.5px solid rgba(10,163,163,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(10,163,163,0.10)',
          }}>
            <span style={{ fontWeight: 800, fontSize: 28, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>U</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Sign in with your phone number</p>
        </div>

        <div style={CARD}>
          <Steps current={step} labels={['Phone', 'Verify']} />

          {alreadyRegistered && !error && (
            <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#166534', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>✓</span>
              <span>This number is already registered — sign in below.</span>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#991b1b', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {step === 0 && !showPhoneInput && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'var(--bg-muted)', border: '1px solid var(--card-border)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(10,163,163,0.10)', border: '1px solid rgba(10,163,163,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>U</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Remembered device</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{savedPhone}</p>
                </div>
              </div>
              <button onClick={doSendOtp} disabled={loading} style={primaryBtn(loading)}>
                {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner /> Sending…</span> : 'Continue →'}
              </button>
              <button
                onClick={() => { setShowPhoneInput(true); setPhone(''); try { localStorage.removeItem(SAVED_PHONE_KEY); } catch {} }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, padding: '4px 0', textAlign: 'center' }}
              >
                Not you? Sign in differently
              </button>
            </div>
          )}

          {step === 0 && showPhoneInput && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Phone number</label>
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={phone}
                  onChange={setPhone}
                  className="phone-input-light"
                  disabled={loading}
                />
                <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6, opacity: 0.65 }}>Include country code (e.g. +1 for US)</p>
              </div>
              <button onClick={doSendOtp} disabled={loading || !phone} style={primaryBtn(loading || !phone)}>
                {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner /> Sending…</span> : 'Send verification code'}
              </button>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 6px' }}>
                  Code sent to <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong>
                </p>
                <button
                  onClick={() => { setStep(0); setError(''); setDevOtp(null); }}
                  style={{ color: 'var(--accent)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  Change number
                </button>
              </div>

              {devOtp && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                  <p style={{ color: '#92400e', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>🧪 DEV MODE — No SMS sent</p>
                  <p style={{ color: '#92400e', fontFamily: 'monospace', fontSize: 28, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>{devOtp}</p>
                </div>
              )}

              <OtpInput onComplete={doVerify} disabled={loading} reset={otpReset} />

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ width: 20, height: 20, border: '2.5px solid var(--card-border)', borderTopColor: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                {resend > 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                    Resend in <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{resend}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={doSendOtp}
                    disabled={loading}
                    style={{ color: 'var(--accent)', fontSize: 13, background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.5 : 1, padding: 0 }}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}

          <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', marginTop: 24, marginBottom: 0 }}>
            No account?{' '}
            <Link
              to={redirectTo !== '/' ? `/register?redirect=${encodeURIComponent(redirectTo)}` : '/register'}
              style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}
            >
              Create one
            </Link>
          </p>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', marginTop: 24, opacity: 0.5 }}>
          🔒 End-to-end encrypted · Your security is our priority
        </p>
      </div>
    </div>
  );
}
