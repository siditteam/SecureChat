import { useEffect, useState, useCallback } from 'react';
import MediaViewer from './MediaViewer';

function Ticks({ status }) {
  const color = status === 'read' ? 'text-success' : 'text-ink-950/50';
  if (status === 'sent') return <span className={`${color} text-[11px]`}>✓</span>;
  return <span className={`${color} text-[11px]`}>✓✓</span>;
}

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
            ? <VideoIcon className="w-4.5 h-4.5" style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
            : <CameraIcon className="w-4.5 h-4.5" style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
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

export default function Message({ message, isMine }) {
  const [expired, setExpired] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [localViewed, setLocalViewed] = useState(false);

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

  if (expired) return null;

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isMedia = !!message.mediaUrl;

  if (isMedia) {
    if (!isMine && message.viewOnce && (localViewed || message.mediaViewed)) return null;
    const cannotReopen = !isMine && (localViewed || message.mediaViewed) && message.viewOnce;

    return (
      <>
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
          <div className="relative">
            {message.expiresAt && (
              <span className="absolute -top-2 -right-1 z-10 bg-error text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: 'var(--on-error, #fff)' }}>
                  {countdown != null ? `${countdown}s` : '⏱'}
                </span>
            )}

            <SnapCard
              message={message}
              isMine={isMine}
              localViewed={localViewed}
              onTap={() => {
                if (!cannotReopen) setShowViewer(true);
              }}
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

  // Message from a different encryption session — key mismatch
  if (message.content === '[Encrypted]' || message.content === '[No private key]') {
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

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
      <div className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${isMine ? 'rounded-br-none' : 'rounded-bl-none'}`} style={isMine ? { background: 'var(--accent)', color: 'var(--text-primary)' } : { background: 'var(--card-base)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', backdropFilter: 'blur(6px)' }}>
        {message.expiresAt && (
          <span className="absolute -top-2 -right-1 bg-error text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: 'var(--on-error, #fff)' }}>
            {countdown != null ? `${countdown}s` : '⏱'}
          </span>
        )}
        <p className="text-sm break-words whitespace-pre-wrap pr-14">{message.content}</p>
        <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
          <span className="text-[10px]" style={{ color: isMine ? 'rgba(15,23,36,0.6)' : 'var(--text-secondary)' }}>{time}</span>
          {isMine && <Ticks status={message.deliveryStatus} />}
        </div>
      </div>
    </div>
  );
}
