import { query } from './db.mjs';
import { processContributionPayout } from './credit-accounting.service.mjs';

/**
 * Handles incoming GitHub Pull Request webhooks
 * Expected payload: pull_request from github webhook.
 */
export async function handleGitHubWebhook(payload) {
  if (payload.action !== 'closed' || !payload.pull_request.merged) {
    return { status: 'ignored', reason: 'PR not merged' };
  }

  const pr = payload.pull_request;
  const repoName = payload.repository.full_name;
  const prUrl = pr.html_url;
  
  // Try to extract user's wallet address from PR body or title
  // Example: "Resolves #42 | Wallet: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  const walletMatch = pr.body?.match(/Wallet:\s*([a-zA-Z0-9]+)/i);
  if (!walletMatch) {
    return { status: 'failed', reason: 'No wallet address found in PR body' };
  }
  const userId = walletMatch[1];

  // Fetch the PR diff (in real app, we fetch from pr.diff_url using fetch with auth)
  const diffUrl = pr.diff_url;
  let diffContent = "Mock diff for evaluation"; 
  try {
     const response = await fetch(diffUrl, {
         headers: { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }
     });
     if (response.ok) diffContent = await response.text();
  } catch (e) {
     console.warn('[webhook] Failed to fetch actual diff, using mock');
  }

  const evaluation = await evaluateContribution(diffContent);

  // Insert contribution to db
  await query(
    `INSERT INTO public.oss_contributions (user_id, github_pr_url, repo_name, quality_score, status)
     VALUES ($1, $2, $3, $4, 'evaluated')`,
    [userId, prUrl, repoName, evaluation.score]
  );

  // Trigger accounting to payout stream
  if (evaluation.score > 0.5) {
    await processContributionPayout(userId, evaluation.score);
    return { status: 'success', score: evaluation.score, payoutTriggered: true };
  }

  return { status: 'success', score: evaluation.score, payoutTriggered: false };
}

// Helper: call Virtuals Compute API for PR evaluation
async function evaluateContribution(diffText) {
  try {
    const apiKey = process.env.VIRTUALS_API_KEY;
    if (!apiKey) {
      console.warn('[evaluator] Missing Virtuals API key. Returning 0 score.');
      return { score: 0 };
    }

    const systemPrompt = `You are an AI that evaluates code contributions. Output JSON with a 'score' between 0.0 and 1.0.`;
    const userPrompt = `Evaluate this PR diff and assign a quality score:\n\n${diffText.slice(0, 5000)}`;

    const vResponse = await fetch('https://compute.virtuals.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!vResponse.ok) {
      throw new Error(`Virtuals Compute API returned ${vResponse.status}`);
    }

    const data = await vResponse.json();
    const replyText = data?.choices?.[0]?.message?.content || '';
    // Attempt to extract JSON from reply
    const jsonMatch = replyText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0 };
    return { score: result.score || 0 };
  } catch (err) {
    console.error('[evaluator] Virtuals Compute API error:', err);
    return { score: 0 };
  }
}
