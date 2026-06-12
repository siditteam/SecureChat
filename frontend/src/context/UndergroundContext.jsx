import { createContext, useContext, useState, useEffect, useRef } from 'react';

const UndergroundContext = createContext(null);
const LS_KEY = 'unddr:underground';

function applyTheme(on) {
  if (on) document.documentElement.classList.add('underground');
  else document.documentElement.classList.remove('underground');
}

export function UndergroundProvider({ children }) {
  const [underground, setUnderground] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
  });
  const [ritualing, setRitualing] = useState(false);
  const ritualTimer = useRef(null);

  useEffect(() => { applyTheme(underground); }, [underground]);

  const toggleUnderground = () => {
    const next = !underground;
    if (next) {
      setRitualing(true);
      clearTimeout(ritualTimer.current);
      ritualTimer.current = setTimeout(() => setRitualing(false), 2600);
    }
    setUnderground(next);
    try { localStorage.setItem(LS_KEY, String(next)); } catch { /* ignore */ }
    applyTheme(next);
  };

  useEffect(() => () => clearTimeout(ritualTimer.current), []);

  return (
    <UndergroundContext.Provider value={{ underground, toggleUnderground, ritualing }}>
      {children}
    </UndergroundContext.Provider>
  );
}

export const useUnderground = () => useContext(UndergroundContext);
