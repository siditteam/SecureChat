import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import QRModal from './QRModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AVATAR_API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Avatar({ name, online, size = 'md', avatarFile = null }) {
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
        : <div className={`${sz} bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
            {name[0].toUpperCase()}
          </div>
      }
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-ink-900 shadow-sm" />
      )}
    </div>
  );
}

function formatSeen(date) {
  if (!date) return '';
  const d = Date.now() - new Date(date);
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(date).toLocaleDateString();
}

function TabButton({ label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-2.5 text-sm font-semibold transition duration-200 rounded-lg ${
        active
          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-900/40'
          : 'text-white/60 hover:bg-white/10'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-accent-500 to-accent-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

function FriendRow({ u, online, lastSeen, action, onAction, onMessage, isSelected, onSelect }) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mx-1 transition duration-150 ${
        isSelected
          ? 'bg-primary-500/20 border-l-2 border-primary-400'
          : 'hover:bg-white/5'
      }`}
    >
      <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={onSelect}>
        <Avatar name={u.username} online={online} avatarFile={u.avatar} />
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{u.username}</p>
          <p className="text-white/50 text-xs truncate">
            {online ? '🟢 Online' : lastSeen ? `Last seen ${formatSeen(lastSeen)}` : ''}
          </p>
        </div>
      </button>

      <div className="flex-shrink-0 flex gap-1">
        {action === 'message' && onMessage && (
          <button
            onClick={onMessage}
            className="text-primary-400 hover:bg-primary-500/20 p-1.5 rounded-lg transition duration-150"
            title="Message"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </button>
        )}
        {action === 'add' && (
          <button
            onClick={onAction}
            className="text-xs bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 px-2.5 py-1 rounded-lg font-semibold transition duration-150"
          >
            Add
          </button>
        )}
        {action === 'pending' && (
          <span className="text-xs text-white/50 bg-white/10 px-2.5 py-1 rounded-lg">Sent</span>
        )}
        {action === 'incoming' && (
          <>
            <button onClick={() => onAction('accept')} className="text-xs bg-success text-white hover:bg-green-600 px-2.5 py-1 rounded-lg font-semibold transition duration-150">✓</button>
            <button onClick={() => onAction('reject')} className="text-xs bg-error/10 text-error hover:bg-error/20 px-2.5 py-1 rounded-lg transition duration-150">✕</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ selectedUser, onSelectUser }) {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  const [tab, setTab] = useState('chats');
  const [showQR, setShowQR] = useState(false);

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
      setSearchStatuses((m) => ({ ...m, [userId]: { status: res.data.status } }));
      if (res.data.status === 'accepted') loadFriends();
    } catch { /* ignore */ }
  }, [loadFriends]);

  const acceptRequest = useCallback(async (requestId, senderId) => {
    try {
      await axios.put(`${API}/friends/accept/${requestId}`);
      setIncoming((prev) => prev.filter((r) => r._id !== requestId));
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
      <div className="w-full md:w-[320px] flex-shrink-0 bg-ink-800/90 backdrop-blur-xl flex flex-col border-r border-white/10 shadow-xl">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 text-white">
          <div className="flex items-center gap-3 px-4 py-4">
            <button onClick={() => navigate('/settings')} title="Settings" className="flex-shrink-0">
              <Avatar name={user?.username} online={connected} size="sm" avatarFile={user?.avatar} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate">{user?.username}</p>
                {user?.isAdmin && (
                  <span className="text-[9px] bg-primary-400/30 text-primary-200 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-white/30'}`} />
                <span className="text-xs opacity-80">{connected ? 'Online' : 'Reconnecting…'}</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowQR(true)}
                title="My invite QR"
                className="hover:bg-white/20 p-2 rounded-lg transition duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/settings')}
                title="Settings"
                className="hover:bg-white/20 p-2 rounded-lg transition duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {user?.isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  title="Admin panel"
                  className="hover:bg-white/20 p-2 rounded-lg transition duration-150"
                >
                  <svg className="w-4 h-4 text-primary-200" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
                  </svg>
                </button>
              )}
              <button
                onClick={logout}
                title="Log out"
                className="hover:bg-white/20 p-2 rounded-lg transition duration-150"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-3 py-3 bg-white/[0.03] border-b border-white/10">
          <TabButton label="Chats"    active={tab === 'chats'}    onClick={() => setTab('chats')} />
          <TabButton label="People"   active={tab === 'people'}   onClick={() => setTab('people')} />
          <TabButton label="Requests" active={tab === 'requests'} badge={incomingCount} onClick={() => setTab('requests')} />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Chats tab ── */}
          {tab === 'chats' && (
            <div className="flex flex-col gap-1 pt-2">
              <div className="px-3 pb-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    placeholder="Search chats"
                    className="w-full bg-white/10 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none placeholder-white/30 border border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {filteredChats.length === 0 && (
                <p className="text-white/40 text-sm text-center py-8 px-4">
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
                />
              ))}
            </div>
          )}

          {/* ── People tab ── */}
          {tab === 'people' && (
            <div className="flex flex-col gap-1 pt-2">
              <div className="px-3 pb-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    placeholder="Find people by username"
                    className="w-full bg-white/10 text-white rounded-lg pl-9 pr-3 py-2 text-sm outline-none placeholder-white/30 border border-white/10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    autoFocus
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <>
                  <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider px-4 py-2">🔎 Results</p>
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
                            : undefined
                        }
                        isSelected={selectedUser?._id === u._id}
                        onSelect={() => friendStatus === 'accepted' ? openChat(u) : undefined}
                        onMessage={() => openChat(u)}
                      />
                    );
                  })}
                  <div className="h-px bg-white/10 mx-4 my-1" />
                </>
              )}

              {friends.length > 0 && (
                <>
                  <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider px-4 py-2">
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
                    />
                  ))}
                </>
              )}

              {friends.length === 0 && !peopleSearch && (
                <p className="text-white/40 text-sm text-center py-8 px-4">
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
                  <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider px-4 py-2">
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
                  <div className="h-px bg-white/10 mx-4 my-1" />
                </>
              )}

              {outgoing.length > 0 && (
                <>
                  <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider px-4 py-2">
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
                <p className="text-white/40 text-sm text-center py-10 px-4">
                  ✨ No pending requests
                </p>
              )}
            </div>
          )}

        </div>
      </div>

      {showQR && user && <QRModal user={user} onClose={() => setShowQR(false)} />}
    </>
  );
}
