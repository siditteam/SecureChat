import { useEffect, useRef, useState } from 'react';
import { useCall } from '../context/CallContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function SoundWave() {
  return (
    <div className="flex items-center gap-1">
      {[0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2, 0.1].map((delay, i) => (
        <div
          key={i}
          className="w-1 bg-primary-400 rounded-full animate-bounce"
          style={{ height: `${12 + (i % 4) * 6}px`, animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}

// Control button used in the call toolbar
function CtrlBtn({ onClick, active, danger, title, children }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        title={title}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95 ${
          danger
            ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-900/50'
            : active
              ? 'bg-white/20 hover:bg-white/30'
              : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        {children}
      </button>
      <span className="text-white/40 text-[10px] font-medium">{title}</span>
    </div>
  );
}

export default function ActiveCallOverlay() {
  const {
    callState, callType, remoteUser,
    localStream, remoteStream,
    isMuted, isCameraOff, callDuration, callError,
    endCall, toggleMute, toggleCamera,
  } = useCall();

  const remoteVideoRef = useRef(null);
  const localVideoRef  = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef   = useRef(null);

  // Auto-hide controls in video calls after 4 s of no interaction
  useEffect(() => {
    if (callType !== 'video' || callState !== 'active') return;
    const reset = () => {
      setShowControls(true);
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
    };
    reset();
    window.addEventListener('mousemove', reset);
    window.addEventListener('touchstart', reset);
    return () => {
      clearTimeout(hideTimerRef.current);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('touchstart', reset);
    };
  }, [callType, callState]);

  // Bind remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Bind local stream to local preview
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (callState === 'idle' || callState === 'incoming') return null;

  const isOutgoing = callState === 'outgoing';
  const isActive   = callState === 'active';
  const isVideo    = callType === 'video';
  const avatarUrl  = remoteUser?.avatar ? `${API}/users/avatar/${remoteUser.avatar}` : null;

  // ── Outgoing/active audio call ─────────────────────────────────────────────
  if (!isVideo) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-ink-900 via-ink-800 to-ink-900 py-16 px-8">

        {/* Status */}
        <div className="text-center">
          <p className="text-white/50 text-sm font-medium uppercase tracking-widest">
            {isOutgoing ? 'Calling…' : 'On Call'}
          </p>
          {isActive && <p className="text-primary-400 text-sm mt-1 font-mono">{formatDuration(callDuration)}</p>}
          {callError && <p className="text-red-400 text-sm mt-2">{callError}</p>}
        </div>

        {/* Avatar + animation */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {isOutgoing && (
              <>
                <span className="absolute inset-0 rounded-full bg-primary-500/15 animate-ping [animation-duration:1.5s]" />
                <span className="absolute inset-0 rounded-full bg-primary-500/10 animate-ping [animation-duration:1.5s] [animation-delay:0.5s]" />
              </>
            )}
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="relative w-32 h-32 rounded-full object-cover ring-4 ring-primary-500/30 z-10 shadow-2xl" />
            ) : (
              <div className="relative w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-700 rounded-full flex items-center justify-center text-white text-5xl font-bold ring-4 ring-primary-500/30 z-10 shadow-2xl">
                {remoteUser?.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-white text-2xl font-bold">{remoteUser?.username}</p>
            {isActive && (
              <div className="mt-3 flex justify-center">
                <SoundWave />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-8">
          <CtrlBtn onClick={toggleMute} active={isMuted} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </CtrlBtn>

          <CtrlBtn onClick={endCall} danger title="End">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
            </svg>
          </CtrlBtn>

          {/* Placeholder button for layout balance */}
          <div className="w-14 h-14" />
        </div>
      </div>
    );
  }

  // ── Video call ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={() => setShowControls(s => !s)}
    >
      {/* Remote video (full screen) */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // No remote stream yet (outgoing or connecting)
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-ink-900 via-ink-800 to-ink-900 gap-6">
          {isOutgoing && (
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-primary-500/15 animate-ping [animation-duration:1.5s]" />
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="relative w-28 h-28 rounded-full object-cover ring-4 ring-primary-500/30 z-10" />
              ) : (
                <div className="relative w-28 h-28 bg-gradient-to-br from-primary-400 to-primary-700 rounded-full flex items-center justify-center text-white text-4xl font-bold ring-4 ring-primary-500/30 z-10">
                  {remoteUser?.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          )}
          <p className="text-white text-xl font-semibold">{remoteUser?.username}</p>
          <p className="text-white/50 text-sm">
            {isOutgoing ? 'Calling…' : 'Connecting…'}
          </p>
        </div>
      )}

      {/* Local video PiP */}
      <div className="absolute top-4 right-4 z-20 w-28 h-40 md:w-36 md:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-ink-900">
        {localStream && !isCameraOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-ink-800">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {/* current user initial — provided by auth context indirectly */}
              {isCameraOff ? (
                <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Top overlay: name + timer */}
      <div className={`absolute top-0 left-0 right-0 z-10 px-5 pt-5 pb-8 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <p className="text-white font-bold text-lg">{remoteUser?.username}</p>
        {isActive && <p className="text-primary-300 text-sm font-mono mt-0.5">{formatDuration(callDuration)}</p>}
        {callError && <p className="text-red-400 text-sm mt-1">{callError}</p>}
      </div>

      {/* Bottom controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-10 px-8 pt-8 pb-10 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center gap-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <CtrlBtn onClick={toggleMute} active={isMuted} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </CtrlBtn>

        <CtrlBtn onClick={toggleCamera} active={isCameraOff} title={isCameraOff ? 'Camera On' : 'Camera Off'}>
          {isCameraOff ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zM1 1l22 22" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
            </svg>
          )}
        </CtrlBtn>

        <CtrlBtn onClick={endCall} danger title="End">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
          </svg>
        </CtrlBtn>
      </div>
    </div>
  );
}
