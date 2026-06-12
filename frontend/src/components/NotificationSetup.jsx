import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPermissionStatus, isPushSupported, subscribeToPush,
  isRunningAsApp, isIOSDevice,
} from '../utils/pushNotifications';

const DISMISSED_KEY = 'unddr:notif_dismissed';
const F = "'Space Grotesk', sans-serif";

// ── Small reusable button ─────────────────────────────────────────────────────

function Btn({ children, onClick, primary, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: F, fontWeight: 700, fontSize: 13, borderRadius: 10,
        padding: '10px 18px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
        background: primary ? 'var(--accent)' : 'transparent',
        color: primary ? '#fff' : 'var(--text-secondary)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Step: iOS "Add to Home Screen" instructions ───────────────────────────────

function IOSInstallCard({ onDismiss }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={iconBox}>
          <svg style={{ width: 20, height: 20, color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Install Unddr to get notifications
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
            iOS notifications only work when Unddr is installed on your home screen.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {[
              ['Tap', 'the Share button (⎋) in Safari'],
              ['Tap', '"Add to Home Screen"'],
              ['Tap', '"Add" — then open Unddr from your home screen'],
            ].map(([bold, rest], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(10,163,163,0.12)', border: '1px solid rgba(10,163,163,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{bold}</strong> {rest}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => onDismiss(false)}>Later</Btn>
            <Btn primary onClick={() => onDismiss(true)}>Got it</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step: Android install prompt ──────────────────────────────────────────────

function AndroidInstallCard({ onInstall, onDismiss }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={iconBox}>
          <svg style={{ width: 20, height: 20, color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Install Unddr
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Add to your home screen for instant notifications and a faster, app-like experience.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => onDismiss(false)}>Not now</Btn>
            <Btn primary onClick={onInstall}>Install app</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step: Enable notifications ────────────────────────────────────────────────

function EnableCard({ onEnable, onDismiss, loading }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={iconBox}>
          <svg style={{ width: 20, height: 20, color: 'var(--accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Stay notified
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Get notified when messages arrive — even when Unddr is closed.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Btn onClick={() => onDismiss(true)}>Not now</Btn>
            <Btn primary onClick={onEnable} disabled={loading}>
              {loading ? 'Setting up…' : 'Enable notifications →'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step: Blocked ─────────────────────────────────────────────────────────────

function BlockedCard({ onDismiss }) {
  return (
    <div style={{ ...card, borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ ...iconBox, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <svg style={{ width: 18, height: 18, color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', margin: '0 0 2px' }}>Notifications blocked</p>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            To enable, go to your browser / phone settings and allow notifications for this site.
          </p>
        </div>
        <Btn onClick={() => onDismiss(true)} style={{ padding: '8px 12px', flexShrink: 0 }}>OK</Btn>
      </div>
    </div>
  );
}

// ── Step: Done ────────────────────────────────────────────────────────────────

function DoneCard() {
  return (
    <div style={{ ...card, borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg style={{ width: 18, height: 18, color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>
          Notifications enabled
        </p>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const card = {
  position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
  width: 'calc(100% - 32px)', maxWidth: 440,
  background: 'var(--bg-surface)', border: '1px solid var(--card-border)',
  borderRadius: 16, padding: '16px',
  boxShadow: '0 8px 32px rgba(15,23,36,0.18)',
  zIndex: 1000, fontFamily: F,
  animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

const iconBox = {
  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
  background: 'rgba(10,163,163,0.08)', border: '1px solid rgba(10,163,163,0.15)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function NotificationSetup() {
  const { user } = useAuth();
  const [phase, setPhase] = useState(null); // null | ios_install | android_install | enable | loading | done | blocked
  const [installPrompt, setInstallPrompt] = useState(null);

  // Capture Android "Add to Home Screen" prompt
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(DISMISSED_KEY) === 'permanent') return;

    const perm = getPermissionStatus();
    if (perm === 'granted') return; // already subscribed
    if (perm === 'denied') { setPhase('blocked'); return; }

    const ios = isIOSDevice();
    const standalone = isRunningAsApp();
    const pushOk = isPushSupported();

    const t = setTimeout(() => {
      if (ios && !standalone) {
        setPhase('ios_install');
      } else if (!standalone && installPrompt) {
        setPhase('android_install');
      } else if (pushOk) {
        setPhase('enable');
      }
    }, 2500);

    return () => clearTimeout(t);
  }, [user, installPrompt]);

  if (!phase) return null;

  const dismiss = (permanent) => {
    if (permanent) localStorage.setItem(DISMISSED_KEY, 'permanent');
    setPhase(null);
  };

  const handleInstallAndroid = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (outcome === 'accepted') {
      setPhase('enable');
    } else {
      dismiss(false);
    }
  };

  const handleEnable = async () => {
    setPhase('loading');
    try {
      await subscribeToPush(localStorage.getItem('token'));
      setPhase('done');
      localStorage.setItem(DISMISSED_KEY, 'permanent');
      setTimeout(() => setPhase(null), 2500);
    } catch (err) {
      if (err.message === 'Permission denied') {
        setPhase('blocked');
      } else {
        setPhase('enable'); // reset to try again
      }
    }
  };

  if (phase === 'ios_install')     return <IOSInstallCard onDismiss={dismiss} />;
  if (phase === 'android_install') return <AndroidInstallCard onInstall={handleInstallAndroid} onDismiss={dismiss} />;
  if (phase === 'enable')          return <EnableCard onEnable={handleEnable} onDismiss={dismiss} loading={false} />;
  if (phase === 'loading')         return <EnableCard onEnable={() => {}} onDismiss={() => {}} loading={true} />;
  if (phase === 'done')            return <DoneCard />;
  if (phase === 'blocked')         return <BlockedCard onDismiss={dismiss} />;
  return null;
}
