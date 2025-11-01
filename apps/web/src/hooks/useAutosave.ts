import * as React from 'react';
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export function useAutosave<T>(value: T, onSave: (v: T) => Promise<void> | void, delay = 800) {
  const [status, setStatus] = React.useState<AutosaveStatus>('idle');
  const timer = React.useRef<number | null>(null);
  const lastJson = React.useRef<string>(JSON.stringify(value));
  React.useEffect(() => {
    const json = JSON.stringify(value);
    if (json === lastJson.value) return;
    lastJson.value = json;
    if (timer.current) window.clearTimeout(timer.current);
    setStatus('idle');
    timer.current = window.setTimeout(async () => {
      try { setStatus('saving'); await onSave(value); setStatus('saved'); window.setTimeout(() => setStatus('idle'), 1200); }
      catch { setStatus('error'); }
    }, delay) as unknown as number;
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [value, onSave, delay]);
  return status;
}
