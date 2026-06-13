import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import { useUnderground } from '../context/UndergroundContext';
import { useToast } from '../context/ToastContext';
import { decryptMessage } from '../utils/crypto';
import Message from './Message';
import MessageInput from './MessageInput';
import MessageActionSheet from './MessageActionSheet';
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

// ── Pinned message banner ─────────────────────────────────────────────────────

function PinnedBanner({ pinnedMessage, onScrollTo, onUnpin }) {
  if (!pinnedMessage) return null;

  const preview = pinnedMessage.mediaUrl
    ? (pinnedMessage.mediaType === 'video' ? 'Video' : 'Photo')
    : (pinnedMessage.content?.slice(0, 60) || '');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: 'var(--bg-muted)',
        borderBottom: '1px solid var(--card-border)',
        cursor: 'pointer',
      }}
      onClick={onScrollTo}
    >
      {/* Pin icon */}
      <svg width="14" height="14" fill="none" stroke="var(--accent)" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      <p style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: 4 }}>Pinned:</span>
        {preview}
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); onUnpin(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 6, flexShrink: 0 }}
      >
        Unpin
      </button>
    </div>
  );
}

// ── Forward friend picker modal ───────────────────────────────────────────────

function ForwardModal({ message, currentUser, socket, onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(null);

  useEffect(() => {
    axios.get(`${API}/friends`)
      .then((r) => setFriends(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleForward = useCallback(async (friend) => {
    if (!socket || !message.content) return;

    // For forwarding we send plain text. Since the recipient needs to decrypt it
    // with their key, we need to encrypt it properly. For simplicity we use the
    // socket send_message flow with the recipient's public key.
    // We'll re-encrypt the plain text content for the new recipient.
    try {
      const { encryptMessage } = await import('../utils/crypto');
      const [recipientRes, senderRes] = await Promise.all([
        friend.publicKey
          ? Promise.resolve({ data: friend })
          : axios.get(`${API}/users/${friend._id}`),
        currentUser.publicKey
          ? Promise.resolve({ data: currentUser })
          : axios.get(`${API}/users/${currentUser._id}`),
      ]);

      const privateKey = JSON.parse(localStorage.getItem('privateKey') || 'null');
      if (!privateKey) { alert('No private key found.'); return; }

      const encrypted = await encryptMessage(
        message.content,
        JSON.parse(recipientRes.data.publicKey),
        JSON.parse(senderRes.data.publicKey)
      );

      socket.emit('send_message', { receiverId: friend._id, ...encrypted }, (res) => {
        if (res?.success) setSent(friend.username);
      });
    } catch (err) {
      console.error('forward error:', err);
    }
  }, [message, socket, currentUser]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onPointerDown={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 420,
        background: 'var(--bg-surface)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        animation: 'sheetUp 220ms cubic-bezier(0.32,0.72,0,1) forwards',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--card-border)' }} />
        </div>
        <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid var(--card-border)' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Forward to…</h3>
          {sent && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--success)' }}>Forwarded to {sent}</p>}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>Loading friends…</div>
          )}
          {!loading && friends.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 13 }}>No friends yet.</div>
          )}
          {friends.map((f) => (
            <button
              key={f._id}
              onClick={() => handleForward(f)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                borderBottom: '1px solid var(--card-border)',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
              }}>
                {f.username[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{f.username}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: '8px 12px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'block', width: '100%', padding: 13, borderRadius: 14, border: 'none',
              background: 'var(--bg-muted)', cursor: 'pointer', color: 'var(--text-primary)',
              fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ChatWindow ────────────────────────────────────────────────────────────────

export default function ChatWindow({ selectedUser, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected, sendMessage, pendingCount } = useSocket();
  const { initiateCall, callState } = useCall();
  const { underground } = useUnderground();
  const toast = useToast();
  const canCall = callState === 'idle';
  const videoEnabled = import.meta.env.VITE_ENABLE_VIDEO === 'true';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerLastSeen, setPeerLastSeen] = useState(null);
  const [typing, setTyping] = useState(false);

  // Action system state
  const [actionMessage, setActionMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const endRef = useRef(null);
  const typingTimer = useRef(null);
  const msgRefs = useRef({}); // { [msgId]: DOM element }

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

  // Load messages + pinned message when conversation changes
  useEffect(() => {
    if (!selectedUser) return;
    setMessages([]);
    setPinnedMessage(null);
    setPeerOnline(selectedUser.isOnline ?? false);
    setPeerLastSeen(selectedUser.lastSeen ?? null);
    setLoading(true);

    Promise.all([
      axios.get(`${API}/messages/${selectedUser._id}`),
      axios.get(`${API}/messages/pinned/${selectedUser._id}`).catch(() => ({ data: null })),
    ])
      .then(async ([msgRes, pinnedRes]) => {
        const decrypted = await decrypt(msgRes.data);
        setMessages(decrypted);
        setPinnedMessage(pinnedRes.data || null);
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

  // Clear messages locally when the sidebar fires the clear event
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.userId === selectedUser?._id) setMessages([]);
    };
    window.addEventListener('unddr:clear_messages', handler);
    return () => window.removeEventListener('unddr:clear_messages', handler);
  }, [selectedUser?._id]);

  // Socket listeners (existing + new action events)
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

    // ── New action socket events ──────────────────────────────────────────

    const onMessageDeleted = ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setPinnedMessage((prev) => (prev?._id === messageId ? null : prev));
    };

    const onMessagePinned = ({ message: pinnedMsg }) => {
      // Only update if the pinned message belongs to this conversation
      const senderId = String(pinnedMsg.sender?._id ?? pinnedMsg.sender);
      const receiverId = String(pinnedMsg.receiver ?? '');
      const myId = String(user._id);
      const peerId = String(selectedUser._id);
      if ((senderId === peerId && receiverId === myId) || (senderId === myId && receiverId === peerId)) {
        setPinnedMessage(pinnedMsg);
      }
    };

    const onMessageUnpinned = ({ messageId }) => {
      setPinnedMessage((prev) => (prev?._id === messageId ? null : prev));
    };

    socket.on('new_message', onNewMessage);
    socket.on('message_delivered', onDelivered);
    socket.on('messages_read', onRead);
    socket.on('user_status', onStatus);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);
    socket.on('message_deleted', onMessageDeleted);
    socket.on('message_pinned', onMessagePinned);
    socket.on('message_unpinned', onMessageUnpinned);

    return () => {
      socket.off('new_message', onNewMessage);
      socket.off('message_delivered', onDelivered);
      socket.off('messages_read', onRead);
      socket.off('user_status', onStatus);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
      socket.off('message_deleted', onMessageDeleted);
      socket.off('message_pinned', onMessagePinned);
      socket.off('message_unpinned', onMessageUnpinned);
    };
  }, [socket, selectedUser, decrypt, user._id]);

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleAction = useCallback((msg) => {
    setActionMessage(msg);
  }, []);

  const handleReply = useCallback((msg) => {
    const isMsgMine = String(msg.sender?._id ?? msg.sender) === String(user._id);
    setReplyTo({
      messageId: msg._id,
      senderUsername: msg.sender?.username || 'them',
      preview: msg.content?.slice(0, 100) || '',
      isMedia: !!msg.mediaUrl,
      isMine: isMsgMine,
    });
    setActionMessage(null);
  }, [user._id]);

  const handleCopy = useCallback((msg) => {
    if (!msg.content) return;
    navigator.clipboard.writeText(msg.content).then(() => {
      toast?.show('Copied', { type: 'info' });
    }).catch(() => {
      // Fallback for older browsers / insecure context
      try {
        const ta = document.createElement('textarea');
        ta.value = msg.content;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast?.show('Copied', { type: 'info' });
      } catch { /* ignore */ }
    });
    setActionMessage(null);
  }, [toast]);

  const handleForward = useCallback((msg) => {
    setForwardMsg(msg);
    setActionMessage(null);
  }, []);

  const handlePin = useCallback(async (msg, shouldPin) => {
    try {
      if (shouldPin) {
        const { data } = await axios.put(`${API}/messages/${msg._id}/pin`);
        setPinnedMessage(data);
      } else {
        await axios.delete(`${API}/messages/${msg._id}/pin`);
        setPinnedMessage((prev) => (prev?._id === msg._id ? null : prev));
      }
    } catch (err) {
      console.error('pin error:', err);
    }
    setActionMessage(null);
  }, []);

  const handleDelete = useCallback(async (msg, forEveryone) => {
    try {
      await axios.delete(`${API}/messages/${msg._id}`, { data: { forEveryone } });
      if (forEveryone) {
        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      }
      setPinnedMessage((prev) => (prev?._id === msg._id ? null : prev));
    } catch (err) {
      console.error('delete error:', err);
    }
    setActionMessage(null);
  }, []);

  const handleScrollToPinned = useCallback(() => {
    if (!pinnedMessage) return;
    const el = msgRefs.current[pinnedMessage._id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [pinnedMessage]);

  const handleUnpinFromBanner = useCallback(async () => {
    if (!pinnedMessage) return;
    await handlePin(pinnedMessage, false);
  }, [pinnedMessage, handlePin]);

  // ── Send handlers ─────────────────────────────────────────────────────────

  const handleSend = useCallback((encryptedData, expiresIn, replyToMeta) => {
    return new Promise((resolve) => {
      sendMessage(
        {
          receiverId: selectedUser._id,
          ...encryptedData,
          expiresIn,
          ...(replyToMeta && { replyTo: replyToMeta }),
        },
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

  // ── isPinned helper ───────────────────────────────────────────────────────

  const isPinned = useCallback((msg) => {
    return pinnedMessage?._id === msg._id;
  }, [pinnedMessage]);

  // ── Empty state ───────────────────────────────────────────────────────────

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

      {/* Pinned message banner */}
      <PinnedBanner
        pinnedMessage={pinnedMessage}
        onScrollTo={handleScrollToPinned}
        onUnpin={handleUnpinFromBanner}
      />

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
          <div
            key={msg._id}
            ref={(el) => { if (el) msgRefs.current[msg._id] = el; else delete msgRefs.current[msg._id]; }}
          >
            <Message
              message={msg}
              isMine={String(msg.sender?._id ?? msg.sender) === String(user._id)}
              onAction={handleAction}
              onReply={handleReply}
              onCopy={handleCopy}
            />
          </div>
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

      <MessageInput
        recipient={selectedUser}
        onSend={handleSend}
        onSendMedia={handleSendMedia}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />

      {/* Action sheet */}
      {actionMessage && (
        <MessageActionSheet
          message={actionMessage}
          isMine={String(actionMessage.sender?._id ?? actionMessage.sender) === String(user._id)}
          isPinned={isPinned(actionMessage)}
          onReply={() => handleReply(actionMessage)}
          onCopy={() => handleCopy(actionMessage)}
          onForward={() => handleForward(actionMessage)}
          onPin={(shouldPin) => handlePin(actionMessage, shouldPin)}
          onDelete={(forEveryone) => handleDelete(actionMessage, forEveryone)}
          onClose={() => setActionMessage(null)}
        />
      )}

      {/* Forward modal */}
      {forwardMsg && (
        <ForwardModal
          message={forwardMsg}
          currentUser={user}
          socket={socket}
          onClose={() => setForwardMsg(null)}
        />
      )}
    </div>
  );
}
