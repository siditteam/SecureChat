import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUnderground } from '../context/UndergroundContext';
import { encryptMessage } from '../utils/crypto';
import MediaCapture from './MediaCapture';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EXPIRY_OPTIONS = [
  { label: 'Never', value: null },
  { label: '5s', value: 5 },
  { label: '30s', value: 30 },
  { label: '5m', value: 300 },
  { label: '1h', value: 3600 },
  { label: '24h', value: 86400 },
];

export default function MessageInput({ recipient, onSend, onSendMedia, replyTo, onClearReply }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { underground } = useUnderground();
  const [text, setText] = useState('');
  const [expiresIn, setExpiresIn] = useState(() => underground ? 86400 : null);
  const [showTimer, setShowTimer] = useState(false);

  // Sync default expiry when underground mode is toggled
  const prevUnderground = useRef(underground);
  useEffect(() => {
    if (underground !== prevUnderground.current) {
      setExpiresIn(underground ? 86400 : null);
      prevUnderground.current = underground;
    }
  }, [underground]);
  const [showCapture, setShowCapture] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const typingRef = useRef(false);
  const typingTimeout = useRef(null);

  const emitTyping = useCallback(() => {
    if (!socket || !recipient || underground) return;
    if (!typingRef.current) {
      socket.emit('typing', { receiverId: recipient._id });
      typingRef.current = true;
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: recipient._id });
      typingRef.current = false;
    }, 2000);
  }, [socket, recipient, underground]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!text.trim() || sending || !recipient) return;
    setError('');
    setSending(true);

    try {
      const privateKey = JSON.parse(localStorage.getItem('privateKey') || 'null');
      if (!privateKey) throw new Error('No private key found. Please log out and log in again.');

      const [recipientRes, senderRes] = await Promise.all([
        recipient.publicKey
          ? Promise.resolve({ data: recipient })
          : axios.get(`${API}/users/${recipient._id}`),
        user.publicKey
          ? Promise.resolve({ data: user })
          : axios.get(`${API}/users/${user._id}`),
      ]);

      const recipientPublicKey = recipientRes.data.publicKey;
      const senderPublicKey = senderRes.data.publicKey;

      if (!recipientPublicKey) throw new Error(`${recipient.username} hasn't set up encryption yet.`);
      if (!senderPublicKey) throw new Error('Your encryption key is missing. Please re-login.');

      const encrypted = await encryptMessage(
        text.trim(),
        JSON.parse(recipientPublicKey),
        JSON.parse(senderPublicKey)
      );

      setText('');
      clearTimeout(typingTimeout.current);
      typingRef.current = false;
      socket?.emit('stop_typing', { receiverId: recipient._id });

      // Build replyTo metadata to pass along
      const replyToMeta = replyTo ? {
        messageId: replyTo.messageId,
        senderUsername: replyTo.senderUsername,
        preview: replyTo.preview,
        isMedia: replyTo.isMedia,
      } : null;

      await onSend(encrypted, expiresIn, replyToMeta);
      if (replyTo) onClearReply?.();
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [text, sending, recipient, user, expiresIn, onSend, socket, replyTo, onClearReply]);

  const handleSendMedia = useCallback(async (file, { viewOnce }) => {
    const formData = new FormData();
    formData.append('media', file);
    const { data } = await axios.post(`${API}/media/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await onSendMedia(data.filename, data.mediaType, viewOnce, expiresIn);
  }, [onSendMedia, expiresIn]);

  const activeExpiry = EXPIRY_OPTIONS.find((o) => o.value === expiresIn);

  return (
    <>
      <div className="px-3 pt-3" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--card-border)', boxShadow: '0 -2px 12px rgba(15,23,36,0.06)', paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        {error && <p className="text-error text-xs mb-2 px-1 font-medium">{error}</p>}

        {/* Reply preview bar */}
        {replyTo && (
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            marginBottom: 8,
            borderRadius: 10,
            overflow: 'hidden',
            background: 'var(--bg-muted)',
            border: '1px solid var(--card-border)',
          }}>
            {/* Accent bar */}
            <div style={{ width: 3, background: 'var(--accent)', flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '7px 10px', minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 1 }}>
                {replyTo.isMine ? 'You' : replyTo.senderUsername}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {replyTo.isMedia ? 'Photo / Video' : replyTo.preview}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearReply}
              style={{ padding: '0 12px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              title="Cancel reply"
            >
              ×
            </button>
          </div>
        )}

        {/* Timer picker */}
        {showTimer && (
          <div className="mb-3 flex items-center gap-2 flex-wrap p-2 rounded-lg" style={{ background: 'var(--bg-muted)', border: '1px solid var(--card-border)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>Disappear after:</span>
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { setExpiresIn(opt.value); setShowTimer(false); }}
                className="px-3 py-1 rounded-full text-xs font-semibold transition duration-150"
                style={expiresIn === opt.value ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Timer toggle */}
          <button
            type="button"
            onClick={() => setShowTimer((s) => !s)}
            title="Set disappear timer"
            className="flex-shrink-0 flex flex-col items-center p-2.5 rounded-full transition duration-150"
            style={expiresIn ? { color: 'var(--accent)', background: 'rgba(59,130,246,0.08)' } : { color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {expiresIn && <span className="text-[8px] font-bold leading-none mt-0.5">{activeExpiry?.label}</span>}
          </button>

          {/* Media / camera button */}
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            title="Send photo or video"
            className="flex-shrink-0 p-2.5 rounded-full transition duration-150"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); emitTyping(); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none transition duration-150"
            style={{
              background: 'var(--bg-muted)',
              border: '1.5px solid var(--card-border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(10,163,163,0.10)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--card-border)'; e.target.style.boxShadow = 'none'; }}
          />

          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex-shrink-0 p-2.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 shadow-md"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {showCapture && (
        <MediaCapture
          onSend={handleSendMedia}
          onClose={() => setShowCapture(false)}
        />
      )}
    </>
  );
}
