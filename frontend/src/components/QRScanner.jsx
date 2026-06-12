import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function QRScanner({ onClose, onAdded }) {
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const [phase, setPhase] = useState('scanning'); // scanning | found | done | error
  const [profile, setProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader-box');
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          // Stop scanning immediately on first decode
          if (isRunningRef.current) {
            isRunningRef.current = false;
            await scanner.stop().catch(() => {});
          }

          // Parse username from invite URL: .../add/<username>
          const match = text.match(/\/add\/([^/?#\s]+)/);
          if (!match) {
            setErr('Not a valid Unddr QR code');
            setPhase('error');
            return;
          }

          try {
            const { data: prof } = await axios.get(
              `${API}/users/by-username/${encodeURIComponent(match[1])}`
            );
            setProfile(prof);
            const { data: st } = await axios
              .get(`${API}/friends/status/${prof._id}`)
              .catch(() => ({ data: { status: 'none' } }));
            setFriendStatus(st.status);
            setPhase('found');
          } catch {
            setErr('User not found');
            setPhase('error');
          }
        },
        () => {} // per-frame decode errors — ignore
      )
      .then(() => { isRunningRef.current = true; })
      .catch(() => {
        setErr('Camera access denied or not available');
        setPhase('error');
      });

    return () => {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  const sendRequest = async () => {
    setLoading(true);
    setErr('');
    try {
      const { data } = await axios.post(`${API}/friends/request/${profile._id}`);
      setFriendStatus(data.status);
      setPhase('done');
      onAdded?.();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#202c33] rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>Scan QR Code</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera view */}
        {phase === 'scanning' && (
          <div className="p-4 flex flex-col items-center gap-3">
            <div id="qr-reader-box" className="w-full rounded-xl overflow-hidden" />
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center' }}>
              Point your camera at a Unddr QR code
            </p>
          </div>
        )}

        {/* User found — confirm add */}
        {phase === 'found' && profile && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-ink-950 text-2xl font-bold shadow-lg">
              {profile.username[0].toUpperCase()}
            </div>

            <div>
              <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>@{profile.username}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>Unddr user</p>
            </div>

            {friendStatus === 'accepted' && (
              <div className="w-full bg-[#00a884]/10 border border-[#00a884]/20 rounded-xl py-2.5 px-4">
                <p className="text-[#00a884] text-sm font-medium">Already friends ✓</p>
              </div>
            )}

            {friendStatus === 'pending' && (
              <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl py-2.5 px-4">
                <p className="text-yellow-400 text-sm font-medium">Request already sent</p>
              </div>
            )}

            {/* Show add button for 'none', 'rejected', null, or any unexpected value */}
            {friendStatus !== 'accepted' && friendStatus !== 'pending' && (
              <button
                onClick={sendRequest}
                disabled={loading}
                className="w-full font-semibold rounded-xl py-3 transition disabled:opacity-50 text-sm"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  : `Add @${profile.username}`}
              </button>
            )}

            {err && <p className="text-red-400 text-sm">{err}</p>}

            <button onClick={onClose} className="text-xs transition" style={{ color: 'var(--text-secondary)' }}>
              Close
            </button>
          </div>
        )}

        {/* Success */}
        {phase === 'done' && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-[#00a884]/20 rounded-full flex items-center justify-center">
              <svg className="w-9 h-9 text-[#00a884]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 700 }} className="text-base">Request sent!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Waiting for @{profile?.username} to accept
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#2a3942] hover:bg-[#3a4a52] font-semibold rounded-xl py-3 transition text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              Done
            </button>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
              <svg className="w-9 h-9 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <p style={{ color: 'var(--text-primary)', fontWeight: 700 }} className="text-base">Scan failed</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{err}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#2a3942] hover:bg-[#3a4a52] font-semibold rounded-xl py-3 transition text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
