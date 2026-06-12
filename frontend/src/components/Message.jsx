import { useEffect, useState, useCallback, useRef } from 'react';
import MediaViewer from './MediaViewer';

// ── Small icon components used in the hover action bar ──────────────────────

function ReplySmIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

function CopySmIcon() {
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function MoreSmIcon() {
  return (
    <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

// ── Delivery ticks ────────────────────────────────────────────────────────────

function Ticks({ status }) {
  const color = status === 'read' ? 'text-success' : 'text-ink-950/50';
  if (status === 'sent') return <span className={`${color} text-[11px]`}>✓</span>;
  return <span className={`${color} text-[11px]`}>✓✓</span>;
}

// ── Media cards ───────────────────────────────────────────────────────────────

function SnapCard({ message, isMine, localViewed, onTap }) {
  const isVideo = message.mediaType === 'video';
  const viewed = localViewed || message.mediaViewed;
  const cannotReopen = !isMine && viewed && message.viewOnce;
  const secureLabel = message.viewOnce ? 'Secure image · view once' : isVideo ? 'Secure video' : 'Secure image';

  if (isMine) {
    return (
      <button
        onClick={onTap}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-52 transition active:scale-95 ${
          isVideo
            ? 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30'
            : 'bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isVideo ? 'bg-purple-500/30' : 'bg-primary-500/30'
        }`}>
          {isVideo
            ? <VideoIcon className="w-5 h-5 text-purple-300" />
            : <CameraIcon className="w-5 h-5 text-primary-300" />
          }
        </div>
        <div className="text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {secureLabel}
            </span>
          </div>
          <p className={`text-sm font-semibold ${isVideo ? 'text-purple-300' : 'text-primary-300'}`}>
            {isVideo ? 'Video' : 'Photo'}
          </p>
          <p className="truncate" style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {message.viewOnce
              ? (viewed ? 'Opened' : 'View once · sent')
              : 'Tap to view'}
          </p>
        </div>
      </button>
    );
  }

  if (cannotReopen) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl w-52" style={{ background: 'var(--card-base)', border: `1px solid var(--card-border)` }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,23,36,0.04)' }}>
          {isVideo
            ? <VideoIcon style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
            : <CameraIcon style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
          }
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.24em] font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {secureLabel}
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{isVideo ? 'Video' : 'Photo'}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Opened</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onTap}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-52 transition active:scale-95 shadow-lg ${
        isVideo
          ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
          : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700'
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0 backdrop-blur">
        {isVideo
          ? <VideoIcon className="w-5 h-5" style={{ color: 'var(--text-on-gradient, #fff)' }} />
          : <CameraIcon className="w-5 h-5" style={{ color: 'var(--text-on-gradient, #fff)' }} />
        }
      </div>
      <div className="text-left">
        <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 700 }}>New {isVideo ? 'Video' : 'Photo'}</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {message.viewOnce ? 'View once · tap to open' : 'Tap to view'}
        </p>
      </div>
    </button>
  );
}

function CameraIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function VideoIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  );
}

// ── Reply-to quote section shown inside the bubble ────────────────────────────

function ReplyQuote({ replyTo, isMine }) {
  if (!replyTo?.messageId) return null;

  const quoteText = replyTo.isMedia ? 'Photo / Video' : (replyTo.preview || '');

  return (
    <div style={{
      display: 'flex',
      marginBottom: 6,
      borderRadius: 8,
      overflow: 'hidden',
      background: isMine ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)',
      borderLeft: `3px solid ${isMine ? 'rgba(255,255,255,0.6)' : 'var(--accent)'}`,
    }}>
      <div style={{ padding: '5px 8px', minWidth: 0 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--accent)',
          marginBottom: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {replyTo.senderUsername || 'them'}
        </p>
        <p style={{
          fontSize: 12,
          color: isMine ? 'rgba(255,255,255,0.65)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 200,
        }}>
          {quoteText}
        </p>
      </div>
    </div>
  );
}

// ── Inline hover action bar (desktop only via CSS opacity) ────────────────────

function HoverActionBar({ isMine, onReply, onCopy, onMore, showCopy }) {
  const btnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid var(--card-border)',
    background: 'var(--bg-surface)',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    transition: 'background 120ms, color 120ms',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    padding: 0,
  };

  return (
    <div
      className="msg-hover-actions"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexDirection: isMine ? 'row' : 'row-reverse',
        marginLeft: isMine ? 0 : 6,
        marginRight: isMine ? 6 : 0,
      }}
    >
      <button
        style={btnStyle}
        title="Reply"
        onPointerDown={(e) => { e.stopPropagation(); onReply(); }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <ReplySmIcon />
      </button>
      {showCopy && (
        <button
          style={btnStyle}
          title="Copy"
          onPointerDown={(e) => { e.stopPropagation(); onCopy(); }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <CopySmIcon />
        </button>
      )}
      <button
        style={btnStyle}
        title="More actions"
        onPointerDown={(e) => { e.stopPropagation(); onMore(); }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <MoreSmIcon />
      </button>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Props:
 *   message  — message object
 *   isMine   — boolean
 *   onAction — (message) => void — open action sheet
 *   onReply  — (message) => void — quick reply
 *   onCopy   — (message) => void — quick copy
 */
export default function Message({ message, isMine, onAction, onReply, onCopy }) {
  const [expired, setExpired] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [localViewed, setLocalViewed] = useState(false);

  // Long-press detection
  const longPressTimer = useRef(null);
  const pointerStart = useRef(null);
  const didFire = useRef(false);

  useEffect(() => {
    if (!message.expiresAt) return;
    const check = () => {
      const remaining = new Date(message.expiresAt) - Date.now();
      if (remaining <= 0) { setExpired(true); return; }
      setCountdown(remaining < 60_000 ? Math.ceil(remaining / 1000) : null);
    };
    check();
    const t = setInterval(check, 1000);
    return () => clearInterval(t);
  }, [message.expiresAt]);

  const handleViewed = useCallback(() => setLocalViewed(true), []);

  const fireLongPress = useCallback(() => {
    if (didFire.current) return;
    didFire.current = true;
    navigator.vibrate?.(50);
    onAction?.(message);
  }, [message, onAction]);

  const onPointerDown = useCallback((e) => {
    // Only primary button on desktop
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    didFire.current = false;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = setTimeout(fireLongPress, 500);
  }, [fireLongPress]);

  const onPointerMove = useCallback((e) => {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  const onPointerUpCancel = useCallback(() => {
    clearTimeout(longPressTimer.current);
    pointerStart.current = null;
  }, []);

  const onContextMenu = useCallback((e) => {
    e.preventDefault();
    onAction?.(message);
  }, [message, onAction]);

  if (expired) return null;

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isMedia = !!message.mediaUrl;
  const isLocked = message.content === '[Encrypted]' || message.content === '[No private key]';
  const canCopyForward = !isMedia && !isLocked;

  // ── Media messages ───────────────────────────────────────────────────────
  if (isMedia) {
    if (!isMine && message.viewOnce && (localViewed || message.mediaViewed)) return null;
    const cannotReopen = !isMine && (localViewed || message.mediaViewed) && message.viewOnce;

    return (
      <>
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
          <div
            className="msg-bubble-wrap relative flex items-center"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpCancel}
            onPointerCancel={onPointerUpCancel}
            onContextMenu={onContextMenu}
            style={{ touchAction: 'pan-y' }}
          >
            {isMine && onAction && (
              <HoverActionBar
                isMine={isMine}
                onReply={() => onReply?.(message)}
                onCopy={() => onCopy?.(message)}
                onMore={() => onAction(message)}
                showCopy={false}
              />
            )}

            <div>
              {message.expiresAt && (
                <span className="absolute -top-2 -right-1 z-10 bg-error text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: 'var(--on-error, #fff)' }}>
                  {countdown != null ? `${countdown}s` : '⏱'}
                </span>
              )}
              <SnapCard
                message={message}
                isMine={isMine}
                localViewed={localViewed}
                onTap={() => { if (!cannotReopen) setShowViewer(true); }}
              />
              <div className={`flex flex-col gap-1 mt-1 px-1 ${isMine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{time}</span>
                  {(message.expiresAt || message.viewOnce) && (
                    <span className="text-[10px]" style={{ color: 'var(--text-primary)', background: 'rgba(15,23,36,0.04)', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {message.viewOnce ? 'View once' : 'Disappears soon'}
                    </span>
                  )}
                </div>
                {isMine && <Ticks status={message.deliveryStatus} />}
              </div>
            </div>

            {!isMine && onAction && (
              <HoverActionBar
                isMine={isMine}
                onReply={() => onReply?.(message)}
                onCopy={() => onCopy?.(message)}
                onMore={() => onAction(message)}
                showCopy={false}
              />
            )}
          </div>
        </div>

        {showViewer && (
          <MediaViewer
            message={message}
            isMine={isMine}
            onClose={() => setShowViewer(false)}
            onViewed={handleViewed}
          />
        )}
      </>
    );
  }

  // ── Locked / encrypted message indicator ────────────────────────────────
  if (isLocked) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(15,23,36,0.04)', border: '1px solid rgba(15,23,36,0.08)' }}>
          <svg style={{ width: 11, height: 11, color: 'var(--text-secondary)', flexShrink: 0, opacity: 0.5 }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
          </svg>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', opacity: 0.6 }}>Message locked · different session key</span>
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', opacity: 0.4 }}>{time}</span>
        </div>
      </div>
    );
  }

  // ── Text message ─────────────────────────────────────────────────────────
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
      <div
        className="msg-bubble-wrap relative flex items-center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUpCancel}
        onPointerCancel={onPointerUpCancel}
        onContextMenu={onContextMenu}
        style={{ touchAction: 'pan-y', maxWidth: '70%' }}
      >
        {/* Hover action bar — left side for own messages */}
        {isMine && onAction && (
          <HoverActionBar
            isMine={isMine}
            onReply={() => onReply?.(message)}
            onCopy={() => onCopy?.(message)}
            onMore={() => onAction(message)}
            showCopy={canCopyForward}
          />
        )}

        <div
          className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${isMine ? 'rounded-br-none' : 'rounded-bl-none'}`}
          style={isMine
            ? { background: 'var(--accent)', color: 'var(--text-primary)' }
            : { background: 'var(--card-base)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', backdropFilter: 'blur(6px)' }
          }
        >
          {message.expiresAt && (
            <span className="absolute -top-2 -right-1 bg-error text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: 'var(--on-error, #fff)' }}>
              {countdown != null ? `${countdown}s` : '⏱'}
            </span>
          )}

          {/* Reply-to quote */}
          {message.replyTo?.messageId && (
            <ReplyQuote replyTo={message.replyTo} isMine={isMine} />
          )}

          <p className="text-sm break-words whitespace-pre-wrap pr-14">{message.content}</p>
          <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
            <span className="text-[10px]" style={{ color: isMine ? 'rgba(15,23,36,0.6)' : 'var(--text-secondary)' }}>{time}</span>
            {isMine && <Ticks status={message.deliveryStatus} />}
          </div>
        </div>

        {/* Hover action bar — right side for others' messages */}
        {!isMine && onAction && (
          <HoverActionBar
            isMine={isMine}
            onReply={() => onReply?.(message)}
            onCopy={() => onCopy?.(message)}
            onMore={() => onAction(message)}
            showCopy={canCopyForward}
          />
        )}
      </div>
    </div>
  );
}
