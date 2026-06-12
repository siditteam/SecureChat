import React, { useEffect, useState } from 'react';

export default function LoadingOverlay({ message = 'Quieting the room…', show = true, exitMs = 420 }) {
  const [visible, setVisible] = useState(Boolean(show));
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setExiting(false);
      return;
    }
    // trigger exit animation then hide
    setExiting(true);
    const id = setTimeout(() => {
      setVisible(false);
      setExiting(false);
    }, exitMs + 20);
    return () => clearTimeout(id);
  }, [show, exitMs]);

  if (!visible) return null;

  return (
    <div className={`loading-overlay ${exiting ? 'exiting' : ''}`} role="status" aria-live="polite">
      <div className="loading-center">
        <svg className="loading-logo" viewBox="0 0 100 100" aria-hidden>
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-strong)" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="22" fill="url(#g)" className="logo-core" />
          <g className="logo-rings" stroke="url(#g)" strokeWidth="2" fill="none">
            <circle cx="50" cy="50" r="30" />
            <circle cx="50" cy="50" r="40" />
          </g>
          <g className="logo-dots" fill="var(--accent)">
            <circle cx="50" cy="12" r="3" />
            <circle cx="88" cy="50" r="3" />
            <circle cx="50" cy="88" r="3" />
            <circle cx="12" cy="50" r="3" />
          </g>
        </svg>

        <div className="loading-text">
          <div className="loading-title">UNDDR</div>
          <div className="loading-sub">{message}</div>
        </div>
      </div>
      <div className="loading-bottom">
        <div className="pulse" />
        <div className="pulse" />
        <div className="pulse" />
      </div>
    </div>
  );
}
