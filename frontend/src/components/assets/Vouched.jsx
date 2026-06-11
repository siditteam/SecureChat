import React from 'react'

export default function Vouched({ width = 450, height = 120, className = '', ariaLabel = 'Vouched', responsive = false, style = {} }) {
  const svgStyle = responsive ? { width: '100%', height: 'auto', maxWidth: width, ...style } : style;
  const svgProps = responsive ? { style: svgStyle } : { width, height, style: svgStyle };
  return (
    <svg viewBox="0 0 900 220" {...svgProps} className={className} role="img" aria-label={ariaLabel} focusable="false" preserveAspectRatio="xMidYMid meet">
      <title>{ariaLabel}</title>
      <rect width="100%" height="100%" fill="#041024" rx="12"/>
      <g transform="translate(40,20)">
        <g>
          <polygon points="0,60 40,20 80,60 80,120 0,120" fill="#ffd166" stroke="#ffb703" strokeWidth="2" />
          <circle cx="40" cy="85" r="12" fill="#04263b" />
          <path d="M28 83 l6 6 l18 -18" stroke="#04263b" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
        <g transform="translate(120,40)">
          <text x="0" y="30" fontFamily="Inter, system-ui" fontSize="42" fill="#fff" fontWeight="700">Vouched.</text>
          <text x="0" y="72" fontFamily="Inter, system-ui" fontSize="18" fill="#9fb0bf">Membership backed by real vouches and reputation.</text>
        </g>
      </g>
    </svg>
  )
}
