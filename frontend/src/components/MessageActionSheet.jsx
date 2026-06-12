import { useEffect, useRef } from 'react';

// SVG icon components
function ReplyIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ForwardIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 10H9a6 6 0 000 12h3m9-12l-4-4m4 4l-4 4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function UnpinIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function TrashMeIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

/**
 * MessageActionSheet
 *
 * Props:
 *   message    — the message object
 *   isMine     — boolean, whether the current user sent this message
 *   isPinned   — boolean, whether this message is currently pinned
 *   onReply    — () => void
 *   onCopy     — () => void  (only shown for non-media, non-locked text)
 *   onForward  — () => void  (only shown for non-media, non-locked text)
 *   onPin      — (shouldPin: boolean) => void
 *   onDelete   — (forEveryone: boolean) => void
 *   onClose    — () => void
 */
export default function MessageActionSheet({
  message,
  isMine,
  isPinned,
  onReply,
  onCopy,
  onForward,
  onPin,
  onDelete,
  onClose,
}) {
  const sheetRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isText = !message.mediaUrl;
  const isLocked = message.content === '[Encrypted]' || message.content === '[No private key]';
  const canCopyForward = isText && !isLocked;

  const preview = message.mediaUrl
    ? (message.mediaType === 'video' ? 'Video message' : 'Photo message')
    : (isLocked ? 'Locked message' : (message.content?.slice(0, 80) || ''));

  const actions = [
    {
      key: 'reply',
      label: 'Reply',
      icon: <ReplyIcon />,
      show: true,
      danger: false,
      handler: () => { onReply(); onClose(); },
    },
    {
      key: 'copy',
      label: 'Copy text',
      icon: <CopyIcon />,
      show: canCopyForward,
      danger: false,
      handler: () => { onCopy(); onClose(); },
    },
    {
      key: 'forward',
      label: 'Forward',
      icon: <ForwardIcon />,
      show: canCopyForward,
      danger: false,
      handler: () => { onForward(); onClose(); },
    },
    {
      key: 'pin',
      label: isPinned ? 'Unpin message' : 'Pin message',
      icon: isPinned ? <UnpinIcon /> : <PinIcon />,
      show: true,
      danger: false,
      handler: () => { onPin(!isPinned); onClose(); },
    },
    {
      key: 'delete-everyone',
      label: 'Delete for everyone',
      icon: <TrashIcon />,
      show: isMine,
      danger: true,
      handler: () => { onDelete(true); onClose(); },
    },
    {
      key: 'delete-me',
      label: 'Delete for me',
      icon: <TrashMeIcon />,
      show: true,
      danger: true,
      handler: () => { onDelete(false); onClose(); },
    },
  ].filter((a) => a.show);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onPointerDown={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-surface)',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          animation: 'sheetUp 220ms cubic-bezier(0.32,0.72,0,1) forwards',
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--card-border)', opacity: 0.6 }} />
        </div>

        {/* Message preview */}
        <div style={{
          margin: '8px 16px 4px',
          padding: '10px 14px',
          borderRadius: 12,
          background: 'var(--bg-muted)',
          border: '1px solid var(--card-border)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Message
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview}
          </p>
        </div>

        {/* Action list */}
        <div style={{ padding: '4px 12px 4px' }}>
          {actions.map((action, idx) => (
            <button
              key={action.key}
              onClick={action.handler}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                padding: '13px 12px',
                borderRadius: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: action.danger ? '#ef4444' : 'var(--text-primary)',
                fontSize: 15,
                fontWeight: 500,
                fontFamily: 'inherit',
                transition: 'background 120ms ease',
                borderBottom: idx < actions.length - 1 ? '1px solid var(--card-border)' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = action.danger ? 'rgba(239,68,68,0.06)' : 'var(--bg-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {action.icon}
              </span>
              {action.label}
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <div style={{ padding: '4px 12px 8px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'block',
              width: '100%',
              padding: '13px',
              borderRadius: 14,
              border: 'none',
              background: 'var(--bg-muted)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'background 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-border)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-muted)'; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
