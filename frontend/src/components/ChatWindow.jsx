import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { decryptMessage } from '../utils/crypto';
import Message from './Message';
import MessageInput from './MessageInput';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function formatLastSeen(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date);
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <div className={`${sz} bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
        {name[0].toUpperCase()}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-white" />
      )}
    </div>
  );
}

export default function ChatWindow({ selectedUser, onBack }) {
  const { user } = useAuth();
  const { socket } = useSocket();
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
      if (m.mediaUrl) return { ...m, content: null }; // media message — no text to decrypt
      try {
        const isSender = String(m.sender?._id ?? m.sender) === String(user._id);
        const content = await decryptMessage(m, isSender, pk);
        return { ...m, content };
      } catch {
        return { ...m, content: '[Encrypted]' };
      }
    }));
  }, [privateKey, user._id]);

  // Load history when chat partner changes
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

  // Mark messages read whenever this chat is open
  useEffect(() => {
    if (socket && selectedUser) {
      socket.emit('mark_read', { senderId: selectedUser._id });
    }
  }, [socket, selectedUser]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Socket events
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const onNewMessage = async (msg) => {
      const senderId = String(msg.sender?._id ?? msg.sender);
      const receiverId = String(msg.receiver ?? '');
      const myId = String(user._id);
      const peerId = String(selectedUser._id);

      // Only add to this chat window if it belongs here
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
      socket.emit('send_message', { receiverId: selectedUser._id, ...encryptedData, expiresIn },
        async (res) => {
          if (res?.success) {
            const [decrypted] = await decrypt([res.message]);
            setMessages((prev) => [...prev, decrypted]);
          }
          resolve();
        }
      );
    });
  }, [socket, selectedUser, decrypt]);

  const handleSendMedia = useCallback((filename, mediaType, viewOnce, expiresIn) => {
    return new Promise((resolve) => {
      socket.emit('send_message',
        { receiverId: selectedUser._id, mediaUrl: filename, mediaType, viewOnce, expiresIn },
        (res) => {
          if (res?.success) {
            setMessages((prev) => [...prev, { ...res.message, content: null }]);
          }
          resolve();
        }
      );
    });
  }, [socket, selectedUser]);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 text-center gap-4">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-12 h-12 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
        <h3 className="text-gray-800 text-xl font-bold">SecureChat</h3>
        <p className="text-gray-600 text-sm">Select a conversation to start messaging</p>
        <div className="flex items-center gap-2 text-gray-500 text-xs mt-2 bg-success/10 px-3 py-1.5 rounded-full">
          <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
          </svg>
          End-to-end encrypted
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      {/* Header - Modern gradient */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-white border-b border-gray-200 shadow-sm">
        <button
          onClick={onBack}
          className="md:hidden -ml-1 mr-1 hover:bg-white/20 p-1.5 rounded-lg transition duration-150 flex-shrink-0"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar name={selectedUser.username} online={peerOnline} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{selectedUser.username}</p>
          <p className="text-xs opacity-90">
            {typing ? '✍️ typing…' : peerOnline ? '🟢 Online' : peerLastSeen ? `Last seen ${formatLastSeen(peerLastSeen)}` : 'Offline'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-90 ml-auto bg-white/20 px-2 py-1 rounded-full">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
          </svg>
          E2E
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gradient-to-b from-white to-gray-50">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-12">
            <p className="font-medium">No messages yet</p>
            <p className="text-xs mt-1 text-gray-400">Say hello! 👋</p>
          </div>
        )}

        {messages.map((msg) => (
          <Message
            key={msg._id}
            message={msg}
            isMine={String(msg.sender?._id ?? msg.sender) === String(user._id)}
          />
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex justify-start pt-1">
            <div className="bg-gray-200 rounded-3xl rounded-bl-none px-4 py-2.5">
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
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
