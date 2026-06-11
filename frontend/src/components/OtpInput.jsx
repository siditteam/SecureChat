import { useRef, useState, useCallback, useEffect } from 'react';

export default function OtpInput({ length = 6, onComplete, disabled, reset }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const refs = useRef([]);

  // Allow parent to reset boxes via changing the `reset` prop
  useEffect(() => {
    setValues(Array(length).fill(''));
    refs.current[0]?.focus();
  }, [reset, length]);

  const focus = (i) => refs.current[i]?.focus();

  const update = useCallback((next) => {
    setValues(next);
    const joined = next.join('');
    if (joined.length === length) onComplete?.(joined);
  }, [length, onComplete]);

  const handleChange = (e, i) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[i] = digit;
    update(next);
    if (digit && i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...values];
      if (next[i]) {
        next[i] = '';
        update(next);
      } else if (i > 0) {
        next[i - 1] = '';
        update(next);
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1);
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      focus(i + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    const next = Array(length).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    update(next);
    focus(Math.min(text.length, length - 1));
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={val}
          disabled={disabled}
          autoFocus={i === 0}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-11 h-12 text-center text-xl font-bold rounded-xl outline-none transition-all duration-150 disabled:opacity-40 caret-transparent"
          style={{
            background: 'var(--bg-muted)',
            color: 'var(--text-primary)',
            border: `2px solid ${val ? 'var(--accent)' : 'var(--card-border)'}`,
            boxShadow: val ? '0 0 0 3px rgba(10,163,163,0.12)' : 'none',
          }}
        />
      ))}
    </div>
  );
}
