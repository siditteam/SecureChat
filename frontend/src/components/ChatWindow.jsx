import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import { useUnderground } from '../context/UndergroundContext';
import { decryptMessage } from '../utils/crypto';
import Message from './Message';
import MessageInput from './MessageInput';
import VouchedBadge from './VouchedBadge';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatLastSeen(date) {
  if (!date) return '';
  const d = new Date(date);
  const diff = Date.now() - d;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return time;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`;
}

function Avatar({ name, online, size = 'md' }) {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-yellow-600',
    'from-indigo-400 to-indigo-600',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const sz = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center font-bold shadow-md`} style={{ color: 'var(--text-on-accent, #fff)' }}>
        {name[0].toUpperCase()}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full" style={{ border: '2px solid var(--bg-surface)' }} />
      )}
    </div>
  );
}

export default function ChatWindow({ selectedUser, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, sendMessage, pendingCount } = useSocket();
  const { initiateCall, callState } = useCall();
  const { underground } = useUnderground();
  const canCall = callState === 'idle';
  // VIDEO_CALLS is disabled in MVP — set VITE_ENABLE_VIDEO=true to re-enable
  const videoEnabled = import.meta.env.VITE_ENABLE_VIDEO === 'true';
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerLastSeen, setPeerLastSeen] = useState(null);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const typingTimer = useRef(null);

  const privateKey = useCallback(() =>
    JSON.parse(localStorage.getItem('privateKey') || 'null'), []);

  const decrypt = useCallback(async (msgs) => {
    const pk = privateKey();
    if (!pk) return msgs.map((m) => ({ ...m, content: m.mediaUrl ? null : '[No private key]' }));
    return Promise.all(msgs.map(async (m) => {
      if (m.mediaUrl) return { ...m, content: null };
      try {
        const isSender = String(m.sender?._id ?? m.sender) === String(user._id);
        const content = await decryptMessage(m, isSender, pk);
        return { ...m, content };
      } catch {
        return { ...m, content: '[Encrypted]' };
      }
    }));
  }, [privateKey, user._id]);

  useEffect(() => {
    if (!selectedUser) return;
    setMessages([]);
    setPeerOnline(selectedUser.isOnline ?? false);
    setPeerLastSeen(selectedUser.lastSeen ?? null);
    setLoading(true);

    axios.get(`${API}/messages/${selectedUser._id}`)
      .then(async (res) => {
        const decrypted = await decrypt(res.data);
        setMessages(decrypted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedUser?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (socket && selectedUser) {
      socket.emit('mark_read', { senderId: selectedUser._id });
    }
  }, [socket, selectedUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const onNewMessage = async (msg) => {
      const senderId = String(msg.sender?._id ?? msg.sender);
      const receiverId = String(msg.receiver ?? '');
      const myId = String(user._id);
      const peerId = String(selectedUser._id);

      if (!((senderId === peerId && receiverId === myId) || (senderId === myId && receiverId === peerId))) return;

      const [decrypted] = await decrypt([msg]);
      setMessages((prev) => [...prev, decrypted]);
      socket.emit('mark_read', { senderId: selectedUser._id });
    };

    const onDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => m._id === messageId ? { ...m, deliveryStatus: 'delivered' } : m)
      );
    };

    const onRead = ({ by }) => {
      if (by !== String(selectedUser._id)) return;
      setMessages((prev) => prev.map((m) => ({ ...m, deliveryStatus: 'read' })));
    };

    const onStatus = ({ userId, isOnline, lastSeen }) => {
      if (userId !== String(selectedUser._id)) return;
      setPeerOnline(isOnline);
      if (lastSeen) setPeerLastSeen(lastSeen);
    };

    const onTyping = ({ userId }) => {
      if (userId !== String(selectedUser._id)) return;
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3000);
    };

    const onStopTyping = ({ userId }) => {
      if (userId !== String(selectedUser._id)) return;
      setTyping(false);
    };

    socket.on('new_message', onNewMessage);
    socket.on('message_delivered', onDelivered);
    socket.on('messages_read', onRead);
    socket.on('user_status', onStatus);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('message_delivered', onDelivered);
      socket.off('messages_read', onRead);
      socket.off('user_status', onStatus);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
    };
  }, [socket, selectedUser, decrypt, user._id]);

  const handleSend = useCallback((encryptedData, expiresIn) => {
    return new Promise((resolve) => {
      sendMessage({ receiverId: selectedUser._id, ...encryptedData, expiresIn },
        async (res) => {
          if (res?.success) {
            const [decrypted] = await decrypt([res.message]);
            setMessages((prev) => [...prev, decrypted]);
          }
          resolve();
        }
      );
    });
  }, [sendMessage, selectedUser, decrypt]);

  const handleSendMedia = useCallback((filename, mediaType, viewOnce, expiresIn) => {
    return new Promise((resolve) => {
      sendMessage(
        { receiverId: selectedUser._id, mediaUrl: filename, mediaType, viewOnce, expiresIn },
        (res) => {
          if (res?.success) {
            setMessages((prev) => [...prev, { ...res.message, content: null }]);
          }
          resolve();
        }
      );
    });
  }, [sendMessage, selectedUser]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-6" style={{ background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-muted))', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: 'clamp(48px,12vw,80px)', fontWeight: 800, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em', lineHeight: 1 }}>UNDDR</span>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Select a conversation to start messaging</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontSize: 12, background: 'rgba(22,163,74,0.06)', padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(22,163,74,0.12)' }}>
          <svg style={{ width: 16, height: 16, color: 'var(--success)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
          </svg>
          <span style={{ color: 'var(--text-secondary)' }}>End-to-end encrypted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-surface)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--card-border)', color: 'var(--text-primary)', paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}>
        <button
          onClick={onBack}
          className="md:hidden -ml-1 mr-1 hover:bg-white/20 p-1.5 rounded-lg transition duration-150 flex-shrink-0"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar name={selectedUser.username} online={underground ? false : peerOnline} size="sm" />
        <div className="flex-1 min-w-0">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{selectedUser.username}</p>
            {selectedUser.vouchedBy && (
              <VouchedBadge vouchedBy={selectedUser.vouchedBy} size="xs" />
            )}
          </div>
          <p style={{ fontSize: 12, opacity: 0.85, color: 'var(--text-secondary)', marginTop: 1 }}>
            {underground
              ? <span style={{ opacity: 0.4, letterSpacing: '0.06em' }}>presence hidden</span>
              : typing ? '✍️ typing…'
              : peerOnline ? '🟢 Online'
              : peerLastSeen ? `Last seen ${formatLastSeen(peerLastSeen)}`
              : 'Offline'}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => initiateCall(selectedUser, 'audio')}
            disabled={!canCall}
            title="Audio call"
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          {/* VIDEO_CALLS: hidden in MVP (VITE_ENABLE_VIDEO=true to show) */}
          {videoEnabled && (
            <button
              onClick={() => initiateCall(selectedUser, 'video')}
              disabled={!canCall}
              title="Video call"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </button>
          )}
          {!connected && (
            <div
              title={pendingCount > 0 ? `${pendingCount} message${pendingCount === 1 ? '' : 's'} queued — will send when reconnected` : 'Connecting…'}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginLeft: 4, padding: '5px 9px', borderRadius: 999, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', cursor: 'default' }}
            >
              <span style={{ color: '#92400e', fontWeight: 600 }}>
                {pendingCount > 0 ? `⏳ ${pendingCount} queued` : '⏳ Offline'}
              </span>
            </div>
          )}
          <div
            title="Messages are end-to-end encrypted. Only you and the recipient can read them."
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginLeft: 4, padding: '5px 9px', borderRadius: 999, background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.15)', cursor: 'default' }}
          >
            <svg style={{ width: 13, height: 13, color: '#16a34a', flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
            </svg>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>Encrypted</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-muted))' }}>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-primary-700 border-t-primary-400 rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-sm py-12" style={{ color: 'var(--text-secondary)' }}>
            <p className="font-medium">No messages yet</p>
            <p className="text-xs mt-1" style={{ opacity: 0.6 }}>Say hello! 👋</p>
          </div>
        )}

        {!loading && messages.some(m => m.content === '[Encrypted]' || m.content === '[No private key]') && (
          <div className="mx-2 mb-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.18)' }}>
            <div className="flex items-start gap-3">
              <svg style={{ width: 15, height: 15, color: 'rgba(161,128,0,0.8)', flexShrink: 0, marginTop: 2 }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
              </svg>
              <p style={{ fontSize: 12, color: 'rgba(120,90,0,0.85)', lineHeight: 1.6, margin: 0 }}>
                Some messages are locked — they were encrypted with a different session key.
              </p>
            </div>
            <button
              onClick={() => navigate('/settings', { state: { section: 'security' } })}
              style={{ marginTop: 10, marginLeft: 26, fontSize: 12, fontWeight: 700, color: 'rgba(120,90,0,0.9)', background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'inline-block' }}
            >
              Restore my key →
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <Message
            key={msg._id}
            message={msg}
            isMine={String(msg.sender?._id ?? msg.sender) === String(user._id)}
          />
        ))}

        {typing && (
          <div className="flex justify-start pt-1">
            <div style={{ background: 'rgba(15,23,36,0.06)', backdropFilter: 'blur(6px)', borderRadius: 999, padding: '8px 14px', border: '1px solid rgba(15,23,36,0.06)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    style={{ width: 8, height: 8, background: 'rgba(15,23,36,0.18)', borderRadius: 999, display: 'inline-block', animation: `bounce 900ms infinite`, animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <MessageInput recipient={selectedUser} onSend={handleSend} onSendMedia={handleSendMedia} />
    </div>
  );
}
