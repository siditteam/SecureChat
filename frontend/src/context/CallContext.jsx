import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext(null);

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export function CallProvider({ children }) {
  const { socket } = useSocket();
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [callState, setCallState]     = useState('idle'); // idle | outgoing | incoming | active
  const [callType, setCallType]       = useState(null);   // 'audio' | 'video'
  const [remoteUser, setRemoteUser]   = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted]         = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError]     = useState('');

  // ── Refs (stable across renders, not reactive) ─────────────────────────────
  const pcRef            = useRef(null);   // RTCPeerConnection
  const localStreamRef   = useRef(null);   // for track cleanup
  const pendingIce       = useRef([]);     // ICE candidates before remoteDesc set
  const callStateRef     = useRef('idle'); // read inside socket handlers (no stale closure)
  const remoteUserRef    = useRef(null);   // for endCall without stale closure
  const callTimerRef     = useRef(null);
  const incomingDataRef  = useRef(null);   // { offer, fromUserId, callType }

  // Keep refs in sync
  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { remoteUserRef.current = remoteUser; }, [remoteUser]);

  // ── Call timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'active') {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
      if (callState !== 'active') setCallDuration(0);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.ontrack           = null;
      pcRef.current.onicecandidate    = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    pendingIce.current   = [];
    incomingDataRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallError('');
    setRemoteUser(null);
    setCallType(null);
    setCallState('idle');
  }, []);

  // ── Get media ───────────────────────────────────────────────────────────────
  const getLocalMedia = useCallback(async (type) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ── Drain buffered ICE candidates ───────────────────────────────────────────
  const drainIce = useCallback(async () => {
    if (!pcRef.current) return;
    for (const c of pendingIce.current) {
      try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingIce.current = [];
  }, []);

  // ── Build RTCPeerConnection ─────────────────────────────────────────────────
  const buildPC = useCallback((targetId) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socket) {
        socket.emit('ice_candidate', { targetUserId: targetId, candidate: candidate.toJSON() });
      }
    };

    pc.ontrack = ({ streams }) => {
      if (streams[0]) setRemoteStream(streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, cleanup]);

  // ── Initiate outgoing call ──────────────────────────────────────────────────
  const initiateCall = useCallback(async (targetUser, type = 'audio') => {
    if (!socket || callStateRef.current !== 'idle') return;

    setCallError('');
    setRemoteUser(targetUser);
    setCallType(type);
    setCallState('outgoing');

    try {
      const stream = await getLocalMedia(type);
      const pc     = buildPC(targetUser._id);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call_offer', {
        targetUserId: targetUser._id,
        offer:       { type: offer.type, sdp: offer.sdp },
        callType:    type,
        callerInfo:  { _id: user._id, username: user.username, avatar: user.avatar ?? null },
      });
    } catch (err) {
      setCallError(err.name === 'NotAllowedError' ? 'Camera/microphone access denied.' : 'Failed to start call.');
      cleanup();
    }
  }, [socket, getLocalMedia, buildPC, user, cleanup]);

  // ── Accept incoming call ────────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!socket || callStateRef.current !== 'incoming' || !incomingDataRef.current) return;

    const { offer, fromUserId, callType: type } = incomingDataRef.current;
    setCallError('');

    try {
      const stream = await getLocalMedia(type);
      const pc     = buildPC(fromUserId);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await drainIce();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call_answer', {
        targetUserId: fromUserId,
        answer:       { type: answer.type, sdp: answer.sdp },
      });

      setCallState('active');
    } catch (err) {
      setCallError(err.name === 'NotAllowedError' ? 'Camera/microphone access denied.' : 'Failed to answer call.');
      socket.emit('call_reject', { targetUserId: fromUserId });
      cleanup();
    }
  }, [socket, getLocalMedia, buildPC, drainIce, cleanup]);

  // ── Reject incoming call ────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (!socket || !incomingDataRef.current) return;
    socket.emit('call_reject', { targetUserId: incomingDataRef.current.fromUserId });
    cleanup();
  }, [socket, cleanup]);

  // ── End call (works for outgoing, active) ───────────────────────────────────
  const endCall = useCallback(() => {
    const target = remoteUserRef.current;
    if (socket && target) socket.emit('call_end', { targetUserId: target._id });
    cleanup();
  }, [socket, cleanup]);

  // ── Toggle mute ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  }, []);

  // ── Toggle camera ───────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(c => !c);
  }, []);

  // ── Socket event listeners (single registration, uses refs to avoid stale closures) ──
  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = ({ fromUserId, offer, callType: type, callerInfo }) => {
      if (callStateRef.current !== 'idle') {
        // Already busy — auto-reject
        socket.emit('call_reject', { targetUserId: fromUserId });
        return;
      }
      incomingDataRef.current = { offer, fromUserId, callType: type };
      setRemoteUser(callerInfo);
      setCallType(type);
      setCallState('incoming');
    };

    const onCallAnswered = async ({ answer }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        await drainIce();
        setCallState('active');
      } catch {
        cleanup();
      }
    };

    const onCallRejected = ({ reason }) => {
      setCallError(reason === 'offline' ? 'User is offline.' : reason === 'rejected' ? 'Call was declined.' : '');
      // Brief delay so user sees the message
      setTimeout(cleanup, 1500);
    };

    const onCallEnded = () => cleanup();

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current?.remoteDescription?.type) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      } else {
        pendingIce.current.push(candidate);
      }
    };

    socket.on('incoming_call',  onIncomingCall);
    socket.on('call_answered',  onCallAnswered);
    socket.on('call_rejected',  onCallRejected);
    socket.on('call_ended',     onCallEnded);
    socket.on('ice_candidate',  onIceCandidate);

    return () => {
      socket.off('incoming_call',  onIncomingCall);
      socket.off('call_answered',  onCallAnswered);
      socket.off('call_rejected',  onCallRejected);
      socket.off('call_ended',     onCallEnded);
      socket.off('ice_candidate',  onIceCandidate);
    };
  }, [socket, drainIce, cleanup]); // callState intentionally NOT here — use callStateRef

  const value = {
    callState, callType, remoteUser,
    localStream, remoteStream,
    isMuted, isCameraOff, callDuration, callError,
    initiateCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleCamera,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => useContext(CallContext);
