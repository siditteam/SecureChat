import React from 'react'

export default function TaglineBanner({ width = 1200, height = 220, className = '', ariaLabel = 'The network grows at the speed of trust', responsive = false, style = {} }) {
  const svgStyle = responsive ? { width: '100%', height: 'auto', maxWidth: width, ...style } : style;
  const svgProps = responsive ? { style: svgStyle } : { width, height, style: svgStyle };
  return (
    <svg viewBox="0 0 1600 300" {...svgProps} className={className} role="img" aria-label={ariaLabel} focusable="false" preserveAspectRatio="xMidYMid meet">
      <title>{ariaLabel}</title>
      <rect width="100%" height="100%" fill="#040617"/>
      <g transform="translate(80,40)">
        <text x="0" y="80" fontFamily="Inter, system-ui" fontSize="56" fill="url(#b1)" fontWeight="800">The network grows at the speed of trust.</text>
        <text x="0" y="140" fontFamily="Inter, system-ui" fontSize="20" fill="#95a5b6">Invite-only. Encrypted. Vouched. Built for people who trade trust, not attention.</text>
      </g>
      <g transform="translate(1060,40)">
        <rect x="0" y="0" width="420" height="180" rx="12" fill="#071428" opacity="0.6" />
        <g transform="translate(24,24)">
          <circle cx="40" cy="40" r="36" fill="#0ea5a4" />
          <circle cx="40" cy="40" r="16" fill="#04263b" />
          <text x="96" y="48" fontFamily="Inter, system-ui" fontSize="22" fill="#fff" fontWeight="700">Invite-only</text>
          <text x="96" y="80" fontFamily="Inter, system-ui" fontSize="16" fill="#a8b6c3">Encrypted • Vouched</text>
        </g>
      </g>
      <defs>
        <linearGradient id="b1" x1="0" x2="1">
          <stop offset="0" stopColor="#06b6d4"/>
          <stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
