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
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/invites/${code}`)
      .then((r) => setInvite(r.data))
      .catch(() => setError('Invite not found or expired.'))
      .finally(() => setLoading(false));
  }, [code]);

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
        <p className="text-white/50 text-lg">Invalid invite</p>
        <p className="text-white/30 text-sm">{error}</p>
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
          <p className="text-white/40 text-sm font-medium">You've been invited to Unddr</p>
        </div>

        <div className="bg-ink-800 border border-white/10 rounded-2xl p-7 shadow-2xl flex flex-col items-center gap-5 text-center">

          {/* Inviter */}
          {invite?.inviter && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-ink-950 text-2xl font-bold ring-4 ring-primary-500/25">
                {invite.inviter.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-bold text-lg">@{invite.inviter.username}</p>
                <p className="text-white/40 text-sm">is inviting you underground</p>
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
              <p className="text-white/40 text-sm">
                Create an account to join <span className="text-white font-semibold">@{invite?.inviter?.username}</span> on Unddr.
              </p>
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
                I already have an account
              </Link>
              <p className="text-white/20 text-xs">Invite-only · End-to-end encrypted · Free</p>
            </div>
          )}

          {!isExpiredOrUsed && user && user.username === invite?.inviter?.username && (
            <div className="w-full">
              <p className="text-white/40 text-sm mb-3">This is your own invite link. Share it with someone you'd like to bring in.</p>
              <button onClick={() => navigate('/')} className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl py-3 transition text-sm">
                Back to chat
              </button>
            </div>
          )}

          {!isExpiredOrUsed && user && user.username !== invite?.inviter?.username && !addDone && (
            <div className="w-full space-y-3">
              <p className="text-white/40 text-sm">You're already on Unddr. Want to add <span className="text-white font-semibold">@{invite?.inviter?.username}</span> as a friend?</p>
              {error && <p className="text-error text-xs">{error}</p>}
              <button
                onClick={addFriend}
                disabled={addLoading}
                className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition text-sm disabled:opacity-50"
              >
                {addLoading ? 'Sending…' : `Add @${invite?.inviter?.username}`}
              </button>
              <button onClick={() => navigate('/')} className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl py-3 transition text-sm">
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
                Open Unddr
              </button>
            </div>
          )}

        </div>

        <p className="text-center mt-5">
          <Link to="/manual" className="text-white/25 text-xs hover:text-white/50 transition underline underline-offset-2">
            Read the Unddr manual
          </Link>
        </p>
      </div>
    </div>
  );
}
