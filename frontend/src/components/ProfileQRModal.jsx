import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const F = "'Space Grotesk', ui-sans-serif, system-ui, sans-serif";

export default function ProfileQRModal({ user, onClose }) {
  const overlayRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/add/${user?.username}`;
  const canShare = typeof navigator.share === 'function';

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = profileUrl;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Add me on Unddr`,
        text: `Add @${user?.username} on Unddr — invite-only encrypted messaging.`,
        url: profileUrl,
      });
    } catch { /* cancelled */ }
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: F,
      }}
    >
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 24,
        border: '1px solid var(--card-border)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        width: '100%', maxWidth: 340, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--card-border)' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', margin: 0 }}>My QR Code</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>Others scan this to add you</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR code */}
        <div style={{ padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: '#fff', padding: 16, borderRadius: 16,
            boxShadow: '0 0 0 4px rgba(10,163,163,0.12)',
          }}>
            <QRCodeSVG
              value={profileUrl}
              size={180}
              level="M"
              includeMargin={false}
              fgColor="#0F1724"
            />
          </div>

          {/* Username */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              @{user?.username}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              Scan to send a friend request
            </p>
          </div>

          {/* URL row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'var(--bg-muted)', border: '1px solid var(--card-border)',
            borderRadius: 10, padding: '8px 12px',
          }}>
            <p style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
              {profileUrl}
            </p>
            <button
              onClick={handleCopy}
              style={{
                flexShrink: 0, fontSize: 11, fontWeight: 700, padding: '4px 10px',
                borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: F,
                background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(10,163,163,0.10)',
                color: copied ? 'var(--success)' : 'var(--accent)',
                transition: 'all 0.15s',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          {/* Share button (mobile) */}
          {canShare && (
            <button
              onClick={handleShare}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                fontFamily: F, fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share my profile link
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
