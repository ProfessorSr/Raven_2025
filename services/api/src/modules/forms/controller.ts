import express from 'express';
import * as FormsService from './service';

export const router = express.Router();

function noStore(res: express.Response) {
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

async function getForScope(
  scope: 'registration' | 'profile' | 'login',
  res: express.Response
) {
  try {
    const fields = await FormsService.getFields(scope);
    const sorted = Array.isArray(fields)
      ? [...fields].sort(
          (a: any, b: any) => (a?.order_index ?? 0) - (b?.order_index ?? 0)
        )
      : [];
    noStore(res);
    res.json({ fields: sorted });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'failed to load fields' });
  }
}

// Public form definitions per page
router.get('/registration', async (_req, res) => {
  await getForScope('registration', res);
});

router.get('/profile', async (_req, res) => {
  await getForScope('profile', res);
});

// NEW: login form fields (optional extras like remember_me, promo opt-in, etc.)
router.get('/login', async (_req, res) => {
  await getForScope('login', res);
});
