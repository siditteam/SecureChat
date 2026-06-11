import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { subscribeToPush, unsubscribeFromPush, getPermissionStatus, isPushSupported } from '../utils/pushNotifications';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
        style={{ background: checked ? 'var(--accent)' : 'rgba(15,23,36,0.15)' }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SectionCard({ children }) {
  return (
    <div className="rounded-2xl divide-y" style={{ background: 'var(--card-base)', border: '1px solid var(--card-border)', divideColor: 'var(--card-border)', boxShadow: '0 1px 8px rgba(15,23,36,0.05)' }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="px-5 py-4 flex justify-between items-center gap-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
      <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-sm font-medium text-right break-all" style={{ color: 'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  );
}

const NAV = [
  { id: 'profile',       icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile' },
  { id: 'account',       icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Account' },
  { id: 'privacy',       icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Privacy' },
  { id: 'security',      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Security' },
  { id: 'notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notifications' },
  { id: 'blocked',       icon: 'M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Blocked' },
  { id: 'about',         icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'About' },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [section, setSection] = useState('profile');
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: user?.settings?.showOnlineStatus ?? true,
    readReceipts: user?.settings?.readReceipts ?? true,
    notifications: user?.settings?.notifications ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [pushPermission, setPushPermission] = useState(() => getPermissionStatus());
  const [pushLoading, setPushLoading] = useState(false);
  const pushSupported = isPushSupported();

  const handleEnablePush = useCallback(async () => {
    setPushLoading(true);
    try {
      const token = localStorage.getItem('token');
      await subscribeToPush(token);
      setPushPermission('granted');
      setPrivacySettings((s) => ({ ...s, notifications: true }));
      toast.success('Notifications enabled');
    } catch (err) {
      if (err.message === 'Permission denied') {
        setPushPermission('denied');
        toast.error('Permission blocked — check browser settings');
      } else {
        toast.error(err.message || 'Failed to enable notifications');
      }
    } finally {
      setPushLoading(false);
    }
  }, [toast]);

  const handleDisablePush = useCallback(async () => {
    setPushLoading(true);
    try {
      const token = localStorage.getItem('token');
      await unsubscribeFromPush(token);
      setPushPermission(getPermissionStatus());
      setPrivacySettings((s) => ({ ...s, notifications: false }));
      toast.success('Notifications disabled');
    } catch {
      toast.error('Failed to disable notifications');
    } finally {
      setPushLoading(false);
    }
  }, [toast]);

  const loadBlocked = async () => {
    setBlockedLoading(true);
    try {
      const res = await axios.get(`${API}/friends/blocked`);
      setBlockedUsers(res.data);
    } catch { /* ignore */ }
    finally { setBlockedLoading(false); }
  };

  useEffect(() => {
    if (section === 'blocked') loadBlocked();
  }, [section]);

  const unblockUser = async (userId) => {
    try {
      await axios.delete(`${API}/friends/block/${userId}`);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
      toast?.show(`Unblocked ${userId}`);
    } catch {
      toast?.show('Failed to unblock', { type: 'error' });
    }
  };

  const showSaved = (msg = 'Saved!') => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(''), 2500);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/users/me`, { bio });
      updateUser(res.data.user);
      showSaved('Profile saved!');
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/users/me`, { settings: privacySettings });
      updateUser(res.data.user);
      showSaved('Settings saved!');
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await axios.post(`${API}/users/me/avatar`, form);
      updateUser(res.data.user);
    } catch { /* ignore */ } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const removeAvatar = async () => {
    try {
      const res = await axios.delete(`${API}/users/me/avatar`);
      updateUser(res.data.user);
    } catch { /* ignore */ }
  };

  const avatarUrl = user?.avatar ? `${API}/users/avatar/${user.avatar}` : null;
  const currentNavItem = NAV.find((n) => n.id === section);

  const handleNavClick = (id) => {
    setSection(id);
    setMobileShowContent(true);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-deep)' }}>

      {/* Header */}
      <div className="shadow-sm flex-shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--card-border)', color: 'var(--text-primary)' }}>
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className={`${mobileShowContent ? 'hidden md:flex' : 'flex'} items-center justify-center p-2 rounded-xl transition flex-shrink-0`}
            style={{ color: 'var(--text-secondary)' }}
            title="Back to chats"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setMobileShowContent(false)}
            className={`${mobileShowContent ? 'flex md:hidden' : 'hidden'} items-center justify-center p-2 rounded-xl transition flex-shrink-0`}
            style={{ color: 'var(--text-secondary)' }}
            title="Back to settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-lg font-bold tracking-tight flex-1 min-w-0 truncate" style={{ color: 'var(--text-primary)' }}>
            <span className="md:hidden">{mobileShowContent ? currentNavItem?.label : 'Settings'}</span>
            <span className="hidden md:inline">Settings</span>
          </h1>

          {saveMsg && (
            <span className="text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: 'rgba(10,163,163,0.10)', color: 'var(--accent)' }}>
              ✓ {saveMsg}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 max-w-4xl mx-auto w-full overflow-hidden">

        {/* Nav sidebar */}
        <aside className={`${mobileShowContent ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-52 flex-shrink-0 overflow-y-auto`} style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--card-border)' }}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="w-full flex items-center gap-3 px-5 py-4 md:px-4 md:py-3 text-sm font-medium transition"
              style={{
                borderBottom: '1px solid var(--card-border)',
                color: section === item.id ? 'var(--accent)' : 'var(--text-secondary)',
                background: section === item.id ? 'rgba(10,163,163,0.06)' : 'transparent',
                borderRight: section === item.id ? '2.5px solid var(--accent)' : '2.5px solid transparent',
              }}
            >
              <svg className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="flex-1 text-left">{item.label}</span>
              <svg className="w-4 h-4 md:hidden" style={{ color: 'var(--card-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className={`${mobileShowContent ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-y-auto`}>
          <div className="p-4 md:p-6">

            {/* ── Profile ── */}
            {section === 'profile' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Profile</h2>

                <SectionCard>
                  <div className="px-5 py-5 flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover" style={{ boxShadow: '0 0 0 3px rgba(10,163,163,0.25)' }} />
                        : (
                          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold" style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 0 3px rgba(10,163,163,0.2)' }}>
                            {user?.username?.[0]?.toUpperCase()}
                          </div>
                        )
                      }
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition disabled:opacity-60"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                        title="Change photo"
                      >
                        {avatarUploading
                          ? <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-lg truncate" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user?.phone}</p>
                      {user?.avatar && (
                        <button onClick={removeAvatar} className="text-xs text-error hover:underline mt-1">Remove photo</button>
                      )}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>About / Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 150))}
                      placeholder="A short bio visible to your friends…"
                      rows={3}
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none transition"
                      style={{ background: 'var(--bg-muted)', border: '1.5px solid var(--card-border)', color: 'var(--text-primary)' }}
                    />
                    <p className="text-xs text-right mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>{bio.length}/150</p>
                  </div>
                </SectionCard>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full py-3 rounded-xl font-semibold shadow-md transition disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* ── Account ── */}
            {section === 'account' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Account</h2>

                <SectionCard>
                  <InfoRow label="Username" value={`@${user?.username}`} />
                  <InfoRow label="Phone" value={user?.phone} />
                  <InfoRow
                    label="Member since"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  />
                  {user?.isAdmin && (
                    <div className="px-5 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--card-border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Role</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(10,163,163,0.10)', color: 'var(--accent)' }}>Admin</span>
                    </div>
                  )}
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Encryption keys</p>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Your private key is stored only on this device. If you log in on a new device, a new key pair will be generated.</p>
                    <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-muted)', border: '1px solid var(--card-border)' }}>
                      <p className="text-[10px] font-mono break-all" style={{ color: 'var(--text-secondary)' }}>
                        {localStorage.getItem('privateKey') ? 'Private key present on this device ✓' : 'No private key on this device'}
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full border-2 border-error text-error hover:bg-error hover:text-white py-3 rounded-xl font-semibold transition"
                >
                  Log Out
                </button>
              </div>
            )}

            {/* ── Privacy ── */}
            {section === 'privacy' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Privacy</h2>

                <SectionCard>
                  <ToggleRow
                    label="Show online status"
                    description="Let friends see when you're active"
                    checked={privacySettings.showOnlineStatus}
                    onChange={(v) => setPrivacySettings((s) => ({ ...s, showOnlineStatus: v }))}
                  />
                  <ToggleRow
                    label="Read receipts"
                    description="Let friends see when you've read their messages"
                    checked={privacySettings.readReceipts}
                    onChange={(v) => setPrivacySettings((s) => ({ ...s, readReceipts: v }))}
                  />
                </SectionCard>

                <button
                  onClick={savePrivacy}
                  disabled={saving}
                  className="w-full py-3 rounded-xl font-semibold shadow-md transition disabled:opacity-60"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* ── Security ── */}
            {section === 'security' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Security</h2>

                <SectionCard>
                  <div className="px-5 py-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(22,163,74,0.10)' }}>
                        <svg className="w-5 h-5" style={{ color: '#16A34A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>End-to-End Encrypted</p>
                        <p className="text-xs" style={{ color: '#16A34A' }}>All messages are E2EE</p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Unddr uses RSA-OAEP (2048-bit) + AES-GCM (256-bit) encryption. Your private key never leaves this device — not even the server can read your messages.
                    </p>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Your public key</p>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>Share this fingerprint to verify your identity with friends.</p>
                    <div className="rounded-xl p-3" style={{ background: 'var(--bg-muted)', border: '1px solid var(--card-border)' }}>
                      <p className="font-mono text-[11px] break-all leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {user?.publicKey ? user.publicKey.slice(0, 120) + '…' : 'Key not available'}
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Active session</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Logged in on this device. Log out to end this session. Each device gets its own encryption key pair.</p>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── Notifications ── */}
            {section === 'notifications' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Notifications</h2>

                {!pushSupported && (
                  <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--bg-muted)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                    Push notifications are not supported in this browser.
                  </div>
                )}

                {pushSupported && (
                  <>
                    {/* Status card */}
                    <SectionCard>
                      <div className="px-5 py-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Push notifications</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {pushPermission === 'granted' && privacySettings.notifications
                              ? 'Active — you will receive notifications'
                              : pushPermission === 'denied'
                              ? 'Blocked in browser settings'
                              : 'Not enabled'}
                          </p>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          pushPermission === 'granted' && privacySettings.notifications
                            ? 'bg-success'
                            : 'bg-white/20'
                        }`} />
                      </div>
                    </SectionCard>

                    {/* Action */}
                    {pushPermission === 'denied' ? (
                      <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-sm text-error/80 leading-relaxed">
                        Notifications are blocked. To fix this: open your browser settings, find Site Settings → Notifications, and allow this site.
                      </div>
                    ) : pushPermission === 'granted' && privacySettings.notifications ? (
                      <button
                        onClick={handleDisablePush}
                        disabled={pushLoading}
                        className="w-full py-3 rounded-xl font-semibold transition disabled:opacity-60"
                        style={{ background: 'var(--bg-muted)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}
                      >
                        {pushLoading ? 'Disabling…' : 'Disable notifications'}
                      </button>
                    ) : (
                      <button
                        onClick={handleEnablePush}
                        disabled={pushLoading}
                        className="w-full py-3 rounded-xl font-semibold shadow-md transition disabled:opacity-60"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        {pushLoading ? 'Enabling…' : 'Enable notifications'}
                      </button>
                    )}

                    <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-secondary)', opacity: 0.55 }}>
                      Notifications are sent when you receive a message and the app is closed or in the background. Message content is never included.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ── Blocked ── */}
            {section === 'blocked' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>Blocked Users</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Users you have blocked cannot message or call you.</p>

                {blockedLoading && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--card-border)', borderTopColor: 'var(--accent)' }} />
                    Loading…
                  </div>
                )}

                {!blockedLoading && blockedUsers.length === 0 && (
                  <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--card-base)', border: '1px solid var(--card-border)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You haven't blocked anyone.</p>
                  </div>
                )}

                {!blockedLoading && blockedUsers.length > 0 && (
                  <div className="space-y-3">
                    {blockedUsers.map((u) => (
                      <div key={u._id} className="rounded-xl p-4 flex items-center justify-between" style={{ background: 'var(--card-base)', border: '1px solid var(--card-border)' }}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {u.avatar
                            ? <img src={`${API}/users/avatar/${u.avatar}`} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                            : (
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: '#ef4444', color: '#fff' }}>
                                {u.username?.[0]?.toUpperCase()}
                              </div>
                            )
                          }
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.username}</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{u.isOnline ? '🟢 Online' : 'Offline'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => unblockUser(u._id)}
                          className="ml-2 text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap flex-shrink-0"
                          style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── About ── */}
            {section === 'about' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold hidden md:block" style={{ color: 'var(--text-primary)' }}>About Unddr</h2>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src="/assets/logo-unddr-teal.svg" alt="Unddr" style={{ width: 200, height: 'auto' }} />
                </div>
                <p className="text-xs text-center -mt-2" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>Version 1.0.0</p>

                <SectionCard>
                  <InfoRow label="Version" value="1.0.0" />
                  <InfoRow label="Encryption" value="RSA-OAEP + AES-GCM" />
                  <InfoRow label="Key size" value="2048-bit RSA / 256-bit AES" />
                  <InfoRow label="Protocol" value="E2EE · Zero knowledge" />
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Privacy promise</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Unddr is built with privacy first. All messages are end-to-end encrypted — only you and the person you're talking to can read them. We cannot access your messages, even if compelled to.
                    </p>
                  </div>
                </SectionCard>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
