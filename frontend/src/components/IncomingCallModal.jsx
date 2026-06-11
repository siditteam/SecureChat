import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function PulsingRing() {
  return (
    <>
      <span className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" />
      <span className="absolute inset-0 rounded-full bg-primary-500/10 animate-ping [animation-delay:0.4s]" />
    </>
  );
}

function VideoIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

export default function IncomingCallModal() {
  const { callState, callType, remoteUser, acceptCall, rejectCall } = useCall();

  // Ringtone via Web Audio API
  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);

  useEffect(() => {
    if (callState !== 'incoming') return;

    const playRing = () => {
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;

        // Two-tone phone ring
        [[480, 0], [620, 0.08], [480, 0.16], [620, 0.24]].forEach(([freq, delay]) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          const t = ctx.currentTime + delay;
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
          gain.gain.setValueAtTime(0.18, t + 0.06);
          gain.gain.linearRampToValueAtTime(0, t + 0.08);
          osc.start(t);
          osc.stop(t + 0.09);
        });
      } catch {}
    };

    playRing();
    ringIntervalRef.current = setInterval(playRing, 2000);

    return () => {
      clearInterval(ringIntervalRef.current);
      try { audioCtxRef.current?.close(); } catch {}
      audioCtxRef.current = null;
    };
  }, [callState]);

  if (callState !== 'incoming' || !remoteUser) return null;

  const avatarUrl = remoteUser.avatar ? `${API}/users/avatar/${remoteUser.avatar}` : null;
  const isVideo   = callType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-6 px-10 py-10 bg-white/[0.06] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 max-w-xs w-full mx-4">

        {/* Call type label */}
        <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
          {isVideo ? <VideoIcon /> : <PhoneIcon />}
          <span>Incoming {isVideo ? 'Video' : 'Audio'} Call</span>
        </div>

        {/* Avatar with pulsing ring */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-28 h-28">
            <PulsingRing />
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="relative w-28 h-28 rounded-full object-cover ring-4 ring-primary-500/40 z-10" />
            ) : (
              <div className="relative w-28 h-28 bg-primary-500 rounded-full flex items-center justify-center text-ink-950 text-4xl font-bold ring-4 ring-primary-500/40 z-10 shadow-xl">
                {remoteUser.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <p className="text-white text-2xl font-bold">{remoteUser.username}</p>
          <p className="text-white/50 text-sm mt-1">wants to {isVideo ? 'video' : 'voice'} call you</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-10 mt-2">
          {/* Reject */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-red-900/40 transition"
            >
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              </svg>
            </button>
            <span className="text-white/50 text-xs">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 active:scale-95 rounded-full flex items-center justify-center shadow-lg shadow-green-900/40 transition animate-bounce"
            >
              {isVideo ? (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              )}
            </button>
            <span className="text-white/50 text-xs">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
