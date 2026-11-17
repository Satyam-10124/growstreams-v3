import { Router } from 'express';
import { getPool } from '../services/db.mjs';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT b.*, 
             (SELECT COUNT(*) FROM bounty_submissions s WHERE s.bounty_id = b.id) as submissions_count 
      FROM bounties b 
      ORDER BY b.created_at DESC
    `);
    res.json({ bounties: result.rows });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const idOrSlug = req.params.id;
    let result;
    
    // Check if it's a UUID
    if (idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      result = await pool.query('SELECT b.*, (SELECT COUNT(*) FROM bounty_submissions s WHERE s.bounty_id = b.id) as submissions_count FROM bounties b WHERE id = $1', [idOrSlug]);
    } else {
      result = await pool.query('SELECT b.*, (SELECT COUNT(*) FROM bounty_submissions s WHERE s.bounty_id = b.id) as submissions_count FROM bounties b WHERE slug = $1', [idOrSlug]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bounty not found' });
    }
    res.json({ bounty: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET Comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM bounty_comments WHERE bounty_id = $1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ comments: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST Comments
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { author, text } = req.body;
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO bounty_comments (bounty_id, author, text) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, author, text]
    );
    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// GET Submissions
router.get('/:id/submissions', async (req, res, next) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM bounty_submissions WHERE bounty_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ submissions: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST Submissions
router.post('/:id/submissions', async (req, res, next) => {
  try {
    const { wallet_address, submission_url, notes } = req.body;
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO bounty_submissions (bounty_id, wallet_address, submission_url, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, wallet_address, submission_url, notes]
    );
    res.status(201).json({ submission: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
