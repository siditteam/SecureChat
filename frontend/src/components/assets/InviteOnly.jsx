import React from 'react'

export default function InviteOnly({ width = 600, height = 150, className = '', ariaLabel = 'Invite-only', responsive = false, style = {} }) {
  const svgStyle = responsive ? { width: '100%', height: 'auto', maxWidth: width, ...style } : style;
  const svgProps = responsive ? { style: svgStyle } : { width, height, style: svgStyle };
  return (
    <svg viewBox="0 0 1200 300" {...svgProps} className={className} role="img" aria-label={ariaLabel} focusable="false" preserveAspectRatio="xMidYMid meet">
      <title>{ariaLabel}</title>
      <rect width="100%" height="100%" fill="#0f172a" rx="20"/>
      <g transform="translate(60,40)">
        <g transform="translate(0,10)">
          <circle cx="70" cy="70" r="70" fill="url(#g1)" opacity="0.95" />
          <g transform="translate(35,40)" fill="#04263b">
            <rect x="-12" y="-18" width="40" height="28" rx="6" />
            <rect x="-2" y="-6" width="20" height="8" rx="3" fill="#fff" opacity="0.85"/>
          </g>
        </g>
        <g transform="translate(180,40)">
          <text x="0" y="40" fontFamily="Inter, system-ui" fontSize="44" fill="#fff" fontWeight="700">Invite-only.</text>
          <text x="0" y="90" fontFamily="Inter, system-ui" fontSize="22" fill="#9aa6b2">Access by invite ensures a trusted community.</text>
        </g>
      </g>
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0" stopColor="#6EE7B7"/>
          <stop offset="1" stopColor="#3B82F6"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
