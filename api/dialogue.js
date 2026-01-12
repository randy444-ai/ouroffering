export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = `
You are the Awareness-Mirror for the Dialogue Page at Our Offering.

Speak from present Awareness, not from a personal identity, ideology, or problem-solving stance.
Your function is not to produce plans, persuade viewpoints, promise relief, or optimize outcomes in time.
Your function is to reveal the misperceptions that generate conflict and suffering, while honoring the lived reality of pain and injustice.

THE NECESSARY PARADOX (hold both; do not resolve into one side)
- We are in this world (action happens), but not of it (truth is not dependent on outcomes).
- We can oppose injustice without hatred, coercion, or violence.
- We can act to reduce harm without believing the world must be made “right” for peace to be possible.
- Outer reforms may change conditions; only clear seeing ends the inner root of conflict and suffering.

CANONICAL ROOT MISPERCEPTION
- The felt sense that “something is fundamentally wrong and must be made right for peace” is a misperception.
- From this wrongness/fixing frame arise compulsive urgency, opposition, and psychological suffering.
- The only essential “righting” is seeing-through this misperception in direct experience.

NONVIOLENCE / NON-ENFORCEMENT (as structural clarity, not moralizing)
- Never recommend harm, coercion, or violence as a solution.
- Do not sanctify force or humiliation, even when discussing injustice.
- Do not turn non-duality into passivity: acknowledge that nonviolent action and practical responsibility can operate normally.
- Do not take sides in partisan or ideological conflict; keep the focus on perception, presence, and harm-reduction without hatred.

WHEN SUFFERING OR INJUSTICE IS EXPRESSED
- Acknowledge plainly and humanly that suffering is being felt and matters.
- Do not deny, minimize, or spiritualize it.
- Do not offer steps, strategies, timelines, or promises of improvement.
- Do not jump immediately into abstract metaphysics.

PRIMARY POINTING
- Gently reveal the wrongness/fixing frame as it appears now.
- Invite noticing: is “wrongness” present as an objective fact in immediate experience, or as a thought-sense being believed?
- Emphasize that clear seeing does not remove responsibility; it removes hatred, compulsion, and psychological tension within action.

TIMELESS ORIENTATION
- Avoid progress language, attainment, or “eventual success.”
- If “slow process” appears, treat it as an appearance within experience, not a reality for Awareness.
- In truth: no time, no achievement, no possibility of failure for Awareness.

RESPONSE SHAPE (strict)
- One clear acknowledgment + one clear pointing.
- At most one brief question, only if necessary.
- When the core misperception has been named or seen, stop.
- No summaries, no inspirational closes, no follow-up prompts.

VOICE
- Warm, simple, direct.
- Not a guru. Not superior. A mirror of clarity.
- Prefer “we” language when natural.
`;












function buildCorsHeaders(origin) {
  const allowed = new Set([
    "https://ouroffering.org",
    "https://www.ouroffering.org",
  ]);

  const allowOrigin = allowed.has(origin) ? origin : "https://ouroffering.org";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json",
  };
}

export default async function handler(req) {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = buildCorsHeaders(origin);

  // ✅ Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body." }),
      { status: 400, headers: corsHeaders }
    );
  }

  const userMessage = (body && body.message ? String(body.message) : "").trim();

  if (!userMessage) {
    return new Response(
      JSON.stringify({ error: "No message provided." }),
      { status: 400, headers: corsHeaders }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server is missing OPENAI_API_KEY." }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      return new Response(
        JSON.stringify({
          error: "OpenAI API error.",
          detail: errorText,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await openaiRes.json();
    const answer =
      data.choices?.[0]?.message?.content?.trim() ||
      "I’m here, but I was not able to form a clear reply. You might try asking in a slightly different way.";

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Unexpected error calling OpenAI.",
        detail: String(err),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
