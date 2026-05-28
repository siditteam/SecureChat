import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function StatCard({ label, value, sub, color = 'primary' }) {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    green:   'from-green-500 to-green-600',
    purple:  'from-purple-500 to-purple-600',
    orange:  'from-orange-500 to-orange-600',
    red:     'from-red-500 to-red-600',
    indigo:  'from-indigo-500 to-indigo-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-white shadow-md`}>
      <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      {sub && <p className="text-white/70 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function Badge({ children, color = 'gray' }) {
  const map = {
    gray:   'bg-white/10 text-white/60',
    red:    'bg-red-500/20 text-red-300',
    green:  'bg-green-500/20 text-green-300',
    blue:   'bg-primary-500/20 text-primary-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[color]}`}>
      {children}
    </span>
  );
}

function ActionBtn({ onClick, variant = 'default', children, disabled }) {
  const base = 'text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-40';
  const variants = {
    default: `${base} bg-white/10 text-white/70 hover:bg-white/20`,
    danger:  `${base} bg-red-500/10 text-red-400 hover:bg-red-500/20`,
    primary: `${base} bg-primary-500/10 text-primary-400 hover:bg-primary-500/20`,
    warn:    `${base} bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20`,
  };
  return (
    <button onClick={onClick} disabled={disabled} className={variants[variant]}>
      {children}
    </button>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-white/10 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <p className="text-white font-semibold mb-2">Are you sure?</p>
        <p className="text-white/50 text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-white/10 text-white/70 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-medium transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

function AccessDenied({ onClaim, claiming, claimError, onBack }) {
  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full bg-ink-800 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center shadow-xl">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
        <p className="text-white/50 text-sm mb-6">
          You don't have admin privileges. If no admins exist yet, you can claim the first admin role below.
        </p>
        {claimError && <p className="text-red-400 text-sm mb-3">{claimError}</p>}
        <button
          onClick={onClaim}
          disabled={claiming}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold transition mb-3 disabled:opacity-60 border border-white/10"
        >
          {claiming ? 'Claiming…' : 'Claim First Admin'}
        </button>
        <button onClick={onBack} className="w-full text-sm text-white/40 hover:text-white py-2 transition">
          Go back to chats
        </button>
      </div>
    </div>
  );
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'users',     label: 'Users',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'system',    label: 'System',    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

export default function Admin() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [section, setSection] = useState('dashboard');
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPages, setUsersPages] = useState(1);
  const [usersQuery, setUsersQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  const isAdmin = user?.isAdmin;

  const refreshStats = useCallback(() => {
    if (!isAdmin) return;
    setStatsLoading(true);
    axios.get(`${API}/admin/stats`)
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [isAdmin]);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  const loadUsers = useCallback(async (page = 1, q = '') => {
    if (!isAdmin) return;
    setUsersLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users?page=${page}&limit=20&q=${encodeURIComponent(q)}`);
      setUsers(res.data.users);
      setUsersTotal(res.data.total);
      setUsersPages(res.data.pages);
    } catch { /* ignore */ }
    finally { setUsersLoading(false); }
  }, [isAdmin]);

  useEffect(() => {
    if (section === 'users') loadUsers(usersPage, usersQuery);
  }, [section, usersPage, usersQuery, loadUsers]);

  const claimFirst = async () => {
    setClaiming(true); setClaimError('');
    try {
      const res = await axios.post(`${API}/admin/claim-first`);
      updateUser(res.data.user);
    } catch (e) {
      setClaimError(e.response?.data?.message || 'Failed to claim admin');
    } finally { setClaiming(false); }
  };

  const toggleBan = async (uid) => {
    try {
      const res = await axios.put(`${API}/admin/users/${uid}/ban`);
      setUsers((us) => us.map((u) => u._id === uid ? res.data.user : u));
    } catch { /* ignore */ }
  };

  const toggleAdmin = async (uid) => {
    try {
      const res = await axios.put(`${API}/admin/users/${uid}/admin`);
      setUsers((us) => us.map((u) => u._id === uid ? res.data.user : u));
    } catch { /* ignore */ }
  };

  const deleteUser = async (uid) => {
    try {
      await axios.delete(`${API}/admin/users/${uid}`);
      setUsers((us) => us.filter((u) => u._id !== uid));
      setUsersTotal((t) => t - 1);
    } catch { /* ignore */ }
    finally { setPendingDelete(null); }
  };

  if (!isAdmin) {
    return (
      <AccessDenied
        onClaim={claimFirst}
        claiming={claiming}
        claimError={claimError}
        onBack={() => navigate('/')}
      />
    );
  }

  const currentNavItem = NAV.find((n) => n.id === section);

  const handleNavClick = (id) => {
    setSection(id);
    setMobileShowContent(true);
  };

  return (
    <div className="h-screen bg-ink-900 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 text-white shadow-lg flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className={`${mobileShowContent ? 'hidden md:flex' : 'flex'} items-center justify-center hover:bg-white/20 p-2 rounded-xl transition flex-shrink-0`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setMobileShowContent(false)}
            className={`${mobileShowContent ? 'flex md:hidden' : 'hidden'} items-center justify-center hover:bg-white/20 p-2 rounded-xl transition flex-shrink-0`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <svg className="w-5 h-5 text-primary-200 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
            </svg>
            <h1 className="text-lg font-bold tracking-tight truncate">
              <span className="md:hidden">{mobileShowContent ? currentNavItem?.label : 'Admin Panel'}</span>
              <span className="hidden md:inline">Admin Panel</span>
            </h1>
          </div>

          <span className="text-xs bg-white/15 px-3 py-1 rounded-full whitespace-nowrap">
            @{user?.username}
          </span>
        </div>
      </div>

      <div className="flex flex-1 max-w-6xl mx-auto w-full overflow-hidden">

        {/* Nav sidebar */}
        <aside className={`${mobileShowContent ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-52 flex-shrink-0 bg-ink-800/60 backdrop-blur-xl md:border-r border-white/10 overflow-y-auto`}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 md:px-4 md:py-3 text-sm font-medium transition border-b border-white/[0.06] ${
                section === item.id
                  ? 'text-white md:bg-primary-500/20 md:text-primary-200'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="flex-1 text-left">{item.label}</span>
              <svg className="w-4 h-4 text-white/20 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className={`${mobileShowContent ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-y-auto`}>
          <div className="p-4 md:p-6">

            {/* ── Dashboard ── */}
            {section === 'dashboard' && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white hidden md:block">Dashboard</h2>

                {statsLoading && !stats && (
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    Loading stats…
                  </div>
                )}

                {stats && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <StatCard label="Total Users"    value={stats.totalUsers}      color="primary" />
                      <StatCard label="Online Now"     value={stats.onlineUsers}     sub="active"        color="green" />
                      <StatCard label="Total Messages" value={stats.totalMessages}   color="indigo" />
                      <StatCard label="Messages (24h)" value={stats.messagesLast24h} sub="last 24 hours" color="purple" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <StatCard label="New Today"     value={stats.newUsersToday} sub="registered" color="orange" />
                      <StatCard label="New This Week" value={stats.newUsersWeek}  sub="last 7 days" color="primary" />
                      <StatCard label="Banned"        value={stats.bannedUsers}   color="red" />
                      <StatCard label="Admins"        value={stats.adminUsers}    color="indigo" />
                    </div>

                    <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                      <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Quick actions</h3>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={() => handleNavClick('users')}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-500/20 text-primary-300 rounded-xl text-sm font-medium hover:bg-primary-500/30 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Manage Users
                        </button>
                        <button
                          onClick={refreshStats}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/20 transition"
                        >
                          <svg className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh Stats
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Users ── */}
            {section === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white hidden md:block">
                    Users
                    {usersTotal > 0 && <span className="ml-2 text-sm font-normal text-white/40">({usersTotal} total)</span>}
                  </h2>
                </div>

                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={usersQuery}
                    onChange={(e) => { setUsersQuery(e.target.value); setUsersPage(1); }}
                    placeholder="Search by username…"
                    className="w-full bg-white/10 border border-white/10 text-white rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none placeholder-white/30 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition"
                  />
                </div>

                {/* Mobile: card list */}
                <div className="md:hidden space-y-3">
                  {usersLoading && (
                    <p className="text-center py-8 text-white/40 text-sm">Loading…</p>
                  )}
                  {!usersLoading && users.length === 0 && (
                    <p className="text-center py-8 text-white/40 text-sm">No users found</p>
                  )}
                  {users.map((u) => (
                    <div key={u._id} className={`bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-sm ${u.isBanned ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{u.username}</p>
                          <p className="text-xs text-white/40">{u.phone}</p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {u.isAdmin  && <Badge color="blue">Admin</Badge>}
                          {u.isBanned && <Badge color="red">Banned</Badge>}
                          {u.isOnline && <Badge color="green">Online</Badge>}
                        </div>
                      </div>
                      {u._id !== user?._id ? (
                        <div className="flex gap-2 flex-wrap">
                          <ActionBtn onClick={() => toggleBan(u._id)} variant={u.isBanned ? 'primary' : 'warn'} disabled={u.isAdmin}>
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </ActionBtn>
                          <ActionBtn onClick={() => toggleAdmin(u._id)} variant="default">
                            {u.isAdmin ? 'Demote' : 'Make Admin'}
                          </ActionBtn>
                          <ActionBtn onClick={() => setPendingDelete(u)} variant="danger" disabled={u.isAdmin}>
                            Delete
                          </ActionBtn>
                        </div>
                      ) : (
                        <span className="text-xs text-white/30">You</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">User</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {usersLoading && (
                        <tr><td colSpan={5} className="text-center py-10 text-white/40 text-sm">Loading…</td></tr>
                      )}
                      {!usersLoading && users.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-10 text-white/40 text-sm">No users found</td></tr>
                      )}
                      {users.map((u) => (
                        <tr key={u._id} className={`hover:bg-white/[0.04] transition ${u.isBanned ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {u.username?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{u.username}</p>
                                <div className="flex gap-1 mt-0.5">
                                  {u.isAdmin  && <Badge color="blue">Admin</Badge>}
                                  {u.isBanned && <Badge color="red">Banned</Badge>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/40">{u.phone}</td>
                          <td className="px-4 py-3 text-white/40 hidden lg:table-cell">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${u.isOnline ? 'bg-green-500' : 'bg-white/20'}`} />
                            <span className="text-xs text-white/40">{u.isOnline ? 'Online' : 'Offline'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {u._id !== user?._id ? (
                                <>
                                  <ActionBtn onClick={() => toggleBan(u._id)} variant={u.isBanned ? 'primary' : 'warn'} disabled={u.isAdmin}>
                                    {u.isBanned ? 'Unban' : 'Ban'}
                                  </ActionBtn>
                                  <ActionBtn onClick={() => toggleAdmin(u._id)} variant="default">
                                    {u.isAdmin ? 'Demote' : 'Make Admin'}
                                  </ActionBtn>
                                  <ActionBtn onClick={() => setPendingDelete(u)} variant="danger" disabled={u.isAdmin}>
                                    Delete
                                  </ActionBtn>
                                </>
                              ) : (
                                <span className="text-xs text-white/30 pr-2">You</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {usersPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/40">Page {usersPage} of {usersPages}</p>
                    <div className="flex gap-2">
                      <button
                        disabled={usersPage <= 1}
                        onClick={() => setUsersPage((p) => p - 1)}
                        className="px-4 py-2 text-sm bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        disabled={usersPage >= usersPages}
                        onClick={() => setUsersPage((p) => p + 1)}
                        className="px-4 py-2 text-sm bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── System ── */}
            {section === 'system' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold text-white hidden md:block">System</h2>

                <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 shadow-sm">
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm text-white/60 font-medium">API Status</span>
                    <span className="flex items-center gap-1.5 text-sm text-green-400 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Operational
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm text-white/60 font-medium">Database</span>
                    <span className="flex items-center gap-1.5 text-sm text-green-400 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full" /> Connected
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm text-white/60 font-medium">WebSocket</span>
                    <span className="flex items-center gap-1.5 text-sm text-green-400 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full" /> Active
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm text-white/60 font-medium">Encryption</span>
                    <span className="text-sm text-primary-300 font-semibold">RSA-OAEP + AES-GCM</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm text-white/60 font-medium">Message cleanup</span>
                    <span className="text-sm text-white/40">Every 60 seconds</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm text-white/60 font-medium">Media storage</span>
                    <span className="text-sm text-white/40">Local / uploads/</span>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-5 py-4">
                  <p className="text-sm font-semibold text-yellow-300 mb-1">First-time setup</p>
                  <p className="text-xs text-yellow-400 leading-relaxed">
                    To manually grant admin to a user, set <code className="bg-yellow-500/20 text-yellow-300 px-1 rounded">isAdmin: true</code> in MongoDB, or use <strong>Claim First Admin</strong> at <code>/admin</code> when no admins exist.
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {pendingDelete && (
        <ConfirmModal
          message={`Delete @${pendingDelete.username} and all their messages? This cannot be undone.`}
          onConfirm={() => deleteUser(pendingDelete._id)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
