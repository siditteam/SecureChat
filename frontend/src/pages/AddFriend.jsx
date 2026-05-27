import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AddFriend() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);   // 'none' | 'pending' | 'accepted'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load the profile (public endpoint)
  useEffect(() => {
    axios
      .get(`${API}/users/by-username/${username}`)
      .then((res) => setProfile(res.data))
      .catch(() => setError('User not found.'))
      .finally(() => setLoading(false));
  }, [username]);

  // Load friendship status (only if logged in)
  useEffect(() => {
    if (!user || !profile) return;
    if (user._id === profile._id) { setStatus('self'); return; }

    axios
      .get(`${API}/friends/status/${profile._id}`)
      .then((res) => setStatus(res.data.status))
      .catch(() => {});
  }, [user, profile]);

  const sendRequest = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/friends/request/${profile._id}`);
      setStatus(res.data.status);
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b141a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#0b141a] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[#8696a0] text-lg">User not found</p>
        <Link to="/" className="text-[#00a884] hover:underline text-sm">Go to SecureChat</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b141a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* App logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#00a884] rounded-full mb-3">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <p className="text-[#8696a0] text-sm">SecureChat invite</p>
        </div>

        <div className="bg-[#202c33] rounded-2xl p-7 shadow-2xl flex flex-col items-center gap-6 text-center">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#3c5a6b] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {profile.username[0].toUpperCase()}
          </div>

          <div>
            <h2 className="text-white text-xl font-bold">@{profile.username}</h2>
            <p className="text-[#8696a0] text-sm mt-1">wants to connect on SecureChat</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 rounded-xl px-4 py-2 w-full">{error}</p>
          )}
          {message && (
            <p className="text-[#00a884] text-sm bg-[#00a884]/10 rounded-xl px-4 py-2 w-full">{message}</p>
          )}

          {/* Not logged in */}
          {!user && (
            <div className="flex flex-col gap-3 w-full">
              <p className="text-[#8696a0] text-sm">Sign in to send a friend request</p>
              <Link
                to={`/login?redirect=/add/${username}`}
                className="w-full bg-[#00a884] hover:bg-[#02b397] text-white font-semibold rounded-xl py-3 transition text-sm"
              >
                Sign in
              </Link>
              <Link
                to={`/register?redirect=/add/${username}`}
                className="w-full bg-[#2a3942] hover:bg-[#3a4a52] text-white font-semibold rounded-xl py-3 transition text-sm"
              >
                Create account
              </Link>
            </div>
          )}

          {/* Self */}
          {user && status === 'self' && (
            <div className="w-full">
              <p className="text-[#8696a0] text-sm mb-3">This is your own invite link</p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-[#2a3942] hover:bg-[#3a4a52] text-white font-semibold rounded-xl py-3 transition text-sm"
              >
                Go to chat
              </button>
            </div>
          )}

          {/* Not friends */}
          {user && status === 'none' && (
            <button
              onClick={sendRequest}
              disabled={actionLoading}
              className="w-full bg-[#00a884] hover:bg-[#02b397] text-white font-semibold rounded-xl py-3 transition disabled:opacity-50 text-sm"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending…
                </span>
              ) : 'Send friend request'}
            </button>
          )}

          {/* Pending */}
          {user && status === 'pending' && (
            <div className="w-full space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2.5 px-4">
                <p className="text-yellow-400 text-sm font-medium">Friend request pending</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-[#2a3942] hover:bg-[#3a4a52] text-white font-semibold rounded-xl py-3 transition text-sm"
              >
                Go to SecureChat
              </button>
            </div>
          )}

          {/* Already friends */}
          {user && status === 'accepted' && (
            <div className="w-full space-y-3">
              <div className="bg-[#00a884]/10 border border-[#00a884]/20 rounded-xl py-2.5 px-4">
                <p className="text-[#00a884] text-sm font-medium">Already friends ✓</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-[#00a884] hover:bg-[#02b397] text-white font-semibold rounded-xl py-3 transition text-sm"
              >
                Open chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
