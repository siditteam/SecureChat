import { useEffect, useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function daysUntil(date) {
  return Math.ceil((new Date(date) - Date.now()) / 86_400_000);
}

export default function QRModal({ user, onClose }) {
  const overlayRef = useRef(null);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [copied, setCopied] = useState('');

  const onProbation = user?.accountStatus === 'probation';
  const tokens = user?.inviteTokens ?? 0;
  const probationDays = user?.probationEndsAt ? daysUntil(user.probationEndsAt) : 0;

  const loadInvites = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/invites/mine`);
      setInvites(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadInvites(); }, [loadInvites]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const generate = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const { data } = await axios.post(`${API}/invites/generate`);
      await loadInvites();
      // Optimistically reflect token decrement in UI
      if (user) user.inviteTokens = Math.max(0, (user.inviteTokens ?? 1) - 1);
    } catch (e) {
      setGenError(e.response?.data?.message || 'Failed to generate invite.');
    } finally {
      setGenerating(false);
    }
  };

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const share = async (url, username) => {
    try {
      await navigator.share({
        title: `Join me on Unddr`,
        text: `${username} is inviting you to Unddr — invite-only, end-to-end encrypted.`,
        url,
      });
    } catch { /* cancelled */ }
  };

  const activeInvites = invites.filter((i) => i.status === 'active');
  const canShare = typeof navigator.share === 'function';

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
    >
      <div className="bg-ink-800 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-white font-semibold text-base">Invite someone</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {onProbation
                ? `Unlocks in ${probationDays} day${probationDays === 1 ? '' : 's'}`
                : `${tokens} invite token${tokens === 1 ? '' : 's'} remaining`}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Probation state */}
          {onProbation && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 text-center space-y-1">
              <p className="text-primary-400 font-semibold text-sm">You're still in your first week</p>
              <p className="text-white/40 text-xs">
                Invite tokens unlock {probationDays <= 0 ? 'soon' : `in ${probationDays} day${probationDays === 1 ? '' : 's'}`}.
                Enjoy settling in.
              </p>
            </div>
          )}

          {/* No tokens left */}
          {!onProbation && tokens === 0 && activeInvites.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-white/50 text-sm">You've used both invite tokens.</p>
              <p className="text-white/30 text-xs mt-1">Each member gets 2 lifetime invites.</p>
            </div>
          )}

          {/* Generate button */}
          {!onProbation && tokens > 0 && (
            <div className="space-y-2">
              <button
                onClick={generate}
                disabled={generating}
                className="w-full bg-primary-500 hover:bg-primary-400 text-ink-950 font-semibold rounded-xl py-3 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {generating
                  ? <><span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />Generating…</>
                  : <>Generate invite link — {tokens} left</>
                }
              </button>
              {genError && <p className="text-error text-xs text-center">{genError}</p>}
            </div>
          )}

          {/* Active invite QR */}
          {!loading && activeInvites.length > 0 && (
            <div className="space-y-3">
              {activeInvites.map((inv) => {
                const url = `${window.location.origin}/invite/${inv.code}`;
                return (
                  <div key={inv.code} className="bg-ink-900 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-xl ring-4 ring-primary-500/20">
                        <QRCodeSVG value={url} size={160} level="M" includeMargin={false} />
                      </div>
                    </div>

                    <div className="bg-ink-800 rounded-lg px-3 py-2 flex items-center gap-2 border border-white/10">
                      <p className="text-white/40 text-xs truncate flex-1 font-mono">{url}</p>
                      <button
                        onClick={() => copy(url, inv.code)}
                        className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                          copied === inv.code ? 'bg-success/20 text-success' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {copied === inv.code ? 'Copied!' : 'Copy'}
                      </button>
                    </div>

                    {canShare && (
                      <button
                        onClick={() => share(url, user.username)}
                        className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl py-2.5 text-sm transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Share invite
                      </button>
                    )}

                    <p className="text-white/25 text-[10px] text-center">
                      One-time use · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past invites */}
          {invites.filter((i) => i.status !== 'active').length > 0 && (
            <div className="space-y-1.5">
              <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider">Past invites</p>
              {invites.filter((i) => i.status !== 'active').map((inv) => (
                <div key={inv.code} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-lg">
                  <span className="text-white/40 text-xs font-mono">{inv.code.slice(0, 8)}…</span>
                  <div className="flex items-center gap-2">
                    {inv.usedBy && <span className="text-white/50 text-xs">→ @{inv.usedBy.username}</span>}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      inv.status === 'used' ? 'bg-success/20 text-success' :
                      inv.status === 'expired' ? 'bg-white/10 text-white/30' :
                      'bg-error/20 text-error'
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-white/20 border-t-primary-400 rounded-full animate-spin" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
