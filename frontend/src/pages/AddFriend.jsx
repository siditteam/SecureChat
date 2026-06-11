import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setShow(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      await deferredPrompt.current.userChoice;
      deferredPrompt.current = null;
      setShow(false);
    }
  };

  if (!show || dismissed) return null;

  return (
    <div className="w-full bg-ink-800 border border-primary-500/30 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <img src="/assets/pngs/logo-unddr-icon-128.png" alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <p className="text-white font-semibold text-sm">Add Unddr to home screen</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/30 hover:text-white/60 flex-shrink-0 mt-0.5 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isIOS ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-white/60 text-xs">
            <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">1</span>
            <span>Tap the <span className="text-white font-semibold">Share</span> button <span className="text-primary-400 font-bold text-sm">⬆</span> at the bottom of Safari</span>
          </div>
          <div className="flex items-center gap-2.5 text-white/60 text-xs">
            <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">2</span>
            <span>Scroll and tap <span className="text-white font-semibold">"Add to Home Screen"</span></span>
          </div>
          <div className="flex items-center gap-2.5 text-white/60 text-xs">
            <span className="w-5 h-5 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold flex-shrink-0 text-[10px]">3</span>
            <span>Tap <span className="text-white font-semibold">"Add"</span> — done!</span>
          </div>
          <p className="text-white/25 text-[10px] pt-1">Requires Safari. The app opens full-screen with no browser bar.</p>
        </div>
      ) : (
        <button
          onClick={install}
          className="w-full bg-primary-500 text-ink-950 font-semibold rounded-xl py-2.5 text-sm transition hover:bg-primary-400 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Install app
        </button>
      )}
    </div>
  );
}

export default function AddFriend() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const autoAdd = new URLSearchParams(location.search).get('auto') === '1';

  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const autoSentRef = useRef(false);

  const invitePath = `/add/${username}`;
  const loginLink  = `/login?redirect=${encodeURIComponent(invitePath + '?auto=1')}`;
  const registerLink = `/register?redirect=${encodeURIComponent(invitePath + '?auto=1')}`;

  useEffect(() => {
    axios
      .get(`${API}/users/by-username/${username}`)
      .then((res) => setProfile(res.data))
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!user || !profile) return;
    if (user._id === profile._id) { setStatus('self'); return; }
    axios
      .get(`${API}/friends/status/${profile._id}`)
      .then((res) => setStatus(res.data.status))
      .catch(() => {});
  }, [user, profile]);

  // Auto-send friend request when arriving from QR/invite flow
  useEffect(() => {
    if (!autoAdd || !user || status !== 'none' || autoSentRef.current) return;
    autoSentRef.current = true;
    setActionLoading(true);
    axios
      .post(`${API}/friends/request/${profile._id}`)
      .then((res) => { setStatus(res.data.status); setDone(true); })
      .catch((err) => setError(err.response?.data?.message || 'Failed to send request.'))
      .finally(() => setActionLoading(false));
  }, [autoAdd, user, status, profile]);

  const sendRequest = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/friends/request/${profile._id}`);
      setStatus(res.data.status);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-800 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/50 text-lg">User not found</p>
        <Link to="/" className="text-primary-400 hover:underline text-sm">Go to Unddr</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/assets/pngs/logo-unddr-icon-128.png" alt="Unddr" className="w-16 h-16 rounded-2xl shadow-xl shadow-black/50 mx-auto mb-1" />
          <p className="text-white/40 text-sm font-medium">Unddr invite</p>
        </div>

        <div className="bg-ink-800 border border-white/10 rounded-2xl p-7 shadow-2xl flex flex-col items-center gap-5 text-center">
          {/* Loading overlay while auto-sending */}
          {actionLoading && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-8 h-8 border-2 border-primary-800 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Sending friend request…</p>
            </div>
          )}

          {!actionLoading && (
            <>
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-ink-950 text-3xl font-bold shadow-lg ring-4 ring-primary-500/30">
                {profile.username[0].toUpperCase()}
              </div>

              <div>
                <h2 className="text-white text-xl font-bold">@{profile.username}</h2>
                <p className="text-white/40 text-sm mt-1">
                  {status === 'self' ? 'Your own invite link' : 'invited you to Unddr'}
                </p>
              </div>

              {error && (
                <p className="text-error text-sm bg-error/10 rounded-xl px-4 py-2 w-full">{error}</p>
              )}

              {/* Not logged in */}
              {!user && (
                <div className="flex flex-col gap-3 w-full">
                  <p className="text-white/40 text-sm">Create an account to connect with <span className="text-white font-semibold">@{profile.username}</span></p>
                  <Link
                    to={registerLink}
                    className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm"
                  >
                    Create account
                  </Link>
                  <Link
                    to={loginLink}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl py-3 transition text-sm"
                  >
                    Sign in
                  </Link>
                  <p className="text-white/20 text-xs">🔒 End-to-end encrypted · Free</p>
                </div>
              )}

              {/* Self */}
              {user && status === 'self' && (
                <div className="w-full">
                  <p className="text-white/40 text-sm mb-3">Share this link with people you want to add</p>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl py-3 transition text-sm"
                  >
                    Go to chat
                  </button>
                </div>
              )}

              {/* Not friends — manual send (only if not auto-add) */}
              {user && status === 'none' && !autoAdd && (
                <button
                  onClick={sendRequest}
                  className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm"
                >
                  Add @{profile.username}
                </button>
              )}

              {/* Pending */}
              {user && (status === 'pending') && !done && (
                <div className="w-full space-y-3">
                  <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl py-2.5 px-4">
                    <p className="text-primary-400 text-sm font-medium">Friend request already pending</p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl py-3 transition text-sm"
                  >
                    Open Unddr
                  </button>
                </div>
              )}

              {/* Success (just sent) */}
              {user && done && (
                <div className="w-full space-y-3">
                  <div className="bg-success/10 border border-success/20 rounded-xl py-3 px-4">
                    <p className="text-success font-semibold text-sm">
                      {status === 'accepted'
                        ? `You and @${profile.username} are now friends!`
                        : `Friend request sent to @${profile.username}`}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm"
                  >
                    Open Unddr
                  </button>
                </div>
              )}

              {/* Already friends */}
              {user && status === 'accepted' && !done && (
                <div className="w-full space-y-3">
                  <div className="bg-success/10 border border-success/20 rounded-xl py-2.5 px-4">
                    <p className="text-success text-sm font-medium">Already friends ✓</p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm"
                  >
                    Open chat
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-4">
          <InstallBanner />
        </div>
      </div>
    </div>
  );
}
