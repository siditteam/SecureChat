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
  const wrapperStyle = { color: color === 'primary' ? 'var(--text-ink-950)' : 'var(--text-on-accent)' };
  const labelStyle = { color: color === 'primary' ? 'var(--text-ink-950/80)' : 'var(--text-on-accent)' };
  const subStyle = { color: color === 'primary' ? 'var(--text-ink-950/70)' : 'var(--text-on-accent)' };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 shadow-md`} style={wrapperStyle}>
      <p style={labelStyle} className="text-[11px] font-medium uppercase tracking-wider mb-1.5">{label}</p>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      {sub && <p style={subStyle} className="text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function Badge({ children, color = 'gray' }) {
  const map = {
    gray:   'bg-white/10',
    red:    'bg-red-500/20',
    green:  'bg-green-500/20',
    blue:   'bg-primary-500/20',
    yellow: 'bg-yellow-500/20',
  };
  const colorMap = {
    gray: 'var(--text-secondary)',
    red:  'var(--red-300, #fca5a5)',
    green:'var(--green-300, #86efac)',
    blue: 'var(--primary-300, #93c5fd)',
    yellow:'var(--yellow-300, #facc15)',
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${map[color]}`} style={{ color: colorMap[color] || 'var(--text-secondary)' }}>
      {children}
    </span>
  );
}

function ActionBtn({ onClick, variant = 'default', children, disabled }) {
  const base = 'text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-40';
  const variants = {
    default: `${base} bg-white/10 hover:bg-white/20`,
    danger:  `${base} bg-red-500/10 hover:bg-red-500/20`,
    primary: `${base} bg-primary-500/10 hover:bg-primary-500/20`,
    warn:    `${base} bg-yellow-500/10 hover:bg-yellow-500/20`,
  };
  const textColorMap = {
    default: 'var(--text-secondary)',
    danger:  'var(--text-error, #ef4444)',
    primary: 'var(--text-on-accent, #fff)',
    warn:    'var(--yellow-300, #facc15)'
  };
  return (
    <button onClick={onClick} disabled={disabled} className={variants[variant]} style={{ color: textColorMap[variant] }}>
      {children}
    </button>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-ink-800 border border-white/10 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <p style={{ color: 'var(--text-primary)' }} className="font-semibold mb-2">Are you sure?</p>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-white/10 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 py-2 rounded-xl text-sm font-medium transition" style={{ color: 'var(--text-on-accent, #fff)' }}>Delete</button>
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
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Admin Access Required</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          You don't have admin privileges. If no admins exist yet, you can claim the first admin role below.
        </p>
        {claimError && <p className="text-red-400 text-sm mb-3">{claimError}</p>}
        <button
          onClick={onClaim}
          disabled={claiming}
          className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition mb-3 disabled:opacity-60 border border-white/10"
          style={{ color: 'var(--text-on-accent, #fff)' }}
        >
          {claiming ? 'Claiming…' : 'Claim First Admin'}
        </button>
        <button onClick={onBack} className="w-full text-sm py-2 transition" style={{ color: 'var(--text-secondary)' }}>
          Go back to chats
        </button>
      </div>
    </div>
  );
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'users',     label: 'Users',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'reports',   label: 'Reports',   icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
  { id: 'appeals',   label: 'Appeals',   icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
  { id: 'system',    label: 'System',    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'blocked',      label: 'Blocked',      icon: 'M18 8a6 6 0 11-12 0 6 6 0 0112 0z' },
  { id: 'applications', label: 'Applications', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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
  const [blockedList, setBlockedList] = useState([]);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [appeals, setAppeals] = useState([]);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeReason, setRemoveReason] = useState('');

  const isAdmin = user?.isAdmin;

  const loadReports = useCallback(() => {
    if (!isAdmin) return;
    setReportsLoading(true);
    axios.get(`${API}/admin/reports?status=pending`)
      .then((r) => setReports(r.data))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, [isAdmin]);

  const loadAppeals = useCallback(() => {
    if (!isAdmin) return;
    setAppealsLoading(true);
    axios.get(`${API}/admin/appeals`)
      .then((r) => setAppeals(r.data))
      .catch(() => {})
      .finally(() => setAppealsLoading(false));
  }, [isAdmin]);

  const loadApplications = useCallback(() => {
    if (!isAdmin) return;
    setApplicationsLoading(true);
    axios.get(`${API}/admin/applications?status=pending`)
      .then((r) => setApplications(r.data))
      .catch(() => {})
      .finally(() => setApplicationsLoading(false));
  }, [isAdmin]);

  const reviewApplication = async (id, action) => {
    try {
      await axios.put(`${API}/admin/applications/${id}`, { action });
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const reviewReport = async (reportId, action, extra = {}) => {
    try {
      await axios.put(`${API}/admin/reports/${reportId}`, { action, ...extra });
      loadReports();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const restoreUser = async (userId) => {
    await axios.put(`${API}/admin/users/${userId}/restore`);
    loadAppeals();
  };

  const rejectAppeal = async (userId) => {
    await axios.put(`${API}/admin/users/${userId}/reject-appeal`);
    loadAppeals();
  };

  const promoteUser = async (userId) => {
    await axios.put(`${API}/admin/users/${userId}/promote`);
    loadUsers(usersPage, usersQuery);
  };

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
    if (section === 'users')   loadUsers(usersPage, usersQuery);
    if (section === 'blocked') loadBlocked();
    if (section === 'reports')      loadReports();
    if (section === 'appeals')      loadAppeals();
    if (section === 'applications') loadApplications();
  }, [section, usersPage, usersQuery, loadUsers, loadReports, loadAppeals, loadApplications]);

  const loadBlocked = async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get(`${API}/admin/blocked`);
      setBlockedList(res.data);
    } catch (e) { /* ignore */ }
  };

  const unblock = async (userId, blockedId) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/unblock/${blockedId}`);
      await loadBlocked();
      // optional: refresh users list
      loadUsers(usersPage, usersQuery);
    } catch (e) { /* ignore */ }
  };

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
      <div className="bg-ink-900 border-b-2 border-primary-500/50 shadow-lg flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
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
            <h1 className="text-lg font-bold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
              <span className="md:hidden">{mobileShowContent ? currentNavItem?.label : 'Admin Panel'}</span>
              <span className="hidden md:inline">Admin Panel</span>
            </h1>
          </div>

          <span className="text-xs bg-white/15 px-3 py-1 rounded-full whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
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
                section === item.id ? 'md:bg-primary-500/20 md:text-primary-200' : 'hover:bg-white/5'
              }`}
              style={{ color: section === item.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <svg className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="flex-1 text-left">{item.label}</span>
              <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
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
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>

                {statsLoading && !stats && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <StatCard label="Invites Created"   value={stats.invitesCreated}   color="indigo" />
                      <StatCard label="Invites Used"      value={stats.invitesUsed}       sub={`${stats.conversionRate ?? 0}% conversion`} color="green" />
                      <StatCard label="Vouches Given"     value={stats.vouchesCreated}   color="orange" />
                      <StatCard label="Vouched Users"     value={stats.usersWithVoucher} sub="have a voucher" color="purple" />
                    </div>

                    <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 p-5">
                      <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Quick actions</h3>
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
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition"
                          style={{ color: 'var(--text-secondary)' }}
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
                  <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>
                    Users
                    {usersTotal > 0 && <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>({usersTotal} total)</span>}
                  </h2>
                </div>

                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={usersQuery}
                    onChange={(e) => { setUsersQuery(e.target.value); setUsersPage(1); }}
                    placeholder="Search by username…"
                    className="w-full bg-white/10 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none placeholder-white/30 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Mobile: card list */}
                <div className="md:hidden space-y-3">
                  {usersLoading && (
                    <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading…</p>
                  )}
                  {!usersLoading && users.length === 0 && (
                    <p className="text-center py-8 text-sm" style={{ color: 'var(--text-secondary)' }}>No users found</p>
                  )}
                  {users.map((u) => (
                    <div key={u._id} className={`bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-sm ${u.isBanned ? 'opacity-60' : ''}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-ink-950 font-bold flex-shrink-0">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.phone}</p>
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
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>You</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/[0.04] border-b border-white/10">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>User</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>Joined</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {usersLoading && (
                        <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading…</td></tr>
                      )}
                      {!usersLoading && users.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-10 text-sm" style={{ color: 'var(--text-secondary)' }}>No users found</td></tr>
                      )}
                      {users.map((u) => (
                        <tr key={u._id} className={`hover:bg-white/[0.04] transition ${u.isBanned ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-ink-950 text-xs font-bold flex-shrink-0">
                                {u.username?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                                <div className="flex gap-1 mt-0.5">
                                  {u.isAdmin  && <Badge color="blue">Admin</Badge>}
                                  {u.isBanned && <Badge color="red">Banned</Badge>}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.phone}</td>
                          <td className="px-4 py-3 hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${u.isOnline ? 'bg-green-500' : 'bg-white/20'}`} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.isOnline ? 'Online' : 'Offline'}</span>
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
                                <span className="text-xs pr-2" style={{ color: 'var(--text-secondary)' }}>You</span>
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
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Page {usersPage} of {usersPages}</p>
                    <div className="flex gap-2">
                      <button
                        disabled={usersPage <= 1}
                        onClick={() => setUsersPage((p) => p - 1)}
                        className="px-4 py-2 text-sm bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition disabled:opacity-40"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Previous
                      </button>
                      <button
                        disabled={usersPage >= usersPages}
                        onClick={() => setUsersPage((p) => p + 1)}
                        className="px-4 py-2 text-sm bg-white/10 border border-white/10 rounded-xl hover:bg-white/20 transition disabled:opacity-40"
                        style={{ color: 'var(--text-secondary)' }}
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
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>System</h2>

                <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10 shadow-sm">
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>API Status</span>
                    <span className="flex items-center gap-1.5 text-sm text-green-400 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Operational
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Database</span>
                    <span className="flex items-center gap-1.5 text-sm text-green-400 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full" /> Connected
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>WebSocket</span>
                    <span className="flex items-center gap-1.5 text-sm text-green-400 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full" /> Active
                    </span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Encryption</span>
                    <span className="text-sm text-primary-300 font-semibold">RSA-OAEP + AES-GCM</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Message cleanup</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Every 60 seconds</span>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Media storage</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Local / uploads/</span>
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

            {/* ── Reports ── */}
            {section === 'reports' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Reports</h2>
                  <ActionBtn onClick={loadReports} variant="default">Refresh</ActionBtn>
                </div>
                {reportsLoading && <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
                {!reportsLoading && reports.length === 0 && (
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No pending reports. All clear.</p>
                  </div>
                )}
                {reports.map((r) => (
                  <div key={r._id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          @{r.reporter?.username} → @{r.reported?.username}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {r.reason.replace('_', ' ')} · {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                        {r.description && (
                          <p className="text-xs mt-2 bg-white/5 rounded-lg px-3 py-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            "{r.description}"
                          </p>
                        )}
                      </div>
                      <Badge color={r.reported?.isBanned ? 'red' : r.reported?.accountStatus === 'warned' ? 'yellow' : 'gray'}>
                        {r.reported?.isBanned ? 'banned' : r.reported?.accountStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <ActionBtn onClick={() => reviewReport(r._id, 'dismiss')} variant="default">Dismiss</ActionBtn>
                      <ActionBtn onClick={() => reviewReport(r._id, 'warn')} variant="warn">Warn user</ActionBtn>
                      <ActionBtn
                        onClick={() => setRemoveTarget(r)}
                        variant="danger"
                        disabled={r.reported?.isBanned}
                      >
                        Remove from Unddr
                      </ActionBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Appeals ── */}
            {section === 'appeals' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Appeals</h2>
                  <ActionBtn onClick={loadAppeals} variant="default">Refresh</ActionBtn>
                </div>
                {appealsLoading && <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
                {!appealsLoading && appeals.length === 0 && (
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No pending appeals.</p>
                  </div>
                )}
                {appeals.map((u) => (
                  <div key={u._id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 space-y-3">
                    <div>
                        <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">@{u.username}</p>
                        <p style={{ color: 'var(--text-secondary)' }} className="text-xs mt-0.5">
                        Removed for: {u.removalReason || 'Not specified'} ·
                        Appeal filed {u.appealSubmittedAt ? new Date(u.appealSubmittedAt).toLocaleDateString() : ''}
                      </p>
                      {u.appealMessage && (
                        <div className="mt-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
                          <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-secondary)' }}>Their appeal</p>
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>&quot;{u.appealMessage}&quot;</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn onClick={() => restoreUser(u._id)} variant="primary">Restore account</ActionBtn>
                      <ActionBtn onClick={() => rejectAppeal(u._id)} variant="danger">Reject appeal</ActionBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Applications ── */}
            {section === 'applications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>
                    Invite Applications
                    {applications.length > 0 && <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-secondary)' }}>({applications.length} pending)</span>}
                  </h2>
                  <ActionBtn onClick={loadApplications} variant="default">Refresh</ActionBtn>
                </div>
                {applicationsLoading && <p className="text-sm py-4" style={{ color: 'var(--text-secondary)' }}>Loading…</p>}
                {!applicationsLoading && applications.length === 0 && (
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl p-6 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No pending applications.</p>
                  </div>
                )}
                {applications.map((a) => (
                  <div key={a._id} className="bg-white/[0.03] border border-white/8 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.email} · {a.phone}</p>
                        <p className="text-primary-300 text-xs font-medium">
                          {a.platform}: {a.social}
                        </p>
                        {a.why && (
                          <div className="mt-2 bg-white/5 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            "{a.why}"
                          </div>
                        )}
                        <p className="text-[10px] pt-1" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge color="yellow">pending</Badge>
                    </div>
                    <div className="flex gap-2">
                      <ActionBtn onClick={() => reviewApplication(a._id, 'approve')} variant="primary">Approve</ActionBtn>
                      <ActionBtn onClick={() => reviewApplication(a._id, 'reject')} variant="danger">Reject</ActionBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Blocked ── */}
            {section === 'blocked' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Blocked Users</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>View users who have blocked others. You can remove blocks here.</p>
                <div className="space-y-3">
                  {blockedList.length === 0 && (
                    <p className="py-6" style={{ color: 'var(--text-secondary)' }}>No blocked relationships found.</p>
                  )}
                  {blockedList.map((u) => (
                    <div key={u._id} className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-start justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Blocked {u.blocked.length} user(s)</p>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {u.blocked.map((b) => (
                              <div key={b._id} className="bg-white/5 px-2 py-1 rounded-full text-sm flex items-center gap-2">
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.username}</span>
                              <button onClick={() => unblock(u._id, b._id)} className="text-xs text-red-400 hover:underline">Unblock</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
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

      {removeTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-ink-800 border border-white/10 rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Remove @{removeTarget.reported?.username}?</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>They will be banned and notified. They can appeal once.</p>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-secondary)' }}>Reason (shown to user)</label>
              <textarea
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                rows={3}
                placeholder="e.g. Repeated hostile behaviour toward other members"
                className="w-full bg-ink-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none resize-none placeholder-secondary focus:border-primary-500"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setRemoveTarget(null); setRemoveReason(''); }} className="flex-1 border border-white/10 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 transition" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
              <button
                onClick={async () => {
                  await reviewReport(removeTarget._id, 'remove', { reason: removeReason });
                  setRemoveTarget(null); setRemoveReason('');
                }}
                className="flex-1 bg-error/20 hover:bg-error/30 text-error py-2.5 rounded-xl text-sm font-semibold transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
