import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useUnderground } from '../context/UndergroundContext';
import QRModal from './QRModal';
import QRScanner from './QRScanner';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AVATAR_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Avatar({ name, online, size = 'md', avatarFile = null, hidePresence = false }) {
  const sz = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-11 h-11 text-base';
  const colors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-yellow-600',
    'from-indigo-400 to-indigo-600',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className="relative flex-shrink-0">
      {avatarFile
        ? <img
            src={`${AVATAR_API}/users/avatar/${avatarFile}`}
            alt=""
            className={`${sz} rounded-full object-cover shadow-md`}
          />
        : <div className={`${sz} bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center font-bold shadow-md`} style={{ color: 'var(--text-on-accent, #fff)' }}>
            {name[0].toUpperCase()}
          </div>
      }
      {online && !hidePresence && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full shadow-sm" style={{ border: '2px solid var(--bg-surface)' }} />
      )}
    </div>
  );
}

function formatSeen(date) {
  if (!date) return '';
  const d = new Date(date);
  const diff = Date.now() - d;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return time;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

function TabButton({ label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex-1 py-2.5 text-sm font-semibold transition duration-200 rounded-lg"
      style={{
        background: active ? 'var(--accent)' : 'transparent',
        color: active ? '#fff' : 'var(--text-secondary)',
      }}
    >
      {label}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-accent-500 to-accent-600 text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg" style={{ color: 'var(--text-on-accent, #fff)' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

function FriendRow({ u, online, lastSeen, action, onAction, onMessage, isSelected, onSelect, onRemove, onBlock, onViewProfile, onReport }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { underground } = useUnderground();

  return (
    <div
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg mx-1 transition duration-150"
      style={{
        background: isSelected ? 'rgba(10,163,163,0.08)' : 'transparent',
        borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
      }}
    >
      <button type="button" className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={onSelect}>
        <Avatar name={u.username} online={online} avatarFile={u.avatar} hidePresence={underground} />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
            {underground
              ? <span style={{ opacity: 0.4 }}>●</span>
              : online
                ? <span><span style={{ color: '#10b981' }}>●</span> Online</span>
                : lastSeen ? `Last seen ${formatSeen(lastSeen)}` : ''
            }
          </p>
        </div>
      </button>

      <div className="flex-shrink-0 flex items-center gap-1.5">
        {/* Inline accept/decline for incoming requests */}
        {action === 'incoming' && (
          <>
            <button
              type="button"
              onClick={() => onAction?.('accept')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-success/20 text-success hover:bg-success/30 rounded-lg text-xs font-semibold transition"
              title="Accept"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Accept
            </button>
            <button
              type="button"
              onClick={() => onAction?.('reject')}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition"
              title="Decline"
              style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}

        {/* Withdraw button for sent requests */}
        {action === 'pending' && (
          <button
            type="button"
            onClick={() => onAction?.()}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
            title="Withdraw request"
            style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            Withdraw
          </button>
        )}

        {/* Add friend button */}
        {action === 'add' && (
          <button
            type="button"
            onClick={() => onAction?.()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
            title="Send friend request"
          >
            Add
          </button>
        )}

        {/* Message icon (friends only) */}
        {action === 'message' && onMessage && (
          <button
            type="button"
            onClick={onMessage}
            className="text-primary-500 hover:bg-primary-500/20 p-1.5 rounded-lg transition duration-150"
            title="Message"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </button>
        )}

        {/* 3-dot menu — only for accepted friends */}
        {action === 'message' && (
          <>
            <button
              type="button"
              onClick={() => setMenuOpen((s) => !s)}
              className="p-2.5 rounded-xl focus:outline-none"
              title="More options"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute top-full mt-2 right-3 left-3 sm:left-auto sm:right-3 w-auto sm:w-40 max-w-[calc(100%-1.5rem)] rounded-lg shadow-lg z-50" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)' }}>
                <button onClick={() => { setMenuOpen(false); onViewProfile?.(); }} className="w-full text-left px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>View profile</button>
                {onRemove && <button onClick={() => { setMenuOpen(false); onRemove?.(u._id); }} className="w-full text-left px-3 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>Remove</button>}
                {onBlock && <button onClick={() => { setMenuOpen(false); onBlock?.(u._id); }} className="w-full text-left px-3 py-2 text-sm text-error">Block</button>}
                {onReport && <button onClick={() => { setMenuOpen(false); onReport?.(u); }} className="w-full text-left px-3 py-2 text-sm text-warning">Report</button>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ selectedUser, onSelectUser, initialChatUserId, onInitialChatHandled }) {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const { underground, toggleUnderground } = useUnderground();
  const navigate = useNavigate();

  const brandPressTimer = useRef(null);
  const handleBrandPointerDown = () => {
    brandPressTimer.current = setTimeout(toggleUnderground, 800);
  };
  const handleBrandPointerUp = () => clearTimeout(brandPressTimer.current);

  const [tab, setTab] = useState('chats');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('hostile');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const [recentChats, setRecentChats] = useState([]);
  const [chatSearch, setChatSearch] = useState('');

  const [friends, setFriends] = useState([]);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatuses, setSearchStatuses] = useState({});

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);

  const [statusMap, setStatusMap] = useState({});

  const loadFriends = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/friends`);
      setFriends(res.data);
    } catch { /* ignore */ }
  }, []);

  const loadIncoming = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/friends/requests/incoming`);
      setIncoming(res.data);
    } catch { /* ignore */ }
  }, []);

  const loadOutgoing = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/friends/requests/outgoing`);
      setOutgoing(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadFriends(); loadIncoming(); }, [loadFriends, loadIncoming]);
  useEffect(() => { if (tab === 'requests') loadOutgoing(); }, [tab, loadOutgoing]);

  // Deep link from push notification: auto-open chat with the sender
  useEffect(() => {
    if (!initialChatUserId || friends.length === 0) return;
    const match = friends.find((f) => f._id === initialChatUserId);
    if (match) {
      onSelectUser(match);
      onInitialChatHandled?.();
    }
  }, [initialChatUserId, friends]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitReport = async () => {
    if (!reportTarget) return;
    setReportLoading(true);
    try {
      await axios.post(`${API}/reports/${reportTarget._id}`, { reason: reportReason, description: reportDesc });
      setReportDone(true);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReportLoading(false);
    }
  };

  const closeReport = () => { setReportTarget(null); setReportReason('hostile'); setReportDesc(''); setReportDone(false); };

  useEffect(() => {
    if (!socket) return;

    const onStatus = ({ userId, isOnline, lastSeen }) => {
      setStatusMap((m) => ({ ...m, [userId]: { isOnline, lastSeen } }));
      setFriends((fs) => fs.map((f) => f._id === userId ? { ...f, isOnline, lastSeen } : f));
      setRecentChats((rs) => rs.map((r) => r._id === userId ? { ...r, isOnline, lastSeen } : r));
    };

    const onNewRequest = (req) => {
      setIncoming((prev) => {
        if (prev.find((r) => r._id === req._id)) return prev;
        return [req, ...prev];
      });
    };

    const onAccepted = ({ by }) => {
      setOutgoing((prev) => prev.filter((r) => r.receiver?._id !== by._id && r.receiver !== by._id));
      loadFriends();
      setSearchStatuses((m) => ({ ...m, [by._id]: { status: 'accepted' } }));
    };

    socket.on('user_status', onStatus);
    socket.on('new_friend_request', onNewRequest);
    socket.on('friend_request_accepted', onAccepted);

    return () => {
      socket.off('user_status', onStatus);
      socket.off('new_friend_request', onNewRequest);
      socket.off('friend_request_accepted', onAccepted);
    };
  }, [socket, loadFriends]);

  useEffect(() => {
    if (!peopleSearch.trim()) { setSearchResults([]); return; }

    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/users/search?q=${encodeURIComponent(peopleSearch.trim())}`);
        setSearchResults(res.data);

        const statuses = await Promise.all(
          res.data.map((u) =>
            axios.get(`${API}/friends/status/${u._id}`)
              .then((r) => ({ id: u._id, ...r.data }))
              .catch(() => ({ id: u._id, status: 'none' }))
          )
        );
        const map = {};
        statuses.forEach(({ id, ...s }) => { map[id] = s; });
        setSearchStatuses((prev) => ({ ...prev, ...map }));
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [peopleSearch]);

  const sendRequest = useCallback(async (userId) => {
    try {
      const res = await axios.post(`${API}/friends/request/${userId}`);
      setSearchStatuses((m) => ({
        ...m,
        [userId]: {
          status: res.data.status,
          requestId: res.data.requestId,
          isSender: res.data.isSender ?? true,
        },
      }));
      if (res.data.status === 'accepted') loadFriends();
    } catch (err) {
      console.error('Friend request failed', err);
    }
  }, [loadFriends]);

  const acceptRequest = useCallback(async (requestId, senderId) => {
    try {
      await axios.put(`${API}/friends/accept/${requestId}`);
      setIncoming((prev) => prev.filter((r) => r._id !== requestId));
      setSearchStatuses((m) => ({ ...m, [senderId]: { status: 'accepted' } }));
      loadFriends();
    } catch { /* ignore */ }
  }, [loadFriends]);

  const rejectRequest = useCallback(async (requestId) => {
    try {
      await axios.put(`${API}/friends/reject/${requestId}`);
      setIncoming((prev) => prev.filter((r) => r._id !== requestId));
    } catch { /* ignore */ }
  }, []);

  const cancelOutgoing = useCallback(async (userId) => {
    try {
      await axios.delete(`${API}/friends/${userId}`);
      setOutgoing((prev) => prev.filter((r) => (r.receiver?._id ?? r.receiver) !== userId));
      setSearchStatuses((m) => ({ ...m, [userId]: { status: 'none' } }));
    } catch { /* ignore */ }
  }, []);

  const removeFriend = useCallback(async (userId) => {
    try {
      await axios.delete(`${API}/friends/${userId}`);
      setFriends((prev) => prev.filter((f) => f._id !== userId));
      setRecentChats((prev) => prev.filter((c) => c._id !== userId));
      setSearchStatuses((prev) => ({ ...prev, [userId]: { status: 'none' } }));
      if (selectedUser?._id === userId) onSelectUser(null);
    } catch { /* ignore */ }
  }, [onSelectUser, selectedUser?._id]);

  const [blockTarget, setBlockTarget] = useState(null);

  const toast = useToast();

  const openBlockConfirm = useCallback((userId) => {
    // try to resolve user object for nicer modal text
    const u = friends.find((f) => f._id === userId)
      || searchResults.find((s) => s._id === userId)
      || { _id: userId, username: userId };
    setBlockTarget(u);
  }, [friends, searchResults]);

  const performBlock = useCallback(async () => {
    if (!blockTarget) return;
    try {
      await axios.post(`${API}/friends/block/${blockTarget._id}`);
      await removeFriend(blockTarget._id);
      toast?.show(`Blocked ${blockTarget.username}`);
    } catch (err) {
      console.error('block failed', err);
      toast?.show('Failed to block user', { type: 'error' });
    } finally {
      setBlockTarget(null);
    }
  }, [blockTarget, removeFriend]);

  const cancelBlock = useCallback(() => setBlockTarget(null), []);

  const openChat = useCallback((chatUser) => {
    setRecentChats((rs) => {
      if (rs.find((r) => r._id === chatUser._id)) return rs;
      return [chatUser, ...rs];
    });
    onSelectUser(chatUser);
  }, [onSelectUser]);

  const allChats = [...recentChats];
  friends.forEach((f) => { if (!allChats.find((c) => c._id === f._id)) allChats.push(f); });
  const filteredChats = chatSearch.trim()
    ? allChats.filter((c) => c.username.toLowerCase().includes(chatSearch.toLowerCase()))
    : allChats;

  const online = (u) => statusMap[u._id]?.isOnline ?? u.isOnline;
  const lastSeen = (u) => statusMap[u._id]?.lastSeen ?? u.lastSeen;

  const incomingCount = incoming.length;

  return (
    <>
      <div className="w-full md:w-[320px] flex-shrink-0 flex flex-col shadow-sm" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--card-border)' }}>

        {/* Header */}
        <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3">
            {/* Brand — long-press 800ms to toggle underground mode */}
            <div
              className="flex items-center gap-2"
              style={{ cursor: 'default', userSelect: 'none' }}
              onPointerDown={handleBrandPointerDown}
              onPointerUp={handleBrandPointerUp}
              onPointerLeave={handleBrandPointerUp}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: underground ? 'rgba(0,201,170,0.12)' : 'rgba(10,163,163,0.10)',
                border: underground ? '1px solid rgba(0,201,170,0.25)' : '1px solid rgba(10,163,163,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s',
                boxShadow: underground ? '0 0 10px rgba(0,201,170,0.2)' : 'none',
              }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent)', fontFamily: "'Space Grotesk', sans-serif" }}>U</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)', letterSpacing: '-0.02em', fontFamily: "'Space Grotesk', sans-serif" }}>UNDDR</span>
              {underground && (
                <span style={{
                  fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 999,
                  background: 'rgba(0,201,170,0.10)', color: '#00C9AA',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  border: '1px solid rgba(0,201,170,0.18)',
                  animation: 'ug-dot 2s ease-in-out infinite',
                }}>
                  underground
                </span>
              )}
              {!underground && user?.isAdmin && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(10,163,163,0.12)', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Admin
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <button onClick={() => setShowQR(true)} title="My invite QR" className="p-2 rounded-lg transition duration-150" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
              <button onClick={() => navigate('/settings')} title="Settings" className="p-2 rounded-lg transition duration-150" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {user?.isAdmin && (
                <button onClick={() => navigate('/admin')} title="Admin panel" className="p-2 rounded-lg transition duration-150" style={{ color: 'var(--accent)' }}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
                  </svg>
                </button>
              )}
              <button onClick={logout} title="Log out" className="p-2 rounded-lg transition duration-150" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
          {/* Disconnected indicator */}
          {!connected && (
            <div style={{ background: 'rgba(239,68,68,0.06)', borderTop: '1px solid rgba(239,68,68,0.12)', padding: '4px 16px', fontSize: 11, color: 'rgba(220,38,38,0.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(220,38,38,0.6)', display: 'inline-block' }} />
              Reconnecting…
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-3 py-3" style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--card-border)' }}>
          <TabButton label="Chats"    active={tab === 'chats'}    onClick={() => setTab('chats')} />
          <TabButton label="People"   active={tab === 'people'}   onClick={() => setTab('people')} />
          <TabButton label="Requests" active={tab === 'requests'} badge={incomingCount} onClick={() => setTab('requests')} />
        </div>

        {/* Probation banner */}
        {user?.accountStatus === 'probation' && (
          <div className="mx-3 mt-2 rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(10,163,163,0.06)', border: '1px solid rgba(10,163,163,0.15)' }}>
            <span className="text-lg flex-shrink-0">⏳</span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>First week — settling in</p>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Invite tokens unlock {user.probationEndsAt
                  ? `in ${Math.max(0, Math.ceil((new Date(user.probationEndsAt) - Date.now()) / 86_400_000))} day(s)`
                  : 'soon'}.
              </p>
            </div>
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Chats tab ── */}
          {tab === 'chats' && (
            <div className="flex flex-col gap-1 pt-2">
              <div className="px-3 pb-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search chats"
                    className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--card-border)' }}
                  />
                </div>
              </div>

              {filteredChats.length === 0 && (
                <p className="text-sm text-center py-8 px-4" style={{ color: 'var(--text-secondary)' }}>
                  {friends.length === 0
                    ? '👋 Add friends to start chatting'
                    : '🔍 No chats match your search'}
                </p>
              )}

              {filteredChats.map((u) => (
                <FriendRow
                  key={u._id}
                  u={u}
                  online={online(u)}
                  lastSeen={lastSeen(u)}
                  action="message"
                  isSelected={selectedUser?._id === u._id}
                  onSelect={() => openChat(u)}
                  onMessage={() => openChat(u)}
                  onRemove={removeFriend}
                  onBlock={openBlockConfirm}
                  onReport={(u) => setReportTarget(u)}
                  onViewProfile={() => navigate(`/add/${u.username}`)}
                />
              ))}
            </div>
          )}

          {/* ── People tab ── */}
          {tab === 'people' && (
            <div className="flex flex-col gap-1 pt-2">
              <div className="px-3 pb-2 flex flex-col gap-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    placeholder="Find people by username"
                    className="w-full rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)', border: '1px solid var(--card-border)' }}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
                  style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  Scan QR Code
                </button>
              </div>

              {searchResults.length > 0 && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider px-4 py-2" style={{ color: 'var(--text-secondary)' }}>🔎 Results</p>
                  {searchResults.map((u) => {
                    const s = searchStatuses[u._id];
                    const friendStatus = s?.status ?? 'none';
                    return (
                      <FriendRow
                        key={u._id}
                        u={u}
                        online={online(u)}
                        lastSeen={lastSeen(u)}
                        action={
                          friendStatus === 'accepted' ? 'message' :
                          friendStatus === 'pending'  ? (s?.isSender ? 'pending' : 'incoming') :
                          'add'
                        }
                        onAction={
                          friendStatus === 'none'     ? () => sendRequest(u._id) :
                          friendStatus === 'pending' && !s?.isSender
                            ? (act) => act === 'accept'
                                ? acceptRequest(s.requestId, u._id)
                                : rejectRequest(s.requestId)
                            : friendStatus === 'pending' && s?.isSender
                              ? () => cancelOutgoing(u._id)
                              : undefined
                        }
                        isSelected={selectedUser?._id === u._id}
                        onSelect={() => friendStatus === 'accepted' ? openChat(u) : undefined}
                        onMessage={() => openChat(u)}
                        onRemove={removeFriend}
                        onBlock={openBlockConfirm}
                        onViewProfile={() => navigate(`/add/${u.username}`)}
                      />
                    );
                  })}
                  <div className="h-px mx-4 my-1" style={{ background: 'var(--card-border)' }} />
                </>
              )}

              {friends.length > 0 && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                    👥 Friends · {friends.length}
                  </p>
                  {friends.map((u) => (
                    <FriendRow
                      key={u._id}
                      u={u}
                      online={online(u)}
                      lastSeen={lastSeen(u)}
                      action="message"
                      isSelected={selectedUser?._id === u._id}
                      onSelect={() => openChat(u)}
                      onMessage={() => openChat(u)}
                      onRemove={removeFriend}
                      onBlock={openBlockConfirm}
                      onViewProfile={() => navigate(`/add/${u.username}`)}
                    />
                  ))}
                </>
              )}

              {friends.length === 0 && !peopleSearch && (
                <p className="text-sm text-center py-8 px-4" style={{ color: 'var(--text-secondary)' }}>
                  Search for people to add as friends
                </p>
              )}
            </div>
          )}

          {/* ── Requests tab ── */}
          {tab === 'requests' && (
            <div className="flex flex-col gap-1 pt-2">
              {incoming.length > 0 && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                    📨 Incoming · {incoming.length}
                  </p>
                  {incoming.map((req) => (
                    <FriendRow
                      key={req._id}
                      u={req.sender}
                      online={online(req.sender)}
                      lastSeen={lastSeen(req.sender)}
                      action="incoming"
                      onAction={(act) =>
                        act === 'accept'
                          ? acceptRequest(req._id, req.sender._id)
                          : rejectRequest(req._id)
                      }
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  ))}
                  <div className="h-px mx-4 my-1" style={{ background: 'var(--card-border)' }} />
                </>
              )}

              {outgoing.length > 0 && (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider px-4 py-2" style={{ color: 'var(--text-secondary)' }}>
                    📤 Sent · {outgoing.length}
                  </p>
                  {outgoing.map((req) => (
                    <FriendRow
                      key={req._id}
                      u={req.receiver}
                      online={online(req.receiver)}
                      lastSeen={lastSeen(req.receiver)}
                      action="pending"
                      onAction={() => cancelOutgoing(req.receiver?._id ?? req.receiver)}
                      isSelected={false}
                      onSelect={() => {}}
                    />
                  ))}
                </>
              )}

              {incoming.length === 0 && outgoing.length === 0 && (
                <p className="text-sm text-center py-10 px-4" style={{ color: 'var(--text-secondary)' }}>
                  ✨ No pending requests
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {showQR && user && <QRModal user={user} onClose={() => setShowQR(false)} />}

      {/* Report modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,36,0.5)' }}>
          <div className="rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--card-border)' }}>
            {!reportDone ? (
              <>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Report @{reportTarget.username}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Reports are reviewed privately. This is not shown to the reported user.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--bg-muted)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                  >
                    <option value="hostile">Hostile or aggressive</option>
                    <option value="harassment">Harassment</option>
                    <option value="doxxing">Sharing private info (doxxing)</option>
                    <option value="spam">Spam or flooding</option>
                    <option value="impersonation">Impersonation</option>
                    <option value="real_world_harm">Coordinating real-world harm</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Details (optional)</label>
                  <textarea
                    value={reportDesc}
                    onChange={(e) => setReportDesc(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Anything the reviewer should know…"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition"
                    style={{ background: 'var(--bg-muted)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeReport} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition" style={{ border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>Cancel</button>
                  <button onClick={submitReport} disabled={reportLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 text-warning" style={{ background: 'rgba(245,158,11,0.10)' }}>
                    {reportLoading ? 'Sending…' : 'Submit report'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-2 py-2">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Report submitted</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>A reviewer will look at this privately. Thank you for helping keep Unddr safe.</p>
                </div>
                <button onClick={closeReport} className="w-full py-2.5 rounded-xl text-sm font-semibold transition" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>Done</button>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!blockTarget}
        title={blockTarget ? `Block ${blockTarget.username}?` : 'Block user'}
        description="Blocking will remove this contact and prevent them from messaging you. This action can be undone from the Blocked list."
        onConfirm={performBlock}
        onCancel={cancelBlock}
        confirmLabel="Block"
      />
      {showScanner && (
        <QRScanner
          onClose={() => setShowScanner(false)}
          onAdded={() => { loadFriends(); loadIncoming(); }}
        />
      )}
    </>
  );
}
