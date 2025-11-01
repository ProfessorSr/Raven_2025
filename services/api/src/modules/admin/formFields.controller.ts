import express from 'express';
import * as Svc from './formFields.service';

export const router = express.Router();
// Ensure body is parsed for this router regardless of app-level middleware order
router.use(express.json({ limit: '1mb' }));
router.use(express.urlencoded({ extended: true }));
router.use(express.text({ type: 'text/plain' }));

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return res.status(500).json({ error: 'ADMIN_API_TOKEN not configured' });
  const got = req.header('x-admin-token');
  if (!got || got !== expected) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

const ALLOWED_SCOPES = new Set(['registration', 'profile', 'login']);
const ALLOWED_TYPES = new Set(['text', 'textarea', 'email', 'number', 'select', 'checkbox', 'date']);
const ALLOWED_WRITE_TO = new Set(['core', 'attributes']);

function sanitizeKey(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function validateScopesArray(input: any): string[] {
  if (!Array.isArray(input)) return [];
  const vals = input
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean)
    .filter((s) => ALLOWED_SCOPES.has(s));
  // de-duplicate
  return Array.from(new Set(vals));
}

function validateForCreate(body: any) {
  const errors: string[] = [];
  const out: any = {};

  // key (derive from label if missing) — coerce to string to be robust
  const rawKey = body && body.key != null ? String(body.key) : '';
  const rawLabel = body && body.label != null ? String(body.label) : '';
  const k = sanitizeKey(rawKey || rawLabel);
  if (!k) errors.push('key is required');
  out.key = k;

  // label (coerced)
  const labelStr = body && body.label != null ? String(body.label) : '';
  out.label = (labelStr && labelStr.trim()) || k;

  // scope (REQUIRED)
  if (typeof body.scope !== 'string') {
    errors.push('scope is required');
  } else if (!ALLOWED_SCOPES.has(body.scope)) {
    errors.push(`scope must be one of ${Array.from(ALLOWED_SCOPES).join(', ')}`);
  } else {
    out.scope = body.scope;
  }

  // type
  const type = typeof body.type === 'string' ? body.type : 'text';
  if (!ALLOWED_TYPES.has(type)) errors.push(`type must be one of ${Array.from(ALLOWED_TYPES).join(', ')}`);
  out.type = type;

  // write_to
  const write_to = typeof body.write_to === 'string' ? body.write_to : 'attributes';
  if (!ALLOWED_WRITE_TO.has(write_to)) errors.push(`write_to must be one of ${Array.from(ALLOWED_WRITE_TO).join(', ')}`);
  out.write_to = write_to;

  // required
  out.required = Boolean(body.required);

  // options (only for select)
  if (type === 'select') {
    if (body.options == null) {
      out.options = [];
    } else if (Array.isArray(body.options)) {
      out.options = body.options;
    } else {
      errors.push('options must be an array when type is select');
    }
  } else {
    out.options = null;
  }

  // optional fields
  if (body.help_text != null && typeof body.help_text !== 'string') errors.push('help_text must be a string');
  out.help_text = body.help_text ?? null;

  if (body.order_index != null && typeof body.order_index !== 'number') errors.push('order_index must be a number');
  out.order_index = body.order_index ?? null;

  if (errors.length) {
    const err = new Error(errors.join('; '));
    (err as any).status = 400;
    throw err;
  }
  return out;
}

function validateForUpdate(body: any) {
  const errors: string[] = [];
  const out: any = {};

  if (body.key !== undefined) {
    const k = sanitizeKey(String(body.key ?? ''));
    if (!k) errors.push('key cannot be empty');
    out.key = k;
  }
  if (body.label !== undefined) {
    if (body.label != null && typeof body.label !== 'string') errors.push('label must be a string');
    out.label = body.label ?? null;
  }
  if (body.scope !== undefined) {
    if (typeof body.scope !== 'string' || !ALLOWED_SCOPES.has(body.scope)) errors.push(`scope must be one of ${Array.from(ALLOWED_SCOPES).join(', ')}`);
    out.scope = body.scope;
  }
  if (body.type !== undefined) {
    if (typeof body.type !== 'string' || !ALLOWED_TYPES.has(body.type)) errors.push(`type must be one of ${Array.from(ALLOWED_TYPES).join(', ')}`);
    out.type = body.type;
  }
  if (body.write_to !== undefined) {
    if (typeof body.write_to !== 'string' || !ALLOWED_WRITE_TO.has(body.write_to)) errors.push(`write_to must be one of ${Array.from(ALLOWED_WRITE_TO).join(', ')}`);
    out.write_to = body.write_to;
  }
  if (body.required !== undefined) out.required = Boolean(body.required);

  if (body.options !== undefined) {
    if (out.type && out.type !== 'select') {
      out.options = null;
    } else {
      if (body.options == null) out.options = [];
      else if (Array.isArray(body.options)) out.options = body.options;
      else errors.push('options must be an array when type is select');
    }
  }
  if (body.help_text !== undefined) {
    if (body.help_text != null && typeof body.help_text !== 'string') errors.push('help_text must be a string');
    out.help_text = body.help_text ?? null;
  }
  if (body.order_index !== undefined) {
    if (body.order_index != null && typeof body.order_index !== 'number') errors.push('order_index must be a number');
    out.order_index = body.order_index ?? null;
  }

  if (errors.length) {
    const err = new Error(errors.join('; '));
    (err as any).status = 400;
    throw err;
  }
  return out;
}

// ROUTES
router.get('/form-fields', async (req, res) => {
  try {
    const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;
    const fields = await Svc.list(scope);
    res.json({ fields });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /form-fields expects body shape: { key?, label?, scope, type?, write_to?, required?, options?, help_text?, order_index? }
router.post('/form-fields', requireAdmin, async (req, res) => {
  try {
    // Fallback: if body arrived as text/plain, try to parse as JSON
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    }
    if (process.env.DEBUG_ADMIN === '1') {
      console.log('[admin/form-fields] POST /form-fields', {
        contentType: req.headers['content-type'],
        keys: Object.keys(req.body || {}),
        sample: {
          key: req.body?.key,
          label: req.body?.label,
          scope: req.body?.scope,
          type: req.body?.type,
        },
      });
    }
    const payload = validateForCreate(req.body);
    if (!payload.scope) {
      return res.status(400).json({ error: 'scope is required' });
    }
    const field = await Svc.create(payload);
    res.status(201).json(field);
  } catch (e: any) {
    const status = e.status || 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/form-fields/reorder', requireAdmin, async (req, res) => {
  try {
    if (typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); } catch {}
    }

    if (process.env.DEBUG_ADMIN === '1') {
      console.log('[admin/form-fields] POST /form-fields/reorder', {
        contentType: req.headers['content-type'],
        keys: Object.keys(req.body || {}),
        sample: Array.isArray(req.body?.items) ? req.body.items[0] : undefined,
      });
    }

    const scope = typeof req.query.scope === 'string' ? req.query.scope : (typeof req.body?.scope === 'string' ? req.body.scope : undefined);
    if (!scope || !ALLOWED_SCOPES.has(scope)) {
      return res.status(400).json({ error: "scope must be 'registration' | 'profile' | 'login'" });
    }

    // New shape: { items: [{ id, order_index }], scope }
    if (Array.isArray(req.body?.items)) {
      const items = req.body.items.map((it: any) => ({ id: String(it.id), order_index: Number(it.order_index) }));
      if (items.some((it: any) => !it.id || Number.isNaN(it.order_index))) {
        return res.status(400).json({ error: 'items[].id and items[].order_index are required' });
      }
      await Svc.reorderWithIndex(items, scope);
      return res.json({ ok: true });
    }

    // Legacy shape: { ids: string[] } with implicit 0,10,20…
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((x: any) => String(x)) : null;
    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: 'Provide items[] or ids[]' });
    }
    await Svc.reorder(ids, scope);
    return res.json({ ok: true });
  } catch (e: any) {
    const status = e.status || 400;
    return res.status(status).json({ error: e.message || 'Reorder failed' });
  }
});

router.put('/form-fields/:id', requireAdmin, async (req, res) => {
  try {
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
      } catch {}
    }
    if (process.env.DEBUG_ADMIN === '1') {
      console.log('[admin/form-fields] PUT /form-fields/:id', {
        id: req.params.id,
        contentType: req.headers['content-type'],
        keys: Object.keys(req.body || {}),
        scope: req.body?.scope,
      });
    }

    // If client passes `scopes: string[]`, interpret this as a request to synchronize
    // this field's presence across scopes (add missing, remove unchecked).
    if (Array.isArray((req.body as any)?.scopes)) {
      const desired = validateScopesArray((req.body as any).scopes);
      if (desired.length === 0) {
        return res.status(400).json({ error: 'scopes[] must contain at least one of registration, login, profile' });
      }

      // We need the canonical key to match across scopes. If payload.key present, use it; else fetch current to discover key.
      let keyForSync: string | undefined = undefined;
      if (typeof (req.body as any).key === 'string') {
        keyForSync = sanitizeKey(String((req.body as any).key));
      }
      if (!keyForSync) {
        // Try to determine key by finding this id in any scope list
        const scopesToCheck = Array.from(ALLOWED_SCOPES);
        for (const sc of scopesToCheck) {
          try {
            const list = await Svc.list(sc);
            const hit = (list || []).find((f: any) => f.id === req.params.id);
            if (hit?.key) { keyForSync = hit.key; break; }
          } catch {}
        }
      }
      if (!keyForSync) {
        return res.status(400).json({ error: 'Unable to determine field key for sync. Provide `key` in body or update the field first.' });
      }

      // Discover existing scopes for this key
      const existingByScope: Record<string, any | undefined> = {};
      for (const sc of ALLOWED_SCOPES) {
        try {
          const list = await Svc.list(sc);
          existingByScope[sc] = (list || []).find((f: any) => f.key === keyForSync);
        } catch {}
      }

      const have = Object.entries(existingByScope)
        .filter(([, v]) => !!v)
        .map(([k]) => k);

      const toAdd = desired.filter((s) => !have.includes(s));
      const toRemove = have.filter((s) => !desired.includes(s));

      // Create missing placements
      for (const sc of toAdd) {
        await Svc.create({
          key: keyForSync,
          label: (req.body as any)?.label ?? keyForSync,
          scope: sc,
          type: (req.body as any)?.type || (existingByScope[have[0] || 'registration']?.type) || 'text',
          write_to: (req.body as any)?.write_to || 'attributes',
          required: Boolean((req.body as any)?.required),
          options: Array.isArray((req.body as any)?.options) ? (req.body as any).options : undefined,
          help_text: (req.body as any)?.help_text ?? undefined,
        });
      }

      // Remove unchecked placements
      for (const sc of toRemove) {
        const row = existingByScope[sc];
        if (row?.id) {
          await Svc.remove(row.id);
        }
      }

      return res.json({ ok: true, key: keyForSync, added: toAdd, removed: toRemove });
    }

    const payload = validateForUpdate(req.body);
    const field = await Svc.update(req.params.id, payload);
    res.json(field);
  } catch (e: any) {
    const status = e.status || 400;
    res.status(status).json({ error: e.message });
  }
});

router.post('/form-fields/sync-scopes', requireAdmin, async (req, res) => {
  try {
    if (typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); } catch {}
    }
    const keyRaw = (req.body && req.body.key != null) ? String(req.body.key) : '';
    const key = sanitizeKey(keyRaw);
    const desired = validateScopesArray((req.body as any)?.scopes);
    if (!key) return res.status(400).json({ error: 'key is required' });
    if (!desired.length) return res.status(400).json({ error: 'scopes[] must contain at least one of registration, login, profile' });

    // Discover existing by key
    const existingByScope: Record<string, any | undefined> = {};
    for (const sc of ALLOWED_SCOPES) {
      try {
        const list = await Svc.list(sc);
        existingByScope[sc] = (list || []).find((f: any) => f.key === key);
      } catch {}
    }

    const have = Object.entries(existingByScope)
      .filter(([, v]) => !!v)
      .map(([k]) => k);

    const toAdd = desired.filter((s) => !have.includes(s));
    const toRemove = have.filter((s) => !desired.includes(s));

    for (const sc of toAdd) {
      await Svc.create({
        key,
        label: (req.body as any)?.label ?? key,
        scope: sc,
        type: (req.body as any)?.type || (existingByScope[have[0] || 'registration']?.type) || 'text',
        write_to: (req.body as any)?.write_to || 'attributes',
        required: Boolean((req.body as any)?.required),
        options: Array.isArray((req.body as any)?.options) ? (req.body as any).options : undefined,
        help_text: (req.body as any)?.help_text ?? undefined,
      });
    }

    for (const sc of toRemove) {
      const row = existingByScope[sc];
      if (row?.id) await Svc.remove(row.id);
    }

    return res.json({ ok: true, key, added: toAdd, removed: toRemove });
  } catch (e: any) {
    const status = e.status || 400;
    res.status(status).json({ error: e.message || 'Sync failed' });
  }
});

router.delete('/form-fields/:id', requireAdmin, async (req, res) => {
  try {
    const out = await Svc.remove(req.params.id);
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});
