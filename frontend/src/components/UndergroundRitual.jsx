import { useState, useEffect } from 'react';
import { useUnderground } from '../context/UndergroundContext';

const F = "'Space Grotesk', sans-serif";
const TEAL = '#00C9AA';

export default function UndergroundRitual() {
  const { ritualing } = useUnderground();
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (ritualing) {
      setVisible(true);
      setFading(false);
      const t = setTimeout(() => setFading(true), 1900);
      return () => clearTimeout(t);
    } else {
      setFading(true);
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [ritualing]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#020B10',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: F,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.65s ease',
    }}>
      {/* Pulse rings */}
      <div style={{ position: 'relative', width: 110, height: 110, marginBottom: 44, flexShrink: 0 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: `1px solid rgba(0,201,170,${0.5 - i * 0.1})`,
            animation: `ug-ring 1.6s ease-out ${i * 0.3}s infinite`,
          }} />
        ))}
        {/* Center mark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(0,201,170,0.12)',
          border: `1.5px solid ${TEAL}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px rgba(0,201,170,0.25)`,
        }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: TEAL }}>U</span>
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', animation: 'ug-text 0.6s ease 0.3s both' }}>
        <p style={{
          fontSize: 10, letterSpacing: '0.35em', fontWeight: 700, textTransform: 'uppercase',
          color: 'rgba(0,201,170,0.45)', marginBottom: 12,
        }}>
          underground mode
        </p>
        <p style={{
          fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em',
          color: TEAL, margin: 0,
        }}>
          Going underground.
        </p>
        <p style={{
          fontSize: 12, color: 'rgba(0,201,170,0.3)', marginTop: 14,
          letterSpacing: '0.05em', animation: 'ug-text 0.5s ease 0.8s both',
        }}>
          Privacy enforced&nbsp;&nbsp;·&nbsp;&nbsp;Messages expire in 24h
        </p>
      </div>
    </div>
  );
}
