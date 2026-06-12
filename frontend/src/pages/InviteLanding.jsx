import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function InviteLanding() {
  const { code } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addDone, setAddDone] = useState(false);
  const [vouchLoading, setVouchLoading] = useState(false);
  const [vouchDone, setVouchDone] = useState(false);
  const [vouchError, setVouchError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/invites/${code}`)
      .then((r) => setInvite(r.data))
      .catch(() => setError('Invite not found or expired.'))
      .finally(() => setLoading(false));
  }, [code]);

  const vouch = async () => {
    if (!user) return navigate(`/login?redirect=/invite/${encodeURIComponent(code)}`);
    setVouchLoading(true);
    setVouchError('');
    try {
      const res = await axios.post(`${API}/invites/${code}/vouch`);
      setInvite((prev) => ({ ...prev, vouchedBy: res.data.vouchedBy }));
      setVouchDone(true);
    } catch (e) {
      setVouchError(e.response?.data?.message || 'Failed to vouch.');
    } finally {
      setVouchLoading(false);
    }
  };

  const addFriend = async () => {
    if (!invite?.inviter) return;
    setAddLoading(true);
    try {
      const byUsername = await axios.get(`${API}/users/by-username/${invite.inviter.username}`);
      await axios.post(`${API}/friends/request/${byUsername.data._id}`);
      setAddDone(true);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send request.');
    } finally {
      setAddLoading(false);
    }
  };

  const registerLink = `/register?invite=${encodeURIComponent(code)}&redirect=/`;
  const loginLink   = `/login?redirect=${encodeURIComponent(`/invite/${code}`)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-800 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Invalid invite</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <Link to="/" className="text-primary-400 hover:underline text-sm">Go to Unddr</Link>
      </div>
    );
  }

  const isExpiredOrUsed = invite?.status === 'expired' || invite?.status === 'used';

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <img src="/assets/pngs/logo-unddr-icon-128.png" alt="Unddr" className="w-16 h-16 rounded-2xl shadow-xl shadow-black/50 mx-auto mb-3" />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>You've been invited to Unddr</p>
        </div>

        <div className="bg-ink-800 border border-white/10 rounded-2xl p-7 shadow-2xl flex flex-col items-center gap-5 text-center">

          {/* Inviter */}
          {invite?.inviter && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-ink-950 text-2xl font-bold ring-4 ring-primary-500/25">
                {invite.inviter.username[0].toUpperCase()}
              </div>
              <div>
                <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>@{invite.inviter.username}</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>is inviting you underground</p>
              </div>
            </div>
          )}

          {isExpiredOrUsed && (
            <div className="w-full bg-error/10 border border-error/20 rounded-xl py-2.5 px-4">
              <p className="text-error text-sm font-medium">
                {invite?.status === 'used' ? 'This invite has already been used.' : 'This invite has expired.'}
              </p>
            </div>
          )}

          {!isExpiredOrUsed && !user && (
            <div className="flex flex-col gap-3 w-full">
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Create an account to join <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>@{invite?.inviter?.username}</span> on Unddr.
              </p>
              <Link
                to={registerLink}
                className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm"
              >
                Create account
              </Link>
              <Link
                to={loginLink}
                className="w-full bg-white/10 hover:bg-white/15 font-semibold rounded-xl py-3 transition text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                I already have an account
              </Link>
              <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Invite-only Â· End-to-end encrypted Â· Free</p>
            </div>
          )}

          {!isExpiredOrUsed && user && user.username === invite?.inviter?.username && (
            <div className="w-full">
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>This is your own invite link. Share it with someone you'd like to bring in.</p>
              <button onClick={() => navigate('/')} className="w-full bg-white/10 hover:bg-white/15 font-semibold rounded-xl py-3 transition text-sm" style={{ color: 'var(--text-primary)' }}>
                Back to chat
              </button>
            </div>
          )}

          {!isExpiredOrUsed && user && user.username !== invite?.inviter?.username && !addDone && (
            <div className="w-full space-y-3">
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>You're already on Unddr. Want to add <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>@{invite?.inviter?.username}</span> as a friend?</p>
              {error && <p className="text-error text-xs">{error}</p>}
              <button
                onClick={addFriend}
                disabled={addLoading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm disabled:opacity-50"
              >
                {addLoading ? 'Sendingâ€¦' : `Add @${invite?.inviter?.username}`}
              </button>
              {/* Vouch action */}
              {invite && !invite.vouchedBy && (
                <button
                  onClick={vouch}
                  disabled={vouchLoading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm disabled:opacity-50"
                >
                  {vouchLoading ? 'Vouchingâ€¦' : 'Vouch for this person'}
                </button>
              )}
              {invite && invite.vouchedBy && (
                <div className="w-full bg-amber-50 border border-amber-100 rounded-xl py-3 px-4">
                  <p style={{ color: 'var(--accent)', fontSize: 14 }}>Vouched by @{invite.vouchedBy.username}</p>
                </div>
              )}
              {vouchError && <p className="text-error text-xs">{vouchError}</p>}
              <button onClick={() => navigate('/')} className="w-full bg-white/10 hover:bg-white/15 font-semibold rounded-xl py-3 transition text-sm" style={{ color: 'var(--text-primary)' }}>
                Skip
              </button>
            </div>
          )}

          {addDone && (
            <div className="w-full space-y-3">
              <div className="bg-success/10 border border-success/20 rounded-xl py-3 px-4">
                <p className="text-success font-semibold text-sm">Friend request sent!</p>
              </div>
              <button onClick={() => navigate('/')} className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm">
                Open UNDDR
              </button>
            </div>
          )}

        </div>

        <p className="text-center mt-5">
          <Link to="/manual" className="text-xs transition underline underline-offset-2" style={{ color: 'var(--text-secondary)' }}>
            Read the Unddr manual
          </Link>
        </p>
      </div>
    </div>
  );
}
