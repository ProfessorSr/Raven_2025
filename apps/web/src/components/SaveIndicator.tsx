import React from 'react';
import { AutosaveStatus } from '@/hooks/useAutosave';
export default function SaveIndicator({ status }: { status: AutosaveStatus }) {
  const map: Record<AutosaveStatus, { text: string; color: string }> = {
    idle:  { text: '', color: 'transparent' },
    saving:{ text: 'Saving…', color: '#fde68a' },
    saved: { text: 'Saved',   color: '#bbf7d0' },
    error: { text: 'Save failed', color: '#fecaca' },
  };
  const s = map[status];
  if (!s.text) return null;
  return (<span style={{ background: s.color, border: '1px solid #e5e7eb', padding: '2px 6px', borderRadius: 6, fontSize: 12 }}>{s.text}</span>);
}
