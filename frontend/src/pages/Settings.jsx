import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-white/50 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-primary-500' : 'bg-white/20'
        }`}
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
    <div className="bg-white/[0.05] backdrop-blur-xl rounded-2xl border border-white/10 divide-y divide-white/10">
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="px-5 py-4 flex justify-between items-center gap-3">
      <span className="text-sm text-white/50 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-white text-right break-all">{value || '—'}</span>
    </div>
  );
}

const NAV = [
  { id: 'profile',       icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'Profile' },
  { id: 'account',       icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Account' },
  { id: 'privacy',       icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Privacy' },
  { id: 'security',      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Security' },
  { id: 'notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Notifications' },
  { id: 'about',         icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'About' },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

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
  const fileInputRef = useRef(null);

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
    <div className="h-screen bg-ink-900 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 via-primary-700 to-primary-600 text-white shadow-md flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className={`${mobileShowContent ? 'hidden md:flex' : 'flex'} items-center justify-center hover:bg-white/20 p-2 rounded-xl transition flex-shrink-0`}
            title="Back to chats"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setMobileShowContent(false)}
            className={`${mobileShowContent ? 'flex md:hidden' : 'hidden'} items-center justify-center hover:bg-white/20 p-2 rounded-xl transition flex-shrink-0`}
            title="Back to settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-lg font-bold tracking-tight flex-1 min-w-0 truncate">
            <span className="md:hidden">{mobileShowContent ? currentNavItem?.label : 'Settings'}</span>
            <span className="hidden md:inline">Settings</span>
          </h1>

          {saveMsg && (
            <span className="text-sm bg-white/20 px-3 py-1 rounded-full font-medium whitespace-nowrap">
              ✓ {saveMsg}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 max-w-4xl mx-auto w-full overflow-hidden">

        {/* Nav sidebar */}
        <aside className={`${mobileShowContent ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-52 flex-shrink-0 bg-ink-800/60 backdrop-blur-xl md:border-r border-white/10 overflow-y-auto`}>
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 md:px-4 md:py-3 text-sm font-medium transition border-b border-white/[0.06] ${
                section === item.id
                  ? 'text-primary-300 md:bg-primary-500/20 md:border-r-2 md:border-primary-400'
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

            {/* ── Profile ── */}
            {section === 'profile' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold text-white hidden md:block">Profile</h2>

                <SectionCard>
                  <div className="px-5 py-5 flex items-center gap-5">
                    <div className="relative flex-shrink-0">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-primary-500/30" />
                        : (
                          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold ring-4 ring-primary-500/20">
                            {user?.username?.[0]?.toUpperCase()}
                          </div>
                        )
                      }
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transition disabled:opacity-60"
                        title="Change photo"
                      >
                        {avatarUploading
                          ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        }
                      </button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white text-lg truncate">{user?.username}</p>
                      <p className="text-white/50 text-sm mt-0.5">{user?.phone}</p>
                      {user?.avatar && (
                        <button onClick={removeAvatar} className="text-xs text-error hover:underline mt-1">
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <label className="block text-sm font-semibold text-white/80 mb-2">About / Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, 150))}
                      placeholder="A short bio visible to your friends…"
                      rows={3}
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 resize-none transition"
                    />
                    <p className="text-xs text-white/30 text-right mt-1">{bio.length}/150</p>
                  </div>
                </SectionCard>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-primary-900/40 transition disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* ── Account ── */}
            {section === 'account' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold text-white hidden md:block">Account</h2>

                <SectionCard>
                  <InfoRow label="Username" value={`@${user?.username}`} />
                  <InfoRow label="Phone" value={user?.phone} />
                  <InfoRow
                    label="Member since"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  />
                  {user?.isAdmin && (
                    <div className="px-5 py-4 flex justify-between items-center">
                      <span className="text-sm text-white/50">Role</span>
                      <span className="text-xs bg-primary-500/20 text-primary-300 font-semibold px-2.5 py-1 rounded-full">Admin</span>
                    </div>
                  )}
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-white/80 mb-1">Encryption keys</p>
                    <p className="text-xs text-white/50 mb-3">Your private key is stored only on this device. If you log in on a new device, a new key pair will be generated.</p>
                    <div className="bg-white/[0.04] rounded-lg px-3 py-2 border border-white/10">
                      <p className="text-[10px] font-mono text-white/40 break-all">
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
                <h2 className="text-xl font-bold text-white hidden md:block">Privacy</h2>

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
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-primary-900/40 transition disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* ── Security ── */}
            {section === 'security' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold text-white hidden md:block">Security</h2>

                <SectionCard>
                  <div className="px-5 py-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">End-to-End Encrypted</p>
                        <p className="text-xs text-green-400">All messages are E2EE</p>
                      </div>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed">
                      SecureChat uses RSA-OAEP (2048-bit) + AES-GCM (256-bit) encryption. Your private key never leaves this device — not even the server can read your messages.
                    </p>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-white/80 mb-2">Your public key</p>
                    <p className="text-xs text-white/50 mb-2">Share this fingerprint to verify your identity with friends.</p>
                    <div className="bg-white/[0.04] rounded-xl p-3 border border-white/10">
                      <p className="font-mono text-[11px] text-white/40 break-all leading-relaxed">
                        {user?.publicKey ? user.publicKey.slice(0, 120) + '…' : 'Key not available'}
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-white/80 mb-1">Active session</p>
                    <p className="text-xs text-white/50">Logged in on this device. Log out to end this session. Each device gets its own encryption key pair.</p>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── Notifications ── */}
            {section === 'notifications' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold text-white hidden md:block">Notifications</h2>

                <SectionCard>
                  <ToggleRow
                    label="Message notifications"
                    description="Get notified when you receive new messages"
                    checked={privacySettings.notifications}
                    onChange={(v) => setPrivacySettings((s) => ({ ...s, notifications: v }))}
                  />
                </SectionCard>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm text-yellow-300">
                  Browser notifications require permission from your browser. You may be prompted to allow notifications.
                </div>

                <button
                  onClick={savePrivacy}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3 rounded-xl font-semibold shadow-md shadow-primary-900/40 transition disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* ── About ── */}
            {section === 'about' && (
              <div className="max-w-lg space-y-5">
                <h2 className="text-xl font-bold text-white hidden md:block">About SecureChat</h2>

                <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white text-center shadow-lg shadow-primary-950/50">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-1">SecureChat</h3>
                  <p className="text-white/70 text-sm">Version 1.0.0</p>
                </div>

                <SectionCard>
                  <InfoRow label="Version" value="1.0.0" />
                  <InfoRow label="Encryption" value="RSA-OAEP + AES-GCM" />
                  <InfoRow label="Key size" value="2048-bit RSA / 256-bit AES" />
                  <InfoRow label="Protocol" value="E2EE · Zero knowledge" />
                </SectionCard>

                <SectionCard>
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-white/80 mb-2">Privacy promise</p>
                    <p className="text-sm text-white/50 leading-relaxed">
                      SecureChat is built with privacy first. All messages are end-to-end encrypted — only you and the person you're talking to can read them. We cannot access your messages, even if compelled to.
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
