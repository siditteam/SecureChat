import { useState, useRef, useCallback } from 'react';

const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime';

export default function MediaCapture({ onSend, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  const selectFile = useCallback((f) => {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    const type = f.type.startsWith('video/') ? 'video' : 'image';
    setFile(f);
    setMediaType(type);
    setPreview(URL.createObjectURL(f));
  }, [preview]);

  const handleInputChange = (e) => selectFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type.startsWith('image/') || f.type.startsWith('video/'))) selectFile(f);
  };

  const handleSend = async () => {
    if (!file || sending) return;
    setSending(true);
    try {
      await onSend(file, { viewOnce, mediaType });
      if (preview) URL.revokeObjectURL(preview);
      onClose();
    } catch {
      setSending(false);
    }
  };

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setMediaType(null);
  };

  // Close on backdrop click or Escape
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center md:items-center"
      onClick={handleBackdrop}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="w-full max-w-md bg-[#1a2330] rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14 }}>Send Media</h3>
          {file
            ? <button onClick={reset} className="text-xs transition px-2 py-1" style={{ color: 'var(--text-secondary)' }}>Change</button>
            : <div className="w-14" />
          }
        </div>

        {!file ? (
          /* ── Picker area ── */
          <div className="px-4 pb-4 space-y-3">
            {/* Drop zone / gallery picker */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition ${
                dragOver ? 'border-[#00a884] bg-[#00a884]/10' : 'border-[#2a3942] hover:border-[#4a5a62]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => galleryRef.current?.click()}
            >
              <div className="w-16 h-16 bg-[#2a3942] rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#8696a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                  <p style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>Drop a photo or video</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 6 }}>or tap to browse</p>
                </div>
            </div>

            {/* Camera button (uses capture on mobile) */}
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition"
              style={{ background: 'rgba(42,57,66,1)', color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open Camera
            </button>
          </div>
        ) : (
          /* ── Preview + options ── */
          <div className="px-4 pb-4 space-y-3">
            {/* Preview */}
            <div className="rounded-2xl overflow-hidden bg-black relative">
              {mediaType === 'video' ? (
                <video src={preview} controls className="w-full max-h-72 object-contain" />
              ) : (
                <img src={preview} alt="Preview" className="w-full max-h-72 object-contain" />
              )}
              {mediaType === 'video' && (
                  <div className="absolute top-2 left-2 bg-black/60 rounded-full px-2.5 py-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-on-accent, #fff)' }}>
                    <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-on-accent, #fff)' }}>Video</span>
                </div>
              )}
            </div>

            {/* View once toggle */}
            <button
              onClick={() => setViewOnce((v) => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition ${
                viewOnce ? 'bg-[#00a884]/15 border border-[#00a884]/30' : 'bg-[#2a3942] hover:bg-[#3a4a52]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  viewOnce ? 'bg-[#00a884]/20' : 'bg-[#3a4a52]'
                }`}>
                  {viewOnce ? (
                    <svg className="w-4.5 h-4.5 text-[#00a884]" style={{width:'18px',height:'18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5 text-[#8696a0]" style={{width:'18px',height:'18px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </div>
                  <div className="text-left">
                  <p style={viewOnce ? { color: 'var(--accent)', fontSize: 14, fontWeight: 600 } : { color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>
                      View once
                    </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Disappears after opening</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition`} style={viewOnce ? { borderColor: 'rgba(0,169,132,0.9)', background: 'rgba(0,169,132,1)' } : { borderColor: 'rgba(134,150,160,1)' }}>
                {viewOnce && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#fff' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full rounded-xl py-3.5 transition flex items-center justify-center gap-2 text-sm"
              style={{ background: 'var(--accent)', color: 'var(--text-primary)', fontWeight: 700 }}
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-transparent border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.6)', borderTopColor: 'rgba(255,255,255,1)' }} />
                  Sending…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  Send{viewOnce ? ' · View once' : ''}
                </>
              )}
            </button>
          </div>
        )}

        {/* Hidden inputs */}
        <input ref={galleryRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleInputChange} />
        <input ref={cameraRef} type="file" accept={ACCEPTED} capture="environment" className="hidden" onChange={handleInputChange} />
      </div>
    </div>
  );
}
