import express from 'express';
import * as Svc from './formFields.service';

const dbg = (...args: any[]) => {
  if (process.env.DEBUG_ADMIN?.toLowerCase() === 'true') {
    // eslint-disable-next-line no-console
    console.log('[admin/form-fields]', ...args);
  }
};

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

const ALLOWED_SCOPES = new Set(['registration', 'profile', 'both']);
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

function validateForCreate(body: any) {
  const errors: string[] = [];
  const out: any = {};

  // key (derive from label if missing) — coerce to string to be robust
  const rawKey = body && body.key != null ? String(body.key) : '';
  const rawLabel = body && body.label != null ? String(body.label) : '';
  const k = sanitizeKey(rawKey || rawLabel);
  dbg('validateForCreate', { rawKey, rawLabel, derivedKey: k });
  if (!k) errors.push('key is required');
  out.key = k;

  // label (coerced)
  const labelStr = body && body.label != null ? String(body.label) : '';
  out.label = (labelStr && labelStr.trim()) || k;

  // scope
  const scope = typeof body.scope === 'string' ? body.scope : 'registration';
  if (!ALLOWED_SCOPES.has(scope)) errors.push(`scope must be one of ${Array.from(ALLOWED_SCOPES).join(', ')}`);
  out.scope = scope;

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

router.post('/form-fields', requireAdmin, async (req, res) => {
  try {
    dbg('POST /form-fields', {
      contentType: req.headers['content-type'],
      keys: Object.keys(req.body || {}),
      sample: (() => {
        const b: any = req.body || {};
        // return a tiny sample of values for quick inspection
        return { key: b?.key, label: b?.label, scope: b?.scope, type: b?.type, write_to: b?.write_to, required: b?.required };
      })(),
    });
    // Fallback: if body arrived as text/plain, try to parse as JSON
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
        dbg('POST /form-fields parsed text body into JSON');
      } catch (e) {
        dbg('POST /form-fields failed to parse text body');
      }
    }
    const payload = validateForCreate(req.body);
    const field = await Svc.create(payload);
    res.status(201).json(field);
  } catch (e: any) {
    const status = e.status || 400;
    res.status(status).json({ error: e.message });
  }
});

router.put('/form-fields/:id', requireAdmin, async (req, res) => {
  try {
    dbg('PUT /form-fields/:id body keys=', Object.keys(req.body || {}));
    if (typeof req.body === 'string') {
      try {
        req.body = JSON.parse(req.body);
        dbg('PUT /form-fields parsed text body into JSON');
      } catch (e) {
        dbg('PUT /form-fields failed to parse text body');
      }
    }
    const payload = validateForUpdate(req.body);
    const field = await Svc.update(req.params.id, payload);
    res.json(field);
  } catch (e: any) {
    const status = e.status || 400;
    res.status(status).json({ error: e.message });
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
