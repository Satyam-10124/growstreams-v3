const PR_SCORING_PROMPT = `You are a code review AI for the GrowStreams open-source project.
You score pull requests on a scale of 0 to 100 based on five factors.

SCORING RUBRIC:
- correctness (0-30): Does the code correctly fix the stated issue? Are there bugs?
- testCoverage (0-25): Are new or updated tests included? Do they cover edge cases?
- codeQuality (0-20): Is the code readable, well-structured, and consistent with the codebase?
- issueRelevance (0-15): Does the PR address what the linked issue asked for?
- completeness (0-10): Are docs updated? Edge cases handled? Nothing left half-done?

ANTI-GAMING RULES:
- Score below 70 if the PR is trivially small (fewer than 5 meaningful lines changed).
- Score below 70 if the code appears to be copied from another source without adaptation.
- Score below 70 if the PR does not meaningfully address the issue.
- Score 0 if the PR is clearly spam or auto-generated filler.

You MUST respond with valid JSON only. No markdown, no extra text.

JSON format:
{
  "score": <number 0-100>,
  "factors": {
    "correctness": <number 0-30>,
    "testCoverage": <number 0-25>,
    "codeQuality": <number 0-20>,
    "issueRelevance": <number 0-15>,
    "completeness": <number 0-10>
  },
  "feedback": "<2-3 sentence summary of strengths and areas for improvement>"
}`;

/**
 * Score a pull request using LLM.
 * @param {string} diff - The PR diff content
 * @param {string} issueBody - The linked issue body (or empty string)
 * @param {string} ciStatus - CI check status summary (or empty string)
 * @returns {{ score: number, factors: object, feedback: string }}
 */
export async function scorePR(diff, issueBody, ciStatus) {
  // Truncate diff to ~6000 tokens (~24000 chars)
  const maxDiffChars = 24000;
  const truncatedDiff = diff.length > maxDiffChars
    ? diff.slice(0, maxDiffChars) + '\n\n... [diff truncated]'
    : diff;

  const userMessage = [
    '## Pull Request Diff',
    '```',
    truncatedDiff,
    '```',
    '',
    issueBody ? `## Linked Issue\n${issueBody}` : '## Linked Issue\nNo linked issue found.',
    '',
    ciStatus ? `## CI Status\n${ciStatus}` : '## CI Status\nNo CI data available.',
  ].join('\n');

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const apiKey = process.env.VIRTUALS_API_KEY;
      const agentId = process.env.VIRTUALS_AGENT_ID;

      if (!apiKey || !agentId) {
        throw new Error('[llm] Missing Virtuals API credentials');
      }

      const prompt = PR_SCORING_PROMPT + '\n\n' + userMessage;

const response = await fetch('https://compute.virtuals.io/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    messages: [
      { role: 'system', content: PR_SCORING_PROMPT },
      { role: 'user', content: userMessage },
    ],
  }),
});

      if (!response.ok) throw new Error(`Virtuals API returned ${response.status}`);
      const data = await response.json();
      const replyText = data.text || data.response || "{}";
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      const content = jsonMatch ? jsonMatch[0] : "{}";

      if (!content || content === "{}") throw new Error('Empty LLM response');

      const parsed = JSON.parse(content);

      // Clamp score to 0-100
      parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

      // Validate factors exist
      if (!parsed.factors) {
        parsed.factors = { correctness: 0, testCoverage: 0, codeQuality: 0, issueRelevance: 0, completeness: 0 };
      }
      if (!parsed.feedback) {
        parsed.feedback = 'No feedback provided.';
      }

      console.log(`[llm] PR scored: ${parsed.score}/100 (attempt: ${attempt + 1})`);
      return parsed;

    } catch (err) {
      lastError = err;
      console.error(`[llm] Attempt ${attempt + 1} failed: ${err.message}`);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.error(`[llm] All ${maxRetries + 1} attempts failed. Returning fallback score.`);
  return {
    score: 0,
    factors: { correctness: 0, testCoverage: 0, codeQuality: 0, issueRelevance: 0, completeness: 0 },
    feedback: `Scoring temporarily unavailable: ${lastError?.message || 'Unknown error'}`,
  };
}

// ---------------------------------------------------------------------------
// CONTENT SCORING (X / Twitter posts)
// ---------------------------------------------------------------------------

const CONTENT_SCORING_PROMPT = `You are a content review AI for the GrowStreams open-source project.
You score social media posts about GrowStreams on a scale of 0 to 100 based on five factors.

GrowStreams is a money streaming infrastructure for Vara Network (Polkadot ecosystem).
Good content explains the technology, shares tutorials, provides analysis, or creates educational threads.

SCORING RUBRIC:
- quality (0-30): Is the content well-written, clear, and engaging?
- relevance (0-15): Does it meaningfully discuss GrowStreams, Vara, or streaming payments?
- originality (0-10): Is this original insight, or generic/copied content?
- educationalValue (0-20): Does it teach something useful about the project or ecosystem?
- engagement (0-25): Is the content structured to drive meaningful discussion and sharing?

CONTENT TYPE DETECTION:
Classify the content as one of: thread, tutorial, explainer, video, general

ANTI-GAMING RULES:
- Score below 70 if the content appears AI-generated without meaningful human insight.
- Score below 70 if it is a low-effort tag/mention with no substance.
- Score below 70 if it is copied from other posts or documentation without adaptation.
- Score 0 if it is clearly spam.

You MUST respond with valid JSON only. No markdown, no extra text.

JSON format:
{
  "score": <number 0-100>,
  "factors": {
    "quality": <number 0-30>,
    "relevance": <number 0-15>,
    "originality": <number 0-10>,
    "educationalValue": <number 0-20>,
    "engagement": <number 0-25>
  },
  "feedback": "<2-3 sentence summary of strengths and areas for improvement>",
  "contentType": "<thread|tutorial|explainer|video|general>"
}`;

/**
 * Score social media content using LLM.
 * @param {string} text - The tweet/thread text
 * @param {boolean} isThread - Whether it is a thread (multiple tweets)
 * @param {number} threadLength - Number of tweets in thread
 * @param {boolean} hasMedia - Whether the post includes images/video
 * @param {object} engagementData - { likes, retweets, replies }
 * @param {number} followerCount - Author's follower count
 * @returns {{ score: number, factors: object, feedback: string, contentType: string }}
 */
export async function scoreContent(text, isThread, threadLength, hasMedia, engagementData, followerCount) {
  const maxTextChars = 8000;
  const truncatedText = text.length > maxTextChars
    ? text.slice(0, maxTextChars) + '\n\n... [text truncated]'
    : text;

  const userMessage = [
    '## Post Content',
    truncatedText,
    '',
    `## Metadata`,
    `- Type: ${isThread ? `Thread (${threadLength} tweets)` : 'Single tweet'}`,
    `- Has media: ${hasMedia ? 'Yes' : 'No'}`,
    `- Follower count: ${followerCount}`,
    '',
    `## Engagement`,
    `- Likes: ${engagementData?.likes || 0}`,
    `- Retweets: ${engagementData?.retweets || 0}`,
    `- Replies: ${engagementData?.replies || 0}`,
  ].join('\n');

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const apiKey = process.env.VIRTUALS_API_KEY;
      const agentId = process.env.VIRTUALS_AGENT_ID;

      if (!apiKey || !agentId) {
        throw new Error('[llm] Missing Virtuals API credentials');
      }

      const prompt = CONTENT_SCORING_PROMPT + '\n\n' + userMessage;

      const response = await fetch(`https://api.virtuals.io/api/v1/agents/${agentId}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error(`Virtuals API returned ${response.status}`);
      const data = await response.json();
      const replyText = data.text || data.response || "{}";
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      const content = jsonMatch ? jsonMatch[0] : "{}";

      if (!content || content === "{}") throw new Error('Empty LLM response');

      const parsed = JSON.parse(content);

      // Clamp score to 0-100
      parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

      // Validate factors exist
      if (!parsed.factors) {
        parsed.factors = { quality: 0, relevance: 0, originality: 0, educationalValue: 0, engagement: 0 };
      }
      if (!parsed.feedback) {
        parsed.feedback = 'No feedback provided.';
      }
      if (!parsed.contentType) {
        parsed.contentType = 'general';
      }

      console.log(`[llm] Content scored: ${parsed.score}/100 (type: ${parsed.contentType}, attempt: ${attempt + 1})`);
      return parsed;

    } catch (err) {
      lastError = err;
      console.error(`[llm] Content scoring attempt ${attempt + 1} failed: ${err.message}`);

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  console.error(`[llm] All ${maxRetries + 1} content scoring attempts failed. Returning fallback.`);
  return {
    score: 0,
    factors: { quality: 0, relevance: 0, originality: 0, educationalValue: 0, engagement: 0 },
    feedback: `Scoring temporarily unavailable: ${lastError?.message || 'Unknown error'}`,
    contentType: 'general',
  };
}
