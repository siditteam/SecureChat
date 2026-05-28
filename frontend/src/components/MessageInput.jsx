import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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

export default function MessageInput({ recipient, onSend, onSendMedia }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [text, setText] = useState('');
  const [expiresIn, setExpiresIn] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [showCapture, setShowCapture] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const typingRef = useRef(false);
  const typingTimeout = useRef(null);

  const emitTyping = useCallback(() => {
    if (!socket || !recipient) return;
    if (!typingRef.current) {
      socket.emit('typing', { receiverId: recipient._id });
      typingRef.current = true;
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: recipient._id });
      typingRef.current = false;
    }, 2000);
  }, [socket, recipient]);

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

      await onSend(encrypted, expiresIn);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [text, sending, recipient, user, expiresIn, onSend, socket]);

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
      <div className="px-3 py-3 bg-ink-800/90 backdrop-blur-xl border-t border-white/10 shadow-lg">
        {error && <p className="text-error text-xs mb-2 px-1 font-medium">{error}</p>}

        {/* Timer picker */}
        {showTimer && (
          <div className="mb-3 flex items-center gap-2 flex-wrap p-2 bg-white/[0.05] rounded-lg border border-white/10">
            <span className="text-white/50 text-xs font-medium">Disappear after:</span>
            {EXPIRY_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { setExpiresIn(opt.value); setShowTimer(false); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition duration-150 ${
                  expiresIn === opt.value
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                    : 'bg-white/10 text-white/60 border border-white/10 hover:bg-white/20'
                }`}
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
            className={`flex-shrink-0 flex flex-col items-center p-2.5 rounded-full transition duration-150 ${
              expiresIn
                ? 'text-primary-400 bg-primary-500/20'
                : 'text-white/40 hover:bg-white/10'
            }`}
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
            className="flex-shrink-0 p-2.5 rounded-full text-white/40 hover:text-primary-400 hover:bg-primary-500/20 transition duration-150"
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
            className="flex-1 bg-white/10 text-white rounded-full px-4 py-2.5 text-sm outline-none placeholder-white/30 border border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition duration-150"
          />

          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="flex-shrink-0 p-2.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full text-white disabled:opacity-40 disabled:cursor-not-allowed hover:from-primary-600 hover:to-primary-700 transition duration-150 shadow-md shadow-primary-900/50 hover:shadow-lg"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
