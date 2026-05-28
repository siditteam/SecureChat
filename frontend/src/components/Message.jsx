import { useEffect, useState, useCallback } from 'react';
import MediaViewer from './MediaViewer';

function Ticks({ status }) {
  const color = status === 'read' ? 'text-primary-400' : 'text-white/30';
  if (status === 'sent') return <span className={`${color} text-[11px]`}>✓</span>;
  return <span className={`${color} text-[11px]`}>✓✓</span>;
}

function SnapCard({ message, isMine, localViewed, onTap }) {
  const isVideo = message.mediaType === 'video';
  const viewed = localViewed || message.mediaViewed;
  const cannotReopen = !isMine && viewed && message.viewOnce;

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
          <p className={`text-sm font-semibold ${isVideo ? 'text-purple-300' : 'text-primary-300'}`}>
            {isVideo ? 'Video' : 'Photo'}
          </p>
          <p className="text-white/50 text-xs truncate">
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
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl w-52 bg-white/10 border border-white/10">
        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
          {isVideo
            ? <VideoIcon className="w-4.5 h-4.5 text-white/50" style={{width:'18px',height:'18px'}} />
            : <CameraIcon className="w-4.5 h-4.5 text-white/50" style={{width:'18px',height:'18px'}} />
          }
        </div>
        <div className="text-left">
          <p className="text-white/70 text-sm font-medium">{isVideo ? 'Video' : 'Photo'}</p>
          <p className="text-white/40 text-xs">Opened</p>
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
          ? <VideoIcon className="w-5 h-5 text-white" />
          : <CameraIcon className="w-5 h-5 text-white" />
        }
      </div>
      <div className="text-left">
        <p className="text-white text-sm font-bold">New {isVideo ? 'Video' : 'Photo'}</p>
        <p className="text-white/80 text-xs">
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
    const cannotReopen = !isMine && (localViewed || message.mediaViewed) && message.viewOnce;

    return (
      <>
        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
          <div className="relative">
            {message.expiresAt && (
              <span className="absolute -top-2 -right-1 z-10 bg-error text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
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

            <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] text-white/30">{time}</span>
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

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-0.5`}>
      <div className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
        isMine
          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-none'
          : 'bg-white/10 text-white rounded-bl-none border border-white/10 backdrop-blur-sm'
      }`}>
        {message.expiresAt && (
          <span className="absolute -top-2 -right-1 bg-error text-white text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
            {countdown != null ? `${countdown}s` : '⏱'}
          </span>
        )}
        <p className="text-sm break-words whitespace-pre-wrap pr-14">{message.content}</p>
        <div className="absolute bottom-1.5 right-2 flex items-center gap-1">
          <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-white/40'}`}>{time}</span>
          {isMine && <Ticks status={message.deliveryStatus} />}
        </div>
      </div>
    </div>
  );
}
