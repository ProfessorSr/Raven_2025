import React from 'react';

export interface DynamicField {
  key: string;
  label: string;
  type: string; // 'text' | 'password' | 'email' | 'number' | 'date' | 'textarea' | 'checkbox' | 'select' | ...
  required?: boolean;
  options?: string[] | null; // for select
  help_text?: string | null;
}

interface Props {
  fields: DynamicField[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function DynamicForm({ fields, values, onChange }: Props) {
  if (!fields || fields.length === 0) {
    return <p style={{ opacity: 0.7 }}>No dynamic fields to display.</p>;
  }

  const allowedInputTypes = new Set([
    'text',
    'password',
    'email',
    'number',
    'date',
    'datetime-local',
    'time',
    'url',
    'tel',
    'search',
  ]);

  return (
    <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
      {fields.map((f) => {
        const val = values?.[f.key] ?? '';
        const id = `dyn-${f.key}`;
        const t = f.type || 'text';

        // Determine which control to render
        const isSelect = t === 'select' && Array.isArray(f.options);
        const isTextarea = t === 'textarea';
        const isCheckbox = t === 'checkbox';
        const inputType = allowedInputTypes.has(t) ? t : 'text';

        return (
          <div
            key={f.key}
            style={{
              display: 'grid',
              gap: 6,
              border: '1px solid #ccc',
              padding: '8px 12px',
              borderRadius: 6,
            }}
          >
            <label htmlFor={id} style={{ fontWeight: 600 }}>
              {f.label}
              {f.required ? ' *' : ''}
            </label>

            {isSelect ? (
              <select
                id={id}
                value={val}
                required={!!f.required}
                onChange={(e) => onChange(f.key, e.target.value)}
              >
                <option value="">-- Select --</option>
                {f.options!.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : isTextarea ? (
              <textarea
                id={id}
                value={val}
                required={!!f.required}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            ) : isCheckbox ? (
              <input
                id={id}
                type="checkbox"
                checked={!!val}
                onChange={(e) => onChange(f.key, e.target.checked)}
              />
            ) : (
              <input
                id={id}
                type={inputType}
                value={val}
                required={!!f.required}
                onChange={(e) => onChange(f.key, e.target.value)}
              />
            )}

            {f.help_text && (
              <small style={{ opacity: 0.7 }}>{f.help_text}</small>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default DynamicForm;
