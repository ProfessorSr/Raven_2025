import express from 'express';
import * as FormsService from './service';

export const router = express.Router();

router.get('/registration', async (_req, res) => {
  try {
    const fields = await FormsService.getFields('registration');
    res.json({ fields });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/profile', async (_req, res) => {
  try {
    const fields = await FormsService.getFields('profile');
    res.json({ fields });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
