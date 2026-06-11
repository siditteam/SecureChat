import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const VIEW_ONCE_SECONDS = 10;

export default function MediaViewer({ message, isMine, onClose, onViewed }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Fetch media via authenticated axios (global auth header set in AuthContext)
  useEffect(() => {
    let objectUrl = null;

    axios.get(`${API}/media/${message.mediaUrl}`, { responseType: 'blob' })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
        setLoading(false);

        // Receiver-only: mark viewed + start countdown for view-once
        if (!isMine) {
          axios.post(`${API}/media/${message.mediaUrl}/viewed`).then(() => onViewed?.()).catch(() => {});
          if (message.viewOnce) setCountdown(VIEW_ONCE_SECONDS);
        }
      })
      .catch(() => { setUnavailable(true); setLoading(false); });

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // View-once countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => {
      if (c <= 1) { onClose(); return 0; }
      return c - 1;
    }), 1000);
    return () => clearTimeout(t);
  }, [countdown, onClose]);

  // Escape to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col select-none" onClick={handleBackdrop}>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
        <button
          className="pointer-events-auto text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1.5">
            <span className="text-white text-xs font-medium">
              {message.viewOnce
                ? 'Secure media · view once'
                : message.mediaType === 'image'
                  ? 'Secure image'
                  : 'Secure video'}
            </span>
          </div>
          {message.viewOnce && (
            <div className="flex items-center gap-1.5 bg-black/50 rounded-full px-3 py-1.5">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              <span className="text-white text-xs font-medium">View once</span>
            </div>
          )}
          {countdown !== null && (
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition ${
              countdown <= 3 ? 'border-red-400 text-red-400' : 'border-white/60 text-white'
            }`}>
              {countdown}
            </div>
          )}
        </div>

        <div className="w-9" />
      </div>

      {/* Media content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {loading && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            <p className="text-white/50 text-sm">Loading…</p>
          </div>
        )}

        {unavailable && (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </div>
            <p className="text-white/60 text-sm">Media no longer available</p>
          </div>
        )}

        {src && message.mediaType === 'video' && (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {src && message.mediaType === 'image' && (
          <img
            src={src}
            alt="Media"
            className="max-w-full max-h-full rounded-lg object-contain"
            draggable={false}
          />
        )}
      </div>

      {/* View-once countdown bar */}
      {countdown !== null && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div
            className={`h-full transition-all duration-1000 ${countdown <= 3 ? 'bg-red-400' : 'bg-white'}`}
            style={{ width: `${(countdown / VIEW_ONCE_SECONDS) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
