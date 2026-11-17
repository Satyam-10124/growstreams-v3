import { query, queryOne } from './db.mjs';

/**
 * Tracks the tokens used by a user in the AI Learn session and converts it to credits.
 */
export async function trackSessionUsage(userId, promptTokens, completionTokens) {
  const creditsEarned = (promptTokens * 0.0001) + (completionTokens * 0.0002);
  
  // Find active session for user or create one
  let session = await queryOne(
    `SELECT id FROM public.agent_sessions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  if (!session) {
    const res = await query(
      `INSERT INTO public.agent_sessions (user_id, prompt_tokens, completion_tokens, credits_earned)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [userId, promptTokens, completionTokens, creditsEarned]
    );
    session = res.rows[0];
  } else {
    await query(
      `UPDATE public.agent_sessions 
       SET prompt_tokens = prompt_tokens + $1, 
           completion_tokens = completion_tokens + $2, 
           credits_earned = credits_earned + $3,
           updated_at = NOW()
       WHERE id = $4`,
      [promptTokens, completionTokens, creditsEarned, session.id]
    );
  }

  return { sessionId: session.id, creditsEarned };
}

export async function endSession(sessionId) {
  await query(
    `UPDATE public.agent_sessions SET status = 'completed', updated_at = NOW() WHERE id = $1`,
    [sessionId]
  );
}
