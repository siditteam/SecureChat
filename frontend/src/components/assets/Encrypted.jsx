import React from 'react'

export default function Encrypted({ width = 400, height = 100, className = '', ariaLabel = 'Encrypted', responsive = false, style = {} }) {
  const svgStyle = responsive ? { width: '100%', height: 'auto', maxWidth: width, ...style } : style;
  const svgProps = responsive ? { style: svgStyle } : { width, height, style: svgStyle };
  return (
    <svg viewBox="0 0 800 200" {...svgProps} className={className} role="img" aria-label={ariaLabel} focusable="false" preserveAspectRatio="xMidYMid meet">
      <title>{ariaLabel}</title>
      <rect width="100%" height="100%" fill="#071023" rx="14"/>
      <g transform="translate(30,20)">
        <g>
          <rect x="0" y="10" width="120" height="100" rx="12" fill="url(#g2)" opacity="0.95" />
          <rect x="30" y="30" width="60" height="40" rx="6" fill="#fff" opacity="0.95" />
          <rect x="40" y="44" width="40" height="8" rx="3" fill="#071023" />
        </g>
        <g transform="translate(170,40)">
          <text x="0" y="30" fontFamily="Inter, system-ui" fontSize="40" fill="#fff" fontWeight="700">Encrypted.</text>
          <text x="0" y="70" fontFamily="Inter, system-ui" fontSize="18" fill="#9fb0bf">End-to-end encryption keeps conversations private.</text>
        </g>
      </g>
      <defs>
        <linearGradient id="g2" x1="0" x2="1">
          <stop offset="0" stopColor="#7C3AED"/>
          <stop offset="1" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
