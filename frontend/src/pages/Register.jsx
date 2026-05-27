import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../context/AuthContext';
import OtpInput from '../components/OtpInput';

const RESEND_SECONDS = 30;

function Steps({ current }) {
  const labels = ['Phone', 'Verify', 'Username'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current ? 'bg-gradient-to-r from-success to-success text-white' :
              i === current ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white ring-4 ring-primary-200' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-semibold ${i === current ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
          </div>
          {i < labels.length - 1 && <div className="w-6 h-px bg-gray-300 flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// Username rules
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
function usernameHint(v) {
  if (!v) return null;
  if (v.length < 3) return 'At least 3 characters';
  if (v.length > 20) return 'Max 20 characters';
  if (!USERNAME_RE.test(v)) return 'Letters, numbers and underscores only';
  return null;
}

export default function Register() {
  const { sendOtp, verifyOtp, register, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);  // 0=phone 1=otp 2=username
  const [phone, setPhone] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [verifiedToken, setVerifiedToken] = useState(null);
  const [username, setUsername] = useState('');
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
    if (!phone || !isValidPhoneNumber(phone)) {
      setError('Enter a valid phone number.');
      return;
    }
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
    } finally {
      setLoading(false);
    }
  }, [phone, sendOtp]);

  const doVerify = useCallback(async (otp) => {
    setError('');
    setLoading(true);
    try {
      const { verifiedToken: token, isRegistered } = await verifyOtp(phone, otp);

      if (isRegistered) {
        // Phone already has an account — just log them in
        await login(phone, token);
        navigate('/', { replace: true });
        return;
      }

      setVerifiedToken(token);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }, [phone, verifyOtp, login, navigate]);

  const doRegister = useCallback(async (e) => {
    e.preventDefault();
    const hint = usernameHint(username);
    if (hint) { setError(hint); return; }
    setError('');
    setLoading(true);
    try {
      await register(phone, verifiedToken, username.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }, [phone, verifiedToken, username, register, navigate]);

  const hint = usernameHint(username);
  const usernameOk = username && !hint;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full mb-4 shadow-xl">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-600 text-sm mt-2">Verify your phone to get started</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-200">
          <Steps current={step} />

          {error && (
            <div className="bg-error/10 border border-error/30 text-error rounded-xl p-3 mb-5 text-sm flex gap-2 items-start">
              <span className="mt-0.5 font-bold flex-shrink-0">⚠</span>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* ── Step 0: Phone ── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2.5">Phone number</label>
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={phone}
                  onChange={setPhone}
                  className="phone-input-dark"
                  disabled={loading}
                />
                <p className="text-gray-500 text-xs mt-2">Include country code (e.g. +91 for India)</p>
              </div>
              <button
                onClick={doSendOtp}
                disabled={loading || !phone}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl py-3 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : 'Send verification code'}
              </button>
            </div>
          )}

          {/* ── Step 1: OTP ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Code sent to <span className="text-gray-900 font-semibold">{phone}</span>
                </p>
                <button
                  onClick={() => { setStep(0); setError(''); setDevOtp(null); }}
                  className="text-primary-600 text-xs mt-2 hover:underline font-medium"
                >
                  Change number
                </button>
              </div>

              {devOtp && (
                <div className="bg-warning/15 border border-warning/30 rounded-xl px-4 py-3 text-center">
                  <p className="text-warning font-semibold text-xs mb-2">🧪 DEV MODE — No SMS sent</p>
                  <p className="text-warning text-3xl font-mono font-bold tracking-[0.2em]">{devOtp}</p>
                </div>
              )}

              <OtpInput onComplete={doVerify} disabled={loading} reset={otpReset} />

              {loading && (
                <div className="flex justify-center">
                  <span className="w-5 h-5 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              )}

              <div className="text-center">
                {resend > 0 ? (
                  <p className="text-gray-600 text-sm">Resend in <span className="text-gray-900 font-semibold tabular-nums">{resend}s</span></p>
                ) : (
                  <button
                    onClick={doSendOtp}
                    disabled={loading}
                    className="text-primary-600 text-sm hover:underline disabled:opacity-50 font-medium"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Username ── */}
          {step === 2 && (
            <form onSubmit={doRegister} className="space-y-5">
              <div className="text-center mb-3 p-3 bg-success/10 rounded-lg border border-success/30">
                <p className="text-success font-semibold text-sm">✓ Phone verified</p>
                <p className="text-gray-700 text-sm font-medium mt-1">{phone}</p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2.5">Choose a username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-sm font-semibold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    maxLength={20}
                    autoFocus
                    className={`w-full bg-gray-100 text-gray-900 rounded-xl pl-8 pr-10 py-3 text-sm outline-none border-2 transition placeholder-gray-500 ${
                      username
                        ? usernameOk ? 'border-success bg-success/5' : 'border-error/50 bg-error/5'
                        : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                    }`}
                    placeholder="yourname"
                  />
                  {usernameOk && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-success text-lg">✓</span>
                  )}
                </div>
                {hint && username && (
                  <p className="text-error text-xs mt-2 font-medium">{hint}</p>
                )}
                {!hint && !username && (
                  <p className="text-gray-600 text-xs mt-2">3–20 chars • letters, numbers, underscores</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !usernameOk}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl py-3 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : 'Create account'}
              </button>
            </form>
          )}

          <p className="text-gray-600 text-sm text-center mt-6">
            Have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-gray-600 text-xs text-center mt-6">
          🔐 Your private key never leaves this device • 🔒 End-to-end encrypted
        </p>
      </div>
    </div>
  );
}
