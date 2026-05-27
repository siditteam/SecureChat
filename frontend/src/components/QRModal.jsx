import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRModal({ user, onClose }) {
  const inviteUrl = `${window.location.origin}/add/${user.username}`;
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
    >
      <div className="bg-[#202c33] rounded-2xl p-6 w-full max-w-xs shadow-2xl flex flex-col items-center gap-5">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <h3 className="text-white font-semibold text-base">My invite QR</h3>
          <button
            onClick={onClose}
            className="text-[#8696a0] hover:text-white p-1 rounded-full hover:bg-[#2a3942] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR code */}
        <div className="bg-white p-4 rounded-xl shadow-inner">
          <QRCodeSVG
            value={inviteUrl}
            size={180}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Username label */}
        <div className="text-center">
          <p className="text-white font-semibold text-lg">@{user.username}</p>
          <p className="text-[#8696a0] text-xs mt-0.5">Scan to send a friend request</p>
        </div>

        {/* Invite link */}
        <div className="w-full bg-[#2a3942] rounded-xl px-3 py-2.5 flex items-center gap-2 min-w-0">
          <p className="text-[#8696a0] text-xs truncate flex-1 font-mono">{inviteUrl}</p>
          <button
            onClick={copy}
            className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
              copied ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-[#3a4a52] text-white hover:bg-[#4a5a62]'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
