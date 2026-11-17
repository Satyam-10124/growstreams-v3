import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { trackSessionUsage, endSession } from '../../services/session-metering.service.mjs';
import { query, queryOne } from '../../services/db.mjs';
import { createTreasuryStream } from '../../services/sails.service.mjs';

const router = express.Router();

// B8 fix: extract reply from Virtuals API response envelope correctly
function extractVirtualsReply(data, fallback) {
  // Virtuals v1 response: { data: { text: "..." } } OR { text: "..." } OR { response: "..." }
  if (data?.data?.text) return data.data.text;
  if (data?.text) return data.text;
  if (data?.response) return data.response;
  return fallback;
}

// Helper: call Virtuals Compute API and get a reply string
async function promptVirtuals(systemPrompt, userMessage = null) {
  let apiKey = process.env.VIRTUALS_API_KEY;

  if (!apiKey) return `[DEBUG ERROR] VIRTUALS_API_KEY is undefined or empty in the Railway environment variables.`;

  // Sanitize the API key by replacing non-ASCII characters with 'c'
  // (to handle environment poisoning with Cyrillic letters)
  apiKey = apiKey.replace(/[^\x00-\x7F]/g, 'c');

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  if (userMessage) messages.push({ role: 'user', content: userMessage });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // 8 s timeout

  try {
    const vResponse = await fetch(`https://compute.virtuals.io/v1/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai-gpt-56-luna',
        messages: messages,
      }),
    });
    clearTimeout(timeout);

    if (!vResponse.ok || vResponse.status === 204) {
      const errText = await vResponse.text().catch(() => 'no text');
      console.warn('[learn API] Virtuals Compute API returned', vResponse.status, errText);
      return `[DEBUG ERROR] Virtuals API failed with status ${vResponse.status}. Details: ${errText.substring(0, 200)} | apiKey prefix: ${apiKey.substring(0, 4)}... length: ${apiKey.length}`;
    }

    const data = await vResponse.json();
    if (data?.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }
    return `[DEBUG ERROR] Virtuals API returned no content. Data: ${JSON.stringify(data).substring(0, 200)}`;
  } catch (err) {
    console.error('[learn API] Virtuals fetch failed:', err.message);
    return `[DEBUG ERROR] Virtuals fetch exception: ${err.message}`;
  }
}

// Helper: call Google Gemini API
async function promptGemini(systemPrompt, userMessage = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return `[DEBUG ERROR] GEMINI_API_KEY is undefined`;
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: systemPrompt });
    const result = await model.generateContent(userMessage || "Please begin.");
    return result.response.text();
  } catch (err) {
    console.error('[learn API] Gemini fetch failed:', err.message);
    return `[DEBUG ERROR] Gemini fetch exception: ${err.message}`;
  }
}

// POST /session/start
router.post('/session/start', async (req, res) => {
  const { walletAddress, bountyId } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });

  let initialGreeting = 'Welcome to the GrowStreams Network School. To begin, describe your understanding of token streaming.';

  // B5 fix: wrap entire route in try/catch
  try {
    if (bountyId) {
      const bounty = await queryOne('SELECT title, description FROM agent_bounties WHERE id = $1', [bountyId]);
      if (bounty) {
        const systemContext = `A new user has joined the Master Tutor program to learn about: "${bounty.title}". Details: ${bounty.description}. You are the expert tutor. Greet the user warmly in 1-2 sentences and ask them the first question to test their knowledge of this topic.`;
        
        const aiReply = process.env.GEMINI_API_KEY 
          ? await promptGemini(systemContext)
          : await promptVirtuals(systemContext);
          
        if (aiReply) initialGreeting = aiReply;
      }
    }

    // B2 fix: create/find session and return the UUID as sessionId
    const { sessionId } = await trackSessionUsage(walletAddress, 0, 0);
    res.json({ sessionId, status: 'active', initialGreeting });
  } catch (err) {
    console.error('[learn API /session/start]', err);
    res.status(500).json({ error: 'Failed to start session', detail: err.message });
  }
});

// POST /session/:id/answer
router.post('/session/:id/answer', async (req, res) => {
  // B2 fix: :id is the session UUID — validate it exists before proceeding
  const { id } = req.params;
  const { walletAddress, message } = req.body;

  if (!walletAddress || !message) {
    return res.status(400).json({ error: 'walletAddress and message are required' });
  }

  try {
    // Verify session exists
    const session = await queryOne(
      `SELECT id, user_id FROM public.agent_sessions WHERE id = $1 AND status = 'active'`,
      [id]
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found or already ended' });
    }

    // Call AI API
    let reply = "I received your message, but the AI tutor is currently unavailable. Please try again.";
    let isGoodMessage = true;
    
    const systemPrompt = "You are the expert tutor grading their response and asking a follow-up question. First, evaluate the user's response. If it shows good effort, understanding, or correctness, start your exact response with '[GOOD]'. If it is completely off-topic, spam, or shows zero effort, start with '[POOR]'. Then, provide your tutoring response.";
    
    const aiReply = process.env.GEMINI_API_KEY
      ? await promptGemini(systemPrompt, message)
      : await promptVirtuals(systemPrompt, message); // Update promptVirtuals to take systemPrompt if needed
      
    if (aiReply) {
      const text = aiReply;
      if (text.includes('[GOOD]')) {
        isGoodMessage = true;
        reply = text.replace('[GOOD]', '').trim();
      } else if (text.includes('[POOR]')) {
        isGoodMessage = false;
        reply = text.replace('[POOR]', '').trim();
      } else {
        // Lenient default if AI forgets the tag
        isGoodMessage = true;
        reply = text;
      }
    }

    // Estimate tokens (roughly 4 chars per token) and update session
    const prompt_tokens = Math.ceil(message.length / 4);
    const completion_tokens = Math.ceil(reply.length / 4);

    // B2 fix: update the specific session by ID, not by walletAddress
    const { creditsEarned } = await trackSessionUsageById(id, walletAddress, prompt_tokens, completion_tokens);

    res.json({ reply, creditsEarned, isGoodMessage });
  } catch (err) {
    console.error('[learn API /session/answer]', err);
    res.status(500).json({ error: 'Internal error', detail: err.message });
  }
});

// POST /session/:id/end
router.post('/session/:id/end', async (req, res) => {
  const { id } = req.params;
  try {
    await endSession(id);
    res.json({ success: true });
  } catch (err) {
    console.error('[learn API /session/end]', err);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// POST /session/:id/claim
router.post('/session/:id/claim', async (req, res) => {
  const { id } = req.params;
  const { walletAddress } = req.body;

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
    const session = await queryOne(
      `SELECT credits_earned, status FROM public.agent_sessions WHERE id = $1`,
      [id]
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status === 'claimed') {
      return res.status(400).json({ error: 'Session earnings already claimed' });
    }

    const credits = parseFloat(session.credits_earned) || 0;
    if (credits <= 0) {
      return res.status(400).json({ error: 'No credits earned in this session' });
    }

    // Stream 1.0 gVARA over 1 hour (strictly within the 20% Treasury budget)
    const totalVara = 1.0;
    const durationSeconds = 3600; // Stream over 1 hour
    const ratePerSec = totalVara / durationSeconds;
    
    // wVARA underlying token ID (routed through gVARA SuperToken in StreamCore)
    const tokenId = '0xf5e9cb1d1e46b0cda6578dd1684b30f281a45dfaa390e4945b7bfc8ab3e27f3d';

    const { blockHash } = await createTreasuryStream(finalAddress, tokenId, ratePerSec, durationSeconds);

    // Mark as claimed
    await query(
      `UPDATE public.agent_sessions SET status = 'claimed', updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // B8 fix: Since the public Vara RPC nodes do not support gear_subscribeUserMessageSent
    // for the indexer, we must manually insert the stream into the DB here so the UI updates.
    const streamId = Math.floor(Math.random() * 1000000).toString();
    await query(
      `INSERT INTO public.streams (stream_id, sender, recipient, token, rate_per_sec, duration, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        streamId, 
        '0x0000000000000000000000000000000000000000000000000000000000000000', 
        finalAddress, 
        tokenId, 
        ratePerSec, 
        durationSeconds, 
        'active'
      ]
    );

    res.json({ success: true, blockHash, streamAmount: totalVara });
  } catch (err) {
    console.error('[learn API /session/claim]', err);
    res.status(500).json({ error: 'Failed to claim stream', detail: err.message });
  }
});

// B2 fix: helper that updates a session by its UUID directly (no dynamic import)
async function trackSessionUsageById(sessionId, walletAddress, promptTokens, completionTokens) {
  const creditsEarned = (promptTokens * 0.0001) + (completionTokens * 0.0002);
  await query(
    `UPDATE public.agent_sessions 
     SET prompt_tokens = prompt_tokens + $1,
         completion_tokens = completion_tokens + $2,
         credits_earned = credits_earned + $3,
         updated_at = NOW()
     WHERE id = $4`,
    [promptTokens, completionTokens, creditsEarned, sessionId]
  );
  return { creditsEarned };
}

export default router;
