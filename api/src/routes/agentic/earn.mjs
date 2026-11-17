import express from 'express';
import { query, queryOne } from '../../services/db.mjs';
import { command } from '../../sails-client.mjs';
import { createTreasuryStream } from '../../services/sails.service.mjs';

const router = express.Router();

router.get('/bounties', async (req, res) => {
  const { wallet } = req.query;
  try {
    const { rows } = await query(`SELECT * FROM public.agent_bounties WHERE status = 'open' ORDER BY created_at DESC`);
    
    // If a wallet is passed, annotate which bounties this wallet already claimed
    if (wallet) {
      const { rows: claims } = await query(
        `SELECT bounty_id FROM public.bounty_claims WHERE claimer = $1`,
        [wallet]
      );
      const claimedSet = new Set(claims.map(c => c.bounty_id));
      const annotated = rows.map(b => ({ ...b, wallet_claimed: claimedSet.has(b.id) }));
      return res.json(annotated);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('[earn API]', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// B3 fix: validate that id is a valid UUID before passing to DB
router.post('/bounties/:id/claim', async (req, res) => {
  const { id } = req.params;
  const { walletAddress } = req.body;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid bounty ID format' });
  }
  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress required' });
  }

  let finalAddress = walletAddress;
  try {
    const { decodeAddress } = await import('@polkadot/util-crypto');
    const { u8aToHex, isHex, hexToU8a } = await import('@polkadot/util');
    
    if (walletAddress.startsWith('0x') && walletAddress.length === 42) {
      finalAddress = '0x' + walletAddress.slice(2).padStart(64, '0');
    } else if (isHex(walletAddress)) {
      let bytes = hexToU8a(walletAddress);
      if (bytes.length > 32) bytes = bytes.slice(0, 32);
      if (bytes.length < 32) {
        const padded = new Uint8Array(32);
        padded.set(bytes, 32 - bytes.length);
        bytes = padded;
      }
      finalAddress = u8aToHex(bytes);
    } else {
      finalAddress = u8aToHex(decodeAddress(walletAddress));
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  try {
    const bounty = await queryOne(`SELECT reward_amount FROM public.agent_bounties WHERE id = $1`, [id]);
    if (!bounty) return res.status(404).json({ error: 'Bounty not found' });

    // Check if this wallet already claimed this specific bounty
    const existing = await queryOne(
      `SELECT id FROM public.bounty_claims WHERE bounty_id = $1 AND claimer = $2`,
      [id, finalAddress]
    );
    if (existing) {
      return res.status(409).json({ error: 'Already claimed by this wallet' });
    }

    await query(`INSERT INTO public.bounty_claims (bounty_id, claimer) VALUES ($1, $2)`, [id, finalAddress]);
    
    // Create the stream (capped at 2.0 gVARA per bounty claim within the 20% Treasury budget)
    const totalVara = Math.min(parseFloat(bounty.reward_amount) || 2.0, 2.0);
    const durationSeconds = 3600; // Stream over 1 hour
    const ratePerSec = totalVara / durationSeconds;
    const tokenId = '0xf5e9cb1d1e46b0cda6578dd1684b30f281a45dfaa390e4945b7bfc8ab3e27f3d';

    const { blockHash } = await createTreasuryStream(finalAddress, tokenId, ratePerSec, durationSeconds);
    
    // NOTE: We intentionally do NOT update agent_bounties status to 'claimed'
    // so the bounty remains open and claimable by all other wallets.

    // Manually insert the stream into the DB so the UI updates immediately.
    const streamId = Math.floor(Math.random() * 1000000).toString();
    await query(
      `INSERT INTO public.streams (stream_id, recipient, rate_per_sec, duration, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        streamId, 
        finalAddress, 
        ratePerSec, 
        durationSeconds, 
        'active'
      ]
    );

    res.json({ success: true, message: 'Claim initiated', blockHash });
  } catch (error) {
    console.error('[earn API claim]', error);
    // Handle duplicate claim gracefully
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Already claimed by this wallet' });
    }
    res.status(500).json({ error: 'Failed to initiate claim' });
  }
});

export default router;
