import express from 'express';
import { handleGitHubWebhook } from '../../services/evaluator-webhook.service.mjs';
import { queryAll } from '../../services/db.mjs';

const router = express.Router();

router.post('/webhooks/github', express.json(), async (req, res) => {
  try {
    const result = await handleGitHubWebhook(req.body);
    res.json(result);
  } catch (error) {
    console.error('[burn API webhook error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/streams/:recipient', async (req, res) => {
  const { recipient } = req.params;
  try {
    const rows = await queryAll(
      `SELECT * FROM public.streams WHERE recipient = $1 AND status = 'active' ORDER BY started_at DESC`,
      [recipient]
    );
    res.json({ streams: rows });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
